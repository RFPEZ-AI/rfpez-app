-- =============================
-- DROP LEGACY FORM_ARTIFACTS TABLE
-- =============================
-- 
-- This migration safely removes the legacy form_artifacts table
-- after data has been migrated to the consolidated artifacts table.
--
-- Prerequisites:
-- 1. Schema consolidation migration must be completed first
-- 2. All form_artifacts data should be migrated to artifacts table
-- 3. Application code should be updated to use artifacts table
--
-- Date: 2025-09-17
-- Purpose: Clean up legacy table after schema consolidation

-- Step 1: Validate that migration is complete
DO $$
DECLARE
  form_artifacts_count INTEGER;
  artifacts_form_count INTEGER;
BEGIN
  -- Check if form_artifacts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    -- Count records in legacy table
    SELECT COUNT(*) INTO form_artifacts_count FROM form_artifacts WHERE status = 'active';
    
    -- Count form artifacts in new table
    SELECT COUNT(*) INTO artifacts_form_count FROM artifacts WHERE type = 'form';
    
    RAISE NOTICE 'Legacy form_artifacts table has % active records', form_artifacts_count;
    RAISE NOTICE 'Consolidated artifacts table has % form records', artifacts_form_count;
    
    -- Validation check
    IF form_artifacts_count > 0 AND artifacts_form_count = 0 THEN
      RAISE EXCEPTION 'SAFETY CHECK FAILED: form_artifacts table has active records but artifacts table has no form records. Migration may not be complete.';
    END IF;
    
    IF form_artifacts_count > artifacts_form_count THEN
      RAISE WARNING 'Legacy table has more records (%) than new table (%). Consider running migration validation first.', form_artifacts_count, artifacts_form_count;
    END IF;
    
    RAISE NOTICE 'Validation passed. Safe to proceed with dropping legacy table.';
    
  ELSE
    RAISE NOTICE 'form_artifacts table does not exist. Nothing to drop.';
  END IF;
END $$;

-- Step 2: Create backup table (optional safety measure)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    -- Create backup table with timestamp
    EXECUTE format('CREATE TABLE form_artifacts_backup_%s AS SELECT * FROM form_artifacts', 
                   to_char(NOW(), 'YYYYMMDD_HH24MISS'));
    
    RAISE NOTICE 'Created backup table: form_artifacts_backup_%', to_char(NOW(), 'YYYYMMDD_HH24MISS');
    
  END IF;
END $$;

-- Step 3: Drop constraints and indexes first
DO $$
DECLARE
  constraint_name TEXT;
  index_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    -- Drop foreign key constraints pointing to form_artifacts
    FOR constraint_name IN 
      SELECT conname 
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'form_artifacts' AND c.contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE form_artifacts DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
    
    -- Drop indexes on form_artifacts table
    FOR index_name IN
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'form_artifacts'
      AND indexname NOT LIKE '%_pkey'  -- Keep primary key for last
    LOOP
      EXECUTE format('DROP INDEX IF EXISTS %I', index_name);
      RAISE NOTICE 'Dropped index: %', index_name;
    END LOOP;
    
  END IF;
END $$;

-- Step 4: Drop any views that depend on form_artifacts
DO $$
DECLARE
  view_name TEXT;
BEGIN
  -- Check for views that reference form_artifacts
  FOR view_name IN
    SELECT viewname
    FROM pg_views
    WHERE definition ILIKE '%form_artifacts%'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', view_name);
    RAISE NOTICE 'Dropped view: %', view_name;
  END LOOP;
END $$;

-- Step 5: Drop RLS policies
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    -- Drop all RLS policies on form_artifacts
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'form_artifacts'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON form_artifacts', policy_name);
      RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
    
  END IF;
END $$;

-- Step 6: Finally drop the table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    DROP TABLE form_artifacts CASCADE;
    RAISE NOTICE '✅ Successfully dropped form_artifacts table and all dependencies';
    
  ELSE
    RAISE NOTICE 'form_artifacts table does not exist. Nothing to drop.';
  END IF;
END $$;

-- Step 7: Verification
DO $$
BEGIN
  -- Confirm table is gone
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    RAISE NOTICE '✅ VERIFICATION PASSED: form_artifacts table successfully removed';
  ELSE
    RAISE WARNING 'VERIFICATION FAILED: form_artifacts table still exists';
  END IF;
  
  -- Check artifacts table is still functional
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts') THEN
    RAISE NOTICE '✅ VERIFICATION PASSED: artifacts table still exists';
  ELSE
    RAISE WARNING 'VERIFICATION FAILED: artifacts table does not exist';
  END IF;
END $$;

-- Step 8: Update application schema documentation
COMMENT ON TABLE artifacts IS 'Consolidated artifacts table - stores all artifact types including forms (migrated from legacy form_artifacts table)';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 MIGRATION COMPLETE: Legacy form_artifacts table has been safely dropped';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '   1. Update application code to remove any remaining form_artifacts references';
  RAISE NOTICE '   2. Test all form-related functionality';
  RAISE NOTICE '   3. Remove backup table (form_artifacts_backup_*) after verification';
END $$;
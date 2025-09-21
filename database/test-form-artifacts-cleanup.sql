-- =============================
-- TEST SCRIPT: Verify form_artifacts Table Cleanup
-- =============================
--
-- This script tests whether it's safe to drop the legacy form_artifacts table
-- Run this BEFORE executing the drop migration to ensure no data loss
--
-- Date: 2025-09-17
-- Purpose: Pre-migration validation for form_artifacts table cleanup

-- Test 1: Check if form_artifacts table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    RAISE NOTICE '✅ TEST 1 PASSED: form_artifacts table exists and can be dropped';
  ELSE
    RAISE NOTICE '⚠️  TEST 1 SKIPPED: form_artifacts table does not exist';
  END IF;
END $$;

-- Test 2: Verify data migration completeness
DO $$
DECLARE
  legacy_count INTEGER := 0;
  consolidated_count INTEGER := 0;
BEGIN
  -- Count legacy table records (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    SELECT COUNT(*) INTO legacy_count FROM form_artifacts WHERE status = 'active';
  END IF;
  
  -- Count consolidated table records
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts') THEN
    SELECT COUNT(*) INTO consolidated_count FROM artifacts WHERE type = 'form';
  END IF;
  
  RAISE NOTICE 'Legacy form_artifacts records: %', legacy_count;
  RAISE NOTICE 'Consolidated form artifacts: %', consolidated_count;
  
  IF legacy_count = 0 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: No active records in legacy table to migrate';
  ELSIF consolidated_count >= legacy_count THEN
    RAISE NOTICE '✅ TEST 2 PASSED: All legacy records appear to be migrated';
  ELSE
    RAISE WARNING '❌ TEST 2 FAILED: Legacy table has % records but consolidated table only has %', legacy_count, consolidated_count;
  END IF;
END $$;

-- Test 3: Check for foreign key dependencies
DO $$
DECLARE
  fk_count INTEGER := 0;
  fk_name TEXT;
BEGIN
  -- Check for foreign keys referencing form_artifacts
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'form_artifacts';
  
  IF fk_count = 0 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: No foreign key dependencies found';
  ELSE
    RAISE NOTICE '⚠️  TEST 3 WARNING: % foreign key dependencies found', fk_count;
    
    -- List the dependencies
    FOR fk_name IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'form_artifacts'
    LOOP
      RAISE NOTICE '   Dependency: %', fk_name;
    END LOOP;
  END IF;
END $$;

-- Test 4: Verify artifacts table functionality
DO $$
DECLARE
  test_id TEXT := 'test_' || extract(epoch from now())::bigint;
  inserted_count INTEGER;
BEGIN
  -- Test insert into artifacts table
  INSERT INTO artifacts (
    id, 
    user_id, 
    name, 
    type, 
    schema, 
    ui_schema, 
    default_values,
    status
  ) VALUES (
    test_id,
    (SELECT id FROM auth.users LIMIT 1), -- Use existing user if any
    'Test Form Artifact',
    'form',
    '{"type": "object", "properties": {"test": {"type": "string"}}}'::jsonb,
    '{}'::jsonb,
    '{"test": "value"}'::jsonb,
    'active'
  );
  
  -- Verify insert worked
  SELECT COUNT(*) INTO inserted_count FROM artifacts WHERE id = test_id;
  
  IF inserted_count = 1 THEN
    RAISE NOTICE '✅ TEST 4 PASSED: Can insert form artifacts into consolidated table';
    -- Clean up test record
    DELETE FROM artifacts WHERE id = test_id;
  ELSE
    RAISE WARNING '❌ TEST 4 FAILED: Could not insert test form artifact';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ TEST 4 FAILED: Error testing artifacts table: %', SQLERRM;
  -- Try to clean up even if there was an error
  DELETE FROM artifacts WHERE id = test_id;
END $$;

-- Test 5: Check RLS policies
DO $$
DECLARE
  policy_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'form_artifacts';
    
    RAISE NOTICE 'form_artifacts table has % RLS policies', policy_count;
    
    IF policy_count > 0 THEN
      RAISE NOTICE '⚠️  TEST 5 INFO: % RLS policies will be dropped with the table', policy_count;
    ELSE
      RAISE NOTICE '✅ TEST 5 PASSED: No RLS policies to clean up';
    END IF;
  ELSE
    RAISE NOTICE '✅ TEST 5 SKIPPED: No form_artifacts table to check';
  END IF;
END $$;

-- Test 6: Application compatibility check
DO $$
DECLARE
  claude_functions_ready BOOLEAN := FALSE;
BEGIN
  -- Check if all required columns exist in artifacts table for form operations
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artifacts' 
    AND column_name IN ('schema', 'ui_schema', 'default_values', 'submit_action')
    GROUP BY table_name
    HAVING COUNT(*) = 4
  ) THEN
    claude_functions_ready := TRUE;
  END IF;
  
  IF claude_functions_ready THEN
    RAISE NOTICE '✅ TEST 6 PASSED: artifacts table has all required columns for form operations';
  ELSE
    RAISE WARNING '❌ TEST 6 FAILED: artifacts table missing required columns for form operations';
  END IF;
END $$;

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRE-MIGRATION VALIDATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the test results above:';
  RAISE NOTICE '- All ✅ tests should pass for safe migration';
  RAISE NOTICE '- ⚠️  warnings indicate items to review';
  RAISE NOTICE '- ❌ failures indicate migration may not be safe';
  RAISE NOTICE '';
  RAISE NOTICE 'If all critical tests pass, run:';
  RAISE NOTICE '   database/drop-legacy-form-artifacts-table.sql';
END $$;
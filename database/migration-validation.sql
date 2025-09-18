-- Migration Testing and Validation Script
-- Run this BEFORE executing the main migration to verify readiness
-- Run this AFTER executing the main migration to verify success

-- =============================================================================
-- PRE-MIGRATION VALIDATION QUERIES
-- =============================================================================

-- 1. Count existing data in current schema
SELECT 'Current Schema Inventory' as status;
SELECT 
  'rfps' as table_name, 
  count(*) as record_count,
  count(CASE WHEN buyer_questionnaire IS NOT NULL THEN 1 END) as has_buyer_questionnaire,
  count(CASE WHEN buyer_questionnaire_response IS NOT NULL THEN 1 END) as has_questionnaire_response
FROM rfps;

SELECT 
  'form_artifacts' as table_name, 
  count(*) as record_count,
  count(DISTINCT user_id) as unique_users
FROM form_artifacts;

SELECT 
  'artifacts' as table_name, 
  count(*) as record_count,
  count(DISTINCT session_id) as unique_sessions
FROM artifacts;

-- 2. Check for data that will be migrated
SELECT 'Data Migration Candidates' as status;

-- RFPs with questionnaire data that needs migration
SELECT 
  'RFPs with questionnaire data' as category,
  count(*) as count
FROM rfps 
WHERE buyer_questionnaire IS NOT NULL 
   OR buyer_questionnaire_response IS NOT NULL;

-- Form artifacts that may need consolidation
SELECT 
  'Form artifacts to consolidate' as category,
  count(*) as count
FROM form_artifacts;

-- 3. Check for potential conflicts
SELECT 'Potential ID Conflicts' as status;

-- Check if any form_artifact IDs would conflict with existing artifact IDs
SELECT 
  'ID conflicts' as issue,
  count(*) as conflict_count
FROM form_artifacts fa
WHERE EXISTS (
  SELECT 1 FROM artifacts a WHERE a.id = fa.id
);

-- =============================================================================
-- POST-MIGRATION VALIDATION QUERIES  
-- =============================================================================

-- Uncomment these sections AFTER running the migration

/*
-- 4. Verify new schema exists
SELECT 'New Schema Verification' as status;

-- Check if new tables exist
SELECT 
  'rfp_artifacts table exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'rfp_artifacts'
  ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Check if artifacts table has new columns
SELECT 
  'artifacts.form_spec column exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artifacts' AND column_name = 'form_spec'
  ) THEN 'PASS' ELSE 'FAIL' END as result;

-- 5. Verify data migration
SELECT 'Data Migration Verification' as status;

-- Count migrated questionnaire artifacts
SELECT 
  'Migrated buyer questionnaires' as category,
  count(*) as count
FROM artifacts 
WHERE type = 'questionnaire' AND role = 'buyer';

-- Count RFP-artifact relationships
SELECT 
  'RFP-artifact relationships' as category,
  count(*) as count
FROM rfp_artifacts;

-- Verify questionnaire data integrity
SELECT 
  'RFPs with linked questionnaires' as category,
  count(DISTINCT ra.rfp_id) as count
FROM rfp_artifacts ra
JOIN artifacts a ON ra.artifact_id = a.id
WHERE a.type = 'questionnaire' AND ra.role = 'buyer';

-- 6. Verify backward compatibility
SELECT 'Backward Compatibility Check' as status;

-- Check that RFPs without new artifacts can still be accessed
SELECT 
  'RFPs without linked artifacts' as category,
  count(*) as count
FROM rfps r
WHERE NOT EXISTS (
  SELECT 1 FROM rfp_artifacts ra WHERE ra.rfp_id = r.id
);

-- 7. Data integrity checks
SELECT 'Data Integrity Verification' as status;

-- Verify no data loss in core RFP fields
SELECT 
  'RFPs with preserved data' as category,
  count(*) as count
FROM rfps 
WHERE name IS NOT NULL AND description IS NOT NULL;

-- Verify artifact submissions are preserved
SELECT 
  'Preserved artifact submissions' as category,
  count(*) as count
FROM artifact_submissions;

-- Check for orphaned relationships
SELECT 
  'Orphaned rfp_artifacts (should be 0)' as issue,
  count(*) as count
FROM rfp_artifacts ra
WHERE NOT EXISTS (SELECT 1 FROM rfps r WHERE r.id = ra.rfp_id)
   OR NOT EXISTS (SELECT 1 FROM artifacts a WHERE a.id = ra.artifact_id);
*/

-- =============================================================================
-- ROLLBACK VALIDATION (if needed)
-- =============================================================================

/*
-- Uncomment if you need to validate after rollback

-- 8. Verify rollback success
SELECT 'Rollback Verification' as status;

-- Check that original schema is restored
SELECT 
  'Original RFP columns restored' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'buyer_questionnaire'
  ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Verify original data is intact
SELECT 
  'Original questionnaire data restored' as category,
  count(*) as count
FROM rfps 
WHERE buyer_questionnaire IS NOT NULL;
*/

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

SELECT '=== MIGRATION READINESS SUMMARY ===' as report_section;
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM rfps) > 0 THEN '✅ RFPs table has data'
    ELSE '❌ RFPs table is empty'
  END as rfp_check;

SELECT 
  CASE 
    WHEN (SELECT count(*) FROM form_artifacts) > 0 THEN '✅ Form artifacts exist for migration'
    ELSE '⚠️ No form artifacts to migrate'
  END as form_artifacts_check;

SELECT 
  CASE 
    WHEN (SELECT count(*) FROM artifacts) >= 0 THEN '✅ Artifacts table accessible'
    ELSE '❌ Artifacts table has issues'
  END as artifacts_check;

SELECT '=== END REPORT ===' as report_section;
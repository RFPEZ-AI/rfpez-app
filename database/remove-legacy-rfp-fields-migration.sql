-- Migration: Remove Legacy RFP Fields
-- This migration removes the buyer_questionnaire, buyer_questionnaire_response, bid_form_questionaire,
-- suppliers, and agent_ids columns from the rfps table, as these are now handled through 
-- the rfp_artifacts junction table and other appropriate relationships.
-- 
-- Run Date: 2025-01-27
-- Prerequisite: Ensure all data has been migrated to the rfp_artifacts table approach

-- Step 1: Backup any existing data (Optional - for safety)
-- You may want to backup these columns before dropping them:
-- CREATE TABLE rfps_legacy_backup AS 
-- SELECT id, buyer_questionnaire, buyer_questionnaire_response, bid_form_questionaire, suppliers, agent_ids, proposal 
-- FROM rfps WHERE buyer_questionnaire IS NOT NULL OR buyer_questionnaire_response IS NOT NULL 
--    OR bid_form_questionaire IS NOT NULL OR suppliers IS NOT NULL OR agent_ids IS NOT NULL OR proposal IS NOT NULL;

-- Step 2: Remove the legacy columns from the rfps table
BEGIN;

-- Remove buyer_questionnaire column
ALTER TABLE rfps DROP COLUMN IF EXISTS buyer_questionnaire;
COMMENT ON TABLE rfps IS 'Updated: Removed buyer_questionnaire - now handled via rfp_artifacts table';

-- Remove buyer_questionnaire_response column  
ALTER TABLE rfps DROP COLUMN IF EXISTS buyer_questionnaire_response;
COMMENT ON TABLE rfps IS 'Updated: Removed buyer_questionnaire_response - now handled via artifact_submissions table';

-- Remove bid_form_questionaire column (note: there was a typo in the original column name)
ALTER TABLE rfps DROP COLUMN IF EXISTS bid_form_questionaire;
COMMENT ON TABLE rfps IS 'Updated: Removed bid_form_questionaire - now handled via rfp_artifacts table';

-- Remove suppliers column (array of supplier IDs - should be handled via separate relationships)
ALTER TABLE rfps DROP COLUMN IF EXISTS suppliers;
COMMENT ON TABLE rfps IS 'Updated: Never used'

-- Remove agent_ids column (array of agent IDs - should be handled via separate relationships)
ALTER TABLE rfps DROP COLUMN IF EXISTS agent_ids;
COMMENT ON TABLE rfps IS 'Updated: Removed agent_ids array - never used';

-- Remove proposal column if it still exists (should have been renamed to request previously)
ALTER TABLE rfps DROP COLUMN IF EXISTS proposal;
COMMENT ON TABLE rfps IS 'Updated: Removed proposal column - if proposal functionality is needed, use the request field or create artifacts';

-- Step 3: Verify the columns are removed
-- This query should return no rows if the migration was successful
DO $$
DECLARE
    legacy_columns INTEGER;
BEGIN
    SELECT COUNT(*) INTO legacy_columns
    FROM information_schema.columns 
    WHERE table_name = 'rfps' 
    AND column_name IN ('buyer_questionnaire', 'buyer_questionnaire_response', 'bid_form_questionaire', 'suppliers', 'agent_ids', 'proposal');
    
    IF legacy_columns > 0 THEN
        RAISE EXCEPTION 'Migration failed: Legacy columns still exist in rfps table';
    ELSE
        RAISE NOTICE 'Migration successful: All legacy columns removed from rfps table';
    END IF;
END $$;

-- Step 4: Ensure rfp_artifacts table is properly configured
-- Verify that the rfp_artifacts table exists and has the correct constraints
DO $$
BEGIN
    -- Check if rfp_artifacts table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfp_artifacts') THEN
        RAISE EXCEPTION 'rfp_artifacts table does not exist - migration cannot proceed';
    END IF;
    
    -- Check if the table has the expected columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfp_artifacts' 
        AND column_name IN ('rfp_id', 'artifact_id', 'artifact_role')
    ) THEN
        RAISE EXCEPTION 'rfp_artifacts table missing required columns';
    END IF;
    
    RAISE NOTICE 'rfp_artifacts table validation passed';
END $$;

COMMIT;

-- Step 5: Update any views or functions that may reference the old columns
-- (Add any additional cleanup here if needed)

-- Migration completed successfully
-- The rfps table now uses the rfp_artifacts junction table for all form and questionnaire associations
-- Supplier and agent relationships should be handled through appropriate junction tables instead of arrays
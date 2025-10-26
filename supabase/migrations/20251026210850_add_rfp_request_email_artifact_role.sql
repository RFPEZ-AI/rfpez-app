-- Add 'rfp_request_email' to the artifact_role constraint
-- This allows for a specific artifact role for RFP request emails to vendors
-- which enables upsert logic (only one request email per RFP)

-- Drop the existing constraint
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_new_artifact_role_check;

-- Recreate with the new value added
ALTER TABLE artifacts ADD CONSTRAINT artifacts_new_artifact_role_check 
CHECK (artifact_role IN (
  'buyer_questionnaire',
  'bid_form',
  'rfp_request_email',  -- NEW: Specific for RFP vendor request emails
  'request_document',
  'specification_document',
  'analysis_document',
  'report_document',
  'template'
));

-- Update existing Office Furniture request email (if exists)
UPDATE artifacts 
SET artifact_role = 'rfp_request_email'
WHERE artifact_role = 'request_document'
  AND type = 'document'
  AND name LIKE '%Request%Email%';

COMMENT ON CONSTRAINT artifacts_new_artifact_role_check ON artifacts IS 
'Artifact role must be one of the predefined types. rfp_request_email is specific for RFP vendor request emails (one per RFP).';

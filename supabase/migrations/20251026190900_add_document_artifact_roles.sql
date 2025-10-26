-- Add specification_document, analysis_document, and report_document to artifact_role constraint
-- This allows these document types to be created without mapping to request_document

-- Drop the existing constraint
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_new_artifact_role_check;

-- Add the new constraint with additional document types
ALTER TABLE artifacts ADD CONSTRAINT artifacts_new_artifact_role_check 
  CHECK (artifact_role = ANY (ARRAY[
    'buyer_questionnaire'::text, 
    'bid_form'::text, 
    'request_document'::text, 
    'specification_document'::text, 
    'analysis_document'::text, 
    'report_document'::text, 
    'template'::text
  ]));

-- Add index for the new artifact roles if needed
CREATE INDEX IF NOT EXISTS idx_artifacts_document_roles 
  ON artifacts(artifact_role) 
  WHERE artifact_role IN ('specification_document', 'analysis_document', 'report_document');

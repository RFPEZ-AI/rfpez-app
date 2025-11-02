-- Migration: Add vendor_selection artifact type and role
-- Purpose: Enable vendor selection as a special artifact with auto-save functionality
-- Created: 2025-11-02

-- Add vendor_selection to artifact type check constraint
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_new_type_check;
ALTER TABLE artifacts ADD CONSTRAINT artifacts_new_type_check 
  CHECK (type = ANY (ARRAY[
    'form'::text, 
    'document'::text, 
    'image'::text, 
    'pdf'::text, 
    'template'::text, 
    'vendor_selection'::text,  -- NEW: Special artifact type for vendor selection
    'other'::text
  ]));

-- Add vendor_selection_form to artifact role check constraint
ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_new_artifact_role_check;
ALTER TABLE artifacts ADD CONSTRAINT artifacts_new_artifact_role_check 
  CHECK (artifact_role = ANY (ARRAY[
    'buyer_questionnaire'::text, 
    'bid_form'::text, 
    'rfp_request_email'::text, 
    'request_document'::text, 
    'specification_document'::text, 
    'analysis_document'::text, 
    'report_document'::text, 
    'vendor_selection_form'::text,  -- NEW: Special role for vendor selection
    'template'::text
  ]));

-- Create index for vendor_selection artifacts for efficient querying
CREATE INDEX IF NOT EXISTS idx_artifacts_vendor_selection 
  ON artifacts(type, artifact_role, session_id) 
  WHERE type = 'vendor_selection' AND artifact_role = 'vendor_selection_form';

-- Add comment explaining vendor_selection artifact structure
COMMENT ON COLUMN artifacts.type IS 
  'Artifact type: form, document, image, pdf, template, vendor_selection, other. 
   vendor_selection is a special type for managing vendor selections with auto-save.';

COMMENT ON COLUMN artifacts.artifact_role IS 
  'Artifact role: buyer_questionnaire, bid_form, rfp_request_email, request_document, 
   specification_document, analysis_document, report_document, vendor_selection_form, template.
   vendor_selection_form is used exclusively for vendor selection artifacts (one per RFP).';

-- Add comment on schema column for vendor_selection format
COMMENT ON COLUMN artifacts.schema IS 
  'JSON Schema for forms/vendor_selection. 
   For vendor_selection artifacts, stores: 
   {
     "vendors": [
       {"id": "vendor-1", "name": "Vendor A", "selected": true, "selectedAt": "2025-11-02T10:30:00Z"},
       {"id": "vendor-2", "name": "Vendor B", "selected": false}
     ],
     "lastModified": "2025-11-02T10:30:00Z",
     "autoSaveEnabled": true
   }';

-- Add missing fields to rfps table for RFP request email and questionnaires
-- These fields are referenced in the TypeScript types but missing from the database

-- Add request field for generated RFP email content
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS request text;

-- Add buyer_questionnaire field for questionnaire structure
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS buyer_questionnaire jsonb;

-- Add buyer_questionnaire_response field for collected responses
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS buyer_questionnaire_response jsonb;

-- Add bid_form_questionaire field for bid submission form specification
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS bid_form_questionaire jsonb;

-- Add comments for documentation
COMMENT ON COLUMN rfps.request IS 'Generated request for proposal (RFP) email content to send to suppliers';
COMMENT ON COLUMN rfps.buyer_questionnaire IS 'Questionnaire structure for buyer requirements gathering';
COMMENT ON COLUMN rfps.buyer_questionnaire_response IS 'Collected buyer questionnaire responses';
COMMENT ON COLUMN rfps.bid_form_questionaire IS 'JSON Schema + RJSF form specification for bid submission';

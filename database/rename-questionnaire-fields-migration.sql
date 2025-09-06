-- Migration to rename proposal questionnaire fields to buyer questionnaire fields
-- This migration renames columns in the rfp table to better reflect their purpose

-- Start transaction
BEGIN;

-- Rename proposal_questionnaire to buyer_questionnaire
ALTER TABLE public.rfp 
RENAME COLUMN proposal_questionnaire TO buyer_questionnaire;

-- Rename proposal_questionnaire_response to buyer_questionnaire_response
ALTER TABLE public.rfp 
RENAME COLUMN proposal_questionnaire_response TO buyer_questionnaire_response;

-- Update column comments to reflect the new names
COMMENT ON COLUMN public.rfp.buyer_questionnaire IS 'Questionnaire structure for buyer requirements gathering';
COMMENT ON COLUMN public.rfp.buyer_questionnaire_response IS 'Collected buyer questionnaire responses';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('buyer_questionnaire', 'buyer_questionnaire_response')
ORDER BY column_name;

COMMIT;

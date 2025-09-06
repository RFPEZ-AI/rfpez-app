-- Migration: Add proposal and questionnaire fields to RFP table
-- This adds fields to support proposal generation and collection

-- Step 1: Add proposal field to store generated proposals
ALTER TABLE public.rfp ADD COLUMN IF NOT EXISTS proposal TEXT;

-- Step 2: Add buyer questionnaire field to store questionnaire structure
ALTER TABLE public.rfp ADD COLUMN IF NOT EXISTS buyer_questionnaire JSONB;

-- Step 3: Add buyer questionnaire response field to store collected responses
ALTER TABLE public.rfp ADD COLUMN IF NOT EXISTS buyer_questionnaire_response JSONB;

-- Step 4: Also need to update the bid table to use 'response' instead of 'document' 
-- to match the current TypeScript interface
ALTER TABLE public.bid RENAME COLUMN document TO response;

-- Step 5: Verify the changes
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('proposal', 'buyer_questionnaire', 'buyer_questionnaire_response')
ORDER BY column_name;

SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'bid' AND column_name = 'response'
ORDER BY column_name;

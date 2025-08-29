-- Remove document field from RFP table - Step by Step
-- Run each command separately in Supabase SQL Editor

-- Step 1: Remove the document column (this will also remove the NOT NULL constraint)
ALTER TABLE public.rfp DROP COLUMN IF EXISTS document;

-- Step 2: Verify the change
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name NOT IN ('id', 'created_at', 'updated_at')
ORDER BY column_name;

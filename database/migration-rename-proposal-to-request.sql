-- Migration: Rename proposal field to request in RFPs table
-- This migration renames the field to better reflect that it contains
-- a request for proposal (RFP) sent to suppliers, not a proposal from suppliers

-- Step 1: Rename proposal field to request
ALTER TABLE public.rfps 
RENAME COLUMN proposal TO request;

-- Step 2: Update the comment to reflect the new purpose
COMMENT ON COLUMN public.rfps.request IS 'Generated request for proposal (RFP) content to send to suppliers';

-- Verification query to check the migration
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'rfps' 
        AND column_name = 'request'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Migration completed successfully: proposal field renamed to request';
    ELSE
        RAISE EXCEPTION 'Migration failed: request field not found';
    END IF;
END $$;
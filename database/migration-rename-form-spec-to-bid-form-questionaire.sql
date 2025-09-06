-- Migration: Rename form_spec to bid_form_questionaire
-- This migration adds the bid_form_questionaire column to the rfps table

-- Add the new column
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS bid_form_questionaire JSONB;

-- If form_spec column exists (from previous state), copy data and drop it
-- Note: This assumes form_spec might exist in some environments
DO $$
BEGIN
    -- Check if form_spec column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rfps' AND column_name='form_spec') THEN
        -- Copy data from form_spec to bid_form_questionaire
        UPDATE rfps SET bid_form_questionaire = form_spec WHERE form_spec IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE rfps DROP COLUMN form_spec;
    END IF;
END $$;

-- Add comment for the new column
COMMENT ON COLUMN rfps.bid_form_questionaire IS 'JSON Schema + RJSF form specification for bid submission';

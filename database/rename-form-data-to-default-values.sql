-- Migration: Rename form_data to default_values in artifacts table
-- Date: 2025-09-20
-- Description: Renames form_data column to default_values to better reflect its purpose of storing default form values

BEGIN;

-- Step 1: Rename the column
ALTER TABLE public.artifacts 
RENAME COLUMN form_data TO default_values;

-- Step 2: Update any comments or documentation
COMMENT ON COLUMN public.artifacts.default_values IS 'Default/pre-filled form values for form artifacts';

COMMIT;

-- Verification query
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'artifacts' AND column_name = 'default_values';
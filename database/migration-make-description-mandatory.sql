-- Migration to add specification field and make description mandatory
-- Run this in your Supabase SQL Editor

-- Step 1: Add the specification field
ALTER TABLE public.rfp 
ADD COLUMN IF NOT EXISTS specification TEXT;

-- Step 2: Update any existing RFPs that have NULL descriptions with default values
UPDATE public.rfp 
SET description = COALESCE(description, 'Description not provided')
WHERE description IS NULL OR description = '';

-- Step 3: Update any existing RFPs that have NULL specifications with default values
UPDATE public.rfp 
SET specification = COALESCE(specification, 'Please provide detailed specifications for this RFP.')
WHERE specification IS NULL OR specification = '';

-- Step 4: Make both fields NOT NULL with constraints
ALTER TABLE public.rfp 
ALTER COLUMN description SET NOT NULL;

ALTER TABLE public.rfp 
ALTER COLUMN specification SET NOT NULL;

-- Step 5: Add check constraints to ensure fields are not empty
ALTER TABLE public.rfp 
ADD CONSTRAINT rfp_description_not_empty 
CHECK (description IS NOT NULL AND trim(description) != '');

ALTER TABLE public.rfp 
ADD CONSTRAINT rfp_specification_not_empty 
CHECK (specification IS NOT NULL AND trim(specification) != '');

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('description', 'specification');
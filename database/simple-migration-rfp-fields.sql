-- Simple RFP Migration Script for Supabase
-- Run each section separately in Supabase SQL Editor

-- Section 1: Add specification column if it doesn't exist
ALTER TABLE public.rfp ADD COLUMN IF NOT EXISTS specification TEXT;

-- Section 2: Update existing records with default values
UPDATE public.rfp 
SET description = COALESCE(description, 'Description not provided')
WHERE description IS NULL OR trim(description) = '';

UPDATE public.rfp 
SET specification = COALESCE(specification, description, 'Please provide detailed specifications for this RFP.')
WHERE specification IS NULL OR trim(specification) = '';

-- Section 3: Make fields required
ALTER TABLE public.rfp ALTER COLUMN description SET NOT NULL;
ALTER TABLE public.rfp ALTER COLUMN specification SET NOT NULL;

-- Section 4: Add constraints
ALTER TABLE public.rfp 
ADD CONSTRAINT IF NOT EXISTS rfp_description_not_empty 
CHECK (description IS NOT NULL AND trim(description) != '');

ALTER TABLE public.rfp 
ADD CONSTRAINT IF NOT EXISTS rfp_specification_not_empty 
CHECK (specification IS NOT NULL AND trim(specification) != '');

-- Section 5: Verify the migration
SELECT 
    column_name,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('description', 'specification')
ORDER BY column_name;

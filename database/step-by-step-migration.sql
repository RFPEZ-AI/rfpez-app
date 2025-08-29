-- Step-by-Step RFP Migration for Supabase
-- Copy and paste each command separately into Supabase SQL Editor

-- Step 1: Add the specification column
ALTER TABLE public.rfp ADD COLUMN IF NOT EXISTS specification TEXT;

-- Step 2: Update existing descriptions (if any are null)
UPDATE public.rfp 
SET description = 'Description not provided'
WHERE description IS NULL OR trim(description) = '';

-- Step 3: Copy description to specification for existing records
UPDATE public.rfp 
SET specification = COALESCE(description, 'Please provide detailed specifications for this RFP.')
WHERE specification IS NULL OR trim(specification) = '';

-- Step 4: Make description required
ALTER TABLE public.rfp ALTER COLUMN description SET NOT NULL;

-- Step 5: Make specification required  
ALTER TABLE public.rfp ALTER COLUMN specification SET NOT NULL;

-- Step 6: Verify the changes worked
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('description', 'specification')
ORDER BY column_name;

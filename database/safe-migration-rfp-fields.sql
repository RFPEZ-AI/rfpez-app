-- Safe migration for RFP table - Backward Compatible
-- This migration can be run multiple times safely
-- Run this in your Supabase SQL Editor

-- Step 1: Add the specification field (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfp' AND column_name = 'specification'
    ) THEN
        ALTER TABLE public.rfp ADD COLUMN specification TEXT;
        RAISE NOTICE 'Added specification column';
    ELSE
        RAISE NOTICE 'Specification column already exists';
    END IF;
END $$;

-- Step 2: Update any existing RFPs that have NULL descriptions with default values
UPDATE public.rfp 
SET description = COALESCE(description, 'Description not provided')
WHERE description IS NULL OR trim(description) = '';

-- Step 3: Update any existing RFPs that have NULL specifications with default values
UPDATE public.rfp 
SET specification = COALESCE(specification, 'Please provide detailed specifications for this RFP.')
WHERE specification IS NULL OR trim(specification) = '';

-- Step 4: Make both fields NOT NULL (only if not already set)
DO $$ 
BEGIN
    -- Check and set description NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfp' AND column_name = 'description' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.rfp ALTER COLUMN description SET NOT NULL;
        RAISE NOTICE 'Set description to NOT NULL';
    ELSE
        RAISE NOTICE 'Description is already NOT NULL';
    END IF;
    
    -- Check and set specification NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rfp' AND column_name = 'specification' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.rfp ALTER COLUMN specification SET NOT NULL;
        RAISE NOTICE 'Set specification to NOT NULL';
    ELSE
        RAISE NOTICE 'Specification is already NOT NULL';
    END IF;
END $$;

-- Step 5: Add check constraints (only if they don't exist)
DO $$
BEGIN
    -- Add description constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rfp_description_not_empty' AND table_name = 'rfp'
    ) THEN
        ALTER TABLE public.rfp 
        ADD CONSTRAINT rfp_description_not_empty 
        CHECK (description IS NOT NULL AND trim(description) != '');
        RAISE NOTICE 'Added description constraint';
    ELSE
        RAISE NOTICE 'Description constraint already exists';
    END IF;
    
    -- Add specification constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rfp_specification_not_empty' AND table_name = 'rfp'
    ) THEN
        ALTER TABLE public.rfp 
        ADD CONSTRAINT rfp_specification_not_empty 
        CHECK (specification IS NOT NULL AND trim(specification) != '');
        RAISE NOTICE 'Added specification constraint';
    ELSE
        RAISE NOTICE 'Specification constraint already exists';
    END IF;
END $$;

-- Step 6: Verify the changes
SELECT 
    'Schema verification:' as info,
    column_name,
    is_nullable,
    data_type 
FROM information_schema.columns 
WHERE table_name = 'rfp' AND column_name IN ('description', 'specification')
ORDER BY column_name;

-- Show constraint verification
SELECT 
    'Constraint verification:' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'rfp' AND constraint_name LIKE '%_not_empty'
ORDER BY constraint_name;

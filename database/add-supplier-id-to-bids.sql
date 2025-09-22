-- Migration: Add supplier_id column to bids table
-- Date: September 22, 2025
-- Purpose: Fix missing supplier_id column in bids table that's preventing Bid View from working

-- Step 1: Add supplier_id column to bids table (if it doesn't exist)
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS supplier_id INTEGER;

-- Step 2: Create foreign key constraint to supplier_profiles table
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bids_supplier_id_fkey' 
        AND table_name = 'bids'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.bids 
        ADD CONSTRAINT bids_supplier_id_fkey 
        FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bids_supplier_id ON public.bids(supplier_id);

-- Step 4: Add comment to document the column
COMMENT ON COLUMN public.bids.supplier_id IS 'Foreign key reference to supplier_profiles table - identifies which supplier submitted this bid';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bids' 
AND table_schema = 'public'
ORDER BY ordinal_position;
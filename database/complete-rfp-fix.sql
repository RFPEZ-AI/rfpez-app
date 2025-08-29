-- Complete fix for RFP table issues
-- Run this step by step in your Supabase SQL Editor

-- Step 1: Check current RFP table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rfp' 
ORDER BY ordinal_position;

-- Step 2: Remove document column if it still exists
ALTER TABLE public.rfp DROP COLUMN IF EXISTS document;

-- Step 3: Check current RLS policies on RFP table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'rfp';

-- Step 4: Add RLS policies for authenticated users (drop existing ones first if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to create RFPs" ON public.rfp;
DROP POLICY IF EXISTS "Allow authenticated users to update RFPs" ON public.rfp;
DROP POLICY IF EXISTS "Allow public RFP viewing" ON public.rfp;

-- Step 5: Create new policies
CREATE POLICY "Allow authenticated users to create RFPs" ON public.rfp 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update RFPs" ON public.rfp 
FOR UPDATE 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view RFPs" ON public.rfp 
FOR SELECT 
TO authenticated
USING (true);

-- Step 6: Refresh the schema cache (force Supabase to reload table structure)
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rfp' 
ORDER BY ordinal_position;

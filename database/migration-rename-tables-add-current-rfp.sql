-- Migration to add current_rfp_id to user_profiles and rename tables
-- Run this in your Supabase SQL Editor

-- Step 1: Add current_rfp_id field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_rfp_id INTEGER;

-- Step 2: Drop existing RLS policies for old table names (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to create RFPs" ON public.rfp;
DROP POLICY IF EXISTS "Allow authenticated users to update RFPs" ON public.rfp;
DROP POLICY IF EXISTS "Allow authenticated users to view RFPs" ON public.rfp;
DROP POLICY IF EXISTS "Allow public RFP viewing" ON public.rfp;
DROP POLICY IF EXISTS "Allow public bid submissions" ON public.bid;
DROP POLICY IF EXISTS "Allow viewing bids" ON public.bid;
DROP POLICY IF EXISTS "Allow updating bids" ON public.bid;
DROP POLICY IF EXISTS "Allow public supplier viewing" ON public.supplier;

-- Step 3: Drop existing foreign key constraints that reference the old tables
ALTER TABLE bid DROP CONSTRAINT IF EXISTS bid_rfp_id_fkey;
ALTER TABLE bid DROP CONSTRAINT IF EXISTS bid_supplier_id_fkey;

-- Step 4: Rename the tables
ALTER TABLE rfp RENAME TO rfps;
ALTER TABLE bid RENAME TO bids;
ALTER TABLE supplier RENAME TO supplier_profiles;

-- Step 5: Re-create foreign key constraints with new table names
ALTER TABLE bids 
ADD CONSTRAINT bids_rfp_id_fkey 
FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE;

ALTER TABLE bids 
ADD CONSTRAINT bids_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES supplier_profiles(id) ON DELETE SET NULL;

-- Step 6: Add foreign key constraint for current_rfp_id in user_profiles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_current_rfp_id_fkey 
FOREIGN KEY (current_rfp_id) REFERENCES rfps(id) ON DELETE SET NULL;

-- Step 7: Create index for better performance on current_rfp_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_rfp_id ON public.user_profiles(current_rfp_id);

-- Step 8: Add comment to the new column
COMMENT ON COLUMN public.user_profiles.current_rfp_id IS 'Current RFP context for the user - foreign key to rfps table';

-- Step 9: Re-create RLS policies with new table names
-- Enable RLS on new tables
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- RFP policies
CREATE POLICY "Allow authenticated users to create RFPs" ON public.rfps 
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update RFPs" ON public.rfps 
FOR UPDATE TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view RFPs" ON public.rfps 
FOR SELECT TO authenticated 
USING (true);

-- Bid policies
CREATE POLICY "Allow public bid submissions" ON public.bids 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow viewing bids" ON public.bids 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Allow updating bids" ON public.bids 
FOR UPDATE TO authenticated 
USING (true) 
WITH CHECK (true);

-- Supplier profile policies
CREATE POLICY "Allow public supplier viewing" ON public.supplier_profiles 
FOR SELECT TO anon, authenticated 
USING (true);

-- Verification queries to run after migration:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('rfps', 'bids', 'supplier_profiles');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_rfp_id';

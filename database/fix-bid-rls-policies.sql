-- Fix RLS policies for bid table to allow public bid submissions
-- Run this in your Supabase SQL Editor

-- First, let's check if RLS is enabled on the bid table and add policies for public access

-- Enable RLS if not already enabled (this might already be done)
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert bids (for public bid submissions)
CREATE POLICY "Allow public bid submissions" ON public.bids 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow users to view bids (you might want to restrict this based on your requirements)
-- This allows viewing all bids - you may want to modify this based on your business logic
CREATE POLICY "Allow viewing bids" ON public.bids 
FOR SELECT 
USING (true);

-- Optional: Policy to allow updating bids (if needed)
-- You might want to restrict this to specific conditions
CREATE POLICY "Allow updating bids" ON public.bids 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Also ensure the rfp table allows public read access for bid submission
ALTER TABLE public.rfp ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read RFPs (needed for bid submission)
CREATE POLICY "Allow public RFP viewing" ON public.rfp 
FOR SELECT 
USING (is_public = true OR true); -- Adjust this condition based on your requirements

-- Policy to allow viewing supplier profiles if needed
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public supplier viewing" ON public.supplier_profiles 
FOR SELECT 
USING (true);

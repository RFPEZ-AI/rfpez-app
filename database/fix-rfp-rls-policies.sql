-- Fix RLS policies for RFP table to allow creating new RFPs
-- Run this in your Supabase SQL Editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'rfp';

-- Add INSERT policy to allow authenticated users to create RFPs
-- You can modify the WITH CHECK condition based on your requirements
CREATE POLICY "Allow authenticated users to create RFPs" ON public.rfp 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Optional: If you want to allow public (anonymous) users to create RFPs, use this instead:
-- CREATE POLICY "Allow public RFP creation" ON public.rfp 
-- FOR INSERT 
-- WITH CHECK (true);

-- Add UPDATE policy to allow authenticated users to update their own RFPs
-- You might want to add user ownership tracking to the RFP table later
CREATE POLICY "Allow authenticated users to update RFPs" ON public.rfp 
FOR UPDATE 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'rfp';

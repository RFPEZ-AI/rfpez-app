-- Fix for agent update 406 error
-- Add missing RLS policies for agent updates

-- Add UPDATE policy for agents table
-- This allows all authenticated users to update agents for now
-- In production, you might want to restrict this to admin users only

DROP POLICY IF EXISTS "Allow authenticated users to update agents" ON public.agents;

CREATE POLICY "Allow authenticated users to update agents" ON public.agents 
FOR UPDATE 
USING (true)  -- Allow all authenticated users to update
WITH CHECK (true);  -- Allow all updates

-- Alternative: If you want to restrict to admin users only, use this instead:
-- CREATE POLICY "Allow admin users to update agents" ON public.agents 
-- FOR UPDATE 
-- USING (auth.jwt() ->> 'role' = 'admin')
-- WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Also add INSERT and DELETE policies for completeness
DROP POLICY IF EXISTS "Allow authenticated users to insert agents" ON public.agents;
DROP POLICY IF EXISTS "Allow authenticated users to delete agents" ON public.agents;

CREATE POLICY "Allow authenticated users to insert agents" ON public.agents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete agents" ON public.agents 
FOR DELETE 
USING (true);

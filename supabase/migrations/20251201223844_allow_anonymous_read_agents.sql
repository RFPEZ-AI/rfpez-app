-- Migration: Allow anonymous users to read agents table
-- Purpose: Fix RLS policy to allow edge function to load abstract agents like _common
-- Date: 2025-12-01

-- Drop existing RLS policies on agents table
DROP POLICY IF EXISTS "Allow public read access to agents" ON agents;
DROP POLICY IF EXISTS "Users can view agents" ON agents;
DROP POLICY IF EXISTS "Agents are viewable by everyone" ON agents;

-- Create new permissive RLS policy allowing all reads (both authenticated and anonymous)
CREATE POLICY "Allow all users to read agents"
ON agents
FOR SELECT
TO public  -- This includes both authenticated and anon roles
USING (true);  -- Allow reading all agents regardless of access level or abstract status

-- Verify RLS is enabled on agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the policy
COMMENT ON POLICY "Allow all users to read agents" ON agents IS 
'Allows both authenticated and anonymous users to read all agents, including abstract base agents like _common. This is necessary for the agent inheritance system to function correctly in edge functions.';

-- Fix Session Artifacts RLS Policies
-- Issue: 403 Forbidden error when creating session artifacts due to incorrect RLS policies
-- Root Cause: session_artifacts policies were not properly aligned with sessions table user relationship

-- The sessions table uses user_profiles.supabase_user_id to match auth.uid()
-- but session_artifacts policies were directly checking sessions.user_id
-- This creates a mismatch since sessions.user_id references user_profiles.id (not supabase_user_id)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view session artifacts from own sessions" ON session_artifacts;
DROP POLICY IF EXISTS "Users can create session artifacts in own sessions" ON session_artifacts;
DROP POLICY IF EXISTS "Users can delete session artifacts from own sessions" ON session_artifacts;

-- Create corrected policies that properly join through user_profiles table
CREATE POLICY "Users can view session artifacts from own sessions" 
ON session_artifacts 
FOR SELECT 
TO public 
USING (
  auth.uid() IN (
    SELECT user_profiles.supabase_user_id 
    FROM user_profiles 
    JOIN sessions ON sessions.user_id = user_profiles.id 
    WHERE sessions.id = session_artifacts.session_id
  )
);

CREATE POLICY "Users can create session artifacts in own sessions" 
ON session_artifacts 
FOR INSERT 
TO public 
WITH CHECK (
  auth.uid() IN (
    SELECT user_profiles.supabase_user_id 
    FROM user_profiles 
    JOIN sessions ON sessions.user_id = user_profiles.id 
    WHERE sessions.id = session_artifacts.session_id
  )
);

CREATE POLICY "Users can delete session artifacts from own sessions" 
ON session_artifacts 
FOR DELETE 
TO public 
USING (
  auth.uid() IN (
    SELECT user_profiles.supabase_user_id 
    FROM user_profiles 
    JOIN sessions ON sessions.user_id = user_profiles.id 
    WHERE sessions.id = session_artifacts.session_id
  )
);

-- Verify policies are in place
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'session_artifacts';
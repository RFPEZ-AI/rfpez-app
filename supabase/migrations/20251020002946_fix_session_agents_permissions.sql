-- Fix session_agents table permissions for authenticated users
-- This allows the switch_agent tool to work properly

-- Grant necessary table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON session_agents TO authenticated;

-- Fix the INSERT policy to include WITH CHECK condition
-- This allows authenticated users to insert session_agent records for their own sessions
DROP POLICY IF EXISTS session_agents_insert_optimized ON session_agents;

CREATE POLICY session_agents_insert_optimized ON session_agents
FOR INSERT
TO public
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT up.supabase_user_id
    FROM user_profiles up
    JOIN sessions s ON up.id = s.user_id
    WHERE s.id = session_agents.session_id
  )
);

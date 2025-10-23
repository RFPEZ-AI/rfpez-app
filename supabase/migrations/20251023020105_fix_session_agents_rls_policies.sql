-- Fix session_agents RLS policies to work with auth.users.id instead of user_profiles.id
-- After schema migration, sessions.user_id now points to auth.users.id directly
-- RLS policies need to check auth.uid() against sessions.user_id without joining user_profiles

-- Drop old policies that use incorrect user_profiles join
DROP POLICY IF EXISTS "session_agents_select_optimized" ON session_agents;
DROP POLICY IF EXISTS "session_agents_insert_optimized" ON session_agents;
DROP POLICY IF EXISTS "session_agents_update_optimized" ON session_agents;
DROP POLICY IF EXISTS "session_agents_delete_optimized" ON session_agents;

-- Create new policies that directly check auth.uid() against sessions.user_id
CREATE POLICY "session_agents_select_policy"
  ON session_agents FOR SELECT
  USING (
    auth.uid() IN (
      SELECT s.user_id 
      FROM sessions s 
      WHERE s.id = session_agents.session_id
    )
  );

CREATE POLICY "session_agents_insert_policy"
  ON session_agents FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT s.user_id 
      FROM sessions s 
      WHERE s.id = session_agents.session_id
    )
  );

CREATE POLICY "session_agents_update_policy"
  ON session_agents FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT s.user_id 
      FROM sessions s 
      WHERE s.id = session_agents.session_id
    )
  );

CREATE POLICY "session_agents_delete_policy"
  ON session_agents FOR DELETE
  USING (
    auth.uid() IN (
      SELECT s.user_id 
      FROM sessions s 
      WHERE s.id = session_agents.session_id
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_agents TO authenticated;

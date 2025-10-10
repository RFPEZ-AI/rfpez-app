-- Fix RLS policies for agent_memories table to work with user_profiles.id foreign key
-- The issue: user_id column references user_profiles.id, but RLS policies check auth.uid()
-- The fix: Update policies to join through user_profiles table

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own agent memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can insert their own agent memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can update their own agent memories" ON agent_memories;
DROP POLICY IF EXISTS "Users can delete their own agent memories" ON agent_memories;

-- Create new RLS policies that join through user_profiles
-- SELECT policy: Users can view memories linked to their profile
CREATE POLICY "Users can view their own agent memories"
ON agent_memories FOR SELECT
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

-- INSERT policy: Users can create memories for their profile
CREATE POLICY "Users can insert their own agent memories"
ON agent_memories FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

-- UPDATE policy: Users can update their own memories
CREATE POLICY "Users can update their own agent memories"
ON agent_memories FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

-- DELETE policy: Users can delete their own memories
CREATE POLICY "Users can delete their own agent memories"
ON agent_memories FOR DELETE
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

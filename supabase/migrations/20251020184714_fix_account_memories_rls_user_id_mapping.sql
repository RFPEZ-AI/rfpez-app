-- Fix RLS policies for account_memories to use correct user_id mapping
-- The issue: auth.uid() returns supabase_user_id, but account_users.user_id references user_profiles.id
-- Solution: Join through user_profiles to map supabase_user_id to user_profiles.id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can insert account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can update account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can delete account memories" ON account_memories;

-- SELECT policy: Users can view memories from their accounts
CREATE POLICY "Users can view account memories"
ON account_memories
FOR SELECT
TO public
USING (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    JOIN user_profiles up ON up.id = au.user_id
    WHERE up.supabase_user_id = auth.uid()
  )
);

-- INSERT policy: Users can create memories in their accounts
CREATE POLICY "Users can insert account memories"
ON account_memories
FOR INSERT
TO public
WITH CHECK (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    JOIN user_profiles up ON up.id = au.user_id
    WHERE up.supabase_user_id = auth.uid()
  )
);

-- UPDATE policy: Users can update memories in their accounts
CREATE POLICY "Users can update account memories"
ON account_memories
FOR UPDATE
TO public
USING (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    JOIN user_profiles up ON up.id = au.user_id
    WHERE up.supabase_user_id = auth.uid()
  )
)
WITH CHECK (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    JOIN user_profiles up ON up.id = au.user_id
    WHERE up.supabase_user_id = auth.uid()
  )
);

-- DELETE policy: Users can delete memories in their accounts
CREATE POLICY "Users can delete account memories"
ON account_memories
FOR DELETE
TO public
USING (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    JOIN user_profiles up ON up.id = au.user_id
    WHERE up.supabase_user_id = auth.uid()
  )
);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'account_memories'
ORDER BY cmd;

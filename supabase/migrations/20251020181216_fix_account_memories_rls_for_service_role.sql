-- Fix RLS policies for account_memories to allow service role access
-- The service role needs to be able to INSERT/UPDATE/DELETE without auth.uid() checks

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can update account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can delete account memories" ON account_memories;

-- Recreate INSERT policy with proper checks
CREATE POLICY "Users can insert account memories"
ON account_memories
FOR INSERT
TO public
WITH CHECK (
  -- Allow service role to bypass auth check
  (auth.role() = 'service_role')
  OR
  -- For authenticated users, verify account membership
  (account_id IN (
    SELECT au.account_id 
    FROM account_users au 
    WHERE au.user_id = auth.uid()
  ))
);

-- Recreate UPDATE policy with proper checks
CREATE POLICY "Users can update account memories"
ON account_memories
FOR UPDATE
TO public
USING (
  -- Allow service role to bypass auth check
  (auth.role() = 'service_role')
  OR
  -- For authenticated users, verify account membership
  (account_id IN (
    SELECT au.account_id 
    FROM account_users au 
    WHERE au.user_id = auth.uid()
  ))
)
WITH CHECK (
  -- Same check for the new values
  (auth.role() = 'service_role')
  OR
  (account_id IN (
    SELECT au.account_id 
    FROM account_users au 
    WHERE au.user_id = auth.uid()
  ))
);

-- Recreate DELETE policy with proper checks
CREATE POLICY "Users can delete account memories"
ON account_memories
FOR DELETE
TO public
USING (
  -- Allow service role to bypass auth check
  (auth.role() = 'service_role')
  OR
  -- For authenticated users, verify account membership
  (account_id IN (
    SELECT au.account_id 
    FROM account_users au 
    WHERE au.user_id = auth.uid()
  ))
);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'account_memories'
ORDER BY cmd;

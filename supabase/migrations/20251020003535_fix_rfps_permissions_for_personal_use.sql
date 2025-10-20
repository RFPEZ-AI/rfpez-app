-- Fix rfps table permissions for authenticated users
-- Allows users to create personal RFPs without requiring an account

-- Grant table permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON rfps TO authenticated;

-- Grant sequence permissions for INSERT operations
GRANT USAGE, SELECT ON SEQUENCE rfp_id_seq TO authenticated;

-- Update INSERT policy to allow personal RFPs (account_id = NULL)
DROP POLICY IF EXISTS insert_rfps ON rfps;

CREATE POLICY insert_rfps ON rfps
FOR INSERT
TO public
WITH CHECK (
  -- Allow if user is authenticated and creating personal RFP (no account)
  -- OR if user is in the specified account
  (account_id IS NULL AND auth.uid() IS NOT NULL) 
  OR 
  user_is_in_account(account_id, NULL::uuid)
);

-- Update UPDATE policy to allow personal RFPs
DROP POLICY IF EXISTS update_rfps ON rfps;

CREATE POLICY update_rfps ON rfps
FOR UPDATE
TO public
USING (
  (account_id IS NULL AND auth.uid() IS NOT NULL) 
  OR 
  user_is_in_account(account_id, NULL::uuid)
);

-- Update DELETE policy to allow personal RFPs
DROP POLICY IF EXISTS delete_rfps ON rfps;

CREATE POLICY delete_rfps ON rfps
FOR DELETE
TO public
USING (
  (account_id IS NULL AND auth.uid() IS NOT NULL) 
  OR 
  user_is_in_account(account_id, NULL::uuid)
);

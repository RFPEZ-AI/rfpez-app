-- Fix account_memories RLS policies to work with updated FK constraints
-- account_users.user_id now references auth.users.id (not user_profiles.id)

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can insert account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can update account memories" ON account_memories;
DROP POLICY IF EXISTS "Users can delete account memories" ON account_memories;

-- Recreate policies with correct FK join
-- account_users.user_id = auth.users.id (not user_profiles.id)

CREATE POLICY "Users can view account memories"
ON account_memories FOR SELECT
TO public
USING (
  account_id IN (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = auth.uid()  -- auth.uid() is auth.users.id
  )
);

CREATE POLICY "Users can insert account memories"
ON account_memories FOR INSERT
TO public
WITH CHECK (
  account_id IN (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = auth.uid()  -- auth.uid() is auth.users.id
  )
);

CREATE POLICY "Users can update account memories"
ON account_memories FOR UPDATE
TO public
USING (
  account_id IN (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  account_id IN (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete account memories"
ON account_memories FOR DELETE
TO public
USING (
  account_id IN (
    SELECT au.account_id
    FROM account_users au
    WHERE au.user_id = auth.uid()
  )
);

-- Add comment explaining the RLS setup
COMMENT ON TABLE account_memories IS 
'Account-level memories with RLS policies. Policies check account_users.user_id = auth.uid() where user_id references auth.users.id';

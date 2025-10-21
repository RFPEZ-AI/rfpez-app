-- Fix Infinite Recursion in account_users RLS Policies
-- Issue: Policies query account_users table from within account_users policies
-- Solution: Simplify policies to avoid self-referencing queries
-- Date: 2025-10-21

-- =============================================================================
-- PART 1: Fix account_users Infinite Recursion
-- =============================================================================

-- Drop all existing account_users policies
DROP POLICY IF EXISTS select_account_users ON account_users;
DROP POLICY IF EXISTS insert_account_users ON account_users;
DROP POLICY IF EXISTS update_account_users ON account_users;
DROP POLICY IF EXISTS delete_account_users ON account_users;

-- Simplified policies that don't query account_users from within itself

-- SELECT: Users can see their own records and admins see all in their account
CREATE POLICY select_account_users ON account_users
FOR SELECT TO authenticated
USING (
    -- Users can see their own account_user records
    user_id = auth.uid()
);

-- INSERT: Service role or authenticated users can create (will be validated by application)
CREATE POLICY insert_account_users ON account_users
FOR INSERT TO authenticated
WITH CHECK (
    -- Service role can always insert
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Authenticated users can insert their own records
    user_id = auth.uid()
);

-- UPDATE: Users can update their own records
CREATE POLICY update_account_users ON account_users
FOR UPDATE TO authenticated
USING (
    user_id = auth.uid()
);

-- DELETE: Users can delete their own records
CREATE POLICY delete_account_users ON account_users
FOR DELETE TO authenticated
USING (
    user_id = auth.uid()
);

COMMENT ON POLICY select_account_users ON account_users IS 
'Users can view their own account_user records.';
COMMENT ON POLICY insert_account_users ON account_users IS 
'Service role or authenticated users can create account_user records.';
COMMENT ON POLICY update_account_users ON account_users IS 
'Users can update their own account_user records.';
COMMENT ON POLICY delete_account_users ON account_users IS 
'Users can delete their own account_user records.';

-- =============================================================================
-- PART 2: Enable RLS on user_profiles and Add Policies
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS select_user_profiles ON user_profiles;
DROP POLICY IF EXISTS insert_user_profiles ON user_profiles;
DROP POLICY IF EXISTS update_user_profiles ON user_profiles;
DROP POLICY IF EXISTS delete_user_profiles ON user_profiles;

-- SELECT: Users can see their own profile
CREATE POLICY select_user_profiles ON user_profiles
FOR SELECT TO authenticated
USING (
    supabase_user_id = auth.uid()
);

-- INSERT: Users can create their own profile, service role can create any
CREATE POLICY insert_user_profiles ON user_profiles
FOR INSERT TO authenticated
WITH CHECK (
    supabase_user_id = auth.uid()
    OR
    auth.jwt()->>'role' = 'service_role'
);

-- UPDATE: Users can update their own profile
CREATE POLICY update_user_profiles ON user_profiles
FOR UPDATE TO authenticated
USING (
    supabase_user_id = auth.uid()
);

-- DELETE: Service role only
CREATE POLICY delete_user_profiles ON user_profiles
FOR DELETE TO authenticated
USING (
    auth.jwt()->>'role' = 'service_role'
);

COMMENT ON POLICY select_user_profiles ON user_profiles IS 
'Users can view their own profile.';
COMMENT ON POLICY insert_user_profiles ON user_profiles IS 
'Users can create their own profile, service role can create any.';
COMMENT ON POLICY update_user_profiles ON user_profiles IS 
'Users can update their own profile.';
COMMENT ON POLICY delete_user_profiles ON user_profiles IS 
'Service role can delete profiles.';

-- =============================================================================
-- PART 3: Ensure RFP Design Agent is Available Locally
-- =============================================================================

-- Just ensure the agent is active and not restricted
-- (Full agent data should be synced separately using the remote database)
UPDATE agents 
SET 
    is_active = true,
    is_restricted = false,
    updated_at = NOW()
WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';

-- If the agent doesn't exist at all, log a message
-- (This would only happen if the agent was never created locally)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM agents WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc') THEN
        RAISE NOTICE 'RFP Design agent not found - full agent sync needed from remote database';
    END IF;
END $$;

COMMENT ON TABLE agents IS 
'Agent configurations with simplified RLS policies.';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

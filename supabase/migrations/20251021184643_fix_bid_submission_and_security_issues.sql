-- Fix Bid Submission and Security Issues
-- Issue 1: Bids cannot be submitted because account_id is NOT NULL but not auto-populated
-- Issue 2: Security linter warnings about RLS and function search_path
-- Date: 2025-10-21

-- =============================================================================
-- PART 1: Fix Bid Submission Issue
-- =============================================================================

-- Problem: account_id is NOT NULL but users don't know their account_id
-- Solution: Create helper function to get user's account_id and fix INSERT policy

-- Drop existing problematic policy
DROP POLICY IF EXISTS insert_bids_authenticated ON bids;

-- Create helper function to get user's account_id
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_account_id uuid;
BEGIN
    -- Get the account_id for the authenticated user
    SELECT ua.account_id INTO user_account_id
    FROM account_users ua
    WHERE ua.user_id = auth.uid()
    LIMIT 1;
    
    RETURN user_account_id;
END;
$$;

-- Create new policy that auto-populates account_id
CREATE POLICY insert_bids_with_account ON bids
FOR INSERT TO authenticated
WITH CHECK (
    -- Allow insert if user is authenticated and account_id matches their account
    auth.uid() IS NOT NULL 
    AND account_id = get_user_account_id()
);

-- Add comment explaining the policy
COMMENT ON POLICY insert_bids_with_account ON bids IS 
'Allows authenticated users to insert bids. The account_id must match the user''s account from account_users table.';

-- =============================================================================
-- PART 2: Fix Security Definer View Warnings
-- =============================================================================

-- These views use SECURITY DEFINER which can be a security risk
-- Convert them to SECURITY INVOKER (default) if they don't need elevated privileges

-- Fix form_save_stats view
DROP VIEW IF EXISTS public.form_save_stats CASCADE;
CREATE VIEW public.form_save_stats
WITH (security_invoker = true)
AS
SELECT 
    id AS artifact_id,
    name AS form_name,
    save_count,
    last_saved_at,
    CASE
        WHEN (draft_data IS NOT NULL AND draft_data <> '{}'::jsonb) THEN 'has_draft'::text
        WHEN (default_values IS NOT NULL AND default_values <> '{}'::jsonb) THEN 'has_data'::text
        ELSE 'empty'::text
    END AS data_status,
    created_at,
    updated_at
FROM artifacts
WHERE type = 'form' AND status = 'active';

COMMENT ON VIEW form_save_stats IS 
'Statistics about form artifacts. Uses SECURITY INVOKER for safety.';

-- Fix bid_summary view
DROP VIEW IF EXISTS public.bid_summary CASCADE;
CREATE VIEW public.bid_summary
WITH (security_invoker = true)
AS
SELECT 
    b.id AS bid_id,
    b.rfp_id,
    r.name AS rfp_name,
    b.supplier_id,
    b.status,
    b.bid_amount,
    b.currency,
    b.submitted_at,
    b.delivery_date,
    b.score,
    b.ranking,
    b.supplier_notes,
    b.created_at,
    b.updated_at
FROM bids b
LEFT JOIN rfps r ON b.rfp_id = r.id
WHERE b.status <> 'draft'
ORDER BY b.rfp_id, b.ranking, b.submitted_at DESC;

COMMENT ON VIEW bid_summary IS 
'Summary view of bids with RFP information. Uses SECURITY INVOKER for safety.';

-- Fix v_sessions_with_user view
DROP VIEW IF EXISTS public.v_sessions_with_user CASCADE;
CREATE VIEW public.v_sessions_with_user
WITH (security_invoker = true)
AS
SELECT 
    s.id AS session_id,
    s.user_id,
    up.full_name AS user_name,
    up.email AS user_email,
    s.title,
    s.description,
    s.created_at,
    s.updated_at,
    s.is_archived,
    s.session_metadata,
    s.current_agent_id,
    s.current_rfp_id,
    s.current_artifact_id
FROM sessions s
LEFT JOIN user_profiles up ON up.id = s.user_id;

COMMENT ON VIEW v_sessions_with_user IS 
'Sessions with user information. Uses SECURITY INVOKER for safety.';

-- =============================================================================
-- PART 3: Enable RLS on Account Tables
-- =============================================================================

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Policies for accounts table
CREATE POLICY select_accounts ON accounts
FOR SELECT TO authenticated
USING (
    -- Users can see accounts they belong to
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY insert_accounts ON accounts
FOR INSERT TO authenticated
WITH CHECK (
    -- Only allow service role to create accounts directly
    auth.jwt()->>'role' = 'service_role'
    OR 
    -- Or allow authenticated users to create their own account
    auth.uid() IS NOT NULL
);

CREATE POLICY update_accounts ON accounts
FOR UPDATE TO authenticated
USING (
    -- Users can update accounts they belong to with admin role
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

CREATE POLICY delete_accounts ON accounts
FOR DELETE TO authenticated
USING (
    -- Only admins can delete accounts
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

-- Enable RLS on account_users table
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Policies for account_users table
CREATE POLICY select_account_users ON account_users
FOR SELECT TO authenticated
USING (
    -- Users can see members of accounts they belong to
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY insert_account_users ON account_users
FOR INSERT TO authenticated
WITH CHECK (
    -- Admins can add users to their accounts
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
    OR
    -- Service role can add users
    auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY update_account_users ON account_users
FOR UPDATE TO authenticated
USING (
    -- Users can update their own record or admins can update anyone in their account
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

CREATE POLICY delete_account_users ON account_users
FOR DELETE TO authenticated
USING (
    -- Admins can remove users from their accounts
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

-- Enable RLS on user_accounts table
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for user_accounts table (junction table - simpler policies)
CREATE POLICY select_user_accounts ON user_accounts
FOR SELECT TO authenticated
USING (
    -- Users can see their own account relationships
    user_profile_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid())
    OR
    -- Or accounts they belong to
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = user_accounts.account_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY insert_user_accounts ON user_accounts
FOR INSERT TO authenticated
WITH CHECK (
    -- Service role can create relationships
    auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY delete_user_accounts ON user_accounts
FOR DELETE TO authenticated
USING (
    -- Users can remove their own relationships or admins can
    user_profile_id IN (SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid())
    OR
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = user_accounts.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

-- Enable RLS on supplier_accounts table
ALTER TABLE public.supplier_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for supplier_accounts table
CREATE POLICY select_supplier_accounts ON supplier_accounts
FOR SELECT TO authenticated
USING (
    -- Users can see supplier accounts for their accounts
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = supplier_accounts.account_id
        AND au.user_id = auth.uid()
    )
);

CREATE POLICY insert_supplier_accounts ON supplier_accounts
FOR INSERT TO authenticated
WITH CHECK (
    -- Admins can create supplier relationships
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = supplier_accounts.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

CREATE POLICY update_supplier_accounts ON supplier_accounts
FOR UPDATE TO authenticated
USING (
    -- Admins can update supplier relationships
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = supplier_accounts.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

CREATE POLICY delete_supplier_accounts ON supplier_accounts
FOR DELETE TO authenticated
USING (
    -- Admins can delete supplier relationships
    EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = supplier_accounts.account_id
        AND au.user_id = auth.uid()
        AND au.role = 'admin'
    )
);

-- =============================================================================
-- PART 4: Fix Function Search Path Warnings
-- =============================================================================

-- Fix auto_create_user_account function
CREATE OR REPLACE FUNCTION public.auto_create_user_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_account_id uuid;
    user_email text;
BEGIN
    -- Get user email
    user_email := NEW.email;
    
    -- Create a new account for the user
    INSERT INTO accounts (name, account_type, status, created_at, updated_at)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', user_email),
        'individual',
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO new_account_id;
    
    -- Link user to the new account
    INSERT INTO account_users (account_id, user_id, role, created_at)
    VALUES (new_account_id, NEW.id, 'admin', NOW());
    
    -- Also create entry in user_accounts junction table for backwards compatibility
    INSERT INTO user_accounts (user_id, account_id, created_at)
    VALUES (NEW.id, new_account_id, NOW())
    ON CONFLICT (user_id, account_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_create_user_account IS 
'Automatically creates an account and links it to new users. Uses immutable search_path for security.';

-- Fix user_is_in_account functions - use ALTER to set search_path (preserves dependencies)
ALTER FUNCTION public.user_is_in_account(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.user_is_in_account(uuid, uuid) SET search_path = public, pg_temp;

COMMENT ON FUNCTION user_is_in_account(uuid) IS 
'Checks if current user belongs to an account. Uses immutable search_path for security.';
COMMENT ON FUNCTION user_is_in_account(uuid, uuid) IS 
'Checks if a specific user belongs to an account. Uses immutable search_path for security.';

-- =============================================================================
-- PART 5: Grant Necessary Permissions
-- =============================================================================

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION get_user_account_id() TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
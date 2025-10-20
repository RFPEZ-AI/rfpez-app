-- Migration: Ensure user has account and fix RFP creation to always use account_id
-- Date: 2025-10-20 01:03:35
-- Issue: RFPs should ALWAYS be associated with an account, not personal (account_id = NULL)
-- Solution: 
--   1. Create function to get or create user's default account
--   2. Update create_rfp_for_user to use account_id
--   3. Update RLS policies to require account_id (no NULL allowed)

BEGIN;

-- ============================================================================
-- PART 1: Helper function to get or create user's account
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_user_account(p_user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_user_email text;
  v_account_name text;
BEGIN
  -- Check if user already has an account
  SELECT account_id INTO v_account_id
  FROM account_users
  WHERE user_id = p_user_uuid
  LIMIT 1;
  
  -- If user has an account, return it
  IF v_account_id IS NOT NULL THEN
    RETURN v_account_id;
  END IF;
  
  -- User doesn't have an account, create one
  -- Get user's email for account name
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_uuid;
  
  -- Create account name from email (e.g., "john.doe@example.com" -> "john.doe's Account")
  v_account_name := COALESCE(
    split_part(v_user_email, '@', 1) || '''s Account',
    'User Account'
  );
  
  -- Create the account
  INSERT INTO accounts (name)
  VALUES (v_account_name)
  RETURNING id INTO v_account_id;
  
  -- Add user as owner of the account
  INSERT INTO account_users (account_id, user_id, role)
  VALUES (v_account_id, p_user_uuid, 'owner');
  
  RAISE NOTICE 'Created new account % for user %', v_account_id, p_user_uuid;
  
  RETURN v_account_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_user_account(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_or_create_user_account(uuid) IS 
'Gets user''s existing account or creates a new default account if none exists. Returns account_id.';

-- ============================================================================
-- PART 2: Update create_rfp_for_user to always use account_id
-- ============================================================================

-- Drop the existing function with correct signature
DROP FUNCTION IF EXISTS public.create_rfp_for_user(uuid, text, text, text, date, uuid);

CREATE OR REPLACE FUNCTION public.create_rfp_for_user(
  p_user_uuid uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_specification text DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_session_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rfp_id integer,
  rfp_name text,
  rfp_description text,
  rfp_account_id uuid,
  rfp_created_at timestamptz,
  success boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rfp_id integer;
  v_rfp_name text;
  v_rfp_description text;
  v_rfp_created_at timestamptz;
  v_account_id uuid;
  v_user_profile_id uuid;
BEGIN
  -- Validate user exists in user_profiles
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE supabase_user_id = p_user_uuid;
  
  IF v_user_profile_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::integer,
      NULL::text,
      NULL::text,
      NULL::uuid,
      NULL::timestamptz,
      false,
      'User profile not found'::text;
    RETURN;
  END IF;
  
  -- Get or create user's account
  v_account_id := get_or_create_user_account(p_user_uuid);
  
  IF v_account_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::integer,
      NULL::text,
      NULL::text,
      NULL::uuid,
      NULL::timestamptz,
      false,
      'Failed to get or create user account'::text;
    RETURN;
  END IF;
  
  -- Create the RFP with account_id (never NULL)
  INSERT INTO rfps (
    name,
    description,
    specification,
    due_date,
    account_id,
    status
  )
  VALUES (
    p_name,
    p_description,
    p_specification,
    p_due_date,  -- Already a date type
    v_account_id,  -- Always use account_id, never NULL
    'draft'
  )
  RETURNING id, name, description, created_at
  INTO v_rfp_id, v_rfp_name, v_rfp_description, v_rfp_created_at;
  
  -- Update session's current_rfp_id if session_id provided
  IF p_session_id IS NOT NULL THEN
    UPDATE sessions
    SET current_rfp_id = v_rfp_id
    WHERE id = p_session_id;
  END IF;
  
  -- Return success with RFP details
  RETURN QUERY SELECT 
    v_rfp_id,
    v_rfp_name,
    v_rfp_description,
    v_account_id,
    v_rfp_created_at,
    true,
    format('RFP created successfully with ID %s in account %s', v_rfp_id, v_account_id)::text;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_rfp_for_user(uuid, text, text, text, date, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_rfp_for_user IS 
'Creates an RFP associated with user''s account. Automatically gets or creates account if user doesn''t have one. Never creates RFPs with NULL account_id.';

-- ============================================================================
-- PART 3: Update RLS policies to require account_id (no NULL)
-- ============================================================================

-- Update SELECT policy to require account_id
DROP POLICY IF EXISTS select_rfps ON public.rfps;

CREATE POLICY select_rfps ON public.rfps FOR SELECT
USING (
  -- Allow public RFPs for everyone (including anonymous)
  (is_public = TRUE)
  OR
  -- For account RFPs (account_id must NOT be NULL), check account membership
  (
    auth.uid() IS NOT NULL
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = rfps.account_id
        AND au.user_id = auth.uid()
    )
  )
);

-- Update INSERT policy to require account_id
DROP POLICY IF EXISTS insert_rfps ON public.rfps;

CREATE POLICY insert_rfps ON public.rfps FOR INSERT
TO authenticated
WITH CHECK (
  -- Must have account_id (no NULL allowed)
  account_id IS NOT NULL
  AND
  -- User must be member of the account
  EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = rfps.account_id
      AND au.user_id = auth.uid()
  )
);

-- Update UPDATE policy to require account_id
DROP POLICY IF EXISTS update_rfps ON public.rfps;

CREATE POLICY update_rfps ON public.rfps FOR UPDATE
TO authenticated
USING (
  -- Must have account_id (no NULL allowed)
  account_id IS NOT NULL
  AND
  -- User must be member of the account
  EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = rfps.account_id
      AND au.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Must have account_id (no NULL allowed)
  account_id IS NOT NULL
  AND
  -- User must be member of the account
  EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = rfps.account_id
      AND au.user_id = auth.uid()
  )
);

-- Update DELETE policy to require account_id
DROP POLICY IF EXISTS delete_rfps ON public.rfps;

CREATE POLICY delete_rfps ON public.rfps FOR DELETE
TO authenticated
USING (
  -- Must have account_id (no NULL allowed)
  account_id IS NOT NULL
  AND
  -- User must be member of the account
  EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = rfps.account_id
      AND au.user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 4: Migrate existing NULL account_id RFPs to user accounts
-- ============================================================================

-- For any existing RFPs with NULL account_id, assign them to user's account
DO $$
DECLARE
  v_rfp record;
  v_user_uuid uuid;
  v_account_id uuid;
BEGIN
  FOR v_rfp IN 
    SELECT id, name FROM rfps WHERE account_id IS NULL
  LOOP
    -- Try to find the user who created this RFP via sessions
    SELECT s.user_id INTO v_user_uuid
    FROM sessions s
    WHERE s.current_rfp_id = v_rfp.id
    LIMIT 1;
    
    IF v_user_uuid IS NOT NULL THEN
      -- Get user's supabase auth ID
      SELECT up.supabase_user_id INTO v_user_uuid
      FROM user_profiles up
      WHERE up.id = v_user_uuid;
      
      IF v_user_uuid IS NOT NULL THEN
        -- Get or create account for this user
        v_account_id := get_or_create_user_account(v_user_uuid);
        
        -- Update RFP with account_id
        UPDATE rfps
        SET account_id = v_account_id
        WHERE id = v_rfp.id;
        
        RAISE NOTICE 'Migrated RFP % (%) to account %', v_rfp.id, v_rfp.name, v_account_id;
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;

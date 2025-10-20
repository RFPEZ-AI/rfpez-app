-- Migration: Fix RFPs table RLS policy for anonymous user access
-- Date: 2025-10-19 13:32:00
-- Issue: Anonymous users get "permission denied for table rfps" because the SELECT policy
--        calls user_is_in_account() which queries user_profiles table (not accessible to anon)
-- Solution: Simplify SELECT policy to check authentication status directly without querying user_profiles
--
-- The simplified policy allows:
-- 1. Public RFPs (is_public = TRUE) for everyone including anonymous users
-- 2. Account-specific RFPs only when authenticated (using account_id and account_users join)

BEGIN;

-- Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.rfps TO anon;
GRANT SELECT ON public.rfps TO authenticated;

-- Drop the old policy that calls user_is_in_account (which queries user_profiles)
DROP POLICY IF EXISTS select_rfps ON public.rfps;

-- Create simplified policy that avoids user_profiles table queries for anonymous users
CREATE POLICY select_rfps ON public.rfps FOR SELECT
USING (
  -- Allow public RFPs for everyone (including anonymous)
  (is_public = TRUE)
  OR
  -- For authenticated users, check account membership directly
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

COMMIT;

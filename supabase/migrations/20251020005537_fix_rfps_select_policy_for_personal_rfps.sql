-- Migration: Fix RFPs SELECT policy to allow personal RFPs (account_id = NULL)
-- Date: 2025-10-20 00:55:37
-- Issue: select_rfps policy doesn't allow authenticated users to view their personal RFPs (account_id = NULL)
--        The current policy only allows:
--        1. Public RFPs (is_public = TRUE)
--        2. Account RFPs where user is member (account_id IS NOT NULL AND user in account_users)
--        But personal RFPs with account_id = NULL are blocked!
-- Solution: Add condition to allow personal RFPs (account_id IS NULL) for authenticated users

BEGIN;

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS select_rfps ON public.rfps;

-- Create updated policy that allows personal RFPs
CREATE POLICY select_rfps ON public.rfps FOR SELECT
USING (
  -- Allow public RFPs for everyone (including anonymous)
  (is_public = TRUE)
  OR
  -- Allow personal RFPs (account_id = NULL) for authenticated users
  (
    auth.uid() IS NOT NULL
    AND account_id IS NULL
  )
  OR
  -- For account RFPs, check account membership
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

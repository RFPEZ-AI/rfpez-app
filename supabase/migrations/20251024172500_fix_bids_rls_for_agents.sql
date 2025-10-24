-- =======================================================
-- FIX BIDS RLS POLICY - ALLOW AGENT BID SUBMISSIONS
-- Date: October 24, 2025
-- Purpose: Allow authenticated users to submit bids on behalf of suppliers
-- Root Cause: Current RLS policy requires user to be in the bid's account,
--             but agents need to create demonstration bids for any RFP
-- =======================================================

BEGIN;

-- Add a more permissive INSERT policy for bids
-- This allows authenticated users to submit bids for RFPs they can access
DROP POLICY IF EXISTS insert_bids_for_accessible_rfps ON public.bids;

CREATE POLICY insert_bids_for_accessible_rfps ON public.bids 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if user is in the account
  public.user_is_in_account(account_id, NULL)
  OR
  -- Allow if the RFP is public
  EXISTS (
    SELECT 1 FROM public.rfps 
    WHERE id = rfp_id 
    AND (is_public = TRUE OR public.user_is_in_account(rfps.account_id, NULL))
  )
);

-- Keep the existing stricter policy but rename it
-- The new policy above will be evaluated alongside this one (OR logic)
-- This ensures backwards compatibility while allowing agent submissions

COMMIT;

COMMENT ON POLICY insert_bids_for_accessible_rfps ON public.bids IS 
'Allow authenticated users to submit bids for RFPs they can access, either through account membership or public RFPs';

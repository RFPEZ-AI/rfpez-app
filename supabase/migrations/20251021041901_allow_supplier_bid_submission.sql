-- Allow Supplier Bid Submission
-- Migration: 20251021041901_allow_supplier_bid_submission.sql
-- Purpose: Allow authenticated users (suppliers) to submit bids to any RFP
--          The current policy only allows users in the RFP owner's account to submit bids,
--          which is incorrect for supplier bid submissions.

BEGIN;

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "insert_bids" ON bids;

-- Create new INSERT policy that allows:
-- 1. Users in the RFP owner's account (for internal bid creation)
-- 2. Any authenticated user (for supplier bid submissions)
CREATE POLICY "insert_bids_v2" 
ON bids
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is in the account (internal bid creation)
  user_is_in_account(account_id, NULL::uuid)
  OR
  -- Allow any authenticated user to submit bids (supplier submissions)
  auth.uid() IS NOT NULL
);

COMMIT;

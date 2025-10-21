-- Allow Supplier Bid Submission
-- Migration: 20251021041901_allow_supplier_bid_submission.sql
-- Purpose: Allow authenticated users (suppliers) to submit bids to any RFP
--          Simplified version for remote database (no account_id column)

BEGIN;

-- Drop the existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "insert_bids" ON bids;
DROP POLICY IF EXISTS "insert_bids_v2" ON bids;

-- Create new INSERT policy that allows any authenticated user to submit bids
-- This enables supplier bid submissions while maintaining authentication requirement
CREATE POLICY "insert_bids_authenticated" 
ON bids
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

COMMIT;

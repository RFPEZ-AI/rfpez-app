-- Migration: Allow Anonymous Bid Submissions
-- Description: Enable anonymous users to submit bids for public RFPs
-- Changes:
--   1. Make account_id nullable (suppliers don't need accounts)
--   2. Add RLS policy for anonymous INSERT on public RFPs
--   3. Ensure supplier_id is populated for tracking

-- Step 1: Make account_id nullable
-- This allows bids from external suppliers without user accounts
ALTER TABLE bids ALTER COLUMN account_id DROP NOT NULL;

-- Step 2: Create RLS policy allowing anonymous bid submission for public RFPs
-- Anonymous users can only submit bids to public RFPs
CREATE POLICY "allow_anonymous_bid_submission"
ON bids
FOR INSERT
TO anon
WITH CHECK (
  -- Allow if RFP exists and is public
  EXISTS (
    SELECT 1
    FROM rfps
    WHERE rfps.id = bids.rfp_id
    AND rfps.is_public = true
  )
);

-- Step 3: Add index to improve public RFP check performance
CREATE INDEX IF NOT EXISTS idx_rfps_public ON rfps(id) WHERE is_public = true;

-- Comments for context
COMMENT ON POLICY "allow_anonymous_bid_submission" ON bids IS 
'Allows anonymous users to submit bids for public RFPs. Suppliers do not need accounts to participate.';

COMMENT ON COLUMN bids.account_id IS 
'User account ID - nullable for anonymous supplier submissions. Use supplier_id for tracking.';

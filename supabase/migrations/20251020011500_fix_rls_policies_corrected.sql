-- Fix RLS policies for frontend access
-- Migration: 20251020011500_fix_rls_policies_corrected.sql
-- Purpose: Simplify and fix RLS SELECT policies without schema assumptions

BEGIN;

-- ============================================================
-- FIX RFPS TABLE SELECT POLICIES
-- ============================================================

-- Drop and recreate select_rfps with clearer logic
DROP POLICY IF EXISTS select_rfps ON rfps;

CREATE POLICY select_rfps ON rfps
FOR SELECT
USING (
  -- Public RFPs are always accessible
  is_public = TRUE
  OR
  -- Authenticated users can see RFPs from their accounts
  (
    auth.uid() IS NOT NULL
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rfps.account_id
      AND au.user_id = auth.uid()
    )
  )
);

-- Add explicit policy for anonymous users to see public RFPs
DROP POLICY IF EXISTS anon_select_rfps ON rfps;

CREATE POLICY anon_select_rfps ON rfps
FOR SELECT
TO anon
USING (is_public = TRUE);

-- ============================================================
-- FIX BIDS TABLE SELECT POLICIES
-- ============================================================

-- Drop conflicting SELECT policies on bids table
DROP POLICY IF EXISTS select_bids ON bids;
DROP POLICY IF EXISTS auth_select_all ON bids;
DROP POLICY IF EXISTS anon_select_all ON bids;

-- Create single, clear SELECT policy for bids
CREATE POLICY select_bids ON bids
FOR SELECT
USING (
  -- Anyone can see bids for public RFPs
  EXISTS (
    SELECT 1 FROM rfps
    WHERE rfps.id = bids.rfp_id
    AND rfps.is_public = TRUE
  )
  OR
  -- Authenticated users can see bids from their account's RFPs
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rfps r
      JOIN account_users au ON r.account_id = au.account_id
      WHERE r.id = bids.rfp_id
      AND au.user_id = auth.uid()
    )
  )
);

-- ============================================================
-- FIX RFP_ARTIFACTS TABLE SELECT POLICY
-- ============================================================

-- Drop and recreate with explicit logic
DROP POLICY IF EXISTS "RFP artifacts are publicly readable" ON rfp_artifacts;
DROP POLICY IF EXISTS select_rfp_artifacts ON rfp_artifacts;

CREATE POLICY select_rfp_artifacts ON rfp_artifacts
FOR SELECT
USING (
  -- Anyone can see artifacts for public RFPs
  EXISTS (
    SELECT 1 FROM rfps
    WHERE rfps.id = rfp_artifacts.rfp_id
    AND rfps.is_public = TRUE
  )
  OR
  -- Authenticated users can see artifacts from their account's RFPs
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rfps r
      JOIN account_users au ON r.account_id = au.account_id
      WHERE r.id = rfp_artifacts.rfp_id
      AND au.user_id = auth.uid()
    )
  )
);

-- ============================================================
-- NOTE: ARTIFACTS TABLE
-- ============================================================
-- The artifacts table already has multiple SELECT policies
-- including select_artifacts that checks session membership.
-- We'll leave those as-is since they work with the session-based
-- and account-based checks already in place.
-- No changes needed to artifacts table policies.

COMMIT;

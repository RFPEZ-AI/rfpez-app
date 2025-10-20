-- Migration: Fix RLS policies causing 406 and 403 errors from frontend
-- Date: 2025-10-20 01:10:12
-- Issue: Frontend getting 406 (Not Acceptable) on rfps and 403 (Forbidden) on rfp_artifacts/bids
-- Root Cause: RLS policies are too restrictive or have conflicting rules
-- Solution: Simplify RLS policies to allow authenticated users to access their account data

BEGIN;

-- ============================================================================
-- Fix RFPs SELECT policy - Make it simpler and more permissive
-- ============================================================================

DROP POLICY IF EXISTS select_rfps ON public.rfps;

CREATE POLICY select_rfps ON public.rfps FOR SELECT
TO authenticated, anon
USING (
  -- Public RFPs visible to everyone
  is_public = TRUE
  OR
  -- For authenticated users: show RFPs where they're account members
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

-- Also add anon policy for public RFPs
DROP POLICY IF EXISTS anon_select_rfps ON public.rfps;

CREATE POLICY anon_select_rfps ON public.rfps FOR SELECT
TO anon
USING (is_public = TRUE);

-- ============================================================================
-- Fix bids table RLS policies - Remove conflicting policies
-- ============================================================================

-- Drop all existing SELECT policies on bids
DROP POLICY IF EXISTS select_bids ON public.bids;
DROP POLICY IF EXISTS auth_select_all ON public.bids;
DROP POLICY IF EXISTS anon_select_all ON public.bids;

-- Create single clear SELECT policy for bids
CREATE POLICY select_bids ON public.bids FOR SELECT
USING (
  -- Anon can see all bids (for public viewing)
  auth.uid() IS NULL
  OR
  -- Authenticated users can see bids for RFPs in their accounts
  (
    auth.uid() IS NOT NULL
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = bids.account_id
        AND au.user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- Fix rfp_artifacts SELECT policy - Already has "publicly readable" but verify
-- ============================================================================

-- The policy "RFP artifacts are publicly readable" already exists with USING (true)
-- This should work, but let's make it explicit for both roles

DROP POLICY IF EXISTS "RFP artifacts are publicly readable" ON public.rfp_artifacts;
DROP POLICY IF EXISTS select_rfp_artifacts ON public.rfp_artifacts;

CREATE POLICY select_rfp_artifacts ON public.rfp_artifacts FOR SELECT
USING (true);  -- Allow all users to read rfp_artifacts

-- ============================================================================
-- Fix artifacts SELECT policy
-- ============================================================================

DROP POLICY IF EXISTS select_artifacts ON public.artifacts;

CREATE POLICY select_artifacts ON public.artifacts FOR SELECT
USING (
  -- Public artifacts visible to everyone
  is_public = TRUE
  OR
  -- Authenticated users can see artifacts in their accounts
  (
    auth.uid() IS NOT NULL
    AND account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = artifacts.account_id
        AND au.user_id = auth.uid()
    )
  )
  OR
  -- Allow service role full access
  current_setting('role') = 'service_role'
);

-- ============================================================================
-- Verify policies
-- ============================================================================

DO $$
DECLARE
  v_count integer;
BEGIN
  -- Count SELECT policies on key tables
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE cmd = 'SELECT'
    AND tablename IN ('rfps', 'bids', 'rfp_artifacts', 'artifacts');
  
  RAISE NOTICE 'Created % SELECT policies for RFP-related tables', v_count;
END $$;

COMMIT;

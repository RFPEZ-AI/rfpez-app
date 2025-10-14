-- Fix Multiple Permissive Policies on rfp_artifacts table
-- 
-- Issue: The "Authenticated users can manage RFP artifacts" policy applies to ALL operations,
-- creating a conflict with "RFP artifacts are publicly readable" for SELECT.
--
-- Solution: Split the management policy into separate policies for INSERT, UPDATE, DELETE
-- while keeping the public SELECT policy separate.

-- Drop the existing policies
DROP POLICY IF EXISTS "Authenticated users can manage RFP artifacts" ON public.rfp_artifacts;
DROP POLICY IF EXISTS "RFP artifacts are publicly readable" ON public.rfp_artifacts;

-- Create separate policies for each operation to avoid conflicts

-- SELECT: Public read access (anon and authenticated users can read all rfp_artifacts)
CREATE POLICY "RFP artifacts are publicly readable" 
  ON public.rfp_artifacts 
  FOR SELECT 
  USING (true);

-- INSERT: Only authenticated users can create rfp_artifacts
CREATE POLICY "Authenticated users can insert RFP artifacts" 
  ON public.rfp_artifacts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only authenticated users can update rfp_artifacts
CREATE POLICY "Authenticated users can update RFP artifacts" 
  ON public.rfp_artifacts 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Only authenticated users can delete rfp_artifacts
CREATE POLICY "Authenticated users can delete RFP artifacts" 
  ON public.rfp_artifacts 
  FOR DELETE 
  TO authenticated
  USING (true);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- This migration fixes the multiple permissive policies warning by:
-- 1. Splitting the broad "manage" policy into specific operation policies (INSERT, UPDATE, DELETE)
-- 2. Keeping the public SELECT policy separate
-- 3. Each operation now has only ONE policy, eliminating the performance warning
--
-- Result:
-- - SELECT: 1 policy (public read for everyone)
-- - INSERT: 1 policy (authenticated only)
-- - UPDATE: 1 policy (authenticated only)
-- - DELETE: 1 policy (authenticated only)

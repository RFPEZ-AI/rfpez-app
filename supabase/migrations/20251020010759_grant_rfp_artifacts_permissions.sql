-- Migration: Grant permissions on rfp_artifacts and related tables
-- Date: 2025-10-20 01:07:59
-- Issue: "permission denied for table rfp_artifacts" when creating form artifacts
-- Solution: Grant table-level permissions to authenticated and anon roles

BEGIN;

-- ============================================================================
-- Grant permissions on rfp_artifacts table
-- ============================================================================

-- Grant all permissions to authenticated users (RLS policies will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rfp_artifacts TO authenticated;
GRANT SELECT ON TABLE public.rfp_artifacts TO anon;

-- ============================================================================
-- Grant permissions on artifacts table (parent table)
-- ============================================================================

-- Check if artifacts table permissions are already granted, if not grant them
DO $$
BEGIN
  -- Grant authenticated users access to artifacts table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticated' 
    AND table_name = 'artifacts' 
    AND privilege_type = 'INSERT'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.artifacts TO authenticated;
  END IF;
  
  -- Grant anon users read access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'anon' 
    AND table_name = 'artifacts' 
    AND privilege_type = 'SELECT'
  ) THEN
    GRANT SELECT ON TABLE public.artifacts TO anon;
  END IF;
END $$;

-- ============================================================================
-- Grant permissions on bids table (for future use)
-- ============================================================================

DO $$
BEGIN
  -- Grant authenticated users access to bids table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticated' 
    AND table_name = 'bids' 
    AND privilege_type = 'INSERT'
  ) THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bids TO authenticated;
  END IF;
  
  -- Grant anon users read access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'anon' 
    AND table_name = 'bids' 
    AND privilege_type = 'SELECT'
  ) THEN
    GRANT SELECT ON TABLE public.bids TO anon;
  END IF;
END $$;

-- ============================================================================
-- Verify permissions were granted
-- ============================================================================

DO $$
DECLARE
  v_count integer;
BEGIN
  -- Count permissions granted to authenticated role
  SELECT COUNT(*) INTO v_count
  FROM information_schema.role_table_grants 
  WHERE grantee = 'authenticated' 
  AND table_name IN ('rfp_artifacts', 'artifacts', 'bids');
  
  RAISE NOTICE 'Granted % permissions to authenticated role', v_count;
  
  -- Count permissions granted to anon role
  SELECT COUNT(*) INTO v_count
  FROM information_schema.role_table_grants 
  WHERE grantee = 'anon' 
  AND table_name IN ('rfp_artifacts', 'artifacts', 'bids');
  
  RAISE NOTICE 'Granted % permissions to anon role', v_count;
END $$;

COMMIT;

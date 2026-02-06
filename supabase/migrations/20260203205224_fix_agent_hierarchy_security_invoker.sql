-- =======================================================
-- FIX SECURITY LINTER: agent_hierarchy SECURITY DEFINER VIEW
-- Date: February 3, 2026
-- Purpose: Properly convert agent_hierarchy view to SECURITY INVOKER
-- 
-- Issue: Previous migration attempted to use CREATE OR REPLACE VIEW WITH (security_invoker = true)
--        but the option didn't persist (reloptions remained null).
--
-- Solution: Use ALTER VIEW to explicitly set the security_invoker option after creation.
-- =======================================================

-- The view definition is already correct from migration 20251230043000.
-- We just need to ensure the security_invoker option is actually set.

-- Explicitly set the security_invoker option on the existing view
ALTER VIEW public.agent_hierarchy SET (security_invoker = true);

-- Verify the setting by adding a comment
COMMENT ON VIEW public.agent_hierarchy IS 
  'Recursive view showing agent inheritance tree. SECURITY INVOKER enforces querying user permissions and RLS (not view owner privileges).';

-- Note: The view grants remain as-is from previous migrations:
-- GRANT SELECT ON public.agent_hierarchy TO authenticated;
-- GRANT SELECT ON public.agent_hierarchy TO anon;

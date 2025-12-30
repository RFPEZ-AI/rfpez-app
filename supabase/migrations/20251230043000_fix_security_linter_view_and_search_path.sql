-- =======================================================
-- FIX SECURITY LINTER: SECURITY DEFINER VIEW + MUTABLE FUNCTION SEARCH_PATH
-- Date: December 30, 2025
-- Purpose:
--   1) Ensure `public.agent_hierarchy` runs with *invoker* privileges for RLS
--   2) Ensure flagged functions have an explicit, immutable `search_path`
-- =======================================================

-- Ensure type names (e.g., `vector`) resolve consistently during this migration.
SET search_path = pg_catalog, public, extensions;

-- ============================================
-- 1) View: Make agent_hierarchy SECURITY INVOKER
-- ============================================

-- Postgres views default to definer privileges for underlying table access.
-- Supabase linter flags this because it can bypass RLS as the view owner.
-- `security_invoker=true` enforces permissions/RLS of the querying user.
CREATE OR REPLACE VIEW public.agent_hierarchy
WITH (security_invoker = true)
AS
WITH RECURSIVE agent_tree AS (
  SELECT
    a.id,
    a.name,
    a.parent_agent_id,
    a.is_abstract,
    0 AS depth,
    ARRAY[a.name] AS inheritance_chain,
    a.name::text AS chain_display
  FROM public.agents a
  WHERE a.parent_agent_id IS NULL

  UNION ALL

  SELECT
    a.id,
    a.name,
    a.parent_agent_id,
    a.is_abstract,
    at.depth + 1,
    at.inheritance_chain || a.name,
    (at.chain_display || ' → '::text) || a.name
  FROM public.agents a
  JOIN agent_tree at ON a.parent_agent_id = at.id
)
SELECT
  id,
  name,
  parent_agent_id,
  is_abstract,
  depth,
  inheritance_chain,
  chain_display
FROM agent_tree
ORDER BY depth, name;

-- Preserve expected read access.
GRANT SELECT ON public.agent_hierarchy TO authenticated;
GRANT SELECT ON public.agent_hierarchy TO anon;

COMMENT ON VIEW public.agent_hierarchy IS
  'Recursive view showing agent inheritance tree (security_invoker=true to enforce querying user RLS)';

-- ============================================
-- 2) Functions: Set immutable search_path
-- ============================================

-- The Supabase linter warns when functions do not explicitly set `search_path`.
-- Use a minimal, explicit search_path. Include `extensions` only where needed.

ALTER FUNCTION public.set_user_specialty_session(uuid, text)
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.get_user_specialty_session()
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.clear_user_specialty_session()
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.check_artifact_role_exists(integer, text)
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.submit_bid(integer, text, integer, integer, uuid, uuid, uuid)
  SET search_path TO pg_catalog, public;

-- `match_account_memories` uses pgvector; keep `extensions` in path.
ALTER FUNCTION public.match_account_memories(vector, double precision, integer, uuid, text)
  SET search_path TO pg_catalog, public, extensions;

ALTER FUNCTION public.match_account_memories(vector, uuid, text, double precision, integer)
  SET search_path TO pg_catalog, public, extensions;

ALTER FUNCTION public.get_specialty_site_agents(text)
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.update_inheritance_depth()
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.calculate_inheritance_depth(uuid)
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.update_email_messages_updated_at()
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.update_specialty_sites_updated_at()
  SET search_path TO pg_catalog, public;

ALTER FUNCTION public.update_email_credentials_updated_at()
  SET search_path TO pg_catalog, public;

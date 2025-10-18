-- Migration: Revoke anon SELECT on public.rfps
-- Purpose: Disable unauthenticated reads on rfps; authenticated role retains SELECT for RLS to filter rows.

BEGIN;

-- Ensure authenticated still has SELECT (no-op if already granted)
GRANT SELECT ON public.rfps TO authenticated;

-- Revoke anon to prevent unauthenticated reads
REVOKE SELECT ON public.rfps FROM anon;

COMMIT;

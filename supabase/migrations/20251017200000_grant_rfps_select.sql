-- Migration: Grant SELECT on public.rfps to authenticated (and anon if desired)
-- Timestamped to match project's migration naming convention

BEGIN;

GRANT SELECT ON public.rfps TO authenticated;

-- NOTE: If you don't want anonymous reads, remove the next line.
GRANT SELECT ON public.rfps TO anon;

COMMIT;

-- Migration: Grant SELECT on public.rfps to authenticated (and anon if desired)
-- Purpose: Ensure roles used by PostgREST have table-level SELECT privileges so RLS can filter rows.

BEGIN;

-- Grant SELECT to authenticated role so logged-in users can query rfps (RLS still limits rows)
GRANT SELECT ON public.rfps TO authenticated;

-- Optionally grant SELECT to anon if you want unauthenticated reads to be allowed.
-- Remove or comment out this line if anon reads should be denied.
GRANT SELECT ON public.rfps TO anon;

COMMIT;

-- Migration: Add specialty_site_id to sessions table for context isolation
-- This enables each specialty page to maintain independent session histories

-- 1. Add specialty_site_id column to sessions table
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS specialty_site_id UUID REFERENCES public.specialty_sites(id) ON DELETE SET NULL;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_specialty_site 
  ON public.sessions(specialty_site_id, created_at DESC);

-- 3. Backfill existing sessions to default specialty ('home')
UPDATE public.sessions 
SET specialty_site_id = (
  SELECT id FROM public.specialty_sites WHERE slug = 'home' LIMIT 1
)
WHERE specialty_site_id IS NULL;

-- 4. Add comment for documentation
COMMENT ON COLUMN public.sessions.specialty_site_id IS 'Links session to specialty site for context isolation (home, tmc, respond, etc.)';

-- 5. Optional: Make specialty_site_id NOT NULL after backfill
-- Uncomment below to enforce specialty association
-- ALTER TABLE public.sessions ALTER COLUMN specialty_site_id SET NOT NULL;

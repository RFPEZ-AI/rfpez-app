-- Add specialty_site_id to sessions table for specialty context isolation
-- Each session belongs to a specific specialty site (home, tmc, respond, etc.)

-- 1. Add specialty_site_id column with foreign key
ALTER TABLE public.sessions 
  ADD COLUMN specialty_site_id UUID REFERENCES public.specialty_sites(id) ON DELETE SET NULL;

-- 2. Create index for performance (filter sessions by specialty + recency)
CREATE INDEX idx_sessions_specialty_site 
  ON public.sessions(specialty_site_id, updated_at DESC);

-- 3. Backfill existing sessions to default specialty ('home')
UPDATE public.sessions 
SET specialty_site_id = (
  SELECT id FROM public.specialty_sites WHERE slug = 'home' LIMIT 1
)
WHERE specialty_site_id IS NULL;

-- 4. Add comment for documentation
COMMENT ON COLUMN public.sessions.specialty_site_id IS 
  'Foreign key to specialty_sites - isolates sessions per procurement vertical (home, tmc, respond, etc.)';

-- 5. Optional: Make NOT NULL after backfill (uncomment if you want strict enforcement)
-- ALTER TABLE public.sessions 
--   ALTER COLUMN specialty_site_id SET NOT NULL;

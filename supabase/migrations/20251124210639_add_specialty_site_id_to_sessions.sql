-- Add specialty_site_id column to sessions table
-- This allows sessions to be scoped to specific specialty sites (e.g., TMC, Municipal, etc.)

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS specialty_site_id UUID REFERENCES public.specialty_sites(id) ON DELETE SET NULL;

-- Add index for faster queries by specialty site
CREATE INDEX IF NOT EXISTS idx_sessions_specialty_site_id ON public.sessions(specialty_site_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.sessions.specialty_site_id IS 'Reference to the specialty site (e.g., TMC, Municipal) this session is associated with';

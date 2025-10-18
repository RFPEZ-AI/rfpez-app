-- Migration: Grant authenticated role privileges on public.agents
-- Timestamp: 2025-10-18 15:01:00

-- Ensure RLS remains enabled and grant table-level privileges to the 'authenticated' role
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    EXECUTE 'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY';
    -- Grant minimal table privileges to the authenticated role so that RLS policies can be evaluated
    -- Without these grants Postgres will return "permission denied for table agents" before RLS policies run.
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated';
  END IF;
END$$;

-- Migration: allow service_role DB role to bypass RLS for key tables
-- Adds permissive policies for the 'service_role' DB role on user_profiles and agents

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'service_role_full_access'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_full_access ON public.user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agents' AND policyname = 'service_role_full_access'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_full_access ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);';
  END IF;
END$$;

-- Ensure the policies take effect immediately (no-op if already enabled)
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;

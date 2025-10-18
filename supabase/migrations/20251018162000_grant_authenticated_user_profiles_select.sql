-- Migration: Grant authenticated role SELECT on public.user_profiles
-- Timestamp: 2025-10-18 16:20:00

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles') THEN
    EXECUTE 'GRANT SELECT ON public.user_profiles TO authenticated';
  END IF;
END$$;

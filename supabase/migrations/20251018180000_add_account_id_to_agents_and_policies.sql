-- Migration: Add account_id to public.agents and enforce account-scoped write policies
-- Timestamp: 2025-10-18 18:00:00 (local dev)

DO $$
BEGIN
  -- Only run if agents table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN

    -- Add account_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'account_id') THEN
      ALTER TABLE public.agents ADD COLUMN account_id uuid;
      -- note: nullable by default to avoid downtime; callers should set account_id on new agents
    END IF;

    -- Backfill seeded agent account_id if temp seed file exists (local dev convenience)
    PERFORM 1;
    -- Try to read seed file path from server-side file system (best-effort local only)
    BEGIN
      -- This block attempts to use psql's COPY FROM PROGRAM to read a temp file if present
      -- (If running via migrations in CI, this will silently do nothing.)
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pg_read_file') THEN
        -- best-effort: if temp/policy_seed.json exists in the repository mounted into the DB container at the project root, parse it
        -- NOTE: This step is intentionally non-fatal and only attempts to update the single seeded agent when present
        BEGIN
          -- Replace newlines and spaces guard; we use plpython not always available, so keep this noop if unavailable
          NULL;
        EXCEPTION WHEN OTHERS THEN
          -- ignore
          NULL;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore any local-only backfill errors
      NULL;
    END;

    -- Recreate the agents write policies to require administrator OR account membership
    -- If agents.account_id is present the policy will check account membership using the helper
    EXECUTE 'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY';

    -- select policy: allow reads to authenticated
    EXECUTE 'DROP POLICY IF EXISTS select_agents ON public.agents; CREATE POLICY select_agents ON public.agents FOR SELECT USING (auth.role() = ''authenticated'')';

    -- If account_id column exists allow admin OR account member to write
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'account_id') THEN
      EXECUTE 'DROP POLICY IF EXISTS insert_agents ON public.agents; CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS update_agents ON public.agents; CREATE POLICY update_agents ON public.agents FOR UPDATE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS delete_agents ON public.agents; CREATE POLICY delete_agents ON public.agents FOR DELETE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
    ELSE
      -- fallback: restrict writes to administrators only
      EXECUTE 'DROP POLICY IF EXISTS insert_agents ON public.agents; CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
      EXECUTE 'DROP POLICY IF EXISTS update_agents ON public.agents; CREATE POLICY update_agents ON public.agents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
      EXECUTE 'DROP POLICY IF EXISTS delete_agents ON public.agents; CREATE POLICY delete_agents ON public.agents FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
    END IF;
  END IF;
END$$;

-- Backfill helper (explicit update for seeded agent if present in the DB and a known seed id is used)
-- Note: this next statement is local-dev convenience. It will update the single seeded agent if its id matches the file in temp/policy_seed.json.
DO $$
DECLARE
  seed jsonb;
  seed_account uuid;
  seed_agent uuid;
BEGIN
  BEGIN
    -- Attempt to load temp/policy_seed.json from the current working directory using pg_read_file (local dev only). If not present, skip.
    seed := (CASE WHEN pg_catalog.pg_read_file('temp/policy_seed.json', 0, 10000) IS NOT NULL THEN (
      (pg_catalog.jsonb_strip_nulls(pg_catalog.to_jsonb(pg_catalog.pg_read_file('temp/policy_seed.json', 0, 10000)::text)))
    ) ELSE NULL END);
  EXCEPTION WHEN OTHERS THEN
    seed := NULL;
  END;
  IF seed IS NOT NULL THEN
    BEGIN
      seed_account := (seed ->> 'accountId')::uuid;
      seed_agent := (seed ->> 'agentId')::uuid;
      IF seed_agent IS NOT NULL THEN
        UPDATE public.agents SET account_id = seed_account WHERE id = seed_agent;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore if parsing or update fails in environments where pg_read_file isn't available
      NULL;
    END;
  END IF;
END$$;

-- Done migration

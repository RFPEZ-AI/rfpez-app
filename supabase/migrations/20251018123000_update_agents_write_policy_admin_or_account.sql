-- Migration: Update agents write policy to allow administrators or account members
-- Timestamp: 2025-10-18 12:30:00 (local dev)

-- Purpose:
-- - Ensure agents SELECT is available to authenticated users (already present but idempotent)
-- - Allow INSERT/UPDATE/DELETE on public.agents when either:
--     * the caller's user_profile has role = 'administrator', OR
--     * the caller is a member of the agents.account_id (via public.user_is_in_account)
-- - If the agents table lacks account_id, write operations are restricted to administrators only.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    -- enable RLS and ensure SELECT policy for authenticated users
    EXECUTE 'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_agents ON public.agents; CREATE POLICY select_agents ON public.agents FOR SELECT USING (auth.role() = ''authenticated'')';

    -- If agents has account_id column, allow admins OR account members to write
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'account_id') THEN
      EXECUTE 'DROP POLICY IF EXISTS insert_agents ON public.agents; CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS update_agents ON public.agents; CREATE POLICY update_agents ON public.agents FOR UPDATE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS delete_agents ON public.agents; CREATE POLICY delete_agents ON public.agents FOR DELETE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
    ELSE
      -- If no account_id column, restrict writes to administrators only
      EXECUTE 'DROP POLICY IF EXISTS insert_agents ON public.agents; CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
      EXECUTE 'DROP POLICY IF EXISTS update_agents ON public.agents; CREATE POLICY update_agents ON public.agents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
      EXECUTE 'DROP POLICY IF EXISTS delete_agents ON public.agents; CREATE POLICY delete_agents ON public.agents FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator''))';
    END IF;
  END IF;
END$$;

-- End migration

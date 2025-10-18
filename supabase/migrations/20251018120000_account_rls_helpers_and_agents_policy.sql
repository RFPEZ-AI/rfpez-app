-- Migration: Account RLS helpers and agents public-read policy
-- Timestamp: 2025-10-18 12:00:00 (local dev)

-- Purpose:
-- 1) Provide a small helper function `user_is_in_account(account_id, user_id)` that RLS policies
--    can call to check membership. This centralizes logic and makes policies easier to maintain.
-- 2) Apply account-based RLS policies for common tables (rfps, artifacts, messages, memory)
--    that forward to the helper function.
-- 3) Create an explicit SELECT policy on public.agents that allows any authenticated user
--    to read/search agents (the requested exception).

-- NOTE: This migration intentionally only creates/updates RLS policies and a helper function.
--       It does not modify existing data. Review policies before applying in production.

-- 1) Helper function to check account membership
CREATE OR REPLACE FUNCTION public.user_is_in_account(p_account uuid, p_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_user IS NULL THEN
    -- default to the caller's authenticated uid
    p_user := auth.uid();
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = p_account
      AND au.user_id = p_user
  );
END;
$$;
-- 2) Ensure RLS is enabled and create policies for shared tables using the helper

-- Helper to conditionally create policies only when the table exists
-- This avoids errors when optional tables (like `memory`) are not present in a schema

DO $$
BEGIN
  -- rfps
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfps') THEN
    EXECUTE 'ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_rfps ON public.rfps; CREATE POLICY select_rfps ON public.rfps FOR SELECT USING (public.user_is_in_account(rfps.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS insert_rfps ON public.rfps; CREATE POLICY insert_rfps ON public.rfps FOR INSERT WITH CHECK (public.user_is_in_account(rfps.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS update_rfps ON public.rfps; CREATE POLICY update_rfps ON public.rfps FOR UPDATE USING (public.user_is_in_account(rfps.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS delete_rfps ON public.rfps; CREATE POLICY delete_rfps ON public.rfps FOR DELETE USING (public.user_is_in_account(rfps.account_id))';
  END IF;

  -- artifacts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artifacts') THEN
    EXECUTE 'ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_artifacts ON public.artifacts; CREATE POLICY select_artifacts ON public.artifacts FOR SELECT USING (public.user_is_in_account(artifacts.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS insert_artifacts ON public.artifacts; CREATE POLICY insert_artifacts ON public.artifacts FOR INSERT WITH CHECK (public.user_is_in_account(artifacts.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS update_artifacts ON public.artifacts; CREATE POLICY update_artifacts ON public.artifacts FOR UPDATE USING (public.user_is_in_account(artifacts.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS delete_artifacts ON public.artifacts; CREATE POLICY delete_artifacts ON public.artifacts FOR DELETE USING (public.user_is_in_account(artifacts.account_id))';
  END IF;

  -- messages
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    EXECUTE 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_messages ON public.messages; CREATE POLICY select_messages ON public.messages FOR SELECT USING (public.user_is_in_account(messages.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS insert_messages ON public.messages; CREATE POLICY insert_messages ON public.messages FOR INSERT WITH CHECK (public.user_is_in_account(messages.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS update_messages ON public.messages; CREATE POLICY update_messages ON public.messages FOR UPDATE USING (public.user_is_in_account(messages.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS delete_messages ON public.messages; CREATE POLICY delete_messages ON public.messages FOR DELETE USING (public.user_is_in_account(messages.account_id))';
  END IF;

  -- memory (if present)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memory') THEN
    EXECUTE 'ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_memory ON public.memory; CREATE POLICY select_memory ON public.memory FOR SELECT USING (public.user_is_in_account(memory.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS insert_memory ON public.memory; CREATE POLICY insert_memory ON public.memory FOR INSERT WITH CHECK (public.user_is_in_account(memory.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS update_memory ON public.memory; CREATE POLICY update_memory ON public.memory FOR UPDATE USING (public.user_is_in_account(memory.account_id))';
    EXECUTE 'DROP POLICY IF EXISTS delete_memory ON public.memory; CREATE POLICY delete_memory ON public.memory FOR DELETE USING (public.user_is_in_account(memory.account_id))';
  END IF;
END$$;

-- 3) Agents table: allow all authenticated users to SELECT (read / search), but keep writes restricted
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
    -- enable RLS and allow authenticated users to read/search
    EXECUTE 'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS select_agents ON public.agents; CREATE POLICY select_agents ON public.agents FOR SELECT USING (auth.role() = ''authenticated'')';

    -- Only create write policies if agents table has an account_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'account_id') THEN
      -- Allow administrators OR account members to insert/update/delete agents
      EXECUTE 'DROP POLICY IF EXISTS insert_agents ON public.agents; CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS update_agents ON public.agents; CREATE POLICY update_agents ON public.agents FOR UPDATE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
      EXECUTE 'DROP POLICY IF EXISTS delete_agents ON public.agents; CREATE POLICY delete_agents ON public.agents FOR DELETE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = ''administrator'')) OR COALESCE(public.user_is_in_account(agents.account_id), false))';
    END IF;
  END IF;
END$$;

-- End migration

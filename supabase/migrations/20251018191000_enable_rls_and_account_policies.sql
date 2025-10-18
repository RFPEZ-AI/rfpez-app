BEGIN;

ALTER TABLE IF EXISTS public.rfps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_rfps ON public.rfps;
CREATE POLICY select_rfps ON public.rfps FOR SELECT
  USING ( public.user_is_in_account(account_id, NULL) OR (account_id IS NULL AND is_public = TRUE) );
DROP POLICY IF EXISTS insert_rfps ON public.rfps;
CREATE POLICY insert_rfps ON public.rfps FOR INSERT WITH CHECK ( public.user_is_in_account(account_id, NULL) );
DROP POLICY IF EXISTS update_rfps ON public.rfps;
CREATE POLICY update_rfps ON public.rfps FOR UPDATE USING ( public.user_is_in_account(account_id, NULL) );
DROP POLICY IF EXISTS delete_rfps ON public.rfps;
CREATE POLICY delete_rfps ON public.rfps FOR DELETE USING ( public.user_is_in_account(account_id, NULL) );

ALTER TABLE IF EXISTS public.bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_bids ON public.bids;
CREATE POLICY select_bids ON public.bids FOR SELECT USING ( public.user_is_in_account(account_id, NULL) );
DROP POLICY IF EXISTS insert_bids ON public.bids;
CREATE POLICY insert_bids ON public.bids FOR INSERT WITH CHECK ( public.user_is_in_account(account_id, NULL) );
DROP POLICY IF EXISTS update_bids ON public.bids;
CREATE POLICY update_bids ON public.bids FOR UPDATE USING ( public.user_is_in_account(account_id, NULL) );
DROP POLICY IF EXISTS delete_bids ON public.bids;
CREATE POLICY delete_bids ON public.bids FOR DELETE USING ( public.user_is_in_account(account_id, NULL) );

ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_sessions ON public.sessions;
CREATE POLICY select_sessions ON public.sessions FOR SELECT
  USING ( public.user_is_in_account(account_id, NULL) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS insert_sessions ON public.sessions;
CREATE POLICY insert_sessions ON public.sessions FOR INSERT WITH CHECK ( public.user_is_in_account(account_id, NULL) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS update_sessions ON public.sessions;
CREATE POLICY update_sessions ON public.sessions FOR UPDATE USING ( public.user_is_in_account(account_id, NULL) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS delete_sessions ON public.sessions;
CREATE POLICY delete_sessions ON public.sessions FOR DELETE USING ( public.user_is_in_account(account_id, NULL) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );

ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_messages ON public.messages;
CREATE POLICY select_messages ON public.messages FOR SELECT
  USING ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS insert_messages ON public.messages;
CREATE POLICY insert_messages ON public.messages FOR INSERT WITH CHECK ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS update_messages ON public.messages;
CREATE POLICY update_messages ON public.messages FOR UPDATE USING ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS delete_messages ON public.messages;
CREATE POLICY delete_messages ON public.messages FOR DELETE USING ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );

ALTER TABLE IF EXISTS public.artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_artifacts ON public.artifacts;
CREATE POLICY select_artifacts ON public.artifacts FOR SELECT
  USING ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS insert_artifacts ON public.artifacts;
CREATE POLICY insert_artifacts ON public.artifacts FOR INSERT WITH CHECK ( session_id IN (
  SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS update_artifacts ON public.artifacts;
CREATE POLICY update_artifacts ON public.artifacts FOR UPDATE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS delete_artifacts ON public.artifacts;
CREATE POLICY delete_artifacts ON public.artifacts FOR DELETE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );

ALTER TABLE IF EXISTS public.session_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_session_artifacts ON public.session_artifacts;
CREATE POLICY select_session_artifacts ON public.session_artifacts FOR SELECT USING (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL))
);
DROP POLICY IF EXISTS insert_session_artifacts ON public.session_artifacts;
CREATE POLICY insert_session_artifacts ON public.session_artifacts FOR INSERT WITH CHECK (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL))
);
DROP POLICY IF EXISTS delete_session_artifacts ON public.session_artifacts;
CREATE POLICY delete_session_artifacts ON public.session_artifacts FOR DELETE USING (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id, NULL))
);

ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_agents ON public.agents;
CREATE POLICY select_agents ON public.agents FOR SELECT
  USING ( is_restricted = FALSE OR public.user_is_in_account(account_id, NULL) OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = 'administrator') );

DROP POLICY IF EXISTS service_role_full_access ON public.agents;
CREATE POLICY service_role_full_access ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;

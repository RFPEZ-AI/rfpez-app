-- RLS Policy Updates for Account-Based Access Control

-- Example for rfps table
DROP POLICY IF EXISTS select_rfps ON public.rfps;
CREATE POLICY select_rfps ON public.rfps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = rfps.account_id
        AND account_users.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS insert_rfps ON public.rfps;
CREATE POLICY insert_rfps ON public.rfps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = rfps.account_id
        AND account_users.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS update_rfps ON public.rfps;
CREATE POLICY update_rfps ON public.rfps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = rfps.account_id
        AND account_users.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS delete_rfps ON public.rfps;
CREATE POLICY delete_rfps ON public.rfps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = rfps.account_id
        AND account_users.user_id = auth.uid()
    )
  );

-- Repeat similar policies for artifacts, messages, memory tables
-- Example for artifacts table
DROP POLICY IF EXISTS select_artifacts ON public.artifacts;
CREATE POLICY select_artifacts ON public.artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = artifacts.account_id
        AND account_users.user_id = auth.uid()
    )
  );

-- End RLS policy migration

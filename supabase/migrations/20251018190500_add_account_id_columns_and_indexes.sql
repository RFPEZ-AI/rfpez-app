-- Migration: Add account_id columns and indexes (nullable initial)
-- Filename timestamp: 20251018190500
BEGIN;

ALTER TABLE IF EXISTS public.rfps    ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.bids    ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.artifacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.session_artifacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);

CREATE TABLE IF NOT EXISTS public.supplier_accounts (
  supplier_id INTEGER REFERENCES public.supplier_profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (supplier_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_rfps_account_id ON public.rfps USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_bids_account_id ON public.bids USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON public.sessions USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_account_id ON public.messages USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_account_id ON public.artifacts USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_agents_account_id ON public.agents USING btree(account_id);

COMMIT;

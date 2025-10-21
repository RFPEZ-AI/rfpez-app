-- Emergency fix: Add missing account_id columns that should have been added by 20251017121400
-- This migration adds the columns that the remote database is missing

BEGIN;

-- Ensure accounts table exists first
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add account_id columns to all tables (idempotent - safe to run multiple times)
ALTER TABLE IF EXISTS public.rfps ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.artifacts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.agents ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.bids ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.session_artifacts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_rfps_account_id ON public.rfps(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_account_id ON public.messages(account_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_account_id ON public.artifacts(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON public.sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_agents_account_id ON public.agents(account_id);
CREATE INDEX IF NOT EXISTS idx_bids_account_id ON public.bids(account_id);
CREATE INDEX IF NOT EXISTS idx_session_artifacts_account_id ON public.session_artifacts(account_id);

COMMIT;

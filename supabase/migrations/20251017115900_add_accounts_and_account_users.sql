-- Migration: Add accounts and account_users tables, add account_id to shared tables

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create account_users join table
CREATE TABLE IF NOT EXISTS public.account_users (
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, user_id)
);

-- Add account_id to shared tables if those tables exist in this database
ALTER TABLE IF EXISTS public.rfps ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.artifacts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.memory ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id);

-- 4. Remove direct account_id from users table if present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        EXECUTE 'ALTER TABLE public.users DROP COLUMN IF EXISTS account_id';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfps') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_rfps_account_id ON public.rfps(account_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artifacts') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_artifacts_account_id ON public.artifacts(account_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_account_id ON public.messages(account_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memory') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_memory_account_id ON public.memory(account_id)';
    END IF;
END$$;

-- End migration

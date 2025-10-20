-- Emergency fix: Ensure account_users table exists before RLS policies reference it
-- This migration creates account_users if it doesn't exist (idempotent)
-- Migration: 20251020013000_ensure_account_users_exists.sql

BEGIN;

-- Create accounts table if doesn't exist (from 20251017115900)
CREATE TABLE IF NOT EXISTS public.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create account_users join table if doesn't exist (from 20251017115900)
CREATE TABLE IF NOT EXISTS public.account_users (
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, user_id)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);

-- Grant basic permissions
GRANT SELECT ON public.accounts TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_users TO authenticated;
GRANT SELECT ON public.account_users TO anon;

COMMIT;

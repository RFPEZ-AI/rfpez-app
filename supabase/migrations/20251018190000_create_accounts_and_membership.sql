-- Migration: Create accounts and user_accounts (membership)
-- Filename timestamp: 20251018190000
BEGIN;

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_profile_id, account_id)
);

-- Ensure update triggers exist (relies on update_updated_at_column function)
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to check membership for current authenticated user
CREATE OR REPLACE FUNCTION public.user_is_in_account(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_account_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_accounts ua
    JOIN public.user_profiles up ON ua.user_profile_id = up.id
    WHERE ua.account_id = p_account_id AND up.supabase_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMIT;

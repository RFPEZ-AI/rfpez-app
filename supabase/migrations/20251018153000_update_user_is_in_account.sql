-- Migration: Update user_is_in_account helper to support multiple account_users.user_id shapes
-- Timestamp: 2025-10-18 15:30:00

-- Replace the helper with a schema-robust implementation that checks common link patterns:
-- 1) account_users.user_id = auth.users.id (direct)
-- 2) account_users.user_id = user_profiles.id where user_profiles.supabase_user_id = auth.uid()
-- 3) account_users.user_id = user_profiles.supabase_user_id where account_users stores the supabase id directly

CREATE OR REPLACE FUNCTION public.user_is_in_account(p_account uuid, p_user uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user uuid := p_user;
BEGIN
  IF v_user IS NULL THEN
    v_user := auth.uid();
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.account_id = p_account
      AND (
        -- direct match (account_users.user_id stores auth.users.id)
        au.user_id = v_user
        -- or account_users.user_id stores user_profiles.id and matches a user_profiles record for this auth uid
        OR au.user_id IN (SELECT id FROM public.user_profiles up WHERE up.supabase_user_id = v_user)
        -- or account_users.user_id stores the supabase_user_id directly
        OR au.user_id IN (SELECT supabase_user_id FROM public.user_profiles up2 WHERE up2.supabase_user_id = v_user)
      )
  );
END;
$$;

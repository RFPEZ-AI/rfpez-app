-- Migration: Create user_profiles table and get/set current session functions
-- Date: 2025-10-15

-- 1. Create user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'administrator')),
  current_rfp_id INTEGER REFERENCES rfps(id) ON DELETE SET NULL,
  current_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add index for current_session_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_session_id ON public.user_profiles(current_session_id);

-- 3. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_optimized" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_optimized" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_optimized" ON public.user_profiles;

-- CREATE POLICY "Users can read own profile" ON public.user_profiles 
--   FOR SELECT USING (supabase_user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (supabase_user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (supabase_user_id = auth.uid());
CREATE POLICY "Users can delete own profile" ON public.user_profiles 
  FOR DELETE USING (supabase_user_id = auth.uid());

-- 5. set_user_current_session function
DROP FUNCTION IF EXISTS set_user_current_session(UUID, UUID);
CREATE OR REPLACE FUNCTION set_user_current_session(
  user_uuid UUID,
  session_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  IF user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  UPDATE public.user_profiles 
  SET current_session_id = session_uuid,
      updated_at = NOW()
  WHERE id = user_profile_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_user_current_session function
CREATE OR REPLACE FUNCTION get_user_current_session(
  user_uuid UUID
)
RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  SELECT current_session_id INTO session_uuid
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

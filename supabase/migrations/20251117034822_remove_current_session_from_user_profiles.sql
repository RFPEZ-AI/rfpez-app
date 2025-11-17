-- Remove current_session_id from user_profiles table
-- Session context now managed per-specialty via localStorage instead of global user profile

-- 1. Drop RPC functions that manage current_session_id
DROP FUNCTION IF EXISTS public.set_user_current_session(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_current_session(UUID);

-- 2. Drop the current_session_id column from user_profiles
ALTER TABLE public.user_profiles 
  DROP COLUMN IF EXISTS current_session_id;

-- 3. Add comment for migration history
COMMENT ON TABLE public.user_profiles IS 
  'User profile data. Session context now managed per-specialty via localStorage (removed current_session_id 2025-11-17)';

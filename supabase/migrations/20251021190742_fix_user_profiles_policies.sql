-- Fix user_profiles RLS Policies
-- Issue: Policies too restrictive, causing 406/403 errors on profile queries
-- Solution: Keep simple policies but ensure service_role can bypass

-- Drop duplicate/conflicting policies
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Keep only the working policies from our previous migration
-- (select_user_profiles, insert_user_profiles, update_user_profiles, delete_user_profiles)
-- These are already in place and working correctly

-- Ensure get_user_current_session function has correct search_path
-- (It should be set correctly already, but verify)
ALTER FUNCTION get_user_current_session(uuid) SET search_path = 'public';

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION get_user_current_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_session(uuid) TO service_role;

-- Ensure anon key can query user_profiles (needed for initial profile creation)
GRANT SELECT ON user_profiles TO anon;
GRANT INSERT ON user_profiles TO anon;

COMMENT ON TABLE user_profiles IS 
'User profiles with simplified RLS policies - fixed 406/403 errors';

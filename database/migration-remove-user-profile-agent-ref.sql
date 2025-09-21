-- Migration: Remove current_agent_id from user_profiles
-- Date: September 19, 2025
-- Description: 
-- Remove current_agent_id from user_profiles table since agent context
-- should be derived from the current session's agent instead of being
-- directly stored on the user profile.

-- ====================================================================
-- STEP 1: Remove current_agent_id from user_profiles
-- ====================================================================

-- Drop the foreign key constraint first
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_current_agent_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_user_profiles_current_agent_id;

-- Remove the column
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS current_agent_id;

-- ====================================================================
-- STEP 2: Update the set_user_current_context function
-- ====================================================================

-- Update the function to remove agent parameter since it's session-based now
CREATE OR REPLACE FUNCTION set_user_current_context(
  user_uuid UUID,
  session_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Find the user profile ID from the supabase user ID
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;
    RETURN FALSE;
  END IF;
  
  -- Update the user profile with current session only
  UPDATE public.user_profiles 
  SET 
    current_session_id = COALESCE(session_uuid, current_session_id),
    updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user context: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 3: Add helper function to get user's current agent via session
-- ====================================================================

-- Create a function to get the user's current agent through their session
CREATE OR REPLACE FUNCTION get_user_current_agent(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  current_agent_id UUID;
BEGIN
  -- Get the current agent from the user's current session
  SELECT s.current_agent_id INTO current_agent_id
  FROM public.user_profiles up
  JOIN public.sessions s ON up.current_session_id = s.id
  WHERE up.supabase_user_id = user_uuid;
  
  RETURN current_agent_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 4: Update comments for documentation
-- ====================================================================

COMMENT ON COLUMN public.user_profiles.current_session_id IS 'Reference to the user''s currently active session (agent context derived from session)';
COMMENT ON FUNCTION get_user_current_agent(UUID) IS 'Gets the user''s current agent ID via their current session';

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Verify the schema changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;
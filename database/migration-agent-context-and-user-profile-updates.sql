-- Migration: Agent Context and User Profile Updates
-- Date: September 19, 2025
-- Description: 
-- 1. Add current_agent_id to user_profiles for global agent preference
-- 2. Add current_agent_id to sessions for session-specific agent context
-- 3. Remove current_rfp_id from user_profiles (RFP context moved to session-only)

-- ====================================================================
-- STEP 1: Add current_agent_id to user_profiles
-- ====================================================================

-- Add current_agent_id column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Add index for better performance when querying by current agent
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_agent_id ON public.user_profiles(current_agent_id);

-- ====================================================================
-- STEP 2: Add current_agent_id to sessions
-- ====================================================================

-- Add current_agent_id column to sessions table (if not already exists)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS current_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Add index for better performance when querying by session agent
CREATE INDEX IF NOT EXISTS idx_sessions_current_agent_id ON public.sessions(current_agent_id);

-- ====================================================================
-- STEP 3: Remove current_rfp_id from user_profiles
-- ====================================================================

-- Note: This is a breaking change. Make sure to migrate any existing current_rfp_id 
-- values to session context before running this migration in production.

-- Drop the foreign key constraint first
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_current_rfp_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_user_profiles_current_rfp_id;

-- Remove the column
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS current_rfp_id;

-- ====================================================================
-- STEP 4: Update triggers and functions
-- ====================================================================

-- Update the function for setting user context to include agent
CREATE OR REPLACE FUNCTION set_user_current_context(
  user_uuid UUID,
  session_uuid UUID DEFAULT NULL,
  agent_uuid UUID DEFAULT NULL
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
  
  -- Update the user profile with current session and/or agent
  UPDATE public.user_profiles 
  SET 
    current_session_id = COALESCE(session_uuid, current_session_id),
    current_agent_id = COALESCE(agent_uuid, current_agent_id),
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
-- STEP 5: Update session context function
-- ====================================================================

-- Update the session context update function to handle agent context
CREATE OR REPLACE FUNCTION update_session_context_with_agent(
  session_uuid UUID,
  rfp_id_param INTEGER DEFAULT NULL,
  artifact_id_param UUID DEFAULT NULL,
  agent_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.sessions 
  SET 
    current_rfp_id = COALESCE(rfp_id_param, current_rfp_id),
    current_artifact_id = COALESCE(artifact_id_param, current_artifact_id),
    current_agent_id = COALESCE(agent_id_param, current_agent_id),
    updated_at = NOW()
  WHERE id = session_uuid;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating session context: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 6: Add comments for documentation
-- ====================================================================

COMMENT ON COLUMN public.user_profiles.current_agent_id IS 'Reference to the user''s preferred default agent';
COMMENT ON COLUMN public.user_profiles.current_session_id IS 'Reference to the user''s currently active session';
COMMENT ON COLUMN public.sessions.current_agent_id IS 'Reference to the agent being used in this session';

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Verify the schema changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sessions' AND table_schema = 'public'
-- ORDER BY ordinal_position;
-- Migration: Add current_session_id to user_profiles table
-- Date: 2025-09-17
-- Description: Adds current_session_id field to user_profiles to persist the active session

-- Add current_session_id column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;

-- Add an index for better performance when querying by current session
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_session_id ON public.user_profiles(current_session_id);

-- Create a function to update current session for a user
CREATE OR REPLACE FUNCTION set_user_current_session(
  user_uuid UUID,
  session_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get the user profile ID from supabase_user_id
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  IF user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the current session
  UPDATE public.user_profiles 
  SET current_session_id = session_uuid,
      updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current session for a user
CREATE OR REPLACE FUNCTION get_user_current_session(
  user_uuid UUID
)
RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  -- Get the current session ID from user profile
  SELECT current_session_id INTO session_uuid
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test query to verify the migration
SELECT 'current_session_id migration completed successfully' as status;
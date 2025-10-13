-- Copyright Mark Skiba, 2025 All rights reserved
-- Migration: Allow null values for set_user_current_session to enable clearing current session

-- Update the function to accept null session_uuid
CREATE OR REPLACE FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- Update the current session (can be NULL to clear it)
  UPDATE public.user_profiles 
  SET current_session_id = session_uuid,
      updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
END;
$function$;

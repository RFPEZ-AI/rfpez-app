-- Fix get_user_current_session function to correctly validate session ownership
-- Bug: Function was comparing sessions.user_id (which references auth.users.id) 
--      with user_profiles.id (profile ID), causing session restoration to always fail
-- Fix: Compare sessions.user_id with user_uuid (auth.users.id) instead

CREATE OR REPLACE FUNCTION public.get_user_current_session(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    session_id_var uuid;
    profile_id_var uuid;
BEGIN
    -- First get the user profile ID from the Supabase auth user ID
    SELECT id INTO profile_id_var
    FROM user_profiles 
    WHERE supabase_user_id = user_uuid;
    
    -- If no profile found, return null
    IF profile_id_var IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get the current_session_id from user_profiles using the profile ID
    SELECT current_session_id INTO session_id_var
    FROM user_profiles 
    WHERE id = profile_id_var;
    
    -- If current_session_id is not null and the session exists, return it
    -- FIXED: Compare with user_uuid (auth.users.id) not profile_id_var (user_profiles.id)
    -- because sessions.user_id references auth.users.id
    IF session_id_var IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM sessions WHERE id = session_id_var AND user_id = user_uuid) THEN
            RETURN session_id_var;
        END IF;
    END IF;
    
    -- Otherwise, get the most recent session for this user
    -- FIXED: Compare with user_uuid (auth.users.id) not profile_id_var
    SELECT id INTO session_id_var
    FROM sessions 
    WHERE user_id = user_uuid
    ORDER BY updated_at DESC, created_at DESC 
    LIMIT 1;
    
    -- Update the user profile with this session ID
    IF session_id_var IS NOT NULL THEN
        UPDATE user_profiles 
        SET current_session_id = session_id_var 
        WHERE id = profile_id_var;
    END IF;
    
    RETURN session_id_var;
END;
$function$;

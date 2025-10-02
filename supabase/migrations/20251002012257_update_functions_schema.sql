set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_bid_response(bid_id_param integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
  -- Try new schema first - get submission data from linked artifact
  SELECT s.submission_data INTO result
  FROM public.bids b
  JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id
  WHERE b.id = bid_id_param;
  
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- Fallback to legacy schema
  SELECT response INTO result
  FROM public.bids 
  WHERE id = bid_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT submission_data INTO result
  FROM public.artifact_submissions
  WHERE artifact_id = artifact_id_param
  AND (session_id_param IS NULL OR session_id = session_id_param)
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_rfp_artifacts(rfp_id_param integer)
 RETURNS TABLE(artifact_id text, artifact_name text, artifact_type text, artifact_role text, schema jsonb, ui_schema jsonb, form_data jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as artifact_id,
    a.name as artifact_name,
    a.type as artifact_type,
    ra.role as artifact_role,
    a.schema,
    a.ui_schema,
    a.form_data,
    a.created_at
  FROM public.artifacts a
  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
  AND a.status = 'active'
  ORDER BY ra.role, a.created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_current_agent(user_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_current_session(user_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    IF session_id_var IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM sessions WHERE id = session_id_var AND user_id = profile_id_var) THEN
            RETURN session_id_var;
        END IF;
    END IF;
    
    -- Otherwise, get the most recent session for this user (using profile ID)
    SELECT id INTO session_id_var
    FROM sessions 
    WHERE user_id = profile_id_var 
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid, agent_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid)
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
  
  -- Update the current session
  UPDATE public.user_profiles 
  SET current_session_id = session_uuid,
      updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_artifact_submissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer DEFAULT NULL::integer, artifact_id_param uuid DEFAULT NULL::uuid, agent_id_param uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;



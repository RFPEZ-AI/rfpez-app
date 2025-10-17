set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.agent_memories
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer DEFAULT NULL::integer, expires_hours integer DEFAULT 72)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  token_data JSONB;
  encoded_token TEXT;
BEGIN
  -- Create token payload
  token_data := jsonb_build_object(
    'rfp_id', rfp_id_param,
    'supplier_id', supplier_id_param,
    'exp', extract(epoch from (now() + make_interval(hours => expires_hours))),
    'iat', extract(epoch from now()),
    'type', 'bid_submission'
  );
  
  -- In a real implementation, this would be signed with a secret
  -- For now, we'll just base64 encode it (NOT SECURE - just for demo)
  encoded_token := encode(token_data::text::bytea, 'base64');
  
  RETURN encoded_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_bid_response(bid_id_param integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.get_form_data(artifact_id_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Try draft_data first, fallback to default_values
  SELECT COALESCE(draft_data, default_values, '{}') INTO result
  FROM public.artifacts 
  WHERE id = artifact_id_param AND status = 'active';
  
  RETURN COALESCE(result, '{}');
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.get_memory_statistics(p_user_id uuid, p_agent_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_memories bigint, memory_type text, count bigint, avg_importance double precision)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) OVER() as total_memories,
    m.memory_type,
    COUNT(*) as count,
    AVG(m.importance_score) as avg_importance
  FROM public.agent_memories m
  WHERE m.user_id = p_user_id
    AND (p_agent_id IS NULL OR m.agent_id = p_agent_id)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  GROUP BY m.memory_type
  ORDER BY count DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_rfp_artifacts(rfp_id_param integer)
 RETURNS TABLE(artifact_id text, artifact_name text, artifact_type text, artifact_role text, schema jsonb, ui_schema jsonb, default_values jsonb, submit_action jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
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
    a.default_values,     -- Changed from form_data
    a.submit_action,      -- Added missing field
    a.created_at
  FROM public.artifacts a
  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
    AND a.status = 'active'
  ORDER BY ra.role, a.created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_rfp_bids(rfp_id_param integer)
 RETURNS TABLE(bid_id integer, rfp_id integer, supplier_id integer, status character varying, bid_amount numeric, currency character varying, submitted_at timestamp with time zone, delivery_date date, supplier_notes text, score numeric, ranking integer, form_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bid_id,
    b.rfp_id,
    b.supplier_id,
    b.status,
    b.bid_amount,
    b.currency,
    b.submitted_at,
    b.delivery_date,
    b.supplier_notes,
    b.score,
    b.ranking,
    COALESCE(s.submission_data, b.response) as form_data
  FROM public.bids b
  LEFT JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id
  WHERE b.rfp_id = rfp_id_param
  ORDER BY b.submitted_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_session_active_agent(session_uuid uuid)
 RETURNS TABLE(agent_id uuid, agent_name text, agent_instructions text, agent_initial_prompt text, agent_avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.instructions as agent_instructions,
    a.initial_prompt as agent_initial_prompt,
    a.avatar_url as agent_avatar_url
  FROM public.agents a
  INNER JOIN public.session_agents sa ON a.id = sa.agent_id
  WHERE sa.session_id = session_uuid 
    AND sa.is_active = true
    AND a.is_active = true
  ORDER BY sa.started_at DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sessions_with_stats(user_uuid uuid)
 RETURNS TABLE(id uuid, title text, description text, created_at timestamp with time zone, updated_at timestamp with time zone, message_count bigint, last_message text, last_message_at timestamp with time zone, artifact_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.created_at,
    s.updated_at,
    COALESCE(msg_stats.message_count, 0) as message_count,
    msg_stats.last_message,
    msg_stats.last_message_at,
    COALESCE(art_stats.artifact_count, 0) as artifact_count
  FROM public.sessions s
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as message_count,
      MAX(content) as last_message,
      MAX(created_at) as last_message_at
    FROM public.messages 
    WHERE role = 'user'
    GROUP BY session_id
  ) msg_stats ON s.id = msg_stats.session_id
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as artifact_count
    FROM public.artifacts
    GROUP BY session_id
  ) art_stats ON s.id = art_stats.session_id
  WHERE s.user_id = user_uuid AND s.is_archived = FALSE
  ORDER BY s.updated_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_current_agent(user_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.get_users_by_role(role_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, supabase_user_id uuid, email text, full_name text, avatar_url text, role text, last_login timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF role_filter IS NULL THEN
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    ORDER BY u.created_at DESC;
  ELSE
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    WHERE u.role = role_filter
    ORDER BY u.created_at DESC;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rank_bids_for_rfp(rfp_id_param integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  bid_record RECORD;
  current_rank INTEGER := 1;
BEGIN
  -- Rank bids by score (highest first), then by amount (lowest first)
  FOR bid_record IN
    SELECT id
    FROM public.bids
    WHERE rfp_id = rfp_id_param 
      AND status IN ('submitted', 'under_review', 'shortlisted')
    ORDER BY 
      COALESCE(score, 0) DESC,
      COALESCE(bid_amount, 999999999) ASC,
      submitted_at ASC
  LOOP
    UPDATE public.bids 
    SET ranking = current_rank, updated_at = NOW()
    WHERE id = bid_record.id;
    
    current_rank := current_rank + 1;
  END LOOP;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ranking bids: %', SQLERRM;
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_form_data(artifact_id_param text, form_data_param jsonb, user_id_param uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the artifact with draft data and save timestamp
  UPDATE public.artifacts 
  SET 
    draft_data = form_data_param,
    default_values = form_data_param, -- Also update default_values for backward compatibility
    last_saved_at = NOW(),
    save_count = COALESCE(save_count, 0) + 1,
    updated_at = NOW()
  WHERE id = artifact_id_param;
  
  -- Return true if row was updated
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error saving form data: %', SQLERRM;
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
$function$
;

CREATE OR REPLACE FUNCTION public.submit_bid(rfp_id_param integer, artifact_id_param text, supplier_id_param integer DEFAULT NULL::integer, agent_id_param integer DEFAULT NULL::integer, session_id_param uuid DEFAULT NULL::uuid, user_id_param uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  bid_id INTEGER;
  submission_id UUID;
  form_data JSONB;
  bid_amount_extracted DECIMAL(15,2);
  delivery_date_extracted DATE;
  supplier_notes_extracted TEXT;
BEGIN
  -- Get the latest form submission data
  SELECT submission_data INTO form_data
  FROM public.artifact_submissions
  WHERE artifact_id = artifact_id_param
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  -- If no submission found, get from artifact default_values
  IF form_data IS NULL THEN
    SELECT default_values INTO form_data
    FROM public.artifacts
    WHERE id = artifact_id_param;
  END IF;
  
  -- Extract key bid information from form data
  bid_amount_extracted := COALESCE((form_data->>'bid_amount')::DECIMAL, (form_data->>'amount')::DECIMAL, (form_data->>'price')::DECIMAL, (form_data->>'total_bid_amount')::DECIMAL, (form_data->>'unit_price_per_ton')::DECIMAL);
  delivery_date_extracted := COALESCE((form_data->>'delivery_date')::DATE, (form_data->>'deliveryDate')::DATE);
  supplier_notes_extracted := COALESCE(form_data->>'notes', form_data->>'comments', form_data->>'additional_information', form_data->>'additional_notes', form_data->>'supplier_notes');
  
  -- Create or update the bid record
  INSERT INTO public.bids (
    rfp_id, 
    agent_id, 
    supplier_id, 
    artifact_submission_id,
    status,
    submitted_at,
    bid_amount,
    delivery_date,
    supplier_notes,
    response,
    created_at,
    updated_at
  ) 
  VALUES (
    rfp_id_param,
    COALESCE(agent_id_param, 1),
    supplier_id_param,
    NULL,
    'submitted',
    NOW(),
    bid_amount_extracted,
    delivery_date_extracted,
    supplier_notes_extracted,
    form_data,
    NOW(),
    NOW()
  )
  RETURNING id INTO bid_id;
  
  -- Create artifact submission record
  INSERT INTO public.artifact_submissions (
    artifact_id,
    session_id,
    user_id,
    submission_data,
    form_version,
    metadata
  )
  VALUES (
    artifact_id_param,
    session_id_param,
    user_id_param,
    form_data,
    '1.0',
    jsonb_build_object(
      'bid_id', bid_id,
      'rfp_id', rfp_id_param,
      'submission_type', 'bid_submission',
      'extracted_amount', bid_amount_extracted
    )
  )
  RETURNING id INTO submission_id;
  
  -- Link the submission back to the bid
  UPDATE public.bids 
  SET artifact_submission_id = submission_id
  WHERE id = bid_id;
  
  -- Log successful submission
  RAISE NOTICE 'Bid submitted successfully: bid_id=%, submission_id=%', bid_id, submission_id;
  
  RETURN submission_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error submitting bid: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  session_user_id UUID;
BEGIN
  -- Verify the session belongs to the user
  SELECT user_id INTO session_user_id 
  FROM public.sessions 
  WHERE id = session_uuid;
  
  IF session_user_id != user_uuid THEN
    RETURN FALSE;
  END IF;
  
  -- Deactivate current agent
  UPDATE public.session_agents 
  SET is_active = false, ended_at = NOW()
  WHERE session_id = session_uuid AND is_active = true;
  
  -- Add new active agent
  INSERT INTO public.session_agents (session_id, agent_id, is_active)
  VALUES (session_uuid, new_agent_uuid, true);
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_get_bids(rfp_id_param integer)
 RETURNS SETOF bids
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM bids WHERE rfp_id = rfp_id_param ORDER BY created_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.update_artifact_save_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF OLD.draft_data IS DISTINCT FROM NEW.draft_data THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_artifact_submissions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_bid_status(bid_id_param integer, new_status character varying, status_reason_param text DEFAULT NULL::text, reviewer_id_param uuid DEFAULT NULL::uuid, score_param numeric DEFAULT NULL::numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  old_status VARCHAR(50);
BEGIN
  -- Get current status
  SELECT status INTO old_status FROM public.bids WHERE id = bid_id_param;
  
  -- Update bid status
  UPDATE public.bids 
  SET 
    status = new_status,
    status_reason = status_reason_param,
    reviewer_id = reviewer_id_param,
    score = score_param,
    reviewed_at = CASE WHEN new_status IN ('accepted', 'rejected', 'shortlisted') THEN NOW() ELSE reviewed_at END,
    updated_at = NOW()
  WHERE id = bid_id_param;
  
  RETURN FOUND;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating bid status: %', SQLERRM;
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_memory_access(p_memory_id uuid, p_session_id uuid DEFAULT NULL::uuid, p_agent_id uuid DEFAULT NULL::uuid, p_relevance_score double precision DEFAULT NULL::double precision)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update the memory record
  UPDATE public.agent_memories
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_memory_id;
  
  -- Log the access
  INSERT INTO public.memory_access_log (
    memory_id,
    session_id,
    agent_id,
    relevance_score
  )
  VALUES (
    p_memory_id,
    p_session_id,
    p_agent_id,
    p_relevance_score
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer DEFAULT NULL::integer, artifact_id_param uuid DEFAULT NULL::uuid, agent_id_param uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.validate_form_spec(spec jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Basic validation that form_spec has required structure
  RETURN (
    spec IS NULL OR (
      jsonb_typeof(spec) = 'object' AND
      spec ? 'version' AND
      spec ? 'schema' AND
      jsonb_typeof(spec->'schema') = 'object'
    )
  );
END;
$function$
;




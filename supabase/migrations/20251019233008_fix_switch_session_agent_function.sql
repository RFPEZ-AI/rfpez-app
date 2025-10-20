-- Fix switch_session_agent function to:
-- 1. Include started_at timestamp when creating session_agents record
-- 2. Update sessions.current_agent_id to keep it in sync
-- 3. Include explicit id column to avoid primary key issues

CREATE OR REPLACE FUNCTION public.switch_session_agent(
  session_uuid uuid, 
  new_agent_uuid uuid,
  user_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
  
  -- Add new active agent with started_at timestamp
  INSERT INTO public.session_agents (id, session_id, agent_id, is_active, started_at)
  VALUES (gen_random_uuid(), session_uuid, new_agent_uuid, true, NOW());
  
  -- Update the session's current_agent_id to keep it in sync
  UPDATE public.sessions
  SET current_agent_id = new_agent_uuid
  WHERE id = session_uuid;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.switch_session_agent(uuid, uuid, uuid) TO authenticated;

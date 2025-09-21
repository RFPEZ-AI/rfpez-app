-- Update get_session_active_agent function to include role field
-- This migration updates the database function to return the agent role

CREATE OR REPLACE FUNCTION get_session_active_agent(session_uuid UUID)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  agent_role TEXT,
  agent_instructions TEXT,
  agent_initial_prompt TEXT,
  agent_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.role as agent_role,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Update get_specialty_site_agents to include is_free and is_restricted flags
-- This enables authentication-aware agent filtering in the frontend

-- Drop the existing function
DROP FUNCTION IF EXISTS get_specialty_site_agents(text);

-- Recreate with additional columns
CREATE OR REPLACE FUNCTION get_specialty_site_agents(site_slug text)
RETURNS TABLE(
  agent_id uuid,
  agent_name text,
  agent_description text,
  agent_instructions text,
  agent_initial_prompt text,
  agent_avatar_url text,
  is_active boolean,
  is_default boolean,
  sort_order integer,
  is_free boolean,
  is_restricted boolean,
  role text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.instructions,
    a.initial_prompt,
    a.avatar_url,
    a.is_active,
    ssa.is_default_agent,
    ssa.sort_order,
    a.is_free,
    a.is_restricted,
    a.role
  FROM agents a
  INNER JOIN specialty_site_agents ssa ON a.id = ssa.agent_id
  INNER JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE ss.slug = site_slug
    AND ss.is_active = true
    AND a.is_active = true
  ORDER BY ssa.sort_order, a.name;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT agent_name, is_free, is_restricted, role, is_default, sort_order 
-- FROM get_specialty_site_agents('tmc');

-- Migration: Update get_specialty_site_agents to filter out abstract agents
-- Author: AI Assistant
-- Date: 2024-12-01
-- Description: 
--   Update the get_specialty_site_agents function to exclude agents with is_abstract=true
--   This prevents parent agents (Solutions, Sourcing) from appearing in specialty sites

CREATE OR REPLACE FUNCTION public.get_specialty_site_agents(site_slug text)
 RETURNS TABLE(agent_id uuid, agent_name text, agent_description text, agent_instructions text, agent_initial_prompt text, agent_avatar_url text, is_active boolean, is_default boolean, sort_order integer, is_free boolean, is_restricted boolean, role text)
 LANGUAGE plpgsql
AS $function$
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
    AND (a.is_abstract IS NULL OR a.is_abstract = false) -- Filter out abstract parent agents
  ORDER BY ssa.sort_order, a.name;
END;
$function$;

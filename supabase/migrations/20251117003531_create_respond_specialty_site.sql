-- Create Respond Specialty Site
-- Created: 2025-11-17
-- Purpose: Create /respond specialty site for supplier bid responses

DO $$
DECLARE
  respond_site_id UUID;
BEGIN
  -- Insert specialty site
  INSERT INTO specialty_sites (slug, name, description)
  VALUES (
    'respond',
    'Bid Response',
    'Help suppliers respond to RFP bid requests. Upload previous bids, track response status, and create competitive proposals.'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO respond_site_id;
  
  -- If site already exists, get its ID
  IF respond_site_id IS NULL THEN
    SELECT id INTO respond_site_id FROM specialty_sites WHERE slug = 'respond';
  END IF;

  -- Insert site agents
  -- Respond (default agent)
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  SELECT 
    respond_site_id,
    id,
    true,
    0
  FROM agents
  WHERE name = 'Respond'
  ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

  -- Solutions (sales support)
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  SELECT 
    respond_site_id,
    id,
    false,
    1
  FROM agents
  WHERE name = 'Solutions'
  ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

  -- Support (technical help)
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  SELECT 
    respond_site_id,
    id,
    false,
    2
  FROM agents
  WHERE name = 'Support'
  ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;
END $$;

-- Verify configuration
DO $$
BEGIN
  RAISE NOTICE 'Respond specialty site configuration:';
END $$;

SELECT 
  ss.slug,
  ss.name as site_name,
  a.name as agent_name,
  a.role,
  ssa.is_default_agent,
  ssa.sort_order
FROM specialty_sites ss
JOIN specialty_site_agents ssa ON ss.id = ssa.specialty_site_id
JOIN agents a ON ssa.agent_id = a.id
WHERE ss.slug = 'respond'
ORDER BY ssa.sort_order;

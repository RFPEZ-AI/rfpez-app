-- Create Respond Specialty Site
-- Created: 2025-11-17
-- Purpose: Create /respond specialty site for supplier bid responses

-- Insert specialty site
INSERT INTO specialty_sites (id, slug, name, description)
VALUES (
  'b984de91-f4ae-49f4-9b3f-366b37266374'::uuid,
  'respond',
  'Bid Response',
  'Help suppliers respond to RFP bid requests. Upload previous bids, track response status, and create competitive proposals.'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert site agents
-- Respond (default agent)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
SELECT 
  'b984de91-f4ae-49f4-9b3f-366b37266374'::uuid,
  id,
  true,
  0
FROM agents
WHERE name = 'Respond'
ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

-- Solutions (sales support)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
SELECT 
  'b984de91-f4ae-49f4-9b3f-366b37266374'::uuid,
  id,
  false,
  1
FROM agents
WHERE name = 'Solutions'
ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

-- Support (technical help)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
SELECT 
  'b984de91-f4ae-49f4-9b3f-366b37266374'::uuid,
  id,
  false,
  2
FROM agents
WHERE name = 'Support'
ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

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

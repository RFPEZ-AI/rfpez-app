-- Configure TMC specialty site to use TMC Specialist as default agent
-- Remove RFP Design from TMC site (TMC Specialist extends it via inheritance)

-- Remove RFP Design agent from TMC specialty site
DELETE FROM specialty_site_agents
WHERE specialty_site_id = '21fb43b3-8288-465d-990e-8f4c821daf44' -- TMC site
  AND agent_id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc'; -- RFP Design agent

-- Remove default flag from Solutions agent on TMC site
UPDATE specialty_site_agents
SET is_default_agent = false
WHERE specialty_site_id = '21fb43b3-8288-465d-990e-8f4c821daf44' -- TMC site
  AND is_default_agent = true;

-- Add TMC Specialist to TMC specialty site as default agent
INSERT INTO specialty_site_agents (
  specialty_site_id,
  agent_id,
  is_default_agent,
  sort_order
) VALUES (
  '21fb43b3-8288-465d-990e-8f4c821daf44', -- TMC site
  'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0', -- TMC Specialist agent
  true, -- Make this the default agent
  0 -- First in sort order
)
ON CONFLICT (specialty_site_id, agent_id) DO UPDATE
SET 
  is_default_agent = EXCLUDED.is_default_agent,
  sort_order = EXCLUDED.sort_order;

-- Adjust sort order for remaining agents on TMC site
UPDATE specialty_site_agents
SET sort_order = sort_order + 1
WHERE specialty_site_id = '21fb43b3-8288-465d-990e-8f4c821daf44' -- TMC site
  AND agent_id != 'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0'; -- Not TMC Specialist

-- Verify the configuration
SELECT 
  ss.slug as site,
  a.name as agent,
  ssa.is_default_agent as is_default,
  ssa.sort_order
FROM specialty_site_agents ssa
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
JOIN agents a ON ssa.agent_id = a.id
WHERE ss.slug = 'tmc'
ORDER BY ssa.sort_order;

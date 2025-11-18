-- Configure TMC specialty site to use TMC Specialist as default agent
-- Remove RFP Design from TMC site (TMC Specialist extends it via inheritance)

DO $$
DECLARE
  tmc_site_id UUID;
  tmc_specialist_id UUID;
  rfp_design_id UUID;
BEGIN
  -- Get IDs by name/slug
  SELECT id INTO tmc_site_id FROM specialty_sites WHERE slug = 'tmc';
  SELECT id INTO tmc_specialist_id FROM agents WHERE name = 'TMC Specialist';
  SELECT id INTO rfp_design_id FROM agents WHERE name = 'RFP Design';

  -- Remove RFP Design agent from TMC specialty site
  DELETE FROM specialty_site_agents
  WHERE specialty_site_id = tmc_site_id
    AND agent_id = rfp_design_id;

  -- Remove default flag from Solutions agent on TMC site
  UPDATE specialty_site_agents
  SET is_default_agent = false
  WHERE specialty_site_id = tmc_site_id
    AND is_default_agent = true;

  -- Add TMC Specialist to TMC specialty site as default agent
  INSERT INTO specialty_site_agents (
    specialty_site_id,
    agent_id,
    is_default_agent,
    sort_order
  ) VALUES (
    tmc_site_id,
    tmc_specialist_id,
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
  WHERE specialty_site_id = tmc_site_id
    AND agent_id != tmc_specialist_id;
END $$;

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

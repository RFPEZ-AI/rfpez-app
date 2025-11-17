-- Configure TMC specialty site with TMC Tender agent
-- Remove generic Sourcing agent, add specialized TMC Tender agent

-- Get specialty site ID for TMC
DO $$
DECLARE
  v_tmc_site_id uuid;
  v_sourcing_agent_id uuid;
  v_tmc_tender_agent_id uuid;
BEGIN
  -- Get TMC specialty site ID
  SELECT id INTO v_tmc_site_id
  FROM specialty_sites
  WHERE slug = 'tmc';

  -- Get Sourcing agent ID
  SELECT id INTO v_sourcing_agent_id
  FROM agents
  WHERE name = 'Sourcing';

  -- Get TMC Tender agent ID
  SELECT id INTO v_tmc_tender_agent_id
  FROM agents
  WHERE name = 'TMC Tender';

  -- Remove generic Sourcing from TMC site
  DELETE FROM specialty_site_agents
  WHERE specialty_site_id = v_tmc_site_id
    AND agent_id = v_sourcing_agent_id;

  -- Add TMC Tender to TMC site (sort_order 2, between Solutions and Support)
  INSERT INTO specialty_site_agents (
    specialty_site_id,
    agent_id,
    is_default_agent,
    sort_order
  )
  VALUES (
    v_tmc_site_id,
    v_tmc_tender_agent_id,
    false,
    2
  )
  ON CONFLICT (specialty_site_id, agent_id) DO NOTHING;

END $$;

-- Verify configuration
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
WHERE ss.slug = 'tmc'
ORDER BY ssa.sort_order;

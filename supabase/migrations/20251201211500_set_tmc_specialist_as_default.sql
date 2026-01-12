-- Migration: Set TMC Specialist as default agent for corporate-tmc-rfp site
-- Date: 2025-12-01
-- 
-- Purpose: Configure TMC Specialist as the default agent for authenticated users
-- on the corporate-tmc-rfp specialty site. Corporate TMC RFP Welcome remains
-- visible but not default (for anonymous user discovery).
--
-- Changes:
-- 1. Set TMC Specialist as is_default_agent = true
-- 2. Set Corporate TMC RFP Welcome as is_default_agent = false
-- 3. Adjust sort orders: TMC Specialist first (0), Corporate TMC RFP Welcome second (1)

DO $$
DECLARE
  v_site_id uuid;
  v_tmc_specialist_id uuid;
  v_welcome_agent_id uuid;
BEGIN
  -- Find the corporate-tmc-rfp site
  SELECT id INTO v_site_id
  FROM specialty_sites
  WHERE slug = 'corporate-tmc-rfp';

  IF v_site_id IS NULL THEN
    RAISE EXCEPTION 'corporate-tmc-rfp site not found';
  END IF;

  RAISE NOTICE 'Found corporate-tmc-rfp site: %', v_site_id;

  -- Find TMC Specialist agent (may not exist yet - created in later migration)
  SELECT id INTO v_tmc_specialist_id
  FROM agents
  WHERE name = 'TMC Specialist';

  IF v_tmc_specialist_id IS NULL THEN
    RAISE NOTICE 'TMC Specialist agent not found - skipping migration (agent created in later migration)';
    RETURN;
  END IF;

  RAISE NOTICE 'Found TMC Specialist agent: %', v_tmc_specialist_id;

  -- Find Corporate TMC RFP Welcome agent
  SELECT id INTO v_welcome_agent_id
  FROM agents
  WHERE name = 'Corporate TMC RFP Welcome';

  IF v_welcome_agent_id IS NULL THEN
    RAISE NOTICE 'Corporate TMC RFP Welcome agent not found - skipping migration';
    RETURN;
  END IF;

  RAISE NOTICE 'Found Corporate TMC RFP Welcome agent: %', v_welcome_agent_id;

  -- Update TMC Specialist to be the default agent with sort_order 0
  UPDATE specialty_site_agents
  SET 
    is_default_agent = true,
    sort_order = 0
  WHERE specialty_site_id = v_site_id
    AND agent_id = v_tmc_specialist_id;

  RAISE NOTICE 'Set TMC Specialist as default agent (sort_order = 0)';

  -- Update Corporate TMC RFP Welcome to NOT be default, but keep visible with sort_order 1
  UPDATE specialty_site_agents
  SET 
    is_default_agent = false,
    sort_order = 1
  WHERE specialty_site_id = v_site_id
    AND agent_id = v_welcome_agent_id;

  RAISE NOTICE 'Removed default status from Corporate TMC RFP Welcome (now sort_order = 1)';

END $$;

-- Verification query to show final configuration
SELECT 
  ss.slug as site_slug,
  a.name as agent_name,
  ssa.is_default_agent,
  ssa.sort_order
FROM specialty_site_agents ssa
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
JOIN agents a ON ssa.agent_id = a.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

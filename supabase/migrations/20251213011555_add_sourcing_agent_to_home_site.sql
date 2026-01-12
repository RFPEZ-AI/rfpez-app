-- Migration: Add Sourcing agent to home specialty site
-- Date: 2025-12-12
-- Description: Ensures the Sourcing agent appears in the agent selector on the home page
-- 
-- Context: The get_specialty_site_agents RPC function uses INNER JOIN with specialty_site_agents
-- table, so agents must be explicitly linked to specialty sites to appear in the UI.

DO $$
DECLARE
  home_site_id uuid;
  sourcing_agent_id uuid;
BEGIN
  -- Get home specialty site ID
  SELECT id INTO home_site_id
  FROM specialty_sites
  WHERE slug = 'home'
  LIMIT 1;

  -- Get Sourcing agent ID
  SELECT id INTO sourcing_agent_id
  FROM agents
  WHERE name = 'Sourcing'
  LIMIT 1;

  -- Check if both records exist
  IF home_site_id IS NULL THEN
    RAISE NOTICE 'Home specialty site not found - skipping migration';
    RETURN;
  END IF;

  IF sourcing_agent_id IS NULL THEN
    RAISE NOTICE 'Sourcing agent not found - skipping migration (may be created in later migration)';
    RETURN;
  END IF;

  -- Insert into specialty_site_agents if not already present
  INSERT INTO specialty_site_agents (
    specialty_site_id,
    agent_id,
    is_default_agent,
    sort_order
  )
  SELECT
    home_site_id,
    sourcing_agent_id,
    false,  -- Not the default agent
    2       -- Sort order between RFP Design (1) and Support (3)
  WHERE NOT EXISTS (
    SELECT 1
    FROM specialty_site_agents
    WHERE specialty_site_id = home_site_id
    AND agent_id = sourcing_agent_id
  );

  -- Log the result
  IF FOUND THEN
    RAISE NOTICE 'Added Sourcing agent to home specialty site';
  ELSE
    RAISE NOTICE 'Sourcing agent already linked to home specialty site';
  END IF;
END $$;

-- Verify the fix by checking agents for home site
DO $$
DECLARE
  agent_count integer;
BEGIN
  SELECT COUNT(*) INTO agent_count
  FROM get_specialty_site_agents('home');
  
  RAISE NOTICE 'Home site now has % agents', agent_count;
  
  -- Expected: 4 agents (Solutions, RFP Design, Sourcing, Support)
  IF agent_count < 4 THEN
    RAISE WARNING 'Expected at least 4 agents for home site, found %', agent_count;
  END IF;
END $$;

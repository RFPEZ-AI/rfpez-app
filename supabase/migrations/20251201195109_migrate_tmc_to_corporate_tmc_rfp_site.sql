-- Migration: Rename TMC specialty site to Corporate TMC RFP and update agent mappings
-- Author: AI Assistant
-- Date: 2024-12-01
-- Description: 
--   1. Rename specialty site 'tmc' to 'corporate-tmc-rfp'
--   2. Update TMC Specialist agent specialty from 'tmc' to 'corporate-tmc-rfp'
--   3. Add Corporate TMC RFP Welcome agent to the junction table as default
--   4. Remove Solutions agent from corporate-tmc-rfp site (inherited agent, not site-specific)
--   5. Mark Solutions and Sourcing as abstract agents (parent agents, not directly selectable)

-- Step 1: Rename specialty site slug from 'tmc' to 'corporate-tmc-rfp'
UPDATE specialty_sites 
SET 
  slug = 'corporate-tmc-rfp',
  name = 'Corporate TMC RFP',
  updated_at = NOW()
WHERE slug = 'tmc';

-- Step 2: Update TMC Specialist agent specialty from 'tmc' to 'corporate-tmc-rfp'
UPDATE agents
SET 
  specialty = 'corporate-tmc-rfp',
  updated_at = NOW()
WHERE name = 'TMC Specialist' AND specialty = 'tmc';

-- Step 3: Get the specialty site ID (now 'corporate-tmc-rfp')
DO $$
DECLARE
  site_id UUID;
  welcome_agent_id UUID := '07d498cc-cbb9-4c4c-8f4d-32a5ea21ea1f'; -- Corporate TMC RFP Welcome agent
  solutions_agent_id UUID := '4fe117af-da1d-410c-bcf4-929012d8a673'; -- Solutions agent
BEGIN
  -- Get the corporate-tmc-rfp site ID
  SELECT id INTO site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
  
  IF site_id IS NULL THEN
    RAISE EXCEPTION 'Specialty site corporate-tmc-rfp not found';
  END IF;
  
  -- Remove Solutions agent from this specialty site (it's a parent agent, not site-specific)
  DELETE FROM specialty_site_agents 
  WHERE specialty_site_id = site_id AND agent_id = solutions_agent_id;
  
  -- Add Corporate TMC RFP Welcome agent as the default agent for this site
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  VALUES (site_id, welcome_agent_id, true, 0)
  ON CONFLICT (specialty_site_id, agent_id) DO UPDATE
  SET is_default_agent = true, sort_order = 0;
  
  -- Update sort orders for other agents (make room for the new default at position 0)
  UPDATE specialty_site_agents 
  SET sort_order = sort_order + 1
  WHERE specialty_site_id = site_id 
    AND agent_id != welcome_agent_id
    AND sort_order >= 0;
END $$;

-- Step 4: Mark Solutions and Sourcing as abstract agents (parent agents not meant for direct selection)
UPDATE agents
SET 
  is_abstract = true,
  updated_at = NOW()
WHERE name IN ('Solutions', 'Sourcing');

-- Verification queries (commented out for production, uncomment for testing)
-- SELECT slug, name FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
-- SELECT name, specialty, is_abstract FROM agents WHERE name IN ('TMC Specialist', 'Solutions', 'Sourcing', 'Corporate TMC RFP Welcome');
-- SELECT ss.slug, a.name, ssa.is_default_agent, ssa.sort_order FROM specialty_site_agents ssa 
--   JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id 
--   JOIN agents a ON ssa.agent_id = a.id 
--   WHERE ss.slug = 'corporate-tmc-rfp' ORDER BY ssa.sort_order;

-- Configure General Procurement (home) specialty site with correct agent order
-- This migration makes RFP Design the default agent for the home page

-- Update agent is_default flags: RFP Design should be default, not Solutions
UPDATE agents 
SET is_default = false 
WHERE name = 'Solutions';

UPDATE agents 
SET is_default = true 
WHERE name = 'RFP Design';

-- Set Solutions as first in list (sort_order 0, but NOT default)
UPDATE specialty_site_agents 
SET sort_order = 0, is_default_agent = false 
WHERE specialty_site_id = '8cfe7700-ec8f-464a-8ae2-30d490556a99' 
  AND agent_id = '4fe117af-da1d-410c-bcf4-929012d8a673'; -- Solutions

-- Set RFP Design as second in list but IS the default agent (sort_order 1, is_default_agent true)
UPDATE specialty_site_agents 
SET sort_order = 1, is_default_agent = true 
WHERE specialty_site_id = '8cfe7700-ec8f-464a-8ae2-30d490556a99' 
  AND agent_id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc'; -- RFP Design

-- Keep Sourcing at sort_order 2
UPDATE specialty_site_agents 
SET sort_order = 2 
WHERE specialty_site_id = '8cfe7700-ec8f-464a-8ae2-30d490556a99' 
  AND agent_id = '021c53a9-8f7f-4112-9ad6-bc86003fadf7'; -- Sourcing

-- Keep Support at sort_order 3
UPDATE specialty_site_agents 
SET sort_order = 3 
WHERE specialty_site_id = '8cfe7700-ec8f-464a-8ae2-30d490556a99' 
  AND agent_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Support

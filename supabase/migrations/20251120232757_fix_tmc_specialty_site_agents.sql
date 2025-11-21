-- Fix TMC specialty site agents configuration
-- This migration ensures the TMC specialty site exists and has correct agent assignments

-- First, ensure the TMC specialty site exists (do nothing if already exists by name)
INSERT INTO specialty_sites (id, name, slug, created_at, updated_at)
VALUES (
  'e102a814-cc4c-42d7-9b83-b1858dd6d297',
  'TMC Sourcing',
  'tmc',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Now configure the agents for TMC specialty site
-- Remove any incorrect agent assignments from TMC site
DELETE FROM specialty_site_agents 
WHERE specialty_site_id = 'e102a814-cc4c-42d7-9b83-b1858dd6d297'
  AND agent_id NOT IN (
    '4fe117af-da1d-410c-bcf4-929012d8a673', -- Solutions
    'ae9b8b23-1568-4603-b2e0-5452fce6d896', -- TMC Specialist
    '1bfa8897-43c7-4270-8503-e91f59af40ab', -- TMC Tender
    '2dbfa44a-a041-4167-8d3e-82aecd4d2424'  -- Support
  );

-- Ensure Solutions is assigned (sort_order 0, first in list but NOT default)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('e102a814-cc4c-42d7-9b83-b1858dd6d297', '4fe117af-da1d-410c-bcf4-929012d8a673', 0, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 0, is_default_agent = false;

-- Ensure TMC Specialist is assigned (sort_order 1) and IS the default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('e102a814-cc4c-42d7-9b83-b1858dd6d297', 'ae9b8b23-1568-4603-b2e0-5452fce6d896', 1, true)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 1, is_default_agent = true;

-- Ensure TMC Tender is assigned (sort_order 2) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('e102a814-cc4c-42d7-9b83-b1858dd6d297', '1bfa8897-43c7-4270-8503-e91f59af40ab', 2, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 2, is_default_agent = false;

-- Ensure Support is assigned (sort_order 3) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('e102a814-cc4c-42d7-9b83-b1858dd6d297', '2dbfa44a-a041-4167-8d3e-82aecd4d2424', 3, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 3, is_default_agent = false;

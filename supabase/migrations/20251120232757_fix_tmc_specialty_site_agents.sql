-- Fix TMC specialty site agents configuration
-- This migration ensures the TMC specialty site exists and has correct agent assignments

-- First, ensure the TMC specialty site exists
INSERT INTO specialty_sites (id, name, slug, created_at, updated_at)
VALUES (
  'ae0d54f5-ce39-4bfd-9dfc-e12583c68603',
  'TMC Sourcing',
  'tmc',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    slug = EXCLUDED.slug,
    updated_at = NOW();

-- Now configure the agents for TMC specialty site
-- Remove any incorrect agent assignments from TMC site
DELETE FROM specialty_site_agents 
WHERE specialty_site_id = 'ae0d54f5-ce39-4bfd-9dfc-e12583c68603'
  AND agent_id NOT IN (
    '4fe117af-da1d-410c-bcf4-929012d8a673', -- Solutions
    'b44c5146-96a6-4bd0-a2da-e39252a91827', -- TMC Specialist
    '1bfa8897-43c7-4270-8503-e91f59af40ab', -- TMC Tender
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'  -- Support
  );

-- Ensure Solutions is assigned (sort_order 0, first in list but NOT default)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('ae0d54f5-ce39-4bfd-9dfc-e12583c68603', '4fe117af-da1d-410c-bcf4-929012d8a673', 0, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 0, is_default_agent = false;

-- Ensure TMC Specialist is assigned (sort_order 1) and IS the default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('ae0d54f5-ce39-4bfd-9dfc-e12583c68603', 'b44c5146-96a6-4bd0-a2da-e39252a91827', 1, true)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 1, is_default_agent = true;

-- Ensure TMC Tender is assigned (sort_order 2) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('ae0d54f5-ce39-4bfd-9dfc-e12583c68603', '1bfa8897-43c7-4270-8503-e91f59af40ab', 2, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 2, is_default_agent = false;

-- Ensure Support is assigned (sort_order 3) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
VALUES ('ae0d54f5-ce39-4bfd-9dfc-e12583c68603', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 3, false)
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 3, is_default_agent = false;

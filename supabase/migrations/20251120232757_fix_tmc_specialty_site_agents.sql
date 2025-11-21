-- Fix TMC specialty site agents configuration
-- This migration ensures the TMC specialty site exists and has correct agent assignments
-- Uses subqueries to find agent IDs by name (environment-agnostic)

-- First, ensure the TMC specialty site exists (idempotent - uses name conflict)
INSERT INTO specialty_sites (id, name, slug, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'TMC Sourcing',
  'tmc',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Now configure the agents for TMC specialty site
-- Remove any incorrect agent assignments from TMC site (keep only the 4 we want)
DELETE FROM specialty_site_agents 
WHERE specialty_site_id = (SELECT id FROM specialty_sites WHERE name = 'TMC Sourcing')
  AND agent_id NOT IN (
    (SELECT id FROM agents WHERE name = 'Solutions'),
    (SELECT id FROM agents WHERE name = 'TMC Specialist'),
    (SELECT id FROM agents WHERE name = 'TMC Tender'),
    (SELECT id FROM agents WHERE name = 'Support')
  );

-- Ensure Solutions is assigned (sort_order 0, first in list but NOT default)
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
SELECT 
  (SELECT id FROM specialty_sites WHERE name = 'TMC Sourcing'),
  (SELECT id FROM agents WHERE name = 'Solutions'),
  0,
  false
WHERE EXISTS (SELECT 1 FROM agents WHERE name = 'Solutions')
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 0, is_default_agent = false;

-- Ensure TMC Specialist is assigned (sort_order 1) and IS the default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
SELECT 
  (SELECT id FROM specialty_sites WHERE name = 'TMC Sourcing'),
  (SELECT id FROM agents WHERE name = 'TMC Specialist'),
  1,
  true
WHERE EXISTS (SELECT 1 FROM agents WHERE name = 'TMC Specialist')
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 1, is_default_agent = true;

-- Ensure TMC Tender is assigned (sort_order 2) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
SELECT 
  (SELECT id FROM specialty_sites WHERE name = 'TMC Sourcing'),
  (SELECT id FROM agents WHERE name = 'TMC Tender'),
  2,
  false
WHERE EXISTS (SELECT 1 FROM agents WHERE name = 'TMC Tender')
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 2, is_default_agent = false;

-- Ensure Support is assigned (sort_order 3) and NOT default
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, sort_order, is_default_agent)
SELECT 
  (SELECT id FROM specialty_sites WHERE name = 'TMC Sourcing'),
  (SELECT id FROM agents WHERE name = 'Support'),
  3,
  false
WHERE EXISTS (SELECT 1 FROM agents WHERE name = 'Support')
ON CONFLICT (specialty_site_id, agent_id) 
DO UPDATE SET sort_order = 3, is_default_agent = false;

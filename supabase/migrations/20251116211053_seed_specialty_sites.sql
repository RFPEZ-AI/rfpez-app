-- RFPEZ.AI Specialty Sites Seed Data
-- Initial data for home (default) and TMC specialty sites

-- Insert specialty sites
INSERT INTO public.specialty_sites (name, slug, description, hero_title, hero_subtitle, is_default, is_active, sort_order, metadata)
VALUES
  (
    'General Procurement',
    'home',
    'Full-featured RFP management for all procurement needs',
    'AI-Powered RFP Management',
    'Create, manage, and optimize your procurement process with intelligent agents',
    TRUE,  -- This is the default site
    TRUE,
    0,
    '{"theme": "default", "showAllFeatures": true}'::jsonb
  ),
  (
    'TMC Sourcing',
    'tmc',
    'Specialized procurement workflow for Travel Management Company (TMC) sourcing',
    'TMC Procurement Made Simple',
    'Streamline your travel management company sourcing with purpose-built AI agents',
    FALSE,
    TRUE,
    1,
    '{"theme": "travel", "industry": "travel-management", "showAllFeatures": true}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Get specialty site IDs for reference
DO $$
DECLARE
  home_site_id UUID;
  tmc_site_id UUID;
  solutions_agent_id UUID;
  rfp_design_agent_id UUID;
  support_agent_id UUID;
  sourcing_agent_id UUID;
BEGIN
  -- Get specialty site IDs
  SELECT id INTO home_site_id FROM public.specialty_sites WHERE slug = 'home';
  SELECT id INTO tmc_site_id FROM public.specialty_sites WHERE slug = 'tmc';
  
  -- Get agent IDs (using known UUIDs from current database)
  SELECT id INTO solutions_agent_id FROM public.agents WHERE id = '4fe117af-da1d-410c-bcf4-929012d8a673';
  SELECT id INTO rfp_design_agent_id FROM public.agents WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';
  SELECT id INTO support_agent_id FROM public.agents WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  SELECT id INTO sourcing_agent_id FROM public.agents WHERE id = '021c53a9-8f7f-4112-9ad6-bc86003fadf7';
  
  -- Assign agents to HOME specialty site (all current agents)
  INSERT INTO public.specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  VALUES
    (home_site_id, solutions_agent_id, TRUE, 0),      -- Solutions is default for home
    (home_site_id, rfp_design_agent_id, FALSE, 1),    -- RFP Design
    (home_site_id, sourcing_agent_id, FALSE, 2),      -- Sourcing
    (home_site_id, support_agent_id, FALSE, 3)        -- Support
  ON CONFLICT (specialty_site_id, agent_id) DO UPDATE SET
    is_default_agent = EXCLUDED.is_default_agent,
    sort_order = EXCLUDED.sort_order;
  
  -- Assign agents to TMC specialty site (clone of home initially)
  INSERT INTO public.specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
  VALUES
    (tmc_site_id, solutions_agent_id, TRUE, 0),       -- Solutions is default for TMC too
    (tmc_site_id, rfp_design_agent_id, FALSE, 1),     -- RFP Design
    (tmc_site_id, sourcing_agent_id, FALSE, 2),       -- Sourcing
    (tmc_site_id, support_agent_id, FALSE, 3)         -- Support
  ON CONFLICT (specialty_site_id, agent_id) DO UPDATE SET
    is_default_agent = EXCLUDED.is_default_agent,
    sort_order = EXCLUDED.sort_order;
    
  RAISE NOTICE 'Specialty sites seeded successfully';
  RAISE NOTICE 'Home site ID: %', home_site_id;
  RAISE NOTICE 'TMC site ID: %', tmc_site_id;
END $$;

-- Verify the data
SELECT 
  ss.name as specialty_site,
  ss.slug,
  COUNT(ssa.agent_id) as agent_count,
  array_agg(a.name ORDER BY ssa.sort_order) as agents
FROM public.specialty_sites ss
LEFT JOIN public.specialty_site_agents ssa ON ss.id = ssa.specialty_site_id
LEFT JOIN public.agents a ON ssa.agent_id = a.id
WHERE ss.is_active = TRUE
GROUP BY ss.id, ss.name, ss.slug
ORDER BY ss.sort_order;

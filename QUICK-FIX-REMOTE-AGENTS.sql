-- =====================================================
-- QUICK FIX: Sync Agent Access Settings on Remote
-- Run this in Supabase SQL Editor to fix anonymous access
-- =====================================================

DO $$
DECLARE
    v_solutions_id uuid;
    v_rfp_design_id uuid;
    v_sourcing_id uuid;
    v_site_id uuid;
    v_welcome_id uuid;
BEGIN
    -- Get IDs by name (works on both local and remote)
    SELECT id INTO v_solutions_id FROM agents WHERE name = 'Solutions';
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    SELECT id INTO v_site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
    SELECT id INTO v_welcome_id FROM agents WHERE name = 'Corporate TMC RFP Welcome';
    
    -- Fix Corporate TMC RFP Welcome (enable anonymous access)
    UPDATE agents
    SET is_restricted = false, is_free = true, is_abstract = false, 
        parent_agent_id = v_solutions_id, updated_at = NOW()
    WHERE name = 'Corporate TMC RFP Welcome';
    
    -- Fix TMC Specialist  
    UPDATE agents
    SET is_restricted = true, is_free = false, is_abstract = false,
        parent_agent_id = v_rfp_design_id, updated_at = NOW()
    WHERE name = 'TMC Specialist';
    
    -- Fix TMC Tender
    UPDATE agents
    SET is_restricted = true, is_free = false, is_abstract = false,
        parent_agent_id = v_sourcing_id, updated_at = NOW()
    WHERE name = 'TMC Tender';
    
    -- Set anonymous default
    UPDATE specialty_sites
    SET anonymous_default_agent_id = v_welcome_id
    WHERE slug = 'corporate-tmc-rfp';
    
    RAISE NOTICE '✅ Agent access settings synchronized successfully!';
END $$;

-- Verify changes
SELECT 
    a.name,
    a.is_restricted,
    a.is_free,
    parent.name as parent_name,
    ss.slug as site
FROM agents a
LEFT JOIN agents parent ON a.parent_agent_id = parent.id
LEFT JOIN specialty_site_agents ssa ON a.id = ssa.agent_id
LEFT JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE a.name IN ('Corporate TMC RFP Welcome', 'TMC Specialist', 'TMC Tender')
ORDER BY a.name;

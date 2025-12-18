-- =======================================================
-- FIX CORPORATE TMC SITE AGENT LIST
-- Date: December 17, 2025
-- Purpose: Remove RFP Design from corporate-tmc-rfp site (should only have TMC-specific agents)
-- =======================================================

DO $$
DECLARE
    v_site_id uuid;
    v_rfp_design_id uuid;
BEGIN
    -- Get site and agent IDs
    SELECT id INTO v_site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    
    IF v_site_id IS NULL THEN
        RAISE EXCEPTION 'corporate-tmc-rfp site not found';
    END IF;
    
    -- Remove RFP Design from corporate-tmc-rfp site
    -- (Corporate TMC RFP site should only have TMC-specific agents)
    DELETE FROM specialty_site_agents
    WHERE specialty_site_id = v_site_id
      AND agent_id = v_rfp_design_id;
    
    RAISE NOTICE 'Removed RFP Design from corporate-tmc-rfp site';
    
    -- Reorder remaining agents
    UPDATE specialty_site_agents
    SET sort_order = 3
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'Support');
    
    RAISE NOTICE 'Updated agent sort orders';
END $$;

-- Verification Query
SELECT 
    a.name as agent_name,
    ssa.is_default_agent,
    ssa.sort_order
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

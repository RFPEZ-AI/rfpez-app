-- =======================================================
-- SET TMC SPECIALIST AS DEFAULT WITH WELCOME FALLBACK
-- Date: December 17, 2025
-- Purpose: 
--   - TMC Specialist = default for authenticated users (is_default_agent=true, is_free=false)
--   - Corporate TMC RFP Welcome = fallback for anonymous users (first free agent)
--   - Frontend logic will use TMC Specialist for authenticated, Welcome for anonymous
-- =======================================================

DO $$
DECLARE
    v_site_id uuid;
    v_welcome_id uuid;
    v_specialist_id uuid;
BEGIN
    -- Get site and agent IDs
    SELECT id INTO v_site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
    SELECT id INTO v_welcome_id FROM agents WHERE name = 'Corporate TMC RFP Welcome';
    SELECT id INTO v_specialist_id FROM agents WHERE name = 'TMC Specialist';
    
    IF v_site_id IS NULL THEN
        RAISE EXCEPTION 'corporate-tmc-rfp site not found';
    END IF;
    
    -- ============================================
    -- STEP 1: Set TMC Specialist as default
    -- (For authenticated users - system will auto-select this)
    -- ============================================
    
    IF v_specialist_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET is_default_agent = true,
            sort_order = 0  -- First position
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_specialist_id;
        
        RAISE NOTICE 'Set TMC Specialist as default agent (for authenticated users)';
    END IF;
    
    -- ============================================
    -- STEP 2: Set Corporate TMC RFP Welcome as non-default but first free agent
    -- (Frontend will use this as fallback for anonymous users)
    -- ============================================
    
    IF v_welcome_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET is_default_agent = false,
            sort_order = 1  -- Second position (first free agent)
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_welcome_id;
        
        RAISE NOTICE 'Set Corporate TMC RFP Welcome as first free agent (for anonymous users)';
    END IF;
    
    -- Update other agents sort order
    UPDATE specialty_site_agents
    SET sort_order = 2
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'TMC Tender');
    
    UPDATE specialty_site_agents
    SET sort_order = 3
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'Support');
    
    RAISE NOTICE 'Updated remaining agent sort orders';
    
END $$;

-- ============================================
-- Verification Query
-- ============================================

SELECT 
    a.name,
    a.is_free,
    ssa.is_default_agent,
    ssa.sort_order,
    CASE 
        WHEN ssa.is_default_agent AND NOT a.is_free THEN 'Default (Authenticated Only)'
        WHEN NOT ssa.is_default_agent AND a.is_free AND ssa.sort_order = 1 THEN 'Fallback (Anonymous)'
        ELSE 'Available'
    END as role
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

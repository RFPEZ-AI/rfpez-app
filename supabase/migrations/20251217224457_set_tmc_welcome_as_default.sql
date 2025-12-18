-- =======================================================
-- SET TMC WELCOME AS DEFAULT AGENT
-- Date: December 17, 2025
-- Purpose: 
--   Make Corporate TMC RFP Welcome the default agent for anonymous users
--   TMC Specialist should only be available to authenticated users
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
    -- STEP 1: Remove TMC Specialist as default
    -- ============================================
    
    IF v_specialist_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET is_default_agent = false
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_specialist_id;
        
        RAISE NOTICE 'Removed TMC Specialist as default agent';
    END IF;
    
    -- ============================================
    -- STEP 2: Set Corporate TMC RFP Welcome as default
    -- ============================================
    
    IF v_welcome_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET is_default_agent = true,
            sort_order = 0  -- Move to first position
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_welcome_id;
        
        RAISE NOTICE 'Set Corporate TMC RFP Welcome as default agent';
    END IF;
    
    -- ============================================
    -- STEP 3: Update TMC Specialist sort order
    -- ============================================
    
    IF v_specialist_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET sort_order = 1  -- Move to second position
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_specialist_id;
        
        RAISE NOTICE 'Updated TMC Specialist sort order to 1';
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
    ssa.sort_order
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

-- =======================================================
-- FIX AGENT VISIBILITY AND ACCESS CONTROL
-- Date: December 17, 2025
-- Purpose: 
--   1. Add Sourcing agent to home specialty site
--   2. Set TMC Specialist to require login (is_free=false)
--   3. Set Corporate TMC RFP Welcome to public access (is_free=true)
-- =======================================================

DO $$
DECLARE
    v_home_site_id uuid;
    v_sourcing_id uuid;
    v_tmc_specialist_id uuid;
    v_welcome_id uuid;
BEGIN
    -- Get site and agent IDs
    SELECT id INTO v_home_site_id FROM specialty_sites WHERE slug = 'home';
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    SELECT id INTO v_tmc_specialist_id FROM agents WHERE name = 'TMC Specialist';
    SELECT id INTO v_welcome_id FROM agents WHERE name = 'Corporate TMC RFP Welcome';
    
    IF v_home_site_id IS NULL THEN
        RAISE EXCEPTION 'Home specialty site not found';
    END IF;
    
    IF v_sourcing_id IS NULL THEN
        RAISE EXCEPTION 'Sourcing agent not found';
    END IF;
    
    -- ============================================
    -- STEP 1: Add Sourcing agent to home site
    -- ============================================
    
    INSERT INTO specialty_site_agents (
        specialty_site_id,
        agent_id,
        is_default_agent,
        sort_order,
        created_at
    )
    VALUES (
        v_home_site_id,
        v_sourcing_id,
        false,
        2, -- Between RFP Design (1) and Support (3)
        NOW()
    )
    ON CONFLICT (specialty_site_id, agent_id) 
    DO UPDATE SET 
        sort_order = 2;
    
    RAISE NOTICE 'Added Sourcing agent to home site';
    
    -- ============================================
    -- STEP 2: Set TMC Specialist to require login
    -- ============================================
    
    IF v_tmc_specialist_id IS NOT NULL THEN
        UPDATE agents
        SET is_free = false,
            updated_at = NOW()
        WHERE id = v_tmc_specialist_id;
        
        RAISE NOTICE 'Set TMC Specialist to require login (is_free=false)';
    END IF;
    
    -- ============================================
    -- STEP 3: Set Corporate TMC RFP Welcome to public
    -- ============================================
    
    IF v_welcome_id IS NOT NULL THEN
        UPDATE agents
        SET is_free = true,
            updated_at = NOW()
        WHERE id = v_welcome_id;
        
        RAISE NOTICE 'Set Corporate TMC RFP Welcome to public access (is_free=true)';
    END IF;
    
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check home site agents
SELECT 
    ss.slug,
    a.name,
    ssa.sort_order,
    a.is_free
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'home'
ORDER BY ssa.sort_order;

-- Check corporate-tmc-rfp site agents with access levels
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

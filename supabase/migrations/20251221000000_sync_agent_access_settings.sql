-- =====================================================
-- SYNCHRONIZE AGENT ACCESS SETTINGS
-- Date: December 21, 2025
-- Purpose: Ensure consistent agent access settings across environments
-- Uses agent names instead of hardcoded UUIDs to work across local/remote
-- =====================================================

-- This migration can be run on both local and remote to ensure consistency

DO $$
DECLARE
    v_solutions_id uuid;
    v_rfp_design_id uuid;
    v_sourcing_id uuid;
BEGIN
    -- Get agent IDs by name (works across environments with different UUIDs)
    SELECT id INTO v_solutions_id FROM agents WHERE name = 'Solutions';
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    
    -- =====================================================
    -- CORPORATE TMC RFP WELCOME AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = false,  -- Allow anonymous access
        is_free = true,         -- Free tier agent
        is_abstract = false,    -- Concrete agent, not abstract
        parent_agent_id = v_solutions_id  -- Parent is Solutions agent
    WHERE name = 'Corporate TMC RFP Welcome';
    
    RAISE NOTICE 'Updated Corporate TMC RFP Welcome agent: is_restricted=false, is_free=true, parent=Solutions';
    
    -- =====================================================
    -- TMC SPECIALIST AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = true,   -- Requires authentication
        is_free = false,        -- Premium agent
        is_abstract = false,    -- Concrete agent
        parent_agent_id = v_rfp_design_id  -- Parent is RFP Design agent
    WHERE name = 'TMC Specialist';
    
    RAISE NOTICE 'Updated TMC Specialist agent: is_restricted=true, is_free=false, parent=RFP Design';
    
    -- =====================================================
    -- TMC TENDER AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = true,   -- Requires authentication
        is_free = false,        -- Premium agent
        is_abstract = false,    -- Concrete agent
        parent_agent_id = v_sourcing_id  -- Parent is Sourcing agent
    WHERE name = 'TMC Tender';
    
    RAISE NOTICE 'Updated TMC Tender agent: is_restricted=true, is_free=false, parent=Sourcing';
    
    -- =====================================================
    -- VERIFY SPECIALTY SITE AGENT RELATIONSHIPS
    -- =====================================================
    -- Ensure all TMC agents are properly linked to corporate-tmc-rfp site
    
    WITH site_info AS (
        SELECT id as site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp'
    ),
    agent_info AS (
        SELECT id as agent_id, name FROM agents 
        WHERE name IN ('Corporate TMC RFP Welcome', 'TMC Specialist', 'TMC Tender')
    )
    INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
    SELECT 
        s.site_id,
        a.agent_id,
        CASE 
            WHEN a.name = 'TMC Specialist' THEN true  -- Default for authenticated
            ELSE false 
        END as is_default_agent,
        CASE 
            WHEN a.name = 'TMC Specialist' THEN 0
            WHEN a.name = 'Corporate TMC RFP Welcome' THEN 1
            WHEN a.name = 'TMC Tender' THEN 2
            ELSE 3
        END as sort_order
    FROM site_info s
    CROSS JOIN agent_info a
    ON CONFLICT (specialty_site_id, agent_id) 
    DO UPDATE SET 
        is_default_agent = EXCLUDED.is_default_agent,
        sort_order = EXCLUDED.sort_order;
    
    RAISE NOTICE 'Verified specialty_site_agents relationships for corporate-tmc-rfp';
    
    -- =====================================================
    -- UPDATE SPECIALTY SITE ANONYMOUS DEFAULT (if column exists)
    -- =====================================================
    -- Set Corporate TMC RFP Welcome as the anonymous default
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'specialty_sites' 
        AND column_name = 'anonymous_default_agent_id'
    ) THEN
        WITH site_info AS (
            SELECT id as site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp'
        ),
        welcome_agent AS (
            SELECT id as agent_id FROM agents WHERE name = 'Corporate TMC RFP Welcome'
        )
        UPDATE specialty_sites
        SET anonymous_default_agent_id = (SELECT agent_id FROM welcome_agent)
        WHERE id = (SELECT site_id FROM site_info);
        
        RAISE NOTICE 'Set Corporate TMC RFP Welcome as anonymous_default_agent for corporate-tmc-rfp site';
    ELSE
        RAISE NOTICE 'Skipped anonymous_default_agent_id update (column does not exist on remote)';
    END IF;
    
END $$;

-- =====================================================
-- VERIFICATION QUERY (Run after migration)
-- =====================================================
-- SELECT 
--     a.name,
--     a.is_restricted,
--     a.is_free,
--     a.is_abstract,
--     parent.name as parent_name,
--     ssa.is_default_agent,
--     ssa.sort_order
-- FROM agents a
-- LEFT JOIN agents parent ON a.parent_agent_id = parent.id
-- LEFT JOIN specialty_site_agents ssa ON a.id = ssa.agent_id
-- LEFT JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
-- WHERE a.name IN ('Corporate TMC RFP Welcome', 'TMC Specialist', 'TMC Tender')
--   OR ss.slug = 'corporate-tmc-rfp'
-- ORDER BY COALESCE(ssa.sort_order, 999), a.name;

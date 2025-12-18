-- =======================================================
-- FIX AGENT VISIBILITY ISSUES
-- Date: December 17, 2025
-- Purpose: Fix agent visibility on home page and corporate-tmc-rfp specialty site
-- =======================================================

-- ============================================
-- STEP 1: Make Solutions agent visible (not abstract)
-- ============================================

UPDATE agents 
SET is_abstract = false,
    updated_at = NOW()
WHERE name = 'Solutions';

-- ============================================
-- STEP 2: Check if Sourcing agent exists, if not create it
-- ============================================

DO $$
DECLARE
    v_sourcing_id uuid;
    v_solutions_id uuid;
BEGIN
    -- Check if Sourcing agent exists
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    
    IF v_sourcing_id IS NULL THEN
        -- Get Solutions agent ID for parent reference
        SELECT id INTO v_solutions_id FROM agents WHERE name = 'Solutions';
        
        -- Create Sourcing agent
        INSERT INTO agents (
            id,
            name,
            role,
            description,
            instructions,
            initial_prompt,
            avatar_url,
            parent_agent_id,
            is_abstract,
            is_default,
            is_free,
            specialty,
            access,
            account_id,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Sourcing',
            'sourcing',
            'Specialized in supplier sourcing, vendor qualification, and market research for RFPs',
            'You are the Sourcing agent, specialized in helping buyers find and qualify suppliers for their RFP requirements.',
            'I can help you find qualified suppliers, conduct market research, and build vendor shortlists for your RFPs.',
            '/assets/avatars/sourcing-agent.svg',
            v_solutions_id,
            false, -- not abstract
            false, -- not default
            true,  -- is_free
            'sourcing',
            ARRAY['supplier_search', 'market_research', 'vendor_qualification']::text[],
            NULL,  -- system agent
            true,  -- is_active
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created Sourcing agent';
    ELSE
        -- Make sure Sourcing is visible
        UPDATE agents 
        SET is_abstract = false,
            is_active = true,
            updated_at = NOW()
        WHERE id = v_sourcing_id;
        
        RAISE NOTICE 'Updated Sourcing agent to be visible';
    END IF;
END $$;

-- ============================================
-- STEP 3: Update corporate-tmc-rfp specialty site agents
-- ============================================

DO $$
DECLARE
    v_site_id uuid;
    v_tmc_specialist_id uuid;
    v_tmc_tender_id uuid;
    v_rfp_design_id uuid;
    v_support_id uuid;
BEGIN
    -- Get the corporate-tmc-rfp site
    SELECT id INTO v_site_id
    FROM specialty_sites
    WHERE slug = 'corporate-tmc-rfp';
    
    IF v_site_id IS NULL THEN
        RAISE EXCEPTION 'corporate-tmc-rfp site not found';
    END IF;
    
    -- Get agent IDs
    SELECT id INTO v_tmc_specialist_id FROM agents WHERE name = 'TMC Specialist';
    SELECT id INTO v_tmc_tender_id FROM agents WHERE name = 'TMC Tender';
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    SELECT id INTO v_support_id FROM agents WHERE name = 'Support';
    
    -- If TMC Specialist exists, add it to the site (if not already there)
    IF v_tmc_specialist_id IS NOT NULL THEN
        INSERT INTO specialty_site_agents (
            specialty_site_id,
            agent_id,
            is_default_agent,
            sort_order,
            created_at
        )
        VALUES (
            v_site_id,
            v_tmc_specialist_id,
            true,  -- default agent
            0,     -- first position
            NOW()
        )
        ON CONFLICT (specialty_site_id, agent_id) 
        DO UPDATE SET 
            is_default_agent = true,
            sort_order = 0;
        
        RAISE NOTICE 'Added/Updated TMC Specialist as default for corporate-tmc-rfp';
    ELSE
        RAISE NOTICE 'TMC Specialist agent not found - skipping';
    END IF;
    
    -- If TMC Tender exists, add it to the site (if not already there)
    IF v_tmc_tender_id IS NOT NULL THEN
        INSERT INTO specialty_site_agents (
            specialty_site_id,
            agent_id,
            is_default_agent,
            sort_order,
            created_at
        )
        VALUES (
            v_site_id,
            v_tmc_tender_id,
            false, -- not default
            1,     -- second position
            NOW()
        )
        ON CONFLICT (specialty_site_id, agent_id) 
        DO UPDATE SET 
            is_default_agent = false,
            sort_order = 1;
        
        RAISE NOTICE 'Added/Updated TMC Tender for corporate-tmc-rfp';
    ELSE
        RAISE NOTICE 'TMC Tender agent not found - skipping';
    END IF;
    
    -- Update Corporate TMC RFP Welcome to not be default (keep as welcome agent)
    UPDATE specialty_site_agents
    SET is_default_agent = false,
        sort_order = 2
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'Corporate TMC RFP Welcome');
    
    -- Update RFP Design sort order
    IF v_rfp_design_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET sort_order = 3
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_rfp_design_id;
    END IF;
    
    -- Update Support sort order
    IF v_support_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET sort_order = 4
        WHERE specialty_site_id = v_site_id
          AND agent_id = v_support_id;
    END IF;
    
    RAISE NOTICE 'Updated agent order for corporate-tmc-rfp site';
END $$;

-- ============================================
-- STEP 4: Update constraint to include Sourcing in system agents
-- ============================================

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  (
    (name = ANY (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      'TMC Specialist'::text,
      'TMC Tender'::text,
      'Respond'::text,
      'Corporate TMC RFP Welcome'::text,
      '_common'::text
    ]))
    AND (account_id IS NULL)
  )
  OR
  (
    account_id IS NOT NULL
    AND NOT (name = ANY (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      'TMC Specialist'::text,
      'TMC Tender'::text,
      'Respond'::text,
      'Corporate TMC RFP Welcome'::text,
      '_common'::text
    ]))
  )
);

-- ============================================
-- Verification Queries
-- ============================================

-- Show active non-abstract agents (should include Solutions and Sourcing)
SELECT 
    name, 
    is_active, 
    is_abstract, 
    is_default, 
    specialty,
    parent_agent_id IS NOT NULL as has_parent
FROM agents 
WHERE is_active = true 
  AND (is_abstract IS NULL OR is_abstract = false)
  AND name IN ('Solutions', 'Sourcing', 'RFP Design', 'Support', 'Respond')
ORDER BY name;

-- Show corporate-tmc-rfp site agents
SELECT 
    a.name as agent_name,
    ssa.is_default_agent,
    ssa.sort_order
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

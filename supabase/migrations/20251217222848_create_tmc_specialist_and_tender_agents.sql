-- =======================================================
-- CREATE TMC SPECIALIST AND TMC TENDER AGENTS
-- Date: December 17, 2025
-- Purpose: Create TMC Specialist and TMC Tender agents for corporate-tmc-rfp specialty site
-- =======================================================

-- ============================================
-- STEP 1: Get parent agent IDs
-- ============================================

DO $$
DECLARE
    v_rfp_design_id uuid;
    v_sourcing_id uuid;
    v_tmc_specialist_id uuid;
    v_tmc_tender_id uuid;
    v_site_id uuid;
BEGIN
    -- Get parent agent IDs
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    SELECT id INTO v_site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
    
    IF v_rfp_design_id IS NULL THEN
        RAISE EXCEPTION 'RFP Design agent not found';
    END IF;
    
    IF v_sourcing_id IS NULL THEN
        RAISE EXCEPTION 'Sourcing agent not found';
    END IF;
    
    IF v_site_id IS NULL THEN
        RAISE EXCEPTION 'corporate-tmc-rfp site not found';
    END IF;

    -- ============================================
    -- STEP 2: Create TMC Specialist agent
    -- ============================================
    
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
        'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0',
        'TMC Specialist',
        'design',
        'Specialized agent for creating RFPs to procure Travel Management Company (TMC) services for corporations.',
        'You are a specialist in Travel Management Company (TMC) procurement. You inherit all RFP design capabilities from RFP Design agent and apply them to travel management services.',
        'I specialize in helping organizations create RFPs for Travel Management Company services. I can help you design comprehensive TMC RFPs covering booking services, policy management, duty of care, and reporting.',
        '/assets/avatars/tmc-specialist.svg',
        v_rfp_design_id,
        false, -- not abstract
        false, -- not default (site will have default)
        true,  -- is_free
        'corporate-tmc-rfp',
        ARRAY['rfp_creation', 'form_artifacts', 'perplexity']::text[],
        NULL,  -- system agent
        true,  -- is_active
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        parent_agent_id = v_rfp_design_id,
        specialty = 'corporate-tmc-rfp',
        is_abstract = false,
        is_active = true,
        updated_at = NOW();
    
    v_tmc_specialist_id := 'd6e83135-2b2d-47b7-91a0-5a3e138e7eb0';
    RAISE NOTICE 'TMC Specialist agent created/updated';

    -- ============================================
    -- STEP 3: Create TMC Tender agent
    -- ============================================
    
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
        'TMC Tender',
        'sourcing',
        'Specialized agent for TMC vendor selection, tender management, and evaluation.',
        'You are a TMC tender specialist. You inherit all sourcing capabilities from Sourcing agent and apply them to TMC-specific vendor selection and tender management.',
        'I specialize in helping organizations find and evaluate Travel Management Company vendors. I can help you create vendor shortlists, manage tender processes, and evaluate TMC proposals.',
        '/assets/avatars/tmc-tender.svg',
        v_sourcing_id,
        false, -- not abstract
        false, -- not default
        true,  -- is_free
        'corporate-tmc-rfp',
        ARRAY['supplier_search', 'vendor_qualification', 'perplexity']::text[],
        NULL,  -- system agent
        true,  -- is_active
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        parent_agent_id = v_sourcing_id,
        specialty = 'corporate-tmc-rfp',
        is_abstract = false,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_tmc_tender_id;
    
    RAISE NOTICE 'TMC Tender agent created/updated';

    -- ============================================
    -- STEP 4: Assign agents to corporate-tmc-rfp specialty site
    -- ============================================
    
    -- TMC Specialist (default agent)
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
    
    RAISE NOTICE 'Added TMC Specialist to corporate-tmc-rfp site as default';
    
    -- TMC Tender (second position)
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
        false,
        1,
        NOW()
    )
    ON CONFLICT (specialty_site_id, agent_id) 
    DO UPDATE SET 
        is_default_agent = false,
        sort_order = 1;
    
    RAISE NOTICE 'Added TMC Tender to corporate-tmc-rfp site';
    
    -- Update Corporate TMC RFP Welcome to position 2
    UPDATE specialty_site_agents
    SET sort_order = 2
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'Corporate TMC RFP Welcome');
    
    -- Update RFP Design to position 3
    UPDATE specialty_site_agents
    SET sort_order = 3
    WHERE specialty_site_id = v_site_id
      AND agent_id = v_rfp_design_id;
    
    -- Update Support to position 4
    UPDATE specialty_site_agents
    SET sort_order = 4
    WHERE specialty_site_id = v_site_id
      AND agent_id IN (SELECT id FROM agents WHERE name = 'Support');
    
    RAISE NOTICE 'Updated specialty site agent sort orders';
END $$;

-- ============================================
-- STEP 5: Update constraint to include TMC agents
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

SELECT 
    name, 
    specialty,
    is_active, 
    is_abstract,
    parent_agent_id IS NOT NULL as has_parent
FROM agents 
WHERE name IN ('TMC Specialist', 'TMC Tender')
ORDER BY name;

SELECT 
    a.name as agent_name,
    ssa.is_default_agent,
    ssa.sort_order
FROM specialty_site_agents ssa
JOIN agents a ON ssa.agent_id = a.id
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

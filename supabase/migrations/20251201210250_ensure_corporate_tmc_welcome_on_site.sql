-- Ensure Corporate TMC RFP Welcome agent is properly linked to corporate-tmc-rfp specialty site
-- Fix: Only Corporate TMC RFP Welcome should be default, not TMC Specialist

DO $$
DECLARE
    v_site_id UUID;
    v_welcome_agent_id UUID;
    v_tmc_specialist_id UUID;
BEGIN
    -- Get the corporate-tmc-rfp site ID
    SELECT id INTO v_site_id
    FROM specialty_sites
    WHERE slug = 'corporate-tmc-rfp';

    IF v_site_id IS NULL THEN
        RAISE NOTICE 'corporate-tmc-rfp site not found - skipping';
        RETURN;
    END IF;

    RAISE NOTICE 'Found corporate-tmc-rfp site: %', v_site_id;

    -- Get Corporate TMC RFP Welcome agent ID
    SELECT id INTO v_welcome_agent_id
    FROM agents
    WHERE name = 'Corporate TMC RFP Welcome';

    IF v_welcome_agent_id IS NULL THEN
        RAISE NOTICE 'Corporate TMC RFP Welcome agent not found - skipping';
        RETURN;
    END IF;

    RAISE NOTICE 'Found Corporate TMC RFP Welcome agent: %', v_welcome_agent_id;

    -- Get TMC Specialist agent ID
    SELECT id INTO v_tmc_specialist_id
    FROM agents
    WHERE name = 'TMC Specialist';

    -- Ensure Corporate TMC RFP Welcome is linked to the site as default
    INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
    VALUES (v_site_id, v_welcome_agent_id, true, 0)
    ON CONFLICT (specialty_site_id, agent_id)
    DO UPDATE SET 
        is_default_agent = true,
        sort_order = 0,
        created_at = COALESCE(specialty_site_agents.created_at, NOW());

    RAISE NOTICE 'Configured Corporate TMC RFP Welcome as default agent for corporate-tmc-rfp';

    -- Ensure TMC Specialist is NOT default (only Corporate TMC RFP Welcome should be default)
    IF v_tmc_specialist_id IS NOT NULL THEN
        UPDATE specialty_site_agents
        SET is_default_agent = false
        WHERE specialty_site_id = v_site_id 
          AND agent_id = v_tmc_specialist_id
          AND is_default_agent = true;

        IF FOUND THEN
            RAISE NOTICE 'Removed default status from TMC Specialist';
        END IF;
    END IF;

    -- Show final configuration
    RAISE NOTICE 'Final specialty site agent configuration:';
    PERFORM 1; -- Just to make the query valid in the procedure context

END $$;

-- Display the final configuration for verification
SELECT 
    ss.slug,
    a.name as agent_name,
    ssa.is_default_agent,
    ssa.sort_order
FROM specialty_site_agents ssa
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
JOIN agents a ON ssa.agent_id = a.id
WHERE ss.slug = 'corporate-tmc-rfp'
ORDER BY ssa.sort_order;

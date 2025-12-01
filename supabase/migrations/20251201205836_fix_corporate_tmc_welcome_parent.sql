-- Fix Corporate TMC RFP Welcome agent's parent_agent_id to reference Solutions agent instead of _common
-- This ensures proper inheritance when _common agent doesn't exist in the environment

DO $$
DECLARE
    v_solutions_uuid UUID;
    v_updated_count INT;
BEGIN
    -- Find Solutions agent UUID (the correct parent)
    SELECT id INTO v_solutions_uuid
    FROM agents
    WHERE name = 'Solutions'
    LIMIT 1;

    IF v_solutions_uuid IS NULL THEN
        RAISE NOTICE 'Solutions agent not found - skipping Corporate TMC RFP Welcome parent fix';
        RETURN;
    END IF;

    RAISE NOTICE 'Found Solutions agent UUID: %', v_solutions_uuid;

    -- Update Corporate TMC RFP Welcome to reference Solutions as parent
    UPDATE agents
    SET parent_agent_id = v_solutions_uuid,
        updated_at = NOW()
    WHERE name = 'Corporate TMC RFP Welcome'
      AND (parent_agent_id IS NULL OR parent_agent_id != v_solutions_uuid);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % Corporate TMC RFP Welcome agent record(s) to reference Solutions parent', v_updated_count;
END $$;

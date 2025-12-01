-- Fix TMC Specialist parent_agent_id to point to correct RFP Design agent
-- Issue: TMC Specialist's parent_agent_id points to non-existent agent UUID
-- This causes agent inheritance loading to fail, preventing Claude API from being called
-- Root cause: Welcome message generation fails because agent context cannot be loaded

DO $$
DECLARE
  tmc_specialist_id UUID;
  rfp_design_id UUID;
  old_parent_id UUID;
BEGIN
  -- Find TMC Specialist agent by name (environment-independent)
  SELECT id, parent_agent_id INTO tmc_specialist_id, old_parent_id
  FROM agents
  WHERE name = 'TMC Specialist';

  IF tmc_specialist_id IS NULL THEN
    RAISE NOTICE '❌ TMC Specialist agent not found';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found TMC Specialist agent: %', tmc_specialist_id;
  RAISE NOTICE '⚠️ Current parent_agent_id: %', old_parent_id;

  -- Find RFP Design agent by name (environment-independent)
  SELECT id INTO rfp_design_id
  FROM agents
  WHERE name = 'RFP Design';

  IF rfp_design_id IS NULL THEN
    RAISE NOTICE '❌ RFP Design agent not found';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found RFP Design agent: %', rfp_design_id;

  -- Update TMC Specialist's parent_agent_id to point to RFP Design
  UPDATE agents
  SET parent_agent_id = rfp_design_id,
      updated_at = NOW()
  WHERE id = tmc_specialist_id;

  RAISE NOTICE '✅ Updated TMC Specialist parent_agent_id: % → %', old_parent_id, rfp_design_id;

  -- Verification: Show final configuration
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL TMC SPECIALIST CONFIGURATION ===';
  RAISE NOTICE '';
END $$;

-- Verification query: Show TMC Specialist with parent agent name
SELECT 
  t.id as tmc_specialist_id,
  t.name as tmc_specialist_name,
  t.parent_agent_id,
  p.name as parent_agent_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ BROKEN LINK'
    ELSE '✅ VALID LINK'
  END as inheritance_status
FROM agents t
LEFT JOIN agents p ON t.parent_agent_id = p.id
WHERE t.name = 'TMC Specialist';

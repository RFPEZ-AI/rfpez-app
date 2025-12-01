-- Fix agent parent_agent_id references to use name-based lookup
-- This migration fixes inheritance issues where parent_agent_id UUIDs differ between environments

-- Update all agents that reference _common as parent by name
UPDATE agents
SET parent_agent_id = (SELECT id FROM agents WHERE name = '_common' LIMIT 1)
WHERE parent_agent_id IS NOT NULL
  AND parent_agent_id != (SELECT id FROM agents WHERE name = '_common' LIMIT 1)
  AND EXISTS (SELECT 1 FROM agents WHERE name = '_common');

-- Log the update for verification
DO $$
DECLARE
  common_id uuid;
  updated_count int;
BEGIN
  SELECT id INTO common_id FROM agents WHERE name = '_common' LIMIT 1;
  
  IF common_id IS NOT NULL THEN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Fixed parent_agent_id references to _common (UUID: %)', common_id;
    RAISE NOTICE 'Updated % agent records', updated_count;
  ELSE
    RAISE WARNING '_common agent not found - no updates performed';
  END IF;
END $$;

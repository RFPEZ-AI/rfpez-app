-- Add Respond Agent to System Agents Constraint
-- Created: 2025-11-17
-- Purpose: Allow Respond agent to have account_id=NULL (system agent)

-- Drop existing constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

-- Add constraint with Respond included in whitelist
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check
CHECK (
  (account_id IS NOT NULL) OR 
  (account_id IS NULL AND name IN (
    'Solutions',
    'RFP Design',
    'Support',
    'RFP Assistant',
    'Sourcing',
    'TMC Specialist',
    'TMC Tender',
    'Respond',
    '_common'
  ))
);

-- Verify constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'agents_account_id_check';

-- Add TMC Tender to system agents constraint
-- This allows TMC Tender to have NULL account_id like other system agents

-- First, fix any existing system agents that have account_id set
UPDATE agents 
SET account_id = NULL 
WHERE name IN (
  'Solutions',
  'RFP Design',
  'Support',
  'RFP Assistant',
  'Sourcing',
  'TMC Specialist',
  'TMC Tender',
  '_common'
) AND account_id IS NOT NULL;

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  -- System agents MUST have account_id IS NULL
  (
    name = ANY (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      'TMC Specialist'::text,
      'TMC Tender'::text,
      '_common'::text
    ])
    AND account_id IS NULL
  )
  OR
  -- Non-system agents can have any account_id value (NULL or NOT NULL)
  (
    name <> ALL (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      'TMC Specialist'::text,
      'TMC Tender'::text,
      '_common'::text
    ])
  )
);

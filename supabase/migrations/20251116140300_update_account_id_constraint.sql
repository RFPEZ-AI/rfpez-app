-- Migration: Update agents_account_id_check constraint to include _common
-- Purpose: Allow _common agent to be a global agent without account_id

-- Drop existing constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

-- Recreate constraint with _common included in the global agents list
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  (
    -- Global agents (no account_id required)
    name = ANY (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      '_common'::text  -- Added _common as global base agent
    ])
    AND account_id IS NULL
  )
  OR
  (
    -- Account-specific agents (account_id required)
    name <> ALL (ARRAY[
      'Solutions'::text,
      'RFP Design'::text,
      'Support'::text,
      'RFP Assistant'::text,
      'Sourcing'::text,
      '_common'::text  -- Exclude _common from account-specific agents
    ])
    AND account_id IS NOT NULL
  )
);

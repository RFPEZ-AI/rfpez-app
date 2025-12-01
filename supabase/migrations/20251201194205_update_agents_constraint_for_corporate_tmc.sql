-- Update agents_account_id_check constraint to include Corporate TMC RFP Welcome
-- This allows the new Corporate TMC RFP Welcome agent to be a global agent (account_id IS NULL)

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
    AND account_id IS NULL
  )
  OR
  (
    (name <> ALL (ARRAY[
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
    AND account_id IS NOT NULL
  )
);

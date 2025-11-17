-- Add TMC Tender to system agents constraint
-- This allows TMC Tender to have NULL account_id like other system agents

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
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
  ) AND account_id IS NULL
  OR
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
  ) AND account_id IS NOT NULL
);

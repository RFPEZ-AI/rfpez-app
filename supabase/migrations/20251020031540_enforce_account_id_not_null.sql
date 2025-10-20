-- Enforce account_id NOT NULL constraint
-- Migration: 20251020031540_enforce_account_id_not_null.sql
-- Purpose: Enforce account ownership by making account_id required on all user-created records
-- Exception: System agents (Solutions, RFP Design, Support, RFP Assistant) can have NULL account_id for system-wide access

BEGIN;

-- First, assign any orphaned sessions to the default account (mskiba's Account)
-- This ensures we don't have constraint violations when we make account_id NOT NULL
DO $$
DECLARE
  default_account_id uuid;
  updated_count INT;
BEGIN
  -- Get the default account (mskiba's Account)
  SELECT id INTO default_account_id FROM accounts WHERE name = 'mskiba''s Account' LIMIT 1;
  
  IF default_account_id IS NOT NULL THEN
    -- Update orphaned sessions
    UPDATE sessions SET account_id = default_account_id WHERE account_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Assigned % orphaned sessions to default account', updated_count;
  ELSE
    RAISE NOTICE 'No default account found - no sessions updated';
  END IF;
END $$;

-- Now make account_id NOT NULL on all tables except agents
-- Agents table will use a CHECK constraint instead to allow system agents

-- 1. sessions table
ALTER TABLE sessions 
  ALTER COLUMN account_id SET NOT NULL;

-- 2. messages table  
ALTER TABLE messages
  ALTER COLUMN account_id SET NOT NULL;

-- 3. rfps table
ALTER TABLE rfps
  ALTER COLUMN account_id SET NOT NULL;

-- 4. artifacts table
ALTER TABLE artifacts
  ALTER COLUMN account_id SET NOT NULL;

-- 5. bids table
ALTER TABLE bids
  ALTER COLUMN account_id SET NOT NULL;

-- 6. session_artifacts table
ALTER TABLE session_artifacts
  ALTER COLUMN account_id SET NOT NULL;

-- 7. agents table - special handling
-- For agents, we allow NULL account_id ONLY for system agents
-- All custom agents MUST have an account_id

-- First, add a CHECK constraint to ensure account_id is set for non-system agents
ALTER TABLE agents
  DROP CONSTRAINT IF EXISTS agents_account_id_check;

ALTER TABLE agents
  ADD CONSTRAINT agents_account_id_check 
  CHECK (
    -- System agents can have NULL account_id
    (name IN ('Solutions', 'RFP Design', 'Support', 'RFP Assistant') AND account_id IS NULL)
    OR
    -- All other agents must have account_id
    (name NOT IN ('Solutions', 'RFP Design', 'Support', 'RFP Assistant') AND account_id IS NOT NULL)
  );

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Account ownership enforcement complete!';
  RAISE NOTICE '  - sessions: account_id now NOT NULL';
  RAISE NOTICE '  - messages: account_id now NOT NULL';
  RAISE NOTICE '  - rfps: account_id now NOT NULL';
  RAISE NOTICE '  - artifacts: account_id now NOT NULL';
  RAISE NOTICE '  - bids: account_id now NOT NULL';
  RAISE NOTICE '  - session_artifacts: account_id now NOT NULL';
  RAISE NOTICE '  - agents: CHECK constraint ensures custom agents have account_id';
  RAISE NOTICE '  - System agents (Solutions, RFP Design, Support, RFP Assistant) preserved with NULL account_id';
END $$;

COMMIT;

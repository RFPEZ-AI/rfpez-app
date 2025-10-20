-- Purge records with null account_id
-- Migration: 20251020030045_purge_null_account_id_records.sql
-- Purpose: Clean up legacy records that don't have account associations
-- Account-based architecture requires all records to be associated with an account

BEGIN;

-- Log what we're about to delete (for audit trail)
DO $$
DECLARE
  rfp_count INT;
  artifact_count INT;
  message_count INT;
  session_count INT;
  agent_count INT;
BEGIN
  SELECT COUNT(*) INTO rfp_count FROM rfps WHERE account_id IS NULL;
  SELECT COUNT(*) INTO artifact_count FROM artifacts WHERE account_id IS NULL;
  SELECT COUNT(*) INTO message_count FROM messages WHERE account_id IS NULL;
  SELECT COUNT(*) INTO session_count FROM sessions WHERE account_id IS NULL;
  SELECT COUNT(*) INTO agent_count FROM agents WHERE account_id IS NULL AND name NOT IN ('Solutions', 'RFP Design', 'Support', 'RFP Assistant');
  
  RAISE NOTICE 'Purging records with null account_id:';
  RAISE NOTICE '  - RFPs: % records', rfp_count;
  RAISE NOTICE '  - Artifacts: % records', artifact_count;
  RAISE NOTICE '  - Messages: % records', message_count;
  RAISE NOTICE '  - Sessions: % records', session_count;
  RAISE NOTICE '  - Custom Agents: % records', agent_count;
END $$;

-- Delete orphaned messages (messages without account_id)
-- These are legacy messages from before account-based architecture
DELETE FROM messages WHERE account_id IS NULL;

-- Delete orphaned sessions (sessions without account_id)
-- Note: This will cascade to related session_agents records
DELETE FROM sessions WHERE account_id IS NULL;

-- Delete orphaned artifacts (artifacts without account_id)
-- These are likely test artifacts or legacy data
DELETE FROM artifacts WHERE account_id IS NULL;

-- Delete orphaned RFPs (RFPs without account_id)
-- Note: This will cascade to related bids and rfp_artifacts
DELETE FROM rfps WHERE account_id IS NULL;

-- For agents: Keep default system agents (Solutions, RFP Design, Support, RFP Assistant)
-- Only delete custom agents without account_id
DELETE FROM agents 
WHERE account_id IS NULL 
AND name NOT IN ('Solutions', 'RFP Design', 'Support', 'RFP Assistant');

-- Note: We preserve default agents with NULL account_id as they are system-wide
-- These agents are accessible to all users regardless of account

-- Final summary
DO $$ 
BEGIN
  RAISE NOTICE 'Purge complete. All orphaned records removed.';
  RAISE NOTICE 'System agents (Solutions, RFP Design, Support, RFP Assistant) preserved with NULL account_id for system-wide access.';
END $$;

COMMIT;

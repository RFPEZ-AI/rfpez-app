-- Migration: Allow NULL account_id for system-wide knowledge
-- Purpose: Enable system-wide knowledge base entries that aren't tied to specific accounts

BEGIN;

-- Allow account_id to be NULL for system-wide knowledge entries
ALTER TABLE public.account_memories 
  ALTER COLUMN account_id DROP NOT NULL;

-- Add a check constraint to ensure system-wide knowledge has NULL user_id
-- (Knowledge should be either account-specific OR system-wide, not both)
ALTER TABLE public.account_memories
  ADD CONSTRAINT check_system_knowledge_user_id 
  CHECK (
    (memory_type != 'knowledge') OR 
    (account_id IS NOT NULL) OR 
    (account_id IS NULL AND user_id IS NULL)
  );

-- Add comment explaining the purpose
COMMENT ON COLUMN public.account_memories.account_id IS 
  'Account ID - can be NULL for system-wide knowledge entries';

-- Update RLS policies to allow reading system-wide knowledge (account_id IS NULL)
DROP POLICY IF EXISTS "Users can view system knowledge" ON public.account_memories;

CREATE POLICY "Users can view system knowledge"
  ON public.account_memories
  FOR SELECT
  TO authenticated
  USING (
    memory_type = 'knowledge' 
    AND user_id IS NULL 
    AND account_id IS NULL
  );

COMMIT;

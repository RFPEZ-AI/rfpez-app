-- ============================================================================
-- Add Knowledge Memory Type Support
-- ============================================================================
-- This migration enables system-level knowledge base memories that can be
-- shared across all users for procedural documentation and agent guidance.
--
-- Changes:
-- 1. Add 'knowledge' to memory_type enum
-- 2. Make user_id nullable to support system-level memories
-- 3. Add indexes for efficient knowledge retrieval
-- 4. Update RLS policies to allow reading system knowledge memories
--
-- Rollback: Restore original constraints if needed
-- ============================================================================

-- Step 1: Add 'knowledge' to memory_type check constraint
ALTER TABLE public.account_memories 
  DROP CONSTRAINT IF EXISTS account_memories_memory_type_check;

ALTER TABLE public.account_memories
  ADD CONSTRAINT account_memories_memory_type_check
  CHECK (memory_type IN (
    'conversation',
    'preference', 
    'fact',
    'decision',
    'context',
    'knowledge'  -- NEW: System-level procedural knowledge
  ));

-- Step 2: Make user_id nullable to support system-level memories
-- System memories have user_id = NULL and are accessible to all users
ALTER TABLE public.account_memories 
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add indexes for efficient knowledge retrieval
CREATE INDEX IF NOT EXISTS idx_account_memories_knowledge 
  ON public.account_memories(account_id, memory_type) 
  WHERE memory_type = 'knowledge' AND user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_account_memories_system_knowledge
  ON public.account_memories(account_id, importance_score DESC)
  WHERE memory_type = 'knowledge' AND user_id IS NULL;

-- Step 4: Update RLS policy to allow reading system knowledge memories
-- Users can view their own memories AND system-level knowledge memories
DROP POLICY IF EXISTS "Users can view their own account memories" ON public.account_memories;
CREATE POLICY "Users can view their own account memories" 
  ON public.account_memories FOR SELECT 
  USING (
    user_id = auth.uid() OR  -- User's own memories
    (user_id IS NULL AND memory_type = 'knowledge')  -- System knowledge (public)
  );

-- Insert policy for system knowledge (only service role can create)
-- This prevents regular users from creating system-level memories
DROP POLICY IF EXISTS "Service role can insert system knowledge" ON public.account_memories;
CREATE POLICY "Service role can insert system knowledge"
  ON public.account_memories FOR INSERT
  WITH CHECK (
    CASE 
      WHEN user_id IS NULL AND memory_type = 'knowledge' THEN 
        -- System knowledge can only be inserted by service role
        auth.jwt() ->> 'role' = 'service_role'
      ELSE
        -- Regular memories must belong to authenticated user
        user_id = auth.uid()
    END
  );

-- Update existing insert policy name for clarity
DROP POLICY IF EXISTS "Users can insert their own account memories" ON public.account_memories;
CREATE POLICY "Users can insert their own memories"
  ON public.account_memories FOR INSERT
  WITH CHECK (user_id = auth.uid() AND memory_type != 'knowledge');

-- Comment explaining the system
COMMENT ON COLUMN public.account_memories.user_id IS 
  'User who owns the memory. NULL for system-level knowledge memories accessible to all users.';

COMMENT ON CONSTRAINT account_memories_memory_type_check ON public.account_memories IS 
  'Allowed memory types: conversation, preference, fact, decision, context, knowledge. Knowledge type is for system-level procedural documentation.';

-- ============================================================================
-- Verification Queries (for testing after migration)
-- ============================================================================
-- 
-- -- Test that knowledge type is accepted:
-- INSERT INTO account_memories (account_id, user_id, memory_type, content, importance_score)
-- VALUES (
--   (SELECT id FROM agents WHERE name = 'RFP Design' LIMIT 1),
--   NULL,
--   'knowledge',
--   'Test system knowledge entry',
--   0.9
-- );
--
-- -- Verify indexes were created:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'account_memories' 
-- AND indexname LIKE '%knowledge%';
--
-- ============================================================================

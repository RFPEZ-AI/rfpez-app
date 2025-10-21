-- ============================================================================
-- RENAME agent_memories TO account_memories
-- Rename table and all related objects to reflect account-based architecture
-- ============================================================================

-- Step 1: Rename the main table
ALTER TABLE IF EXISTS public.agent_memories 
  RENAME TO account_memories;

-- Step 2: Rename the primary key constraint
ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_pkey TO account_memories_pkey;

-- Step 3: Rename foreign key constraints
ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_account_id_fkey TO account_memories_account_id_fkey;

ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_session_id_fkey TO account_memories_session_id_fkey;

ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_user_id_fkey TO account_memories_user_id_fkey;

-- Step 4: Rename check constraints
ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_importance_score_check TO account_memories_importance_score_check;

ALTER TABLE public.account_memories 
  RENAME CONSTRAINT agent_memories_memory_type_check TO account_memories_memory_type_check;

-- Step 5: Rename indexes
ALTER INDEX IF EXISTS idx_agent_memories_account 
  RENAME TO idx_account_memories_account;

ALTER INDEX IF EXISTS idx_agent_memories_account_user 
  RENAME TO idx_account_memories_account_user;

ALTER INDEX IF EXISTS idx_agent_memories_created 
  RENAME TO idx_account_memories_created;

ALTER INDEX IF EXISTS idx_agent_memories_expires 
  RENAME TO idx_account_memories_expires;

ALTER INDEX IF EXISTS idx_agent_memories_importance 
  RENAME TO idx_account_memories_importance;

ALTER INDEX IF EXISTS idx_agent_memories_search 
  RENAME TO idx_account_memories_search;

ALTER INDEX IF EXISTS idx_agent_memories_session 
  RENAME TO idx_account_memories_session;

ALTER INDEX IF EXISTS idx_agent_memories_type 
  RENAME TO idx_account_memories_type;

ALTER INDEX IF EXISTS idx_agent_memories_embedding 
  RENAME TO idx_account_memories_embedding;

-- Step 6: Update foreign key references in related tables
-- memory_references table
ALTER TABLE public.memory_references 
  DROP CONSTRAINT IF EXISTS memory_references_memory_id_fkey;

ALTER TABLE public.memory_references 
  ADD CONSTRAINT memory_references_memory_id_fkey 
  FOREIGN KEY (memory_id) REFERENCES public.account_memories(id) ON DELETE CASCADE;

-- memory_access_log table
ALTER TABLE public.memory_access_log 
  DROP CONSTRAINT IF EXISTS memory_access_log_memory_id_fkey;

ALTER TABLE public.memory_access_log 
  ADD CONSTRAINT memory_access_log_memory_id_fkey 
  FOREIGN KEY (memory_id) REFERENCES public.account_memories(id) ON DELETE CASCADE;

-- Step 7: Update RLS policies (they reference the table)
-- Note: Policies are automatically moved when table is renamed, but we'll recreate them
-- to ensure they have proper names

DROP POLICY IF EXISTS "Account users can view account memories" ON public.account_memories;
DROP POLICY IF EXISTS "Account users can insert account memories" ON public.account_memories;
DROP POLICY IF EXISTS "Account users can update account memories" ON public.account_memories;
DROP POLICY IF EXISTS "Account users can delete account memories" ON public.account_memories;

CREATE POLICY "Users can view account memories" 
  ON public.account_memories FOR SELECT 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert account memories" 
  ON public.account_memories FOR INSERT 
  WITH CHECK (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update account memories" 
  ON public.account_memories FOR UPDATE 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete account memories" 
  ON public.account_memories FOR DELETE 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Step 8: Update search function to reference new table name
CREATE OR REPLACE FUNCTION search_account_memories(
  p_account_id UUID,
  p_user_id UUID,
  p_query_embedding extensions.vector(384),
  p_memory_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  importance_score FLOAT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.memory_type,
    m.importance_score,
    1 - (m.embedding <=> p_query_embedding) AS similarity,
    m.created_at,
    m.metadata
  FROM account_memories m
  WHERE 
    m.account_id = p_account_id
    AND m.user_id = p_user_id
    AND (p_memory_types IS NULL OR m.memory_type = ANY(p_memory_types))
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND (1 - (m.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY 
    (1 - (m.embedding <=> p_query_embedding)) DESC,
    m.importance_score DESC,
    m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Step 9: Update full-text search function
CREATE OR REPLACE FUNCTION search_account_memories_fulltext(
  p_account_id UUID,
  p_user_id UUID,
  p_query TEXT,
  p_memory_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  importance_score FLOAT,
  rank FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.memory_type,
    m.importance_score,
    ts_rank(m.search_vector, plainto_tsquery('english', p_query)) AS rank,
    m.created_at,
    m.metadata
  FROM account_memories m
  WHERE 
    m.account_id = p_account_id
    AND m.user_id = p_user_id
    AND (p_memory_types IS NULL OR m.memory_type = ANY(p_memory_types))
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND m.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY 
    ts_rank(m.search_vector, plainto_tsquery('english', p_query)) DESC,
    m.importance_score DESC,
    m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Step 10: Drop old function names (if they exist with old signatures)
DROP FUNCTION IF EXISTS search_agent_memories(UUID, UUID, vector(384), TEXT[], INTEGER, FLOAT);
DROP FUNCTION IF EXISTS search_agent_memories_fulltext(UUID, UUID, TEXT, TEXT[], INTEGER);

-- Step 11: Update table comment
COMMENT ON TABLE public.account_memories IS 
  'Account memories are organizational assets shared across all users in an account. Provides long-term memory capabilities for conversations and context retention.';

-- Step 12: Add comment for clarity
COMMENT ON COLUMN public.account_memories.account_id IS 
  'The account that owns this memory. All users in the account can access and contribute to the shared memory pool.';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify table exists with new name
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_memories';

-- Verify indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'account_memories';

-- Verify RLS policies
-- SELECT policyname FROM pg_policies WHERE tablename = 'account_memories';

-- Verify functions
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%account_memories%';

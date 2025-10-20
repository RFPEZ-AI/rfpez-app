-- ============================================================================
-- CONVERT MEMORIES TO ACCOUNT-BASED ACCESS
-- Remove agent_id dependency and add account_id for proper multi-tenancy
-- Memories are organizational assets shared within an account, not agent-specific
-- ============================================================================

-- Step 1: Drop existing RLS policies that depend on old structure
DROP POLICY IF EXISTS "Users can view their own agent memories" ON public.agent_memories;
DROP POLICY IF EXISTS "Users can insert their own agent memories" ON public.agent_memories;
DROP POLICY IF EXISTS "Users can update their own agent memories" ON public.agent_memories;
DROP POLICY IF EXISTS "Users can delete their own agent memories" ON public.agent_memories;

-- Step 2: Drop foreign key constraint on agent_id (we're removing this column)
ALTER TABLE public.agent_memories 
  DROP CONSTRAINT IF EXISTS agent_memories_agent_id_fkey;

-- Step 3: Drop the agent_id column
ALTER TABLE public.agent_memories 
  DROP COLUMN IF EXISTS agent_id;

-- Step 4: Add account_id column (nullable initially for safe migration)
ALTER TABLE public.agent_memories 
  ADD COLUMN IF NOT EXISTS account_id UUID;

-- Step 5: Add foreign key constraint to accounts table
ALTER TABLE public.agent_memories 
  ADD CONSTRAINT agent_memories_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Step 6: Update existing memories to get account_id from user's account
-- Since we have no data, this is safe, but included for completeness
UPDATE public.agent_memories am
SET account_id = (
  SELECT au.account_id 
  FROM public.account_users au
  WHERE au.user_id = (
    SELECT up.supabase_user_id 
    FROM public.user_profiles up 
    WHERE up.id = am.user_id
  )
  LIMIT 1
)
WHERE am.account_id IS NULL;

-- Step 7: Make account_id NOT NULL now that data is populated
ALTER TABLE public.agent_memories 
  ALTER COLUMN account_id SET NOT NULL;

-- Step 8: Drop old index that included agent_id
DROP INDEX IF EXISTS idx_agent_memories_user_agent;

-- Step 9: Create new indexes for account-based access
CREATE INDEX IF NOT EXISTS idx_agent_memories_account 
  ON public.agent_memories(account_id);

CREATE INDEX IF NOT EXISTS idx_agent_memories_account_user 
  ON public.agent_memories(account_id, user_id);

-- Step 10: Create new RLS policies for account-based access
-- Users can view memories for accounts they belong to
CREATE POLICY "Account users can view account memories" 
  ON public.agent_memories FOR SELECT 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Users can insert memories for accounts they belong to
CREATE POLICY "Account users can insert account memories" 
  ON public.agent_memories FOR INSERT 
  WITH CHECK (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Users can update memories for accounts they belong to
CREATE POLICY "Account users can update account memories" 
  ON public.agent_memories FOR UPDATE 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Users can delete memories for accounts they belong to
CREATE POLICY "Account users can delete account memories" 
  ON public.agent_memories FOR DELETE 
  USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Step 11: Update the search function to use account_id instead of agent_id
CREATE OR REPLACE FUNCTION search_agent_memories(
  p_account_id UUID,
  p_user_id UUID,
  p_query_embedding vector(384),
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
  FROM agent_memories m
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

-- Step 12: Update helper function for full-text search
CREATE OR REPLACE FUNCTION search_agent_memories_fulltext(
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
  FROM agent_memories m
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

-- Step 13: Add comment documenting the change
COMMENT ON TABLE public.agent_memories IS 
  'Agent memories are account-scoped organizational assets. All users within an account can access and contribute to the shared memory pool.';

COMMENT ON COLUMN public.agent_memories.account_id IS 
  'The account that owns this memory. Memories are shared across all users in the account for organizational knowledge continuity.';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'agent_memories' AND column_name IN ('account_id', 'agent_id')
-- ORDER BY column_name;

-- Verify RLS policies
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'agent_memories';

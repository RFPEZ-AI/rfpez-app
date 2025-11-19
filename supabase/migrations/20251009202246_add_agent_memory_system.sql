-- ============================================================================
-- AGENT MEMORY SYSTEM
-- Provides long-term memory capabilities for RFPEZ agents using pgvector
-- ============================================================================

-- Ensure pgvector extension is available (in public schema for local, extensions for remote)
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent memory entries - stores semantically searchable memory chunks
CREATE TABLE IF NOT EXISTS public.agent_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  
  -- Memory content
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'conversation',    -- Conversation snippets
    'preference',      -- User preferences
    'fact',           -- Important facts about user or context
    'decision',       -- Important decisions made
    'context'         -- Contextual information about RFPs, bids, etc.
  )),
  
  -- Vector embedding for semantic search
  embedding vector(384), -- gte-small model produces 384 dimensions
  
  -- Metadata
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  access_count INTEGER DEFAULT 0, -- Track how often this memory is recalled
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Temporal tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry for temporary memories
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Full-text search support
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED
);

-- Memory relationships - link memories to specific entities
CREATE TABLE IF NOT EXISTS public.memory_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference type and ID (flexible reference system)
  reference_type TEXT NOT NULL CHECK (reference_type IN (
    'rfp',
    'bid',
    'artifact',
    'message',
    'user_profile'
  )),
  reference_id UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(memory_id, reference_type, reference_id)
);

-- Memory access log - track when memories are retrieved
CREATE TABLE IF NOT EXISTS public.memory_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relevance_score FLOAT, -- How relevant was this memory to the query
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vector similarity search index (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding ON public.agent_memories 
  USING hnsw (embedding vector_cosine_ops);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_agent_memories_search ON public.agent_memories 
  USING gin(search_vector);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_agent_memories_user_agent ON public.agent_memories(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_session ON public.agent_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON public.agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON public.agent_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created ON public.agent_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_expires ON public.agent_memories(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Reference lookups
CREATE INDEX IF NOT EXISTS idx_memory_references_memory ON public.memory_references(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_references_ref ON public.memory_references(reference_type, reference_id);

-- Access log analytics
CREATE INDEX IF NOT EXISTS idx_memory_access_log_memory ON public.memory_access_log(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_access_log_session ON public.memory_access_log(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_access_log ENABLE ROW LEVEL SECURITY;

-- Agent memories: users can only access their own memories
DROP POLICY IF EXISTS "Users can view their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can view their own agent memories" 
  ON public.agent_memories FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can insert their own agent memories" 
  ON public.agent_memories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can update their own agent memories" 
  ON public.agent_memories FOR UPDATE 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can delete their own agent memories" 
  ON public.agent_memories FOR DELETE 
  USING (user_id = auth.uid());

-- Memory references: follow the same access pattern as memories
DROP POLICY IF EXISTS "Users can view memory references" ON public.memory_references;
CREATE POLICY "Users can view memory references" 
  ON public.memory_references FOR SELECT 
  USING (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert memory references" ON public.memory_references;
CREATE POLICY "Users can insert memory references" 
  ON public.memory_references FOR INSERT 
  WITH CHECK (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

-- Memory access log: users can view access logs for their memories
DROP POLICY IF EXISTS "Users can view memory access logs" ON public.memory_access_log;
CREATE POLICY "Users can view memory access logs" 
  ON public.memory_access_log FOR SELECT 
  USING (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert memory access logs" ON public.memory_access_log;
CREATE POLICY "System can insert memory access logs" 
  ON public.memory_access_log FOR INSERT 
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to search agent memories by semantic similarity
CREATE OR REPLACE FUNCTION search_agent_memories(
  p_user_id UUID,
  p_agent_id UUID,
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
    1 - (m.embedding <=> p_query_embedding) as similarity,
    m.created_at,
    m.metadata
  FROM public.agent_memories m
  WHERE m.user_id = p_user_id
    AND m.agent_id = p_agent_id
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND (p_memory_types IS NULL OR m.memory_type = ANY(p_memory_types))
    AND 1 - (m.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY 
    (m.embedding <=> p_query_embedding) ASC,
    m.importance_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access(
  p_memory_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_relevance_score FLOAT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the memory record
  UPDATE public.agent_memories
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_memory_id;
  
  -- Log the access
  INSERT INTO public.memory_access_log (
    memory_id,
    session_id,
    agent_id,
    relevance_score
  )
  VALUES (
    p_memory_id,
    p_session_id,
    p_agent_id,
    p_relevance_score
  );
END;
$$;

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.agent_memories
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get memory statistics for a user
CREATE OR REPLACE FUNCTION get_memory_statistics(
  p_user_id UUID,
  p_agent_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_memories BIGINT,
  memory_type TEXT,
  count BIGINT,
  avg_importance FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) OVER() as total_memories,
    m.memory_type,
    COUNT(*) as count,
    AVG(m.importance_score) as avg_importance
  FROM public.agent_memories m
  WHERE m.user_id = p_user_id
    AND (p_agent_id IS NULL OR m.agent_id = p_agent_id)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  GROUP BY m.memory_type
  ORDER BY count DESC;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_agent_memories TO authenticated;
GRANT EXECUTE ON FUNCTION update_memory_access TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_memories TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_statistics TO authenticated;

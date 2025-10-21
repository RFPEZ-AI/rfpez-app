-- Fix search_account_memories function to include extensions schema in search_path
-- The issue: vector extension is in 'extensions' schema but function only searches 'public'
-- Solution: Update search_path to include both 'public' and 'extensions'

CREATE OR REPLACE FUNCTION public.search_account_memories(
  p_account_id uuid,
  p_user_id uuid,
  p_query_embedding extensions.vector,
  p_memory_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_similarity_threshold double precision DEFAULT 0.7
)
RETURNS TABLE(
  id uuid,
  content text,
  memory_type text,
  importance_score double precision,
  similarity double precision,
  created_at timestamp with time zone,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'  -- ✅ Include extensions schema for vector operators
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_account_memories TO authenticated;
GRANT EXECUTE ON FUNCTION search_account_memories TO service_role;
GRANT EXECUTE ON FUNCTION search_account_memories TO anon;

-- Verify function updated
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'search_account_memories';

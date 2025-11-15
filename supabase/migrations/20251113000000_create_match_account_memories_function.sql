-- Create function for semantic search using vector similarity
-- This function matches account memories based on embedding similarity

CREATE OR REPLACE FUNCTION match_account_memories(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_account_id uuid DEFAULT NULL,
  filter_memory_type text DEFAULT 'knowledge'
)
RETURNS TABLE (
  id uuid,
  content text,
  file_name text,
  file_type text,
  mime_type text,
  importance_score float,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.content,
    am.file_name,
    am.file_type,
    am.mime_type,
    am.importance_score,
    1 - (am.embedding <=> query_embedding) AS similarity,
    am.metadata,
    am.created_at
  FROM account_memories am
  WHERE 
    -- Filter by account if provided
    (filter_account_id IS NULL OR am.account_id = filter_account_id)
    -- Filter by memory type
    AND am.memory_type = filter_memory_type
    -- Only include entries with embeddings
    AND am.embedding IS NOT NULL
    -- Filter by similarity threshold (cosine distance)
    AND 1 - (am.embedding <=> query_embedding) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index on embedding column for faster similarity search
-- Using ivfflat index with cosine distance
CREATE INDEX IF NOT EXISTS idx_account_memories_embedding 
  ON account_memories 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Add comment to document the function
COMMENT ON FUNCTION match_account_memories IS 
  'Semantic search function for account memories using vector embeddings. 
   Uses cosine similarity with pgvector extension.
   Returns memories ordered by similarity to query embedding.';

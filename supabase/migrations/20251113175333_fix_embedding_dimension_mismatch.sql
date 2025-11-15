-- Fix embedding dimension mismatch: Change from 768 to 1024 dimensions
-- Voyage AI voyage-2 model generates 1024-dimensional embeddings
-- This was causing embeddings to fail silently when storing

-- Step 1: Drop the existing index (it references the old column type)
DROP INDEX IF EXISTS idx_account_memories_embedding;

-- Step 2: Alter the embedding column to use 1024 dimensions
ALTER TABLE account_memories
ALTER COLUMN embedding TYPE vector(1024);

-- Step 3: Recreate the HNSW index with the correct dimension
CREATE INDEX idx_account_memories_embedding ON account_memories 
USING hnsw (embedding vector_cosine_ops);

-- Step 4: Update the match_account_memories function to use correct dimension
DROP FUNCTION IF EXISTS match_account_memories(vector(768), uuid, text, double precision, int);

CREATE OR REPLACE FUNCTION match_account_memories(
  query_embedding vector(1024),
  filter_account_id uuid,
  filter_memory_type text,
  match_threshold double precision DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  account_id uuid,
  user_id uuid,
  memory_type text,
  content text,
  importance_score float,
  metadata jsonb,
  similarity float,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.account_id,
    am.user_id,
    am.memory_type,
    am.content,
    am.importance_score,
    am.metadata,
    (1 - (am.embedding <=> query_embedding))::float as similarity,
    am.created_at
  FROM account_memories am
  WHERE 
    am.account_id = filter_account_id
    AND am.memory_type = filter_memory_type
    AND am.embedding IS NOT NULL
    AND (1 - (am.embedding <=> query_embedding)) >= match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment explaining the dimension requirement
COMMENT ON COLUMN account_memories.embedding IS 'Voyage AI voyage-2 model generates 1024-dimensional embeddings for multilingual semantic search';

-- ============================================================================
-- ADD EMBEDDING COLUMN TO ACCOUNT_MEMORIES
-- The embedding column was missing after table rename - adding it back
-- ============================================================================

-- Add the embedding column for vector similarity search
ALTER TABLE public.account_memories 
  ADD COLUMN IF NOT EXISTS embedding extensions.vector(384);

-- Create index for vector similarity search using HNSW algorithm
CREATE INDEX IF NOT EXISTS idx_account_memories_embedding 
  ON public.account_memories 
  USING hnsw (embedding extensions.vector_cosine_ops);

-- Add comment
COMMENT ON COLUMN public.account_memories.embedding IS 'Vector embedding for semantic similarity search (384 dimensions from gte-small model)';

-- Verification query (run after migration to confirm)
-- SELECT column_name, udt_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'account_memories' AND column_name = 'embedding';

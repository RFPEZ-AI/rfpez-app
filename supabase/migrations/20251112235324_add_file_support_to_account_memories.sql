-- Migration: Add file upload support to account_memories table
-- Description: Adds columns to support file uploads (PDFs, images, documents) with metadata

-- Add file-related columns to account_memories table
ALTER TABLE account_memories
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS original_file_path TEXT;

-- Add index on file_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_memories_file_name 
  ON account_memories(file_name) 
  WHERE file_name IS NOT NULL;

-- Add index on file_type for filtering by file type
CREATE INDEX IF NOT EXISTS idx_account_memories_file_type 
  ON account_memories(file_type) 
  WHERE file_type IS NOT NULL;

-- Add index on account_id and memory_type for knowledge base queries
CREATE INDEX IF NOT EXISTS idx_account_memories_account_knowledge 
  ON account_memories(account_id, memory_type) 
  WHERE memory_type = 'knowledge';

-- Add comments to document the new columns
COMMENT ON COLUMN account_memories.file_name IS 'Original filename of uploaded file (e.g., document.pdf)';
COMMENT ON COLUMN account_memories.file_type IS 'File type category: pdf, image, text, document, spreadsheet';
COMMENT ON COLUMN account_memories.file_size_bytes IS 'File size in bytes for storage tracking';
COMMENT ON COLUMN account_memories.mime_type IS 'MIME type of the file (e.g., application/pdf, image/jpeg)';
COMMENT ON COLUMN account_memories.original_file_path IS 'Storage path or URL to the original file (if stored separately)';

-- Update the memory_type constraint to ensure knowledge type is used for uploaded files
-- (The existing constraint already supports 'knowledge' type, no changes needed)

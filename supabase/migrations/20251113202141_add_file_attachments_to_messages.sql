-- Add file attachments tracking to messages table
-- This allows messages to reference files that were uploaded to the knowledge base
-- Files are stored in account_memories, this just creates the link

-- Add file_attachments column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.messages.file_attachments IS 'Array of file references: [{memory_id: uuid, file_name: string, file_type: string, file_size: number, uploaded_at: timestamp}]';

-- Create index for querying messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_has_attachments 
ON public.messages ((file_attachments != '[]'::jsonb));

-- Create index for searching within file_attachments JSONB
CREATE INDEX IF NOT EXISTS idx_messages_file_attachments_gin 
ON public.messages USING gin (file_attachments);

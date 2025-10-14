-- Add access column to agents table for tool access control
-- This column stores an array of allowed tool names for each agent

-- Add access column as text array
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS access TEXT[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.agents.access IS 'Array of allowed tool names for this agent. If NULL, agent has access to all tools appropriate for their role.';

-- Create index for faster tool access lookups
CREATE INDEX IF NOT EXISTS idx_agents_access_tools ON public.agents USING GIN (access);

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agents'
  AND column_name = 'access';

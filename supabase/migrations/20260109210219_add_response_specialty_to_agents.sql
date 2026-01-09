-- Add response_specialty column to agents table
-- This column was referenced in agent update migrations but never added to the schema

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agents' 
    AND column_name = 'response_specialty'
  ) THEN
    ALTER TABLE public.agents 
    ADD COLUMN response_specialty TEXT DEFAULT 'respond';
    
    RAISE NOTICE 'Added response_specialty column to agents table';
  ELSE
    RAISE NOTICE 'response_specialty column already exists';
  END IF;
END $$;

-- Add a comment to document the column
COMMENT ON COLUMN public.agents.response_specialty IS 'Determines agent response behavior: respond (normal chat), redirect (send to another agent), etc.';

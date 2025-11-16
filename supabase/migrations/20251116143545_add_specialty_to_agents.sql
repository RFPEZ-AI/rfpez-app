-- Add specialty field to agents table
-- Allows agents to be assigned to specialty sites (e.g., TMC-specific portal)

ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS specialty TEXT;

COMMENT ON COLUMN agents.specialty IS 'Specialty site assignment (e.g., "tmc", "led-lighting", "general"). NULL indicates general-purpose agent.';

-- Create index for specialty filtering
CREATE INDEX IF NOT EXISTS idx_agents_specialty ON agents(specialty) WHERE specialty IS NOT NULL;

-- Update existing agents with specialty values where applicable
-- TMC Specialist gets 'tmc' specialty
UPDATE agents 
SET specialty = 'tmc' 
WHERE name = 'TMC Specialist';

-- General agents remain NULL (default behavior)
-- This allows filtering: WHERE specialty = 'tmc' OR specialty IS NULL

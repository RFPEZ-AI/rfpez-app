-- Add response_specialty field to agents table
-- Created: 2025-11-17
-- Purpose: Allow agents to specify which specialty site suppliers should use to respond to RFPs

-- Add column for response specialty (references specialty_sites.slug)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS response_specialty VARCHAR(50);

-- Add comment explaining the field
COMMENT ON COLUMN agents.response_specialty IS 'Slug of specialty site where suppliers respond to RFPs created by this agent (e.g., "respond")';

-- Update RFP Design agent to use 'respond' specialty for responses
UPDATE agents 
SET response_specialty = 'respond'
WHERE name = 'RFP Design';

-- Update Sourcing agent to use 'respond' specialty for supplier follow-ups
UPDATE agents 
SET response_specialty = 'respond'
WHERE name = 'Sourcing';

-- Verify updates
SELECT 
  name,
  role,
  specialty,
  response_specialty,
  updated_at
FROM agents 
WHERE response_specialty IS NOT NULL
ORDER BY name;

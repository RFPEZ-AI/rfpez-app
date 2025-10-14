-- Fix RFP Design Agent Access Control
-- Issue: RFP Design agent is accessible to anonymous users
-- Solution: Set is_restricted=TRUE so only authenticated users can access it

-- RFP Design agent should be:
-- - is_restricted = TRUE (requires authentication)
-- - is_free = TRUE (available to free tier authenticated users)

UPDATE agents
SET 
  is_restricted = TRUE,
  is_free = TRUE,
  updated_at = NOW()
WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc'
  AND name = 'RFP Design';

-- Verify the update
SELECT 
  id,
  name,
  role,
  is_restricted,
  is_free,
  CASE 
    WHEN is_restricted = TRUE AND is_free = TRUE THEN 'Authenticated users only (free tier)'
    WHEN is_restricted = TRUE AND is_free = FALSE THEN 'Premium users only'
    WHEN is_restricted = FALSE THEN 'Everyone including anonymous'
  END as access_level
FROM agents
WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';

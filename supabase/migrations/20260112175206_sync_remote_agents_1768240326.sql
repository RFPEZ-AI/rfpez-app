-- Agent Synchronization Migration
-- Synchronizes remote agents to match local configuration
-- Fixes: Solutions and Sourcing marked as abstract, incorrect default flags

-- Step 1: Fix incorrect default flags on remote
-- Corporate TMC RFP Welcome should NOT be default (only for corporate-tmc-rfp specialty site)
-- RFP Design should NOT be default (it's restricted/paid)
UPDATE agents 
SET is_default = false, 
    updated_at = NOW()
WHERE name = 'Corporate TMC RFP Welcome' 
  AND is_default = true;

UPDATE agents 
SET is_default = false,
    updated_at = NOW()
WHERE name = 'RFP Design' 
  AND is_default = true;

-- Step 2: Fix Solutions agent - should be active, non-abstract, visible
-- This is the main sales/welcome agent for the home site
UPDATE agents
SET 
  is_active = true,
  is_abstract = false,  -- CRITICAL: Make visible in UI
  is_default = false,
  is_restricted = false,
  is_free = true,
  sort_order = 0,
  specialty = NULL,  -- Home site agent (no specialty)
  role = 'sales',
  description = 'Sales agent for EZRFP.APP to help with product questions and competitive sourcing',
  updated_at = NOW()
WHERE name = 'Solutions';

-- Step 3: Fix Sourcing agent - should be active, non-abstract, restricted
-- This is a restricted agent for vendor discovery and outreach  
UPDATE agents
SET
  is_active = true,
  is_abstract = false,  -- CRITICAL: Make visible in UI
  is_default = false,
  is_restricted = true,  -- Restricted/paid feature
  is_free = false,
  sort_order = 0,
  specialty = 'respond',  -- Respond site agent
  role = 'sourcing',
  description = 'Sourcing agent who discovers suitable vendors, researches supplier capabilities, and manages vendor outreach for RFP bid invitations. Handles vendor selection criteria, contact discovery, and email-based vendor engagement with development mode safety features.',
  updated_at = NOW()
WHERE name = 'Sourcing';

-- Step 4: Verify synchronization
SELECT 
  name,
  is_active,
  is_default,
  is_restricted,
  is_free,
  sort_order,
  specialty,
  role,
  updated_at
FROM agents 
WHERE is_active = true 
  AND is_abstract = false
ORDER BY sort_order, name;

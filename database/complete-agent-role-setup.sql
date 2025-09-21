-- =====================================================
-- RFPEZ.AI Agent Role System Database Setup
-- Execute this entire script in your Supabase SQL Editor
-- =====================================================

-- Step 1: Add role column to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS role TEXT;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role);

-- Step 3: Add comment to document the role field
COMMENT ON COLUMN public.agents.role IS 'Functional role of the agent (e.g., sales, design, support, assistant, audit, billing, etc.)';

-- Step 4: Populate existing agents with appropriate roles
UPDATE public.agents SET role = 'sales' WHERE name = 'Solutions';
UPDATE public.agents SET role = 'design' WHERE name = 'RFP Design';
UPDATE public.agents SET role = 'support' WHERE name = 'Technical Support';
UPDATE public.agents SET role = 'support' WHERE name = 'Support Agent';
UPDATE public.agents SET role = 'assistant' WHERE name = 'RFP Assistant';
UPDATE public.agents SET role = 'audit' WHERE name = 'Audit Agent';
UPDATE public.agents SET role = 'billing' WHERE name = 'Billing Agent';
UPDATE public.agents SET role = 'communication' WHERE name = 'Followup Agent';
UPDATE public.agents SET role = 'negotiation' WHERE name = 'Negotiation Agent';
UPDATE public.agents SET role = 'publishing' WHERE name = 'Publishing Agent';
UPDATE public.agents SET role = 'contracting' WHERE name = 'Signing Agent';
UPDATE public.agents SET role = 'sourcing' WHERE name = 'Sourcing Agent';

-- Step 5: Update the updated_at timestamp for modified records
UPDATE public.agents SET updated_at = NOW() WHERE role IS NOT NULL;

-- Step 6: Verify the changes
SELECT id, name, role, updated_at 
FROM public.agents 
ORDER BY name;
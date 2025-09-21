-- Add role column to agents table
-- This migration adds a 'role' field to differentiate agent functional roles from descriptions

-- Add the role column
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Create an index on role for performance
CREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role);

-- Update existing agents with appropriate roles based on their names
-- These roles define the functional purpose of each agent
UPDATE public.agents SET role = 'sales' WHERE name = 'Solutions';
UPDATE public.agents SET role = 'design' WHERE name = 'RFP Design';
UPDATE public.agents SET role = 'support' WHERE name = 'Technical Support';
UPDATE public.agents SET role = 'assistant' WHERE name = 'RFP Assistant';
UPDATE public.agents SET role = 'audit' WHERE name = 'Audit Agent';
UPDATE public.agents SET role = 'billing' WHERE name = 'Billing Agent';
UPDATE public.agents SET role = 'followup' WHERE name = 'Followup Agent';
UPDATE public.agents SET role = 'negotiation' WHERE name = 'Negotiation Agent';
UPDATE public.agents SET role = 'publishing' WHERE name = 'Publishing Agent';
UPDATE public.agents SET role = 'signing' WHERE name = 'Signing Agent';
UPDATE public.agents SET role = 'sourcing' WHERE name = 'Sourcing Agent';
UPDATE public.agents SET role = 'support' WHERE name = 'Support Agent';

-- Add a comment to document the role field
COMMENT ON COLUMN public.agents.role IS 'Functional role of the agent (e.g., sales, design, support, assistant, audit, billing, etc.)';

-- Update the updated_at timestamp for modified records
UPDATE public.agents SET updated_at = NOW() WHERE role IS NOT NULL;
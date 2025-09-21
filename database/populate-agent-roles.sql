-- Agent Role Population Script
-- This script maps each agent to an appropriate functional role based on their purpose

-- Create a comprehensive mapping of agents to their functional roles
-- These roles define the primary function each agent serves in the RFP workflow

-- Sales and Solution Design
UPDATE public.agents SET role = 'sales' WHERE name = 'Solutions';

-- RFP Creation and Design
UPDATE public.agents SET role = 'design' WHERE name = 'RFP Design';

-- General Support and Assistance
UPDATE public.agents SET role = 'support' WHERE name = 'Technical Support';
UPDATE public.agents SET role = 'support' WHERE name = 'Support Agent';

-- General RFP Assistant
UPDATE public.agents SET role = 'assistant' WHERE name = 'RFP Assistant';

-- Financial and Compliance
UPDATE public.agents SET role = 'audit' WHERE name = 'Audit Agent';
UPDATE public.agents SET role = 'billing' WHERE name = 'Billing Agent';

-- Communication and Follow-up
UPDATE public.agents SET role = 'communication' WHERE name = 'Followup Agent';

-- Negotiation and Contract Management
UPDATE public.agents SET role = 'negotiation' WHERE name = 'Negotiation Agent';
UPDATE public.agents SET role = 'contracting' WHERE name = 'Signing Agent';

-- Publishing and Distribution
UPDATE public.agents SET role = 'publishing' WHERE name = 'Publishing Agent';

-- Sourcing and Vendor Management
UPDATE public.agents SET role = 'sourcing' WHERE name = 'Sourcing Agent';

-- Update timestamps
UPDATE public.agents SET updated_at = NOW() WHERE role IS NOT NULL;

-- Verify the updates
SELECT name, role, description, is_active 
FROM public.agents 
ORDER BY sort_order, name;
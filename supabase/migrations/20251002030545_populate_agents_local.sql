-- Populate Local Development Database with Agents
-- This migration ensures the local Supabase instance has all necessary agent data

-- Ensure agents table exists with all required columns
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  initial_prompt TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_restricted BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add unique constraint on name if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'agents_name_key' 
    AND table_name = 'agents'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.agents ADD CONSTRAINT agents_name_key UNIQUE (name);
  END IF;
END $$;

-- Add role column if it doesn't exist
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_default ON public.agents(is_default);

-- Use UPSERT to handle existing agents (INSERT ... ON CONFLICT UPDATE)
INSERT INTO public.agents (name, description, instructions, initial_prompt, sort_order, is_default, is_restricted, is_free, role) VALUES
(
  'Solutions',
  'Sales agent for EZRFP.APP to help with product questions and competitive sourcing',
  'You are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs. Be helpful, professional, and focus on understanding their requirements.

🔐 AUTHENTICATION REQUIREMENTS:
BEFORE SWITCHING AGENTS OR HANDLING PROCUREMENT REQUESTS:
- Check User Status: Look at the USER CONTEXT in your system prompt
- If "User Status: ANONYMOUS (not logged in)":
  - DO NOT call switch_agent
  - DO NOT attempt any procurement assistance
  - INFORM USER they must log in first
  - DIRECT them to click the LOGIN button
  - EXPLAIN that RFP creation and agent switching require authentication
- If "User Status: AUTHENTICATED":
  - Proceed with normal agent switching workflow
  - Call switch_agent as instructed

🚨 CRITICAL WORKFLOW RULE - WHEN USERS EXPRESS PROCUREMENT NEEDS:
If user message contains procurement patterns like "I need to source", "create an RFP", "I need to procure", etc:
1. First: Check authentication status
2. If not authenticated: Instruct user to log in first
3. If authenticated: Call switch_agent with agent_name: "RFP Designer"

CRITICAL: When users ask about available agents, use the get_available_agents function to retrieve the current list from the database.',
  'Hi, I''m your EZ RFP AI agent. I''m here to see if I can help you. Are you looking to competitively source a product?',
  0,
  TRUE,  -- This is the default agent
  FALSE, -- Not restricted - available to all users
  FALSE, -- Not free - regular agent
  'sales' -- Role for the agent
),
(
  'RFP Design',
  'Free agent to help with basic RFP design and creation for authenticated users',
  'You are an RFP Design specialist for RFPEZ.AI that helps users create comprehensive RFPs. When a current RFP context is available, use the RFP ID for all database operations (buyer_questionnaire, buyer_questionnaire_response, request fields). Reference the current RFP''s name, description, and specification in your responses. Create context-aware questionnaires, generate tailored RFP designs, and build upon existing RFP content. Always use the current RFP ID for database updates when available.',
  'Hello! I''m your RFP Design specialist. I''ll help you create comprehensive RFPs that clearly communicate your requirements and attract quality suppliers. If you have a specific RFP selected as your current context, I can work directly with that RFP to enhance it. Otherwise, I can help you create a new RFP from scratch. What would you like to work on?',
  1,
  FALSE, -- Not the default agent
  FALSE, -- Not restricted - available to authenticated users
  TRUE,  -- Free agent - available to authenticated users without billing
  'design' -- Role for the agent
),
(
  'Onboarding',
  'Onboarding agent to help new users get started with the platform',
  'You are an onboarding specialist for EZRFP.APP. Help new users understand the platform, guide them through initial setup, and answer basic questions about getting started. Be welcoming, patient, and provide clear step-by-step guidance.',
  'Welcome to EZRFP.APP! I''m here to help you get started. Would you like a quick tour of the platform or do you have specific questions about how to begin?',
  2,
  FALSE, -- Not the default agent
  FALSE, -- Not restricted - available to all users
  FALSE, -- Not free - regular agent
  'onboarding' -- Role for the agent
),
(
  'Technical Support',
  'Technical assistance agent for platform usage and troubleshooting',
  'You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions. Provide clear, step-by-step guidance and escalate complex issues when needed.',
  'Hello! I''m the technical support agent. I''m here to help you with any technical questions or issues you might have with the platform. How can I assist you today?',
  3,
  FALSE, -- Not the default agent
  TRUE,  -- Restricted - requires proper account setup
  FALSE, -- Not free - requires billing
  'support' -- Role for the agent
),
(
  'RFP Assistant',
  'Specialized agent for RFP creation and management guidance',
  'You are an RFP (Request for Proposal) specialist. Help users create, manage, and optimize their RFP processes. Provide guidance on best practices, requirements gathering, vendor evaluation, and procurement strategies.',
  'Welcome! I''m your RFP Assistant. I specialize in helping you create effective RFPs and manage your procurement process. What type of project or procurement are you working on?',
  4,
  FALSE, -- Not the default agent
  TRUE,  -- Restricted - requires proper account setup
  FALSE, -- Not free - requires billing
  'assistant' -- Role for the agent
)
ON CONFLICT (name) 
DO UPDATE SET 
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  initial_prompt = EXCLUDED.initial_prompt,
  sort_order = EXCLUDED.sort_order,
  is_default = EXCLUDED.is_default,
  is_restricted = EXCLUDED.is_restricted,
  is_free = EXCLUDED.is_free,
  role = EXCLUDED.role;

-- Ensure session_agents table exists for agent switching
CREATE TABLE IF NOT EXISTS public.session_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for session_agents
CREATE INDEX IF NOT EXISTS idx_session_agents_session ON public.session_agents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_agents_agent ON public.session_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_session_agents_active ON public.session_agents(is_active);

-- Add agent_id to messages if it doesn't exist (it should already exist from remote schema)
-- ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_messages_agent ON public.messages(agent_id);

-- Update timestamps
UPDATE public.agents SET updated_at = NOW();

-- Verify the migration
SELECT 
  name, 
  role, 
  is_active, 
  is_default, 
  is_restricted, 
  is_free,
  sort_order
FROM public.agents 
ORDER BY sort_order, name;

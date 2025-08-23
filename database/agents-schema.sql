-- RFPEZ.AI Multi-Agent System Schema Extension
-- Run these SQL commands in your Supabase SQL Editor

-- 1. AGENTS table - stores agent definitions
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL, -- System instructions for the agent
  initial_prompt TEXT NOT NULL, -- Initial greeting/prompt for users
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- For storing additional agent configuration
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

-- 2. SESSION_AGENTS junction table - tracks which agent is used in each session
CREATE TABLE IF NOT EXISTS public.session_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE, -- When user switched to different agent
  is_active BOOLEAN DEFAULT TRUE -- Current active agent for the session
);

-- 3. Update MESSAGES table to include agent reference
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_session_agents_session_id ON public.session_agents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_agents_agent_id ON public.session_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_session_agents_active ON public.session_agents(session_id, is_active);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);

-- Row Level Security Policies for Agents (publicly readable, admin-only write)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;

CREATE POLICY "Anyone can view active agents" ON public.agents FOR SELECT USING (is_active = true);
-- Note: Insert/Update/Delete policies for agents should be restricted to admin users

-- Session Agents policies
ALTER TABLE public.session_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view session agents from own sessions" ON public.session_agents;
DROP POLICY IF EXISTS "Users can create session agents in own sessions" ON public.session_agents;
DROP POLICY IF EXISTS "Users can update session agents in own sessions" ON public.session_agents;

CREATE POLICY "Users can view session agents from own sessions" ON public.session_agents FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can create session agents in own sessions" ON public.session_agents FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can update session agents in own sessions" ON public.session_agents FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- Trigger for automatic timestamp updates on agents
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current active agent for a session
CREATE OR REPLACE FUNCTION get_session_active_agent(session_uuid UUID)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  agent_instructions TEXT,
  agent_initial_prompt TEXT,
  agent_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.instructions as agent_instructions,
    a.initial_prompt as agent_initial_prompt,
    a.avatar_url as agent_avatar_url
  FROM public.agents a
  INNER JOIN public.session_agents sa ON a.id = sa.agent_id
  WHERE sa.session_id = session_uuid 
    AND sa.is_active = true
    AND a.is_active = true
  ORDER BY sa.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch agent in a session
CREATE OR REPLACE FUNCTION switch_session_agent(
  session_uuid UUID,
  new_agent_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  session_user_id UUID;
BEGIN
  -- Verify the session belongs to the user
  SELECT user_id INTO session_user_id 
  FROM public.sessions 
  WHERE id = session_uuid;
  
  IF session_user_id != user_uuid THEN
    RETURN FALSE;
  END IF;
  
  -- Deactivate current agent
  UPDATE public.session_agents 
  SET is_active = false, ended_at = NOW()
  WHERE session_id = session_uuid AND is_active = true;
  
  -- Add new active agent
  INSERT INTO public.session_agents (session_id, agent_id, is_active)
  VALUES (session_uuid, new_agent_uuid, true);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default agents (safe for re-running)
INSERT INTO public.agents (name, description, instructions, initial_prompt, sort_order) VALUES
(
  'Solutions',
  'Sales agent for EZRFP.APP to help with product questions and competitive sourcing',
  'You are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs. Be helpful, professional, and focus on understanding their requirements.',
  'Hi, I''m your EZ RFP AI agent. I''m here to see if I can help you. Are you looking to competitively source a product?',
  1
),
(
  'Technical Support',
  'Technical assistance agent for platform usage and troubleshooting',
  'You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions. Provide clear, step-by-step guidance and escalate complex issues when needed.',
  'Hello! I''m the technical support agent. I''m here to help you with any technical questions or issues you might have with the platform. How can I assist you today?',
  2
),
(
  'RFP Assistant',
  'Specialized agent for RFP creation and management guidance',
  'You are an RFP (Request for Proposal) specialist. Help users create, manage, and optimize their RFP processes. Provide guidance on best practices, requirements gathering, vendor evaluation, and procurement strategies.',
  'Welcome! I''m your RFP Assistant. I specialize in helping you create effective RFPs and manage your procurement process. What type of project or procurement are you working on?',
  3
)
ON CONFLICT (name) DO NOTHING;

-- =============================
-- RFP, Bid, Solicitation, Supplier Profile Schema
-- =============================


CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL CHECK (trim(description) != ''), -- Public description
  specification TEXT NOT NULL CHECK (trim(specification) != ''), -- Detailed specs for Claude
  proposal TEXT, -- Generated proposal text
  proposal_questionnaire JSONB, -- Questionnaire structure for proposal generation
  proposal_questionnaire_response JSONB, -- Collected questionnaire responses
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  suppliers INTEGER[] DEFAULT '{}', -- array of supplier IDs
  agent_ids INTEGER[] DEFAULT '{}', -- array of agent IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL, -- assuming agent table exists
  supplier_id INTEGER REFERENCES supplier_profiles(id),
  response JSONB NOT NULL, -- Changed from 'document' to match TypeScript interface
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS supplier_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  email TEXT,
  phone TEXT,
  rfpez_account_id INTEGER -- nullable, references user/account table if exists
);
-- RFPEZ.AI Supabase Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon, authenticated;

-- 1. USER PROFILES table (using Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL, -- Supabase user ID
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'administrator')),
  current_rfp_id INTEGER REFERENCES rfps(id) ON DELETE SET NULL, -- Current RFP context
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SESSIONS table - stores chat sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Session',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  session_metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. MESSAGES table - stores individual messages in sessions
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- For storing additional data like model used, tokens, etc.
  ai_metadata JSONB DEFAULT '{}'::jsonb
);
  ai_metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. ARTIFACTS table - stores files and documents
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, txt, etc.
  file_size BIGINT,
  storage_path TEXT, -- Supabase storage path
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  -- For storing extracted content, summary, etc.
  processed_content TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 5. SESSION_ARTIFACTS junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.session_artifacts (
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES public.artifacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (session_id, artifact_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.messages(session_id, message_order);
CREATE INDEX IF NOT EXISTS idx_artifacts_session_id ON public.artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON public.artifacts(message_id);

-- Row Level Security Policies

-- User Profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can create own sessions" ON public.sessions FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages from own sessions" ON public.messages FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can create messages in own sessions" ON public.messages FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can update messages in own sessions" ON public.messages FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can delete messages from own sessions" ON public.messages FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- Artifacts
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view artifacts from own sessions" ON public.artifacts FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can create artifacts in own sessions" ON public.artifacts FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can update artifacts in own sessions" ON public.artifacts FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
CREATE POLICY "Users can delete artifacts from own sessions" ON public.artifacts FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- Session Artifacts (junction table)
ALTER TABLE public.session_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view session artifacts from own sessions" ON public.session_artifacts FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can create session artifacts in own sessions" ON public.session_artifacts FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can delete session artifacts from own sessions" ON public.session_artifacts FOR DELETE 
  USING (auth.uid() IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get session with message count and last message
CREATE OR REPLACE FUNCTION get_sessions_with_stats(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  message_count BIGINT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  artifact_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.created_at,
    s.updated_at,
    COALESCE(msg_stats.message_count, 0) as message_count,
    msg_stats.last_message,
    msg_stats.last_message_at,
    COALESCE(art_stats.artifact_count, 0) as artifact_count
  FROM public.sessions s
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as message_count,
      MAX(content) as last_message,
      MAX(created_at) as last_message_at
    FROM public.messages 
    WHERE role = 'user'
    GROUP BY session_id
  ) msg_stats ON s.id = msg_stats.session_id
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as artifact_count
    FROM public.artifacts
    GROUP BY session_id
  ) art_stats ON s.id = art_stats.session_id
  WHERE s.user_id = user_uuid AND s.is_archived = FALSE
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

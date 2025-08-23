-- Migration to update RFPEZ.AI schema for Auth0 integration
-- Run this in your Supabase SQL Editor

-- First, drop existing tables and constraints to recreate with proper schema
DROP TABLE IF EXISTS public.artifacts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP FUNCTION IF EXISTS get_sessions_with_stats(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. USER_PROFILES table (modified to work with Auth0)
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth0_id TEXT UNIQUE NOT NULL, -- Auth0 user ID (sub claim)
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SESSIONS table - stores chat sessions
CREATE TABLE public.sessions (
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
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  ai_metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. ARTIFACTS table - stores files and documents
CREATE TABLE public.artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT,
  content_preview TEXT,
  processed_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  artifact_metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better performance
CREATE INDEX idx_user_profiles_auth0_id ON public.user_profiles(auth0_id);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at DESC);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_order ON public.messages(session_id, message_order);
CREATE INDEX idx_artifacts_session_id ON public.artifacts(session_id);
CREATE INDEX idx_artifacts_message_id ON public.artifacts(message_id);

-- Updated timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON public.artifacts 
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
    GROUP BY session_id
  ) msg_stats ON s.id = msg_stats.session_id
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as artifact_count
    FROM public.artifacts
    GROUP BY session_id
  ) art_stats ON s.id = art_stats.session_id
  WHERE s.user_id = user_uuid
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (but we'll manage access through our application layer)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Since we're not using Supabase auth, we'll create permissive policies for now
-- In production, you'd want to implement proper service role access
CREATE POLICY "Allow all operations for now" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON public.artifacts FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.sessions TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.artifacts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_with_stats(UUID) TO anon, authenticated;

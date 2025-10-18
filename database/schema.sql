-- =============================
-- RFPEZ.AI Database Schema
-- =============================
-- 
-- AUTHENTICATION FIXES APPLIED (September 2025):
-- - Fixed duplicate RLS policy conflicts on user_profiles table  
-- - Standardized policy names to match working authentication solution
-- - Added policy cleanup commands to prevent future conflicts
-- - Resolved PKCE authentication flow and RLS permission issues
--
-- SECURITY FIXES APPLIED (September 14, 2025):
-- - Fixed rfp_status_summary view security vulnerability (CVE-level issue)
-- - Converted view to use security_invoker = on to respect Row Level Security
-- - Prevents privilege escalation and unauthorized data access through views
-- - All views now properly enforce per-user data access restrictions
--
-- For troubleshooting authentication issues, see: AUTHENTICATION_FIXES.md
-- For security vulnerability details, see: SECURITY-FIX-README.md
-- =============================


CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL CHECK (trim(description) != ''), -- Public description
  specification TEXT NOT NULL CHECK (trim(specification) != ''), -- Detailed specs for Claude
  request TEXT, -- Generated request for proposal (RFP) content to send to suppliers
  buyer_questionnaire JSONB, -- Questionnaire structure for buyer requirements gathering
  buyer_questionnaire_response JSONB, -- Collected buyer questionnaire responses
  bid_form_questionaire JSONB, -- JSON Schema + RJSF form specification for bid submission
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
  -- NOTE: supplier profiles should NOT be scoped to a single account by default
  -- (they are global supplier records). Do NOT add an account_id here.
  -- If suppliers must be account-scoped, create a separate junction table
  -- supplier_accounts(supplier_id, account_id) instead.
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
-- 
-- SECURITY NOTE (September 14, 2025):
-- All views must use WITH (security_invoker = on) to prevent privilege escalation
-- Views with definer rights can bypass RLS policies and expose unauthorized data
-- See SECURITY-FIX-README.md for details on the security vulnerability
-- =============================

-- User Profiles - UPDATED: Fixed policy names to match working solution
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;  
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Remove any duplicate "optimized" policies that may cause conflicts
DROP POLICY IF EXISTS "user_profiles_insert_optimized" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_optimized" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_optimized" ON public.user_profiles;

-- Create standardized policies that match working authentication solution
-- Using subqueries for auth.uid() to prevent re-evaluation per row for better performance
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles 
  FOR SELECT USING ((select auth.uid()) = supabase_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK ((select auth.uid()) = supabase_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING ((select auth.uid()) = supabase_user_id);

-- Optional: Allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile" ON public.user_profiles 
  FOR DELETE USING ((select auth.uid()) = supabase_user_id);

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;
CREATE POLICY "Users can create own sessions" ON public.sessions FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE 
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()));

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages from own sessions" ON public.messages;
CREATE POLICY "Users can view messages from own sessions" ON public.messages FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can create messages in own sessions" ON public.messages;
CREATE POLICY "Users can create messages in own sessions" ON public.messages FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can update messages in own sessions" ON public.messages;
CREATE POLICY "Users can update messages in own sessions" ON public.messages FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can delete messages from own sessions" ON public.messages;
CREATE POLICY "Users can delete messages from own sessions" ON public.messages FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- Artifacts
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view artifacts from own sessions" ON public.artifacts;
CREATE POLICY "Users can view artifacts from own sessions" ON public.artifacts FOR SELECT 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can create artifacts in own sessions" ON public.artifacts;
CREATE POLICY "Users can create artifacts in own sessions" ON public.artifacts FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can update artifacts in own sessions" ON public.artifacts;
CREATE POLICY "Users can update artifacts in own sessions" ON public.artifacts FOR UPDATE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Users can delete artifacts from own sessions" ON public.artifacts;
CREATE POLICY "Users can delete artifacts from own sessions" ON public.artifacts FOR DELETE 
  USING (session_id IN (
    SELECT s.id FROM public.sessions s 
    JOIN public.user_profiles up ON s.user_id = up.id 
    WHERE up.supabase_user_id = auth.uid()
  ));

-- Session Artifacts (junction table)
ALTER TABLE public.session_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view session artifacts from own sessions" ON public.session_artifacts;
CREATE POLICY "Users can view session artifacts from own sessions" ON public.session_artifacts FOR SELECT 
  USING ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));
DROP POLICY IF EXISTS "Users can create session artifacts in own sessions" ON public.session_artifacts;
CREATE POLICY "Users can create session artifacts in own sessions" ON public.session_artifacts FOR INSERT 
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));
DROP POLICY IF EXISTS "Users can delete session artifacts from own sessions" ON public.session_artifacts;
CREATE POLICY "Users can delete session artifacts from own sessions" ON public.session_artifacts FOR DELETE 
  USING ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER
SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- =============================
-- SECURE VIEWS
-- =============================

-- AGENTS table (added/maintained locally)
-- Mirrors local development schema: includes account_id for account-scoped RLS
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  initial_prompt TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT FALSE,
  is_restricted BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  role TEXT,
  access TEXT[],
  account_id UUID -- nullable; used by RLS to scope agents to accounts
);

-- Indexes and constraints observed in local DB
CREATE UNIQUE INDEX IF NOT EXISTS agents_name_key ON public.agents (name);
CREATE INDEX IF NOT EXISTS idx_agents_access ON public.agents(is_active, is_restricted, sort_order);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_agents_default ON public.agents(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_agents_free ON public.agents(is_free);
CREATE INDEX IF NOT EXISTS idx_agents_restricted ON public.agents(is_restricted);
CREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role);
CREATE INDEX IF NOT EXISTS idx_agents_access_tools ON public.agents USING gin(access);

-- Enable RLS and create policies consistent with local migration
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to SELECT agents
DROP POLICY IF EXISTS select_agents ON public.agents;
CREATE POLICY select_agents ON public.agents FOR SELECT USING (auth.role() = 'authenticated');

-- Write policies: administrators OR account members (if account_id present)
DROP POLICY IF EXISTS insert_agents ON public.agents;
CREATE POLICY insert_agents ON public.agents FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = 'administrator')) OR COALESCE(public.user_is_in_account(agents.account_id), false));

DROP POLICY IF EXISTS update_agents ON public.agents;
CREATE POLICY update_agents ON public.agents FOR UPDATE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = 'administrator')) OR COALESCE(public.user_is_in_account(agents.account_id), false));

DROP POLICY IF EXISTS delete_agents ON public.agents;
CREATE POLICY delete_agents ON public.agents FOR DELETE USING ((EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = 'administrator')) OR COALESCE(public.user_is_in_account(agents.account_id), false));

-- Service role full access policy (for administrative server-side operations)
DROP POLICY IF EXISTS service_role_full_access ON public.agents;
CREATE POLICY service_role_full_access ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- ACCOUNT MULTI-TENANCY: accounts + membership + helpers
-- =============================

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User -> Account membership (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_profile_id, account_id)
);

-- Triggers to maintain updated_at on accounts and membership
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON public.user_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: is current authenticated user a member of the supplied account?
CREATE OR REPLACE FUNCTION public.user_is_in_account(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_account_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_accounts ua
    JOIN public.user_profiles up ON ua.user_profile_id = up.id
    WHERE ua.account_id = p_account_id AND up.supabase_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Indexes for queries by account
CREATE INDEX IF NOT EXISTS idx_rfps_account_id ON public.rfps USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_bids_account_id ON public.bids USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON public.sessions USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_account_id ON public.messages USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_account_id ON public.artifacts USING btree(account_id);
CREATE INDEX IF NOT EXISTS idx_agents_account_id ON public.agents USING btree(account_id);

-- Add account_id columns to tables we want to isolate by account
ALTER TABLE IF EXISTS public.rfps    ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.bids    ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.sessions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.artifacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
ALTER TABLE IF EXISTS public.session_artifacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id);
-- Note: supplier_profiles are intentionally NOT account-scoped per request.

-- Enable RLS and create account-scoped policies

-- RFPS
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_rfps ON public.rfps;
CREATE POLICY select_rfps ON public.rfps FOR SELECT
  USING ( public.user_is_in_account(account_id) OR (account_id IS NULL AND is_public = TRUE) );
DROP POLICY IF EXISTS insert_rfps ON public.rfps;
CREATE POLICY insert_rfps ON public.rfps FOR INSERT WITH CHECK ( public.user_is_in_account(account_id) );
DROP POLICY IF EXISTS update_rfps ON public.rfps;
CREATE POLICY update_rfps ON public.rfps FOR UPDATE USING ( public.user_is_in_account(account_id) );
DROP POLICY IF EXISTS delete_rfps ON public.rfps;
CREATE POLICY delete_rfps ON public.rfps FOR DELETE USING ( public.user_is_in_account(account_id) );

-- BIDS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_bids ON public.bids;
CREATE POLICY select_bids ON public.bids FOR SELECT USING ( public.user_is_in_account(account_id) );
DROP POLICY IF EXISTS insert_bids ON public.bids;
CREATE POLICY insert_bids ON public.bids FOR INSERT WITH CHECK ( public.user_is_in_account(account_id) );
DROP POLICY IF EXISTS update_bids ON public.bids;
CREATE POLICY update_bids ON public.bids FOR UPDATE USING ( public.user_is_in_account(account_id) );
DROP POLICY IF EXISTS delete_bids ON public.bids;
CREATE POLICY delete_bids ON public.bids FOR DELETE USING ( public.user_is_in_account(account_id) );

-- SESSIONS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_sessions ON public.sessions;
CREATE POLICY select_sessions ON public.sessions FOR SELECT
  USING ( public.user_is_in_account(account_id) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS insert_sessions ON public.sessions;
CREATE POLICY insert_sessions ON public.sessions FOR INSERT WITH CHECK ( public.user_is_in_account(account_id) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS update_sessions ON public.sessions;
CREATE POLICY update_sessions ON public.sessions FOR UPDATE USING ( public.user_is_in_account(account_id) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );
DROP POLICY IF EXISTS delete_sessions ON public.sessions;
CREATE POLICY delete_sessions ON public.sessions FOR DELETE USING ( public.user_is_in_account(account_id) OR user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid()) );

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_messages ON public.messages;
CREATE POLICY select_messages ON public.messages FOR SELECT
  USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS insert_messages ON public.messages;
CREATE POLICY insert_messages ON public.messages FOR INSERT WITH CHECK ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS update_messages ON public.messages;
CREATE POLICY update_messages ON public.messages FOR UPDATE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS delete_messages ON public.messages;
CREATE POLICY delete_messages ON public.messages FOR DELETE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );

-- ARTIFACTS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_artifacts ON public.artifacts;
CREATE POLICY select_artifacts ON public.artifacts FOR SELECT
  USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS insert_artifacts ON public.artifacts;
CREATE POLICY insert_artifacts ON public.artifacts FOR INSERT WITH CHECK ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS update_artifacts ON public.artifacts;
CREATE POLICY update_artifacts ON public.artifacts FOR UPDATE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );
DROP POLICY IF EXISTS delete_artifacts ON public.artifacts;
CREATE POLICY delete_artifacts ON public.artifacts FOR DELETE USING ( session_id IN (
    SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id) OR s.user_id IN (SELECT id FROM public.user_profiles WHERE supabase_user_id = auth.uid())
  ) );

-- SESSION_ARTIFACTS (junction)
ALTER TABLE public.session_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_session_artifacts ON public.session_artifacts;
CREATE POLICY select_session_artifacts ON public.session_artifacts FOR SELECT USING (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id))
);
DROP POLICY IF EXISTS insert_session_artifacts ON public.session_artifacts;
CREATE POLICY insert_session_artifacts ON public.session_artifacts FOR INSERT WITH CHECK (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id))
);
DROP POLICY IF EXISTS delete_session_artifacts ON public.session_artifacts;
CREATE POLICY delete_session_artifacts ON public.session_artifacts FOR DELETE USING (
  (select auth.uid()) IN (SELECT up.supabase_user_id FROM public.sessions s JOIN public.user_profiles up ON s.user_id = up.id WHERE s.id = session_id) OR
  session_id IN (SELECT s.id FROM public.sessions s WHERE public.user_is_in_account(s.account_id))
);

-- AGENTS: tighten SELECT policy to respect account scoping (agents may be global when account_id IS NULL)
DROP POLICY IF EXISTS select_agents ON public.agents;
CREATE POLICY select_agents ON public.agents FOR SELECT
  USING ( is_restricted = FALSE OR public.user_is_in_account(account_id) OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.supabase_user_id = auth.uid() AND up.role = 'administrator') );

-- Ensure service_role retains full access where needed
DROP POLICY IF EXISTS service_role_full_access ON public.agents;
CREATE POLICY service_role_full_access ON public.agents FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 
-- Views with security_invoker = on to ensure proper RLS enforcement
-- Date: September 14, 2025
-- Security Issue: Views with definer rights bypass Row Level Security
-- Solution: All views use security_invoker = on to respect user permissions
-- =============================

-- RFP Status Summary View - SECURE VERSION
-- This view provides a summary of RFPs with their status and bid counts
-- IMPORTANT: Uses security_invoker = on to enforce Row Level Security policies
CREATE OR REPLACE VIEW public.rfp_status_summary 
WITH (security_invoker = on) 
AS 
SELECT 
  r.id,
  r.name,
  r.description,
  r.specification,
  r.due_date,
  r.created_at,
  r.updated_at,
  r.is_template,
  r.is_public,
  -- Use existing status/completion columns when available
  COALESCE(r.status, 'unknown') AS status,
  COALESCE(r.completion_percentage, 0) AS completion_percentage,
  -- Count of bids for this RFP
  COALESCE(bid_stats.bid_count, 0) as bid_count,
  bid_stats.latest_bid_date
FROM public.rfps r
LEFT JOIN (
  SELECT 
    rfp_id,
    COUNT(*) as bid_count,
    MAX(created_at) as latest_bid_date
  FROM public.bids
  GROUP BY rfp_id
) bid_stats ON r.id = bid_stats.rfp_id;

-- Grant permissions to authenticated users
GRANT SELECT ON public.rfp_status_summary TO authenticated;

-- =============================
-- VIEW SECURITY VERIFICATION
-- =============================
-- 
-- To verify views are secure, run this query:
-- 
-- SELECT 
--     c.relname as view_name,
--     CASE 
--         WHEN 'security_invoker=on' = ANY(c.reloptions) THEN 'SECURE ✅'
--         ELSE 'VULNERABLE ❌'
--     END as security_status
-- FROM pg_class c
-- WHERE c.relkind = 'v' AND c.relname LIKE '%rfp%';
-- 
-- All views should show 'SECURE ✅'
-- =============================

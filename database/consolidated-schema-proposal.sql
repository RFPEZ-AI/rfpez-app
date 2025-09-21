-- =============================
-- CONSOLIDATED SCHEMA PROPOSAL
-- RFPEZ.AI Database Schema Consolidation
-- =============================
-- 
-- This proposal consolidates redundant tables and eliminates data duplication
-- while maintaining all current functionality.
--
-- CHANGES MADE:
-- 1. Unified artifact system using single 'artifacts' table
-- 2. Removed questionnaire field redundancy from RFPs table
-- 3. Streamlined form submission handling
-- 4. Removed unused tables
-- =============================

-- =============================
-- CORE RFP SYSTEM (SIMPLIFIED)
-- =============================

-- Simplified RFPs table - removes questionnaire redundancy
CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL CHECK (trim(description) != ''), -- Public description
  specification TEXT NOT NULL CHECK (trim(specification) != ''), -- Detailed specs for Claude
  request TEXT, -- Generated request for proposal (RFP) content to send to suppliers
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  suppliers INTEGER[] DEFAULT '{}', -- array of supplier IDs
  agent_ids INTEGER[] DEFAULT '{}', -- array of agent IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Updated bids table - remove form response redundancy
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL, -- assuming agent table exists
  supplier_id INTEGER REFERENCES supplier_profiles(id),
  artifact_submission_id UUID REFERENCES artifact_submissions(id) ON DELETE SET NULL, -- Reference to bid submission artifact
  -- Legacy support during migration
  response JSONB, -- DEPRECATED: Will be removed after migration to artifact_submissions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- UNIFIED ARTIFACT SYSTEM
-- =============================

-- Enhanced artifacts table - consolidates artifacts, form_artifacts, and templates
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY, -- Support both UUID and text IDs for backward compatibility
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Basic artifact info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'form' CHECK (type IN ('form', 'document', 'image', 'pdf', 'template', 'other')),
  
  -- File artifacts (for documents, images, etc.)
  file_type TEXT, -- pdf, docx, txt, etc.
  file_size BIGINT,
  storage_path TEXT, -- Supabase storage path
  mime_type TEXT,
  
  -- Form artifacts (for interactive forms)
  schema JSONB, -- JSON Schema for forms (replaces form_schema)
  ui_schema JSONB DEFAULT '{}'::jsonb, -- UI Schema for form rendering
  default_values JSONB DEFAULT '{}'::jsonb, -- Default/submitted form data
  submit_action JSONB DEFAULT '{"type": "save_session"}'::jsonb, -- Action on form submission
  
  -- Template support
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT, -- e.g., 'rfp', 'questionnaire', 'bid-form'
  template_tags TEXT[], -- Array of tags for categorization
  
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_content TEXT, -- Extracted content, summary, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifact submissions - tracks form submissions with version history
CREATE TABLE IF NOT EXISTS artifact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  submission_data JSONB NOT NULL, -- The actual form submission data
  form_version TEXT, -- Version of the form when submitted
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================
-- RFP-ARTIFACT RELATIONSHIPS
-- =============================

-- Junction table linking RFPs to their artifacts (questionnaires, bid forms, etc.)
CREATE TABLE IF NOT EXISTS rfp_artifacts (
  rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
  artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
  artifact_role TEXT NOT NULL CHECK (artifact_role IN ('buyer_questionnaire', 'bid_form', 'request_document', 'template')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (rfp_id, artifact_id, artifact_role)
);

-- =============================
-- EXISTING SESSION SYSTEM (UNCHANGED)
-- =============================

-- Keep existing session management tables as-is
-- These are working well:
-- - user_profiles
-- - sessions  
-- - messages
-- - agents
-- - session_agents

-- =============================
-- INDEXES FOR PERFORMANCE
-- =============================

-- Artifacts table indexes
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_session_id ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_template ON artifacts(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at);

-- Artifact submissions indexes
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_artifact_id ON artifact_submissions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_session_id ON artifact_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_user_id ON artifact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_submitted_at ON artifact_submissions(submitted_at);

-- RFP artifacts indexes  
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_rfp_id ON rfp_artifacts(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_artifact_id ON rfp_artifacts(artifact_id);
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_role ON rfp_artifacts(artifact_role);

-- =============================
-- ROW LEVEL SECURITY POLICIES
-- =============================

-- Artifacts RLS
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own artifacts and public artifacts" ON artifacts 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR
    status = 'active' AND is_template = true
  );

CREATE POLICY "Users can create their own artifacts" ON artifacts 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own artifacts" ON artifacts 
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own artifacts" ON artifacts 
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Artifact submissions RLS
ALTER TABLE artifact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" ON artifact_submissions 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own submissions" ON artifact_submissions 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RFP artifacts RLS (inherits from RFP permissions)
ALTER TABLE rfp_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFP artifacts follow RFP permissions" ON rfp_artifacts 
  FOR ALL USING (
    rfp_id IN (
      SELECT id FROM rfps 
      -- Add RFP-level permission logic here when RFPs get user ownership
    )
  );

-- =============================
-- HELPER FUNCTIONS
-- =============================

-- Function to get artifacts for an RFP with their roles
CREATE OR REPLACE FUNCTION get_rfp_artifacts(rfp_id_param INTEGER)
RETURNS TABLE (
  artifact_id TEXT,
  artifact_name TEXT,
  artifact_type TEXT,
  artifact_role TEXT,
  schema JSONB,
  ui_schema JSONB,
  default_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as artifact_id,
    a.name as artifact_name,
    a.type as artifact_type,
    ra.artifact_role,
    a.schema,
    a.ui_schema,
    a.default_values,
    a.created_at
  FROM artifacts a
  JOIN rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
  AND a.status = 'active'
  ORDER BY ra.artifact_role, a.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to get latest form submission for an artifact
CREATE OR REPLACE FUNCTION get_latest_submission(artifact_id_param TEXT, session_id_param UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT submission_data INTO result
  FROM artifact_submissions
  WHERE artifact_id = artifact_id_param
  AND (session_id_param IS NULL OR session_id = session_id_param)
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER
SET search_path = '';

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get bid response data from new or legacy schema
CREATE OR REPLACE FUNCTION get_bid_response(bid_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
  -- Try new schema first - get submission data from linked artifact
  SELECT s.submission_data INTO result
  FROM bids b
  JOIN artifact_submissions s ON b.artifact_submission_id = s.id
  WHERE b.id = bid_id_param;
  
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- Fallback to legacy schema
  SELECT response INTO result
  FROM bids 
  WHERE id = bid_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- =============================
-- MIGRATION BENEFITS
-- =============================
-- 
-- 1. ELIMINATES REDUNDANCY:
--    - No more duplicate questionnaire storage in RFPs table
--    - Single artifact system instead of multiple tables
--    - Unified form submission handling
--
-- 2. IMPROVES MAINTAINABILITY:
--    - Single source of truth for form artifacts
--    - Consistent artifact handling across the application
--    - Simplified relationship management
--
-- 3. ENHANCES FUNCTIONALITY:
--    - Template system for reusable forms
--    - Version history for form submissions
--    - Better categorization with roles and tags
--    - More flexible artifact types
--
-- 4. REDUCES COMPLEXITY:
--    - Fewer tables to manage
--    - Simplified queries
--    - Consistent API patterns
-- =============================
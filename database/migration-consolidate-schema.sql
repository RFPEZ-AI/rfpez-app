-- =============================
-- SCHEMA CONSOLIDATION MIGRATION
-- RFPEZ.AI Database Migration Script
-- =============================
-- 
-- This migration script transforms the existing redundant schema
-- to the new consolidated schema design.
--
-- CRITICAL: This migration involves data movement and table changes.
-- BACKUP YOUR DATABASE before running this migration!
--
-- Run this in the following order:
-- 1. Backup database
-- 2. Run this migration script
-- 3. Update application code
-- 4. Test thoroughly
-- 5. Clean up old tables (separate script)
-- =============================

BEGIN;

-- =============================
-- STEP 1: CREATE NEW CONSOLIDATED TABLES
-- =============================

-- Create the new unified artifacts table
CREATE TABLE IF NOT EXISTS artifacts_new (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Basic artifact info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'form' CHECK (type IN ('form', 'document', 'image', 'pdf', 'template', 'other')),
  
  -- File artifacts
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  mime_type TEXT,
  
  -- Form artifacts
  schema JSONB,
  ui_schema JSONB DEFAULT '{}'::jsonb,
  default_values JSONB DEFAULT '{}'::jsonb,
  submit_action JSONB DEFAULT '{"type": "save_session"}'::jsonb,
  
  -- Template support
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT,
  template_tags TEXT[],
  
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RFP-artifacts relationship table
CREATE TABLE IF NOT EXISTS rfp_artifacts (
  rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
  artifact_id TEXT REFERENCES artifacts_new(id) ON DELETE CASCADE,
  artifact_role TEXT NOT NULL CHECK (artifact_role IN ('buyer_questionnaire', 'bid_form', 'request_document', 'template')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (rfp_id, artifact_id, artifact_role)
);

-- Create new artifact submissions table
CREATE TABLE IF NOT EXISTS artifact_submissions_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id TEXT REFERENCES artifacts_new(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  submission_data JSONB NOT NULL,
  form_version TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add artifact_submission_id column to bids table for new schema integration
ALTER TABLE bids ADD COLUMN IF NOT EXISTS artifact_submission_id UUID REFERENCES artifact_submissions_new(id) ON DELETE SET NULL;

-- =============================
-- STEP 2: MIGRATE EXISTING FORM_ARTIFACTS DATA
-- =============================

DO $$
DECLARE
  form_artifact RECORD;
  new_artifact_id TEXT;
BEGIN
  -- Migrate data from form_artifacts table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_artifacts') THEN
    
    FOR form_artifact IN 
      SELECT * FROM form_artifacts WHERE status = 'active'
    LOOP
      -- Insert into new artifacts table
      INSERT INTO artifacts_new (
        id,
        user_id,
        name,
        description,
        type,
        schema,
        ui_schema,
        form_data,
        submit_action,
        status,
        created_at,
        updated_at
      ) VALUES (
        form_artifact.id,
        form_artifact.user_id,
        form_artifact.title,
        form_artifact.description,
        'form',
        form_artifact.schema,
        COALESCE(form_artifact.ui_schema, '{}'::jsonb),
        COALESCE(form_artifact.data, '{}'::jsonb),
        COALESCE(form_artifact.submit_action, '{"type": "save_session"}'::jsonb),
        form_artifact.status,
        form_artifact.created_at,
        form_artifact.updated_at
      );
      
      RAISE NOTICE 'Migrated form_artifact: %', form_artifact.id;
    END LOOP;
    
    RAISE NOTICE 'Completed form_artifacts migration';
  ELSE
    RAISE NOTICE 'form_artifacts table does not exist, skipping migration';
  END IF;
END $$;

-- =============================
-- STEP 3: MIGRATE EXISTING ARTIFACTS DATA
-- =============================

DO $$
DECLARE
  artifact RECORD;
BEGIN
  -- Migrate data from existing artifacts table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifacts') THEN
    
    FOR artifact IN 
      SELECT * FROM artifacts WHERE processing_status IN ('completed', 'pending')
    LOOP
      -- Avoid duplicates from form_artifacts migration
      IF NOT EXISTS (SELECT 1 FROM artifacts_new WHERE id = artifact.id::text) THEN
        INSERT INTO artifacts_new (
          id,
          user_id,
          session_id,
          message_id,
          name,
          type,
          file_type,
          file_size,
          storage_path,
          mime_type,
          processed_content,
          processing_status,
          metadata,
          created_at,
          updated_at
        ) VALUES (
          artifact.id::text,
          NULL, -- Will need to be linked via session later
          artifact.session_id,
          artifact.message_id,
          artifact.name,
          CASE 
            WHEN artifact.file_type = 'pdf' THEN 'pdf'
            WHEN artifact.file_type IN ('jpg', 'jpeg', 'png', 'gif') THEN 'image'
            WHEN artifact.file_type IN ('doc', 'docx', 'txt') THEN 'document'
            ELSE 'other'
          END,
          artifact.file_type,
          artifact.file_size,
          artifact.storage_path,
          artifact.mime_type,
          artifact.processed_content,
          artifact.processing_status,
          COALESCE(artifact.metadata, '{}'::jsonb),
          artifact.created_at,
          NOW()
        );
        
        RAISE NOTICE 'Migrated artifact: %', artifact.id;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed artifacts migration';
  ELSE
    RAISE NOTICE 'artifacts table does not exist, skipping migration';
  END IF;
END $$;

-- =============================
-- STEP 4: MIGRATE RFP QUESTIONNAIRE DATA
-- =============================

DO $$
DECLARE
  rfp_record RECORD;
  questionnaire_artifact_id TEXT;
  bid_form_artifact_id TEXT;
BEGIN
  -- Migrate buyer questionnaires from RFPs table
  FOR rfp_record IN 
    SELECT id, buyer_questionnaire, buyer_questionnaire_response, bid_form_questionaire, created_at
    FROM rfps 
    WHERE buyer_questionnaire IS NOT NULL 
       OR buyer_questionnaire_response IS NOT NULL 
       OR bid_form_questionaire IS NOT NULL
  LOOP
    
    -- Create buyer questionnaire artifact if it exists
    IF rfp_record.buyer_questionnaire IS NOT NULL THEN
      questionnaire_artifact_id := 'buyer-questionnaire-' || rfp_record.id;
      
      INSERT INTO artifacts_new (
        id,
        user_id,
        name,
        description,
        type,
        schema,
        form_data,
        status,
        created_at,
        updated_at
      ) VALUES (
        questionnaire_artifact_id,
        NULL, -- Anonymous for now
        'Buyer Questionnaire for RFP #' || rfp_record.id,
        'Questionnaire for gathering buyer requirements',
        'form',
        rfp_record.buyer_questionnaire,
        COALESCE(rfp_record.buyer_questionnaire_response, '{}'::jsonb),
        'active',
        rfp_record.created_at,
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
      
      -- Link to RFP
      INSERT INTO rfp_artifacts (rfp_id, artifact_id, artifact_role)
      VALUES (rfp_record.id, questionnaire_artifact_id, 'buyer_questionnaire')
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Created buyer questionnaire artifact for RFP %', rfp_record.id;
    END IF;
    
    -- Create bid form artifact if it exists
    IF rfp_record.bid_form_questionaire IS NOT NULL THEN
      bid_form_artifact_id := 'bid-form-' || rfp_record.id;
      
      INSERT INTO artifacts_new (
        id,
        user_id,
        name,
        description,
        type,
        schema,
        ui_schema,
        form_data,
        status,
        created_at,
        updated_at
      ) VALUES (
        bid_form_artifact_id,
        NULL, -- Anonymous for now
        'Supplier Bid Form for RFP #' || rfp_record.id,
        'Form for suppliers to submit bids',
        'form',
        (rfp_record.bid_form_questionaire->>'schema')::jsonb,
        COALESCE((rfp_record.bid_form_questionaire->>'uiSchema')::jsonb, '{}'::jsonb),
        COALESCE((rfp_record.bid_form_questionaire->>'defaults')::jsonb, '{}'::jsonb),
        'active',
        rfp_record.created_at,
        NOW()
      ) VALUES (
        bid_form_artifact_id,
        NULL,
        'Supplier Bid Form for RFP #' || rfp_record.id,
        'Form for suppliers to submit bids',
        'form',
        rfp_record.bid_form_questionaire,
        '{}'::jsonb,
        '{}'::jsonb,
        'active',
        rfp_record.created_at,
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
      
      -- Link to RFP
      INSERT INTO rfp_artifacts (rfp_id, artifact_id, artifact_role)
      VALUES (rfp_record.id, bid_form_artifact_id, 'bid_form')
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Created bid form artifact for RFP %', rfp_record.id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Completed RFP questionnaire migration';
END $$;

-- =============================
-- STEP 5: MIGRATE ARTIFACT SUBMISSIONS
-- =============================

DO $$
DECLARE
  submission RECORD;
BEGIN
  -- Migrate existing artifact submissions if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_submissions') THEN
    
    FOR submission IN 
      SELECT * FROM artifact_submissions
    LOOP
      INSERT INTO artifact_submissions_new (
        id,
        artifact_id,
        session_id,
        user_id,
        submission_data,
        form_version,
        submitted_at,
        metadata
      ) VALUES (
        COALESCE(submission.id, gen_random_uuid()),
        submission.artifact_id,
        submission.session_id,
        submission.user_id,
        submission.submission_data,
        submission.form_version,
        submission.submitted_at,
        COALESCE(submission.metadata, '{}'::jsonb)
      ) ON CONFLICT (id) DO NOTHING;
      
    END LOOP;
    
    RAISE NOTICE 'Completed artifact_submissions migration';
  ELSE
    RAISE NOTICE 'artifact_submissions table does not exist, skipping migration';
  END IF;
END $$;

-- =============================
-- STEP 6: CREATE INDEXES
-- =============================

-- Artifacts indexes
CREATE INDEX IF NOT EXISTS idx_artifacts_new_user_id ON artifacts_new(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_new_session_id ON artifacts_new(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_new_type ON artifacts_new(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_new_status ON artifacts_new(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_new_template ON artifacts_new(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_artifacts_new_created_at ON artifacts_new(created_at);

-- Artifact submissions indexes
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_new_artifact_id ON artifact_submissions_new(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_new_session_id ON artifact_submissions_new(session_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_new_user_id ON artifact_submissions_new(user_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_new_submitted_at ON artifact_submissions_new(submitted_at);

-- RFP artifacts indexes
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_rfp_id ON rfp_artifacts(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_artifact_id ON rfp_artifacts(artifact_id);
CREATE INDEX IF NOT EXISTS idx_rfp_artifacts_role ON rfp_artifacts(artifact_role);

-- =============================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =============================

-- Enable RLS on new tables
ALTER TABLE artifacts_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_submissions_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_artifacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own artifacts and public artifacts" ON artifacts_new 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR
    status = 'active' AND is_template = true
  );

CREATE POLICY "Users can create their own artifacts" ON artifacts_new 
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own artifacts" ON artifacts_new 
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own artifacts" ON artifacts_new 
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Artifact submissions policies
CREATE POLICY "Users can view their own submissions" ON artifact_submissions_new 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own submissions" ON artifact_submissions_new 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RFP artifacts policies (allow public access for now, can be restricted later)
CREATE POLICY "RFP artifacts are publicly readable" ON rfp_artifacts 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage RFP artifacts" ON rfp_artifacts 
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================
-- STEP 8: CREATE HELPER FUNCTIONS
-- =============================

-- Function to get artifacts for an RFP
CREATE OR REPLACE FUNCTION get_rfp_artifacts(rfp_id_param INTEGER)
RETURNS TABLE (
  artifact_id TEXT,
  artifact_name TEXT,
  artifact_type TEXT,
  artifact_role TEXT,
  schema JSONB,
  ui_schema JSONB,
  form_data JSONB,
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
    a.form_data,
    a.created_at
  FROM artifacts_new a
  JOIN rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
  AND a.status = 'active'
  ORDER BY ra.artifact_role, a.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to get latest submission
CREATE OR REPLACE FUNCTION get_latest_submission(artifact_id_param TEXT, session_id_param UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT submission_data INTO result
  FROM artifact_submissions_new
  WHERE artifact_id = artifact_id_param
  AND (session_id_param IS NULL OR session_id = session_id_param)
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Helper function to get bid response data from new or legacy schema
CREATE OR REPLACE FUNCTION get_bid_response(bid_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
  -- Try new schema first - get submission data from linked artifact
  SELECT s.submission_data INTO result
  FROM bids b
  JOIN artifact_submissions_new s ON b.artifact_submission_id = s.id
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

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER
SET search_path = '';

CREATE TRIGGER update_artifacts_new_updated_at BEFORE UPDATE ON artifacts_new 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================
-- STEP 8A: MIGRATE BID RESPONSE DATA
-- =============================

DO $$
DECLARE
  bid_record RECORD;
  bid_form_artifact_id TEXT;
  submission_id UUID;
BEGIN
  RAISE NOTICE 'Starting bid response data migration...';
  
  -- Loop through all bids that have response data
  FOR bid_record IN
    SELECT b.id, b.rfp_id, b.supplier_id, b.response, b.created_at, b.updated_at
    FROM bids b
    WHERE b.response IS NOT NULL
      AND b.response != 'null'::jsonb
      AND b.response != '{}'::jsonb
  LOOP
    RAISE NOTICE 'Migrating bid % for RFP %', bid_record.id, bid_record.rfp_id;
    
    -- Find the bid form artifact for this RFP
    SELECT ra.artifact_id INTO bid_form_artifact_id
    FROM rfp_artifacts_new ra
    JOIN artifacts_new a ON ra.artifact_id = a.id
    WHERE ra.rfp_id = bid_record.rfp_id
      AND ra.role = 'supplier'
      AND a.artifact_role = 'bid_form'
    LIMIT 1;
    
    IF bid_form_artifact_id IS NULL THEN
      RAISE NOTICE 'No bid form artifact found for RFP %, skipping bid %', bid_record.rfp_id, bid_record.id;
      CONTINUE;
    END IF;
    
    -- Create artifact submission for this bid response
    INSERT INTO artifact_submissions_new (
      id,
      artifact_id,
      session_id,
      user_id,
      submission_data,
      submitted_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      bid_form_artifact_id,
      NULL, -- No session context for legacy bids
      bid_record.supplier_id,
      bid_record.response,
      bid_record.created_at,
      bid_record.created_at,
      bid_record.updated_at
    ) RETURNING id INTO submission_id;
    
    -- Update the bid to reference the artifact submission
    UPDATE bids SET 
      artifact_submission_id = submission_id,
      updated_at = NOW()
    WHERE id = bid_record.id;
    
    RAISE NOTICE 'Migrated bid % with submission %', bid_record.id, submission_id;
  END LOOP;
  
  RAISE NOTICE 'Bid response data migration completed';
END $$;

-- =============================
-- STEP 9: VALIDATION AND SUMMARY
-- =============================

DO $$
DECLARE
  form_artifacts_count INTEGER;
  artifacts_count INTEGER;
  rfp_questionnaires_count INTEGER;
  bid_responses_migrated INTEGER;
  total_migrated INTEGER;
BEGIN
  -- Count migrated data
  SELECT COUNT(*) INTO form_artifacts_count FROM artifacts_new WHERE type = 'form' AND id LIKE 'form_%';
  SELECT COUNT(*) INTO artifacts_count FROM artifacts_new WHERE type != 'form';
  SELECT COUNT(*) INTO rfp_questionnaires_count FROM rfp_artifacts;
  SELECT COUNT(*) INTO bid_responses_migrated FROM bids WHERE artifact_submission_id IS NOT NULL;
  
  total_migrated := form_artifacts_count + artifacts_count;
  
  RAISE NOTICE '=============================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '=============================';
  RAISE NOTICE 'Form artifacts migrated: %', form_artifacts_count;
  RAISE NOTICE 'File artifacts migrated: %', artifacts_count;
  RAISE NOTICE 'RFP questionnaires created: %', rfp_questionnaires_count;
  RAISE NOTICE 'Bid responses migrated: %', bid_responses_migrated;
  RAISE NOTICE 'Total artifacts in new table: %', total_migrated;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Update application code to use new schema';
  RAISE NOTICE '2. Test thoroughly';
  RAISE NOTICE '3. Run cleanup script to remove old tables';
  RAISE NOTICE '=============================';
END $$;

COMMIT;

-- =============================
-- NOTES FOR APPLICATION UPDATES
-- =============================
-- 
-- After running this migration, update the following:
-- 
-- 1. DatabaseService.getFormArtifacts() - point to artifacts_new table
-- 2. ClaudeAPIFunctions form artifact methods - use artifacts_new
-- 3. RFPService questionnaire methods - use rfp_artifacts relationship
-- 4. RFPService bid methods - use artifact submissions for new bids
-- 5. Update TypeScript interfaces to match new schema (Bid type updated)
-- 6. Update component props and data handling for bid responses
-- 
-- The old tables will still exist for safety. Run the cleanup
-- script only after thorough testing confirms everything works.
-- 
-- BID RESPONSE MIGRATION:
-- - Existing bid.response data is migrated to artifact_submissions_new
-- - New bids should use RFPService.submitBidAsArtifact() method
-- - Legacy bids still accessible via RFPService.getBidResponse() helper
-- =============================
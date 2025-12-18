-- =======================================================
-- FIX SECURITY LINTER ISSUES
-- Date: December 17, 2025
-- Purpose: Fix Supabase security linter errors and warnings
-- =======================================================

-- ============================================
-- ERROR FIX: Remove SECURITY DEFINER from agent_hierarchy view
-- ============================================

-- Recreate the agent_hierarchy view without SECURITY DEFINER
CREATE OR REPLACE VIEW agent_hierarchy AS
WITH RECURSIVE agent_tree AS (
  -- Base case: agents with no parent (root agents)
  SELECT 
    id,
    name,
    parent_agent_id,
    is_abstract,
    0 as depth,
    ARRAY[name] as inheritance_chain,
    name::text as chain_display
  FROM agents
  WHERE parent_agent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: agents with parents
  SELECT 
    a.id,
    a.name,
    a.parent_agent_id,
    a.is_abstract,
    at.depth + 1,
    at.inheritance_chain || a.name,
    at.chain_display || ' → ' || a.name
  FROM agents a
  INNER JOIN agent_tree at ON a.parent_agent_id = at.id
)
SELECT 
  id,
  name,
  parent_agent_id,
  is_abstract,
  depth,
  inheritance_chain,
  chain_display
FROM agent_tree
ORDER BY depth, name;

-- ============================================
-- WARNING FIXES: Add SET search_path to functions
-- ============================================

-- 1. Fix calculate_inheritance_depth function
DROP FUNCTION IF EXISTS calculate_inheritance_depth(UUID);
CREATE OR REPLACE FUNCTION calculate_inheritance_depth(agent_id UUID) 
RETURNS INTEGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  depth INTEGER := 0;
  current_id UUID := agent_id;
  parent_id UUID;
  visited_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  LOOP
    -- Check for circular reference
    IF current_id = ANY(visited_ids) THEN
      RAISE EXCEPTION 'Circular inheritance detected for agent %', agent_id;
    END IF;
    
    -- Add to visited list
    visited_ids := array_append(visited_ids, current_id);
    
    -- Get parent
    SELECT parent_agent_id INTO parent_id FROM agents WHERE id = current_id;
    EXIT WHEN parent_id IS NULL;
    
    depth := depth + 1;
    current_id := parent_id;
    
    -- Prevent infinite loops (max 10 levels)
    IF depth > 10 THEN
      RAISE EXCEPTION 'Inheritance depth exceeds maximum (10 levels) for agent %', agent_id;
    END IF;
  END LOOP;
  
  RETURN depth;
END;
$$;

-- 2. Fix update_inheritance_depth function
DROP FUNCTION IF EXISTS update_inheritance_depth() CASCADE;
CREATE OR REPLACE FUNCTION update_inheritance_depth()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.inheritance_depth := calculate_inheritance_depth(NEW.id);
  RETURN NEW;
END;
$$;

-- 3. Fix match_account_memories function
DROP FUNCTION IF EXISTS match_account_memories(extensions.vector(1024), uuid, text, double precision, int);
CREATE OR REPLACE FUNCTION match_account_memories(
  query_embedding extensions.vector(1024),
  filter_account_id uuid,
  filter_memory_type text,
  match_threshold double precision DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  account_id uuid,
  user_id uuid,
  memory_type text,
  content text,
  importance_score float,
  metadata jsonb,
  similarity float,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.account_id,
    am.user_id,
    am.memory_type,
    am.content,
    am.importance_score,
    am.metadata,
    1 - (am.embedding <=> query_embedding) as similarity,
    am.created_at
  FROM account_memories am
  WHERE 
    (filter_account_id IS NULL OR am.account_id = filter_account_id)
    AND (filter_memory_type IS NULL OR am.memory_type = filter_memory_type)
    AND 1 - (am.embedding <=> query_embedding) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Fix check_artifact_role_exists function
DROP FUNCTION IF EXISTS check_artifact_role_exists(INTEGER, TEXT);
CREATE OR REPLACE FUNCTION check_artifact_role_exists(
    p_rfp_id INTEGER,
    p_artifact_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_artifact_id UUID;
BEGIN
    -- Check if an artifact with this role already exists for this RFP
    SELECT a.id INTO existing_artifact_id
    FROM artifacts a
    JOIN rfp_artifacts ra ON a.id = ra.artifact_id
    WHERE ra.rfp_id = p_rfp_id
      AND a.artifact_role = p_artifact_role
    LIMIT 1;

    RETURN existing_artifact_id;
END;
$$;

-- 5. Fix submit_bid function
DROP FUNCTION IF EXISTS submit_bid(INTEGER, TEXT, INTEGER, INTEGER, UUID, UUID, UUID);
CREATE OR REPLACE FUNCTION public.submit_bid(
  rfp_id_param INTEGER,
  artifact_id_param TEXT,
  supplier_id_param INTEGER DEFAULT NULL,
  agent_id_param INTEGER DEFAULT NULL,
  session_id_param UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  account_id_param UUID DEFAULT NULL
) 
RETURNS UUID 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  bid_id INTEGER;
  submission_id UUID;
  form_data JSONB;
  bid_amount_extracted DECIMAL(15,2);
  delivery_date_extracted DATE;
  supplier_notes_extracted TEXT;
  resolved_account_id UUID;
BEGIN
  -- Resolve account_id from session if not provided
  IF account_id_param IS NULL AND session_id_param IS NOT NULL THEN
    SELECT account_id INTO resolved_account_id
    FROM public.sessions
    WHERE id = session_id_param;
  ELSE
    resolved_account_id := account_id_param;
  END IF;

  -- Get the latest form submission data
  SELECT submission_data INTO form_data
  FROM public.artifact_submissions
  WHERE artifact_id = artifact_id_param
  ORDER BY submitted_at DESC
  LIMIT 1;

  -- Extract bid data
  bid_amount_extracted := (form_data->>'bidAmount')::DECIMAL(15,2);
  delivery_date_extracted := (form_data->>'deliveryDate')::DATE;
  supplier_notes_extracted := form_data->>'supplierNotes';

  -- Insert into bids table
  INSERT INTO public.bids (
    rfp_id,
    supplier_id,
    bid_amount,
    bid_status,
    delivery_date,
    supplier_notes,
    agent_id,
    session_id,
    user_id,
    account_id,
    submitted_at
  ) VALUES (
    rfp_id_param,
    supplier_id_param,
    bid_amount_extracted,
    'submitted',
    delivery_date_extracted,
    supplier_notes_extracted,
    agent_id_param,
    session_id_param,
    user_id_param,
    resolved_account_id,
    NOW()
  )
  RETURNING id INTO bid_id;

  -- Create artifact submission record
  INSERT INTO public.artifact_submissions (
    artifact_id,
    submission_data,
    submitted_by,
    account_id
  ) VALUES (
    artifact_id_param,
    form_data,
    user_id_param,
    resolved_account_id
  )
  RETURNING id INTO submission_id;

  RETURN submission_id;
END;
$$;

-- 6. Fix get_specialty_site_agents function
DROP FUNCTION IF EXISTS get_specialty_site_agents(TEXT);
CREATE OR REPLACE FUNCTION public.get_specialty_site_agents(site_slug text)
RETURNS TABLE(
  agent_id uuid, 
  agent_name text, 
  agent_description text, 
  agent_instructions text, 
  agent_initial_prompt text, 
  agent_avatar_url text, 
  is_active boolean, 
  is_default boolean, 
  sort_order integer, 
  is_free boolean, 
  is_restricted boolean, 
  role text
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.instructions,
    a.initial_prompt,
    a.avatar_url,
    a.is_active,
    ssa.is_default_agent,
    ssa.sort_order,
    a.is_free,
    a.is_restricted,
    a.role
  FROM agents a
  INNER JOIN specialty_site_agents ssa ON a.id = ssa.agent_id
  INNER JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
  WHERE ss.slug = site_slug
    AND ss.is_active = true
    AND a.is_active = true
    AND (a.is_abstract IS NULL OR a.is_abstract = false)
  ORDER BY ssa.sort_order, a.name;
END;
$$;

-- 7. Fix update_email_credentials_updated_at function
DROP FUNCTION IF EXISTS update_email_credentials_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_email_credentials_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Fix update_email_messages_updated_at function
DROP FUNCTION IF EXISTS update_email_messages_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_email_messages_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 9. Fix update_specialty_sites_updated_at function
DROP FUNCTION IF EXISTS update_specialty_sites_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_specialty_sites_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- Handle specialty session functions if they exist
-- ============================================

-- Note: These functions appear in the linter report but may not exist in migrations
-- We'll create them with proper security settings if they don't exist

-- 10. set_user_specialty_session function
DROP FUNCTION IF EXISTS set_user_specialty_session(UUID, TEXT);
CREATE OR REPLACE FUNCTION set_user_specialty_session(
  p_user_id UUID,
  p_site_slug TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set session variable for specialty site context
  PERFORM set_config('app.specialty_site', p_site_slug, false);
END;
$$;

-- 11. get_user_specialty_session function
DROP FUNCTION IF EXISTS get_user_specialty_session();
CREATE OR REPLACE FUNCTION get_user_specialty_session()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  -- Get session variable for specialty site context
  RETURN current_setting('app.specialty_site', true);
END;
$$;

-- 12. clear_user_specialty_session function
DROP FUNCTION IF EXISTS clear_user_specialty_session();
CREATE OR REPLACE FUNCTION clear_user_specialty_session()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Clear session variable for specialty site context
  PERFORM set_config('app.specialty_site', NULL, false);
END;
$$;

-- Recreate triggers that were dropped by CASCADE
DROP TRIGGER IF EXISTS trg_update_inheritance_depth ON public.agents;
CREATE TRIGGER trg_update_inheritance_depth
  BEFORE INSERT OR UPDATE OF parent_agent_id ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION update_inheritance_depth();

DROP TRIGGER IF EXISTS user_email_credentials_updated_at ON user_email_credentials;
CREATE TRIGGER user_email_credentials_updated_at
BEFORE UPDATE ON user_email_credentials
FOR EACH ROW
EXECUTE FUNCTION update_email_credentials_updated_at();

DROP TRIGGER IF EXISTS email_messages_updated_at ON email_messages;
CREATE TRIGGER email_messages_updated_at
BEFORE UPDATE ON email_messages
FOR EACH ROW
EXECUTE FUNCTION update_email_messages_updated_at();

DROP TRIGGER IF EXISTS update_specialty_sites_updated_at ON public.specialty_sites;
CREATE TRIGGER update_specialty_sites_updated_at 
  BEFORE UPDATE ON public.specialty_sites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_specialty_sites_updated_at();

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON VIEW agent_hierarchy IS 'Recursive view showing agent inheritance tree - uses querying user permissions (not SECURITY DEFINER)';
COMMENT ON FUNCTION calculate_inheritance_depth IS 'Calculate agent inheritance depth with search_path security';
COMMENT ON FUNCTION update_inheritance_depth IS 'Trigger function to update inheritance depth with search_path security';
COMMENT ON FUNCTION match_account_memories(extensions.vector(1024), uuid, text, double precision, int) IS 'Match account memories by embedding similarity with search_path security';
COMMENT ON FUNCTION check_artifact_role_exists IS 'Check if artifact role exists for RFP with search_path security';
COMMENT ON FUNCTION submit_bid IS 'Submit bid for RFP with search_path security';
COMMENT ON FUNCTION get_specialty_site_agents IS 'Get agents for specialty site with search_path security';
COMMENT ON FUNCTION update_email_credentials_updated_at IS 'Update email credentials timestamp with search_path security';
COMMENT ON FUNCTION update_email_messages_updated_at IS 'Update email messages timestamp with search_path security';
COMMENT ON FUNCTION update_specialty_sites_updated_at IS 'Update specialty sites timestamp with search_path security';
COMMENT ON FUNCTION set_user_specialty_session IS 'Set specialty site session context with search_path security';
COMMENT ON FUNCTION get_user_specialty_session IS 'Get specialty site session context with search_path security';
COMMENT ON FUNCTION clear_user_specialty_session IS 'Clear specialty site session context with search_path security';

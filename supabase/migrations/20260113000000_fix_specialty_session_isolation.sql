-- Fix specialty session isolation to prevent interference between specialty sites
-- Issue: /home and /corporate-tmc-rfp were sharing agent state because sessions weren't properly scoped

-- Create table to track user's current session per specialty site
CREATE TABLE IF NOT EXISTS user_specialty_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty_site_id uuid NOT NULL REFERENCES specialty_sites(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, specialty_site_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_specialty_sessions_user_id ON user_specialty_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_specialty_sessions_specialty_site_id ON user_specialty_sessions(specialty_site_id);
CREATE INDEX IF NOT EXISTS idx_user_specialty_sessions_session_id ON user_specialty_sessions(session_id);

-- RLS policies for user_specialty_sessions
ALTER TABLE user_specialty_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own specialty sessions"
  ON user_specialty_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own specialty sessions"
  ON user_specialty_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own specialty sessions"
  ON user_specialty_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own specialty sessions"
  ON user_specialty_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_specialty_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_specialty_sessions_updated_at
  BEFORE UPDATE ON user_specialty_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_specialty_sessions_updated_at();

-- Replace the RPC functions to properly handle specialty session isolation

-- Drop old parameterless function first
DROP FUNCTION IF EXISTS get_user_specialty_session();

-- Get user's current session for a specific specialty site
DROP FUNCTION IF EXISTS get_user_specialty_session(uuid, text);
CREATE OR REPLACE FUNCTION get_user_specialty_session(
  user_uuid uuid,
  specialty_slug text
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  site_id uuid;
  result_session_id uuid;
BEGIN
  -- Get specialty site ID from slug
  SELECT id INTO site_id
  FROM specialty_sites
  WHERE slug = specialty_slug;
  
  IF site_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user's current session for this specialty site
  SELECT session_id INTO result_session_id
  FROM user_specialty_sessions
  WHERE user_id = user_uuid
    AND specialty_site_id = site_id;
  
  RETURN result_session_id;
END;
$$;

COMMENT ON FUNCTION get_user_specialty_session(uuid, text) IS 'Get user current session for specific specialty site';

-- Drop old parameterless function first
DROP FUNCTION IF EXISTS set_user_specialty_session();

-- Set user's current session for a specific specialty site
DROP FUNCTION IF EXISTS set_user_specialty_session(uuid, text, uuid);
CREATE OR REPLACE FUNCTION set_user_specialty_session(
  user_uuid uuid,
  specialty_slug text,
  session_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  site_id uuid;
BEGIN
  -- Get specialty site ID from slug
  SELECT id INTO site_id
  FROM specialty_sites
  WHERE slug = specialty_slug;
  
  IF site_id IS NULL THEN
    RAISE EXCEPTION 'Specialty site not found: %', specialty_slug;
  END IF;
  
  -- Insert or update user's specialty session
  INSERT INTO user_specialty_sessions (user_id, specialty_site_id, session_id)
  VALUES (user_uuid, site_id, session_uuid)
  ON CONFLICT (user_id, specialty_site_id)
  DO UPDATE SET
    session_id = session_uuid,
    updated_at = NOW();
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION set_user_specialty_session(uuid, text, uuid) IS 'Set user current session for specific specialty site';

-- Drop old parameterless function first
DROP FUNCTION IF EXISTS clear_user_specialty_session();

-- Clear user's current session for a specific specialty site  
DROP FUNCTION IF EXISTS clear_user_specialty_session(uuid, text);
CREATE OR REPLACE FUNCTION clear_user_specialty_session(
  user_uuid uuid,
  specialty_slug text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  site_id uuid;
BEGIN
  -- Get specialty site ID from slug
  SELECT id INTO site_id
  FROM specialty_sites
  WHERE slug = specialty_slug;
  
  IF site_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Delete user's specialty session
  DELETE FROM user_specialty_sessions
  WHERE user_id = user_uuid
    AND specialty_site_id = site_id;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION clear_user_specialty_session(uuid, text) IS 'Clear user current session for specific specialty site';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_specialty_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_specialty_session(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_specialty_session(uuid, text) TO authenticated;

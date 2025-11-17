-- Migration: Update user_profiles to track current session per specialty
-- Replaces single current_session_id with specialty_sessions JSONB
-- Format: { "home": "session-uuid", "tmc": "session-uuid", "respond": "session-uuid" }

-- 1. Add specialty_sessions JSONB column
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS specialty_sessions JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing current_session_id to specialty_sessions under 'home' key
UPDATE public.user_profiles 
SET specialty_sessions = jsonb_build_object('home', current_session_id)
WHERE current_session_id IS NOT NULL;

-- 3. Drop old current_session_id column (after data migration)
ALTER TABLE public.user_profiles 
  DROP COLUMN IF EXISTS current_session_id;

-- 4. Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_specialty_sessions 
  ON public.user_profiles USING gin(specialty_sessions);

-- 5. Add comment for documentation
COMMENT ON COLUMN public.user_profiles.specialty_sessions IS 'Tracks current session per specialty site. Format: {"home": "uuid", "tmc": "uuid"}';

-- 6. Update RPC function to set specialty-specific current session
CREATE OR REPLACE FUNCTION set_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT,
  session_uuid UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET specialty_sessions = jsonb_set(
    COALESCE(specialty_sessions, '{}'::jsonb),
    ARRAY[specialty_slug],
    to_jsonb(session_uuid::text),
    true
  )
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update RPC function to get specialty-specific current session
CREATE OR REPLACE FUNCTION get_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT
) RETURNS UUID AS $$
DECLARE
  session_id_text TEXT;
BEGIN
  SELECT specialty_sessions->>specialty_slug
  INTO session_id_text
  FROM public.user_profiles
  WHERE id = user_uuid;
  
  IF session_id_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN session_id_text::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Clear specialty session (useful for cleanup)
CREATE OR REPLACE FUNCTION clear_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET specialty_sessions = specialty_sessions - specialty_slug
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Drop old RPC functions (if they exist)
DROP FUNCTION IF EXISTS set_user_current_session(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_current_session(UUID);

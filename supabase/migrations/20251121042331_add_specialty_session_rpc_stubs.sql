-- Migration: Add RPC stub functions for specialty session management
-- These are temporary stubs until full specialty session tracking is implemented
-- They prevent 404 errors in the frontend while returning graceful fallbacks

-- Function: set_user_specialty_session
-- Temporarily stores nothing but returns success
-- TODO: Implement full specialty session tracking with user_specialty_sessions table
CREATE OR REPLACE FUNCTION set_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT,
  session_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stub implementation - returns success without storing
  -- This prevents 404 errors in frontend
  -- TODO: Implement actual storage when user_specialty_sessions table is created
  RETURN;
END;
$$;

-- Function: clear_user_specialty_session
-- Temporarily does nothing but returns success
CREATE OR REPLACE FUNCTION clear_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stub implementation - returns success without clearing
  -- This prevents 404 errors in frontend
  -- TODO: Implement actual clearing when user_specialty_sessions table is created
  RETURN;
END;
$$;

-- Function: get_user_specialty_session
-- Temporarily returns NULL (no session found)
CREATE OR REPLACE FUNCTION get_user_specialty_session(
  user_uuid UUID,
  specialty_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Stub implementation - always returns NULL
  -- This prevents 404 errors in frontend
  -- TODO: Implement actual lookup when user_specialty_sessions table is created
  RETURN NULL;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION set_user_specialty_session(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_specialty_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_specialty_session(UUID, TEXT) TO authenticated;

-- Comment explaining these are stubs
COMMENT ON FUNCTION set_user_specialty_session IS 'Stub function - prevents 404 errors until full implementation';
COMMENT ON FUNCTION clear_user_specialty_session IS 'Stub function - prevents 404 errors until full implementation';
COMMENT ON FUNCTION get_user_specialty_session IS 'Stub function - prevents 404 errors until full implementation';

-- Debug view to expose current DB session info for GET requests
-- Use for diagnostics only. Returns current_user, role, and request.jwt.claims
CREATE OR REPLACE VIEW public.debug_session_get AS
SELECT
  current_user AS current_user,
  current_setting('role', true) AS role,
  current_setting('request.jwt.claims', true) AS request_jwt_claims;

GRANT SELECT ON public.debug_session_get TO anon;
GRANT SELECT ON public.debug_session_get TO authenticated;

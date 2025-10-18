CREATE OR REPLACE FUNCTION public.debug_session_info() RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  claims text;
  r jsonb;
BEGIN
  BEGIN
    claims := current_setting('request.jwt.claims', true);
  EXCEPTION WHEN others THEN
    claims := NULL;
  END;
  r := jsonb_build_object(
    'current_user', current_user,
    'set_role', current_setting('role', true),
    'request_jwt_claims', claims
  );
  RETURN r;
END;
$$;
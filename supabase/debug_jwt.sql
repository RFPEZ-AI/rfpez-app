CREATE OR REPLACE FUNCTION public.debug_jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'claims', (current_setting('request.jwt.claims', true))::jsonb,
    'auth_uid', auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.debug_jwt() TO anon, authenticated;

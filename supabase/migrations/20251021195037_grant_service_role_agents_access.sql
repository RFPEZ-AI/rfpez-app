-- Grant service_role full access to agents table
-- This is required for edge functions using service role client to bypass RLS
-- when loading agents for anonymous users

-- Grant all permissions on agents table
GRANT ALL ON agents TO service_role;

-- Verify the grant was applied
DO $$
BEGIN
  -- Check if service_role has SELECT permission
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'service_role' 
    AND table_name = 'agents' 
    AND privilege_type = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Failed to grant service_role permissions on agents table';
  END IF;
  
  RAISE NOTICE 'Successfully granted service_role access to agents table';
END $$;

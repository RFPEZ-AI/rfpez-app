-- Grant authenticated and service_role permissions on all core tables
-- This fixes 403 Forbidden errors when authenticated users try to access their data

-- Core user and session tables
GRANT ALL ON user_profiles TO authenticated, service_role;
GRANT ALL ON sessions TO authenticated, service_role;
GRANT ALL ON messages TO authenticated, service_role;
GRANT ALL ON session_agents TO authenticated, service_role;

-- Account management tables
GRANT ALL ON accounts TO authenticated, service_role;
GRANT ALL ON account_users TO authenticated, service_role;

-- Artifact and RFP tables (only grant if table exists)
DO $$
BEGIN
  -- artifacts table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artifacts') THEN
    EXECUTE 'GRANT ALL ON artifacts TO authenticated, service_role';
  END IF;
  
  -- rfps table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rfps') THEN
    EXECUTE 'GRANT ALL ON rfps TO authenticated, service_role';
  END IF;
  
  -- bids table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bids') THEN
    EXECUTE 'GRANT ALL ON bids TO authenticated, service_role';
  END IF;
  
  -- form_artifacts table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'form_artifacts') THEN
    EXECUTE 'GRANT ALL ON form_artifacts TO authenticated, service_role';
  END IF;
  
  -- vendors table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendors') THEN
    EXECUTE 'GRANT ALL ON vendors TO authenticated, service_role';
  END IF;
END $$;

-- Note: RLS policies still apply - these grants just give table-level access
-- Users will only see/modify data that RLS policies allow

-- Verify key tables have the grants
DO $$
BEGIN
  -- Check sessions table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticated' 
    AND table_name = 'sessions' 
    AND privilege_type = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Failed to grant authenticated permissions on sessions table';
  END IF;
  
  -- Check user_profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticated' 
    AND table_name = 'user_profiles' 
    AND privilege_type = 'UPDATE'
  ) THEN
    RAISE EXCEPTION 'Failed to grant authenticated permissions on user_profiles table';
  END IF;
  
  RAISE NOTICE 'Successfully granted authenticated and service_role access to all core tables';
END $$;

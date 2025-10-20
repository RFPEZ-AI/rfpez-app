-- Grant table-level permissions for account_memories and related tables
-- This fixes error 42501: permission denied for table account_memories

-- Grant all permissions on account_memories to service role (used by edge functions)
GRANT ALL ON TABLE public.account_memories TO service_role;

-- Grant all permissions to authenticated users (for direct client access)
GRANT ALL ON TABLE public.account_memories TO authenticated;

-- Grant read-only to anonymous users (for public access)
GRANT SELECT ON TABLE public.account_memories TO anon;

-- Also grant on related memory tables
GRANT ALL ON TABLE public.memory_references TO service_role;
GRANT ALL ON TABLE public.memory_references TO authenticated;
GRANT SELECT ON TABLE public.memory_references TO anon;

GRANT ALL ON TABLE public.memory_access_log TO service_role;
GRANT ALL ON TABLE public.memory_access_log TO authenticated;
GRANT SELECT ON TABLE public.memory_access_log TO anon;

-- Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the grants were applied
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'account_memories'
ORDER BY grantee, privilege_type;

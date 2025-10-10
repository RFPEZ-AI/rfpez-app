-- Memory System Verification Script
-- Run this against your Supabase database to verify memory infrastructure

-- 1. Verify agent_memories table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'agent_memories'
ORDER BY ordinal_position;

-- 2. Verify memory_references table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'memory_references'
ORDER BY ordinal_position;

-- 3. Verify memory_access_log table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'memory_access_log'
ORDER BY ordinal_position;

-- 4. Check if search_agent_memories function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'search_agent_memories';

-- 5. Check if update_memory_access function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_memory_access';

-- 6. Verify Solutions agent exists and has correct role
SELECT 
  id,
  name,
  role,
  is_active,
  LENGTH(instructions) as instruction_length
FROM agents
WHERE name = 'Solutions';

-- 7. Verify RFP Design agent exists and has correct role
SELECT 
  id,
  name,
  role,
  is_active,
  LENGTH(instructions) as instruction_length
FROM agents
WHERE name = 'RFP Design';

-- 8. Check for any existing memories (should be empty or minimal)
SELECT 
  COUNT(*) as total_memories,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT agent_id) as agents_with_memories,
  MIN(created_at) as oldest_memory,
  MAX(created_at) as newest_memory
FROM agent_memories;

-- 9. Check memory types distribution
SELECT 
  memory_type,
  COUNT(*) as count,
  AVG(importance_score) as avg_importance
FROM agent_memories
GROUP BY memory_type
ORDER BY count DESC;

-- 10. Verify pgvector extension is enabled
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vector';

-- 11. Test memory search function (with dummy data)
-- This will fail gracefully if no memories exist
SELECT * FROM search_agent_memories(
  query_user_id := '00000000-0000-0000-0000-000000000000',
  query_agent_id := '00000000-0000-0000-0000-000000000000',
  query_embedding := ARRAY(SELECT generate_series(1, 384))::vector,
  memory_type_filter := ARRAY['preference', 'decision'],
  match_threshold := 0.5,
  match_count := 5
);

-- 12. Check RLS policies on agent_memories
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'agent_memories';

-- Summary Report
SELECT 
  'Memory System Status' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'agent_memories') > 0
    THEN '✅ READY'
    ELSE '❌ MISSING TABLES'
  END as status;

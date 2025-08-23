-- Test queries for RFPEZ.AI Multi-Agent System
-- Run these in your Supabase SQL Editor to verify the setup

-- 1. Check if agents table exists and has data
SELECT * FROM public.agents ORDER BY sort_order;

-- 2. Check if session_agents table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_agents' 
AND table_schema = 'public';

-- 3. Check if messages table has agent_id column
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'agent_id'
AND table_schema = 'public';

-- 4. Test get_session_active_agent function
-- Replace 'your-session-uuid' with an actual session ID from your sessions table
-- SELECT * FROM get_session_active_agent('your-session-uuid');

-- 5. Get agents with their session counts (for testing)
SELECT 
  a.id,
  a.name,
  a.description,
  a.is_active,
  a.sort_order,
  COUNT(sa.id) as session_count
FROM public.agents a
LEFT JOIN public.session_agents sa ON a.id = sa.agent_id
GROUP BY a.id, a.name, a.description, a.is_active, a.sort_order
ORDER BY a.sort_order;

-- 6. Check Row Level Security policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('agents', 'session_agents') 
AND schemaname = 'public';

-- 7. Test creating a test session with agent (replace with your auth0_id)
-- INSERT INTO public.user_profiles (auth0_id, email, full_name) 
-- VALUES ('test-auth0-id', 'test@example.com', 'Test User') 
-- ON CONFLICT (auth0_id) DO NOTHING;

-- Get the user ID
-- SELECT id FROM public.user_profiles WHERE auth0_id = 'test-auth0-id';

-- Create a test session (replace user_id with actual UUID)
-- INSERT INTO public.sessions (user_id, title, description) 
-- VALUES ('your-user-uuid', 'Test Session', 'Testing multi-agent system');

-- Get the session ID
-- SELECT id FROM public.sessions WHERE title = 'Test Session';

-- Initialize session with default agent (replace UUIDs with actual values)
-- INSERT INTO public.session_agents (session_id, agent_id, is_active)
-- SELECT 'your-session-uuid', id, true
-- FROM public.agents 
-- WHERE name = 'Solutions';

-- 8. Verify the test setup
-- SELECT 
--   s.title as session_title,
--   a.name as agent_name,
--   sa.started_at,
--   sa.is_active
-- FROM public.sessions s
-- JOIN public.session_agents sa ON s.id = sa.session_id
-- JOIN public.agents a ON sa.agent_id = a.id
-- WHERE s.title = 'Test Session';

-- 9. Test switch_session_agent function
-- SELECT switch_session_agent(
--   'your-session-uuid'::uuid,
--   'technical-support-agent-uuid'::uuid,
--   'your-user-uuid'::uuid
-- );

-- 10. Clean up test data (uncomment when done testing)
-- DELETE FROM public.session_agents WHERE session_id IN (
--   SELECT id FROM public.sessions WHERE title = 'Test Session'
-- );
-- DELETE FROM public.sessions WHERE title = 'Test Session';
-- DELETE FROM public.user_profiles WHERE auth0_id = 'test-auth0-id';

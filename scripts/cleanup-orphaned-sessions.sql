-- Cleanup Orphaned Sessions Script
-- Purpose: Delete sessions with no agent and no messages that were mistakenly created
-- These sessions appear as "No Agent" in the UI and clutter the session history
-- 
-- Created: 2025-11-10
-- Author: GitHub Copilot
-- Copyright Mark Skiba, 2025 All rights reserved

-- Find orphaned sessions (for review before deletion)
SELECT 
  s.id,
  s.title,
  s.created_at,
  s.user_id,
  sa.agent_id,
  a.name as agent_name,
  COUNT(m.id) as message_count
FROM sessions s
LEFT JOIN session_agents sa ON s.id = sa.session_id
LEFT JOIN agents a ON sa.agent_id = a.id
LEFT JOIN messages m ON s.id = m.session_id
WHERE sa.agent_id IS NULL
  AND (
    s.title LIKE 'You are the%'  -- Initial prompt text
    OR s.title LIKE '%agent welcoming%'
    OR s.title LIKE '%just been act%'
  )
GROUP BY s.id, s.title, s.created_at, s.user_id, sa.agent_id, a.name
HAVING COUNT(m.id) = 0
ORDER BY s.created_at DESC;

-- Delete orphaned sessions (uncomment to execute)
-- DELETE FROM sessions 
-- WHERE id IN (
--   SELECT s.id 
--   FROM sessions s
--   LEFT JOIN session_agents sa ON s.id = sa.session_id
--   LEFT JOIN messages m ON s.id = m.session_id
--   WHERE sa.agent_id IS NULL
--     AND (
--       s.title LIKE 'You are the%'
--       OR s.title LIKE '%agent welcoming%'
--       OR s.title LIKE '%just been act%'
--     )
--   GROUP BY s.id
--   HAVING COUNT(m.id) = 0
-- );

-- Verify deletion (uncomment after running delete)
-- SELECT 
--   COUNT(*) as total_sessions,
--   COUNT(CASE WHEN sa.agent_id IS NULL THEN 1 END) as sessions_without_agent,
--   COUNT(CASE WHEN m.id IS NULL THEN 1 END) as sessions_without_messages
-- FROM sessions s
-- LEFT JOIN session_agents sa ON s.id = sa.session_id
-- LEFT JOIN messages m ON s.id = m.session_id;

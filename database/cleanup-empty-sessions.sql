-- Cleanup script for empty sessions (sessions with only agent welcome messages, no user messages)
-- These sessions are created when users visit the app but never send a message

-- Step 1: Add a function to identify and clean up empty sessions
CREATE OR REPLACE FUNCTION cleanup_empty_sessions(older_than_hours integer DEFAULT 24)
RETURNS TABLE (
  session_id uuid,
  title text,
  created_at timestamptz,
  message_count bigint
) AS $$
BEGIN
  -- First, let's identify sessions that:
  -- 1. Have messages (at least 1)
  -- 2. Have ZERO user messages (only assistant/system messages)
  -- 3. Are older than specified hours
  RETURN QUERY
  DELETE FROM sessions s
  WHERE s.id IN (
    SELECT sess.id
    FROM sessions sess
    LEFT JOIN messages m ON sess.id = m.session_id
    WHERE sess.created_at < NOW() - (older_than_hours || ' hours')::interval
    GROUP BY sess.id
    HAVING 
      COUNT(m.id) > 0 AND  -- Has at least one message
      COUNT(CASE WHEN m.role = 'user' THEN 1 END) = 0  -- But NO user messages
  )
  RETURNING s.id, s.title, s.created_at, 0::bigint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to prevent session creation until first user message (called from application)
-- This is informational - the actual logic will be in the application code

COMMENT ON FUNCTION cleanup_empty_sessions IS 'Deletes sessions that have only agent welcome messages and no user interaction. Default cleanup threshold is 24 hours.';

-- Step 3: Run an initial cleanup to remove existing empty sessions older than 1 hour
SELECT * FROM cleanup_empty_sessions(1);

-- Step 4: (Optional) Create a periodic job using pg_cron if installed
-- This requires the pg_cron extension
-- Uncomment if pg_cron is available:
/*
SELECT cron.schedule(
  'cleanup-empty-sessions',
  '0 */6 * * *',  -- Every 6 hours
  $$SELECT cleanup_empty_sessions(24);$$
);
*/

-- Step 5: Manual query to check current empty sessions
SELECT 
  s.id,
  s.title,
  s.created_at,
  s.updated_at,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as agent_messages
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
GROUP BY s.id, s.title, s.created_at, s.updated_at
HAVING 
  COUNT(m.id) > 0 AND
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) = 0
ORDER BY s.created_at DESC
LIMIT 20;

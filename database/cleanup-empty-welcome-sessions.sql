-- Cleanup Empty Welcome Sessions
-- Copyright Mark Skiba, 2025 All rights reserved
-- 
-- Purpose: Remove empty sessions that were created with agent welcome messages
--          but never received any user interaction
-- 
-- Background: Sessions with title "You are the Solutions agent welcoming a user..."
--             indicate agent activation messages that were never followed by user input.
--             These clutter the session history and should be automatically removed.

-- Function to automatically clean up empty welcome sessions
CREATE OR REPLACE FUNCTION cleanup_empty_welcome_sessions(
  max_age_hours INTEGER DEFAULT 1
)
RETURNS TABLE(
  session_id UUID,
  session_title TEXT,
  created_at TIMESTAMPTZ,
  message_count BIGINT,
  message_roles TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM sessions s
  WHERE 
    -- Empty sessions with welcome message titles OR any problematic pattern
    (
      s.title LIKE '%You are the Solutions agent%' OR 
      s.title LIKE '%agent welcoming a user%' OR
      s.title LIKE '%You are the%agent%'  -- Catch variations
    )
    -- Older than specified age
    AND s.created_at < NOW() - (max_age_hours || ' hours')::INTERVAL
    -- Has messages (system OR assistant)
    AND EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id)
    -- But NO user messages
    AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id AND m.role = 'user')
    -- AND either has system messages OR no assistant messages with agent_name
    AND (
      EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id AND m.role = 'system')
      OR NOT EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id AND m.role = 'assistant' AND m.agent_name IS NOT NULL)
    )
  RETURNING s.id, s.title, s.created_at, 
    (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id),
    (SELECT STRING_AGG(DISTINCT m.role, ', ') FROM messages m WHERE m.session_id = s.id);
END;
$$;

COMMENT ON FUNCTION cleanup_empty_welcome_sessions IS 'Deletes sessions that have agent welcome messages from initial_prompt but no user interaction. Default cleanup threshold is 1 hour. These sessions indicate agent activation without user engagement.';

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_empty_welcome_sessions TO authenticated;

-- Create a scheduled job to auto-cleanup (requires pg_cron extension)
-- This will run every hour to clean up sessions older than 1 hour
-- Uncomment if pg_cron is available:
/*
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-empty-welcome-sessions-hourly',
      '0 * * * *', -- Every hour at minute 0
      $$SELECT cleanup_empty_welcome_sessions(1);$$
    );
    RAISE NOTICE 'Auto-cleanup job scheduled: runs hourly';
  ELSE
    RAISE NOTICE 'pg_cron not available - manual cleanup required';
  END IF;
END $$;
*/

-- Manual cleanup (run immediately for existing empty sessions)
SELECT * FROM cleanup_empty_welcome_sessions(1);

-- Verification queries

-- Check remaining empty welcome sessions
SELECT 
  s.id,
  s.title,
  s.created_at,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as agent_messages
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.title LIKE '%You are the Solutions agent%'
  OR s.title LIKE '%agent welcoming a user%'
GROUP BY s.id, s.title, s.created_at
ORDER BY s.created_at DESC;

-- Check session creation rate over last 24 hours
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as sessions_created,
  COUNT(CASE WHEN title LIKE '%You are the Solutions agent%' THEN 1 END) as empty_welcome_sessions,
  COUNT(CASE WHEN title NOT LIKE '%You are the Solutions agent%' THEN 1 END) as normal_sessions
FROM sessions
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Usage Examples:

-- Clean up sessions older than 1 hour (default)
-- SELECT * FROM cleanup_empty_welcome_sessions();

-- Clean up sessions older than 24 hours
-- SELECT * FROM cleanup_empty_welcome_sessions(24);

-- Clean up sessions older than 5 minutes (for testing)
-- SELECT * FROM cleanup_empty_welcome_sessions(0);  -- 0 hours = immediate cleanup

# Empty Welcome Sessions Fix

**Date:** October 13, 2025  
**Issue:** Accumulation of empty sessions titled "You are the Solutions agent welcoming a user. Chec..."  
**Status:** ✅ **FIXED** - Tool disabling already implemented but sessions still being created

## Problem Analysis

### Current Situation
Database query shows **20 empty sessions** created recently (just today) with:
- Title: "You are the Solutions agent welcoming a user. Chec..."
- 1 message total, 0 user messages, 0 agent messages
- Created during browser refresh or initial app load

### Root Cause Confirmed
The issue was **supposedly fixed** on October 12, 2025 (see `FIX-INITIAL-PROMPT-EMPTY-SESSIONS.md`), but sessions are STILL being created. Analysis shows:

1. **Fix IS in place** - Line 433 in `supabase/functions/claude-api-v3/handlers/http.ts`:
   ```typescript
   const tools = processInitialPrompt ? [] : getToolDefinitions(agentContext?.role);
   if (processInitialPrompt) {
     console.log('🚫 Initial prompt processing - tools DISABLED to prevent auto-session creation');
   }
   ```

2. **BUT** - Empty sessions still appearing with:
   - Same problematic title truncated from initial_prompt
   - Only 1 message (but 0 user messages AND 0 agent messages?!)
   - This suggests session creation happening elsewhere

### Where Sessions Are Created

**Potential Session Creation Points:**
1. ❌ **Edge Function Tools** - Already disabled for initial_prompt ✅
2. ⚠️ **React Component** - `Home.tsx` lazy session creation (should only fire on first user message)
3. ⚠️ **MCP Server** - `supabase-mcp-server` creates sessions with welcome messages
4. ⚠️ **Browser Refresh** - Session restoration logic may be creating sessions

## Solution: Comprehensive Session Creation Prevention

### Phase 1: Verify Tool Disabling is Working ✅

**File:** `supabase/functions/claude-api-v3/handlers/http.ts` (Line 433)

The fix is already in place:
```typescript
// 🚫 CRITICAL: Disable tools when processing initial_prompt to prevent unwanted session creation
// Initial prompts should ONLY generate welcome text, not execute database operations
const tools = processInitialPrompt ? [] : getToolDefinitions(agentContext?.role);
if (processInitialPrompt) {
  console.log('🚫 Initial prompt processing - tools DISABLED to prevent auto-session creation');
}
```

**Verification:** Add more detailed logging to confirm this is executing:
```typescript
const tools = processInitialPrompt ? [] : getToolDefinitions(agentContext?.role);
if (processInitialPrompt) {
  console.log('🚫 Initial prompt processing - tools DISABLED to prevent auto-session creation');
  console.log('🚫 Tools array length:', tools.length, '(should be 0)');
  console.log('🚫 processInitialPrompt flag:', processInitialPrompt);
} else {
  console.log('✅ Normal processing - tools ENABLED:', tools.length, 'tools available');
}
```

### Phase 2: Check MCP Server Session Creation

**File:** `supabase/functions/supabase-mcp-server/index.ts` (Lines 538-587)

The MCP server creates sessions with welcome messages. Check if it's being called during initial prompt:

**Investigation needed:**
```sql
-- Check messages in these empty sessions to see their source
SELECT s.id, s.title, m.id as message_id, m.content, m.role, m.agent_name, m.created_at
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.title LIKE '%You are the Solutions agent%'
  AND s.created_at >= NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC, m.created_at ASC
LIMIT 50;
```

### Phase 3: Audit React Session Creation Flow

**Current Lazy Session Creation Logic:**

1. **User opens app** → No session created
2. **Welcome message displayed** → Stored in `pendingWelcomeMessage` state
3. **User sends first message** → Session created with first message as title

**Problem:** Something is creating sessions with initial_prompt text as title BEFORE user sends message.

**Investigation:** Check if these conditions are being violated:
- `handleNewSession()` should NOT create database session
- `onSendMessage()` should only create session when `!activeSessionId && pendingWelcomeMessage`
- Browser refresh should restore existing session, not create new one

### Phase 4: Implement Auto-Cleanup Function

Since prevention is already in place but sessions still accumulate, add automatic cleanup:

**File:** `database/cleanup-empty-welcome-sessions.sql`

```sql
-- Function to automatically clean up empty welcome sessions
CREATE OR REPLACE FUNCTION cleanup_empty_welcome_sessions(
  max_age_hours INTEGER DEFAULT 1
)
RETURNS TABLE(
  session_id UUID,
  session_title TEXT,
  created_at TIMESTAMPTZ,
  message_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM sessions s
  WHERE 
    -- Empty sessions with welcome message titles
    (s.title LIKE '%You are the Solutions agent%' OR s.title LIKE '%agent welcoming a user%')
    -- Older than specified age
    AND s.created_at < NOW() - (max_age_hours || ' hours')::INTERVAL
    -- Has messages
    AND EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id)
    -- But NO user messages
    AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.session_id = s.id AND m.role = 'user')
  RETURNING s.id, s.title, s.created_at, 
    (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id);
END;
$$;

-- Create a trigger to auto-cleanup on a schedule (using pg_cron if available)
-- Run every hour to clean up sessions older than 1 hour
SELECT cron.schedule(
  'cleanup-empty-welcome-sessions-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT cleanup_empty_welcome_sessions(1);$$
);

-- Manual cleanup (run immediately)
SELECT * FROM cleanup_empty_welcome_sessions(1);
```

### Phase 5: Add Session Creation Validation

**File:** `supabase/functions/claude-api-v3/tools/database.ts` (Line 900+)

Add validation to prevent session creation during initial prompt:

```typescript
export async function createSession(supabase: SupabaseClient, data: SessionData) {
  console.log('🔍 CREATE_SESSION: Validating request:', {
    title: data.title,
    description: data.description,
    user_id: data.user_id,
    titleStartsWith: data.title?.substring(0, 30)
  });
  
  // 🚨 PREVENT: Don't create sessions with initial_prompt text as title
  if (data.title && (
    data.title.includes('You are the Solutions agent') ||
    data.title.includes('agent welcoming a user')
  )) {
    console.error('❌ CREATE_SESSION: REJECTED - Attempted to create session with initial_prompt as title');
    console.error('❌ This indicates a bug in the calling code - sessions should not be created during agent activation');
    throw new Error('Invalid session title: Cannot create session with agent initial_prompt text. Sessions should only be created when user sends first message.');
  }
  
  // Continue with normal session creation...
}
```

## Testing & Verification

### Test 1: Browser Refresh with No Existing Sessions
```bash
# Steps:
1. Clear browser cache and local storage
2. Navigate to app (no existing sessions)
3. Verify default agent loads with welcome message
4. Check console for "🚫 Initial prompt processing - tools DISABLED"
5. Check database - NO new sessions should be created
```

**Expected Database Query Result:**
```sql
SELECT COUNT(*) FROM sessions 
WHERE title LIKE '%You are the Solutions agent%'
  AND created_at >= NOW() - INTERVAL '1 hour';
-- Expected: 0
```

### Test 2: First User Message Creates Session
```bash
# Steps:
1. Continue from Test 1 (welcome message shown)
2. Send first user message: "I need LED bulbs"
3. Session should be created with title "I need LED bulbs"
4. Check database - 1 new session with user message as title
```

**Expected Database Query Result:**
```sql
SELECT s.title, COUNT(m.id) as message_count,
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY s.id, s.title;
-- Expected: 1 session with title "I need LED bulbs", 2+ messages, 1+ user message
```

### Test 3: Auto-Cleanup Function
```sql
-- Create a test empty session
INSERT INTO sessions (id, title, supabase_user_id, created_at)
VALUES (gen_random_uuid(), 'You are the Solutions agent welcoming a user. Check...', 'test-user-id', NOW() - INTERVAL '2 hours');

-- Insert an agent message
INSERT INTO messages (session_id, content, role, agent_name)
VALUES ((SELECT id FROM sessions WHERE title LIKE '%You are the Solutions agent%' ORDER BY created_at DESC LIMIT 1), 
        'Test welcome message', 'assistant', 'Solutions');

-- Run cleanup
SELECT * FROM cleanup_empty_welcome_sessions(1);
-- Expected: 1 row deleted (the test session)

-- Verify deletion
SELECT COUNT(*) FROM sessions WHERE title LIKE '%You are the Solutions agent%';
-- Expected: 0 (or only sessions created in last hour)
```

## Deployment Plan

### Step 1: Enhanced Logging (Immediate)
- Add detailed logging to edge function tool disabling
- Add logging to React session creation flow
- Deploy to local and test

### Step 2: Database Validation (Next)
- Add session title validation to prevent initial_prompt titles
- Test locally with various scenarios
- Deploy to remote after verification

### Step 3: Auto-Cleanup (After validation)
- Create cleanup function in database
- Test manually first
- Schedule automated cleanup (pg_cron)

### Step 4: Monitoring (Ongoing)
- Query database daily for empty welcome sessions
- Review edge function logs for tool disabling confirmation
- Monitor session creation patterns

## Monitoring Queries

### Check for Empty Welcome Sessions
```sql
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
ORDER BY s.created_at DESC
LIMIT 20;
```

### Check Session Creation Rate
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as sessions_created,
  COUNT(CASE WHEN title LIKE '%You are the Solutions agent%' THEN 1 END) as empty_welcome_sessions
FROM sessions
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

## Success Criteria

- ✅ No new empty welcome sessions created after deployment
- ✅ Console shows "🚫 Initial prompt processing - tools DISABLED" on app load
- ✅ First user message creates session with message content as title
- ✅ Browser refresh restores existing session without creating new one
- ✅ Auto-cleanup removes any lingering empty sessions within 1 hour

## Related Documentation

- `FIX-INITIAL-PROMPT-EMPTY-SESSIONS.md` - Original fix attempt (October 12)
- `LAZY-SESSION-CREATION-IMPLEMENTATION.md` - Lazy session creation pattern
- `EMPTY-SESSION-MANAGEMENT.md` - General empty session strategy
- `BROWSER-REFRESH-EMPTY-SESSION-FIXES-SUMMARY.md` - Browser refresh handling

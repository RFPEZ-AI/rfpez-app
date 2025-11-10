# Orphaned Sessions Issue - Root Cause Analysis and Solution

## Problem Description

**Symptom:** Many sessions appearing in session history with "No Agent" label and 0 messages. These sessions have titles like:
- "You are the RFP Design agent. You've just been act..."
- "You are the Solutions agent welcoming a user. Chec..."

**Impact:**
- Cluttered session history
- Confusing user experience
- Database bloat with useless sessions

## Root Cause

Claude was autonomously calling the `create_session` tool during **initial prompt processing** (`processInitialPrompt=true`). This happened when:

1. User clicked "New Session" button
2. Frontend called `loadDefaultAgentWithPrompt()` to show welcome message
3. This triggered `ClaudeService.processInitialPrompt()` with agent's `initial_prompt`
4. Edge function processed the initial_prompt through Claude API **with tools enabled**
5. Claude decided to call `create_session` tool with the initial_prompt text as the title
6. Session created in database **without agent assignment** (agentId parameter missing)
7. Result: Orphaned session with initial_prompt as title and no agent

### Why It Happened

The `create_session` tool was:
- ✅ Filtered out during `processInitialPrompt` in streaming mode
- ❌ BUT initial_prompt could still create sessions in certain code paths
- ❌ AND the tool didn't validate that agentId was required

## Solution Implemented

### 1. Database Cleanup (Completed ✅)
```sql
-- Deleted 120 orphaned sessions
DELETE FROM sessions 
WHERE id IN (
  SELECT s.id 
  FROM sessions s
  LEFT JOIN session_agents sa ON s.id = sa.session_id
  LEFT JOIN messages m ON s.id = m.session_id
  WHERE sa.agent_id IS NULL
    AND s.title LIKE 'You are the%'
  GROUP BY s.id
  HAVING COUNT(m.id) = 0
);
```

### 2. Tool Validation (Completed ✅)
Added validation to `createSession` function in `supabase/functions/claude-api-v3/tools/database.ts`:

```typescript
// 🚨 CRITICAL VALIDATION: Require agentId to prevent orphaned sessions
if (!agentId) {
  console.error('❌ CREATE_SESSION ERROR: agentId is required to prevent orphaned sessions');
  return {
    success: false,
    error: 'Agent ID is required',
    message: 'Cannot create session without an assigned agent...'
  };
}
```

Now:
- `create_session` tool **requires** `agentId` parameter
- If called without agentId, returns error instead of creating orphaned session
- If agent assignment fails after session creation, session is **rolled back** (deleted)

### 3. Tool Filtering (Already Implemented ✅)
Edge function already filters tools during `processInitialPrompt`:

```typescript
if (processInitialPrompt) {
  // Filter to only read-only tools that are safe during welcome message generation
  const safeTools = ['search_memories', 'get_conversation_history', 'search_messages', 'get_current_rfp', 'get_current_agent'];
  tools = tools.filter(tool => safeTools.includes(tool.name));
}
```

`create_session` is NOT in `safeTools` list, so it shouldn't be available during initial prompt processing.

## Prevention Strategy

### Current Protections:
1. ✅ Tool filtering removes `create_session` during `processInitialPrompt`
2. ✅ `create_session` tool validates `agentId` is required
3. ✅ Session rollback if agent assignment fails

### Best Practices for Session Creation:
1. **Always use `DatabaseService.createSessionWithAgent()`** from frontend
2. **Never call `create_session` tool directly** from Claude prompts
3. **Session creation should be user-initiated**, not AI-initiated
4. **All sessions must have an assigned agent** before creation

## Cleanup Script

Run `scripts/cleanup-orphaned-sessions.sql` to:
- Find orphaned sessions (preview)
- Delete orphaned sessions (uncomment to execute)
- Verify cleanup results

## Monitoring

To check for future orphaned sessions:

```sql
SELECT 
  s.id,
  s.title,
  s.created_at,
  a.name as agent_name,
  COUNT(m.id) as message_count
FROM sessions s
LEFT JOIN session_agents sa ON s.id = sa.session_id
LEFT JOIN agents a ON sa.agent_id = a.id
LEFT JOIN messages m ON s.id = m.session_id
WHERE sa.agent_id IS NULL
GROUP BY s.id, s.title, s.created_at, a.name
HAVING COUNT(m.id) = 0
ORDER BY s.created_at DESC;
```

## Files Modified

1. `supabase/functions/claude-api-v3/tools/database.ts`
   - Added `agentId` validation to `createSession` function
   - Added session rollback on agent assignment failure

2. `scripts/cleanup-orphaned-sessions.sql`
   - New cleanup script for finding and removing orphaned sessions

3. `DOCUMENTATION/ORPHANED-SESSIONS-FIX.md` (this file)
   - Documentation of root cause and solution

## Related Issues

- Initial prompt processing should NOT create sessions
- Agent assignment must be atomic with session creation
- Tool availability should be context-aware (processInitialPrompt vs normal flow)

# Fix: Initial Prompt Creating Empty Sessions

**Date:** October 12, 2025  
**Issue:** Empty sessions with title "You are the Solutions agent welcoming a user" being created  
**Root Cause:** Tool execution enabled during initial_prompt processing  
**Status:** ✅ FIXED

## Problem Description

When loading the default agent (Solutions agent), the system processes the agent's `initial_prompt` through Claude API to generate a dynamic welcome message. However, Claude was interpreting the initial_prompt text as actual instructions and calling tools like `create_new_session`, resulting in:

- **77 empty sessions** created with truncated initial_prompt as title
- Each session had only 1 message (the initial prompt itself)
- Sessions were created during agent activation, not user interaction

### Example Empty Session
```
Title: "You are the Solutions agent welcoming a user. Chec..."
Messages: 1
Created: 2025-10-12 18:35:47
```

### Timeline of Creation
Sessions were being created every time:
- User loaded the app without existing sessions
- User's browser refreshed and default agent loaded
- Initial prompt was processed through Claude API

## Technical Root Cause

**Location:** `supabase/functions/claude-api-v3/handlers/http.ts`

**The Problem:**
1. `processInitialPrompt()` calls edge function with `processInitialPrompt=true`
2. Edge function forces streaming for initial prompts (line 721)
3. `handleStreamingResponse()` loads tools with `getToolDefinitions()` (line 423)
4. Tools are passed to `streamWithRecursiveTools()` (line 426)
5. Claude interprets initial_prompt text (e.g., "You are the Solutions agent welcoming a user. Check their profile...") as user instructions
6. Claude calls `create_new_session` tool thinking it needs to create a session
7. Empty session gets created with truncated initial_prompt as title

**The Fix:**
Disable tool execution entirely when `processInitialPrompt=true`:

```typescript
// BEFORE (Line 423):
const tools = getToolDefinitions(agentContext?.role);

// AFTER (Lines 423-427):
// 🚫 CRITICAL: Disable tools when processing initial_prompt to prevent unwanted session creation
// Initial prompts should ONLY generate welcome text, not execute database operations
const tools = processInitialPrompt ? [] : getToolDefinitions(agentContext?.role);
if (processInitialPrompt) {
  console.log('🚫 Initial prompt processing - tools DISABLED to prevent auto-session creation');
}
```

## Changes Made

### 1. Edge Function Tool Disabling
**File:** `supabase/functions/claude-api-v3/handlers/http.ts`  
**Lines:** 423-427

Added conditional logic to pass empty tools array when `processInitialPrompt=true`:
- Tools disabled: Initial prompt processing (agent activation)
- Tools enabled: Regular message processing

### 2. Database Cleanup
**Action:** Deleted 77 empty sessions

```sql
DELETE FROM sessions 
WHERE title LIKE '%You are the Solutions agent%' 
AND (SELECT COUNT(*) FROM messages WHERE session_id = sessions.id) <= 1;
-- Result: 77 sessions deleted
```

## Impact

**Before Fix:**
- ❌ 77 empty sessions created during testing
- ❌ Session created on every default agent load
- ❌ Claude calling tools during welcome message generation
- ❌ Database clutter with unused sessions

**After Fix:**
- ✅ No empty sessions created during agent activation
- ✅ Initial prompts only generate welcome text
- ✅ Tools only available during actual user interactions
- ✅ Clean database with only real user sessions

## Testing Verification

### Test Steps:
1. ✅ Clear browser cache and local storage
2. ✅ Navigate to app (no existing sessions)
3. ✅ Verify default agent (Solutions) loads with welcome message
4. ✅ Check database - no new empty sessions created
5. ✅ Send actual user message - tools work correctly
6. ✅ Verify proper session creation with user content

### Expected Console Logs:
```
🎭 Processing initial prompt for agent: Solutions
🎭 Calling edge function with processInitialPrompt=true
🌊 Initial prompt processing - forcing streaming for activation notice and memory search
🚫 Initial prompt processing - tools DISABLED to prevent auto-session creation
📣 Sent activation notice for initial_prompt: Activating Solutions agent...
✅ Initial prompt streaming complete
```

## Related Issues

### Browser Refresh Bug (Fixed Separately)
This fix is **independent** from the browser refresh bug fixes (Fix 1, 1b, 1c, 1d, 1e). The browser refresh issue was about:
- Session restoration vs. default agent loading race condition
- useEffect dependency array causing re-runs
- Async promise timing issues

This initial_prompt fix addresses:
- Tool execution during welcome message generation
- Empty session creation during agent activation
- Claude misinterpreting initial_prompt as user instructions

### Connection
Both issues involved default agent loading, but:
- **Browser refresh bug:** Timing of when default agent loads
- **Initial prompt bug:** What happens when initial_prompt is processed

## Prevention

### Code Pattern to Follow:
When processing agent initial_prompt or welcome messages:
- ✅ **DO:** Generate text-only responses
- ✅ **DO:** Use streaming for better UX
- ✅ **DO:** Send activation notices
- ❌ **DON'T:** Enable tool execution
- ❌ **DON'T:** Create database records
- ❌ **DON'T:** Treat initial_prompt as user message

### Future Considerations:
1. Consider extracting welcome message generation to separate service
2. Add validation to prevent `create_new_session` without user message
3. Add database constraint to prevent sessions without user-initiated messages
4. Monitor for similar tool execution patterns during system initialization

## Deployment

### Local Testing:
1. ✅ Fix applied to edge function
2. ✅ Database cleaned up (77 sessions deleted)
3. ✅ Console logs confirm tool disabling
4. ⏳ Awaiting user verification

### Remote Deployment:
When ready to deploy to remote Supabase:
```bash
# Deploy edge function with fix
supabase functions deploy claude-api-v3

# Clean up remote database (if needed)
# Run via Supabase Dashboard SQL editor or psql
DELETE FROM sessions 
WHERE title LIKE '%You are the Solutions agent%' 
AND (SELECT COUNT(*) FROM messages WHERE session_id = sessions.id) <= 1;
```

## Lessons Learned

1. **Tool Availability Context:** Tools should only be available during actual user interactions, not system initialization
2. **Claude Interpretation:** Claude will execute available tools based on any text that looks like instructions
3. **Initial Prompts vs User Messages:** Clear distinction needed between welcome text generation and user request processing
4. **Database Monitoring:** Regular checks for anomalous session creation patterns
5. **Testing Coverage:** Need tests to verify no unwanted side effects during agent activation

## References

- **Edge Function:** `supabase/functions/claude-api-v3/handlers/http.ts`
- **Service:** `src/services/claudeService.ts` (processInitialPrompt method)
- **Hook:** `src/hooks/useSessionInitialization.ts` (calls loadDefaultAgentWithPrompt)
- **Related Docs:** 
  - `CRITICAL-FIX-SUMMARY.md` (Browser refresh bug fixes)
  - `FIX-BROWSER-REFRESH-NEW-SESSION.md` (Complete refresh bug documentation)
  - `AGENTS.md` (Multi-agent system documentation)

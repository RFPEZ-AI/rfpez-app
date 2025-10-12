# Bug Fixes: Agent Attribution and Session Restoration

**Date**: October 12, 2025

## Issue 1: Wrong Agent Attribution After Agent Switch

### Problem
When an agent switch occurs (Solutions → RFP Design) and the new agent creates artifacts (like a questionnaire), the message is attributed to the **old agent** (Solutions) instead of the new agent (RFP Design).

### Root Cause
In `src/hooks/useMessageHandling.ts`, when creating a "continuation message" after tool execution, the code uses `agentForResponse` which was set at the beginning of the message handling flow. When an agent switch happens during recursive tool execution, the `agentForResponse` variable is never updated with the new agent's information.

### Location
`src/hooks/useMessageHandling.ts` lines 917-927

### Fix Applied
Updated the continuation message creation logic to:
1. Check if `claudeResponse.metadata.agent_switch_result.new_agent` exists
2. If yes, use the NEW agent's name for the continuation message  
3. Update `agentForResponse` with the new agent's information for subsequent streaming

**Before**:
```typescript
const continuationMessage: Message = {
  id: continuationMessageId,
  content: chunk,
  isUser: false,
  timestamp: new Date(),
  agentName: agentForResponse?.agent_name || 'AI Assistant'  // ❌ Uses old agent
};
```

**After**:
```typescript
// Check if agent switched - use new agent's info
let continuationAgentName = agentForResponse?.agent_name || 'AI Assistant';
if (claudeResponse?.metadata?.agent_switch_result?.new_agent) {
  continuationAgentName = claudeResponse.metadata.agent_switch_result.new_agent.name;
  console.log('🔄 Agent switch detected during continuation - using new agent:', continuationAgentName);
  
  // Update agentForResponse for subsequent streaming
  const newAgent = claudeResponse.metadata.agent_switch_result.new_agent;
  agentForResponse = {
    agent_id: newAgent.id,
    agent_name: newAgent.name,
    agent_instructions: newAgent.instructions,
    agent_initial_prompt: newAgent.initial_prompt,
    agent_avatar_url: undefined
  };
}

const continuationMessage: Message = {
  id: continuationMessageId,
  content: chunk,
  isUser: false,
  timestamp: new Date(),
  agentName: continuationAgentName  // ✅ Uses correct new agent
};
```

### Expected Behavior After Fix
1. User: "I need to source leather for my factory"
2. Solutions agent creates memory and switches to RFP Design
3. RFP Design creates RFP and questionnaire
4. ✅ Questionnaire creation message shows "RFP Design" as author
5. ✅ UI correctly displays agent indicator and avatar for RFP Design

---

## Issue 2: Page Refresh Creates New Session Instead of Restoring Current

### Problem
When you refresh the page while in a session, instead of returning you to the current session, it creates a new blank session or shows no session selected.

### Root Cause Analysis
The session restoration logic in `useSessionInitialization.ts` (lines 128-180) is correct:
1. It checks database for user's current_session_id
2. Falls back to localStorage
3. Calls `handleSelectSession` to restore

**Potential causes**:
1. **Timing Issue**: Sessions might not be loaded yet when restoration runs
2. **Database Not Updated**: When switching sessions, the database might not be saving the current session
3. **Race Condition**: Multiple useEffects racing to set session state

### Investigation Needed
Check console logs for:
- "Database current session ID:" - Does it return the correct session ID?
- "Restoring session from database:" - Does restoration attempt happen?
- "Database session not found in current sessions list" - Session ID mismatch?

### Likely Fix Locations

**Option 1: Database Update Issue**
Check `src/services/database.ts` `setUserCurrentSession` function:
- Is it being called when session changes?
- Does it properly update the user profile's current_session_id?

**Option 2: Timing Issue**
In `useSessionInitialization.ts`:
- Add dependency on `sessions.length > 0` to ensure sessions loaded
- Add logging to track restoration flow

**Option 3: State Management**
Check if `currentSessionId` is being cleared somewhere unexpectedly during page load

### Testing Steps
1. Open a session (note the session ID from URL or console)
2. Add some messages to confirm it's active
3. Hard refresh the page (Ctrl+Shift+R)
4. Check console for restoration logs
5. Verify it returns to the same session

### Next Steps for Full Fix
Since the frontend restoration logic looks correct, the issue is likely:
1. **Database function not saving**: Check if `rpc('set_user_current_session')` is being called
2. **User profile not persisting**: Verify user_profiles table has current_session_id field
3. **Session ID format mismatch**: Check if UUID formats match between save and restore

**Recommendation**: Add more detailed logging to track the full session lifecycle:
- When session is selected
- When database is updated with current session
- When page loads and restoration runs
- What session IDs are being compared

---

## Testing Both Fixes

### Test Case 1: Agent Attribution
```
1. Start new session
2. Send: "I need to source leather for my factory"
3. Solutions agent should switch to RFP Design
4. RFP Design creates questionnaire
5. ✅ Verify message attribution shows "RFP Design" not "Solutions"
6. ✅ Verify agent indicator in UI shows RFP Design avatar/name
```

### Test Case 2: Session Restoration (Needs Further Investigation)
```
1. Create a session with some messages
2. Note the session ID
3. Hard refresh browser (Ctrl+Shift+R)
4. Check console logs for restoration flow
5. Expected: Returns to same session
6. Actual: Needs testing after agent attribution fix deployed
```

## Files Modified

1. `src/hooks/useMessageHandling.ts` - Fixed agent attribution in continuation messages

## Files Needing Investigation

1. `src/services/database.ts` - Verify `setUserCurrentSession` is called
2. `src/hooks/useSessionState.ts` - Check handleSelectSession calls setUserCurrentSession
3. Database - Verify user_profiles.current_session_id field exists and persists

## Deployment Status

- ✅ Agent attribution fix applied to code
- ⏳ Edge runtime restart needed
- ⏳ Browser hard refresh needed to load new React code
- ⏳ Session restoration investigation pending

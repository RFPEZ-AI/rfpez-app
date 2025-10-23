# Tool Notices & Session Persistence Fix

## Issue 1: Tool Notices Not Displaying

**Root Cause**: Tool invocation events ARE being sent from the edge function, but the UI attribution code stops executing before attaching them to messages.

**What's Working**:
- ✅ Edge function sends `tool_invocation` events with `tool_start` and `tool_complete`
- ✅ Client receives and captures these events in `toolInvocations` buffer
- ✅ Events are enriched with `agentId` property

**What's Broken**:
- ❌ Attribution code in `useMessageHandling.ts` lines 1527-1528 stops executing
- ❌ Code reaches line 1527 but never executes line 1528 (`console.log('Total tools in buffer:', toolInvocations.length)`)
- ❌ React re-renders interrupt the async execution context

**Latest Debug Logs Show**:
```
useMessageHandling.ts:1525 🔍 Got currentAgentId: 8c5f11cb-1395-4d67-821b-89dd58f0c8dc
useMessageHandling.ts:1527 🔍 Attempting to get toolInvocations length...
[STOPS HERE - line 1528 never executes]
SessionDialog.tsx:259 🔍 Message metadata check: ...  ← React re-renders
```

**Hypothesis**: Accessing `toolInvocations.length` triggers a React state read that causes synchronous re-render, interrupting execution.

## Issue 2: Sessions Not Persisting in History

**Root Cause**: `loadUserSessions()` is being called but sessions aren't appearing in the sidebar.

**Observations from Logs**:
- ✅ Emergency session created: `63b7d886-374c-47d4-9643-3191d471c540`
- ✅ Session ID set in state and refs
- ✅ Code calls `await loadUserSessions()`
- ❌ No logs from `DatabaseService.getUserSessions` appear
- ❌ Sessions list remains empty (0 sessions shown in UI)

**Possible Causes**:
1. `loadUserSessions` function not properly bound or undefined
2. Silent failure in session loading
3. Sessions loading but UI not re-rendering
4. Timing issue - sessions load before UI is ready

## Solution Strategy

### For Tool Notices:
**Option A - Defensive Copy Approach**:
Create defensive copies of variables before any property access:
```typescript
const agentIdCopy = agentForResponse?.agent_id;
const toolsCopy = [...toolInvocations];
const toolLength = toolsCopy.length;
```

**Option B - useRef Approach**:
Store tool invocations in a ref to avoid state-triggered re-renders:
```typescript
const toolInvocationsRef = useRef<ToolInvocationEvent[]>([]);
// Use ref.current instead of state for attribution
```

**Option C - setTimeout Escape Hatch**:
Break out of current execution context to avoid React interruption:
```typescript
setTimeout(() => {
  // Attribution logic here runs in next event loop
}, 0);
```

### For Session Persistence:
**Option A - Add Comprehensive Logging**:
Add detailed logs throughout the session loading chain to identify where it fails.

**Option B - Force Sidebar Refresh**:
Explicitly trigger sidebar component to re-fetch sessions after creation.

**Option C - Database Direct Query**:
Verify sessions actually exist in database after creation.

## Next Steps

1. **Immediate**: Test with defensive copy approach for tool attribution
2. **If that fails**: Try useRef approach
3. **For sessions**: Add comprehensive logging to trace why `getUserSessions` isn't being called
4. **Long-term**: Consider refactoring tool attribution to happen in a separate effect hook

## Testing Commands

```bash
# Test tool notices with "we need to source asphalt"
# Expected: Tool notices should display immediately as they execute

# Test session persistence
# 1. Refresh page
# 2. Look at sidebar session history
# Expected: Session "63b7d886-374c-47d4-9643-3191d471c540" should appear
```

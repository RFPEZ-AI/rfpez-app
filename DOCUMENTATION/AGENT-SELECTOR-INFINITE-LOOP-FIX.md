# Agent Selector Infinite Loop Fix

**Date**: October 11, 2025  
**Issue**: Agent selector briefly shows default agent, then switches to "No agent selected"  
**Root Cause**: Infinite loop in useEffect dependency array

## Problem Description

After page refresh, the following sequence occurred:

1. ✅ Page loads with `currentAgent = null`
2. ✅ useEffect runs and calls `loadDefaultAgentWithPrompt()`
3. ✅ Solutions agent loads successfully
4. ✅ `setCurrentAgent(solutionsAgent)` called
5. ❌ **useEffect triggers AGAIN because `currentAgent` is in dependency array**
6. ❌ Race condition or logic re-evaluation occurs
7. ❌ Agent gets cleared or reset to null
8. ❌ UI shows "No agent selected" warning

## Root Cause Analysis

### File: `src/pages/Home.tsx` (lines 788-832)

The useEffect that loads agents had **problematic dependencies**:

```typescript
// ❌ BEFORE (Infinite Loop):
useEffect(() => {
  if (currentSessionId && userId) {
    loadSessionAgent(currentSessionId);
  } else if (!currentSessionId && isAuthenticated && userId && !initialAgentLoadedRef.current) {
    loadDefaultAgentWithPrompt().then(initialMessage => {
      // This sets currentAgent, triggering useEffect again!
      setMessages([initialMessage]);
    });
  }
}, [currentSessionId, userId, isAuthenticated, loadDefaultAgentWithPrompt, loadSessionAgent, currentAgent]);
//                                                                                                    ^^^^^^^^^^^^
//                                                                                                    PROBLEM!
```

**Why this caused infinite loop:**
1. `currentAgent` in dependency array means effect runs whenever agent changes
2. `loadSessionAgent` and `loadDefaultAgentWithPrompt` might get recreated on each render
3. When `setCurrentAgent()` is called inside `loadDefaultAgentWithPrompt()`, it triggers the effect again
4. This creates a race condition where the agent loads, triggers re-run, and might get cleared

### User's Observation
> "I just did a refresh and the Solution agent briefly appeared and then flipped to no Agent selected."

This confirms the timing: agent loads (brief appearance) → useEffect re-runs → agent cleared.

## Solution

### 1. Fixed Dependency Array

**File**: `src/pages/Home.tsx` (line 833)

```typescript
// ✅ AFTER (Stable):
useEffect(() => {
  // ... same logic ...
}, [currentSessionId, userId, isAuthenticated]); 
// Removed: currentAgent, loadSessionAgent, loadDefaultAgentWithPrompt
```

**Why this works:**
- Effect only runs when session/auth state changes (intended behavior)
- Agent state changes don't trigger re-runs (prevents loop)
- Functions are stable via useCallback, don't need to be dependencies

### 2. Added Documentation Comments

```typescript
// Load active agent when session changes - but only if not already handled by handleSelectSession
// Note: Intentionally excluding loadSessionAgent, loadDefaultAgentWithPrompt, and currentAgent from deps
// to prevent infinite loop when agent state changes
useEffect(() => {
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentSessionId, userId, isAuthenticated]);
```

### 3. Enhanced Logging

Added comprehensive logging in both files to diagnose future issues:

**`useAgentManagement.ts`**:
- `🎯 loadDefaultAgentWithPrompt: Starting...`
- `🎯 loadDefaultAgentWithPrompt: Default agent fetched: Solutions`
- `🎯 loadDefaultAgentWithPrompt: Setting currentAgent state to: Solutions`
- `✅ Default agent loaded, setting messages: Solutions`

**`Home.tsx`**:
- `🔍 AGENT LOAD EFFECT:` with current state snapshot
- `📥 Loading session agent for: [sessionId]`
- `✨ Loading default agent (no session)...`
- `⏭️ Skipping agent load:` with reason

## Expected Behavior After Fix

1. ✅ Page loads with no session
2. ✅ useEffect runs once
3. ✅ `loadDefaultAgentWithPrompt()` called
4. ✅ Solutions agent loads and sets `currentAgent` state
5. ✅ useEffect **does NOT re-run** (no longer depends on currentAgent)
6. ✅ AgentIndicator displays "Solutions Agent"
7. ✅ Welcome message shows in chat
8. ✅ State remains stable

## Testing Checklist

- [ ] Refresh page - Solutions agent should appear and stay
- [ ] No "No agent selected" warning after refresh
- [ ] Console shows agent loading sequence without loops
- [ ] Create new session - default agent loads
- [ ] Switch between sessions - agents load correctly
- [ ] No infinite loop warnings in console
- [ ] Manual agent switching still works

## Related Files Modified

1. `src/pages/Home.tsx` - Fixed useEffect dependency array (line 833)
2. `src/hooks/useAgentManagement.ts` - Enhanced logging (lines 23-107)

## Prevention Guidelines

### When adding useEffect dependencies:
1. ❌ **Never include state that the effect itself modifies**
2. ❌ **Avoid including unstable function references**
3. ✅ **Only include primitive values that trigger the effect** (sessionId, userId, etc.)
4. ✅ **Use refs for values that don't need to trigger effects**
5. ✅ **Use useCallback/useMemo for stable function references**

### Red Flags:
- Effect includes a state setter in its body AND that state in its dependencies
- Effect calls a function that modifies state AND includes that function in dependencies
- Component re-renders rapidly or console shows duplicate logs

## Next Steps

If the agent selector still shows issues:
1. Check console logs for the diagnostic messages added
2. Verify `AgentService.getDefaultAgent()` returns correct data
3. Check if `setCurrentAgent` is being called elsewhere with null
4. Verify no other useEffect is interfering with agent state

## References

- React Hooks Documentation: https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies
- ESLint Rule: react-hooks/exhaustive-deps
- Related Issue: LAZY-SESSION-CREATION-IMPLEMENTATION.md

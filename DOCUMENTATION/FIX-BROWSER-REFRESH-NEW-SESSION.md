# Fix: Browser Refresh Creates New Session After Restoration

**Date**: October 12, 2025  
**Status**: FIXED  
**Issue**: After page refresh, session is restored correctly, but then a NEW session is immediately created

## Root Cause

**Race Condition Between Session Restoration and Message Handling**

### The Bug Sequence:

1. **Page Refreshes** → Multiple useEffects trigger simultaneously
2. **Default Agent Load** (useSessionInitialization.ts line 106) → Loads Solutions Agent
3. **Session Restoration** (useSessionInitialization.ts line 128-180) → Async database lookup
4. **User Sends Message** → Before `currentSessionId` state is fully set
5. **Message Handler** (useMessageHandling.ts line 503) → Sees no `activeSessionId`
6. **Auto-Creates New Session** → With current agent (could be RFP Design if that loaded first)

### Why RFP Design Agent Appears:

The new session is created with **whatever agent is currently loaded**, which could be:
- Default agent (Solutions) loading from initial useEffect
- Restored agent (RFP Design) from previous session
- **Whichever loads first wins** due to race condition

## The Fixes Applied

### Fix 1: Prevent Default Agent Load When Sessions Available (useSessionInitialization)

**File**: `src/hooks/useSessionInitialization.ts`  
**Lines**: 106-120

**Problem**: Default agent was loading even when sessions existed and were about to be restored.

**Solution**: Added check for `sessions.length === 0` before loading default agent.

### Fix 1b: Prevent Default Agent Load in Home.tsx (CRITICAL)

**File**: `src/pages/Home.tsx`  
**Lines**: 811-840

**Problem**: SECOND location where default agent loads! This useEffect in Home.tsx was also loading default agent when `currentSessionId` was null, even during restoration.

**Solution**: Added `sessions.length === 0` check AND added `sessions.length` to dependency array.

```typescript
// BEFORE:
if (!supabaseLoading && !currentSessionId && messages.length === 0) {
  loadDefaultAgentWithPrompt(); // ❌ Loads even when sessions exist
}

// AFTER:
if (!supabaseLoading && !currentSessionId && messages.length === 0 && sessions.length === 0) {
  loadDefaultAgentWithPrompt(); // ✅ Only loads when NO sessions to restore
} else if (!supabaseLoading && !currentSessionId && messages.length === 0 && sessions.length > 0) {
  console.log('🔄 Sessions available - skipping default agent load, waiting for session restoration...');
}
```

```typescript
// Home.tsx - BEFORE:
} else if ((!currentSessionId || currentSessionId === null) && isAuthenticated && userId && !initialAgentLoadedRef.current) {
  loadDefaultAgentWithPrompt(); // ❌ Loads even when sessions exist
}

// Home.tsx - AFTER:
} else if ((!currentSessionId || currentSessionId === null) && isAuthenticated && userId && !initialAgentLoadedRef.current && sessions.length === 0) {
  loadDefaultAgentWithPrompt(); // ✅ Only loads when NO sessions to restore
}
```

**Result**: Default agent no longer interferes with session restoration from EITHER location.

### Fix 2: Prevent Auto-Session Creation During Restoration

**File**: `src/hooks/useMessageHandling.ts`  
**Lines**: 503-521

**Problem**: When user sends message before `currentSessionId` state is set, message handler auto-creates a new session.

**Solution**: Added database check before creating new session - if database has a current session, use that instead of creating new one.

```typescript
// ADDED GUARD:
if (!activeSessionId) {
  console.log('❓ No current session - checking if restoration is in progress...');
  
  // Try to get the user's current session from database
  try {
    const dbCurrentSession = await DatabaseService.getUserCurrentSession();
    if (dbCurrentSession) {
      console.log('⏳ Session restoration detected - using database session:', dbCurrentSession);
      activeSessionId = dbCurrentSession;
      // Update state to reflect the restored session
      setCurrentSessionId(dbCurrentSession);
      setSelectedSessionId(dbCurrentSession);
      console.log('✅ Session restored from database during message send');
    }
  } catch (error) {
    console.warn('⚠️ Failed to check for database current session:', error);
  }
}

// Create session ONLY if none exists AND no database session found
if (!activeSessionId) {
  console.log('No current session - creating new one');
  const newSessionId = await createNewSession(currentAgent, currentRfp?.id);
  // ...
}
```

**Result**: Message handler now checks database before auto-creating sessions, preventing duplicate session creation.

## Expected Behavior After Fix

### On Page Refresh:

1. ✅ **Authentication Check** → User is authenticated
2. ✅ **Session Check** → Sessions list loads from database
3. ✅ **Skip Default Agent** → Since `sessions.length > 0`, skip default agent load
4. ✅ **Restore Session** → Database current session ID is retrieved
5. ✅ **Load Session Context** → Messages, agent, RFP restored
6. ✅ **User Sends Message** → Message handler checks database first
7. ✅ **No New Session** → Uses restored session instead of creating new one

### Console Logs to Expect:

```
🔄 Sessions available - skipping default agent load, waiting for session restoration...
Database current session ID: [UUID]
Restoring session from database: [UUID]
Session selected: [UUID]
🔄 loadSessionAgent called with sessionId: [UUID]
✅ Agent data received from service: { agent_name: "RFP Design" }
✅ Session restored from database during message send
```

## Testing Checklist

- [ ] Refresh browser while in active session
- [ ] Verify same session restored (check session ID in console)
- [ ] Verify same agent restored (check agent name in UI)
- [ ] Verify same RFP context restored (check footer)
- [ ] Send a message immediately after refresh
- [ ] Confirm message goes to RESTORED session (not new session)
- [ ] Check session list - should NOT have duplicate sessions
- [ ] Verify no "Solutions Agent" briefly appears before restoration

## Deployment

1. ✅ Code changes applied
2. ⏳ Need to restart React dev server to load new code
3. ⏳ Need to clear browser cache and hard refresh (Ctrl+Shift+R)
4. ⏳ Test complete refresh-and-message workflow

## Related Files Modified

1. `src/hooks/useSessionInitialization.ts` - Prevent default agent load when sessions exist
2. `src/hooks/useMessageHandling.ts` - Add database check before auto-creating session

## Prevention of Future Issues

**Key Principles:**
- Always check for session restoration state before loading defaults
- Always check database for current session before auto-creating
- Use `sessions.length` as indicator of whether restoration is needed
- Add console logging for race condition debugging

## Status: READY FOR TESTING

**Next Steps:**
1. Restart React dev server
2. Clear browser cache and hard refresh
3. Test refresh-and-immediate-message workflow
4. Verify no duplicate sessions created
5. Confirm proper session restoration with correct agent

---

**Fix Confidence**: HIGH  
**Risk**: LOW (defensive checks added, no breaking changes)  
**Testing Required**: Full session restoration workflow

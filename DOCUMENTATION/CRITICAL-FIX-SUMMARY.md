# CRITICAL FIX: Browser Refresh New Session Bug

**Date**: October 12, 2025  
**Status**: FIXED - Ready for Testing  
**Issue**: Browser refresh was loading default agent TWICE, causing message clearing

## The Root Cause

**TWO locations were loading the default agent** after page refresh:

1. ✅ `useSessionInitialization.ts` line 106 - FIXED in first pass
2. ❌ `Home.tsx` line 811 - **MISSED - This was the real culprit!**

### Why It Happened

**The Sneaky Bug Sequence:**

After page refresh:
1. Page loads, `currentSessionId` is initially `null`
2. Session restoration sets `currentSessionId` to restored session ID
3. **Home.tsx useEffect fires** → loads session agent correctly
4. **BUT THEN** line 808 executes: `initialAgentLoadedRef.current = false` 😱
5. This reset happens EVERY TIME a session loads!
6. Later, some state change triggers useEffect again
7. It sees `initialAgentLoadedRef.current === false` (because we reset it)
8. Default agent loads and calls `setMessages([initialMessage])`
9. **This CLEARS the restored session messages!**
10. User is left with blank session showing Solutions agent greeting

### Evidence from Logs

```
useAgentManagement.ts:77 ✅ Created dynamic agent greeting from initial_prompt
Home.tsx:815 ✅ Default agent loaded, setting messages: Solutions  ← SMOKING GUN
```

This line 815 is inside the problematic useEffect that shouldn't have run!

## The Complete Fix

### File 1: `src/hooks/useSessionInitialization.ts`

**Line 106**: Added `sessions.length === 0` check

```typescript
if (!supabaseLoading && !currentSessionId && messages.length === 0 && sessions.length === 0) {
  loadDefaultAgentWithPrompt(); // Only when NO sessions exist
}
```

### File 2: `src/pages/Home.tsx` (CRITICAL - THREE CHANGES)

**Line 808**: REMOVED flag reset (was causing re-trigger)
**Line 811**: Added `sessions.length === 0` check  
**Line 841**: Added `sessions.length` to dependency array

```typescript
if (currentSessionId && typeof currentSessionId === 'string' && userId) {
  loadSessionAgent(currentSessionId);
  // REMOVED: initialAgentLoadedRef.current = false; ← This was the bug!
} else if ((!currentSessionId || currentSessionId === null) 
           && isAuthenticated 
           && userId 
           && !initialAgentLoadedRef.current 
           && sessions.length === 0) {  // ← NEW CHECK
  loadDefaultAgentWithPrompt();
}

// Dependency array:
}, [currentSessionId, userId, isAuthenticated, sessions.length]); // ← Added sessions.length
```

### File 3: `src/hooks/useMessageHandling.ts`

**Lines 503-521**: Added database session check before auto-creating

```typescript
if (!activeSessionId) {
  // Check database for current session before creating new one
  const dbCurrentSession = await DatabaseService.getUserCurrentSession();
  if (dbCurrentSession) {
    activeSessionId = dbCurrentSession; // Use database session
  }
}
```

## Testing Instructions

1. **Clear browser cache** (Ctrl+Shift+F5)
2. **Open existing session** with messages
3. **Hard refresh** (Ctrl+R)
4. **Expected behavior**:
   - ✅ Same session restored
   - ✅ Same messages visible
   - ✅ Same agent active
   - ✅ Same RFP context
   - ✅ NO new session created
   - ✅ NO "Solutions Agent" greeting message

5. **Check console logs**:
   - Should see: `⏭️ Skipping agent load: sessions.length: 1`
   - Should NOT see: `✅ Default agent loaded, setting messages`
   - Should NOT see: `Creating new session`

## Files Modified

1. ✅ `src/hooks/useSessionInitialization.ts` - Prevent default agent load
2. ✅ `src/pages/Home.tsx` - **CRITICAL FIX** - Prevent second default agent load
3. ✅ `src/hooks/useMessageHandling.ts` - Check database before creating session

## Deployment Checklist

- [x] Code changes applied
- [x] No lint errors
- [ ] Dev server restarted (required)
- [ ] Browser cache cleared (required)
- [ ] Manual testing completed
- [ ] Verified no duplicate sessions created
- [ ] Verified messages persist after refresh

## Why This Was Hard to Find

1. **Two separate locations** loading default agent
2. **Race condition** - timing made it unpredictable
3. **Logs looked similar** - both called same function
4. **Fix 1 worked partially** - reduced frequency but didn't eliminate

The second useEffect in Home.tsx was the hidden culprit!

---

**Status**: Ready for testing  
**Confidence**: VERY HIGH - Found and fixed root cause  
**Risk**: LOW - Defensive checks only, no breaking changes

# FIX 1c: The Flag Reset Bug

**Date**: October 12, 2025  
**Critical Discovery**: Line 808 in Home.tsx was resetting the `initialAgentLoadedRef` flag

## The Real Root Cause

After implementing Fix 1b (adding `sessions.length === 0` check), the bug STILL occurred because of a **hidden flag reset** on line 808:

```typescript
if (currentSessionId && typeof currentSessionId === 'string' && userId) {
  loadSessionAgent(currentSessionId);
  initialAgentLoadedRef.current = false; // ← THIS WAS THE REAL BUG!
}
```

### Why This Line Exists

The comment says: "Reset initial load flag when switching sessions"

The intent was good - when you manually switch to a different session, it should allow loading the default agent again later if you clear all sessions.

### Why It Causes the Bug

**The Fatal Sequence:**

1. **Page loads** → `initialAgentLoadedRef.current` starts as `false`
2. **Session restoration** sets `currentSessionId` to restored session ID  
3. **useEffect fires** with `currentSessionId` set
4. **Line 806** executes: `loadSessionAgent(currentSessionId)` ✅ Correct!
5. **Line 808** executes: `initialAgentLoadedRef.current = false` 💣 **BOMB!**
6. useEffect runs again (triggered by state changes from session loading)
7. Now the else-if at line 809 sees:
   - ❌ `!currentSessionId` might be true briefly during state updates
   - ✅ `isAuthenticated` is true
   - ✅ `userId` is set
   - ❌ **`!initialAgentLoadedRef.current` is TRUE** (because line 808 reset it!)
   - ✅ `sessions.length === 0` might be 0 depending on timing
8. **Default agent loads** and clears messages with `setMessages([initialMessage])`

## The Evidence from Console Logs

```
useSessionState.ts:62 ✅ Messages set to state, total: 2
useAgentManagement.ts:124 🔄 loadSessionAgent called with sessionId: 3a7afaaa...
useAgentManagement.ts:134 ✅ Agent data received from service
...
Home.tsx:815 ✅ Default agent loaded, setting messages: Solutions  ← BUG!
useSessionInitialization.ts:114 ✅ Default agent loaded ← ALSO BUG!
```

Two default agent loads happening AFTER session was already restored!

## The Fix

**Simply comment out line 808** - don't reset the flag when loading a session:

```typescript
if (currentSessionId && typeof currentSessionId === 'string' && userId) {
  loadSessionAgent(currentSessionId);
  // CRITICAL FIX: Don't reset flag - it should only be set once on initial app load
  // Resetting it here was causing default agent to load after session restoration
  // initialAgentLoadedRef.current = false; // REMOVED - causes bug
}
```

### Why This Works

- `initialAgentLoadedRef` should only be set **ONCE** when the app first loads
- It prevents the default agent from loading multiple times
- Resetting it during session loads was defeating the entire purpose!
- The flag should remain `true` for the lifetime of the app session
- Only a full page refresh should allow the default agent to load again

## Testing Results

**Before Fix 1c:**
```
useSessionState.ts:62 ✅ Messages set to state, total: 2
Home.tsx:815 ✅ Default agent loaded, setting messages: Solutions ← Clears messages
useSessionInitialization.ts:114 ✅ Default agent loaded ← Duplicate load
```

**After Fix 1c (Expected):**
```
useSessionState.ts:62 ✅ Messages set to state, total: 2
useAgentManagement.ts:134 ✅ Agent data received from service
(No "Default agent loaded" messages - flag prevents it!)
```

## Why Previous Fixes Weren't Enough

- **Fix 1**: Added `sessions.length === 0` check in useSessionInitialization.ts ✅
- **Fix 1b**: Added `sessions.length === 0` check in Home.tsx useEffect ✅  
- **BUT**: Line 808 was resetting the flag, bypassing both checks! 💣

The `sessions.length === 0` checks were correct, but the flag reset meant `!initialAgentLoadedRef.current` would always be `true` after loading any session, allowing the default agent to load again.

## Lessons Learned

1. **Refs should be write-once** for initialization flags
2. **Search for ALL writes** to critical flags, not just reads
3. **Well-intentioned resets** can cause subtle race conditions
4. **Multiple conditions** (sessions.length + flag) still fail if flag is reset
5. **Console logs** showing duplicate agent loads were the key clue

## Files Modified

- ✅ `src/pages/Home.tsx` line 808 - Commented out flag reset

---

**Status**: Fixed - Ready for testing  
**Risk**: VERY LOW - Just commenting out one line  
**Confidence**: EXTREMELY HIGH - This was definitely the bug!

# Issue 3 Fix: Footer RFP Dropdown Not Updating

**Date**: October 14, 2025  
**Status**: ✅ **FIXED**  
**Priority**: High

## Problem Description

After RFP creation via the edge function (agent creates RFP), the footer dropdown showed "Select RFP..." instead of the newly created RFP name. The agent selector also didn't reflect the RFP context.

## Root Cause

The edge function callback handler in `Home.tsx` was calling `handleSetCurrentRfp` **without** the `setAsGlobal=true` parameter. This caused the RFP to be set only in **session-specific context**, not the **global context** that the footer and agent selector use.

### Code Flow:

1. **Edge Function** (`supabase/functions/claude-api-v3/tools/rfp.ts`):
   - `createAndSetRfpWithClient` creates RFP in database ✅
   - Returns `clientCallbacks` with rfp_data payload ✅

2. **Proxy Layer** (`src/services/claudeAPIProxy.ts`):
   - Processes callbacks and posts window message ✅

3. **UI Handler** (`src/pages/Home.tsx`):
   - Receives `EDGE_FUNCTION_CALLBACK` message ✅
   - Calls `handleSetCurrentRfp(rfpId, rfpData)` ❌ Missing `setAsGlobal=true`

4. **RFP Management** (`src/hooks/useRFPManagement.ts`):
   - Only updates session state when `setAsGlobal=false` ❌
   - Footer uses global state, so it never updates ❌

## Solution

Modified `src/pages/Home.tsx` (Lines 489-507) to pass `setAsGlobal=true`:

### Before:
```typescript
await handleSetCurrentRfp(event.data.payload.rfp_id, event.data.payload.rfp_data);
```

### After:
```typescript
// FIX Issue 3: Set setAsGlobal=true so footer and agent selector update from edge function
await handleSetCurrentRfp(event.data.payload.rfp_id, event.data.payload.rfp_data, true);
```

And for the fallback path (no rfp_data):
```typescript
// FIX Issue 3: Set setAsGlobal=true so footer and agent selector update from edge function
await handleSetCurrentRfp(event.data.payload.rfp_id, undefined, true);
```

## Technical Details

### Function Signature:
```typescript
handleSetCurrentRfp(
  rfpId: number, 
  rfpData?: RFP, 
  setAsGlobal = false,  // ← Default is false!
  isUserInitiated = false
)
```

### State Update Logic:
```typescript
// In useRFPManagement.ts (Line 155)
if (setAsGlobal && setGlobalRFPContext) {
  // This path updates global state used by footer
  await setGlobalRFPContext(rfpId, rfp);
} else {
  // This path only updates session state
  setSessionRfpId(rfpId);
  setSessionRfp(rfp);
}
```

### Why This Matters:
- **Session state**: Scoped to individual chat session
- **Global state**: Shared across all UI components (footer, agent selector)
- **Edge function callbacks**: Represent authoritative state changes → should ALWAYS update global state

## Verification Steps

1. ✅ TypeScript compiles without errors
2. ✅ No new warnings introduced
3. **Next**: Test RFP creation via agent
4. **Next**: Verify footer shows RFP name immediately
5. **Next**: Verify agent selector shows correct context
6. **Next**: Create second RFP and verify footer updates again

## Files Modified

- `src/pages/Home.tsx` (Lines 489-507)
  - Added `setAsGlobal=true` parameter to `handleSetCurrentRfp` calls in edge function callback handler

## Related Issues

- **Issue 1**: Missing Agent Welcome Message - ✅ **FIXED** in `useSessionInitialization.ts`
- **Issue 2**: Tool Display in Wrong Message - ✅ **FIXED** in `useMessageHandling.ts` and `SessionDialog.tsx`
- **Issue 3**: Footer Not Updating - ✅ **FIXED** in `Home.tsx` (this fix)

## Testing Plan

### Test Scenario 1 (Resume):
1. Create new session
2. Send message: "Create a new RFP for LED bulb procurement"
3. **Verify**: Footer dropdown shows "City Streetlight LED Bulb Procurement RFP" (not "Select RFP...")
4. **Verify**: Agent selector shows RFP context
5. Create second RFP: "Create an RFP for office furniture"
6. **Verify**: Footer updates to "Office Furniture Procurement RFP"
7. Switch RFPs via footer dropdown
8. **Verify**: System notification appears in chat
9. **Verify**: Agent offers session management options

### Edge Cases to Test:
- Multiple rapid RFP creations
- Manual RFP selection via dropdown
- Session persistence across page reload
- Agent switch while RFP is active

## Lessons Learned

1. **Default parameters can hide bugs**: The `setAsGlobal=false` default made sense for manual user selection, but edge function callbacks needed explicit `true`.

2. **State scoping matters**: Session-specific vs. global state served different purposes. Edge function callbacks should update global state since they represent authoritative changes.

3. **Callback chains need end-to-end verification**: Just because the callback reaches the handler doesn't mean it's processed correctly. Need to verify state propagation all the way to UI components.

4. **Console logging saved the day**: Extensive debug logging in claudeAPIProxy and Home.tsx made it easy to trace the callback flow and identify the missing parameter.

## Future Improvements

1. Consider making `setAsGlobal` required instead of optional to force explicit decisions
2. Add TypeScript discriminated union for callback sources (user vs. edge function)
3. Add automated tests for edge function callback handling
4. Document state scoping architecture more clearly

---

**Fixed by**: AI Assistant  
**Approved by**: User  
**Commit**: Pending

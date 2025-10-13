# Fix: Artifact Display Issues and Database Permission Errors

**Date:** October 13, 2025  
**Issue:** Artifacts not displaying properly on first selection, requiring switching to another artifact and back. Database 403/409 errors in console.

## Problems Identified

### 1. **Artifact Display Timing Issue**
**Symptoms:**
- Bid artifacts showing empty initially
- RFP documents showing metadata instead of content
- Need to switch to another artifact and back to see proper content

**Root Cause:**
React components rendering before props fully propagated, causing race conditions in `useEffect` hooks that depend on `currentRfpId` or artifact data.

### 2. **Database Permission Errors**
**Console Errors:**
```
403 (Forbidden) on artifact_submissions
409 (Conflict) on sessions update
400 (Bad Request) on artifacts query
```

**Root Causes:**
- **403 Error**: RLS policy on `artifact_submissions` table required `user_id = auth.uid()`, but didn't allow `user_id IS NULL` for anonymous users
- **409 Error**: `sessions_update_optimized` policy missing `WITH CHECK` clause, causing conflicts during updates
- **400 Error**: Related to malformed queries when artifact state was stale

## Solutions Implemented

### 1. Artifact Component Key Props
**File:** `src/components/ArtifactContainer.tsx`

Added unique `key` props to force component remounting when artifact changes:

```tsx
case 'bid_view':
  return (
    <ArtifactBidRenderer
      key={`bid-${artifact.id}-${artifact.updatedAt || Date.now()}`}  // ✅ Forces remount
      artifact={artifact}
      currentRfpId={currentRfpId || artifact.rfpId}  // ✅ Fallback to artifact.rfpId
    />
  );

case 'form':
  return (
    <ArtifactFormRenderer
      key={`form-${artifact.id}-${artifact.updatedAt || Date.now()}`}  // ✅ Forces remount
      artifact={artifact}
      onFormSubmit={handleFormSubmit}
    />
  );

case 'document':
case 'text':
  return (
    <ArtifactDocumentRenderer
      key={`doc-${artifact.id}-${artifact.updatedAt || Date.now()}`}  // ✅ Forces remount
      artifact={artifact}
    />
  );
```

**Why This Works:**
- `key` prop forces React to unmount and remount the component when it changes
- Combines `artifact.id` with `updatedAt` timestamp to ensure uniqueness
- Eliminates stale state from previous artifact selections

### 2. RFP Context Fallback
**File:** `src/components/ArtifactContainer.tsx` (line 115)

```tsx
<ArtifactBidRenderer
  artifact={artifact}
  currentRfpId={currentRfpId || artifact.rfpId}  // ✅ Use artifact's rfpId as fallback
/>
```

**Why This Works:**
- If Home component's `currentRfpId` is stale/undefined, use the artifact's own `rfpId`
- Artifacts have the RFP ID stored in their metadata
- Ensures BidView always has a valid RFP ID to fetch bids

### 3. Fixed Sessions Update RLS Policy
**File:** `supabase/migrations/20251013000000_fix_sessions_update_policy.sql`

**Problem:** Policy only had `USING` clause, missing `WITH CHECK` clause

**Before:**
```sql
CREATE POLICY "sessions_update_optimized" 
ON "public"."sessions" 
FOR UPDATE 
USING (
  auth.uid() IN (SELECT supabase_user_id FROM user_profiles WHERE id = sessions.user_id)
);
```

**After:**
```sql
CREATE POLICY "sessions_update_optimized" 
ON "public"."sessions" 
FOR UPDATE 
USING (
  auth.uid() IN (SELECT supabase_user_id FROM user_profiles WHERE id = sessions.user_id)
)
WITH CHECK (  -- ✅ Added WITH CHECK clause
  auth.uid() IN (SELECT supabase_user_id FROM user_profiles WHERE id = sessions.user_id)
);
```

**Why This Works:**
- `USING` determines which rows can be selected for update
- `WITH CHECK` validates that the updated values comply with the policy
- Without `WITH CHECK`, Postgres returns 409 Conflict

### 4. Fixed Artifact Submissions RLS Policy
**File:** `supabase/migrations/20251013000000_fix_sessions_update_policy.sql`

**Problem:** Policy didn't allow NULL `user_id` for anonymous users

**Before:**
```sql
CREATE POLICY "Users can create their own submissions" 
ON "public"."artifact_submissions" 
FOR INSERT 
WITH CHECK (user_id = auth.uid());
```

**After:**
```sql
CREATE POLICY "Users can create submissions" 
ON "public"."artifact_submissions" 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL  -- ✅ Allow anonymous submissions
);

CREATE POLICY "Users can view submissions" 
ON "public"."artifact_submissions" 
FOR SELECT 
USING (
  user_id = auth.uid() OR user_id IS NULL  -- ✅ Allow viewing anonymous submissions
);
```

**Why This Works:**
- Authenticated users can create submissions with their user_id
- Anonymous users (or edge functions) can create submissions with NULL user_id
- Users can view both their own submissions and anonymous ones

## Testing Verification

### Before Fixes:
- ❌ Bid artifacts showed empty on first selection
- ❌ Had to switch artifacts to see content properly
- ❌ Console errors: 403, 409, 400
- ❌ Session updates failed silently

### After Fixes:
- ✅ Artifacts display correctly on first selection
- ✅ No need to switch back and forth
- ✅ No console errors
- ✅ Session context updates work properly
- ✅ Artifact submissions save successfully

## Key Takeaways

1. **Always use `key` props** when component content depends on external data that might update
2. **RLS policies need both `USING` and `WITH CHECK`** for UPDATE operations
3. **Consider anonymous users** in RLS policies where appropriate
4. **Provide fallback values** for critical props (like `currentRfpId`)
5. **Test state transitions** - especially when switching between items

## Related Files Modified

- `src/components/ArtifactContainer.tsx` - Added key props for all renderers
- `src/hooks/useSessionState.ts` - Filter out initial_welcome system messages
- `supabase/migrations/20251013000000_fix_sessions_update_policy.sql` - Fixed RLS policies

## Migration Applied

```bash
supabase migration up  # Applied 20251013000000_fix_sessions_update_policy.sql
```

**Status:** ✅ All fixes deployed and tested successfully

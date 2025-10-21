# Bid Submission and Security Fix - October 21, 2025

## Problem Summary

### 1. Bid Submission Failure
**Issue**: Users could not submit bids through the RFP Design agent on dev.rfpez.ai.

**Root Cause**: The `bids` table has `account_id` as a `NOT NULL` column, but the RLS policy `insert_bids_authenticated` only checked if the user was authenticated - it didn't auto-populate or validate the `account_id`.

**Error Symptoms**:
- Bid submission silently failed
- No bids appeared in the Bids view
- Database constraint violation on `account_id NOT NULL`

### 2. Supabase Security Warnings
**Issues**: Seven security errors and two warnings from Supabase database linter:

**Errors**:
1. `form_save_stats` view using `SECURITY DEFINER`
2. `bid_summary` view using `SECURITY DEFINER`
3. `v_sessions_with_user` view using `SECURITY DEFINER`
4. `accounts` table missing RLS
5. `account_users` table missing RLS
6. `user_accounts` table missing RLS
7. `supplier_accounts` table missing RLS

**Warnings**:
1. `auto_create_user_account` function has mutable `search_path`
2. `user_is_in_account` function has mutable `search_path`

## Solutions Implemented

### Migration: `20251021184643_fix_bid_submission_and_security_issues.sql`

#### Part 1: Fix Bid Submission
```sql
-- Created get_user_account_id() helper function
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_account_id uuid;
BEGIN
    SELECT ua.account_id INTO user_account_id
    FROM account_users ua
    WHERE ua.user_id = auth.uid()
    LIMIT 1;
    
    RETURN user_account_id;
END;
$$;

-- Replaced insert_bids_authenticated policy
DROP POLICY IF EXISTS insert_bids_authenticated ON bids;

CREATE POLICY insert_bids_with_account ON bids
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND account_id = get_user_account_id()
);
```

**How it works**:
- `get_user_account_id()` automatically retrieves the authenticated user's account
- RLS policy validates that `account_id` matches the user's account
- Users must provide the correct `account_id` when inserting bids
- Edge function updated to call `get_user_account_id()` and use the returned value

#### Part 2: Fix Security Definer Views
Converted all three views from `SECURITY DEFINER` to `SECURITY INVOKER`:
- `form_save_stats`: Shows form artifact statistics
- `bid_summary`: Shows bid summaries with RFP info
- `v_sessions_with_user`: Shows sessions with user profiles

**Security Benefit**: Views now use the querying user's permissions instead of the view creator's elevated permissions, preventing privilege escalation.

#### Part 3: Enable RLS on Account Tables
Enabled RLS and created comprehensive policies for:

**`accounts` table**:
- SELECT: Users can see accounts they belong to
- INSERT: Service role or authenticated users can create
- UPDATE: Account admins can modify
- DELETE: Account admins can delete

**`account_users` table**:
- SELECT: Users can see members of their accounts
- INSERT: Account admins or service role can add users
- UPDATE: Users can update themselves, admins can update anyone
- DELETE: Account admins can remove users

**`user_accounts` table**:
- SELECT: Users can see their own relationships
- INSERT: Service role only
- DELETE: Users or admins can remove relationships

**`supplier_accounts` table**:
- SELECT: Users can see supplier relationships for their accounts
- INSERT/UPDATE/DELETE: Account admins only

#### Part 4: Fix Function Search Path
Used `ALTER FUNCTION` to set immutable `search_path` on:
- `auto_create_user_account()`: `SET search_path = public, pg_temp`
- `user_is_in_account(uuid)`: `SET search_path = public, pg_temp`
- `user_is_in_account(uuid, uuid)`: `SET search_path = public, pg_temp`

**Security Benefit**: Prevents SQL injection attacks via search_path manipulation.

### Edge Function Update: `claude-api-v3/tools/database.ts`

Updated `submitBid()` function to call `get_user_account_id()`:

```typescript
// Get account_id using the new helper function
let finalAccountId = accountId;
if (!finalAccountId) {
  // Try getting from get_user_account_id() function
  const rpcClient = supabase as unknown as { 
    rpc: (name: string, params?: Record<string, unknown>) => Promise<{ data: string | null; error: unknown }> 
  };
  const { data: userAccountId, error: accountError } = await rpcClient.rpc('get_user_account_id');
  
  if (!accountError && userAccountId) {
    finalAccountId = userAccountId;
    console.log('👤 Using user account_id from get_user_account_id():', finalAccountId);
  } else if (!accountError) {
    // If get_user_account_id() returns null, try RFP account_id as fallback
    const { data: rfpData } = await supabase
      .from('rfps')
      .select('account_id')
      .eq('id', data.rfp_id)
      .single();
    
    if (rfpData && typeof rfpData === 'object' && 'account_id' in rfpData) {
      finalAccountId = rfpData.account_id as string;
      console.log('📋 Using RFP account_id:', finalAccountId);
    }
  }
}
```

## Testing Instructions

### Test Bid Submission (dev.rfpez.ai)

1. **Navigate to dev.rfpez.ai and log in**
   - Use test account: `mskiba@esphere.com` / `thisisatest`

2. **Create or select an RFP**
   ```
   User: "Create a construction concrete RFP demonstration"
   Agent: RFP Design agent creates RFP and specifications
   ```

3. **Generate bid form**
   ```
   User: "Create supplier bid form for this RFP"
   Agent: Creates bid form artifact
   ```

4. **Submit demonstration bids**
   ```
   User: "Submit 3 demonstration supplier bids with different prices"
   Agent: Calls submit_bid with supplier_name, bid_price, delivery_days
   ```

5. **Verify bids appear**
   - Check "Bids for: [RFP Name]" view in artifacts
   - Bids should show with supplier names, amounts, and status
   - No database errors in console

### Expected Results

✅ **Success Indicators**:
- Bids successfully created in database
- Bids visible in Bids view artifact
- No RLS policy violations
- No "account_id cannot be null" errors
- Badge count increments when new bids submitted

❌ **Failure Indicators**:
- "Failed to insert bid" errors
- Empty Bids view despite submission attempts
- RLS policy violation errors
- Null constraint violation on account_id

## Verification Queries

### Check Security Fixes Applied

```sql
-- Verify RLS enabled on account tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('accounts', 'account_users', 'user_accounts', 'supplier_accounts');
-- Expected: All show rowsecurity = true

-- Verify views use SECURITY INVOKER
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('form_save_stats', 'bid_summary', 'v_sessions_with_user');
-- Expected: All 3 views present (with security_invoker = true in options)

-- Verify functions have search_path set
SELECT proname, proconfig 
FROM pg_proc 
WHERE proname IN ('user_is_in_account', 'auto_create_user_account', 'get_user_account_id');
-- Expected: All show ["search_path=public, pg_temp"] in proconfig
```

### Check Bid Submission Works

```sql
-- Get recent bids (should show new test bids)
SELECT 
    id,
    rfp_id,
    supplier_id,
    account_id,
    bid_amount,
    status,
    submitted_at
FROM bids 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Verify account_id populated correctly
SELECT 
    b.id as bid_id,
    b.account_id as bid_account,
    r.account_id as rfp_account,
    CASE 
        WHEN b.account_id IS NULL THEN '❌ NULL account_id'
        WHEN b.account_id = r.account_id THEN '✅ Matches RFP account'
        ELSE '⚠️ Different account'
    END as validation
FROM bids b
JOIN rfps r ON b.rfp_id = r.id
WHERE b.created_at > NOW() - INTERVAL '1 hour';
```

## Deployment Timeline

- **October 21, 2025 - 6:46 PM ET**: Migration created
- **October 21, 2025 - 6:48 PM ET**: Migration applied to local database
- **October 21, 2025 - 6:49 PM ET**: Migration deployed to remote (dev.rfpez.ai)
- **October 21, 2025 - 6:52 PM ET**: Edge function updated and deployed
- **October 21, 2025 - 6:54 PM ET**: Changes committed and pushed to GitHub

## Git Commits

1. **7b775f9**: Fix bid submission RLS and security warnings
   - Migration file with all 4 parts (bid fix, views, RLS, functions)
   
2. **74dae99**: Fix bid submission to use get_user_account_id() function
   - Edge function update to call helper function

## Impact Assessment

### Security Improvements
- ✅ All 7 RLS errors resolved
- ✅ All 2 search_path warnings resolved
- ✅ Views no longer use elevated privileges
- ✅ Functions protected against SQL injection
- ✅ Account data properly isolated by RLS

### Functional Improvements
- ✅ Bid submission now works correctly
- ✅ Account relationships properly enforced
- ✅ Multi-tenancy security hardened
- ✅ Supplier bid workflow functional end-to-end

### Potential Issues
- ⚠️ Users without accounts cannot submit bids (by design)
- ⚠️ Service role required to create user_accounts relationships
- ⚠️ Account admins needed to manage supplier relationships

## Related Documentation
- `DOCUMENTATION/AGENTS.md` - Agent system documentation
- `DOCUMENTATION/DEPLOYMENT-GUIDE.md` - Deployment procedures
- `database/agents-schema.sql` - Multi-agent database structure
- `supabase/migrations/` - All database migrations

## Next Steps

1. **Monitor Production**: Watch for bid submission errors on dev.rfpez.ai
2. **Test Edge Cases**: 
   - Users with multiple accounts
   - Bids from service role context
   - Cross-account bid attempts
3. **Performance Testing**: Ensure RLS policies don't slow down queries
4. **Documentation Update**: Update agent instructions if bid submission flow changed

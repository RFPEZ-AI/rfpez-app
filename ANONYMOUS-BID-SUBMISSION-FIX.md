# Anonymous Bid Submission Fix

## Problem
Bid submissions on the public bid submission page were failing because:
1. All RLS INSERT policies on the `bids` table required `authenticated` role
2. The `account_id` column was NOT NULL but anonymous users have no account
3. The `createBid` function failed if it couldn't retrieve a user account_id

## Solution

### 1. Database Changes (Migration: `20251028214713_allow_anonymous_bid_submissions.sql`)

#### Made `account_id` Nullable
```sql
ALTER TABLE bids ALTER COLUMN account_id DROP NOT NULL;
```
- Allows bids from external suppliers without user accounts
- Supplier tracking now relies on `supplier_id` instead
- Authenticated users still have `account_id` set for account-level operations

#### Added RLS Policy for Anonymous Submissions
```sql
CREATE POLICY "allow_anonymous_bid_submission"
ON bids
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM rfps
    WHERE rfps.id = bids.rfp_id
    AND rfps.is_public = true
  )
);
```
- Allows anonymous users to submit bids
- Only for public RFPs (`is_public = true`)
- Maintains security by preventing anonymous bids on private RFPs

#### Performance Optimization
```sql
CREATE INDEX IF NOT EXISTS idx_rfps_public ON rfps(id) WHERE is_public = true;
```
- Improves performance of public RFP check in RLS policy

### 2. Application Code Changes

#### Updated `rfpService.ts` - `createBid` Function

**Before:**
```typescript
let accountId = bid.account_id;
if (!accountId) {
  const { data: accountData } = await supabase.rpc('get_user_account_id');
  accountId = accountData;
  
  if (!accountId) {
    console.error('❌ Could not retrieve user account_id');
    return null; // ❌ Failed for anonymous users
  }
}
```

**After:**
```typescript
let accountId = bid.account_id;
if (!accountId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: accountData } = await supabase.rpc('get_user_account_id');
    accountId = accountData;
    console.log('🔑 Retrieved authenticated user account_id:', accountId);
  } else {
    console.log('👤 Anonymous user - account_id will be null');
    // Anonymous users don't have an account_id
    // We'll rely on supplier_id for tracking
  }
}
```

**Key Changes:**
- Check if user is authenticated before trying to get account_id
- Allow anonymous users to proceed with `account_id = null`
- Only set `account_id` in insert data if it exists

**Insert Logic Update:**
```typescript
// Only set account_id if we have one (authenticated users)
if (accountId) {
  bidDataWithAccountAndSupplier.account_id = accountId;
}

// Set supplier_id if we have one
if (supplierId) {
  bidDataWithAccountAndSupplier.supplier_id = supplierId;
}

console.log('📤 Submitting bid:', {
  hasAccountId: !!accountId,
  hasSupplierId: !!supplierId,
  isAnonymous: !accountId
});
```

## Testing

### Local Testing Setup
1. Made RFP ID=1 (Battery Sourcing RFP) public:
   ```sql
   UPDATE rfps SET is_public = true WHERE id = 1;
   ```

2. Verified RLS policy exists:
   ```sql
   SELECT policyname, roles, cmd 
   FROM pg_policies 
   WHERE tablename = 'bids' AND policyname LIKE '%anonymous%';
   
   -- Result:
   -- allow_anonymous_bid_submission | {anon} | INSERT
   ```

3. Verified `account_id` is nullable:
   ```sql
   \d+ bids
   -- account_id | uuid | (nullable)
   ```

### Test Cases
1. ✅ Anonymous user can submit bid to public RFP
2. ✅ Anonymous user CANNOT submit bid to private RFP (RLS blocks it)
3. ✅ Authenticated user can still submit bid with account_id
4. ✅ Supplier profiles auto-created from email in bid response

### Expected Behavior
- **Public RFP URL**: `https://dev.rfpez.ai/bid/submit?rfp_id=1`
- **Anonymous User Flow**:
  1. User visits URL (not logged in)
  2. Sees RFP email and bid form
  3. Fills supplier info (name, email, company)
  4. Fills bid form
  5. Clicks Submit
  6. Bid created with:
     - `account_id` = NULL
     - `supplier_id` = auto-created from email
     - `status` = 'draft'
     - `response` = form data + supplier info

## Deployment Steps

### Local Database (Already Applied)
```bash
docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres < \
  supabase/migrations/20251028214713_allow_anonymous_bid_submissions.sql
```

### Remote Deployment
```bash
# Option 1: GitHub Actions (Recommended)
git add .
git commit -m "Fix: Allow anonymous bid submissions on public RFPs"
git push origin master
# Deployment workflow will apply migration automatically

# Option 2: Manual Deployment
supabase db push
# Or via Management API (see FINAL-SOLUTION-MANAGEMENT-API.md)
```

## Security Considerations
- ✅ Anonymous submissions only allowed for public RFPs
- ✅ RLS policy prevents anonymous bids on private RFPs
- ✅ Supplier tracking via `supplier_id` maintains data integrity
- ✅ Email-based deduplication prevents duplicate supplier profiles
- ✅ Existing authenticated user workflows unchanged

## Impact on Existing Features
- ✅ Authenticated user bid submissions still work (account_id set)
- ✅ Bid viewing permissions unchanged
- ✅ Bid update/delete still require account ownership
- ✅ Supplier profile auto-creation unchanged
- ✅ Account-level bid management unchanged (uses account_id when present)

## Related Files
- `supabase/migrations/20251028214713_allow_anonymous_bid_submissions.sql` - Database migration
- `src/services/rfpService.ts` - Updated createBid function (lines 228-310)
- `src/pages/BidSubmissionPage.tsx` - Public bid submission UI
- `supabase/functions/claude-api-v3/services/claude.ts` - generate_rfp_bid_url tool

## Follow-up Items
- [ ] Deploy to remote database
- [ ] Test on dev.rfpez.ai with public RFP
- [ ] Monitor for any supplier profile creation issues
- [ ] Consider adding notification to account owner when anonymous bid submitted

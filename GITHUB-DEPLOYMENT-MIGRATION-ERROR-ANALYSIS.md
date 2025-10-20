# GitHub Deployment Migration Error - Analysis & Fix

**Date**: October 19, 2025  
**Status**: ❌ **NOT CLEAN FOR BUILD** - Migration dependency issue

## Problem Summary

The GitHub Actions deployment is failing with:
```
ERROR: relation "public.account_users" does not exist (SQLSTATE 42P01)
At statement: 1
CREATE POLICY select_rfps ON public.rfps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users ...
```

## Root Cause Analysis

### Schema Conflict - Duplicate Account Table Migrations

There are **TWO migrations** attempting to create account membership tables:

1. **Migration `20251017115900_add_accounts_and_account_users.sql`** (Oct 17)
   - Creates `accounts` table
   - Creates **`account_users`** table (references `auth.users` directly)
   - Status: ✅ Applied to remote

2. **Migration `20251018190000_create_accounts_and_membership.sql`** (Oct 18)
   - Also creates `accounts` table (duplicate)
   - Creates **`user_accounts`** table (references `user_profiles`)
   - Status: ❌ Not yet applied to remote

### Migration Dependency Chain

The failing migrations reference `account_users` but that table exists on remote from the Oct 17 migration. The problem is:

- **Remote database**: Has `account_users` from migration `20251017115900` ✅
- **Migration `20251017121500`**: Tries to create RLS policies using `account_users` ❌
- **GitHub Action error**: Says `account_users` doesn't exist (but it should!)

### Why the Error?

The `supabase db push` command is reporting that `account_users` doesn't exist when trying to apply `20251017121500`. This suggests:

1. **Migration history mismatch**: The remote migration history table shows `20251017115900` was applied, but the actual table might not exist
2. **Schema drift**: Someone manually dropped the table or it failed to create
3. **Transaction rollback**: The migration partially applied but rolled back

### Evidence from `supabase migration list`:

```
Local          | Remote         | Time (UTC)
20251017115900 | 20251017115900 | 2025-10-17 11:59:00  ← Shows as applied
20251017120001 | 20251017120001 | 2025-10-17 12:00:01  ← Shows as applied
20251017121500 |                | 2025-10-17 12:15:00  ← FAILS when applying
```

But the actual table doesn't exist on remote despite `20251017115900` showing as applied!

## Local Database State (Working)

```sql
account_users exists: 1 row ✅
user_accounts exists: 1 row ✅

Table "public.account_users"
  Column   | Type | FK
-----------|------|----
account_id | uuid | → accounts(id)
user_id    | uuid | → auth.users(id)
role       | text | default 'member'
created_at | timestamptz | default now()
```

**Local has BOTH tables** - this is a schema conflict that needs resolution.

## Solutions

### Option 1: Create Idempotent Fix Migration (RECOMMENDED) ✅

Create a new migration that ensures `account_users` exists before other migrations try to use it:

**File**: `20251020013000_ensure_account_users_exists.sql`

```sql
-- Emergency fix: Ensure account_users table exists
BEGIN;

CREATE TABLE IF NOT EXISTS public.accounts (...);
CREATE TABLE IF NOT EXISTS public.account_users (...);
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);

-- Grant permissions
GRANT SELECT ON public.accounts TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_users TO authenticated;

COMMIT;
```

This migration:
- ✅ Is idempotent (uses `IF NOT EXISTS`)
- ✅ Creates the table if missing
- ✅ Doesn't fail if table already exists
- ✅ Runs BEFORE the failing policy migrations (timestamp 013000 < 121500)

### Option 2: Repair Migration History

Use Supabase CLI to mark migrations as applied:

```bash
supabase migration repair --status reverted 20251017121500
# Then reapply with db push
```

**Risk**: Doesn't fix underlying schema issue.

### Option 3: Manual Database Fix

Manually create the `account_users` table on remote:

```sql
CREATE TABLE IF NOT EXISTS public.account_users (
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, user_id)
);
```

**Risk**: Bypasses migration system, creates drift.

## Recommendation

**Use Option 1** - Create the idempotent fix migration:

1. ✅ **Created**: `20251020013000_ensure_account_users_exists.sql`
2. **Commit and push** to trigger GitHub Action
3. **Monitor deployment** - should create table before policies reference it
4. **Clean up later** - Remove duplicate migration `20251018190000` that creates `user_accounts`

## Action Items

- [x] Create fix migration `20251020013000_ensure_account_users_exists.sql`
- [ ] Test migration locally
- [ ] Commit migration file
- [ ] Push to GitHub to trigger deployment
- [ ] Verify deployment succeeds
- [ ] Mark conflicting migrations for cleanup

## Answer to Original Question

**Q: Are we clean for a GitHub build? Lint errors fixed?**

**A: ❌ NO - Migration dependency issue blocks deployment**

- ✅ **Linting**: Clean (React + Edge Functions)
- ✅ **TypeScript**: No compilation errors
- ✅ **Bid submission fix**: Complete and tested locally
- ❌ **Migrations**: Deployment fails due to missing `account_users` table
- **Fix**: Apply idempotent migration `20251020013000` before pushing

## Next Steps

1. Test the fix migration locally
2. Commit all changes including the fix migration
3. Push to GitHub
4. Monitor GitHub Actions deployment
5. If successful, document the schema consolidation needed (account_users vs user_accounts)


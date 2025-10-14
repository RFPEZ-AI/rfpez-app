# CRITICAL FIX: Direct Database Connection Required

## Problem
The GitHub Actions workflow was failing with error:
```
FATAL: Tenant or user not found (SQLSTATE XX000)
```

## Root Cause
**We were using the POOLER connection string instead of the DIRECT database connection.**

The pooler is designed for application connections, NOT for migration operations. Migration tools like `supabase db push` require direct database access.

## Solution
Update your `SUPABASE_DB_URL` GitHub secret with the **DIRECT database connection string**.

### 🔴 WRONG (Pooler - causes error):
```
postgresql://postgres.jxlutaztoukwbbgtoulc:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### ✅ CORRECT (Direct database):
```
postgresql://postgres:PASSWORD@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

## How to Get the Correct Connection String

### Option 1: Supabase Dashboard (New UI - 2025)
1. Go to your project: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
2. **Click the "Connect" button** at the top of the page (near the project name)
3. In the connection modal, look for the connection string section
4. **IMPORTANT**: Make sure "Use connection pooling" is **UNCHECKED** (we need direct connection)
5. Copy the connection string that looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres`
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Option 1B: Alternative Location (Settings Page)
1. Go to: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/settings/database
2. Look for "Connection Info" or "Database Settings" section
3. Find the **host** value: `db.jxlutaztoukwbbgtoulc.supabase.co`
4. Construct manually (see Option 2 below)

### Option 2: Manual Construction
Format: `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres`

For your project:
- Project ref: `jxlutaztoukwbbgtoulc`
- Direct host: `db.jxlutaztoukwbbgtoulc.supabase.co`
- Port: `5432`
- Username: `postgres` (NOT `postgres.projectref`)
- Database: `postgres`

Full string:
```
postgresql://postgres:YOUR_DB_PASSWORD@db.jxlutaztoukwbbgtoulc.supabase.co:5432/postgres
```

## Update GitHub Secret

1. Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions/SUPABASE_DB_URL
2. Click "Update"
3. Paste the **DIRECT database connection string** (format shown above)
4. Click "Update secret"

## Verification

After updating the secret:
1. The workflow will automatically run (already triggered)
2. Or manually trigger by pushing a small change to a migration file
3. Check workflow at: https://github.com/markesphere/rfpez-app/actions
4. Expected: ✅ Migrations deploy successfully

## Key Differences

| Aspect | Direct Database | Pooler (Don't Use) |
|--------|----------------|-------------------|
| Host | `db.PROJECT_REF.supabase.co` | `aws-0-us-east-1.pooler.supabase.com` |
| Username | `postgres` | `postgres.PROJECT_REF` |
| Use Case | Migrations, DDL operations | Application connections |
| Supabase CLI | ✅ Works | ❌ "Tenant or user not found" |

## References

- GitHub Issue: https://github.com/prisma/prisma/issues/21740
- GitHub Issue: https://github.com/supabase/cli/issues/3432
- Common error: "FATAL: Tenant or user not found" with pooler connections
- Solution: Always use direct database connection for migration tools

## Related Files
- `.github/workflows/deploy-migrations.yml` - Updated with connection format notes
- `POOLER-AUTH-FIX.md` - Previous attempt using pooler (incorrect approach)
- `DB-URL-SOLUTION.md` - Initial solution attempt (corrected here)

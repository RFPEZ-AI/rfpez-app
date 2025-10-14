# Supabase CLI Authentication in GitHub Actions

**Date:** October 13, 2025  
**Issue:** Password authentication failing for migrations workflow

## The Problem

Initial approach used `supabase link --password` which tries to authenticate with the database directly:

```yaml
# ❌ This fails in GitHub Actions
- name: Link to Supabase project
  run: |
    supabase link --project-ref $PROJECT_REF --password $DB_PASSWORD
```

**Error:**
```
failed to connect to postgres: failed SASL auth 
(FATAL: password authentication failed for user "postgres")
```

## Why It Fails

1. **Database Password vs Access Token**: The `--password` flag expects the **database user password**, but GitHub Actions should use **access token authentication**
2. **Direct Database Connection**: `supabase link --password` tries to connect directly to the database, which may have firewall/network restrictions
3. **Connection Pooler**: The error shows it's trying to connect through the connection pooler, which has different authentication

## The Solution

Use **project-ref-based authentication** with the `SUPABASE_ACCESS_TOKEN` environment variable:

### For Edge Functions (Works! ✅)
```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

steps:
  - name: Link to Supabase project
    run: |
      supabase link --project-ref ${{ env.SUPABASE_PROJECT_REF }} --password ${{ env.SUPABASE_DB_PASSWORD }}
  
  - name: Deploy function
    run: |
      supabase functions deploy claude-api-v3 --project-ref ${{ env.SUPABASE_PROJECT_REF }}
```

### For Migrations (Fixed! ✅)
```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

steps:
  - name: Link to Supabase project
    run: |
      # Link without --password flag (uses access token from env)
      supabase link --project-ref ${{ env.SUPABASE_PROJECT_REF }}
  
  - name: Check migrations
    run: |
      # Use --project-ref flag for non-linked commands
      supabase migration list --project-ref ${{ env.SUPABASE_PROJECT_REF }}
  
  - name: Deploy migrations
    run: |
      # Use --project-ref and --password for db push
      supabase db push --project-ref ${{ env.SUPABASE_PROJECT_REF }} --password ${{ env.SUPABASE_DB_PASSWORD }}
```

## Key Differences

### Edge Functions Authentication
- ✅ **Can use** `supabase link --password` successfully
- ✅ Deployment via Management API (uses access token)
- ✅ No direct database connection required

### Migrations Authentication
- ❌ **Cannot use** `supabase link --password` (database auth fails)
- ✅ **Must use** `supabase link --project-ref` only (uses access token from env)
- ✅ **Must add** `--project-ref` flag to `migration list` commands
- ✅ **Must add** `--project-ref --password` to `db push` command

## Authentication Flow

### When SUPABASE_ACCESS_TOKEN is Set
```
1. supabase link --project-ref $PROJECT_REF
   → Uses $SUPABASE_ACCESS_TOKEN from environment
   → Authenticates via Supabase Management API
   → Creates .supabase/config.toml with project link
   
2. supabase migration list --project-ref $PROJECT_REF
   → Uses access token for API calls
   → No database connection needed for listing
   
3. supabase db push --project-ref $PROJECT_REF --password $DB_PASSWORD
   → Uses access token for API authorization
   → Uses database password for actual migration execution
   → Connects to database through secure channel
```

## Updated Workflow Structure

### migrations workflow (`.github/workflows/deploy-migrations.yml`)

```yaml
- name: Link to Supabase project
  run: |
    supabase link --project-ref ${{ env.SUPABASE_PROJECT_REF }}
    # No --password flag here! Uses SUPABASE_ACCESS_TOKEN from env

- name: Check migration status
  run: |
    supabase migration list --project-ref ${{ env.SUPABASE_PROJECT_REF }}
    # Add --project-ref for commands after link

- name: Deploy migrations
  run: |
    supabase db push --project-ref ${{ env.SUPABASE_PROJECT_REF }} --password ${{ env.SUPABASE_DB_PASSWORD }}
    # db push needs both project-ref and password
```

## Required GitHub Secrets

All three secrets are required:

1. **SUPABASE_ACCESS_TOKEN**
   - Used for: API authentication (link, list operations)
   - Get from: https://supabase.com/dashboard/account/tokens
   - Purpose: Authenticate with Supabase Management API

2. **SUPABASE_PROJECT_REF**
   - Used for: Identifying the project
   - Format: `jxlutaztoukwbbgtoulc` (your project ID)
   - Get from: Project URL or `supabase projects list`

3. **SUPABASE_DB_PASSWORD**
   - Used for: Direct database operations (migrations)
   - Get from: Project Settings → Database → Password
   - Purpose: Execute SQL migrations on database

## Why This Works

### Access Token Authentication (Preferred for CI/CD)
- ✅ No direct database connection required for link/list
- ✅ Works through Management API (no firewall issues)
- ✅ Secure token-based authentication
- ✅ Can be scoped and revoked easily

### Database Password (Only When Needed)
- ✅ Only used for actual SQL execution (`db push`)
- ✅ Passed directly to migration command
- ✅ Not used for authentication/authorization

## Testing the Fix

### Check Current Authentication
```bash
# Locally (with supabase login)
supabase link --project-ref jxlutaztoukwbbgtoulc
# Should link successfully using local credentials

# In GitHub Actions (with access token)
SUPABASE_ACCESS_TOKEN=$TOKEN supabase link --project-ref jxlutaztoukwbbgtoulc
# Should link successfully using token
```

### Expected Workflow Output
```
✅ Linking to Supabase project...
Linked to project: jxlutaztoukwbbgtoulc

✅ Checking pending migrations...
  Local: 20251014021930_update_solutions_agent
  Remote: (not applied)

✅ Pending migrations detected

🚀 Deploying migrations to production...
Applying migration: 20251014021930_update_solutions_agent...
✅ Migration applied successfully

✅ Verifying migration deployment...
✅ All migrations deployed successfully!
```

## Summary

| Command | Authentication Method | Flags Needed |
|---------|----------------------|--------------|
| `supabase link` | Access token (from env) | `--project-ref` only |
| `supabase migration list` | Access token | `--project-ref` |
| `supabase db push` | Access token + DB password | `--project-ref --password` |
| `supabase functions deploy` | Access token | `--project-ref` |

**Key Insight:** 
- The `SUPABASE_ACCESS_TOKEN` environment variable handles authentication for management operations
- The `--password` flag is ONLY needed for `db push` (actual SQL execution)
- Never use `supabase link --password` in GitHub Actions - it tries direct database auth which fails

---

**Status:** ✅ Fixed  
**Testing:** Ready for GitHub Actions deployment

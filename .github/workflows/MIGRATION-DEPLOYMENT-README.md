# GitHub Actions - Automated Database Migration Deployment

## Overview

This repository includes a GitHub Actions workflow that automatically deploys database migrations to Supabase when changes are pushed to the `master` branch.

## Workflow File

**Location:** `.github/workflows/deploy-migrations.yml`

### Triggers

The workflow runs automatically when:
- ✅ Changes are pushed to `master` branch
- ✅ Files in `supabase/migrations/**` are modified
- ✅ Files in `Agent Instructions/**` are modified
- ✅ Manual trigger via GitHub Actions UI (workflow_dispatch)

### What It Does

1. **Checks for Pending Migrations**: Compares local migration files with remote database
2. **Deploys Migrations**: Runs `supabase db push` to apply pending migrations
3. **Verifies Deployment**: Confirms all migrations were applied successfully
4. **Provides Summary**: Reports deployment status and any issues

## Required GitHub Secrets

You must configure these secrets in your GitHub repository settings:

### 1. SUPABASE_ACCESS_TOKEN
**How to get it:**
```bash
# Login to Supabase CLI
supabase login

# Get your access token
supabase projects list
```

Or get it from: https://supabase.com/dashboard/account/tokens

**Add to GitHub:**
- Go to: Repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `SUPABASE_ACCESS_TOKEN`
- Value: Your Supabase access token

### 2. SUPABASE_PROJECT_REF
**How to get it:**
- From your Supabase project URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`
- Example: If URL is `https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc`
- Then PROJECT_REF is: `jxlutaztoukwbbgtoulc`

Or run:
```bash
supabase projects list
```

**Add to GitHub:**
- Name: `SUPABASE_PROJECT_REF`
- Value: Your project reference (e.g., `jxlutaztoukwbbgtoulc`)

### 3. SUPABASE_DB_PASSWORD
**How to get it:**
- Dashboard → Project Settings → Database → Database password
- This is the password you set when creating the project

**Add to GitHub:**
- Name: `SUPABASE_DB_PASSWORD`
- Value: Your database password (keep this secret!)

## Setup Instructions

### Step 1: Configure Secrets
```bash
# Navigate to GitHub repository
# Settings → Secrets and variables → Actions → New repository secret

# Add all three secrets:
# - SUPABASE_ACCESS_TOKEN
# - SUPABASE_PROJECT_REF  
# - SUPABASE_DB_PASSWORD
```

### Step 2: Verify Workflow File
```bash
# Check that the workflow file exists
cat .github/workflows/deploy-migrations.yml
```

### Step 3: Test Deployment

#### Option A: Push Agent Changes
```bash
# 1. Update an agent instruction file
vim "Agent Instructions/RFP Design Agent.md"

# 2. Generate migration locally
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# 3. Test locally first
cat supabase/migrations/[generated-file].sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# 4. Commit and push
git add "Agent Instructions/RFP Design Agent.md"
git add supabase/migrations/[generated-file].sql
git commit -m "Update RFP Design agent instructions"
git push origin master

# 5. Check GitHub Actions tab for deployment status
```

#### Option B: Manual Trigger
```bash
# Go to GitHub repository
# Actions → Deploy Database Migrations → Run workflow
# Select branch: master → Run workflow
```

## Workflow Behavior

### When Migrations Exist
```
📊 Deployment Summary
====================
✅ Database migrations deployed successfully!
🔄 Migration status synchronized
🌐 Project: jxlutaztoukwbbgtoulc
📅 Deployed at: 2025-10-14 02:30:00 UTC
```

### When No Migrations Needed
```
📊 Deployment Summary
====================
ℹ️ No migrations to deploy (database already up to date)
🌐 Project: jxlutaztoukwbbgtoulc
📅 Deployed at: 2025-10-14 02:30:00 UTC
```

### On Failure
```
❌ Migration deployment failed!
Please check the logs above for details.

Common issues:
  - Migration conflicts (already applied)
  - Database connection issues
  - Invalid SQL syntax
  - Permission issues

Manual recovery: Run 'supabase migration repair' if needed
```

## Integration with Agent Tool

The workflow is designed to work seamlessly with the agent markdown-to-SQL migration tool:

### Complete Workflow
```bash
# 1. Edit agent instruction locally
vim "Agent Instructions/Solutions Agent.md"

# 2. Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"

# 3. Test locally
cat supabase/migrations/20251014021930_update_solutions_agent.sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# 4. Verify locally
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, LENGTH(instructions), updated_at FROM agents WHERE name = 'Solutions';"

# 5. Commit changes
git add "Agent Instructions/Solutions Agent.md"
git add supabase/migrations/20251014021930_update_solutions_agent.sql
git commit -m "Update Solutions agent instructions"

# 6. Push to GitHub (triggers automatic deployment)
git push origin master

# 7. Monitor deployment in GitHub Actions
# https://github.com/markesphere/rfpez-app/actions
```

## Monitoring Deployments

### View Workflow Runs
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy Database Migrations" workflow
4. View recent runs and their status

### Check Deployment Logs
1. Click on a specific workflow run
2. Expand the "deploy-migrations" job
3. View step-by-step execution logs

### Verify in Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to: Project → Database → Migrations
3. Verify new migrations are listed
4. Check agent data in SQL Editor:
   ```sql
   SELECT name, role, LENGTH(instructions), updated_at 
   FROM agents 
   ORDER BY updated_at DESC;
   ```

## Troubleshooting

### Workflow Doesn't Trigger
**Check:**
- Are changes in `supabase/migrations/**` or `Agent Instructions/**`?
- Is the push to `master` branch?
- Are GitHub Actions enabled for the repository?

**Solution:**
```bash
# Verify workflow file
cat .github/workflows/deploy-migrations.yml

# Check branch
git branch --show-current

# Push to correct branch
git push origin master
```

### Authentication Errors
**Error:** `Invalid credentials` or `Authentication failed`

**Solution:**
- Verify `SUPABASE_ACCESS_TOKEN` secret is correct
- Regenerate token if needed: https://supabase.com/dashboard/account/tokens
- Update GitHub secret

### Migration Conflicts
**Error:** `Migration already applied` or `Duplicate key`

**Solution:**
```bash
# Check remote migration status
supabase migration list

# Repair if needed
supabase migration repair --status reverted [version]

# Re-run workflow
```

### Permission Errors
**Error:** `Permission denied` or `Insufficient privileges`

**Solution:**
- Verify `SUPABASE_DB_PASSWORD` is correct
- Check database user has migration privileges
- Ensure project reference is correct

## Manual Deployment (Fallback)

If GitHub Actions fails, deploy manually:

```bash
# 1. Ensure you're on master branch
git checkout master
git pull origin master

# 2. Deploy manually
supabase db push

# 3. Verify
supabase migration list
```

## Best Practices

### 1. Always Test Locally First
```bash
# Never push untested migrations
# Always test in local Supabase before pushing
```

### 2. Use Descriptive Commit Messages
```bash
# Good: "Update RFP Design agent with new memory workflow"
# Bad: "update agent"
```

### 3. Monitor Deployment Status
```bash
# Always check GitHub Actions after pushing
# Verify in Supabase dashboard after deployment
```

### 4. Keep Secrets Secure
```bash
# Never commit secrets to repository
# Rotate tokens regularly
# Use GitHub's secret scanning
```

### 5. Incremental Changes
```bash
# Make one agent update at a time
# Easier to track and rollback if needed
```

## Rollback Procedure

If a deployment causes issues:

### 1. Identify Problem Migration
```bash
supabase migration list
```

### 2. Revert Migration
```bash
# Mark as reverted
supabase migration repair --status reverted [version]

# Or create rollback migration
node scripts/md-to-sql-migration.js "Agent Instructions/[Previous Version].md"
```

### 3. Push Rollback
```bash
git add supabase/migrations/[rollback-migration].sql
git commit -m "Rollback: Revert agent changes due to [reason]"
git push origin master
```

## Related Documentation

- **Workflow Setup**: `.github/workflows/deploy-migrations.yml`
- **Agent Tool**: `scripts/README-md-to-sql-migration.md`
- **Local Testing**: `AGENT-TOOL-WORKFLOW.md`
- **Edge Functions CI/CD**: `.github/workflows/deploy-edge-functions.yml`

## Status

✅ **Workflow Created**: `.github/workflows/deploy-migrations.yml`  
⚠️ **Secrets Required**: Configure in GitHub repository settings  
📝 **Documentation**: This file  
🚀 **Ready to Use**: After secrets are configured

---

**Next Steps:**
1. Configure the three required GitHub secrets
2. Test with a small agent update
3. Monitor deployment in GitHub Actions
4. Verify in Supabase dashboard

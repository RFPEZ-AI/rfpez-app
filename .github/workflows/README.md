# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the RFPEZ.AI project.

## Available Workflows

### 1. Deploy Edge Functions (`deploy-edge-functions.yml`)
**Purpose:** Automatically deploys Supabase Edge Functions to production

**Triggers:**
- Push to `master` branch with changes in `supabase/functions/**`
- Manual trigger via GitHub Actions UI

**Deploys:**
- `claude-api-v3` - Primary Claude API integration (V3)
- `supabase-mcp-server` - MCP protocol server

**Requirements:**
- `SUPABASE_ACCESS_TOKEN` secret
- `SUPABASE_PROJECT_REF` secret

---

### 2. Deploy Database Migrations (`deploy-migrations.yml`) ⭐ NEW
**Purpose:** Automatically deploys database migrations (including agent updates) to production

**Triggers:**
- Push to `master` branch with changes in:
  - `supabase/migrations/**`
  - `Agent Instructions/**`
- Manual trigger via GitHub Actions UI

**Features:**
- ✅ Detects pending migrations
- ✅ Deploys via `supabase db push`
- ✅ Verifies successful deployment
- ✅ Provides detailed summary and error handling
- ✅ Skips deployment if no changes detected

**Requirements:**
- `SUPABASE_ACCESS_TOKEN` secret
- `SUPABASE_PROJECT_REF` secret
- `SUPABASE_DB_PASSWORD` secret

**Documentation:** See `MIGRATION-DEPLOYMENT-README.md` for complete setup

---

### 3. Azure Static Web Apps Deployment (`dev.rfpez.ai-deployment.yml`)
**Purpose:** Deploys React frontend to Azure Static Web Apps

**Triggers:**
- Push to `master` branch
- Pull requests

**Deploys:**
- React application build
- Static assets
- Service worker

**Managed by:** Azure Static Web Apps service

---

## Quick Setup

### Configure GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions**

Add the following secrets:

1. **SUPABASE_ACCESS_TOKEN**
   - Get from: https://supabase.com/dashboard/account/tokens
   - Or run: `supabase login` and check token

2. **SUPABASE_PROJECT_REF**
   - From project URL: `jxlutaztoukwbbgtoulc`
   - Or run: `supabase projects list`

3. **SUPABASE_DB_PASSWORD**
   - Dashboard → Project Settings → Database → Password
   - This is your database password

## Workflow Integration

### Complete Development Workflow

```bash
# 1. Local Development
# Edit agent instructions
vim "Agent Instructions/Solutions Agent.md"

# Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"

# Test locally
cat supabase/migrations/[file].sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# Verify
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, LENGTH(instructions), updated_at FROM agents WHERE name = 'Solutions';"

# 2. Commit Changes
git add "Agent Instructions/Solutions Agent.md"
git add supabase/migrations/[file].sql
git commit -m "Update Solutions agent instructions"

# 3. Push to GitHub
git push origin master

# 4. GitHub Actions automatically:
# - Deploys migrations to Supabase ✅
# - Updates production database ✅
# - Verifies deployment ✅

# 5. Monitor
# Check: https://github.com/markesphere/rfpez-app/actions
```

## Monitoring Workflows

### View All Runs
https://github.com/markesphere/rfpez-app/actions

### Check Specific Workflow
- Click on workflow name
- View recent runs
- Check success/failure status
- Read detailed logs

### Status Badges (Optional)

Add to main README.md:

```markdown
![Deploy Edge Functions](https://github.com/markesphere/rfpez-app/actions/workflows/deploy-edge-functions.yml/badge.svg)
![Deploy Migrations](https://github.com/markesphere/rfpez-app/actions/workflows/deploy-migrations.yml/badge.svg)
```

## Troubleshooting

### Workflow Not Running
- Check if changes are in correct paths
- Verify push is to `master` branch
- Ensure GitHub Actions are enabled

### Authentication Failures
- Verify secrets are configured
- Check token hasn't expired
- Regenerate tokens if needed

### Migration Failures
- Check migration syntax locally first
- Review logs in GitHub Actions
- Use `supabase migration repair` if needed

## Best Practices

### 1. Test Locally First ⚡
```bash
# Always test migrations locally before pushing
# Never push untested changes to master
```

### 2. Atomic Commits 📦
```bash
# One feature/agent per commit
# Makes rollback easier if needed
```

### 3. Descriptive Messages 📝
```bash
# Good: "Update RFP Design agent with memory workflow"
# Bad: "fix stuff"
```

### 4. Monitor Deployments 👀
```bash
# Always check GitHub Actions after pushing
# Verify in Supabase dashboard
```

### 5. Secure Secrets 🔒
```bash
# Never commit secrets
# Rotate tokens regularly
# Use environment-specific secrets
```

## Documentation

- **Edge Functions**: See main `README.md`
- **Database Migrations**: See `MIGRATION-DEPLOYMENT-README.md`
- **Agent Tool**: See `scripts/README-md-to-sql-migration.md`
- **Local Workflow**: See `AGENT-TOOL-WORKFLOW.md`

## Status

| Workflow | Status | Documentation |
|----------|--------|---------------|
| Edge Functions | ✅ Active | Main README |
| Database Migrations | ✅ Active | MIGRATION-DEPLOYMENT-README.md |
| Azure Deployment | ✅ Active | Azure Portal |

---

**Last Updated:** October 14, 2025  
**Maintained By:** Development Team
# Test trigger for migration deployment
# Trigger deployment with URL-encoded password

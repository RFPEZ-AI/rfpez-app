# GitHub Actions Setup Checklist

## ☐ Step 1: Configure GitHub Secrets

Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions

### Required Secrets

- [ ] **SUPABASE_ACCESS_TOKEN**
  ```bash
  # Get your token
  supabase login
  # Or from: https://supabase.com/dashboard/account/tokens
  ```

- [ ] **SUPABASE_PROJECT_REF**
  ```bash
  # Your project reference: jxlutaztoukwbbgtoulc
  # From URL or run: supabase projects list
  ```

- [ ] **SUPABASE_DB_PASSWORD**
  ```bash
  # Database password from Supabase dashboard
  # Dashboard → Project Settings → Database
  ```

## ☐ Step 2: Verify Workflow Files

- [ ] `.github/workflows/deploy-migrations.yml` exists
- [ ] `.github/workflows/deploy-edge-functions.yml` exists
- [ ] Both files are committed to repository

```bash
# Verify files
ls -la .github/workflows/

# Should see:
# - deploy-migrations.yml
# - deploy-edge-functions.yml
# - dev.rfpez.ai-deployment.yml
```

## ☐ Step 3: Test Migration Deployment

### Option A: Test with Agent Update

```bash
# 1. Generate a test migration
node scripts/md-to-sql-migration.js "Agent Instructions/Support Agent.md"

# 2. Test locally first
MIGRATION=$(ls -t supabase/migrations/*.sql | head -1)
cat "$MIGRATION" | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# 3. Commit and push
git add "Agent Instructions/Support Agent.md"
git add supabase/migrations/*.sql
git commit -m "Test: Update Support agent (GitHub Actions test)"
git push origin master

# 4. Monitor deployment
# Go to: https://github.com/markesphere/rfpez-app/actions
```

### Option B: Manual Trigger

```bash
# 1. Go to GitHub Actions
# https://github.com/markesphere/rfpez-app/actions

# 2. Select "Deploy Database Migrations"

# 3. Click "Run workflow"

# 4. Select branch: master

# 5. Click "Run workflow" button

# 6. Monitor execution
```

## ☐ Step 4: Verify Deployment

### In GitHub
- [ ] Workflow run appears in Actions tab
- [ ] All steps show green checkmarks
- [ ] Deployment summary shows success

### In Supabase Dashboard
```bash
# 1. Go to Supabase dashboard
# https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc

# 2. Navigate to: Database → Migrations

# 3. Verify new migrations appear

# 4. Check agent data in SQL Editor:
SELECT name, role, LENGTH(instructions), updated_at 
FROM agents 
ORDER BY updated_at DESC 
LIMIT 5;
```

## ☐ Step 5: Configure Branch Protection (Optional)

### Recommended Settings
- [ ] Require pull request before merging
- [ ] Require status checks to pass (GitHub Actions)
- [ ] Require branches to be up to date

Go to: Repository → Settings → Branches → Add rule

## Success Criteria

✅ **All secrets configured**  
✅ **Workflow files committed**  
✅ **Test deployment successful**  
✅ **Verified in Supabase dashboard**  
✅ **Monitoring works correctly**

## Troubleshooting

### Secrets Not Working
```bash
# 1. Verify secrets are added (will show as *****)
# Repository → Settings → Secrets → Actions

# 2. Regenerate if needed
supabase login
# Get new token from dashboard

# 3. Update secret in GitHub
```

### Workflow Not Triggering
```bash
# Check push path
git log --oneline -1 --stat

# Verify changes are in:
# - supabase/migrations/**
# - Agent Instructions/**

# Or trigger manually via GitHub UI
```

### Authentication Errors
```bash
# Check logs in GitHub Actions

# Common issues:
# - Expired access token → Regenerate
# - Wrong project ref → Verify from URL
# - Wrong password → Check dashboard
```

## Next Steps After Setup

1. **Update your workflow**
   ```bash
   # Local → Test → Commit → Push → Auto-deploy
   ```

2. **Monitor regularly**
   ```bash
   # Check Actions tab after each push
   ```

3. **Document changes**
   ```bash
   # Use descriptive commit messages
   # Reference issue numbers if applicable
   ```

## Reference Links

- **GitHub Actions Dashboard**: https://github.com/markesphere/rfpez-app/actions
- **Supabase Dashboard**: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
- **Supabase Tokens**: https://supabase.com/dashboard/account/tokens
- **Documentation**: `.github/workflows/MIGRATION-DEPLOYMENT-README.md`

---

**Setup Time Estimate:** 10-15 minutes  
**Difficulty:** Easy  
**Prerequisites:** Supabase project access, GitHub admin access

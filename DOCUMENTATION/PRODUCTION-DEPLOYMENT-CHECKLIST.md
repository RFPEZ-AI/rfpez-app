# Production Deployment Quick Checklist

## 🚀 Pre-Deployment (Complete Once)

### Supabase Production Setup
- [ ] Access RFPEZ-PROD project in Supabase dashboard
- [ ] Copy Project Reference ID: `_________________`
- [ ] Copy API URL: `https://_________________.supabase.co`
- [ ] Copy anon/public key from Settings → API
- [ ] Copy/reset Database Password
- [ ] Generate Personal Access Token at https://supabase.com/dashboard/account/tokens
- [ ] Name token: `RFPEZ-PROD GitHub Actions`
- [ ] Save token securely (shown only once)

### Azure Static Web Apps Setup
- [ ] Login to Azure: `az login`
- [ ] Create resource group: `rfpez-production`
- [ ] Create Static Web App: `rfpez-prod` (SKU: Standard)
- [ ] Copy deployment token from Azure
- [ ] Configure custom domain: `rfpez.ai`
- [ ] Add DNS records (CNAME + TXT validation)
- [ ] Wait for DNS propagation (up to 48 hours)

### GitHub Secrets Configuration
Navigate to: https://github.com/markesphere/rfpez-app/settings/secrets/actions

- [ ] Add `SUPABASE_PROD_ACCESS_TOKEN` = [access token]
- [ ] Add `SUPABASE_PROD_PROJECT_REF` = [project ref]
- [ ] Add `SUPABASE_PROD_DB_PASSWORD` = [db password]
- [ ] Add `REACT_APP_SUPABASE_URL_PROD` = https://[ref].supabase.co
- [ ] Add `REACT_APP_SUPABASE_ANON_KEY_PROD` = [anon key]
- [ ] Add `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` = [azure token]
- [ ] Verify all 6 secrets are present

---

## 📦 Deployment Workflow (Every Production Release)

### Step 1: Pre-Deployment Validation (Local)
- [ ] Pull latest master branch: `git pull origin master`
- [ ] All tests passing: `npm test -- --watchAll=false`
- [ ] Linting passes: `npm run lint`
- [ ] Local build succeeds: `npm run build`
- [ ] Review git log for changes: `git log --oneline -10`
- [ ] Identify migrations to deploy: `ls supabase/migrations/`

### Step 2: Deploy Database Migrations
Go to: https://github.com/markesphere/rfpez-app/actions

- [ ] Click **Actions** tab
- [ ] Select **Deploy Migrations to Production** workflow
- [ ] Click **Run workflow** dropdown
- [ ] Branch: `master`
- [ ] Type confirmation: `DEPLOY TO PRODUCTION`
- [ ] Click green **Run workflow** button
- [ ] Wait for workflow completion (~2-3 min)
- [ ] ✅ Verify success: Green checkmark appears
- [ ] Review logs for any warnings
- [ ] Verify in Supabase dashboard: Check tables/data

### Step 3: Deploy Edge Functions
- [ ] Click **Actions** tab
- [ ] Select **Deploy Edge Functions to Production**
- [ ] Click **Run workflow** dropdown
- [ ] Branch: `master`
- [ ] Type confirmation: `DEPLOY TO PRODUCTION`
- [ ] Functions to deploy: `all`
- [ ] Click green **Run workflow** button
- [ ] Wait for completion (~2-5 min)
- [ ] ✅ Verify success: Green checkmark appears
- [ ] Test function endpoints (see verification section)

### Step 4: Deploy Application
- [ ] Click **Actions** tab
- [ ] Select **Production Deployment (rfpez.ai)**
- [ ] Click **Run workflow** dropdown
- [ ] Branch: `master`
- [ ] Type confirmation: `DEPLOY TO PRODUCTION`
- [ ] Deployment type: `full`
- [ ] Click green **Run workflow** button
- [ ] Wait for pre-deployment checks (~3-5 min)
- [ ] Wait for build and deploy (~4-6 min)
- [ ] ✅ Verify success: All jobs show green checkmarks

---

## ✅ Post-Deployment Verification (Required)

### Immediate Checks (Within 5 minutes)
- [ ] Open https://rfpez.ai in browser
- [ ] Site loads without errors
- [ ] No console errors (F12 → Console)
- [ ] CSS and images load correctly
- [ ] Click **Login** button
- [ ] Enter test credentials: `mskiba@esphere.com` / `thisisatest`
- [ ] Successfully authenticate
- [ ] Dashboard loads
- [ ] Click **New Session** button
- [ ] Send test message: "Hello production"
- [ ] Message appears in UI
- [ ] Verify in Supabase dashboard: Check messages table

### Edge Function Verification
```bash
# Test claude-api-v3
curl -X POST https://[YOUR_PROD_REF].supabase.co/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Expected: Response (not 500 error)

# Test supabase-mcp-server
curl https://[YOUR_PROD_REF].supabase.co/functions/v1/supabase-mcp-server
# Expected: Response (not 404)
```

### Extended Monitoring (30 minutes)
- [ ] Monitor Azure Application Insights for errors
- [ ] Check Supabase logs for function errors
- [ ] Test core user workflows:
  - [ ] Create new RFP
  - [ ] Switch agents
  - [ ] Create artifact
  - [ ] Submit form
- [ ] Verify no performance degradation
- [ ] Check for user-reported issues

---

## 🔄 Rollback Procedure (If Needed)

### Quick Rollback via Azure Portal
1. [ ] Go to https://portal.azure.com
2. [ ] Navigate to **rfpez-prod** Static Web App
3. [ ] Click **Deployment history**
4. [ ] Find last stable deployment (before current)
5. [ ] Click **Redeploy** on that deployment
6. [ ] Confirm rollback
7. [ ] Wait for redeployment (~2-3 min)
8. [ ] Verify site functionality restored
9. [ ] Investigate root cause before re-attempting deployment

### Database Rollback (If Critical)
⚠️ **ONLY IF ABSOLUTELY NECESSARY - CAN CAUSE DATA LOSS**
1. [ ] Identify problematic migration
2. [ ] Create reverse migration SQL
3. [ ] Test reverse migration locally
4. [ ] Backup production database first
5. [ ] Deploy reverse migration via GitHub Actions
6. [ ] Verify data integrity

---

## 📊 Deployment Status Dashboard

### Current Production Environment
- **Domain**: https://rfpez.ai
- **Supabase Project**: RFPEZ-PROD
- **Azure Resource**: rfpez-prod
- **Last Deployment**: _______________
- **Deployed By**: _______________
- **Build Number**: _______________
- **Commit SHA**: _______________

### Quick Links
- Azure Portal: https://portal.azure.com
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Actions: https://github.com/markesphere/rfpez-app/actions
- Application Insights: [Add URL after setup]

---

## 🚨 Emergency Contacts

### Critical Issues
- **Production Down**: Immediately rollback via Azure Portal
- **Database Issues**: Check Supabase status page first
- **Security Issues**: Contact Azure support + disable affected endpoints

### Support Resources
- Supabase Support: https://supabase.com/support
- Azure Support: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- GitHub Issues: https://github.com/markesphere/rfpez-app/issues

---

## 📝 Deployment Log

Keep a record of each production deployment:

### Template
```
Date: YYYY-MM-DD HH:MM UTC
Deployed By: [GitHub username]
Build Number: [From GitHub Actions]
Commit SHA: [Short hash]
Changes:
  - [Description of main changes]
  - [Migration changes]
  - [Feature additions/removals]
Status: ✅ Success / ❌ Failed / 🔄 Rolled Back
Issues: [None / Description of issues encountered]
Rollback Required: [Yes/No]
Notes: [Additional context]
```

### Recent Deployments
```
[Add deployment records here as you deploy]
```

---

## ✨ Quick Command Reference

### Check Deployment Status
```bash
# Check if site is live
curl -I https://rfpez.ai

# List Supabase functions
supabase functions list --project-ref [PROD_REF]

# Check DNS propagation
nslookup rfpez.ai
```

### Local Production Build Test
```bash
# Build with production env
REACT_APP_SUPABASE_URL=https://[PROD].supabase.co \
REACT_APP_SUPABASE_ANON_KEY=[PROD_KEY] \
npm run build

# Serve locally for testing
npx serve -s build -p 3000
```

### Database Backup
```bash
# Create backup before major changes
supabase db dump --project-ref [PROD_REF] > backup-$(date +%Y%m%d-%H%M%S).sql
```

---

**Last Updated**: January 2026  
**Document Version**: 1.0  
**Maintained By**: RFPEZ.AI DevOps Team

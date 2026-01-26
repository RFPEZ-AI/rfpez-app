# 🚀 RFPEZ.AI Production Deployment - Execution Plan

**Target**: Deploy RFPEZ.AI to rfpez.ai with Supabase RFPEZ-PROD backend  
**Timeline**: 2-3 hours for initial setup  
**Status**: Ready to Execute

---

## ✅ Preparation Complete

### Infrastructure Code
- ✅ GitHub Actions workflows created (3 manual workflows)
- ✅ Automated setup scripts (Supabase & Azure)
- ✅ Comprehensive documentation (4 guides)
- ✅ Environment configuration templates
- ✅ .gitignore updated for production secrets

### What You Have Now
1. Manual deployment workflows for production
2. Setup automation scripts for Windows and Linux/Mac
3. Complete documentation with troubleshooting
4. Production environment templates
5. Security protections for secrets

---

## 🎯 Execution Steps - Start Here

### STEP 1: Supabase Production Configuration (30-45 min)

#### 1.1 Gather Supabase Production Details
Open browser to: https://supabase.com/dashboard

Navigate to **RFPEZ-PROD** project:
- Settings → General → Copy **Project Reference ID**
- Settings → API → Copy **API URL** and **anon/public key**
- Settings → Database → Copy or reset **Database Password**

Generate Access Token:
- Account → Tokens → Generate New Token
- Name: `RFPEZ-PROD GitHub Actions`
- **Copy token immediately** (shown only once!)

#### 1.2 Run Supabase Setup Script

**Windows:**
```batch
cd c:\Dev\RFPEZ.AI\rfpez-app
.\scripts\setup-supabase-production.bat
```

**Linux/Mac:**
```bash
cd ~/Dev/RFPEZ.AI/rfpez-app
chmod +x scripts/setup-supabase-production.sh
./scripts/setup-supabase-production.sh
```

**What it does:**
- Prompts for all production credentials
- Creates `.env.production.local` (not committed)
- Creates `github-secrets-production.txt` reference file
- Tests Supabase connection
- Updates `.gitignore`

**Output files:**
- `.env.production.local` - Local production environment
- `github-secrets-production.txt` - GitHub secrets reference

---

### STEP 2: Add GitHub Secrets (10 min)

Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions

Click **"New repository secret"** for each:

#### Supabase Secrets (from github-secrets-production.txt)
```
Name: SUPABASE_PROD_ACCESS_TOKEN
Value: [Your Supabase access token]

Name: SUPABASE_PROD_PROJECT_REF
Value: [Your project reference ID]

Name: SUPABASE_PROD_DB_PASSWORD
Value: [Your database password]

Name: REACT_APP_SUPABASE_URL_PROD
Value: https://[your-ref].supabase.co

Name: REACT_APP_SUPABASE_ANON_KEY_PROD
Value: [Your anon key]
```

**Verify:** You should see all 5 Supabase secrets listed

---

### STEP 3: Azure Static Web App Setup (45-60 min)

#### 3.1 Install Azure CLI (if needed)
Windows: Download from https://aka.ms/installazurecliwindows  
Linux/Mac: Follow instructions at https://learn.microsoft.com/cli/azure/install-azure-cli

Verify: `az --version`

#### 3.2 Run Azure Setup Script

**Linux/Mac:**
```bash
cd ~/Dev/RFPEZ.AI/rfpez-app
chmod +x scripts/setup-azure-production.sh
./scripts/setup-azure-production.sh
```

**What it does:**
- Prompts for Azure login
- Creates resource group: `rfpez-production`
- Creates Static Web App: `rfpez-prod` (Standard SKU)
- Retrieves deployment token
- Updates `github-secrets-production.txt`
- Provides custom domain instructions

#### 3.3 Add Azure Secret to GitHub

Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions

```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_PROD
Value: [Token from github-secrets-production.txt]
```

**Verify:** You should now have 6 total secrets

---

### STEP 4: Configure Custom Domain (Start Early - Takes 24-48 Hours)

#### 4.1 Get DNS Configuration Info

From Azure setup script output or Azure Portal:
- Default hostname: `[something].azurestaticapps.net`
- Validation token: (provided in Azure Portal during setup)

#### 4.2 Add DNS Records at Your DNS Provider

**CNAME Record:**
```
Type: CNAME
Name: @  (or rfpez.ai)
Value: [something].azurestaticapps.net
TTL: 3600 (1 hour)
```

**TXT Record (for validation):**
```
Type: TXT
Name: @  (or rfpez.ai)
Value: [validation-token-from-azure]
TTL: 3600 (1 hour)
```

#### 4.3 Configure in Azure Portal

1. Go to: https://portal.azure.com
2. Navigate to: **rfpez-prod** Static Web App
3. Select: **Custom domains** (left menu)
4. Click: **+ Add**
5. Select: **Custom domain on other DNS**
6. Enter: `rfpez.ai`
7. Follow validation steps
8. Wait for DNS propagation (up to 48 hours)

**⏰ Start this NOW** - DNS propagation can take 24-48 hours!

---

### STEP 5: Deploy Database Migrations (5 min)

Go to: https://github.com/markesphere/rfpez-app/actions

1. Click **Actions** tab
2. Select **"Deploy Migrations to Production"** workflow
3. Click **"Run workflow"** dropdown (top right)
4. Branch: `master`
5. Type confirmation: `DEPLOY TO PRODUCTION`
6. Click green **"Run workflow"** button
7. Wait for completion (~2-3 minutes)
8. ✅ Verify green checkmark appears

#### Verify in Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select: RFPEZ-PROD project
3. Open: SQL Editor
4. Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
5. Verify tables exist

---

### STEP 6: Deploy Edge Functions (5 min)

Go to: https://github.com/markesphere/rfpez-app/actions

1. Click **Actions** tab
2. Select **"Deploy Edge Functions to Production"** workflow
3. Click **"Run workflow"** dropdown
4. Branch: `master`
5. Type confirmation: `DEPLOY TO PRODUCTION`
6. Functions to deploy: `all`
7. Click green **"Run workflow"** button
8. Wait for completion (~2-5 minutes)
9. ✅ Verify green checkmark appears

#### Test Edge Functions
```bash
# Replace [YOUR_PROD_REF] with your project reference ID

# Test claude-api-v3
curl -X POST https://[YOUR_PROD_REF].supabase.co/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: JSON response (not 500 error)
```

---

### STEP 7: Deploy Application (10 min)

Go to: https://github.com/markesphere/rfpez-app/actions

1. Click **Actions** tab
2. Select **"Production Deployment (rfpez.ai)"** workflow
3. Click **"Run workflow"** dropdown
4. Branch: `master`
5. Type confirmation: `DEPLOY TO PRODUCTION`
6. Deployment type: `full`
7. Click green **"Run workflow"** button
8. Wait for completion (~6-11 minutes)
   - Pre-deployment checks: ~3-5 min
   - Build and deploy: ~3-6 min
9. ✅ Verify all jobs show green checkmarks

---

### STEP 8: Post-Deployment Verification (15-30 min)

#### 8.1 Immediate Checks (5 minutes)

**Open Production Site:**
- Get default URL from Azure Portal or script output
- URL format: `https://[something].azurestaticapps.net`
- Open in browser
- ✅ Site loads without errors
- ✅ No console errors (F12 → Console)
- ✅ Images and CSS load correctly

**Test Authentication:**
- Click **Login** button
- Email: `mskiba@esphere.com`
- Password: `thisisatest`
- ✅ Successfully logs in
- ✅ Dashboard appears

**Test Database Connection:**
- Click **New Session**
- Send message: "Hello production"
- ✅ Message appears in UI
- ✅ Verify in Supabase dashboard (messages table)

#### 8.2 Extended Verification (15-20 minutes)

**Test Core Workflows:**
- [ ] Create new RFP
- [ ] Switch agents
- [ ] Create artifact
- [ ] Submit form
- [ ] View message history

**Monitor for Issues:**
- Azure Portal → Application Insights → Check for errors
- Supabase Dashboard → Logs → Check for function errors
- Browser Console → No JavaScript errors

---

### STEP 9: Monitor and Document (30-60 min)

#### 9.1 Active Monitoring
- Keep Azure Application Insights open
- Monitor Supabase function logs
- Watch for user-reported issues
- Check performance metrics

#### 9.2 Update Deployment Log

Edit: `PRODUCTION-DEPLOYMENT-CHECKLIST.md` → Deployment Log section

```
Date: 2026-01-08
Deployed By: [Your GitHub username]
Build Number: [From GitHub Actions run]
Commit SHA: [Short hash]
Changes:
  - Initial production deployment
  - Database schema migrated
  - Edge functions deployed
  - Application deployed to Azure
Status: ✅ Success
Issues: None
Rollback Required: No
Notes: First production deployment successful
```

---

### STEP 10: Configure Custom Domain (After DNS Propagation)

**Wait for DNS propagation** (started in Step 4)

#### 10.1 Check DNS Propagation
```bash
# Check if DNS has propagated
nslookup rfpez.ai

# Or use online tool
# https://dnschecker.org/
```

#### 10.2 Verify in Azure Portal
1. Go to: https://portal.azure.com
2. Navigate to: **rfpez-prod**
3. Select: **Custom domains**
4. Check validation status
5. Once validated, custom domain is active

#### 10.3 Test Custom Domain
- Open: https://rfpez.ai
- ✅ Site loads
- ✅ HTTPS certificate valid
- ✅ All functionality works

---

## 🚨 If Something Goes Wrong

### Deployment Failed
1. **Check workflow logs** in GitHub Actions
2. **Review error message** carefully
3. **Verify GitHub secrets** are set correctly
4. **Check Supabase connectivity** from local machine
5. **Refer to troubleshooting guide**: [PRODUCTION-DEPLOYMENT-GUIDE.md#troubleshooting](PRODUCTION-DEPLOYMENT-GUIDE.md#troubleshooting)

### Need to Rollback
1. Go to: https://portal.azure.com
2. Navigate to: **rfpez-prod**
3. Click: **Deployment history**
4. Find: Last stable deployment
5. Click: **Redeploy**
6. Wait: ~2-3 minutes
7. Verify: Site functionality restored

### Database Issues
1. **DO NOT** run destructive commands without backup
2. Check Supabase dashboard for error logs
3. Verify connection credentials in GitHub secrets
4. Test connection from local machine
5. Contact Supabase support if needed

---

## 📊 Success Criteria

### Deployment Successful When:
✅ All GitHub Actions workflows completed with green checkmarks  
✅ Production site loads at Azure default URL  
✅ Authentication works correctly  
✅ Database queries execute successfully  
✅ Edge functions respond without errors  
✅ No console errors in browser  
✅ Core user workflows functional  
✅ No critical errors in logs  

### Optional (After DNS Propagation):
✅ Custom domain (rfpez.ai) loads correctly  
✅ HTTPS certificate valid  
✅ All functionality works on custom domain  

---

## 📝 Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Supabase setup script | 30-45 min |
| 2 | Add GitHub secrets | 10 min |
| 3 | Azure setup script | 45-60 min |
| 4 | Configure DNS | 5 min (+ 24-48 hrs wait) |
| 5 | Deploy migrations | 5 min |
| 6 | Deploy edge functions | 5 min |
| 7 | Deploy application | 10 min |
| 8 | Post-deployment verification | 15-30 min |
| 9 | Monitoring and documentation | 30-60 min |
| **Total** | **Active work** | **~2-3 hours** |

**Note:** DNS propagation (Step 4) takes 24-48 hours but happens in parallel with other steps.

---

## 🎯 Post-Setup - Ongoing Deployments

Once initial setup is complete, future deployments take ~20-30 minutes:

1. Test changes in dev environment (dev.rfpez.ai)
2. Run production workflows in GitHub Actions
3. Verify deployment success
4. Monitor for 30 minutes

---

## 📞 Need Help?

### Documentation
- Quick Start: [PRODUCTION-DEPLOYMENT-CHECKLIST.md](PRODUCTION-DEPLOYMENT-CHECKLIST.md)
- Full Guide: [PRODUCTION-DEPLOYMENT-GUIDE.md](PRODUCTION-DEPLOYMENT-GUIDE.md)
- Configuration: [PRODUCTION-DEPLOYMENT-CONFIG.md](PRODUCTION-DEPLOYMENT-CONFIG.md)

### Resources
- Supabase: https://supabase.com/dashboard
- Azure Portal: https://portal.azure.com
- GitHub Actions: https://github.com/markesphere/rfpez-app/actions

---

## ✨ You're Ready!

Everything is prepared for production deployment. Start with **STEP 1: Supabase Production Configuration** above.

**Good luck! 🚀**

---

**Created**: January 2026  
**Last Updated**: January 2026  
**Status**: Ready to Execute

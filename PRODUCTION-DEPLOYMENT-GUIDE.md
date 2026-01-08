# RFPEZ.AI Production Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Production Setup](#supabase-production-setup)
3. [Azure Static Web Apps Setup](#azure-static-web-apps-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Initial Database Migration](#initial-database-migration)
6. [Production Deployment](#production-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- ✅ Supabase account with RFPEZ-PROD project provisioned
- ✅ Azure subscription with permissions to create Static Web Apps
- ✅ GitHub repository admin access for rfpez-app
- ✅ Domain ownership verification for rfpez.ai

### Required Tools
```bash
# Install Supabase CLI
npm install -g supabase

# Install Azure CLI
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Verify installations
supabase --version
az --version
```

---

## Supabase Production Setup

### Step 1: Get Production Project Details

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select RFPEZ-PROD project
3. Go to **Settings → General**
4. Copy the following:
   - **Project Reference ID** (e.g., `abcdefghijklmnop`)
   - **API URL** (e.g., `https://abcdefghijklmnop.supabase.co`)

5. Go to **Settings → API**
6. Copy:
   - **anon/public key** (starts with `eyJ...`)

7. Go to **Settings → Database**
8. Copy or reset:
   - **Database Password**

### Step 2: Generate Supabase Access Token

1. Go to [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
2. Click **Generate New Token**
3. Name it: `RFPEZ-PROD GitHub Actions`
4. Copy the token immediately (shown only once)

### Step 3: Link Local Environment to Production

```bash
cd c:\Dev\RFPEZ.AI\rfpez-app

# Link to production project
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Verify connection
supabase projects list
```

---

## Azure Static Web Apps Setup

### Step 1: Create Production Static Web App

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_NAME"

# Create resource group (if needed)
az group create \
  --name rfpez-production \
  --location eastus

# Create Static Web App for production
az staticwebapp create \
  --name rfpez-prod \
  --resource-group rfpez-production \
  --location eastus \
  --sku Standard \
  --source https://github.com/markesphere/rfpez-app \
  --branch master \
  --app-location "/" \
  --output-location "build"

# Get deployment token
az staticwebapp secrets list \
  --name rfpez-prod \
  --resource-group rfpez-production \
  --query "properties.apiKey" \
  --output tsv
```

Copy the deployment token for GitHub secrets.

### Step 2: Configure Custom Domain

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Static Web App: **rfpez-prod**
3. Select **Custom domains** from left menu
4. Click **+ Add**
5. Select **Custom domain on other DNS**
6. Enter: `rfpez.ai`
7. Follow DNS validation steps:
   - Add TXT record to your DNS provider
   - Add CNAME record pointing to the generated URL
8. Wait for validation (can take up to 48 hours)

### DNS Configuration Example
```
Type: CNAME
Name: @  (or rfpez.ai)
Value: [your-static-web-app].azurestaticapps.net

Type: TXT
Name: @  (or rfpez.ai)
Value: [validation-token-provided-by-azure]
```

---

## GitHub Secrets Configuration

### Navigate to Repository Settings
1. Go to https://github.com/markesphere/rfpez-app
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets for Production

#### Supabase Production Secrets
```
Name: SUPABASE_PROD_ACCESS_TOKEN
Value: [Your Supabase access token from Step 2 above]

Name: SUPABASE_PROD_PROJECT_REF
Value: [Your production project reference ID]

Name: SUPABASE_PROD_DB_PASSWORD
Value: [Your production database password]

Name: REACT_APP_SUPABASE_URL_PROD
Value: https://[YOUR_PROD_PROJECT_REF].supabase.co

Name: REACT_APP_SUPABASE_ANON_KEY_PROD
Value: [Your production anon key]
```

#### Azure Production Secrets
```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN_PROD
Value: [Azure deployment token from az staticwebapp secrets list]
```

### Verify Secrets
After adding all secrets, you should see:
- ✅ SUPABASE_PROD_ACCESS_TOKEN
- ✅ SUPABASE_PROD_PROJECT_REF
- ✅ SUPABASE_PROD_DB_PASSWORD
- ✅ REACT_APP_SUPABASE_URL_PROD
- ✅ REACT_APP_SUPABASE_ANON_KEY_PROD
- ✅ AZURE_STATIC_WEB_APPS_API_TOKEN_PROD

---

## Initial Database Migration

### Step 1: Review Migration Files
```bash
# Check all migrations
ls -la supabase/migrations/

# Review recent migrations
cat supabase/migrations/[latest-migration].sql
```

### Step 2: Test Migrations Locally First
```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase migration up

# Test application locally
npm start
```

### Step 3: Deploy to Production via GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select **Deploy Migrations to Production** workflow
3. Click **Run workflow**
4. In the modal:
   - Branch: `master`
   - Confirm: Type `DEPLOY TO PRODUCTION`
5. Click **Run workflow**
6. Monitor the workflow execution

### Step 4: Verify Migration Success
1. Check workflow logs for success message
2. Go to Supabase dashboard → SQL Editor
3. Run verification queries:
```sql
-- Check table creation
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify agents are loaded
SELECT id, name, access_level FROM agents;
```

---

## Production Deployment

### Phase 1: Deploy Edge Functions

1. Go to **Actions** tab in GitHub
2. Select **Deploy Edge Functions to Production**
3. Click **Run workflow**
4. Configure:
   - Branch: `master`
   - Confirm: `DEPLOY TO PRODUCTION`
   - Functions: `all` (or specific function names)
5. Click **Run workflow**
6. Wait for completion (~2-5 minutes)

### Phase 2: Deploy Application

1. Go to **Actions** tab in GitHub
2. Select **Production Deployment (rfpez.ai)**
3. Click **Run workflow**
4. Configure:
   - Branch: `master`
   - Confirm: `DEPLOY TO PRODUCTION`
   - Deployment type: `full`
5. Click **Run workflow**
6. Monitor deployment progress

### Expected Deployment Time
- Pre-deployment checks: ~3-5 minutes
- Build process: ~2-4 minutes
- Azure deployment: ~1-2 minutes
- Total: ~6-11 minutes

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

#### 1. Site Accessibility
```bash
# Check if site is responding
curl -I https://rfpez.ai

# Expected: HTTP/2 200
```

#### 2. Application Load Test
- [ ] Navigate to https://rfpez.ai
- [ ] Verify homepage loads without errors
- [ ] Check browser console for errors (F12)
- [ ] Verify no broken images or resources

#### 3. Authentication Flow
- [ ] Click **Login** button
- [ ] Enter test credentials: `mskiba@esphere.com` / `thisisatest`
- [ ] Verify successful authentication
- [ ] Check user session is created

#### 4. Supabase Connectivity
- [ ] Create new session
- [ ] Send a test message
- [ ] Verify message is saved to database
- [ ] Check Supabase dashboard for new records

#### 5. Edge Function Testing
```bash
# Test Claude API endpoint
curl -X POST https://[YOUR_PROD_REF].supabase.co/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: Valid response (not 500 error)
```

### Extended Monitoring (30 minutes - 2 hours)

#### 1. Error Log Monitoring
- Go to Azure Portal → Static Web App → Monitoring
- Check Application Insights for errors
- Look for 4xx/5xx HTTP errors

#### 2. Performance Metrics
- Monitor page load times
- Check API response times
- Verify no degradation vs dev environment

#### 3. User Acceptance Testing
- [ ] Create new RFP workflow
- [ ] Test agent switching
- [ ] Verify artifact creation
- [ ] Test message history
- [ ] Validate form submissions

### Health Check Checklist
```
✅ Site accessible at https://rfpez.ai
✅ HTTPS certificate valid
✅ No browser console errors
✅ Authentication working
✅ Database connectivity confirmed
✅ Edge functions responding
✅ No critical errors in logs
✅ Performance acceptable
```

---

## Rollback Procedures

### When to Rollback
- Critical functionality broken
- Authentication failures
- Database connection issues
- Widespread user-reported errors
- Security vulnerability discovered

### Rollback Methods

#### Method 1: Azure Portal (Recommended)
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **rfpez-prod** Static Web App
3. Click **Deployment history** (left menu)
4. Find the last stable deployment
5. Click **Redeploy** on that deployment
6. Confirm rollback
7. Wait for redeployment (~2-3 minutes)

#### Method 2: GitHub Actions
1. Go to **Actions** tab
2. Select **Production Deployment (rfpez.ai)**
3. Click **Run workflow**
4. Configure:
   - Branch: `master`
   - Confirm: `DEPLOY TO PRODUCTION`
   - Deployment type: `rollback`
5. Follow the manual steps provided in workflow output

#### Method 3: Redeploy Previous Commit
1. Identify the last stable commit hash
```bash
git log --oneline -10
```

2. Checkout that commit
```bash
git checkout [commit-hash]
```

3. Manually trigger production deployment workflow
4. After verification, update master branch if needed

### Database Rollback
⚠️ **Database rollbacks are complex - only attempt with careful planning**

1. Identify the problematic migration
2. Create a reverse migration SQL file
3. Test reverse migration locally
4. Deploy reverse migration via GitHub Actions
5. Verify data integrity

**Important**: Database rollbacks can cause data loss. Always backup first.

---

## Troubleshooting

### Issue: Deployment Fails at Build Step

**Symptoms**: Workflow fails during `npm run build`

**Solutions**:
1. Check environment variables are set correctly
2. Verify all GitHub secrets are configured
3. Test build locally with production env vars:
```bash
REACT_APP_SUPABASE_URL=https://[PROD].supabase.co \
REACT_APP_SUPABASE_ANON_KEY=[PROD_KEY] \
npm run build
```

4. Check for TypeScript errors: `npm run lint`

### Issue: Site Returns 500 Error

**Symptoms**: rfpez.ai shows HTTP 500

**Solutions**:
1. Check Azure Static Web Apps logs in portal
2. Verify build output was deployed correctly
3. Check if previous deployment was successful
4. Rollback to last known good deployment
5. Verify staticwebapp.config.json is correct

### Issue: Database Connection Fails

**Symptoms**: Application can't connect to Supabase

**Solutions**:
1. Verify production Supabase URL in GitHub secrets
2. Check anon key is correct and not expired
3. Test connection manually:
```bash
curl https://[YOUR_PROD_REF].supabase.co/rest/v1/
```

4. Verify IP restrictions in Supabase (if enabled)
5. Check Supabase project is not paused

### Issue: Edge Functions Return 404

**Symptoms**: Function endpoints not found

**Solutions**:
1. Verify functions were deployed successfully
2. Check function names are correct
3. List deployed functions:
```bash
supabase functions list --project-ref [PROD_REF]
```

4. Redeploy functions via GitHub Actions
5. Check function logs in Supabase dashboard

### Issue: Custom Domain Not Working

**Symptoms**: rfpez.ai doesn't resolve or shows error

**Solutions**:
1. Verify DNS records are correct:
```bash
nslookup rfpez.ai
dig rfpez.ai
```

2. Check custom domain status in Azure portal
3. Verify TXT record for validation
4. Wait 24-48 hours for DNS propagation
5. Check CNAME points to correct Azure URL

### Issue: Authentication Fails in Production

**Symptoms**: Users can't log in

**Solutions**:
1. Verify Supabase auth is enabled
2. Check email templates are configured
3. Verify redirect URLs in Supabase auth settings:
   - Add https://rfpez.ai to allowed redirect URLs
4. Check auth provider configuration
5. Test with different user accounts

---

## Production Maintenance

### Regular Tasks

#### Weekly
- [ ] Review error logs in Application Insights
- [ ] Check Supabase database size and performance
- [ ] Monitor user activity metrics
- [ ] Review and respond to user feedback

#### Monthly
- [ ] Update dependencies (security patches)
- [ ] Review and optimize database queries
- [ ] Backup production database
- [ ] Check SSL certificate expiration
- [ ] Review access logs for anomalies

#### Quarterly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill
- [ ] Update documentation
- [ ] Review and update RLS policies

### Backup Strategy

#### Automated Backups (Supabase)
- Daily point-in-time recovery (7 days retention)
- Weekly full backup (30 days retention)

#### Manual Backups (Before Major Changes)
```bash
# Backup production database
supabase db dump --project-ref [PROD_REF] > backup-$(date +%Y%m%d).sql

# Backup to secure storage
az storage blob upload \
  --account-name rfpezbackups \
  --container-name database-backups \
  --file backup-$(date +%Y%m%d).sql
```

---

## Contact & Support

### Production Issues
- **Critical Issues**: Contact Azure support immediately
- **Database Issues**: Check Supabase status page
- **General Issues**: Review logs and documentation first

### Resources
- Supabase Dashboard: https://supabase.com/dashboard
- Azure Portal: https://portal.azure.com
- GitHub Actions: https://github.com/markesphere/rfpez-app/actions
- Documentation: See PRODUCTION-DEPLOYMENT-CONFIG.md

---

## Changelog

### Version 1.0 (January 2026)
- Initial production deployment setup
- Manual deployment workflows configured
- Comprehensive deployment guide created

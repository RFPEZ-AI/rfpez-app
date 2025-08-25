# GitHub Actions Deployment Guide for Azure Static Web Apps

## Overview
This workflow file automatically deploys your RFPEZ.AI app to Azure Static Web Apps whenever you push to the master branch or create a pull request.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. Go to Repository Settings > Secrets and variables > Actions

### 2. Add these Repository Secrets:

#### Azure Static Web Apps Token
- **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Value**: Get this from your Azure Static Web App resource
  - Go to Azure Portal → Your Static Web App → Manage deployment token
  - Copy the deployment token

#### Supabase Configuration
- **Name**: `REACT_APP_SUPABASE_URL`
- **Value**: Your Supabase project URL

- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous/public key

## Deployment Steps

### Option 1: Create Azure Static Web App via Portal (Recommended)
1. Go to Azure Portal
2. Create a new Static Web App resource
3. Connect it to your GitHub repository
4. Azure will automatically create the workflow file and deployment token
5. Replace the generated workflow with the one provided above
6. Add the environment variable secrets as listed above

### Option 2: Create via Azure CLI
```bash
# Create resource group
az group create --name rg-rfpez-ai --location "East US"

# Create static web app
az staticwebapp create \
  --name swa-rfpez-ai \
  --resource-group rg-rfpez-ai \
  --source https://github.com/YOUR_USERNAME/rfpez-app \
  --location "East US" \
  --branch master \
  --app-location "/" \
  --output-location "build" \
  --login-with-github
```

## Workflow Features

### Automatic Deployment
- **Push to master**: Deploys to production
- **Pull Requests**: Creates preview deployments
- **PR closed**: Cleans up preview deployments

### Build Configuration
- **Node.js 18**: Latest LTS version
- **npm ci**: Fast, reliable installs
- **Build output**: `build` directory (Create React App default)
- **Environment variables**: Injected during build

### Preview Deployments
- Each PR gets its own preview URL
- Automatically cleaned up when PR is closed
- Perfect for testing changes before merging

## Post-Deployment Setup

### 1. Configure Environment Variables in Azure Portal

After your Static Web App is deployed, you **must** configure the environment variables in Azure Portal:

1. Go to your Azure Static Web App resource in Azure Portal
2. Navigate to **Configuration** in the left menu
3. Click **+ Add** to add each environment variable:

**Add these Application Settings:**
- **Name**: `REACT_APP_AUTH0_DOMAIN`, **Value**: `dev-jt6bdlf3wlirw8fj.us.auth0.com`
- **Name**: `REACT_APP_AUTH0_CLIENT_ID`, **Value**: `xFkK50LJUeFSLwrbObCXi2mPnUW8aoWM`
- **Name**: `REACT_APP_SUPABASE_URL`, **Value**: `https://jxlutaztoukwbbgtoulc.supabase.co`
- **Name**: `REACT_APP_SUPABASE_ANON_KEY`, **Value**: `your-supabase-anon-key`

4. Click **Save** to apply the configuration
5. The app will automatically restart with the new environment variables

**Alternative: Configure via Azure CLI**
```bash
# Set environment variables for your Static Web App
az staticwebapp appsettings set \
  --name swa-rfpez-ai \
  --resource-group rg-rfpez-ai \
  --setting-names REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co \
                  REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Configure Supabase Authentication
After deployment, add your Static Web App URLs to Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your site URL: `https://your-app-name.azurestaticapps.net`
3. Add redirect URLs:
   - `https://your-app-name.azurestaticapps.net`
   - `https://your-app-name.azurestaticapps.net/**` (for OAuth callbacks)

### 3. Configure Custom Domain (Optional)
```bash
az staticwebapp hostname set \
  --name swa-rfpez-ai \
  --resource-group rg-rfpez-ai \
  --hostname yourdomain.com
```

### 3. Monitor Deployments
- Check GitHub Actions tab for build status
- Monitor Azure Static Web Apps logs in Azure Portal
- Use preview URLs for testing

## Troubleshooting

### Environment Variable Errors

**Error**: `Uncaught Error: Missing REACT_APP_SUPABASE_URL environment variable`

**Cause**: Environment variables are not properly configured in Azure Static Web Apps. Azure requires environment variables to be set in **both** GitHub Secrets (build-time) and Azure Configuration (runtime).

**Complete Solution**:

1. **Verify GitHub Secrets** (Required for build process):
   ```
   Go to: GitHub Repository → Settings → Secrets and variables → Actions
   
   Ensure these Repository Secrets exist:
   - REACT_APP_SUPABASE_URL = https://jxlutaztoukwbbgtoulc.supabase.co
   - REACT_APP_SUPABASE_ANON_KEY = your-supabase-anon-key
   ```

2. **Configure Azure Application Settings** (Required for runtime):
   ```
   Go to: Azure Portal → Your Static Web App → Configuration → Application Settings
   
   Click "Add" for each environment variable:
   - Name: REACT_APP_SUPABASE_URL, Value: https://jxlutaztoukwbbgtoulc.supabase.co  
   - Name: REACT_APP_SUPABASE_ANON_KEY, Value: your-supabase-anon-key
   
   Click "Save" - this will restart your app automatically
   ```

3. **Alternative: Use Azure CLI**:
   ```bash
   az staticwebapp appsettings set \
     --name your-static-web-app-name \
     --setting-names \
     REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co \
     REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Verify the Fix**:
   - Wait 1-2 minutes for the app to restart
   - Refresh your deployed app
   - Check Azure Portal → Monitoring → Log stream for any remaining errors
   - The error should be resolved once both sets of variables are configured

**Important**: Azure Static Web Apps requires environment variables in **TWO** locations:
- GitHub Secrets (for build process) ✓
- Azure Application Settings (for runtime) ← This is usually the missing piece

**Important**: Environment variables must be configured in **both** places:
- GitHub Secrets (for build process)
- Azure Static Web App Configuration (for runtime)

### Manifest.json Syntax Error

**Error**: `Manifest: Line: 1, column: 1, Syntax error.`

**Cause**: Usually a browser caching issue or build artifact problem that occurs alongside environment variable errors.

**Solution**:
1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Wait for app restart** after configuring environment variables in Azure
3. **Check build logs** in GitHub Actions for any build warnings
4. If persistent, **redeploy** by pushing a new commit

This error often resolves automatically once environment variables are properly configured.

### Build Failures
- Check GitHub Actions logs
- Verify all secrets are correctly configured
- Ensure package.json scripts are correct

### Environment Variables
- Variables must be prefixed with `REACT_APP_`
- Add them as GitHub secrets, not environment variables
- They're injected at build time, not runtime

### Auth0 Issues
- Update callback URLs with your deployed domain
- Verify domain and client ID are correct
- Check CORS settings in Auth0 dashboard

## Cost Estimation
- **Azure Static Web Apps**: Free tier available (100GB bandwidth, 250GB storage)
- **GitHub Actions**: 2000 minutes/month free for public repos
- **Total estimated cost**: $0-10/month for typical usage

This setup provides a complete CI/CD pipeline with automatic deployments, preview environments, and production-ready hosting.

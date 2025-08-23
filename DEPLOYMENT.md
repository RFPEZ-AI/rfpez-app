# GitHub Actions Deployment Guide for Azure Static Web Apps

## Overview
This workflow file will automatically deploy your RFPEZ.AI app to Azure Static Web Apps whenever you push to the master branch or create a pull request.

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. Go to Repository Settings > Secrets and variables > Actions

### 2. Add these Repository Secrets:

#### Azure Static Web Apps Token
- **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Value**: Get this from your Azure Static Web App resource
  - Go to Azure Portal → Your Static Web App → Manage deployment token
  - Copy the deployment token

#### Auth0 Configuration
- **Name**: `REACT_APP_AUTH0_DOMAIN`
- **Value**: Your Auth0 domain (e.g., `your-tenant.us.auth0.com`)

- **Name**: `REACT_APP_AUTH0_CLIENT_ID`
- **Value**: Your Auth0 application client ID

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

### 1. Update Auth0 Callback URLs
After deployment, add your Static Web App URLs to Auth0:
- `https://your-app-name.azurestaticapps.net/callback`
- `https://your-app-name.azurestaticapps.net` (logout URL)

### 2. Configure Custom Domain (Optional)
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

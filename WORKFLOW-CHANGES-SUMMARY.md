# Workflow Configuration Changes Summary

## Problem Solved
Previously, when pushing to the `master` branch, two workflows would run simultaneously:
1. "Azure Static Web Apps CI/CD" (development deployment)
2. "Production Deployment" (production deployment)

This caused unnecessary resource usage and confusion.

## Changes Made

### 1. Modified Azure Static Web Apps Workflow
**File:** `.github/workflows/azure-static-web-apps-icy-pebble-0b6bf791e.yml`

**Changes:**
- **Name:** Changed to "Development Deployment (Azure Static Web Apps)"
- **Trigger:** Changed from `master` to `develop` branch
- **Environment Variables:** Updated to use development secrets:
  - `REACT_APP_SUPABASE_URL_DEV`
  - `REACT_APP_SUPABASE_ANON_KEY_DEV`
  - `REACT_APP_CLAUDE_API_KEY_DEV`
  - `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV`
- **URL:** Set to deploy to `https://dev.rfpez.ai`

### 2. Disabled Conflicting Workflows
- **`development-deployment.yml`** → **`development-deployment.yml.disabled`**
  - Avoided duplicate workflows on `develop` branch
- **`production-deployment.yml`** → **`production-deployment.yml.disabled`**
  - Per request to "skip production deployment for now until ready"

## Current Workflow Behavior

### ✅ Pushing to `develop` branch:
- **Triggers:** "Development Deployment (Azure Static Web Apps)"
- **Deploys to:** dev.rfpez.ai
- **Uses:** Development environment secrets

### ✅ Pushing to `master` branch:
- **Triggers:** No workflows (production deployment disabled)
- **Result:** No automatic deployments

### ✅ Pull Requests to `develop` branch:
- **Triggers:** "Development Deployment (Azure Static Web Apps)"
- **Creates:** Preview deployments
- **Cleanup:** Automatic when PR is closed

## Re-enabling Production Deployment

When ready to enable production deployment:

1. **Rename the file:**
   ```bash
   mv .github/workflows/production-deployment.yml.disabled .github/workflows/production-deployment.yml
   ```

2. **Ensure production secrets are configured:**
   - `REACT_APP_SUPABASE_URL_PRODUCTION`
   - `REACT_APP_SUPABASE_ANON_KEY_PRODUCTION`
   - `REACT_APP_CLAUDE_API_KEY_PRODUCTION`
   - `AZURE_STATIC_WEB_APPS_API_TOKEN_PRODUCTION`

3. **Push to `master` branch will then:**
   - Deploy to rfpez.ai (production)
   - Use production environment secrets

## Branch Strategy
- **`develop`** → Development deployment (dev.rfpez.ai)
- **`master`** → Production deployment (rfpez.ai) *when enabled*
- **Feature branches** → Create PRs to `develop` for testing
#!/bin/bash
# Supabase Production Setup Helper Script
# This script guides you through setting up the RFPEZ-PROD Supabase project

set -e  # Exit on error

echo "🚀 RFPEZ.AI Production Supabase Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for input
prompt_input() {
    local prompt_text=$1
    local var_name=$2
    echo -e "${BLUE}${prompt_text}${NC}"
    read -p "> " $var_name
    echo ""
}

# Function to display step
display_step() {
    local step_num=$1
    local step_text=$2
    echo -e "${GREEN}[Step $step_num]${NC} $step_text"
    echo "---"
}

echo -e "${YELLOW}⚠️  Prerequisites:${NC}"
echo "  1. RFPEZ-PROD project created in Supabase"
echo "  2. Supabase CLI installed (supabase --version)"
echo "  3. Access to Supabase dashboard"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 1: Get project details
display_step 1 "Get Production Project Details"
echo "Go to: https://supabase.com/dashboard"
echo "Select: RFPEZ-PROD project"
echo "Navigate to: Settings → General"
echo ""

prompt_input "Enter Production Project Reference ID (e.g., abcdefghijklmnop):" PROD_PROJECT_REF
prompt_input "Enter Production API URL (e.g., https://xxx.supabase.co):" PROD_API_URL
prompt_input "Enter Production Anon Key (from Settings → API):" PROD_ANON_KEY
prompt_input "Enter Production Database Password (from Settings → Database):" PROD_DB_PASSWORD

# Step 2: Generate access token
display_step 2 "Generate Access Token"
echo "Go to: https://supabase.com/dashboard/account/tokens"
echo "Click: Generate New Token"
echo "Name: RFPEZ-PROD GitHub Actions"
echo ""
prompt_input "Enter the generated access token (shown only once):" PROD_ACCESS_TOKEN

# Step 3: Verify credentials
display_step 3 "Verify Credentials"
echo "Project Ref: $PROD_PROJECT_REF"
echo "API URL: $PROD_API_URL"
echo "Anon Key: ${PROD_ANON_KEY:0:20}..."
echo "DB Password: ********"
echo "Access Token: ${PROD_ACCESS_TOKEN:0:20}..."
echo ""
read -p "Are these credentials correct? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Setup cancelled. Please run again with correct credentials.${NC}"
    exit 1
fi
echo ""

# Step 4: Create .env.production.local file
display_step 4 "Create Local Production Environment File"
cat > .env.production.local << EOF
# RFPEZ.AI Production Environment (Local Reference)
# DO NOT COMMIT THIS FILE - IT'S IN .gitignore

# Supabase Production Configuration
REACT_APP_SUPABASE_URL=$PROD_API_URL
REACT_APP_SUPABASE_ANON_KEY=$PROD_ANON_KEY

# Production Mode
NODE_ENV=production
REACT_APP_ENVIRONMENT=production

# Beta Test Configuration (Production - requires billing)
REACT_APP_BETA_TEST=false

# Build Configuration
GENERATE_SOURCEMAP=false
FAST_REFRESH=false
EOF

echo -e "${GREEN}✅ Created .env.production.local${NC}"
echo ""

# Step 5: Create secrets file for GitHub reference
display_step 5 "Create GitHub Secrets Reference File"
cat > github-secrets-production.txt << EOF
# GitHub Secrets for Production Deployment
# Add these to: https://github.com/markesphere/rfpez-app/settings/secrets/actions
# DO NOT COMMIT THIS FILE - IT'S IN .gitignore

# Supabase Production Secrets
SUPABASE_PROD_ACCESS_TOKEN=$PROD_ACCESS_TOKEN
SUPABASE_PROD_PROJECT_REF=$PROD_PROJECT_REF
SUPABASE_PROD_DB_PASSWORD=$PROD_DB_PASSWORD
REACT_APP_SUPABASE_URL_PROD=$PROD_API_URL
REACT_APP_SUPABASE_ANON_KEY_PROD=$PROD_ANON_KEY

# Azure Production Secret (to be added after Azure setup)
# AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=[Get from Azure CLI]

---
Setup completed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
EOF

echo -e "${GREEN}✅ Created github-secrets-production.txt${NC}"
echo -e "${YELLOW}⚠️  Keep this file secure and do not commit it!${NC}"
echo ""

# Step 6: Verify Supabase CLI and credentials
display_step 6 "Verify Supabase CLI"
echo "Verifying Supabase CLI installation and credentials..."
echo ""

if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI found: $(supabase --version)${NC}"
    
    # Verify we can list projects with the access token
    echo ""
    echo "Verifying access token by listing projects:"
    export SUPABASE_ACCESS_TOKEN=$PROD_ACCESS_TOKEN
    supabase projects list || {
        echo -e "${RED}❌ Could not list projects. Check access token.${NC}"
        echo "Access token may be invalid or expired."
    }
    unset SUPABASE_ACCESS_TOKEN
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Install with: npm install -g supabase${NC}"
    echo "CLI is required for manual deployments (optional for GitHub Actions)"
fi
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep Local and Production Separate${NC}"
echo "Do NOT link your local Docker Supabase instance to production!"
echo "Local development should stay linked to: rfpez-app-local"
echo "Production deployments use GitHub Actions with --project-ref flags"
echo ""

# Step 7: Update .gitignore
display_step 7 "Update .gitignore"
if ! grep -q ".env.production.local" .gitignore 2>/dev/null; then
    echo ".env.production.local" >> .gitignore
    echo "github-secrets-production.txt" >> .gitignore
    echo -e "${GREEN}✅ Updated .gitignore${NC}"
else
    echo -e "${GREEN}✅ .gitignore already configured${NC}"
fi
echo ""

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Files created:"
echo "  ✅ .env.production.local (local production env)"
echo "  ✅ github-secrets-production.txt (GitHub secrets reference)"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Add GitHub Secrets:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions"
echo "   - Add all secrets from: github-secrets-production.txt"
echo "   - Delete the file after adding secrets (for security)"
echo ""
echo "2. Setup Azure Static Web App:"
echo "   - Run: ./scripts/setup-azure-production.sh"
echo "   - Or follow: PRODUCTION-DEPLOYMENT-GUIDE.md"
echo ""
echo "3. Keep Local Environment Separate:"
echo "   - DO NOT run: supabase link --project-ref [PROD_REF]"
echo "   - Local Docker instance stays linked to: rfpez-app-local"
echo "   - Production accessed only via GitHub Actions"
echo ""
echo "4. Deploy Database Migrations:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/actions"
echo "   - Run: Deploy Migrations to Production workflow"
echo ""
echo "5. Deploy Edge Functions:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/actions"
echo "   - Run: Deploy Edge Functions to Production workflow"
echo ""
echo "6. Deploy Application:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/actions"
echo "   - Run: Production Deployment (rfpez.ai) workflow"
echo ""
echo "📚 Documentation:"
echo "  - Setup Guide: PRODUCTION-DEPLOYMENT-GUIDE.md"
echo "  - Checklist: PRODUCTION-DEPLOYMENT-CHECKLIST.md"
echo "  - Config: PRODUCTION-DEPLOYMENT-CONFIG.md"
echo ""
echo -e "${GREEN}Good luck with your production deployment! 🚀${NC}"
echo ""

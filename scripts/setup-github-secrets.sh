#!/bin/bash
# Setup GitHub Secrets for Production Deployment
# 
# Usage:
#   1. Install GitHub CLI: https://cli.github.com/
#   2. Run: gh auth login
#   3. Run this script: ./scripts/setup-github-secrets.sh

set -e

echo "🔐 GitHub Secrets Setup for RFPEZ.AI Production Deployment"
echo "============================================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "Install it:"
    echo "  Windows: winget install GitHub.cli"
    echo "  Mac:     brew install gh"
    echo "  Linux:   https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo ""
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Production Supabase Project Reference (known value)
PROD_PROJECT_REF="jxlutaztoukwbbgtoulc"

echo "📝 Setting up production secrets..."
echo ""
echo "Secret 1: SUPABASE_PROD_PROJECT_REF"
echo "  Value: $PROD_PROJECT_REF (auto-configured)"
gh secret set SUPABASE_PROD_PROJECT_REF -b "$PROD_PROJECT_REF"
echo "  ✅ Set successfully"
echo ""

# Access Token
echo "Secret 2: SUPABASE_PROD_ACCESS_TOKEN"
echo "  Get this from: https://supabase.com/dashboard/account/tokens"
echo ""
read -sp "  Enter your Supabase Access Token: " ACCESS_TOKEN
echo ""
if [ -z "$ACCESS_TOKEN" ]; then
    echo "  ❌ Access token cannot be empty"
    exit 1
fi
gh secret set SUPABASE_PROD_ACCESS_TOKEN -b "$ACCESS_TOKEN"
echo "  ✅ Set successfully"
echo ""

# Database Password
echo "Secret 3: SUPABASE_PROD_DB_PASSWORD"
echo "  This is your production database password"
echo "  If you don't have it, reset it at:"
echo "  https://supabase.com/dashboard/project/$PROD_PROJECT_REF/settings/database"
echo ""
read -sp "  Enter your Production Database Password: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    echo "  ❌ Database password cannot be empty"
    exit 1
fi
gh secret set SUPABASE_PROD_DB_PASSWORD -b "$DB_PASSWORD"
echo "  ✅ Set successfully"
echo ""

echo "============================================================"
echo "✅ All production secrets configured successfully!"
echo ""
echo "You can now run production deployments:"
echo "  - Edge Functions: .github/workflows/deploy-edge-functions-production.yml"
echo "  - Migrations:     .github/workflows/deploy-migrations-production.yml"
echo "  - Full Deploy:    .github/workflows/production-deployment.yml"
echo ""
echo "To verify secrets were set:"
echo "  gh secret list"

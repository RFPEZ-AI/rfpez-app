#!/bin/bash
# Add GitHub Secrets for Production using GitHub CLI
# Requires: gh CLI installed and authenticated

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Add GitHub Production Secrets"
echo "========================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not found!${NC}"
    echo "Install from: https://cli.github.com/"
    echo "Or install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if secrets file exists
if [ ! -f github-secrets-production.txt ]; then
    echo -e "${RED}❌ github-secrets-production.txt not found!${NC}"
    echo "Run: ./scripts/setup-supabase-production.sh"
    exit 1
fi

echo "Reading secrets from: github-secrets-production.txt"
echo "Target repository: markesphere/rfpez-app"
echo ""

# Parse and set secrets
while IFS='=' read -r name value; do
    # Skip comments and empty lines
    [[ "$name" =~ ^#.*$ ]] && continue
    [[ -z "$name" ]] && continue
    [[ -z "$value" ]] && continue
    
    # Skip Azure placeholder
    [[ "$value" == "[Get from Azure CLI]" ]] && continue
    
    echo "Adding secret: $name"
    echo "$value" | gh secret set "$name" --repo markesphere/rfpez-app
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ $name added${NC}"
    else
        echo -e "  ${RED}❌ Failed to add $name${NC}"
    fi
    echo ""
done < <(grep -v '^#' github-secrets-production.txt | grep '=')

echo ""
echo "========================================"
echo "  Secrets Added Successfully!"
echo "========================================"
echo ""
echo "Verify secrets at:"
echo "https://github.com/markesphere/rfpez-app/settings/secrets/actions"
echo ""
echo "Next steps:"
echo "  1. Run Azure setup: ./scripts/setup-azure-production.sh"
echo "  2. Add Azure secret: AZURE_STATIC_WEB_APPS_API_TOKEN_PROD"
echo "  3. Deploy via GitHub Actions"
echo ""

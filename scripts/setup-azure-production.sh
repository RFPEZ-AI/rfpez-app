#!/bin/bash
# Azure Static Web Apps Production Setup Script
# Creates and configures Azure Static Web App for rfpez.ai

set -e

echo "🚀 Azure Static Web Apps Production Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not installed${NC}"
    echo "Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI found${NC}"
echo ""

# Step 1: Login to Azure
echo -e "${BLUE}[Step 1]${NC} Azure Login"
echo "---"
echo "Logging in to Azure..."
az login

echo ""
echo "Available subscriptions:"
az account list --output table

echo ""
read -p "Enter subscription ID or name to use: " SUBSCRIPTION
az account set --subscription "$SUBSCRIPTION"
echo -e "${GREEN}✅ Using subscription: $SUBSCRIPTION${NC}"
echo ""

# Step 2: Configuration
echo -e "${BLUE}[Step 2]${NC} Configuration"
echo "---"

RESOURCE_GROUP="rfpez-production"
STATIC_WEB_APP_NAME="rfpez-prod"
LOCATION="eastus2"  # Available locations: westus2, centralus, eastus2, westeurope, eastasia
SKU="Standard"
GITHUB_REPO="https://github.com/markesphere/rfpez-app"

echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Static Web App: $STATIC_WEB_APP_NAME"
echo "  Location: $LOCATION"
echo "  SKU: $SKU (required for custom domains)"
echo "  GitHub Repo: $GITHUB_REPO"
echo ""

read -p "Proceed with this configuration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Setup cancelled${NC}"
    exit 1
fi
echo ""

# Step 3: Create Resource Group
echo -e "${BLUE}[Step 3]${NC} Create Resource Group"
echo "---"

if az group exists --name $RESOURCE_GROUP | grep -q "true"; then
    echo -e "${YELLOW}⚠️  Resource group '$RESOURCE_GROUP' already exists${NC}"
else
    echo "Creating resource group..."
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION
    echo -e "${GREEN}✅ Resource group created${NC}"
fi
echo ""

# Step 4: Create Static Web App
echo -e "${BLUE}[Step 4]${NC} Create Static Web App"
echo "---"
echo "Creating Static Web App (this may take a few minutes)..."

# Check if already exists
if az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Static Web App '$STATIC_WEB_APP_NAME' already exists${NC}"
    read -p "Recreate it? This will delete the existing one! (yes/no): " RECREATE
    if [ "$RECREATE" == "yes" ]; then
        echo "Deleting existing Static Web App..."
        az staticwebapp delete \
            --name $STATIC_WEB_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --yes
        echo "Creating new Static Web App..."
    else
        echo "Using existing Static Web App..."
    fi
fi

# Create if doesn't exist or was deleted
if ! az staticwebapp show --name $STATIC_WEB_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Creating Static Web App without GitHub integration..."
    echo "(GitHub Actions workflow will handle deployments)"
    
    az staticwebapp create \
        --name $STATIC_WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku $SKU
    
    echo -e "${GREEN}✅ Static Web App created${NC}"
    echo -e "${YELLOW}ℹ️  GitHub integration will be handled by GitHub Actions workflow${NC}"
fi
echo ""

# Step 5: Get Deployment Token
echo -e "${BLUE}[Step 5]${NC} Get Deployment Token"
echo "---"

DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "properties.apiKey" \
    --output tsv)

echo -e "${GREEN}✅ Deployment token retrieved${NC}"
echo ""

# Step 6: Get Static Web App URL
echo -e "${BLUE}[Step 6]${NC} Get Static Web App Details"
echo "---"

DEFAULT_HOSTNAME=$(az staticwebapp show \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "defaultHostname" \
    --output tsv)

echo "Static Web App Details:"
echo "  Name: $STATIC_WEB_APP_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Default URL: https://$DEFAULT_HOSTNAME"
echo ""

# Step 7: Save deployment token
echo -e "${BLUE}[Step 7]${NC} Save Deployment Token"
echo "---"

# Update github-secrets-production.txt if it exists
if [ -f "github-secrets-production.txt" ]; then
    # Check if Azure token line exists
    if grep -q "AZURE_STATIC_WEB_APPS_API_TOKEN_PROD" github-secrets-production.txt; then
        # Replace existing line
        sed -i "s|# AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=.*|AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=$DEPLOYMENT_TOKEN|" github-secrets-production.txt
    else
        # Add new line
        echo "" >> github-secrets-production.txt
        echo "AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=$DEPLOYMENT_TOKEN" >> github-secrets-production.txt
    fi
    echo -e "${GREEN}✅ Updated github-secrets-production.txt${NC}"
else
    # Create new file
    cat > github-secrets-production.txt << EOF
# Azure Static Web Apps Production Deployment Token
# Add to: https://github.com/markesphere/rfpez-app/settings/secrets/actions

AZURE_STATIC_WEB_APPS_API_TOKEN_PROD=$DEPLOYMENT_TOKEN

---
Azure setup completed: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Default URL: https://$DEFAULT_HOSTNAME
EOF
    echo -e "${GREEN}✅ Created github-secrets-production.txt${NC}"
fi
echo ""

# Step 8: Custom Domain Configuration
echo -e "${BLUE}[Step 8]${NC} Custom Domain Configuration"
echo "---"
echo "To configure rfpez.ai as custom domain:"
echo ""
echo "1. In Azure Portal (https://portal.azure.com):"
echo "   - Navigate to: $STATIC_WEB_APP_NAME"
echo "   - Select: Custom domains"
echo "   - Click: + Add"
echo "   - Select: Custom domain on other DNS"
echo "   - Enter: rfpez.ai"
echo ""
echo "2. Add DNS records at your DNS provider:"
echo "   Type: CNAME"
echo "   Name: @  (or rfpez.ai)"
echo "   Value: $DEFAULT_HOSTNAME"
echo ""
echo "   Type: TXT"
echo "   Name: @  (or rfpez.ai)"
echo "   Value: [validation token provided by Azure]"
echo ""
echo "3. Wait for DNS propagation (up to 48 hours)"
echo ""
echo "Would you like to configure custom domain now?"
read -p "Open Azure Portal? (yes/no): " OPEN_PORTAL

if [ "$OPEN_PORTAL" == "yes" ]; then
    RESOURCE_ID=$(az staticwebapp show \
        --name $STATIC_WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --query "id" \
        --output tsv)
    
    PORTAL_URL="https://portal.azure.com/#@/resource${RESOURCE_ID}/customDomains"
    echo "Opening: $PORTAL_URL"
    
    # Try to open in default browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "$PORTAL_URL"
    elif command -v open &> /dev/null; then
        open "$PORTAL_URL"
    else
        echo "Please open this URL in your browser:"
        echo "$PORTAL_URL"
    fi
fi
echo ""

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Azure Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Azure Resources Created:"
echo "  ✅ Resource Group: $RESOURCE_GROUP"
echo "  ✅ Static Web App: $STATIC_WEB_APP_NAME"
echo "  ✅ Default URL: https://$DEFAULT_HOSTNAME"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Add GitHub Secret:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions"
echo "   - Name: AZURE_STATIC_WEB_APPS_API_TOKEN_PROD"
echo "   - Value: (from github-secrets-production.txt)"
echo ""
echo "2. Configure Custom Domain:"
echo "   - Add DNS records for rfpez.ai"
echo "   - Configure in Azure Portal (see instructions above)"
echo ""
echo "3. Test Deployment:"
echo "   - Go to: https://github.com/markesphere/rfpez-app/actions"
echo "   - Run: Production Deployment (rfpez.ai) workflow"
echo ""
echo "📚 Documentation:"
echo "  - Setup Guide: PRODUCTION-DEPLOYMENT-GUIDE.md"
echo "  - Checklist: PRODUCTION-DEPLOYMENT-CHECKLIST.md"
echo ""
echo -e "${GREEN}Azure Static Web App is ready for production deployment! 🚀${NC}"
echo ""

# 🚀 RFPEZ.AI Production Environment Setup

This directory contains all resources needed to deploy RFPEZ.AI to production at **rfpez.ai**.

## 📚 Documentation Files

### Quick Start
- **[PRODUCTION-DEPLOYMENT-CHECKLIST.md](PRODUCTION-DEPLOYMENT-CHECKLIST.md)** - Step-by-step checklist for production deployment
- **[PRODUCTION-DEPLOYMENT-CONFIG.md](PRODUCTION-DEPLOYMENT-CONFIG.md)** - Production environment configuration reference

### Comprehensive Guides
- **[PRODUCTION-DEPLOYMENT-GUIDE.md](PRODUCTION-DEPLOYMENT-GUIDE.md)** - Complete deployment guide with troubleshooting

## 🛠️ Setup Scripts

### Automated Setup
```bash
# Windows
scripts\setup-supabase-production.bat
scripts\setup-azure-production.bat  # Coming soon

# Linux/Mac
./scripts/setup-supabase-production.sh
./scripts/setup-azure-production.sh
```

### Manual Setup
Follow the comprehensive guide in `PRODUCTION-DEPLOYMENT-GUIDE.md`

## 📋 Production Infrastructure

### Supabase Production (RFPEZ-PROD)
- Database: PostgreSQL 17
- Edge Functions: claude-api-v3, supabase-mcp-server
- Authentication: Supabase Auth
- Storage: Supabase Storage

### Azure Static Web Apps
- Domain: rfpez.ai
- Resource: rfpez-prod
- SKU: Standard (for custom domains)
- Region: East US

### GitHub Actions Workflows
- **Deploy Migrations to Production** - Manual database migrations
- **Deploy Edge Functions to Production** - Manual edge function deployment
- **Production Deployment (rfpez.ai)** - Manual application deployment

## 🔐 Required GitHub Secrets

### Supabase Production
```
SUPABASE_PROD_ACCESS_TOKEN       # Personal access token
SUPABASE_PROD_PROJECT_REF        # Project reference ID
SUPABASE_PROD_DB_PASSWORD        # Database password
REACT_APP_SUPABASE_URL_PROD      # API URL
REACT_APP_SUPABASE_ANON_KEY_PROD # Anonymous key
```

### Azure Production
```
AZURE_STATIC_WEB_APPS_API_TOKEN_PROD  # Deployment token
```

## 🎯 Quick Deployment Workflow

### First-Time Setup (One-Time)
1. Run Supabase setup script
2. Run Azure setup script
3. Add GitHub secrets
4. Configure DNS for rfpez.ai
5. Deploy database migrations
6. Deploy edge functions
7. Deploy application

### Regular Deployments (Ongoing)
1. Test changes in dev environment
2. Trigger manual deployment workflows in GitHub Actions
3. Verify deployment success
4. Monitor for issues

## 📖 Detailed Instructions

### Supabase Setup
See: [PRODUCTION-DEPLOYMENT-GUIDE.md#supabase-production-setup](PRODUCTION-DEPLOYMENT-GUIDE.md#supabase-production-setup)

### Azure Setup
See: [PRODUCTION-DEPLOYMENT-GUIDE.md#azure-static-web-apps-setup](PRODUCTION-DEPLOYMENT-GUIDE.md#azure-static-web-apps-setup)

### Deployment Process
See: [PRODUCTION-DEPLOYMENT-GUIDE.md#production-deployment](PRODUCTION-DEPLOYMENT-GUIDE.md#production-deployment)

## 🚨 Important Notes

### Manual Deployment Only
All production deployments require manual workflow triggers with confirmation. This prevents accidental production updates.

### Confirmation Required
When running production workflows, you must type: `DEPLOY TO PRODUCTION`

### Pre-Deployment Testing
Always test changes in dev environment (dev.rfpez.ai) before deploying to production.

### Rollback Capability
All deployments support rollback via Azure Portal or GitHub Actions.

## 🔍 Monitoring & Verification

### Post-Deployment Checks
- [ ] Site loads at https://rfpez.ai
- [ ] Authentication works
- [ ] Database connectivity verified
- [ ] Edge functions responding
- [ ] No console errors
- [ ] Core workflows functional

### Monitoring Tools
- Azure Application Insights
- Supabase Dashboard
- GitHub Actions logs

## 📞 Support

### Resources
- Supabase: https://supabase.com/dashboard
- Azure Portal: https://portal.azure.com
- GitHub Actions: https://github.com/markesphere/rfpez-app/actions

### Emergency Contacts
See: [PRODUCTION-DEPLOYMENT-GUIDE.md#emergency-contacts](PRODUCTION-DEPLOYMENT-GUIDE.md#emergency-contacts)

## 📝 Changelog

### January 2026
- Initial production environment setup
- Manual deployment workflows created
- Comprehensive documentation added
- Setup automation scripts created

---

**Last Updated**: January 2026  
**Maintained By**: RFPEZ.AI DevOps Team

# RFPEZ.AI Production Deployment Configuration
# This file documents the production environment setup for rfpez.ai

## Production Infrastructure

### Supabase Production Project
- **Project Name**: RFPEZ-PROD
- **Project Ref**: [TO BE PROVIDED - get from Supabase dashboard]
- **Region**: [TO BE CONFIGURED]
- **Database**: PostgreSQL 17
- **URL Pattern**: https://[project-ref].supabase.co

### Azure Static Web Apps Production
- **Domain**: rfpez.ai
- **Resource Name**: rfpez-prod
- **Region**: [TO BE CONFIGURED]
- **SKU**: Standard (for custom domains and advanced features)

## Required GitHub Secrets

### For Supabase Deployment
```
SUPABASE_PROD_ACCESS_TOKEN       # Supabase personal access token for production
SUPABASE_PROD_PROJECT_REF        # Production project reference ID
SUPABASE_PROD_DB_PASSWORD        # Production database password
```

### For Azure Deployment
```
AZURE_STATIC_WEB_APPS_API_TOKEN_PROD  # Azure SWA deployment token for production
REACT_APP_SUPABASE_URL_PROD           # Production Supabase URL
REACT_APP_SUPABASE_ANON_KEY_PROD      # Production Supabase anonymous key
```

## Environment Configuration

### Development (dev.rfpez.ai)
- Supabase: jxlutaztoukwbbgtoulc (current dev project)
- Auto-deploys from master branch
- Azure Static Web Apps: dev.rfpez.ai

### Production (rfpez.ai)
- Supabase: [RFPEZ-PROD project ref]
- Manual deployment workflow only
- Azure Static Web Apps: rfpez.ai
- Custom domain configuration required

## Deployment Process

### Initial Production Setup
1. Complete Supabase RFPEZ-PROD project configuration
2. Create Azure Static Web Apps production resource
3. Configure custom domain (rfpez.ai) in Azure
4. Add GitHub secrets for production environment
5. Run initial database migration to production
6. Deploy edge functions to production
7. Test production deployment manually

### Ongoing Deployments
- Manual trigger only (via GitHub Actions workflow_dispatch)
- Requires explicit approval for production changes
- Separate workflow from dev deployments

## Migration Strategy

### Database Migration
1. Test all migrations in dev environment first
2. Review migration history and compatibility
3. Backup production database before migration
4. Run migrations via GitHub Actions manually
5. Verify migration success in Supabase dashboard

### Application Deployment
1. Ensure all tests pass in dev environment
2. Create production build with correct environment variables
3. Trigger manual deployment workflow
4. Verify deployment via Azure portal
5. Test production application functionality
6. Monitor for errors and performance issues

## Rollback Procedure
1. Identify problematic deployment
2. Revert application deployment via Azure
3. If database migration issue, restore from backup
4. Communicate status to stakeholders
5. Fix issues in dev environment first
6. Re-deploy to production after verification

## Monitoring and Alerts
- Azure Application Insights for production monitoring
- Supabase dashboard for database metrics
- Custom alerts for error rates and performance degradation
- Log retention policy: 90 days minimum

## Security Considerations
- All secrets managed via GitHub Secrets
- Production database accessible only via secure connections
- Row Level Security (RLS) enabled on all tables
- Regular security audits and dependency updates
- HTTPS enforced for all connections

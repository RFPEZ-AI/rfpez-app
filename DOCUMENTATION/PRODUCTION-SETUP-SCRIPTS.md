# Production Infrastructure Setup Scripts

## Azure Static Web App Creation

### 1. Create Resource Group
```bash
az group create \
  --name rfpez-production \
  --location "East US 2"
```

### 2. Create Azure Static Web App
```bash
az staticwebapp create \
  --name rfpez-production \
  --resource-group rfpez-production \
  --source https://github.com/markesphere/rfpez-app \
  --location "East US 2" \
  --branch master \
  --app-location "/" \
  --output-location "build" \
  --login-with-github
```

### 3. Configure Custom Domain
```bash
# Get the default hostname first
az staticwebapp show \
  --name rfpez-production \
  --resource-group rfpez-production \
  --query "defaultHostname" \
  --output tsv

# Add custom domain (run after DNS is configured)
az staticwebapp hostname set \
  --name rfpez-production \
  --resource-group rfpez-production \
  --hostname rfpez.ai
```

### 4. Create Application Insights
```bash
az monitor app-insights component create \
  --app rfpez-production-insights \
  --location "East US 2" \
  --resource-group rfpez-production \
  --application-type web
```

## DNS Configuration

### Required DNS Records
Add these records to your DNS provider for `rfpez.ai`:

```
Type: CNAME
Name: @  
Value: <azure-static-web-app-default-hostname>

Type: CNAME
Name: www
Value: <azure-static-web-app-default-hostname>
```

## GitHub Secrets Setup

### Required GitHub Repository Secrets
Navigate to GitHub → Settings → Secrets and variables → Actions → New repository secret:

```bash
# Azure Static Web App deployment token
AZURE_STATIC_WEB_APPS_API_TOKEN_PRODUCTION
# Get from: az staticwebapp secrets list --name rfpez-production --resource-group rfpez-production

# Production Supabase configuration  
REACT_APP_SUPABASE_URL_PRODUCTION
# Format: https://[project-ref].supabase.co

REACT_APP_SUPABASE_ANON_KEY_PRODUCTION
# Get from Supabase project settings

REACT_APP_CLAUDE_API_KEY_PRODUCTION
# Production Claude API key

SUPABASE_PROJECT_REF_PRODUCTION
# Supabase project reference ID

SUPABASE_ACCESS_TOKEN_PRODUCTION
# Supabase CLI access token for deployments
```

## Supabase Production Setup

### 1. Create New Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project: `rfpez-production`
3. Choose strong database password
4. Select region close to Azure Static Web App

### 2. Database Schema Migration
```bash
# Export from development
supabase db dump --schema-only --project-ref jxlutaztoukwbbgtoulc > production-schema.sql

# Export essential seed data
supabase db dump --data-only --table=agents --table=form_schemas --project-ref jxlutaztoukwbbgtoulc > production-seed-data.sql

# Import to production (replace [PROD_REF] with actual project ref)
supabase db reset --project-ref [PROD_REF]
psql -f production-schema.sql "postgresql://postgres:[PASSWORD]@db.[PROD_REF].supabase.co:5432/postgres"
psql -f production-seed-data.sql "postgresql://postgres:[PASSWORD]@db.[PROD_REF].supabase.co:5432/postgres"
```

### 3. Edge Functions Deployment
```bash
# Set Supabase CLI to production project
supabase link --project-ref [PROD_REF]

# Deploy Edge Functions
supabase functions deploy mcp-server
supabase functions deploy claude-api

# Set environment variables for Edge Functions
supabase secrets set CLAUDE_API_KEY="[PRODUCTION_CLAUDE_KEY]"
supabase secrets set SUPABASE_URL="https://[PROD_REF].supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
```

## Verification Steps

### 1. Azure Resources Verification
```bash
# List all resources in production resource group
az resource list --resource-group rfpez-production --output table

# Check Static Web App status
az staticwebapp show --name rfpez-production --resource-group rfpez-production

# Test custom domain (after DNS propagation)
curl -I https://rfpez.ai
```

### 2. Supabase Verification
```bash
# Test database connection
supabase db ping --project-ref [PROD_REF]

# Test Edge Functions
curl -X POST https://[PROD_REF].supabase.co/functions/v1/mcp-server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

curl -X POST https://[PROD_REF].supabase.co/functions/v1/claude-api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"function_name":"health_check"}'
```

### 3. Application Verification
```bash
# Test main application
curl -f https://rfpez.ai

# Test static assets
curl -f https://rfpez.ai/static/css/
curl -f https://rfpez.ai/static/js/

# Test service worker
curl -f https://rfpez.ai/service-worker.js
```

## Rollback Procedures

### Emergency Rollback Steps
1. **DNS Rollback**: Change DNS records back to dev.rfpez.ai
2. **GitHub Actions**: Disable production workflow
3. **Static Web App**: Use Azure portal to stop the app
4. **Database**: Use Supabase point-in-time recovery if needed

### Rollback Commands
```bash
# Stop Azure Static Web App
az staticwebapp disconnect --name rfpez-production --resource-group rfpez-production

# Revert DNS to development (update DNS provider)
# Point rfpez.ai back to dev.rfpez.ai temporarily
```

## Monitoring Setup

### Application Insights Queries
```kusto
// Error rate monitoring
requests
| where timestamp > ago(1h)
| summarize 
    TotalRequests = count(),
    FailedRequests = countif(success == false),
    ErrorRate = (countif(success == false) * 100.0) / count()
by bin(timestamp, 5m)
| render timechart

// Performance monitoring
requests
| where timestamp > ago(1h)
| summarize avg(duration), percentile(duration, 95)
by bin(timestamp, 5m)
| render timechart
```

### Alert Rules
Create these alert rules in Azure Monitor:
1. **High Error Rate**: >5% errors in 5 minutes
2. **Slow Response**: >2s average response time
3. **Availability**: <99% availability in 5 minutes

## Security Checklist

- [ ] All secrets stored in GitHub Secrets
- [ ] Supabase RLS policies enabled and tested
- [ ] HTTPS/SSL certificate configured and working
- [ ] API keys rotated for production
- [ ] Database firewall rules configured
- [ ] Authentication flow tested end-to-end
- [ ] CORS policies configured for production domain

## Cost Monitoring

### Azure Cost Alerts
Set up budget alerts in Azure:
1. **Monthly Budget**: $50/month initially
2. **Usage Alerts**: 80% and 100% of budget
3. **Anomaly Detection**: Enable for unexpected spikes

### Supabase Usage Monitoring
Monitor these Supabase metrics:
1. **Database size**: Stay within plan limits
2. **Edge Function invocations**: Monitor API usage
3. **Bandwidth**: Track data transfer costs
4. **Auth users**: Monitor user growth vs. plan limits
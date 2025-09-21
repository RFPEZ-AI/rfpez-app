# RFPEZ.AI Production Deployment Plan

## Overview
This document outlines the comprehensive production deployment strategy for RFPEZ.AI, transitioning from the development instance at `dev.rfpez.ai` to the production instance at `rfpez.ai`.

## Current Environment Analysis

### Development Environment
- **Frontend**: React/TypeScript with Ionic React framework
- **Hosting**: Azure Static Web Apps (`dev.rfpez.ai`)
- **Backend**: Supabase instance (`jxlutaztoukwbbgtoulc.supabase.co`)
- **Edge Functions**: `mcp-server` (MCP protocol) and `claude-api` (HTTP REST)
- **API Integration**: Claude API with MCP (Model Context Protocol)
- **Database**: PostgreSQL via Supabase with RLS policies

### Issues with Current Setup
1. **Single Environment**: Dev and production share the same Supabase instance
2. **Shared Database**: No separation between development and production data
3. **Environment Variables**: Production secrets mixed with development
4. **No CI/CD Pipeline**: Manual deployment process
5. **Limited Monitoring**: No production-specific monitoring and alerting

## Production Architecture Strategy

### 1. Environment Separation
Create complete separation between development and production:

#### Production Supabase Instance
- **New Supabase Project**: Create dedicated production project
- **Database Migration**: Export/import schema and seed data
- **Edge Functions**: Deploy to production Supabase instance
- **Environment Isolation**: Separate API keys and secrets

#### Azure Infrastructure
- **Production Static Web App**: New Azure SWA resource for `rfpez.ai`
- **Custom Domain**: Configure `rfpez.ai` domain with SSL/TLS
- **Resource Group**: Dedicated production resource group
- **Application Insights**: Production monitoring and analytics

### 2. CI/CD Pipeline Architecture
Implement GitHub Actions workflow for automated deployment:

#### Branch Strategy
- `master` → Production deployment (`rfpez.ai`)
- `develop` → Development deployment (`dev.rfpez.ai`)
- Feature branches → Pull request previews

#### Pipeline Stages
1. **Build & Test**: Run Jest tests, type checking, linting
2. **Security Scan**: Dependency vulnerability checks
3. **Build Artifacts**: Create optimized production build
4. **Deploy to Azure**: Deploy to Azure Static Web Apps
5. **Post-Deployment**: Health checks and smoke tests

### 3. Security & Configuration Management

#### Environment Variables Strategy
- **GitHub Secrets**: Store all production secrets
- **Azure Key Vault**: Optional for additional secret management
- **Environment-specific configs**: Separate `.env.production` files

#### Required Production Secrets
```
REACT_APP_SUPABASE_URL=<production-supabase-url>
REACT_APP_SUPABASE_ANON_KEY=<production-anon-key>
REACT_APP_CLAUDE_API_KEY=<production-claude-key>
AZURE_STATIC_WEB_APPS_API_TOKEN=<swa-deployment-token>
```

### 4. Database & Backend Strategy

#### Supabase Production Setup
1. **Create Production Project**: New Supabase organization/project
2. **Schema Migration**: Export current schema to SQL files
3. **Data Migration**: Export essential seed data (agents, schemas)
4. **Edge Functions**: Deploy both `mcp-server` and `claude-api`
5. **RLS Policies**: Verify all Row Level Security policies
6. **Environment Variables**: Update Supabase function environment variables

#### Database Migration Plan
```sql
-- Export current schema
pg_dump --schema-only --no-owner --no-privileges > production-schema.sql

-- Export essential data (agents, form schemas)
pg_dump --data-only --table=agents --table=form_schemas > production-seed-data.sql
```

### 5. Domain & DNS Configuration

#### Custom Domain Setup
1. **Domain Registration**: Ensure `rfpez.ai` domain is available
2. **Azure Static Web Apps**: Configure custom domain in Azure portal
3. **SSL Certificate**: Azure automatically provisions Let's Encrypt certificate
4. **DNS Configuration**: Update DNS records to point to Azure SWA
5. **CDN Configuration**: Optional Azure CDN for global performance

#### DNS Records Required
```
Type: CNAME
Name: @
Value: <azure-static-web-app-domain>

Type: CNAME  
Name: www
Value: <azure-static-web-app-domain>
```

### 6. Monitoring & Observability

#### Application Insights Integration
- **Performance Monitoring**: Page load times, user interactions
- **Error Tracking**: JavaScript errors, API failures
- **User Analytics**: User flows, feature usage
- **Custom Metrics**: RFP creation, agent interactions

#### Health Checks
- **Frontend Health**: Basic application load test
- **Supabase Health**: Database connectivity test
- **Claude API Health**: API response validation
- **Edge Functions Health**: MCP and REST endpoint tests

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)
1. **Create Production Supabase Project**
   - New Supabase organization for production
   - Configure production database
   - Set up authentication and RLS policies

2. **Create Production Azure Resources**
   - New Resource Group: `rfpez-production`
   - Azure Static Web App: `rfpez-production`
   - Application Insights: `rfpez-production-insights`

3. **Domain Configuration**
   - Purchase/configure `rfpez.ai` domain
   - Set up DNS records
   - Configure SSL certificate

### Phase 2: Database Migration (Week 1-2)
1. **Schema Export & Import**
   ```bash
   # Export development schema
   supabase db dump --schema-only > schema.sql
   
   # Import to production
   supabase db reset --db-url "postgresql://[production-connection]"
   psql -f schema.sql "postgresql://[production-connection]"
   ```

2. **Seed Data Migration**
   - Export essential agents and configurations
   - Import to production database
   - Verify data integrity

3. **Edge Functions Deployment**
   ```bash
   # Deploy to production Supabase
   supabase functions deploy mcp-server --project-ref [prod-ref]
   supabase functions deploy claude-api --project-ref [prod-ref]
   ```

### Phase 3: CI/CD Pipeline (Week 2)
1. **GitHub Actions Setup**
   - Create production deployment workflow
   - Configure GitHub secrets
   - Set up branch protection rules

2. **Environment Configuration**
   - Production environment variables
   - Supabase connection strings
   - Claude API keys for production

3. **Testing & Validation**
   - Automated testing pipeline
   - Deployment verification
   - Smoke tests post-deployment

### Phase 4: Production Deployment (Week 3)
1. **Initial Production Deployment**
   - Deploy via GitHub Actions
   - Verify all functionality
   - Test user authentication

2. **DNS Cutover**
   - Point `rfpez.ai` to production
   - Verify domain accessibility
   - Monitor for issues

3. **Post-Deployment Validation**
   - End-to-end testing
   - Performance verification
   - Security validation

### Phase 5: Monitoring & Optimization (Week 4)
1. **Monitoring Setup**
   - Application Insights configuration
   - Alert rules and notifications
   - Dashboard creation

2. **Performance Optimization**
   - CDN configuration if needed
   - Database query optimization
   - Bundle size optimization

3. **Documentation & Runbooks**
   - Production deployment procedures
   - Incident response procedures
   - Backup and recovery procedures

## Environment Variables & Secrets Management

### Development Environment
Keep existing `.env` for local development with development Supabase instance.

### Production Environment
Create new production-specific environment variables:

```bash
# Production Supabase Configuration
REACT_APP_SUPABASE_URL=https://[prod-project-ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[production-anon-key]

# Production Claude API
REACT_APP_CLAUDE_API_KEY=[production-claude-key]

# Production URLs
REACT_APP_PRODUCTION_URL=https://rfpez.ai

# Azure Configuration
AZURE_SUBSCRIPTION_ID=[your-subscription-id]
AZURE_TENANT_ID=[your-tenant-id]
```

### GitHub Secrets Required
Set up these secrets in GitHub repository settings:

```
AZURE_STATIC_WEB_APPS_API_TOKEN_PRODUCTION
REACT_APP_SUPABASE_URL_PRODUCTION  
REACT_APP_SUPABASE_ANON_KEY_PRODUCTION
REACT_APP_CLAUDE_API_KEY_PRODUCTION
SUPABASE_SERVICE_ROLE_KEY_PRODUCTION
```

## Risk Mitigation

### Backup Strategy
1. **Database Backups**: Automated Supabase backups
2. **Code Backups**: GitHub repository with branch protection
3. **Configuration Backups**: Document all Azure configurations

### Rollback Strategy
1. **Blue/Green Deployment**: Use deployment slots for zero-downtime
2. **Database Rollback**: Database migration rollback scripts
3. **DNS Rollback**: Ability to quickly revert DNS changes

### Monitoring & Alerting
1. **Uptime Monitoring**: External monitoring service
2. **Error Rate Alerts**: Application Insights alerts
3. **Performance Alerts**: Response time and availability alerts

## Success Criteria

### Technical Criteria
- [ ] Production environment accessible at `rfpez.ai`
- [ ] All functionality working (authentication, RFP creation, agents)
- [ ] Supabase Edge Functions operational
- [ ] Claude API integration functional
- [ ] Performance metrics within acceptable ranges

### Operational Criteria
- [ ] Automated CI/CD pipeline operational
- [ ] Monitoring and alerting configured
- [ ] Documentation complete and accessible
- [ ] Team trained on production procedures

### Security Criteria
- [ ] All secrets properly secured
- [ ] HTTPS/SSL configured and working
- [ ] Database access controls verified
- [ ] Authentication and authorization working

## Post-Deployment Tasks

### Immediate (First 24 hours)
1. Monitor application performance and errors
2. Verify all user flows are working
3. Check database connectivity and performance
4. Validate backup procedures

### Short-term (First week)
1. Performance optimization based on real usage
2. Fine-tune monitoring and alerting
3. User acceptance testing
4. Documentation updates

### Long-term (First month)
1. Cost optimization review
2. Security audit and penetration testing
3. Disaster recovery testing
4. Performance benchmarking

## Cost Considerations

### Azure Costs
- **Static Web Apps**: Free tier initially, scale as needed
- **Application Insights**: Pay-per-use based on telemetry volume
- **Custom Domain**: Free with Azure Static Web Apps

### Supabase Costs
- **Production Instance**: Upgrade to paid plan for production workloads
- **Database Storage**: Based on data volume
- **Edge Function Invocations**: Pay-per-use model

### Third-party Costs
- **Claude API**: Usage-based pricing
- **Domain Registration**: Annual fee for `rfpez.ai`

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Infrastructure | Week 1 | Production Supabase, Azure SWA, Domain setup |
| Phase 2: Database Migration | Week 1-2 | Schema migration, Edge Functions deployment |
| Phase 3: CI/CD Pipeline | Week 2 | GitHub Actions, Environment configuration |
| Phase 4: Production Deployment | Week 3 | Live production deployment |
| Phase 5: Monitoring & Optimization | Week 4 | Full monitoring, performance optimization |

**Total Timeline**: 4 weeks for complete production deployment

## Next Steps

1. **Approval**: Review and approve this deployment plan
2. **Resource Provisioning**: Begin Phase 1 infrastructure setup
3. **Team Coordination**: Assign responsibilities for each phase
4. **Risk Assessment**: Review and approve risk mitigation strategies
5. **Timeline Confirmation**: Confirm implementation timeline and milestones

This plan ensures a robust, secure, and scalable production environment for RFPEZ.AI while maintaining the existing development workflow.
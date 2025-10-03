# RFPEZ.AI Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying RFPEZ.AI from local development to remote production environment.

## Prerequisites
- Local development environment working
- Supabase CLI installed and authenticated
- Git repository access
- All environment variables configured

## Pre-Deployment Checklist

### 1. Code Quality & Testing
Before deploying, ensure all quality checks pass:

```bash
# Run linting checks
npm run lint

# Fix any linting errors
npm run lint:fix

# Run unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run edge function tests
cd supabase/functions/claude-api-v3
deno test --allow-all tests/

# Verify edge function tests pass
./run-tests.sh
```

### 2. Clean Up Development Artifacts
Remove any temporary files and development-only content:

```bash
# Remove temporary test files
rm -rf temp/
rm -f *.log
rm -f dev-*.json

# Remove any debug files in root directory
find . -maxdepth 1 -name "*.debug.js" -delete
find . -maxdepth 1 -name "test-*.js" -delete

# Clean build artifacts
rm -rf build/
rm -rf dist/
```

### 3. Environment Configuration
Verify environment configurations are correct:

```bash
# Check local configuration
cat .env.local

# Ensure remote environment variables are set in production
# - REACT_APP_CLAUDE_API_KEY
# - REACT_APP_SUPABASE_URL (remote URL)
# - REACT_APP_SUPABASE_ANON_KEY (remote key)
# - REACT_APP_ENABLE_MCP
```

## Database Deployment

### 1. Verify Local Database State
```bash
# Check current migration status
supabase migration list

# Ensure all local migrations are applied
supabase db reset

# Verify database schema is correct
supabase db diff
```

### 2. Push Database Changes to Remote
```bash
# Push all pending migrations to remote
supabase db push

# Verify migration success
supabase migration list

# Check that Remote column shows all migrations
```

### 3. Update Agent Instructions (if modified)
If agent instructions have been updated:

```bash
# Connect to remote database and update agent instructions
# Example SQL for updating agent instructions:
```

```sql
-- Update Solutions Agent instructions
UPDATE agents 
SET instructions = 'NEW_INSTRUCTIONS_HERE',
    updated_at = NOW()
WHERE name = 'Solutions';

-- Update RFP Design Agent instructions  
UPDATE agents 
SET instructions = 'NEW_INSTRUCTIONS_HERE',
    updated_at = NOW()
WHERE name = 'RFP Design';

-- Verify updates
SELECT name, LEFT(instructions, 100) as preview, updated_at 
FROM agents 
WHERE name IN ('Solutions', 'RFP Design');
```

## Edge Functions Deployment

### 1. Test Functions Locally
```bash
# Start local function server
supabase functions serve --debug

# Test primary functions
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"test": "deployment_check"}'

curl -X POST http://127.0.0.1:54321/functions/v1/supabase-mcp-server \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list", "id": 1, "jsonrpc": "2.0"}'
```

### 2. Deploy Edge Functions to Remote
```bash
# Deploy primary Claude API endpoint (V3)
supabase functions deploy claude-api-v3

# Deploy MCP protocol server
supabase functions deploy supabase-mcp-server

# Optional: Deploy other functions as needed
# supabase functions deploy claude-api-v2  # Legacy V2 endpoint
# supabase functions deploy debug-claude   # Debug utilities

# Verify deployments
supabase functions list
```

### 3. Validate Function Deployment
```bash
# Check function versions are incremented
supabase functions list | grep -E "(claude-api-v3|supabase-mcp-server)"

# Test remote functions (replace with actual URLs)
# curl -X POST https://your-project.supabase.co/functions/v1/claude-api-v3 \
#   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
#   -H "Content-Type: application/json" \
#   -d '{"test": "remote_deployment_check"}'
```

## Code Repository Deployment

### 1. Commit All Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Deploy: [DESCRIPTION]

- Code quality: All tests passing, linting clean
- Database: Migrations applied and tested
- Edge Functions: V3 API and MCP server deployed
- Agent Instructions: [Updated/No changes]
- Features: [List key changes]"
```

### 2. Push to Remote Repository
```bash
# Push to main branch
git push origin master

# If using feature branch workflow:
# git push origin feature-branch
# Then create pull request for review
```

## Post-Deployment Verification

### 1. Database Verification
```bash
# Verify all migrations are synchronized
supabase migration list

# Check agent data integrity
# Connect to remote database and verify:
```

```sql
-- Verify agent count and status
SELECT COUNT(*) as total_agents, 
       COUNT(CASE WHEN is_active THEN 1 END) as active_agents
FROM agents;

-- Check for required default agents
SELECT name, is_active, is_default, role 
FROM agents 
WHERE name IN ('Solutions', 'RFP Design', 'Technical Support');
```

### 2. Edge Function Verification
```bash
# Check function versions and status
supabase functions list

# Verify recent deployment timestamps
# Look for updated timestamps on deployed functions
```

### 3. Application Verification
```bash
# Build production version locally first
npm run build

# Test production build
npm run serve

# Access http://localhost:3000 and verify:
# - Agent selection works
# - AI responses are generated
# - Forms can be created and submitted
# - No console errors
```

## Remote Environment Testing

### 1. Switch to Remote Configuration
```bash
# Use configuration switching scripts
./scripts/supabase-remote.bat    # Windows
# or
./scripts/supabase-remote.sh     # Linux/Mac

# Verify environment is pointing to remote
echo $REACT_APP_SUPABASE_URL
```

### 2. Test Core Functionality
- [ ] User authentication works
- [ ] Agent selection displays available agents
- [ ] Chat functionality responds with AI
- [ ] RFP creation workflow completes
- [ ] Form artifacts generate properly
- [ ] Bid submission processes correctly

### 3. Performance Verification
- [ ] Page load times acceptable
- [ ] API response times reasonable
- [ ] No network timeout errors
- [ ] Edge function execution successful

## Rollback Procedures

### 1. Database Rollback
```bash
# If needed, rollback specific migration
# supabase migration repair --status reverted --version YYYYMMDDHHMMSS

# Or reset to specific point (DANGEROUS - data loss)
# supabase db reset --local-only
```

### 2. Edge Function Rollback
```bash
# Redeploy previous version if available
# Note: Keep track of previous working versions

# Emergency: Disable problematic function
# Remove function call from frontend temporarily
```

### 3. Code Rollback
```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit (DANGEROUS)
# git reset --hard COMMIT_HASH

# Push rollback
git push origin master
```

## Deployment Success Verification

### Final Checklist
- [ ] **Database**: All migrations synchronized (Local ↔ Remote match)
- [ ] **Edge Functions**: Version numbers incremented, timestamps updated
- [ ] **Agent Instructions**: Updated timestamps in remote database
- [ ] **Application**: Core workflows functional in remote environment
- [ ] **Code Repository**: All changes committed and pushed
- [ ] **Tests**: All unit tests passing, edge function tests passing
- [ ] **Linting**: No linting errors or warnings
- [ ] **Performance**: Response times acceptable
- [ ] **Security**: No exposed secrets or debug information

## Troubleshooting Common Issues

### Migration Conflicts
```bash
# If migration conflicts occur
supabase migration repair --status reverted --version YYYYMMDDHHMMSS
supabase db push
```

### Function Deployment Failures
```bash
# Check function logs
supabase functions logs claude-api-v3 --limit 50

# Redeploy with debug
supabase functions deploy claude-api-v3 --debug
```

### Environment Configuration Issues
```bash
# Verify Supabase connection
supabase projects list
supabase status

# Check environment variables
env | grep REACT_APP
```

## Emergency Contacts & Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/[PROJECT_ID]
- **GitHub Repository**: https://github.com/markesphere/rfpez-app
- **Documentation**: `/DOCUMENTATION/` directory
- **Local Development**: `LOCAL_DEVELOPMENT_WORKFLOW.md`

## Deployment History Log

Keep track of deployments:

```
YYYY-MM-DD HH:MM - [VERSION/TAG] - [DEPLOYER]
- Database: [Migration summary]
- Functions: [Function changes]
- Features: [Key changes]
- Status: [Success/Issues]
```

---

**⚠️ IMPORTANT**: Always test in a staging environment before production deployment when possible. This guide assumes a single production environment setup.

**🎯 SUCCESS CRITERIA**: Deployment is considered successful when all verification steps pass and core application functionality works in the remote environment.
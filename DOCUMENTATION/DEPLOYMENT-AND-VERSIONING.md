# Deployment and Versioning Guide

This document explains the automated deployment and versioning strategies for RFPEZ.AI PWA.

## Overview

The RFPEZ.AI application uses Azure Static Web Apps for hosting with GitHub Actions for CI/CD. The versioning system automatically increments version numbers and displays build information in the PWA.

## Deployment Pipeline

### Workflow File
- **Location**: `.github/workflows/dev.rfpez.ai-deployment.yml`
- **Trigger**: Push to `master` branch or pull requests
- **Target**: Azure Static Web Apps (dev.rfpez.ai)

### Pipeline Steps

1. **Checkout Code**: Retrieves latest code from repository
2. **Setup Node.js**: Installs Node.js 20 with npm caching
3. **Auto-increment Version**: Automatically bumps patch version
4. **Install Dependencies**: Runs `npm ci` for clean installation
5. **Build Application**: Compiles React app with environment variables
6. **Deploy to Azure**: Uploads build to Azure Static Web Apps

## Versioning Strategies

### 1. Automatic Version Increment (Current Implementation)

```yaml
- name: Auto-increment version
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    npm version patch --no-git-tag-version
    git add package.json package-lock.json
    git commit -m "Auto-increment version to $(node -p "require('./package.json').version")" || exit 0
```

**Behavior**:
- Every deployment automatically increments patch version (1.2.0 → 1.2.1 → 1.2.2...)
- Commits version changes back to repository
- No manual intervention required

**Pros**:
- Fully automated
- Every deployment gets unique version
- Clear deployment history

**Cons**:
- Version numbers increment rapidly
- May not reflect actual feature changes

### 2. Build Number Versioning

```yaml
- name: Build application
  run: npm run build
  env:
    REACT_APP_BUILD_NUMBER: ${{ github.run_number }}
    REACT_APP_COMMIT_SHA: ${{ github.sha }}
```

**Display Format**: `v1.2.0.45 (a1b2c3d) PWA`
- `1.2.0` = Package.json version
- `45` = GitHub Actions run number
- `a1b2c3d` = First 7 characters of commit SHA

**Behavior**:
- Package.json version remains stable
- Build number increments with each run
- Commit SHA provides exact code reference

### 3. Manual Version Control

Remove auto-increment step and use npm scripts:

```bash
npm run version:patch    # Bug fixes: 1.2.0 → 1.2.1
npm run version:minor    # New features: 1.2.0 → 1.3.0  
npm run version:major    # Breaking changes: 1.2.0 → 2.0.0
```

## Version Display Logic

### Frontend Implementation
Location: `src/components/HomeHeader.tsx`

```typescript
// Get version info - use build number if available, otherwise package version
const buildNumber = process.env.REACT_APP_BUILD_NUMBER;
const commitSha = process.env.REACT_APP_COMMIT_SHA?.substring(0, 7);
const baseVersion = packageJson.version;

const versionDisplay = buildNumber 
  ? `v${baseVersion}.${buildNumber}${commitSha ? ` (${commitSha})` : ''}`
  : `v${baseVersion}`;
```

### Display Examples

| Environment | Display | Explanation |
|-------------|---------|-------------|
| Local Development | `v1.2.0 PWA` | Package.json version only |
| GitHub Actions Build | `v1.2.0.45 (abc1234) PWA` | Version + build + commit |
| Production Deploy | `v1.2.1.46 (def5678) PWA` | Auto-incremented version |

## PWA Update Mechanism

### Cache Control Headers
Location: `public/staticwebapp.config.json`

```json
{
  "route": "/service-worker.js",
  "headers": {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  }
}
```

**Purpose**: Prevents Azure CDN from caching service worker, ensuring updates propagate.

### Update Detection
Location: `src/serviceWorkerRegistration.ts`

- **Visibility Change**: Checks for updates when user returns to app
- **Periodic Check**: Every 30 minutes when app is active
- **Manual Trigger**: `registration.update()` calls

### Update Notification
Location: `src/components/PWAUpdatePrompt.tsx`

- Shows toast notification when update is available
- Provides "Update" and "Later" options
- Automatically reloads app after update

## Deployment Strategies

### Strategy 1: Continuous Deployment (Current)
- **Trigger**: Every push to master
- **Versioning**: Auto-increment patch
- **Use Case**: Rapid development, frequent deployments

### Strategy 2: Release-Based Deployment
- **Trigger**: Manual version bump
- **Versioning**: Semantic versioning
- **Use Case**: Stable releases, controlled deployments

### Strategy 3: Feature Branch Deployment
- **Trigger**: Pull request creation
- **Versioning**: Branch-based builds
- **Use Case**: Testing before merge

## Configuration Options

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_SUPABASE_URL` | Database connection | `https://xxx.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Database access | `eyJhbGciOiJIUzI1...` |
| `REACT_APP_BUILD_NUMBER` | Build identification | `45` |
| `REACT_APP_COMMIT_SHA` | Code reference | `abc1234def5678` |

### Azure Static Web Apps Secrets

Required secrets in GitHub repository settings:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Deployment authentication
- `REACT_APP_SUPABASE_URL`: Database connection string
- `REACT_APP_SUPABASE_ANON_KEY`: Database anonymous key

## NPM Scripts Reference

### Version Management
```bash
npm run version:patch     # Bug fixes (1.2.0 → 1.2.1)
npm run version:minor     # New features (1.2.0 → 1.3.0)
npm run version:major     # Breaking changes (1.2.0 → 2.0.0)
npm run build:deploy     # Build and deploy with timestamp
```

### Development
```bash
npm start                # Development server
npm run start:dev        # Frontend + API server
npm run build            # Production build
npm test                 # Run tests
```

### MCP and API
```bash
npm run mcp:deploy       # Deploy MCP server
npm run mcp:test         # Test MCP connection
npm run claude-api:deploy # Deploy Claude API function
npm run claude-api:test  # Test Claude API
```

## Monitoring and Debugging

### GitHub Actions Logs
- View deployment progress in GitHub Actions tab
- Check build logs for version increment confirmation
- Monitor Azure deployment status

### PWA Update Debugging
Browser console logs show:
```
PWA: Service worker registration: {...}
PWA: Manual update check at: 2025-09-22T10:30:00.000Z
PWA: Update found, new service worker installing...
PWA: Update ready, showing prompt to user
```

### Version Verification
1. Open PWA in browser
2. Check header for version badge
3. Compare with GitHub Actions run number
4. Verify commit SHA matches repository

## Best Practices

### For Development
1. Use automatic versioning for rapid iteration
2. Monitor build numbers for deployment tracking
3. Test PWA updates on mobile devices
4. Use semantic versioning for major releases

### For Production
1. Consider manual versioning for stable releases
2. Test update mechanism before major deployments
3. Monitor Azure Static Web Apps performance
4. Keep deployment documentation updated

### For Troubleshooting
1. Check GitHub Actions logs for build failures
2. Verify Azure secrets are correctly configured
3. Test service worker updates in incognito mode
4. Use browser DevTools to inspect PWA behavior

## Common Issues and Solutions

### Issue: PWA Not Updating
**Solution**: Check cache headers in `staticwebapp.config.json`

### Issue: Version Not Incrementing
**Solution**: Verify git configuration in GitHub Actions

### Issue: Build Failures
**Solution**: Check environment variables and dependencies

### Issue: Azure Deployment Errors
**Solution**: Validate `AZURE_STATIC_WEB_APPS_API_TOKEN` secret

## Future Enhancements

### Planned Features
- Branch-specific deployments for testing
- Automated rollback on deployment failures
- Performance monitoring integration
- A/B testing deployment strategies

### Consideration Areas
- Blue-green deployment strategy
- Database migration coordination
- API versioning alignment
- Multi-environment deployment pipeline
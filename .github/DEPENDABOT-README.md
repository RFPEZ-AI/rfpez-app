# Dependabot Configuration and Troubleshooting

## Overview
This document explains the Dependabot setup for RFPEZ.AI and how to resolve common Dependabot errors.

## Configuration Files

### `.github/dependabot.yml`
Configures automated dependency updates for:
- **npm dependencies** (weekly updates on Mondays)
- **GitHub Actions** (monthly updates)

Key features:
- Groups minor/patch updates to reduce PR noise
- Ignores major version updates for critical packages (React, TypeScript, Ionic)
- Automatically labels PRs for easy filtering
- Limits open PRs to prevent overwhelming the review queue

## Common Issues and Solutions

### Issue #1242359412: Dependabot Update Error for jsonpath

**Problem:**
```
Error: The updater encountered one or more errors.
Dependabot encountered an error performing the update
npm_and_yarn in / for jsonpath - Update #1242359412
```

**Root Cause:**
1. `jsonpath` is a **transitive dependency** (not directly in package.json)
2. Dependency chain: `react-scripts@5.0.1` → `bfj@7.1.0` → `jsonpath@1.1.1`
3. Dependabot tried to update it but encountered permission/access issues with GitHub Actions workflows

**Solution Applied:**

#### 1. Created Dependabot Configuration (`.github/dependabot.yml`)
- Enables proper Dependabot integration
- Configures update frequency and grouping
- Sets up PR labels and commit message conventions

#### 2. Fixed Workflow Permissions
Added skip conditions to deployment workflows to prevent them from running on Dependabot PRs:

**Modified Workflows:**
- `.github/workflows/deploy-migrations.yml`
- `.github/workflows/deploy-edge-functions.yml`
- `.github/workflows/dev.rfpez.ai-deployment.yml` (already fixed)

**Skip Condition Added:**
```yaml
jobs:
  deploy-migrations:
    # Skip deployment for Dependabot PRs (Dependabot doesn't have access to secrets)
    if: github.actor != 'dependabot[bot]'
    runs-on: ubuntu-latest
```

**Why This Works:**
- Dependabot PRs don't have access to repository secrets (SUPABASE_ACCESS_TOKEN, etc.)
- Deployment workflows require these secrets to function
- Skipping deployment for Dependabot PRs prevents workflow failures
- Dependabot can still create PRs for dependency updates
- Deployment workflows run normally for human-initiated commits

#### 3. Handling Transitive Dependencies

**Current State:**
- `jsonpath@1.1.1` comes from `react-scripts` (can't be directly updated)
- Dependabot will track it and notify when `react-scripts` updates include newer jsonpath

**Manual Update Option (if needed):**
```bash
# Option 1: Update react-scripts (may include jsonpath update)
npm update react-scripts

# Option 2: Add resolution/override (use cautiously)
# Add to package.json:
"overrides": {
  "jsonpath": "^1.1.1"  # or newer version
}

# Option 3: Wait for react-scripts to update its dependencies
# This is the recommended approach for transitive dependencies
```

## Dependabot Workflow

### Automatic Updates
1. **Weekly (Mondays 9 AM ET)**: Dependabot checks for npm dependency updates
2. **Monthly (1st Monday)**: Dependabot checks for GitHub Actions updates
3. **On Detection**: Creates PRs with grouped updates
4. **Auto-labels**: Adds `dependencies` and `automated` labels

### PR Review Process
1. Review the Dependabot PR for breaking changes
2. Check the changelog/release notes
3. Run tests locally: `npm test -- --watchAll=false`
4. Approve and merge if tests pass
5. Deployment workflows will run automatically (skipped for Dependabot actor)

### Updating Dependabot Configuration

To modify update frequency or package ignore list:
```bash
# Edit the configuration
code .github/dependabot.yml

# Commit and push
git add .github/dependabot.yml
git commit -m "chore: Update Dependabot configuration"
git push origin master
```

## Security Updates

Dependabot also monitors for security vulnerabilities:
- **Automatic**: Creates PRs for security updates immediately
- **Priority**: Security PRs are labeled with `security`
- **Action Required**: Review and merge security updates ASAP

## Monitoring Dependabot

### GitHub UI
1. Go to repository **Insights** → **Dependency graph** → **Dependabot**
2. View open/closed Dependabot PRs
3. Check security alerts and advisories

### CLI Check
```bash
# View Dependabot PRs
gh pr list --label dependencies

# View specific Dependabot PR
gh pr view <PR_NUMBER>

# Check for security vulnerabilities
npm audit
```

## Troubleshooting

### Dependabot PR Failing Checks
**Symptom:** Deployment workflow fails on Dependabot PR

**Solution:** Ensure workflow has skip condition:
```yaml
if: github.actor != 'dependabot[bot]'
```

### Dependabot Not Creating PRs
**Checks:**
1. Verify `.github/dependabot.yml` exists and is valid
2. Check repository settings: Settings → Code security → Dependabot
3. Ensure Dependabot is enabled for the repository
4. Check open PR limit hasn't been reached

### Conflicting Dependabot PRs
**Solution:**
1. Close older conflicting PRs
2. Dependabot will rebase and update the remaining PR
3. Alternatively, use `@dependabot rebase` comment

### Manual Dependabot Commands
Comment on Dependabot PRs with:
- `@dependabot rebase` - Rebase the PR
- `@dependabot recreate` - Recreate the PR
- `@dependabot merge` - Merge when checks pass
- `@dependabot cancel merge` - Cancel auto-merge
- `@dependabot close` - Close the PR
- `@dependabot ignore this dependency` - Stop updates for this dependency
- `@dependabot ignore this major version` - Ignore major version updates

## Best Practices

### Dependency Update Strategy
1. **Patch updates**: Auto-merge if tests pass (low risk)
2. **Minor updates**: Review changelog, test locally before merging
3. **Major updates**: Careful review, check breaking changes, extensive testing
4. **Security updates**: Priority merge, test in dev environment if possible

### Ignored Packages
Major version updates are ignored for:
- `react` / `react-dom` - Core framework changes
- `react-scripts` - Build system changes
- `typescript` - Language features/syntax changes
- `@ionic/react` - UI framework changes

**Reason:** These require careful testing and may need code refactoring

### Group Updates
Dependabot groups updates to reduce PR noise:
- **Development dependencies**: Minor + patch grouped together
- **Production dependencies**: Only patch versions grouped

## Related Files
- `.github/dependabot.yml` - Main configuration
- `.github/workflows/deploy-migrations.yml` - Migration deployment (Dependabot-aware)
- `.github/workflows/deploy-edge-functions.yml` - Edge function deployment (Dependabot-aware)
- `.github/workflows/dev.rfpez.ai-deployment.yml` - Azure deployment (Dependabot-aware)
- `package.json` - Dependency declarations with overrides/resolutions

## References
- [Dependabot Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [About Dependabot Version Updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates)
- [Dependabot Commands](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates#managing-dependabot-pull-requests-with-comment-commands)

# Quick Deployment Reference

## Common Commands

### Version Management
```bash
# Automatic patch increment and deploy
git push origin master

# Manual version bumps
npm run version:patch     # 1.2.0 → 1.2.1 (bug fixes)
npm run version:minor     # 1.2.0 → 1.3.0 (new features)  
npm run version:major     # 1.2.0 → 2.0.0 (breaking changes)

# Quick build and deploy
npm run build:deploy
```

### Development Workflow
```bash
# Local development
npm run start:dev         # Frontend + API server
npm start                 # Frontend only
npm run build            # Test production build

# Testing
npm test                 # Run test suite
npm run test:coverage    # Coverage report
```

### Deployment Pipeline
1. **Make changes** → Edit code
2. **Test locally** → `npm run build`
3. **Commit changes** → `git add . && git commit -m "description"`
4. **Deploy** → `git push origin master`
5. **Monitor** → Check GitHub Actions
6. **Verify** → Test PWA update on device

## Version Display Matrix

| Environment | Version Display | When You'll See It |
|-------------|----------------|-------------------|
| Local Dev | `v1.2.0 PWA` | Running `npm start` |
| Local Build | `v1.2.0 PWA` | Running `npm run build` |
| GitHub Actions | `v1.2.1.47 (abc1234) PWA` | After deployment |
| Production PWA | `v1.2.1.47 (abc1234) PWA` | On live website |

## PWA Update Testing Checklist

- [ ] Deploy new version
- [ ] Wait 2-5 minutes for build completion
- [ ] Open PWA on Android device
- [ ] Switch to another app, then back
- [ ] Look for update notification toast
- [ ] Tap "Update" button
- [ ] Verify new version number appears
- [ ] Check console logs (if debugging enabled)

## Troubleshooting Quick Fixes

### PWA Not Updating
```bash
# Check if service worker is cached
# Open DevTools → Application → Service Workers
# Click "Update" or "Unregister"
```

### Build Failing
```bash
# Check GitHub Actions logs
# Common fixes:
npm run build            # Test locally first
npm ci                   # Clean install
git status               # Check for uncommitted files
```

### Version Not Showing
```bash
# Verify in HomeHeader.tsx:
# 1. packageJson import is working
# 2. versionDisplay logic is correct
# 3. Environment variables are set in GitHub Actions
```

## Emergency Procedures

### Rollback Deployment
1. Find last good commit: `git log --oneline`
2. Revert: `git revert <commit-hash>`
3. Push: `git push origin master`

### Force PWA Update
1. Open PWA in browser
2. DevTools → Application → Service Workers
3. Click "Update" button
4. Or clear all site data

### Manual Version Fix
```bash
# If auto-increment breaks:
npm version 1.2.3 --no-git-tag-version
git add package.json package-lock.json  
git commit -m "Fix version to 1.2.3"
git push origin master
```
# Test Automation Migration

## Overview

The test automation framework has been moved to a separate repository for better organization and scalability.

## Migration Details

- **Date**: December 2024
- **From**: `rfpez-app/test-automation/`
- **To**: `rfpez-test-automation` (separate repository)

## New Repository

**Repository**: `rfpez-test-automation`
**Location**: [rfpez-test-automation](https://github.com/markesphere/rfpez-test-automation)

## What Was Moved

- LED bulb procurement test suite
- Agent integration tests
- Test configuration files
- Test utilities and shared components
- Test documentation

## Benefits of Separation

1. **Independent Development**: Test automation can evolve without affecting main application
2. **Scalability**: Test repository can grow significantly without impacting main repo size
3. **Team Organization**: QA team can work independently on test automation
4. **Deployment Flexibility**: Tests can be run in different environments
5. **Version Control**: Independent versioning for test automation framework

## Integration

The test automation still integrates with the main application through:

- **API Server**: Tests communicate with `api-server/index.js` on port 3001
- **Health Endpoint**: `/health` for connectivity checks
- **Agent Endpoint**: `/api/agent/prompt` for test execution

## Quick Start

```bash
# Clone test automation repository
git clone https://github.com/markesphere/rfpez-test-automation.git
cd rfpez-test-automation

# Setup and run tests
npm run setup
npm run test:led-bulb
```

## Documentation

- **Integration Guide**: `rfpez-test-automation/docs/integration-guide.md`
- **Quick Reference**: `rfpez-test-automation/docs/quick-reference.md`
- **Main README**: `rfpez-test-automation/README.md`

## CI/CD Integration

The main application's CI/CD pipeline can optionally integrate with the test automation repository for comprehensive testing. See the integration guide for GitHub Actions examples.

---

For questions about test automation, please refer to the `rfpez-test-automation` repository.

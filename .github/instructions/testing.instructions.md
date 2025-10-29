---
applyTo: '**/*.{test.ts,test.tsx,spec.ts,spec.tsx}'
description: Testing patterns, conventions, and best practices for RFPEZ.AI
---

# RFPEZ.AI Testing Instructions

## Testing Patterns

### Component Testing
- Custom render wrapper in `src/test-utils.tsx` with SupabaseProvider
- Mock Supabase client for unit tests
- Async components wrapped in `act()` for proper testing
- Console filtering for expected warnings in `setupTests.ts`

### Expected Behaviors
- Console warnings for Ionic/Stencil components are expected
- Use `test-utils.tsx` render wrapper for component tests
- VS Code tasks available for automated test execution

## Test Automation Integration
- Separate repository: `rfpez-test-automation` for comprehensive testing
- LED bulb procurement test suite validates end-to-end RFP workflows
- MCP integration testing with browser automation
- Health check utilities for API server validation
- Cross-project test execution via VS Code tasks

## VS Code Task Management for Testing

### Primary Testing Tasks (Ctrl+Shift+P → Tasks: Run Task)
- **"Run Tests (Watch Mode)"** - Auto-running Jest tests - BACKGROUND TASK
- **"Run Tests (Single Run)"** - One-time test execution
- **"Run Tests with Coverage"** - Generate coverage reports
- **"Test MCP Connection"** - Validate MCP integration
- **"Run Edge Function Tests"** - Test edge functions
- **"Run Edge Function Tests (Watch Mode)"** - Auto-running edge function tests

### Command Line Testing (Acceptable Usage)
```bash
# Testing patterns (OK for one-time commands)
npm test           # For single test runs (use task for watch mode)
npm run test:coverage  # Coverage reports

# Edge Function Testing
deno test --allow-all tests/  # Run edge function tests
```

## Testing Best Practices

### Unit Testing
- Mock external dependencies (Supabase, Claude API)
- Test components in isolation
- Use descriptive test names
- Cover edge cases and error scenarios

### Integration Testing
- Test component interactions
- Verify data flow between services
- Test API integrations with mocked responses

### E2E Testing
- Use Chrome MCP for browser automation (see chrome-mcp-testing.instructions.md)
- Test complete user workflows
- Validate multi-step processes
- Use `data-testid` attributes for element selection

## Pre-Commit Testing Checklist
- ✅ All unit tests passing
- ✅ Edge function tests passing
- ✅ No linting errors
- ✅ Coverage maintained or improved
- ✅ Integration tests passing

## Test File Organization
- Place temporary test files in `/temp` folder
- Unit tests co-located with source files
- Integration tests in `/tests` directory
- E2E tests in separate `rfpez-test-automation` repository

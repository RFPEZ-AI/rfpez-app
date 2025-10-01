# Claude API v3 Edge Function - Modular Architecture

This directory contains the refactored Claude API v3 edge function, broken down into a modular architecture for better maintainability, testing, and development.

## Architecture Overview

The original monolithic 1,543-line `index.ts` file has been refactored into the following modular structure:

```
claude-api-v3/
├── index.ts              # Main entry point (current implementation)
├── config.ts             # Environment configuration and Supabase setup
├── types.ts              # TypeScript interface definitions
├── deno.json             # Deno configuration with test tasks
├── run-tests.sh          # Linux/Mac test runner
├── run-tests.bat         # Windows test runner
├── auth/
│   └── auth.ts          # Authentication utilities
├── handlers/
│   └── http.ts          # HTTP request handlers
├── services/
│   └── claude.ts        # Claude API service integration
├── tools/
│   ├── definitions.ts   # Tool definitions for Claude API
│   └── database.ts      # Database operation tools
├── utils/
│   ├── mapping.ts       # Data mapping utilities
│   └── timeout.ts       # Database timeout utilities
├── tests/
│   ├── test-utils.ts            # Test utilities and helpers
│   ├── http-handlers.test.ts     # HTTP handler tests
│   ├── claude-service.test.ts    # Claude API service tests
│   ├── utilities.test.ts         # Utility function tests
│   └── mocks/
│       └── responses.ts          # Mock response data
└── README.md            # This documentation
```

## Module Responsibilities

### Core Files

- **`index-modular.ts`**: Main entry point that routes requests to appropriate handlers
- **`config.ts`**: Environment validation, Supabase client setup, CORS headers, default parameters
- **`types.ts`**: TypeScript interfaces for events, responses, and data structures

### Authentication (`auth/`)

- **`auth.ts`**: User authentication, Supabase client creation with user context, token validation

### Request Handling (`handlers/`)

- **`http.ts`**: HTTP request routing, CORS handling, request/response processing, error handling

### Services (`services/`)

- **`claude.ts`**: Claude API integration, tool execution orchestration, streaming support (future)

### Tools (`tools/`)

- **`definitions.ts`**: Claude API tool definitions, input validation schemas
- **`database.ts`**: Database operations (create artifacts, store messages, session management)

### Utilities (`utils/`)

- **`mapping.ts`**: Data transformation utilities, artifact role mapping, message format conversion
- **`timeout.ts`**: Database connection and query timeout management

## Key Improvements

### 1. Separation of Concerns
- Each module has a single, well-defined responsibility
- Database operations are isolated from API logic
- Authentication is centralized and reusable

### 2. Better Error Handling
- Consistent error patterns across modules
- Proper TypeScript error typing
- Centralized error response formatting

### 3. Maintainability
- Smaller, focused files are easier to understand and modify
- Clear module boundaries make testing easier
- Import/export structure shows dependencies clearly

### 4. Artifact Role Mapping Fix
The `utils/mapping.ts` module includes the crucial `mapArtifactRole` function that resolves database constraint violations:

```typescript
// Maps vendor/supplier response forms to valid 'bid_form' constraint
'vendor_response_form': 'bid_form',
'supplier_response_form': 'bid_form',
// ... other mappings
```

## Migration Strategy

### Phase 1: Modular Structure (Current)
- ✅ Create modular file structure
- ✅ Extract core functionality into modules
- ✅ Maintain compatibility with existing API

### Phase 2: Testing & Validation
- [ ] Deploy modular version alongside original
- [ ] Run comprehensive tests comparing outputs
- [ ] Validate all tool executions work correctly

### Phase 3: Deployment
- [ ] Switch main `index.ts` to import from modular structure
- [ ] Monitor for any breaking changes
- [ ] Remove original monolithic code after validation

## Usage

### Current (Original)
The original `index.ts` file remains unchanged and functional.

### New (Modular)
To use the modular version, rename `index-modular.ts` to `index.ts` or update the import structure in the main `index.ts` file.

## Testing

### Test Suite Overview

The edge function includes a comprehensive test suite using Deno's built-in testing framework:

#### Test Files
- **`tests/http-handlers.test.ts`**: Tests for HTTP request handling, CORS, authentication, and routing
- **`tests/claude-service.test.ts`**: Tests for Claude API integration, tool execution, and streaming
- **`tests/utilities.test.ts`**: Tests for utility functions, mapping, timeout handling, and configuration

#### Test Utilities
- **`tests/test-utils.ts`**: Mock helpers for Supabase client, HTTP requests, and streaming responses
- **`tests/mocks/responses.ts`**: Mock data for Claude API responses and database operations

### Running Tests

#### Quick Start
```bash
# Linux/Mac
chmod +x run-tests.sh
./run-tests.sh

# Windows
run-tests.bat
```

#### Manual Commands
```bash
# Run all tests
deno test --allow-net --allow-env --allow-read tests/

# Run specific test file
deno test --allow-net --allow-env --allow-read tests/http-handlers.test.ts

# Run with coverage
deno test --allow-net --allow-env --allow-read --coverage=coverage tests/
deno coverage coverage

# Watch mode (re-run tests on file changes)
deno test --allow-net --allow-env --allow-read --watch tests/
```

#### Deno Tasks (from deno.json)
```bash
deno task test          # Run all tests
deno task test:watch    # Run tests in watch mode
deno task test:coverage # Run tests with coverage
deno task coverage      # Generate coverage report
```

### VS Code Integration

**Automated Testing Tasks** - Access via `Ctrl+Shift+P` → "Tasks: Run Task":

- **Run Edge Function Tests** - Execute all tests once with proper environment setup
- **Run Edge Function Tests (Watch Mode)** - Continuous testing with file watching for development
- **Run Edge Function Tests with Coverage** - Generate comprehensive test coverage reports
- **Test Specific Edge Function File** - Run individual test files (utilities, http-handlers, claude-service)
- **Generate Coverage Report** - Create HTML coverage report after running coverage tests

**Quick Access**: Terminal → Run Task → Select Edge Function test task

**Features**:
- Automatic environment variable setup (no manual configuration needed)
- Proper TypeScript type checking during test execution
- Integrated problem detection and error reporting
- Background/watch mode for continuous development
- Coverage report generation with HTML output

### Test Coverage

The test suite covers:

✅ **HTTP Handlers**
- OPTIONS and POST request handling
- CORS header validation
- Authentication and authorization
- Request validation and error handling
- Streaming and non-streaming responses

✅ **Claude API Service**
- Message sending with and without tools
- Streaming response handling
- Error handling and timeout management
- Tool execution and result processing

✅ **Utilities**
- Data mapping and transformation
- Timeout and database query wrapping
- Authentication token validation
- Configuration and environment setup

### Continuous Integration

Tests are designed to run in CI/CD environments with:
- No external dependencies required
- Mock implementations for all external services
- Environment variable configuration for test mode
- Comprehensive error case coverage

## Development Benefits

1. **Easier Debugging**: Issues can be isolated to specific modules
2. **Better Testing**: Individual modules can be unit tested with comprehensive coverage
3. **Improved Collaboration**: Multiple developers can work on different modules
4. **Future Extensions**: New tools and features can be added as separate modules
5. **Code Reusability**: Modules can be reused in other edge functions
6. **Quality Assurance**: Automated testing ensures reliability and prevents regressions

## TypeScript Considerations

Some import paths show TypeScript errors in VS Code due to Deno's URL-based import system, but these work correctly in the Supabase Edge Function runtime environment. The modular structure maintains full type safety and proper error handling.

## Next Steps

1. **Deploy and Test**: Deploy the modular version and run comprehensive tests
2. **Performance Validation**: Ensure no performance regression from modularization
3. **Documentation**: Update API documentation to reflect modular architecture
4. **Monitoring**: Set up monitoring to track module-level performance metrics

This modular architecture addresses the maintainability concerns of the original 1,543-line file while preserving all existing functionality and fixing the artifact role mapping issue.
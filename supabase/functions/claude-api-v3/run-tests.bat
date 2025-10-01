@echo off
REM Copyright Mark Skiba, 2025 All rights reserved
REM Test runner script for Claude API v3 Edge Function (Windows)

echo 🧪 Running Claude API v3 Edge Function Tests
echo =============================================

REM Set test environment variables
set CLAUDE_API_KEY=test-api-key
set SUPABASE_URL=https://test.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=test-service-role-key

REM Run tests with Deno
echo 📋 Running all tests...
deno test --allow-net --allow-env --allow-read tests/

echo.
echo 📊 Running tests with coverage...
deno test --allow-net --allow-env --allow-read --coverage=coverage tests/

echo.
echo 📈 Generating coverage report...
deno coverage coverage

echo.
echo ✅ All tests completed!
echo.
echo 📁 Test files:
echo   - tests/http-handlers.test.ts    - HTTP request/response handling
echo   - tests/claude-service.test.ts   - Claude API integration
echo   - tests/utilities.test.ts        - Utility functions
echo.
echo 🔧 Test utilities:
echo   - tests/test-utils.ts            - Test helpers and mocks
echo   - tests/mocks/responses.ts       - Mock response data
echo.
echo 💡 To run specific tests:
echo   deno test --allow-net --allow-env --allow-read tests/http-handlers.test.ts
echo   deno test --allow-net --allow-env --allow-read tests/claude-service.test.ts
echo   deno test --allow-net --allow-env --allow-read tests/utilities.test.ts

pause
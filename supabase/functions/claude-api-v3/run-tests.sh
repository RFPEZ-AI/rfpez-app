#!/usr/bin/env bash
# Copyright Mark Skiba, 2025 All rights reserved
# Test runner script for Claude API v3 Edge Function

set -e  # Exit on any error

echo "🧪 Running Claude API v3 Edge Function Tests"
echo "============================================="

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Set test environment variables
export CLAUDE_API_KEY="test-api-key"
export SUPABASE_URL="https://test.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"

# Run tests with Deno (ignoring resource leaks in test environment)
echo "📋 Running all tests..."
deno test --allow-net --allow-env --allow-read --no-check --unstable tests/

echo ""
# Run tests with coverage (ignoring resource leaks in test environment)
echo "📊 Running tests with coverage..."
deno test --allow-net --allow-env --allow-read --no-check --unstable --coverage=coverage/ tests/

echo ""
echo "📈 Generating coverage report..."
deno coverage coverage

echo ""
echo "✅ All tests completed!"
echo ""
echo "📁 Test files:"
echo "  - tests/http-handlers.test.ts    - HTTP request/response handling"
echo "  - tests/claude-service.test.ts   - Claude API integration"
echo "  - tests/utilities.test.ts        - Utility functions"
echo ""
echo "🔧 Test utilities:"
echo "  - tests/test-utils.ts            - Test helpers and mocks"
echo "  - tests/mocks/responses.ts       - Mock response data"
echo ""
echo "💡 To run specific tests:"
echo "  deno test --allow-net --allow-env --allow-read tests/http-handlers.test.ts"
echo "  deno test --allow-net --allow-env --allow-read tests/claude-service.test.ts"
echo "  deno test --allow-net --allow-env --allow-read tests/utilities.test.ts"
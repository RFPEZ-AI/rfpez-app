#!/usr/bin/env bash
# Copyright Mark Skiba, 2025 All rights reserved
# Test runner script for Claude API v3 Edge Function

set -e  # Exit on any error

echo "🧪 Running Claude API v3 Edge Function Tests"
echo "============================================="

# Ensure we're in the correct directory
cd "$(dirname "$0")"

## Set test environment variables (prefer local Supabase when available)
export CLAUDE_API_KEY="test-api-key"

# Prefer local Supabase (127.0.0.1:54321) for tests to avoid DNS resolution against test.supabase.co
if [ -z "${SUPABASE_URL}" ]; then
	export SUPABASE_URL="http://127.0.0.1:54321"
fi

# Try to read service role key from repo supabase/.env if not already set
if [ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]; then
	if [ -f "../.env" ]; then
		# Look for DATABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY
		SERVICE_KEY=$(grep -E "^(DATABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)=" ../.env | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "\r") || true
		if [ -n "$SERVICE_KEY" ]; then
			export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
		else
			export SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"
		fi
	else
		export SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"
	fi
fi

# Ensure ANTHROPIC_API_KEY is set for tests (use test value if not provided)
if [ -z "${ANTHROPIC_API_KEY}" ] && [ -z "${CLAUDE_API_KEY}" ]; then
	export ANTHROPIC_API_KEY="test-api-key"
fi

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
// Copyright Mark Skiba, 2025 All rights reserved
// Test runner with proper environment setup

// Set up test environment BEFORE any imports
// Respect existing environment variables; provide safe local defaults for tests
if (!Deno.env.get('CLAUDE_API_KEY')) {
	Deno.env.set('CLAUDE_API_KEY', 'test-api-key');
}
// Prefer local Supabase for tests if not explicitly set
if (!Deno.env.get('SUPABASE_URL')) {
	Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321');
}
if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
	Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
}
if (!Deno.env.get('CLAUDE_MODEL')) {
	Deno.env.set('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022');
}
if (!Deno.env.get('CLAUDE_MAX_TOKENS')) {
	Deno.env.set('CLAUDE_MAX_TOKENS', '4096');
}

// Now run the tests
import "std/testing/bdd.ts";

// Ensure test environment is initialized (mocks, env defaults) before loading tests
import { setupTestEnvironment } from "./tests/test-utils.ts";
setupTestEnvironment();

// Import all test files
import "./tests/utilities.test.ts";
import "./tests/http-handlers.test.ts";  
import "./tests/claude-service.test.ts";

console.log("✅ All test files loaded successfully!");
// Copyright Mark Skiba, 2025 All rights reserved
// Test runner with proper environment setup

// Set up test environment BEFORE any imports
Deno.env.set('CLAUDE_API_KEY', 'test-api-key');
Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
Deno.env.set('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022');
Deno.env.set('CLAUDE_MAX_TOKENS', '4096');

// Now run the tests
import "std/testing/bdd.ts";

// Import all test files
import "./tests/utilities.test.ts";
import "./tests/http-handlers.test.ts";  
import "./tests/claude-service.test.ts";

console.log("✅ All test files loaded successfully!");
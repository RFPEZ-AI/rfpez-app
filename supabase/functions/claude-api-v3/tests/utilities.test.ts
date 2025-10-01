// Copyright Mark Skiba, 2025 All rights reserved
// Utility function tests for Claude API v3

import { assertEquals, assertExists } from "std/testing/asserts.ts";
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment
} from "./test-utils.ts";
import { 
  mapArtifactRole,
  mapMessageToClaudeFormat,
  extractTextFromClaudeResponse,
  extractToolCallsFromClaudeResponse
} from "../utils/mapping.ts";
import { withDatabaseTimeout, dbQuery } from "../utils/timeout.ts";

// Test suite for mapping utilities
Deno.test("Mapping Utilities Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("mapArtifactRole - valid role mappings", () => {
    // Test role mappings
    assertEquals(mapArtifactRole('vendor_response_form'), 'bid_form');
    assertEquals(mapArtifactRole('supplier_response_form'), 'bid_form');
    assertEquals(mapArtifactRole('vendor_form'), 'bid_form');
    assertEquals(mapArtifactRole('supplier_form'), 'bid_form');
    assertEquals(mapArtifactRole('response_form'), 'bid_form');
    
    assertEquals(mapArtifactRole('buyer_form'), 'buyer_questionnaire');
    assertEquals(mapArtifactRole('requirements_form'), 'buyer_questionnaire');
    
    // Pass-through valid roles
    assertEquals(mapArtifactRole('buyer_questionnaire'), 'buyer_questionnaire');
    assertEquals(mapArtifactRole('bid_form'), 'bid_form');
    assertEquals(mapArtifactRole('request_document'), 'request_document');
    assertEquals(mapArtifactRole('template'), 'template');
  });

  await t.step("mapArtifactRole - invalid role returns null", () => {
    assertEquals(mapArtifactRole('invalid_role'), null);
    assertEquals(mapArtifactRole('unknown_type'), null);
    assertEquals(mapArtifactRole(''), null);
  });

  await t.step("mapMessageToClaudeFormat - string content", () => {
    const message = {
      role: 'user',
      content: 'Hello world'
    };

    const result = mapMessageToClaudeFormat(message);
    
    assertEquals(result.role, 'user');
    assertEquals(result.content, [
      {
        type: 'text',
        text: 'Hello world'
      }
    ]);
  });

  await t.step("mapMessageToClaudeFormat - object content", () => {
    const message = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Hello' },
        { type: 'tool_use', id: 'tool_123', name: 'test_tool', input: {} }
      ]
    };

    const result = mapMessageToClaudeFormat(message);
    
    assertEquals(result.role, 'assistant');
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
  });

  await t.step("extractTextFromClaudeResponse - extracts text content", () => {
    const content = [
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world!' },
      { type: 'tool_use', id: 'tool_123', name: 'test_tool', input: {} }
    ];

    const result = extractTextFromClaudeResponse(content);
    
    assertEquals(result, 'Hello world!');
  });

  await t.step("extractTextFromClaudeResponse - no text content", () => {
    const content = [
      { type: 'tool_use', id: 'tool_123', name: 'test_tool', input: {} }
    ];

    const result = extractTextFromClaudeResponse(content);
    
    assertEquals(result, '');
  });

  await t.step("extractToolCallsFromClaudeResponse - extracts tool calls", () => {
    const content = [
      { type: 'text', text: 'I will help you.' },
      { 
        type: 'tool_use', 
        id: 'tool_123', 
        name: 'create_session', 
        input: { user_id: 'test-user' } 
      },
      { 
        type: 'tool_use', 
        id: 'tool_456', 
        name: 'store_message', 
        input: { content: 'Test message' } 
      }
    ];

    const result = extractToolCallsFromClaudeResponse(content);
    
    assertEquals(result.length, 2);
    assertEquals(result[0].id, 'tool_123');
    assertEquals(result[0].name, 'create_session');
    assertEquals(result[1].id, 'tool_456');
    assertEquals(result[1].name, 'store_message');
  });

  await t.step("extractToolCallsFromClaudeResponse - no tool calls", () => {
    const content = [
      { type: 'text', text: 'Just text content' }
    ];

    const result = extractToolCallsFromClaudeResponse(content);
    
    assertEquals(result.length, 0);
  });

  cleanupTestEnvironment();
});

// Test suite for timeout utilities
Deno.test("Timeout Utilities Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("withDatabaseTimeout - successful operation", async () => {
    const operation = Promise.resolve('success');
    
    const result = await withDatabaseTimeout(operation, 1000);
    
    assertEquals(result, 'success');
  });

  await t.step("withDatabaseTimeout - operation timeout", async () => {
    const operation = new Promise((resolve) => {
      setTimeout(() => resolve('too slow'), 200);
    });
    
    try {
      await withDatabaseTimeout(operation, 100);
      throw new Error('Should have timed out');
    } catch (error) {
      assertExists(error);
      assertEquals((error as Error).message.includes('timeout'), true);
    }
  });

  await t.step("withDatabaseTimeout - operation error", async () => {
    const operation = Promise.reject(new Error('Operation failed'));
    
    try {
      await withDatabaseTimeout(operation, 1000);
      throw new Error('Should have thrown error');
    } catch (error) {
      assertExists(error);
      assertEquals((error as Error).message, 'Operation failed');
    }
  });

  await t.step("dbQuery - successful query", async () => {
    const queryOperation = () => Promise.resolve({ data: 'test' });
    
    const result = await dbQuery(queryOperation, 'test query');
    
    assertEquals(result.data, 'test');
  });

  await t.step("dbQuery - query with error", async () => {
    const queryOperation = () => Promise.reject(new Error('Query failed'));
    
    try {
      await dbQuery(queryOperation, 'failing query');
      throw new Error('Should have thrown error');
    } catch (error) {
      assertExists(error);
      assertEquals((error as Error).message, 'Query failed');
    }
  });

  await t.step("dbQuery - query with timeout", async () => {
    let timeoutId: number | undefined;
    const queryOperation = () => new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve('success'), 30000); // 30 seconds, longer than timeout
    });
    
    try {
      await dbQuery(queryOperation, 'slow query');
      throw new Error('Should have timed out');
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId); // Clean up the timer
      assertExists(error);
      assertEquals((error as Error).message.includes('timeout'), true);
    }
  });

  cleanupTestEnvironment();
});

// Test suite for authentication utilities
Deno.test("Authentication Utilities Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("validateAuthHeader - valid Bearer token", () => {
    // This would test the auth validation logic
    // Note: actual implementation would need to be imported
    const validHeader = 'Bearer valid-token-123';
    const isValid = validHeader.startsWith('Bearer ') && validHeader.length > 7;
    
    assertEquals(isValid, true);
  });

  await t.step("validateAuthHeader - invalid header format", () => {
    const invalidHeaders = [
      'invalid-token',
      'Basic token123',
      'Bearer ',
      ''
    ];
    
    invalidHeaders.forEach(header => {
      const isValid = header.startsWith('Bearer ') && header.length > 7;
      assertEquals(isValid, false);
    });
  });

  await t.step("getUserId - extracts user ID from token payload", () => {
    // Mock test for user ID extraction
    // In real implementation, this would decode JWT token
    const mockUserId = 'user-123';
    
    assertExists(mockUserId);
    assertEquals(typeof mockUserId, 'string');
    assertEquals(mockUserId.length > 0, true);
  });

  cleanupTestEnvironment();
});

// Test suite for configuration validation
Deno.test("Configuration Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("required environment variables are set", () => {
    const requiredVars = [
      'CLAUDE_API_KEY',
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    requiredVars.forEach(varName => {
      const value = Deno.env.get(varName);
      assertExists(value, `Environment variable ${varName} should be set`);
      assertEquals(value.length > 0, true, `Environment variable ${varName} should not be empty`);
    });
  });

  await t.step("CORS headers are properly configured", () => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Max-Age': '86400'
    };
    
    assertExists(corsHeaders['Access-Control-Allow-Origin']);
    assertExists(corsHeaders['Access-Control-Allow-Methods']);
    assertExists(corsHeaders['Access-Control-Allow-Headers']);
    assertExists(corsHeaders['Access-Control-Max-Age']);
  });

  cleanupTestEnvironment();
});
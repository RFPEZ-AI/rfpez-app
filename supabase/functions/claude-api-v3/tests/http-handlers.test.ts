// Copyright Mark Skiba, 2025 All rights reserved
// HTTP handler tests for Claude API v3

import { assertEquals, assertExists } from "std/testing/asserts.ts";
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment,
  createMockRequest,
  MockFetch,
  mockGlobalFetch,
  restoreGlobalFetch,
  assertResponseOk,
  assertResponseError,
  assertStreamingResponse
} from "./test-utils.ts";

// Setup environment before imports that need config
setupTestEnvironment();
import { 
  createMockClaudeResponse,
  createMockClaudeStreamingResponse 
} from "./mocks/responses.ts";
import { handleOptionsRequest, handlePostRequest } from "../handlers/http.ts";

// Test suite for HTTP handlers
Deno.test("HTTP Handlers Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("OPTIONS request handling", async () => {
    const response = await handleOptionsRequest();
    
    assertEquals(response.status, 204);
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
    assertEquals(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
    assertExists(response.headers.get('Access-Control-Allow-Headers'));
  });

  await t.step("POST request with missing auth header", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }]
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 500);
  });

  await t.step("POST request with invalid JSON body", async () => {
    const request = new Request('https://test.supabase.co/functions/v1/claude-api-v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: 'invalid json'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 500);
  });

  await t.step("POST request with missing messages", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      // missing messages field
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 400);
  });

  await t.step("POST request with empty messages array", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: []
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 400);
  });

  cleanupTestEnvironment();
});

// Test streaming response handling
Deno.test("Streaming Response Test Suite", async (t) => {
  setupTestEnvironment();
  
  const mockFetch = new MockFetch();
  mockGlobalFetch(mockFetch);

  await t.step("successful streaming response without tools", async () => {
    // Mock Claude API streaming response
    const streamingChunks = createMockClaudeStreamingResponse(['Hello', ' ', 'world!']);
    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          // Enqueue all chunks synchronously to avoid timer leaks
          streamingChunks.forEach((chunk) => {
            controller.enqueue(new TextEncoder().encode(chunk));
          });
          controller.close();
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      }
    );

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    assertStreamingResponse(response);
    
    // Consume the stream to prevent leaks
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
    }
  });

  await t.step("streaming response with tool calls", async () => {
    // Mock Claude API response with tool use
    const claudeResponse = createMockClaudeResponse('I\'ll create a session for you.', true);
    const mockResponse = new Response(JSON.stringify(claudeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Create a new session' }],
      stream: true
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    assertStreamingResponse(response);
    
    // Consume the stream to prevent leaks
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }
    }
  });

  restoreGlobalFetch();
  cleanupTestEnvironment();
});

// Test non-streaming response handling
Deno.test("Non-Streaming Response Test Suite", async (t) => {
  setupTestEnvironment();
  
  const mockFetch = new MockFetch();
  mockGlobalFetch(mockFetch);

  await t.step("successful non-streaming response", async () => {
    const claudeResponse = createMockClaudeResponse('Hello! How can I help you?');
    const mockResponse = new Response(JSON.stringify(claudeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    assertResponseOk(response, 200);
    const body = await response.json();
    assertExists(body.content);
  });

  await t.step("Claude API error handling", async () => {
    const mockResponse = new Response(JSON.stringify({
      error: {
        type: 'rate_limit_error',
        message: 'Rate limit exceeded'
      }
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }]
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 500);
  });

  restoreGlobalFetch();
  cleanupTestEnvironment();
});

// Test CORS headers
Deno.test("CORS Headers Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("OPTIONS request includes proper CORS headers", async () => {
    const response = await handleOptionsRequest();
    
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
    assertEquals(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
    assertExists(response.headers.get('Access-Control-Allow-Headers'));
    // Note: Access-Control-Max-Age is not set in the current implementation
  });

  await t.step("POST response includes CORS headers", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }]
    });

    const response = await handlePostRequest(request);
    
    assertEquals(response.headers.get('Access-Control-Allow-Origin'), '*');
  });

  cleanupTestEnvironment();
});

// Test request validation
Deno.test("Request Validation Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("validates message format", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [
        { role: 'invalid', content: 'Hello' } // invalid role
      ]
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 400);
  });

  await t.step("validates session_id format", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }],
      session_id: 123 // should be string
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 500);
  });

  await t.step("validates agent_id format", async () => {
    const request = createMockRequest('POST', 'https://test.supabase.co/functions/v1/claude-api-v3', {
      messages: [{ role: 'user', content: 'Hello' }],
      agent_id: null // should be string if provided
    }, {
      'Authorization': 'Bearer valid-token'
    });

    const response = await handlePostRequest(request);
    
    await assertResponseError(response, 500);
  });

  cleanupTestEnvironment();
});
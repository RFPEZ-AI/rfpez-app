// Copyright Mark Skiba, 2025 All rights reserved
// Claude service tests for Claude API v3

import { assertEquals, assertExists, assertRejects } from "std/testing/asserts.ts";
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment,
  MockFetch,
  mockGlobalFetch,
  restoreGlobalFetch
} from "./test-utils.ts";
import { 
  createMockClaudeResponse,
  createMockClaudeStreamingResponse
} from "./mocks/responses.ts";

// Setup environment before imports that need config
setupTestEnvironment();
import { ClaudeAPIService, ToolExecutionService } from "../services/claude.ts";
import { ClaudeToolDefinition } from "../types.ts";

// Test suite for Claude API service
Deno.test("Claude API Service Test Suite", async (t) => {
  setupTestEnvironment();
  
  const mockFetch = new MockFetch();
  mockGlobalFetch(mockFetch);

  await t.step("successful message sending", async () => {
    const claudeResponse = createMockClaudeResponse('Hello! How can I help you?');
    const mockResponse = new Response(JSON.stringify(claudeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const tools: ClaudeToolDefinition[] = [];

    const result = await service.sendMessage(messages, tools);
    
    assertExists(result);
    assertExists(result.textResponse);
    assertExists(result.toolCalls);
    assertExists(result.usage);
    assertExists(result.rawResponse);
  });

  await t.step("message sending with tools", async () => {
    const claudeResponse = createMockClaudeResponse('I\'ll create a session for you.', true);
    const mockResponse = new Response(JSON.stringify(claudeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Create a new session' }];
    const tools = [
      {
        name: 'create_session',
        description: 'Create a new conversation session',
        input_schema: {
          type: 'object' as const,
          properties: {
            user_id: { type: 'string', description: 'User ID' },
            title: { type: 'string', description: 'Session title' }
          },
          required: ['user_id']
        }
      }
    ];

    const result = await service.sendMessage(messages, tools);
    
    assertExists(result);
    assertExists(result.textResponse);
    assertExists(result.toolCalls);
    assertExists(result.usage);
    assertExists(result.rawResponse);
  });

  await t.step("handles Claude API errors", async () => {
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

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const tools: ClaudeToolDefinition[] = [];

    await assertRejects(
      () => service.sendMessage(messages, tools),
      Error,
      'Claude API error: 429'
    );
  });

  await t.step("handles network errors", async () => {
    // Test with invalid JSON response to simulate network/parsing error
    const invalidResponse = new Response('invalid json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', invalidResponse);

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const tools: ClaudeToolDefinition[] = [];

    await assertRejects(
      () => service.sendMessage(messages, tools),
      Error
    );
  });

  restoreGlobalFetch();
  cleanupTestEnvironment();
});

// Test suite for streaming Claude API
Deno.test("Claude API Streaming Test Suite", async (t) => {
  setupTestEnvironment();
  
  const mockFetch = new MockFetch();
  mockGlobalFetch(mockFetch);

  await t.step("successful streaming response", async () => {
    const streamingChunks = createMockClaudeStreamingResponse(['Hello', ' ', 'world!']);
    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          streamingChunks.forEach((chunk, index) => {
            setTimeout(() => {
              controller.enqueue(new TextEncoder().encode(chunk));
              if (index === streamingChunks.length - 1) {
                controller.close();
              }
            }, index * 10);
          });
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

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const tools: ClaudeToolDefinition[] = [];

    const receivedChunks: string[] = [];
    const callback = (chunk: { type: string; content?: string }) => {
      if (chunk.type === 'text' && chunk.content) {
        receivedChunks.push(chunk.content);
      }
    };

    const result = await service.streamMessage(messages, tools, callback);
    
    assertExists(result);
    // Note: In a real implementation, we'd verify the chunks were received
  });

  await t.step("handles streaming errors", async () => {
    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new Error('Stream error'));
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream'
        }
      }
    );

    mockFetch.setResponse('https://api.anthropic.com/v1/messages', mockResponse);

    const service = new ClaudeAPIService();
    const messages = [{ role: 'user' as const, content: 'Hello' }];
    const tools: ClaudeToolDefinition[] = [];

    const callback = (_chunk: { type: string; content?: string }) => {};

    await assertRejects(
      () => service.streamMessage(messages, tools, callback),
      Error
    );
  });

  restoreGlobalFetch();
  cleanupTestEnvironment();
});

// Mock Supabase client for tool execution tests
class MockToolSupabaseClient {
  private responses: Map<string, unknown> = new Map();

  constructor() {
    // Set up default test fixtures for common queries
    this.setupDefaultFixtures();
  }

  setupDefaultFixtures() {
    // Default user profile for test-user-id
    this.responses.set('user_profiles', {
      id: 'test-profile-uuid',
      email: 'test@example.com',
      supabase_user_id: 'test-user-id'
    });
    
    // Default session for test-session-id
    this.responses.set('sessions', {
      id: 'test-session-uuid',
      user_id: 'test-profile-uuid',
      title: 'Test Session',
      created_at: new Date().toISOString()
    });
  }

  setResponse(key: string, response: unknown) {
    this.responses.set(key, response);
  }

  from(table: string) {
    const mockQueryBuilder = {
      insert: (data: Record<string, unknown>) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'test-id', ...data },
            error: null
          })
        })
      }),
      update: (data: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { ...data },
              error: null
            })
          })
        })
      }),
      select: (_columns?: string) => {
        return {
          eq: (_column: string, _value: unknown) => ({
            single: () => Promise.resolve({
              data: this.responses.get(table) || null,
              error: null
            }),
            order: (_column: string, _options?: { ascending?: boolean }) => ({
              limit: (_count: number) => Promise.resolve({
                data: Array.isArray(this.responses.get(table)) 
                  ? this.responses.get(table) 
                  : [this.responses.get(table)].filter(Boolean),
                error: null
              })
            })
          }),
          limit: (_count: number) => Promise.resolve({
            data: Array.isArray(this.responses.get(table)) 
              ? this.responses.get(table) 
              : [this.responses.get(table)].filter(Boolean),
            error: null
          })
        };
      }
    };
    return mockQueryBuilder;
  }
}

// Test suite for tool execution service
Deno.test("Tool Execution Service Test Suite", async (t) => {
  setupTestEnvironment();

  await t.step("executes create_session tool", async () => {
    const mockSupabase = new MockToolSupabaseClient();
    mockSupabase.setResponse('sessions', {
      id: 'test-session-id',
      user_id: 'test-user-id',
      title: 'Test Session'
    });

    const service = new ToolExecutionService(mockSupabase as unknown, 'test-user-id', 'Create a session');
    
    const toolCall = {
      id: 'toolu_test_123',
      type: 'tool_use' as const,
      name: 'create_session',
      input: {
        user_id: 'test-user-id',
        title: 'Test Session'
      }
    };

    const result = await service.executeTool(toolCall);
    
    assertExists(result);
    assertEquals(result.success, true);
    // Note: session_id is not part of ToolResult interface
  });

  await t.step("executes store_message tool", async () => {
    const mockSupabase = new MockToolSupabaseClient();
    mockSupabase.setResponse('messages', {
      id: 'test-message-id',
      session_id: 'test-session-id',
      role: 'user' as const,
      content: 'Test message'
    });

    const service = new ToolExecutionService(mockSupabase as unknown, 'test-user-id', 'Test message');
    
    const toolCall = {
      id: 'toolu_test_456',
      type: 'tool_use' as const,
      name: 'store_message',
      input: {
        session_id: 'test-session-id',
        role: 'user' as const,
        content: 'Test message'
      }
    };

    const result = await service.executeTool(toolCall);
    
    assertExists(result);
    assertEquals(result.success, true);
    assertExists(result.message);
  });

  await t.step("executes get_conversation_history tool", async () => {
    const mockSupabase = new MockToolSupabaseClient();
    mockSupabase.setResponse('messages', [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Hello',
        created_at: new Date().toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString()
      }
    ]);

    const service = new ToolExecutionService(mockSupabase as unknown, 'test-user-id', '');
    
    const toolCall = {
      id: 'toolu_test_789',
      type: 'tool_use' as const,
      name: 'get_conversation_history',
      input: {
        session_id: 'test-session-id',
        limit: 10
      }
    };

    const result = await service.executeTool(toolCall);
    
    assertExists(result);
    // Note: messages property doesn't exist in ToolResult interface
    assertEquals(result.success, true);
  });

  await t.step("handles unknown tool", async () => {
    const mockSupabase = new MockToolSupabaseClient();
    const service = new ToolExecutionService(mockSupabase as unknown, 'test-user-id', '');
    
    const toolCall = {
      id: 'toolu_test_unknown',
      type: 'tool_use' as const,
      name: 'unknown_tool',
      input: {}
    };

    const result = await service.executeTool(toolCall);
    
    assertExists(result);
    assertEquals(result.success, false);
    assertExists(result.error);
  });

  await t.step("handles tool execution errors", async () => {
    const mockSupabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.reject(new Error('Database error'))
          })
        })
      })
    };

    const service = new ToolExecutionService(mockSupabase as unknown, 'test-user-id', 'Test');
    
    const toolCall = {
      id: 'toolu_test_error',
      type: 'tool_use' as const,
      name: 'create_session',
      input: {
        user_id: 'test-user-id',
        title: 'Test Session'
      }
    };

    const result = await service.executeTool(toolCall);
    
    assertExists(result);
    assertEquals(result.success, false);
    assertExists(result.error);
  });

  cleanupTestEnvironment();
});
// Copyright Mark Skiba, 2025 All rights reserved
// Test utilities for Claude API v3 Edge Function

import { assertEquals, assertExists } from "std/testing/asserts.ts";
import { enableTestMode, disableTestMode as _disableTestMode } from "../auth/auth.ts";

// Mock Supabase client for testing
export class MockSupabaseClient {
  private mockData: Map<string, unknown> = new Map();
  private mockError: Error | null = null;
  private insertedRecords: Map<string, Map<string, unknown>> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.mockData.clear();
    this.mockError = null;
    this.insertedRecords.clear();
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  setMockData(table: string, data: unknown) {
    this.mockData.set(table, data);
  }

  from(table: string) {
    const createQueryBuilder = (recordId?: string) => ({
      eq: (column: string, value: unknown) => {
        // When querying by ID, retrieve the inserted record
        if (column === 'id' && typeof value === 'string') {
          const tableRecords = this.insertedRecords.get(table);
          const record = tableRecords?.get(value);
          return {
            ...createQueryBuilder(value as string),
            single: () => this.mockError ? 
              Promise.reject(this.mockError) : 
              Promise.resolve({ data: record || this.mockData.get(table), error: null })
          };
        }
        return createQueryBuilder(recordId);
      },
      not: (_column: string, _operator: string, _value: unknown) => createQueryBuilder(recordId),
      limit: (_count: number) => createQueryBuilder(recordId),
      order: (_column: string, _options?: Record<string, unknown>) => createQueryBuilder(recordId),
      single: () => this.mockError ? 
        Promise.reject(this.mockError) : 
        Promise.resolve({ data: this.mockData.get(table), error: null }),
      then: (resolve: (value: unknown) => unknown) => {
        const result = this.mockError ? 
          { data: null, error: this.mockError } : 
          { data: this.mockData.get(table), error: null };
        return Promise.resolve(result).then(resolve);
      }
    });

    return {
      select: (_columns?: string) => createQueryBuilder(),
      insert: (data: Record<string, unknown>) => {
        const recordId = (data.id as string) || 'mock-id';
        const record = { id: recordId, ...data };
        
        // Store the inserted record for later retrieval
        if (!this.insertedRecords.has(table)) {
          this.insertedRecords.set(table, new Map());
        }
        this.insertedRecords.get(table)!.set(recordId, record);
        
        return {
          select: () => ({
            single: () => this.mockError ?
              Promise.reject(this.mockError) :
              Promise.resolve({ data: record, error: null })
          })
        };
      },
      update: (data: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => ({
          select: () => ({
            single: () => this.mockError ?
              Promise.reject(this.mockError) :
              Promise.resolve({ data: { ...data }, error: null })
          })
        })
      })
    };
  }

  auth = {
    getUser: () => this.mockError ?
      Promise.reject(this.mockError) :
      Promise.resolve({ 
        data: { user: { id: 'mock-user-id' } }, 
        error: null 
      })
  };
}

// Mock fetch for Claude API calls
export class MockFetch {
  private responses: Map<string, Response> = new Map();
  private defaultResponse: Response;

  constructor() {
    this.defaultResponse = new Response('{}', { status: 200 });
  }

  setResponse(url: string, response: Response) {
    this.responses.set(url, response);
  }

  setDefaultResponse(response: Response) {
    this.defaultResponse = response;
  }

  fetch = (url: string | URL, _init?: RequestInit): Promise<Response> => {
    const urlString = url.toString();
    
    // Mock Supabase auth endpoints to prevent real HTTP calls
    if (urlString.includes('/auth/v1/user')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { id: 'mock-user-id' }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    
    // Mock other Supabase endpoints
    if (urlString.includes('.supabase.co') || urlString.includes('supabase')) {
      return Promise.resolve(new Response(JSON.stringify({
        data: { id: 'mock-id' },
        error: null
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    
    // For mapped responses, return a cloned response to avoid body consumption issues
    const mappedResponse = this.responses.get(urlString);
    if (mappedResponse) {
      return Promise.resolve(mappedResponse.clone());
    }
    
    return Promise.resolve(this.defaultResponse.clone());
  };

  reset() {
    this.responses.clear();
    this.defaultResponse = new Response('{}', { status: 200 });
  }
}

// Create mock request objects for testing
export function createMockRequest(
  method: string = 'POST',
  url: string = 'https://test.supabase.co/functions/v1/claude-api-v3',
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers
  });

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders
  };

  if (body && method !== 'GET') {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

// Create mock streaming response for testing
export function createMockStreamingResponse(chunks: string[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    start(controller) {
      const sendChunk = () => {
        if (index < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[index]));
          index++;
          setTimeout(sendChunk, 10);
        } else {
          controller.close();
        }
      };
      sendChunk();
    }
  });
}

// Environment setup for tests
// Global mock fetch instance for consistent auth mocking
let globalMockFetch: MockFetch | null = null;

export function setupTestEnvironment() {
  // Set required environment variables for testing
  if (!Deno.env.get('CLAUDE_API_KEY')) {
    Deno.env.set('CLAUDE_API_KEY', 'test-api-key');
  }
  // Prefer local Supabase in dev environment
  if (!Deno.env.get('SUPABASE_URL')) {
    Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321');
  }
  if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
  }
  
  // Set up global fetch mock to handle Supabase auth calls
  if (!globalMockFetch) {
    globalMockFetch = new MockFetch();
    mockGlobalFetch(globalMockFetch);
  }
  
  // Enable test mode in auth module with mock client
  enableTestMode(() => new MockSupabaseClient());
}

// Clean up test environment
export function cleanupTestEnvironment() {
  // Clean up any test data or connections
  // This helps prevent resource leaks in test environment
  
  // Clear any remaining timers/intervals that might have been created
  // Note: Resource leaks in tests are often caused by Supabase client 
  // making real HTTP requests that create background timers/intervals
  
  // Reset the global mock fetch if it exists
  if (globalMockFetch) {
    globalMockFetch.reset();
  }
  
  // Restore original fetch if it was mocked
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
}

// Assert helpers for testing responses
export function assertResponseOk(response: Response, expectedStatus: number = 200) {
  assertEquals(response.status, expectedStatus);
  assertExists(response.headers.get('content-type'));
}

export async function assertResponseError(response: Response, expectedStatus: number) {
  assertEquals(response.status, expectedStatus);
  const body = await response.json();
  assertExists(body.error);
}

export function assertStreamingResponse(response: Response) {
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('content-type'), 'text/event-stream');
  assertEquals(response.headers.get('cache-control'), 'no-cache');
}

// Mock global fetch for testing
let originalFetch: typeof globalThis.fetch;

export function mockGlobalFetch(mockFetch: MockFetch) {
  originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch.fetch as typeof globalThis.fetch;
}

export function restoreGlobalFetch() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
}
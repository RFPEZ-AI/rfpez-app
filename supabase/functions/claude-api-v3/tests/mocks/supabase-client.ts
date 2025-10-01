// Copyright Mark Skiba, 2025 All rights reserved
// Mock Supabase client for testing to prevent real HTTP calls

// Mock Supabase client that doesn't make HTTP requests
export class MockSupabaseClient {
  auth = {
    getUser: () => Promise.resolve({
      data: { user: { id: 'mock-user-id' } },
      error: null
    })
  };

  from(_table: string) {
    return {
      select: (_columns?: string) => ({
        eq: (column: string, value: unknown) => ({
          single: () => Promise.resolve({
            data: { id: 'mock-id', [column]: value },
            error: null
          }),
          order: (_column: string, _options?: { ascending?: boolean }) => ({
            limit: (_count: number) => Promise.resolve({
              data: [{ id: 'mock-id' }],
              error: null
            })
          })
        }),
        limit: (_count: number) => Promise.resolve({
          data: [{ id: 'mock-id' }],
          error: null
        })
      }),
      insert: (data: Record<string, unknown>) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'mock-id', ...data },
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
      delete: () => ({
        eq: (_column: string, _value: unknown) => Promise.resolve({
          data: null,
          error: null
        })
      })
    };
  }
}

// Mock createClient function to replace the real Supabase import
export function createClient(_url: string, _key: string, _options?: unknown) {
  return new MockSupabaseClient();
}
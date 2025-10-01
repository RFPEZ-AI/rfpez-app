// Copyright Mark Skiba, 2025 All rights reserved
// Mock authentication functions for testing

// Mock authenticated Supabase client that doesn't make real HTTP calls
export function getAuthenticatedSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  // Return a mock client that has the auth methods but doesn't make real calls
  return Promise.resolve({
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'mock-user-id' } },
        error: null
      })
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: { id: 'mock-id' }, error: null }),
      update: () => ({ data: {}, error: null }),
      delete: () => ({ data: null, error: null })
    })
  });
}

// Mock getUserId that doesn't make HTTP calls
export function getUserId(_supabase: unknown): Promise<string> {
  return Promise.resolve('mock-user-id');
}

// Mock validateAuthHeader 
export function validateAuthHeader(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  return authHeader.substring(7);
}
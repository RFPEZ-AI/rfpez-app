// Copyright Mark Skiba, 2025 All rights reserved
// Authentication utilities for Claude API v3
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { config } from '../config.ts';
// Test mode flag for using mock clients
let isTestMode = false;
let mockClientFactory = null;
// Enable test mode with mock client factory
export function enableTestMode(mockFactory) {
  isTestMode = true;
  mockClientFactory = mockFactory || null;
}
// Disable test mode
export function disableTestMode() {
  isTestMode = false;
  mockClientFactory = null;
}
// Get authenticated Supabase client from request
export function getAuthenticatedSupabaseClient(request) {
  // Get authorization header
  const authHeader = request.headers.get('Authorization');
  // Handle missing authorization by using anonymous key
  let token;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔓 No auth header in getAuthenticatedSupabaseClient, using anonymous key');
    token = config.supabaseAnonKey;
  } else {
    token = authHeader.substring(7);
  }
  // Return mock client in test mode
  if (isTestMode && mockClientFactory) {
    return mockClientFactory();
  }
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;
  // Check if this is the anonymous key - use service role for anonymous users
  const anonymousKey = config.supabaseAnonKey;
  console.log('🔐 Auth token analysis:', {
    tokenLength: token.length,
    anonymousKeyLength: anonymousKey?.length,
    isAnonymous: token === anonymousKey,
    tokenPreview: token.substring(0, 20) + '...'
  });
  if (token === anonymousKey) {
    console.log('🔓 Anonymous token detected, using service role client');
    console.log('🔑 Service role key length:', supabaseServiceKey?.length);
    console.log('🔑 Service role key preview:', supabaseServiceKey?.substring(0, 30) + '...');
    // Create service role client for anonymous users
    // CRITICAL: Service role key must be used as the auth token to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    });
    return supabase;
  }
  console.log('👤 User token detected, creating RLS-enabled client with JWT context');
  // CRITICAL: Use anon key with user's JWT token in Authorization header
  // The JWT will be verified by PostgREST and auth.uid() will be set correctly
  const supabase = createClient(supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log('✅ Created Supabase client with user JWT for RLS context:', {
    tokenPreview: token.substring(0, 30) + '...',
    tokenLength: token.length,
    anonKeyLength: config.supabaseAnonKey.length
  });
  return supabase;
}
// Type guard to check if object has auth property
function hasAuthMethod(obj) {
  return typeof obj === 'object' && obj != null && 'auth' in obj;
}
// Extract user ID from authenticated Supabase client or return anonymous user ID
export async function getUserId(supabase, request) {
  // Check if this is an anonymous request FIRST - before attempting getUser()
  const authHeader = request.headers.get('Authorization');
  const anonymousKey = config.supabaseAnonKey;
  // Case 1: No auth header - anonymous user
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const anonymousUserId = '00000000-0000-0000-0000-000000000001';
    console.log(`🔓 No auth header - using anonymous user profile: ${anonymousUserId}`);
    return anonymousUserId;
  }
  // Case 2: Auth header contains anonymous key - anonymous user
  const token = authHeader.substring(7);
  if (token === anonymousKey) {
    const anonymousUserId = '00000000-0000-0000-0000-000000000001';
    console.log(`🔓 Anonymous key detected - using anonymous user profile: ${anonymousUserId}`);
    return anonymousUserId;
  }
  // Case 3: Authenticated user with JWT token
  console.log('👤 User JWT detected, extracting user ID from token');
  // For authenticated users, get the actual user ID
  if (!hasAuthMethod(supabase)) {
    throw new Error('Invalid Supabase client - missing auth methods');
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error('🔒 Authentication failed:', error);
    console.error('🔒 This usually means the user token is invalid or expired');
    console.error('🔒 User should logout and login again to refresh their session');
    throw new Error('AUTHENTICATION_REQUIRED: Your session has expired. Please logout and login again to continue.');
  }
  console.log(`✅ Authenticated user ID: ${user.id}`);
  return user.id;
}
// Validate request has proper authentication (allows anonymous)
export function validateAuthHeader(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For anonymous users, return the default anonymous key
    console.log('🔓 No auth header found, assuming anonymous user');
    return config.supabaseAnonKey;
  }
  return authHeader.substring(7);
}

// Copyright Mark Skiba, 2025 All rights reserved
// Authentication utilities for Claude API v3

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { config } from '../config.ts';

// Test mode flag for using mock clients
let isTestMode = false;
let mockClientFactory: (() => unknown) | null = null;

// Enable test mode with mock client factory
export function enableTestMode(mockFactory?: () => unknown) {
  isTestMode = true;
  mockClientFactory = mockFactory || null;
}

// Disable test mode
export function disableTestMode() {
  isTestMode = false;
  mockClientFactory = null;
}

// Get authenticated Supabase client from request
export function getAuthenticatedSupabaseClient(request: Request) {
  // Get authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7);
  
  // Return mock client in test mode
  if (isTestMode && mockClientFactory) {
    return mockClientFactory();
  }
  
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;
  
  // Check if this is the anonymous key - use service role for anonymous users
  const anonymousKey = config.supabaseAnonKey;
  if (token === anonymousKey) {
    console.log('🔓 Anonymous token detected, using service role client');
    // Create service role client for anonymous users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    return supabase;
  }
  
  // Create client with user token for RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  return supabase;
}

// Interface for the auth methods we need
interface SupabaseAuth {
  auth: {
    getUser: () => Promise<{ data: { user?: { id: string } | null }, error?: unknown }>
  }
}

// Type guard to check if object has auth property
function hasAuthMethod(obj: unknown): obj is SupabaseAuth {
  return typeof obj === 'object' && obj != null && 'auth' in obj;
}

// Extract user ID from authenticated Supabase client or return anonymous user ID
export async function getUserId(supabase: unknown, request: Request): Promise<string> {
  // Check if this is an anonymous request
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.substring(7);
    const anonymousKey = config.supabaseAnonKey;
    
    if (token === anonymousKey) {
      // For anonymous users, use the dedicated anonymous user profile
      // This UUID is seeded in the database specifically for anonymous sessions
      const anonymousUserId = '00000000-0000-0000-0000-000000000001';
      console.log(`🔓 Using dedicated anonymous user profile: ${anonymousUserId}`);
      return anonymousUserId;
    }
  }
  
  // For authenticated users, get the actual user ID
  if (!hasAuthMethod(supabase)) {
    throw new Error('Invalid Supabase client - missing auth methods');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Failed to get authenticated user');
  }
  
  return user.id;
}

// Validate request has proper authentication (allows anonymous)
export function validateAuthHeader(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For anonymous users, return the default anonymous key
    console.log('🔓 No auth header found, assuming anonymous user');
    return config.supabaseAnonKey;
  }
  
  return authHeader.substring(7);
}
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

// Extract user ID from authenticated Supabase client
export async function getUserId(supabase: SupabaseAuth): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Failed to get authenticated user');
  }
  
  return user.id;
}

// Validate request has proper authentication
export function validateAuthHeader(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  return authHeader.substring(7);
}
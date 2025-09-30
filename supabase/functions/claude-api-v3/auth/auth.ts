// Copyright Mark Skiba, 2025 All rights reserved
// Authentication utilities for Claude API v3

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { config } from '../config.ts';

// Get authenticated Supabase client from request
export async function getAuthenticatedSupabaseClient(request: Request) {
  const supabaseUrl = config.supabaseUrl;
  const supabaseServiceKey = config.supabaseServiceKey;
  
  // Get authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  const token = authHeader.substring(7);
  
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

// Extract user ID from authenticated Supabase client
export async function getUserId(supabase: any): Promise<string> {
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
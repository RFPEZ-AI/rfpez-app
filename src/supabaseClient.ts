// Copyright Mark Skiba, 2025 All rights reserved

import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET',
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    REACT_APP_CLAUDE_API_KEY: process.env.REACT_APP_CLAUDE_API_KEY ? 'SET' : 'NOT SET'
  });
} else {
  // Also log in production for debugging deployment issues
  console.log('Production environment variables check:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET',
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    REACT_APP_CLAUDE_API_KEY: process.env.REACT_APP_CLAUDE_API_KEY ? 'SET' : 'NOT SET'
  });
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing REACT_APP_SUPABASE_URL environment variable');
  throw new Error('Missing REACT_APP_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  console.error('REACT_APP_SUPABASE_URL must be a valid URL:', supabaseUrl);
  throw new Error('REACT_APP_SUPABASE_URL must be a valid URL');
}

console.log('Creating Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
    // Enhanced session storage options for better cross-platform compatibility
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key: string) => {
        try {
          // Try localStorage first, fallback to sessionStorage
          return localStorage.getItem(key) || sessionStorage.getItem(key);
        } catch (error) {
          console.warn('Storage getItem failed:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Set in both localStorage and sessionStorage for redundancy
          localStorage.setItem(key, value);
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.warn('Storage setItem failed:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          // Remove from both storages
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn('Storage removeItem failed:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
      'X-Platform': navigator?.userAgent?.includes('Windows') ? 'windows' : 'other'
    }
  }
});

// Utility function to handle auth errors gracefully
export const handleAuthError = async () => {
  try {
    // Clear any invalid tokens
    await supabase.auth.signOut();
    console.log('🔄 Cleared invalid authentication tokens');
  } catch (error) {
    console.warn('Auth cleanup warning (expected for anonymous users):', error);
  }
};

// Handle auth state changes and clear invalid tokens
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.log('🔄 Token refresh failed, clearing invalid session');
    await handleAuthError();
  }
});

// (Remove the context code from this file.)
// Move the context code to a new file: src/context/SupabaseContext.tsx

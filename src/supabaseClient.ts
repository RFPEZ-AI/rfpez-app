import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET',
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    REACT_APP_AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN ? 'SET' : 'NOT SET',
    REACT_APP_AUTH0_CLIENT_ID: process.env.REACT_APP_AUTH0_CLIENT_ID ? 'SET' : 'NOT SET'
  });
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing REACT_APP_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY environment variable');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error('REACT_APP_SUPABASE_URL must be a valid URL');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Disable telemetry if causing issues
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});



// (Remove the context code from this file.)
// Move the context code to a new file: src/context/SupabaseContext.tsx

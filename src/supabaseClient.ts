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
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});



// (Remove the context code from this file.)
// Move the context code to a new file: src/context/SupabaseContext.tsx

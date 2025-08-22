import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing REACT_APP_SUPABASE_URL in .env.local');
}

if (!supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_ANON_KEY in .env.local');
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

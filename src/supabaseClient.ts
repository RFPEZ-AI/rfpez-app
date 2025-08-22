import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL as string | undefined;
const anon = process.env.REACT_APP_SUPABASE_ANON_KEY as string | undefined;

if (!url) {
  throw new Error('REACT_APP_SUPABASE_URL is missing. Define it in .env.local and restart the dev server.');
}
if (!anon) {
  throw new Error('REACT_APP_SUPABASE_ANON_KEY is missing. Define it in .env.local and restart the dev server.');
}

export const supabase = createClient(url, anon);



// (Remove the context code from this file.)
// Move the context code to a new file: src/context/SupabaseContext.tsx

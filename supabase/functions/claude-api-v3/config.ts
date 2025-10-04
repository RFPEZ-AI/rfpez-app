// Copyright Mark Skiba, 2025 All rights reserved
// Configuration and environment setup for Claude API v3

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Global Deno environment access
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Environment variables
export const config = {
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  anthropicApiKey: Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY'),
  supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};

// Validate required environment variables
if (!config.supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!config.supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

if (!config.anthropicApiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable');
}

// Initialize Supabase client with timeout configurations
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false // Disable session persistence for edge functions
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-edge-function'
    }
  }
});

// CORS headers for responses
export const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

// Default Claude API parameters
export const defaultClaudeParams = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4000,
  temperature: 0.3,
  timeoutMs: 25000
};
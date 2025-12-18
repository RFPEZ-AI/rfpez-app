// Copyright Mark Skiba, 2025 All rights reserved
// Configuration and environment setup for Claude API v3
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// Environment variables
// Note: Using DATABASE_ prefix instead of SUPABASE_ because Supabase skips SUPABASE_ prefixed env vars
// BUGFIX: Prefer SUPABASE_URL in Docker context to avoid localhost issues
// DEBUG: Log environment variable before parsing
const USE_AWS_BEDROCK_RAW = Deno.env.get('USE_AWS_BEDROCK');
console.log('🔍 DEBUG: USE_AWS_BEDROCK raw value:', USE_AWS_BEDROCK_RAW);
console.log('🔍 DEBUG: USE_AWS_BEDROCK === "true"?', USE_AWS_BEDROCK_RAW === 'true');
export const config = {
  supabaseUrl: Deno.env.get('SUPABASE_URL') || Deno.env.get('DATABASE_URL'),
  supabaseServiceKey: Deno.env.get('DATABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  anthropicApiKey: Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY'),
  openaiApiKey: Deno.env.get('OPENAI_API_KEY'),
  openaiBaseUrl: Deno.env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1',
  openaiModel: Deno.env.get('OPENAI_MODEL') || 'gpt-5.2',
  supabaseAnonKey: Deno.env.get('DATABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  // LLM provider selection
  // - If LLM_PROVIDER is set, it takes precedence.
  // - Otherwise, legacy USE_AWS_BEDROCK controls Bedrock vs Anthropic.
  llmProvider: (Deno.env.get('LLM_PROVIDER') || '').toLowerCase(),
  // AWS Bedrock configuration
  useAwsBedrock: USE_AWS_BEDROCK_RAW === 'true',
  awsAccessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
  awsRegion: Deno.env.get('AWS_REGION') || 'us-east-1',
  awsBedrockModel: Deno.env.get('AWS_BEDROCK_MODEL') || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
};
// Validate required environment variables
if (!config.supabaseUrl) {
  throw new Error('Missing DATABASE_URL or SUPABASE_URL environment variable');
}
if (!config.supabaseServiceKey) {
  throw new Error('Missing DATABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');
}
// Validate API credentials based on provider
const resolvedProvider = config.llmProvider === 'openai'
  ? 'openai'
  : (config.useAwsBedrock ? 'bedrock' : 'anthropic');

if (resolvedProvider === 'bedrock') {
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
    throw new Error('Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY when USE_AWS_BEDROCK=true');
  }
  console.log('✅ Using AWS Bedrock for Claude API:', {
    region: config.awsRegion,
    model: config.awsBedrockModel
  });
} else if (resolvedProvider === 'openai') {
  if (!config.openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY when LLM_PROVIDER=openai');
  }
  console.log('✅ Using OpenAI API for LLM calls:', {
    baseUrl: config.openaiBaseUrl,
    model: config.openaiModel
  });
} else {
  if (!config.anthropicApiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable');
  }
  console.log('✅ Using direct Anthropic API for Claude');
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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-platform'
};
// Default Claude API parameters
export const defaultClaudeParams = {
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4000,
  temperature: 0.3,
  timeoutMs: 25000
};

export const defaultOpenAIParams = {
  model: config.openaiModel,
  maxTokens: 4000,
  temperature: 0.3,
  timeoutMs: 25000
};

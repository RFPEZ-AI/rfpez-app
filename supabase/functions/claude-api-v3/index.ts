// Copyright Mark Skiba, 2025 All rights reserved
// Claude API v3 Edge Function - Modular Architecture
// Refactored from 1542-line monolithic structure to maintainable modules
// Version: 2025-12-01 - bid_id persistence and injection deployed
// Last cache clear: 2025-12-01 07:45 UTC
// ⚠️ CRITICAL: Polyfill for googleapis compatibility in Deno
// Must be defined BEFORE any imports that use googleapis
// @ts-ignore - Adding complete process polyfill for googleapis
if (typeof globalThis.process === 'undefined') {
  // Create a plain object for env that can be converted to primitive
  const envObj = {};
  // Populate with current Deno env vars if possible
  try {
    // Try to get all env vars (may not work in all Deno versions)
    for (const key of [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'CLAUDE_API_KEY',
      'SUPABASE_URL',
      'GOOGLE_LOGGING_ENABLED',
      'GOOGLE_APPLICATION_CREDENTIALS_TYPE'
    ]){
      const value = Deno.env.get(key);
      if (value) envObj[key] = value;
    }
  } catch (e) {
    console.warn('[Init] Could not pre-populate env vars:', e);
  }
  // ⚠️ CRITICAL: Disable AWS SDK credential chain filesystem access
  // Prevents "fs.readFile is not implemented" errors in Deno edge runtime
  envObj['AWS_SDK_LOAD_CONFIG'] = '0'; // Disable loading from ~/.aws/config
  envObj['AWS_PROFILE'] = 'none'; // Prevent profile-based credential loading
  // @ts-ignore: Deno Deploy environment compatibility - process global required for Node.js libraries
  globalThis.process = {
    env: new Proxy(envObj, {
      get: (target, prop)=>{
        if (typeof prop === 'string') {
          // First check our object
          if (prop in target) return target[prop];
          // Then try Deno.env
          const value = Deno.env.get(prop);
          if (value) {
            target[prop] = value; // Cache it
            return value;
          }
        }
        return undefined;
      },
      set: (target, prop, value)=>{
        if (typeof prop === 'string' && typeof value === 'string') {
          target[prop] = value;
          Deno.env.set(prop, value);
        }
        return true;
      },
      has: (target, prop)=>{
        if (typeof prop === 'string') {
          return prop in target || Deno.env.get(prop) !== undefined;
        }
        return false;
      },
      ownKeys: (target)=>{
        return Object.keys(target);
      },
      getOwnPropertyDescriptor: (target, prop)=>{
        if (typeof prop === 'string' && (prop in target || Deno.env.get(prop) !== undefined)) {
          return {
            enumerable: true,
            configurable: true,
            value: target[prop] || Deno.env.get(prop)
          };
        }
        return undefined;
      }
    }),
    // Add other process properties that might be checked
    version: 'v20.0.0',
    versions: {
      node: '20.0.0'
    },
    platform: 'linux',
    arch: 'x64',
    cwd: ()=>Deno.cwd(),
    // Add Symbol.toPrimitive to prevent "Cannot convert object to primitive value" errors
    [Symbol.toPrimitive]: ()=>'[Process Object]',
    toString: ()=>'[Process Object]',
    valueOf: ()=>'[Process Object]'
  };
  console.log('[Init] ✅ Complete process polyfill installed for googleapis compatibility');
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptionsRequest, handlePostRequest } from './handlers/http.ts';
import { clearAgentCache, getCacheStats, invalidateAgentCache } from './utils/agent-inheritance.ts';
// Main entry point for the edge function
const handler = async (request)=>{
  console.log(`[${new Date().toISOString()}] Received ${request.method} request to Claude API v3 (Modular)`);
  try {
    // Handle CORS preflight
    const url = new URL(request.url);
    console.log(`Request URL: ${url.pathname}${url.search}`);
    if (request.method === 'OPTIONS') {
      console.log('Handling OPTIONS request for CORS');
      return handleOptionsRequest();
    }
    // Handle GET requests - Cache management endpoints
    if (request.method === 'GET') {
      const pathname = url.pathname;
      // Cache stats endpoint
      if (pathname.endsWith('/cache/stats')) {
        console.log('📊 Handling cache stats request');
        const stats = getCacheStats();
        return new Response(JSON.stringify({
          success: true,
          cache: stats,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      // Cache flush endpoint
      if (pathname.endsWith('/cache/flush')) {
        console.log('🗑️ Handling cache flush request');
        const agentId = url.searchParams.get('agentId');
        if (agentId) {
          // Invalidate specific agent cache
          invalidateAgentCache(agentId);
          return new Response(JSON.stringify({
            success: true,
            message: `Cache invalidated for agent: ${agentId}`,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } else {
          // Clear entire agent cache
          clearAgentCache();
          return new Response(JSON.stringify({
            success: true,
            message: 'All agent caches cleared',
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }
    // Handle POST requests
    if (request.method === 'POST') {
      console.log('Handling POST request');
      return await handlePostRequest(request);
    }
    // Method not allowed
    console.log(`Method ${request.method} not allowed`);
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      method: request.method,
      timestamp: new Date().toISOString()
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Unhandled error in main handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
// Start the server
console.log('🚀🚀🚀 Starting Claude API v3 Edge Function - FRESH LOAD AT:', new Date().toISOString());
console.log('🚀🚀🚀 Cache Clear Timestamp: 2025-12-01 10:35 UTC');
console.log('Modules loaded: handlers/http.ts');
serve(handler);

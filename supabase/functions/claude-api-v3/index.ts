// Copyright Mark Skiba, 2025 All rights reserved
// Claude API v3 Edge Function - Modular Architecture
// Refactored from 1542-line monolithic structure to maintainable modules
// Version: 2025-10-05 - Streaming truncation fix deployed

// ⚠️ CRITICAL: Polyfill for googleapis compatibility in Deno
// Must be defined BEFORE any imports that use googleapis
// @ts-ignore - Adding complete process polyfill for googleapis
if (typeof globalThis.process === 'undefined') {
  // Create a plain object for env that can be converted to primitive
  const envObj: Record<string, string> = {};
  
  // Populate with current Deno env vars if possible
  try {
    // Try to get all env vars (may not work in all Deno versions)
    for (const key of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'CLAUDE_API_KEY', 'SUPABASE_URL', 'GOOGLE_LOGGING_ENABLED', 'GOOGLE_APPLICATION_CREDENTIALS_TYPE']) {
      const value = Deno.env.get(key);
      if (value) envObj[key] = value;
    }
  } catch (e) {
    console.warn('[Init] Could not pre-populate env vars:', e);
  }
  
  // @ts-ignore: Deno Deploy environment compatibility - process global required for Node.js libraries
  globalThis.process = {
    env: new Proxy(envObj, {
      get: (target, prop) => {
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
      set: (target, prop, value) => {
        if (typeof prop === 'string' && typeof value === 'string') {
          target[prop] = value;
          Deno.env.set(prop, value);
        }
        return true;
      },
      has: (target, prop) => {
        if (typeof prop === 'string') {
          return prop in target || Deno.env.get(prop) !== undefined;
        }
        return false;
      },
      ownKeys: (target) => {
        return Object.keys(target);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        if (typeof prop === 'string' && (prop in target || Deno.env.get(prop) !== undefined)) {
          return {
            enumerable: true,
            configurable: true,
            value: target[prop as string] || Deno.env.get(prop)
          };
        }
        return undefined;
      }
    }),
    // Add other process properties that might be checked
    version: 'v20.0.0', // Fake Node version
    versions: { node: '20.0.0' },
    platform: 'linux',
    arch: 'x64',
    cwd: () => Deno.cwd(),
    // Add Symbol.toPrimitive to prevent "Cannot convert object to primitive value" errors
    [Symbol.toPrimitive]: () => '[Process Object]',
    toString: () => '[Process Object]',
    valueOf: () => '[Process Object]'
  };
  console.log('[Init] ✅ Complete process polyfill installed for googleapis compatibility');
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptionsRequest, handlePostRequest } from './handlers/http.ts';

// Main entry point for the edge function
const handler = async (request: Request): Promise<Response> => {
  console.log(`[${new Date().toISOString()}] Received ${request.method} request to Claude API v3 (Modular)`);
  
  try {
    // Handle CORS preflight
    const url = new URL(request.url);
    console.log(`Request URL: ${url.pathname}${url.search}`);
    
    if (request.method === 'OPTIONS') {
      console.log('Handling OPTIONS request for CORS');
      return handleOptionsRequest();
    }
    
    // Handle POST requests
    if (request.method === 'POST') {
      console.log('Handling POST request');
      return await handlePostRequest(request);
    }
    
    // Method not allowed
    console.log(`Method ${request.method} not allowed`);
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        method: request.method,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
    
  } catch (error) {
    console.error('Unhandled error in main handler:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};

// Start the server
console.log('Starting Claude API v3 Edge Function (Modular Architecture)');
console.log('Modules loaded: handlers/http.ts');

serve(handler);
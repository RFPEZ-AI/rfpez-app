// Copyright Mark Skiba, 2025 All rights reserved
// Claude API v3 Edge Function - Modular Architecture
// Refactored from 1542-line monolithic structure to maintainable modules
// Version: 2025-10-05 - Streaming truncation fix deployed

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
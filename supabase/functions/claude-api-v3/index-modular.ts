// Copyright Mark Skiba, 2025 All rights reserved
// Claude API v3 Edge Function - Modular Architecture
// Main entry point for the refactored edge function

import { handleOptionsRequest, handlePostRequest } from './handlers/http.ts';

// Main handler for the edge function
async function handler(request: Request): Promise<Response> {
  console.log(`Received ${request.method} request to Claude API v3`);
  
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest();
    }
    
    // Handle POST requests
    if (request.method === 'POST') {
      return await handlePostRequest(request);
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
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
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
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
}

// Export named function for Supabase Edge Functions
export { handler as default };
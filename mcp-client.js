#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ACCESS_TOKEN) {
  console.error('Missing environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, ACCESS_TOKEN');
  process.exit(1);
}

const MCP_SERVER_URL = `${SUPABASE_URL}/functions/v1/mcp-server`;

// MCP Client implementation
class MCPClient {
  constructor() {
    this.requestId = 1;
  }
  
  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };
    
    try {
      const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`MCP request failed: ${error.message}`);
    }
  }
  
  async handleStdio() {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line);
            const response = await this.sendRequest(request.method, request.params);
            response.id = request.id;
            process.stdout.write(JSON.stringify(response) + '\n');
          } catch (error) {
            const errorResponse = {
              jsonrpc: '2.0',
              id: request?.id || null,
              error: {
                code: -32603,
                message: 'Internal error',
                data: error.message
              }
            };
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      }
    });
    
    process.stdin.on('end', () => {
      process.exit(0);
    });
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
      process.exit(1);
    });
  }
}

// Start the client
const client = new MCPClient();
client.handleStdio();

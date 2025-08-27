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
    this.initialized = false;
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
  
  async handleRequest(request) {
    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolsCall(request);
      case 'resources/list':
        return this.handleResourcesList(request);
      default:
        // Forward other requests to the server
        return await this.sendRequest(request.method, request.params);
    }
  }
  
  handleInitialize(request) {
    this.initialized = true;
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'rfpez-supabase-mcp',
          version: '1.0.0'
        }
      }
    };
  }
  
  handleToolsList(request) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [
          {
            name: 'get_conversation_history',
            description: 'Retrieve conversation messages from a specific session',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The UUID of the conversation session'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of messages to retrieve (default: 50)'
                }
              },
              required: ['session_id']
            }
          },
          {
            name: 'get_recent_sessions',
            description: 'Get a list of recent conversation sessions',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of sessions to retrieve (default: 10)'
                }
              }
            }
          },
          {
            name: 'store_message',
            description: 'Store a new message in a conversation session',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The UUID of the conversation session'
                },
                content: {
                  type: 'string',
                  description: 'The message content'
                },
                role: {
                  type: 'string',
                  enum: ['user', 'assistant', 'system'],
                  description: 'The role of the message sender'
                }
              },
              required: ['session_id', 'content', 'role']
            }
          },
          {
            name: 'create_session',
            description: 'Create a new conversation session',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'The title of the conversation session'
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the session'
                }
              },
              required: ['title']
            }
          },
          {
            name: 'search_messages',
            description: 'Search for messages across all sessions',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find in message content'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 20)'
                }
              },
              required: ['query']
            }
          }
        ]
      }
    };
  }
  
  async handleToolsCall(request) {
    return await this.sendRequest(request.method, request.params);
  }
  
  handleResourcesList(request) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        resources: []
      }
    };
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
            const response = await this.handleRequest(request);
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

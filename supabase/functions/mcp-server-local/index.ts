import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: "2.0"
  id?: string | number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: "2.0"
  id?: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, any>
    required?: string[]
  }
}

interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

// Initialize LOCAL Supabase client - use internal database URL for Edge Function
// When running in Edge Function runtime, we need to use the internal database connection
const DATABASE_URL = Deno.env.get('SUPABASE_DB_URL') || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const LOCAL_SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'
const LOCAL_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

console.log('Local MCP Server connecting to:', LOCAL_SUPABASE_URL)
console.log('Database URL:', DATABASE_URL)

const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_KEY)

// MCP Tools Definition (same as remote but for local debugging)
const tools: MCPTool[] = [
  {
    name: "get_conversation_history",
    description: "Retrieve conversation messages from a specific session (LOCAL DEBUG)",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "The UUID of the session to retrieve messages from"
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to retrieve (default: 50)",
          default: 50
        },
        offset: {
          type: "number", 
          description: "Number of messages to skip (for pagination, default: 0)",
          default: 0
        }
      },
      required: ["session_id"]
    }
  },
  {
    name: "get_recent_sessions",
    description: "Get recent chat sessions for the authenticated user (LOCAL DEBUG)",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of sessions to retrieve (default: 10)",
          default: 10
        }
      }
    }
  },
  {
    name: "debug_user_profile",
    description: "Debug user profile issues - check if user profile exists (LOCAL DEBUG ONLY)",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The UUID of the user to check profile for"
        }
      },
      required: ["user_id"]
    }
  },
  {
    name: "create_user_profile",
    description: "Create missing user profile record (LOCAL DEBUG ONLY)",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The UUID of the user to create profile for"
        },
        email: {
          type: "string",
          description: "User's email address"
        },
        full_name: {
          type: "string",
          description: "User's full name"
        }
      },
      required: ["user_id", "email"]
    }
  },
  {
    name: "list_tables",
    description: "List all tables in the database (LOCAL DEBUG ONLY)",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "check_rls_policies",
    description: "Check RLS policies on a table (LOCAL DEBUG ONLY)",
    inputSchema: {
      type: "object",
      properties: {
        table_name: {
          type: "string",
          description: "Name of the table to check RLS policies for"
        }
      },
      required: ["table_name"]
    }
  }
]

// Debug tool handlers
async function handleDebugUserProfile(params: any, userId: string) {
  const { user_id } = params
  
  try {
    console.log(`Checking user profile for user_id: ${user_id}`)
    
    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', user_id)
      .single()
    
    console.log('Auth user query result:', { authUser, authError })
    
    // Check if profile exists in user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()
    
    console.log('Profile query result:', { profile, profileError })
    
    return {
      user_id,
      auth_user_exists: !!authUser,
      auth_user_data: authUser,
      auth_error: authError,
      profile_exists: !!profile,
      profile_data: profile,
      profile_error: profileError,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Debug user profile error:', error)
    throw error
  }
}

async function handleCreateUserProfile(params: any, userId: string) {
  const { user_id, email, full_name } = params
  
  try {
    console.log(`Creating user profile for user_id: ${user_id}`)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id,
        email,
        full_name: full_name || email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
    
    console.log('Successfully created user profile:', data)
    return data
  } catch (error) {
    console.error('Create user profile error:', error)
    throw error
  }
}

async function handleListTables(params: any, userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('list_all_tables')
      .select()
    
    if (error) {
      // Fallback: query information_schema
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public')
      
      return tablesData || []
    }
    
    return data
  } catch (error) {
    console.error('List tables error:', error)
    return []
  }
}

async function handleCheckRLSPolicies(params: any, userId: string) {
  const { table_name } = params
  
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', table_name)
    
    return {
      table_name,
      policies: data || [],
      error: error
    }
  } catch (error) {
    console.error('Check RLS policies error:', error)
    return {
      table_name,
      policies: [],
      error: error
    }
  }
}

// Main MCP handler (simplified for local debugging)
async function handleMCPRequest(request: MCPRequest, userId: string): Promise<MCPResponse> {
  console.log('Local MCP Request:', JSON.stringify(request, null, 2))
  
  try {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "RFPEZ Local Debug MCP Server",
              version: "1.0.0"
            }
          }
        }

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: tools
          }
        }

      case "tools/call":
        const { name, arguments: args } = request.params
        let result

        switch (name) {
          case "debug_user_profile":
            result = await handleDebugUserProfile(args, userId)
            break
          case "create_user_profile":
            result = await handleCreateUserProfile(args, userId)
            break
          case "list_tables":
            result = await handleListTables(args, userId)
            break
          case "check_rls_policies":
            result = await handleCheckRLSPolicies(args, userId)
            break
          default:
            throw new Error(`Unknown tool: ${name}`)
        }

        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        }

      default:
        throw new Error(`Unknown method: ${request.method}`)
    }
  } catch (error) {
    console.error('MCP Request Error:', error)
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message
      }
    }
  }
}

// Edge Function handler
serve(async (req) => {
  console.log('Local MCP Server request received')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Parse MCP request
    const mcpRequest: MCPRequest = await req.json()
    
    // For local debugging, we'll use a dummy user ID
    const userId = 'local-debug-user'
    
    // Handle the MCP request
    const response = await handleMCPRequest(mcpRequest, userId)
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  } catch (error) {
    console.error('Request processing error:', error)
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error",
          data: error.message
        }
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
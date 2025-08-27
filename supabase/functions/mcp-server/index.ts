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

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// MCP Tools Definition
const tools: MCPTool[] = [
  {
    name: "get_conversation_history",
    description: "Retrieve conversation messages from a specific session",
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
    description: "Get recent chat sessions for the authenticated user",
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
    name: "store_message",
    description: "Store a new message in a conversation session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: {
          type: "string",
          description: "The UUID of the session to store the message in"
        },
        content: {
          type: "string",
          description: "The message content"
        },
        role: {
          type: "string",
          enum: ["user", "assistant", "system"],
          description: "The role of the message sender"
        },
        metadata: {
          type: "object",
          description: "Additional metadata for the message",
          default: {}
        }
      },
      required: ["session_id", "content", "role"]
    }
  },
  {
    name: "create_session",
    description: "Create a new conversation session",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title for the new session"
        },
        description: {
          type: "string",
          description: "Optional description for the session"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "search_messages",
    description: "Search for messages across all sessions by content",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against message content"
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20)",
          default: 20
        }
      },
      required: ["query"]
    }
  }
]

// MCP Resources Definition
const resources: MCPResource[] = [
  {
    uri: "conversation://recent",
    name: "Recent Conversations",
    description: "Access to recent conversation sessions",
    mimeType: "application/json"
  },
  {
    uri: "conversation://search",
    name: "Message Search",
    description: "Search functionality across all messages",
    mimeType: "application/json"
  }
]

// Helper function to get user from authorization header
async function getUserFromAuth(authHeader: string): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      console.error('Auth error:', error)
      return null
    }
    
    // Get the user profile ID from the auth user ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single()
    
    return profile?.id || null
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Tool execution handlers
async function executeGetConversationHistory(params: any, userId: string) {
  const { session_id, limit = 50, offset = 0 } = params
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      role,
      created_at,
      message_order,
      metadata,
      ai_metadata
    `)
    .eq('session_id', session_id)
    .order('message_order', { ascending: true })
    .range(offset, offset + limit - 1)
  
  if (error) {
    throw new Error(`Failed to retrieve messages: ${error.message}`)
  }
  
  return {
    session_id,
    messages: messages || [],
    total_retrieved: messages?.length || 0,
    offset,
    limit
  }
}

async function executeGetRecentSessions(params: any, userId: string) {
  const { limit = 10 } = params
  
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      title,
      description,
      created_at,
      updated_at,
      session_metadata
    `)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to retrieve sessions: ${error.message}`)
  }
  
  return {
    sessions: sessions || [],
    total_retrieved: sessions?.length || 0
  }
}

async function executeStoreMessage(params: any, userId: string) {
  const { session_id, content, role, metadata = {} } = params
  
  // Get the current highest message order for this session
  const { data: lastMessage } = await supabase
    .from('messages')
    .select('message_order')
    .eq('session_id', session_id)
    .order('message_order', { ascending: false })
    .limit(1)
    .single()
  
  const nextOrder = (lastMessage?.message_order || 0) + 1
  
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      session_id,
      user_id: userId,
      content,
      role,
      message_order: nextOrder,
      metadata
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to store message: ${error.message}`)
  }
  
  // Update session timestamp
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', session_id)
  
  return {
    message_id: message.id,
    session_id,
    message_order: nextOrder,
    created_at: message.created_at
  }
}

async function executeCreateSession(params: any, userId: string) {
  const { title, description } = params
  
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title,
      description
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }
  
  return {
    session_id: session.id,
    title: session.title,
    description: session.description,
    created_at: session.created_at
  }
}

async function executeSearchMessages(params: any, userId: string) {
  const { query, limit = 20 } = params
  
  // Use text search across messages for sessions owned by this user
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      session_id,
      content,
      role,
      created_at,
      sessions!inner(title, description)
    `)
    .textSearch('content', query)
    .eq('sessions.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to search messages: ${error.message}`)
  }
  
  return {
    query,
    results: messages || [],
    total_found: messages?.length || 0
  }
}

// Main MCP handler
async function handleMCPRequest(request: MCPRequest, userId: string): Promise<MCPResponse> {
  const { method, params, id } = request
  
  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: "RFPEZ Supabase MCP Server",
              version: "1.0.0"
            }
          }
        }
      
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools
          }
        }
      
      case "tools/call":
        const { name: toolName, arguments: toolArgs } = params
        let result
        
        switch (toolName) {
          case "get_conversation_history":
            result = await executeGetConversationHistory(toolArgs, userId)
            break
          case "get_recent_sessions":
            result = await executeGetRecentSessions(toolArgs, userId)
            break
          case "store_message":
            result = await executeStoreMessage(toolArgs, userId)
            break
          case "create_session":
            result = await executeCreateSession(toolArgs, userId)
            break
          case "search_messages":
            result = await executeSearchMessages(toolArgs, userId)
            break
          default:
            throw new Error(`Unknown tool: ${toolName}`)
        }
        
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        }
      
      case "resources/list":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources
          }
        }
      
      case "resources/read":
        const { uri } = params
        let resourceResult
        
        if (uri === "conversation://recent") {
          resourceResult = await executeGetRecentSessions({ limit: 10 }, userId)
        } else if (uri === "conversation://search") {
          resourceResult = { message: "Use search_messages tool with a query parameter" }
        } else {
          throw new Error(`Unknown resource URI: ${uri}`)
        }
        
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(resourceResult, null, 2)
              }
            ]
          }
        }
      
      default:
        throw new Error(`Unknown method: ${method}`)
    }
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: error.message || "Internal error"
      }
    }
  }
}

// Main serve handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  try {
    // Get auth token and user
    const authHeader = req.headers.get('Authorization')
    const userId = await getUserFromAuth(authHeader || '')
    
    if (!userId) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required"
        }
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Parse MCP request
    const mcpRequest: MCPRequest = await req.json()
    
    // Handle the MCP request
    const response = await handleMCPRequest(mcpRequest, userId)
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Error handling request:', error)
    
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error or internal server error"
      }
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

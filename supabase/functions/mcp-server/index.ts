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
  },
  {
    name: "supabase_select",
    description: "Query and retrieve data from Supabase tables",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The table name to query"
        },
        columns: {
          type: "string",
          description: "Columns to select (comma-separated or *)"
        },
        filter: {
          type: "object",
          description: "Filter conditions",
          properties: {
            field: { type: "string" },
            operator: { type: "string", enum: ["eq", "neq", "gt", "lt", "gte", "lte", "like", "in"] },
            value: { type: ["string", "number", "boolean", "array"] }
          }
        },
        limit: {
          type: "number",
          description: "Maximum number of rows to return"
        },
        order: {
          type: "object",
          properties: {
            field: { type: "string" },
            ascending: { type: "boolean", default: true }
          }
        }
      },
      required: ["table"]
    }
  },
  {
    name: "supabase_insert",
    description: "Insert new records into Supabase tables",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The table name to insert into"
        },
        data: {
          type: "object",
          description: "Data object to insert"
        },
        returning: {
          type: "string",
          description: "Columns to return after insert",
          default: "*"
        }
      },
      required: ["table", "data"]
    }
  },
  {
    name: "supabase_update",
    description: "Update existing records in Supabase tables",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The table name to update"
        },
        data: {
          type: "object",
          description: "Data object with fields to update"
        },
        filter: {
          type: "object",
          description: "Filter conditions to identify records",
          properties: {
            field: { type: "string" },
            operator: { type: "string", enum: ["eq", "neq", "gt", "lt", "gte", "lte"] },
            value: { type: ["string", "number", "boolean"] }
          },
          required: ["field", "operator", "value"]
        },
        returning: {
          type: "string",
          description: "Columns to return after update",
          default: "*"
        }
      },
      required: ["table", "data", "filter"]
    }
  },
  {
    name: "supabase_delete",
    description: "Delete records from Supabase tables",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The table name to delete from"
        },
        filter: {
          type: "object",
          description: "Filter conditions to identify records",
          properties: {
            field: { type: "string" },
            operator: { type: "string", enum: ["eq", "neq", "gt", "lt", "gte", "lte"] },
            value: { type: ["string", "number", "boolean"] }
          },
          required: ["field", "operator", "value"]
        },
        returning: {
          type: "string",
          description: "Columns to return after delete",
          default: "*"
        }
      },
      required: ["table", "filter"]
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

// Supabase CRUD operations
async function executeSupabaseSelect(params: any, userId: string) {
  const { table, columns = "*", filter, limit, order } = params
  
  console.log('🔍 Supabase select:', { table, columns, filter, limit, order, userId })
  
  let query = supabase.from(table).select(columns)
  
  // Apply filters
  if (filter) {
    const { field, operator, value } = filter
    switch (operator) {
      case "eq":
        query = query.eq(field, value)
        break
      case "neq":
        query = query.neq(field, value)
        break
      case "gt":
        query = query.gt(field, value)
        break
      case "lt":
        query = query.lt(field, value)
        break
      case "gte":
        query = query.gte(field, value)
        break
      case "lte":
        query = query.lte(field, value)
        break
      case "like":
        query = query.like(field, value)
        break
      case "in":
        query = query.in(field, value)
        break
    }
  }
  
  // Apply ordering
  if (order) {
    query = query.order(order.field, { ascending: order.ascending ?? true })
  }
  
  // Apply limit
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to select from ${table}: ${error.message}`)
  }
  
  return {
    table,
    data: data || [],
    count: data?.length || 0
  }
}

async function executeSupabaseInsert(params: any, userId: string) {
  const { table, data, returning = "*" } = params
  
  console.log('📝 Supabase insert:', { table, data, returning, userId })
  
  // For certain tables, automatically add user_id if not present
  if (['rfps', 'sessions', 'messages'].includes(table) && data && !data.user_id) {
    data.user_id = userId
  }
  
  // Special handling for rfps table
  if (table === 'rfps' && data) {
    // Allow incomplete RFPs to be created initially
    console.log('🔧 Processing RFP insert with incomplete data handling')
    
    // Add default values for incomplete RFPs
    if (!data.description || data.description.trim() === '') {
      data.description = '' // Allow empty description initially
      console.log('📝 Set empty description for incomplete RFP')
    }
    
    if (!data.specification || data.specification.trim() === '') {
      data.specification = '' // Allow empty specification initially
      console.log('📋 Set empty specification for incomplete RFP')
    }
    
    // Add status field to track RFP completion (will be added to schema later)
    if (!data.status) {
      data.status = 'draft' // Mark as draft initially
      console.log('🏷️ Set status to draft for new RFP')
    }
    
    // Add default due_date if not provided (30 days from now) - but allow null
    if (!data.due_date) {
      // For incomplete RFPs, don't auto-add due_date, let it be null
      console.log('📅 Leaving due_date null for incomplete RFP')
    }
    
    // Calculate completion percentage based on provided fields
    const completionFields = [
      data.name && data.name.trim() !== '',
      data.description && data.description.trim() !== '',
      data.specification && data.specification.trim() !== '',
      data.due_date,
      data.buyer_questionnaire,
      data.buyer_questionnaire_response,
      data.bid_form_questionaire
    ]
    
    const completedFields = completionFields.filter(Boolean).length
    const completionPercentage = Math.round((completedFields / completionFields.length) * 100)
    
    console.log(`� RFP completion: ${completedFields}/${completionFields.length} fields (${completionPercentage}%)`)
    
    // Update status based on completion
    if (completionPercentage >= 90) {
      data.status = 'completed'
    } else if (completionPercentage >= 70) {
      data.status = 'collecting_responses'
    } else if (completionPercentage >= 50) {
      data.status = 'generating_forms'
    } else if (completionPercentage >= 30) {
      data.status = 'gathering_requirements'
    } else {
      data.status = 'draft'
    }
    
    console.log(`🎯 Set RFP status to: ${data.status}`)
  }
  
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select(returning)
  
  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`)
  }
  
  return {
    table,
    inserted: result,
    count: result?.length || 0
  }
}

async function executeSupabaseUpdate(params: any, userId: string) {
  const { table, data, filter, returning = "*" } = params
  
  console.log('✏️ Supabase update:', { table, data, filter, returning, userId })
  
  if (!filter) {
    throw new Error('Filter is required for update operations')
  }
  
  let query = supabase.from(table).update(data)
  
  // Apply filter
  const { field, operator, value } = filter
  switch (operator) {
    case "eq":
      query = query.eq(field, value)
      break
    case "neq":
      query = query.neq(field, value)
      break
    case "gt":
      query = query.gt(field, value)
      break
    case "lt":
      query = query.lt(field, value)
      break
    case "gte":
      query = query.gte(field, value)
      break
    case "lte":
      query = query.lte(field, value)
      break
    default:
      throw new Error(`Unsupported filter operator: ${operator}`)
  }
  
  query = query.select(returning)
  
  const { data: result, error } = await query
  
  if (error) {
    throw new Error(`Failed to update ${table}: ${error.message}`)
  }
  
  return {
    table,
    updated: result,
    count: result?.length || 0
  }
}

async function executeSupabaseDelete(params: any, userId: string) {
  const { table, filter, returning = "*" } = params
  
  console.log('🗑️ Supabase delete:', { table, filter, returning, userId })
  
  if (!filter) {
    throw new Error('Filter is required for delete operations')
  }
  
  let query = supabase.from(table)
  
  // Apply filter
  const { field, operator, value } = filter
  switch (operator) {
    case "eq":
      query = query.delete().eq(field, value)
      break
    case "neq":
      query = query.delete().neq(field, value)
      break
    case "gt":
      query = query.delete().gt(field, value)
      break
    case "lt":
      query = query.delete().lt(field, value)
      break
    case "gte":
      query = query.delete().gte(field, value)
      break
    case "lte":
      query = query.delete().lte(field, value)
      break
    default:
      throw new Error(`Unsupported filter operator: ${operator}`)
  }
  
  query = query.select(returning)
  
  const { data: result, error } = await query
  
  if (error) {
    throw new Error(`Failed to delete from ${table}: ${error.message}`)
  }
  
  return {
    table,
    deleted: result,
    count: result?.length || 0
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
          case "supabase_select":
            result = await executeSupabaseSelect(toolArgs, userId)
            break
          case "supabase_insert":
            result = await executeSupabaseInsert(toolArgs, userId)
            break
          case "supabase_update":
            result = await executeSupabaseUpdate(toolArgs, userId)
            break
          case "supabase_delete":
            result = await executeSupabaseDelete(toolArgs, userId)
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
        message: (error as Error).message || "Internal error"
      }
    }
  }
}

// Main serve handler
serve(async (req: Request) => {
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

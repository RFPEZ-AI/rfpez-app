import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

// Function execution handlers
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
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Parse request
    const { function_name, parameters } = await req.json()
    
    if (!function_name) {
      return new Response(JSON.stringify({
        error: 'function_name is required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Execute function
    let result
    switch (function_name) {
      case 'get_conversation_history':
        result = await executeGetConversationHistory(parameters || {}, userId)
        break
      case 'get_recent_sessions':
        result = await executeGetRecentSessions(parameters || {}, userId)
        break
      case 'store_message':
        result = await executeStoreMessage(parameters || {}, userId)
        break
      case 'create_session':
        result = await executeCreateSession(parameters || {}, userId)
        break
      case 'search_messages':
        result = await executeSearchMessages(parameters || {}, userId)
        break
      default:
        return new Response(JSON.stringify({
          error: `Unknown function: ${function_name}`
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Error handling request:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

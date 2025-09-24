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

async function executeCreateAndSetRfp(params: any, userId: string) {
  console.log('🔍 DEBUG: executeCreateAndSetRfp called with params:', JSON.stringify(params, null, 2));
  console.log('🔍 DEBUG: executeCreateAndSetRfp called with userId:', userId);
  
  // Robust parameter validation
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters provided to createAndSetRfp. Expected object with at least a name field.');
  }
  
  const { name, description = '', specification = '', due_date = null } = params;
  
  console.log('🚀 Creating and setting new RFP:', { name, userId });
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('❌ DEBUG: Invalid name parameter:', { name, params });
    throw new Error(`RFP name is required and must be a non-empty string. Received: ${typeof name === 'string' ? `"${name}"` : typeof name}`);
  }
  
  try {
    // Step 1: Get the current session ID for the user
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_session_id')
      .eq('supabase_user_id', userId)
      .single();
    
    if (profileError || !profile?.current_session_id) {
      throw new Error('No active session found. Please start a conversation session first.');
    }
    
    const session_id = profile.current_session_id;
    console.log('✅ Found current session:', session_id);
    
    // Step 2: Verify session exists and check if it already has a current RFP
    const { data: currentSession, error: sessionError } = await supabase
      .from('sessions')
      .select('id, current_rfp_id, user_id')
      .eq('id', session_id)
      .single();
    
    if (sessionError || !currentSession) {
      throw new Error('Session not found. Please ensure you have a valid session.');
    }
    
    if (currentSession.current_rfp_id) {
      console.log('⚠️ Session already has current RFP:', currentSession.current_rfp_id);
    }
    
    // Step 3: Create new RFP with supabase_insert
    const insertData: {
      name: string;
      status: string;
      description?: string;
      specification?: string;
      due_date?: string;
    } = {
      name: name.trim(),
      status: 'draft'
    };
    
    // Add optional fields if provided
    if (description && description.trim()) {
      insertData.description = description.trim();
    }
    if (specification && specification.trim()) {
      insertData.specification = specification.trim();
    }
    if (due_date) {
      insertData.due_date = due_date;
    }
    
    const { data: newRfp, error: insertError } = await supabase
      .from('rfps')
      .insert(insertData)
      .select('id, name, description, specification, status, created_at')
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create RFP:', insertError);
      throw new Error(`Failed to create RFP: ${insertError.message}`);
    }
    
    console.log('✅ RFP created successfully:', newRfp.id);
    
    // Step 4: Set as current RFP for the session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ current_rfp_id: newRfp.id })
      .eq('id', session_id)
      .select('id, current_rfp_id')
      .single();
    
    if (updateError) {
      console.error('❌ Failed to set as current RFP:', updateError);
      throw new Error(`RFP created but failed to set as current: ${updateError.message}`);
    }
    
    console.log('✅ RFP set as current for session successfully');
    
    // Step 5: Validation - verify RFP exists in database
    const { data: verifyRfp, error: verifyError } = await supabase
      .from('rfps')
      .select('id, name, status')
      .eq('id', newRfp.id)
      .single();
    
    if (verifyError || !verifyRfp) {
      throw new Error('RFP creation validation failed - RFP not found after creation');
    }
    
    console.log('✅ RFP creation validated successfully');
    
    return {
      success: true,
      rfp: newRfp,
      current_rfp_id: newRfp.id,
      session_id: session_id,
      message: `RFP "${newRfp.name}" created successfully and set as current RFP for this session`,
      steps_completed: [
        'retrieved_current_session',
        'verified_session_exists',
        'created_rfp_record', 
        'set_as_current_rfp_for_session',
        'validated_creation'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error in executeCreateAndSetRfp:', error);
    throw error;
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
      case 'create_and_set_rfp':
        result = await executeCreateAndSetRfp(parameters || {}, userId)
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

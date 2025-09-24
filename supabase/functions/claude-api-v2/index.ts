// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Edge Function v2 - Hybrid Architecture
// Handles Claude API calls with client callback system

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.29.0';

// Types for the hybrid architecture
interface EdgeFunctionCall {
  functionName: string;
  parameters: any;
  clientCallbacks?: ClientCallback[];
  sessionContext?: {
    sessionId: string;
    timestamp: string;
  };
}

interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification';
  target: string;
  payload: any;
}

interface EdgeFunctionResponse {
  success: boolean;
  data: any;
  clientCallbacks?: ClientCallback[];
  requiresClientAction?: boolean;
  message?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Anthropic client with server-side API key
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
if (!anthropicApiKey) {
  throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable is required');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

// Authentication helper
async function getUserFromAuth(authHeader: string | null): Promise<{ user: any; profile: any } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    console.error('Auth error:', userError);
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single();

  return { user, profile };
}

// Claude API Functions
class ClaudeAPIHandler {
  
  // Non-streaming Claude API call
  async generateMessage(params: {
    messages: any[];
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
    tools?: any[];
  }): Promise<any> {
    console.log('🤖 Generating non-streaming Claude response');
    
    try {
      const response = await anthropic.messages.create({
        model: params.model || 'claude-3-5-sonnet-20241022',
        max_tokens: params.max_tokens || 4000,
        temperature: params.temperature || 0.7,
        system: params.system,
        messages: params.messages,
        tools: params.tools,
      });

      console.log('✅ Claude API response received');
      return {
        success: true,
        data: response,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      console.error('❌ Claude API error:', error);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  // Generate streaming Claude response using Server-Sent Events
  async generateStreamingResponse(params: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    system?: string;
    messages: any[];
    tools?: any[];
  }): Promise<ReadableStream> {
    console.log('🌊 Generating streaming Claude response');
    
    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            const stream = await anthropic.messages.create({
              model: params.model || 'claude-3-5-sonnet-20241022',
              max_tokens: params.max_tokens || 4000,
              temperature: params.temperature || 0.7,
              system: params.system,
              messages: params.messages,
              tools: params.tools,
              stream: true,
            });

            console.log('🌊 Claude streaming response initiated');

            let fullContent = '';
            let tokenCount = 0;
            let currentToolUse: any = null;
            let toolResults: any[] = [];

            for await (const messageStreamEvent of stream) {
              try {
                if (messageStreamEvent.type === 'message_start') {
                  // Send initial metadata
                  const sseData = JSON.stringify({
                    type: 'start',
                    model: messageStreamEvent.message.model,
                    usage: messageStreamEvent.message.usage,
                  });
                  const encoder = new TextEncoder();
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  
                } else if (messageStreamEvent.type === 'content_block_start') {
                  if (messageStreamEvent.content_block?.type === 'tool_use') {
                    currentToolUse = {
                      id: messageStreamEvent.content_block.id,
                      name: messageStreamEvent.content_block.name,
                      input: {},
                    };
                  }
                  
                } else if (messageStreamEvent.type === 'content_block_delta') {
                  if (messageStreamEvent.delta?.type === 'text_delta') {
                    const textChunk = messageStreamEvent.delta.text;
                    fullContent += textChunk;
                    tokenCount++;
                    
                    // Send text chunk
                    const sseData = JSON.stringify({
                      type: 'content_delta',
                      delta: textChunk,
                      full_content: fullContent,
                      token_count: tokenCount,
                    });
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                    
                  } else if (messageStreamEvent.delta?.type === 'input_json_delta') {
                    if (currentToolUse) {
                      // Accumulate tool input
                      try {
                        const partialInput = messageStreamEvent.delta.partial_json;
                        currentToolUse.partial_input = (currentToolUse.partial_input || '') + partialInput;
                      } catch (e) {
                        console.warn('Tool input parsing issue:', e);
                      }
                    }
                  }
                  
                } else if (messageStreamEvent.type === 'content_block_stop') {
                  if (currentToolUse) {
                    try {
                      currentToolUse.input = JSON.parse(currentToolUse.partial_input || '{}');
                      delete currentToolUse.partial_input;
                      
                      // Send tool use event
                      const sseData = JSON.stringify({
                        type: 'tool_use',
                        tool_use: currentToolUse,
                      });
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                      
                      // Execute tool function (if available)
                      // TODO: Implement tool execution in streaming context
                      
                    } catch (e) {
                      console.error('Tool use parsing error:', e);
                    }
                    currentToolUse = null;
                  }
                  
                } else if (messageStreamEvent.type === 'message_delta') {
                  // Update usage stats
                  if (messageStreamEvent.usage) {
                    const sseData = JSON.stringify({
                      type: 'usage_update',
                      usage: messageStreamEvent.usage,
                    });
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  }
                  
                } else if (messageStreamEvent.type === 'message_stop') {
                  // Send completion event
                  const sseData = JSON.stringify({
                    type: 'complete',
                    full_content: fullContent,
                    token_count: tokenCount,
                    tool_results: toolResults,
                  });
                  const encoder = new TextEncoder();
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  
                  console.log('✅ Claude streaming response completed');
                  controller.close();
                  return;
                }
              } catch (chunkError) {
                console.error('❌ Error processing stream chunk:', chunkError);
                const errorData = JSON.stringify({
                  type: 'error',
                  error: chunkError.message || 'Stream processing error',
                });
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              }
            }

          } catch (error) {
            console.error('❌ Claude streaming error:', error);
            const errorData = JSON.stringify({
              type: 'error',
              error: error.message || 'Streaming error',
            });
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        })();
      },
      
      cancel() {
        console.log('🛑 Claude streaming cancelled');
      }
    });

    return stream;
  }

  // Test Claude API connection
  async testConnection(): Promise<any> {
    console.log('🔍 Testing Claude API connection');
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hello, please respond with "Connection successful"' }],
      });

      return {
        success: true,
        data: {
          message: 'Claude API connection successful',
          model: response.model,
          response: response.content[0]?.text || 'No response text',
        },
      };
    } catch (error) {
      console.error('❌ Claude API connection test failed:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }
}

// Database operations handler
class DatabaseHandler {
  
  async supabaseSelect(params: any, userId: string): Promise<any> {
    const { table, columns = '*', filter, limit, order } = params;
    
    console.log('🔍 Supabase SELECT:', { table, columns, filter, limit, order, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_select');
    }
    
    try {
      let query = supabase.from(table).select(columns);
      
      // Apply filter if provided
      if (filter && filter.field && filter.operator && filter.value !== undefined) {
        const { field, operator, value } = filter;
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'gt':
            query = query.gt(field, value);
            break;
          case 'lt':
            query = query.lt(field, value);
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'in':
            if (Array.isArray(value)) {
              query = query.in(field, value);
            } else {
              throw new Error('Value must be an array when using "in" operator');
            }
            break;
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      }
      
      // Apply ordering if provided
      if (order && order.field) {
        query = query.order(order.field, { ascending: order.ascending !== false });
      }
      
      // Apply limit if provided
      if (limit && typeof limit === 'number' && limit > 0) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase SELECT error:', error);
        throw new Error(`Failed to select from ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase SELECT success:', { table, rowCount: data?.length || 0 });
      
      return {
        table,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase SELECT exception:', error);
      throw error;
    }
  }

  async supabaseInsert(params: any, userId: string): Promise<any> {
    const { table, data, returning = '*' } = params;
    
    console.log('📝 Supabase INSERT:', { table, data, returning, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_insert');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for supabase_insert');
    }
    
    try {
      const result = await supabase
        .from(table)
        .insert(data)
        .select(returning);
        
      const { data: insertedData, error } = result;
      
      if (error) {
        console.error('❌ Supabase INSERT error:', error);
        throw new Error(`Failed to insert into ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase INSERT success:', { table, rowCount: insertedData?.length || 0 });
      
      return {
        table,
        data: insertedData || [],
        count: insertedData?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase INSERT exception:', error);
      throw error;
    }
  }

  async supabaseUpdate(params: any, userId: string): Promise<any> {
    const { table, data, filter, returning = '*' } = params;
    
    console.log('✏️ Supabase UPDATE:', { table, data, filter, returning, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_update');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for supabase_update');
    }
    
    if (!filter || !filter.field || !filter.operator || filter.value === undefined) {
      throw new Error('Filter with field, operator, and value is required for supabase_update');
    }
    
    try {
      let query = supabase.from(table).update(data);
      
      // Apply filter
      const { field, operator, value } = filter;
      
      switch (operator) {
        case 'eq':
          query = query.eq(field, value);
          break;
        case 'neq':
          query = query.neq(field, value);
          break;
        case 'gt':
          query = query.gt(field, value);
          break;
        case 'lt':
          query = query.lt(field, value);
          break;
        case 'gte':
          query = query.gte(field, value);
          break;
        case 'lte':
          query = query.lte(field, value);
          break;
        default:
          throw new Error(`Unsupported operator for update: ${operator}`);
      }
      
      // Add select clause to get returning data
      query = query.select(returning);
      
      const result = await query;
      const { data: updatedData, error } = result;
      
      if (error) {
        console.error('❌ Supabase UPDATE error:', error);
        throw new Error(`Failed to update ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase UPDATE success:', { table, rowCount: updatedData?.length || 0 });
      
      return {
        table,
        data: updatedData || [],
        count: updatedData?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase UPDATE exception:', error);
      throw error;
    }
  }

  async supabaseDelete(params: any, userId: string): Promise<any> {
    const { table, filter } = params;
    
    console.log('🗑️ Supabase DELETE:', { table, filter, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_delete');
    }
    
    if (!filter || !filter.field || !filter.operator || filter.value === undefined) {
      throw new Error('Filter with field, operator, and value is required for supabase_delete');
    }
    
    try {
      const { field, operator, value } = filter;
      
      let deleteQuery = supabase.from(table).delete();
      
      switch (operator) {
        case 'eq':
          deleteQuery = deleteQuery.eq(field, value);
          break;
        case 'neq':
          deleteQuery = deleteQuery.neq(field, value);
          break;
        case 'gt':
          deleteQuery = deleteQuery.gt(field, value);
          break;
        case 'lt':
          deleteQuery = deleteQuery.lt(field, value);
          break;
        case 'gte':
          deleteQuery = deleteQuery.gte(field, value);
          break;
        case 'lte':
          deleteQuery = deleteQuery.lte(field, value);
          break;
        default:
          throw new Error(`Unsupported operator for delete: ${operator}`);
      }
      
      const result = await deleteQuery;
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Supabase DELETE error:', error);
        throw new Error(`Failed to delete from ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase DELETE success:', { table, rowCount: data?.length || 0 });
      
      return {
        table,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase DELETE exception:', error);
      throw error;
    }
  }

  // MCP Protocol Functions
  async getConversationHistory(parameters: any, userId: string): Promise<any> {
    const { session_id, limit = 50, offset = 0 } = parameters;
    
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
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
    
    return {
      session_id,
      messages: messages || [],
      total_retrieved: messages?.length || 0,
      offset,
      limit
    };
  }

  async getRecentSessions(parameters: any, userId: string): Promise<any> {
    const { limit = 10 } = parameters;
    
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
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to retrieve sessions: ${error.message}`);
    }
    
    return {
      sessions: sessions || [],
      total_retrieved: sessions?.length || 0
    };
  }

  async storeMessage(parameters: any, userId: string): Promise<any> {
    const { session_id, content, role, metadata = {} } = parameters;
    
    // Get the current highest message order for this session
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('message_order')
      .eq('session_id', session_id)
      .order('message_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextOrder = (lastMessage?.message_order || 0) + 1;
    
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
      .single();
    
    if (error) {
      throw new Error(`Failed to store message: ${error.message}`);
    }
    
    // Update session timestamp
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);
    
    return {
      message_id: message.id,
      session_id,
      message_order: nextOrder,
      created_at: message.created_at
    };
  }

  async createSession(parameters: any, userId: string): Promise<any> {
    const { title, description } = parameters;
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title,
        description
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
    
    return {
      session_id: session.id,
      title: session.title,
      description: session.description,
      created_at: session.created_at
    };
  }

  async searchMessages(parameters: any, userId: string): Promise<any> {
    const { query, limit = 20 } = parameters;
    
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
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
    
    return {
      query,
      results: messages || [],
      total_found: messages?.length || 0
    };
  }

  // Create and set RFP function - server-side implementation for performance
  async createAndSetRfp(params: any, userId: string, sessionContext?: { sessionId: string; timestamp: string }) {
    const startTime = Date.now();
    console.log('🔍 DEBUG: createAndSetRfp called with params:', JSON.stringify(params, null, 2));
    console.log('🔍 DEBUG: createAndSetRfp called with userId:', userId);
    
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
      // Step 1: Get the user profile and current session ID
      console.log('⏱️ TIMING: Starting Step 1 - Get user profile and session at', Date.now() - startTime, 'ms');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, current_session_id')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found. Please ensure you are authenticated.');
      }
      
      let session_id = profile.current_session_id;
      
      // Step 1a: Use session context as fallback if available
      if (!session_id && sessionContext?.sessionId) {
        console.log('⚡ Using session context as fallback:', sessionContext.sessionId);
        session_id = sessionContext.sessionId;
        
        // Verify this session exists and belongs to the user
        const { data: sessionCheck } = await supabase
          .from('sessions')
          .select('id')
          .eq('id', session_id)
          .eq('user_id', profile.id)
          .single();
        
        if (sessionCheck) {
          console.log('✅ Session context verified, setting as current session');
          // Set as current session in user profile
          await supabase.rpc('set_user_current_session', {
            user_uuid: userId,
            session_uuid: session_id
          });
        } else {
          console.log('⚠️ Session context invalid, will create new session');
          session_id = null;
        }
      }
      
      // Step 1b: If still no current session, create one automatically
      if (!session_id) {
        console.log('⚠️ No current session found, creating new session automatically');
        console.log('⏱️ TIMING: Starting Step 1a - Auto-create session at', Date.now() - startTime, 'ms');
        
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            user_id: profile.id,
            title: `RFP Session - ${name}`,
            description: 'Auto-created session for RFP creation'
          })
          .select()
          .single();
        
        if (sessionError) {
          throw new Error(`Failed to create session: ${sessionError.message}`);
        }
        
        session_id = newSession.id;
        console.log('✅ New session created:', session_id);
        
        // Set as current session in user profile
        const { error: setSessionError } = await supabase
          .rpc('set_user_current_session', {
            user_uuid: userId,
            session_uuid: session_id
          });
        
        if (setSessionError) {
          console.warn('⚠️ Failed to set as current session, but continuing with RFP creation:', setSessionError);
        } else {
          console.log('✅ Session set as current for user');
        }
        
        console.log('⏱️ TIMING: Step 1a completed at', Date.now() - startTime, 'ms');
      } else {
        console.log('✅ Found existing current session:', session_id);
      }
      
      console.log('⏱️ TIMING: Step 1 completed at', Date.now() - startTime, 'ms');
      
      // Step 2: Verify session exists and check if it already has a current RFP
      console.log('⏱️ TIMING: Starting Step 2 - Verify session at', Date.now() - startTime, 'ms');
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
      console.log('⏱️ TIMING: Step 2 completed at', Date.now() - startTime, 'ms');
      
      // Step 3: Create new RFP with supabase_insert
      console.log('⏱️ TIMING: Starting Step 3 - Create RFP at', Date.now() - startTime, 'ms');
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
      console.log('⏱️ TIMING: Step 3 completed at', Date.now() - startTime, 'ms');
      
      // Step 4: Set as current RFP for the session
      console.log('⏱️ TIMING: Starting Step 4 - Set as current RFP at', Date.now() - startTime, 'ms');
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
      console.log('⏱️ TIMING: Step 4 completed at', Date.now() - startTime, 'ms');
      
      // Step 5: Validation - verify RFP exists in database
      console.log('⏱️ TIMING: Starting Step 5 - Validate creation at', Date.now() - startTime, 'ms');
      const { data: verifyRfp, error: verifyError } = await supabase
        .from('rfps')
        .select('id, name, status')
        .eq('id', newRfp.id)
        .single();
      
      if (verifyError || !verifyRfp) {
        throw new Error('RFP creation validation failed - RFP not found after creation');
      }
      
      console.log('✅ RFP creation validated successfully');
      console.log('⏱️ TIMING: Step 5 completed at', Date.now() - startTime, 'ms');
      console.log('⏱️ TIMING: Total execution time:', Date.now() - startTime, 'ms');
      
      const wasSessionCreated = !profile.current_session_id;
      const sessionMessage = wasSessionCreated ? ' (session auto-created)' : '';
      
      return {
        success: true,
        rfp: newRfp,
        current_rfp_id: newRfp.id,
        session_id: session_id,
        session_auto_created: wasSessionCreated,
        message: `RFP "${newRfp.name}" created successfully and set as current RFP${sessionMessage}`,
        steps_completed: [
          'retrieved_user_profile',
          ...(wasSessionCreated ? ['auto_created_session', 'set_as_current_session'] : ['found_existing_session']),
          'verified_session_exists',
          'created_rfp_record', 
          'set_as_current_rfp_for_session',
          'validated_creation'
        ]
      };
      
    } catch (error) {
      console.error('❌ Error in createAndSetRfp:', error);
      throw error;
    }
  }
}

// Client callback generator
function generateClientCallbacks(functionName: string, result: any, params?: any): ClientCallback[] {
  const callbacks: ClientCallback[] = [];
  
  switch (functionName) {
    case 'set_current_rfp':
      if (result.success && result.current_rfp_id) {
        callbacks.push({
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: { 
            rfp_id: result.current_rfp_id,
            message: result.message 
          }
        });
      }
      break;
      
    case 'refresh_current_rfp':
      callbacks.push({
        type: 'ui_refresh',
        target: 'rfp_context',
        payload: { message: 'RFP context refresh requested' }
      });
      break;
      
    case 'create_form_artifact':
      if (result.success && result.artifact_id) {
        callbacks.push({
          type: 'ui_refresh',
          target: 'artifact_viewer',
          payload: { 
            artifactId: result.artifact_id,
            type: 'form',
            content: result
          }
        });
      }
      break;
      
    case 'update_form_artifact':
      if (result.success && result.artifact_id) {
        callbacks.push({
          type: 'ui_refresh',
          target: 'artifact_viewer',
          payload: { 
            artifactId: result.artifact_id,
            type: 'form',
            content: result.content
          }
        });
      }
      break;
      
    case 'switch_agent':
      if (result.success && result.new_agent) {
        callbacks.push({
          type: 'state_update',
          target: 'agent_context',
          payload: {
            agent_id: result.new_agent.id,
            agent_name: result.new_agent.name,
            message: result.message
          }
        });
      }
      break;
  }
  
  return callbacks;
}

// Main function handler
async function handleFunction(functionCall: EdgeFunctionCall, userId: string): Promise<EdgeFunctionResponse> {
  const { functionName, parameters, sessionContext } = functionCall;
  
  console.log(`🚀 Handling function: ${functionName}`, { 
    userId, 
    parameters,
    sessionContext: sessionContext ? { sessionId: sessionContext.sessionId } : 'none'
  });
  
  const claudeHandler = new ClaudeAPIHandler();
  const dbHandler = new DatabaseHandler();
  
  try {
    let result: any;
    
    // Route function calls
    switch (functionName) {
      // Claude API functions
      case 'generate_message':
        result = await claudeHandler.generateMessage(parameters);
        break;
        
      case 'test_connection':
        result = await claudeHandler.testConnection();
        break;
        
      // Database operations
      case 'supabase_select':
        result = await dbHandler.supabaseSelect(parameters, userId);
        break;
        
      case 'supabase_insert':
        result = await dbHandler.supabaseInsert(parameters, userId);
        break;
        
      case 'supabase_update':
        result = await dbHandler.supabaseUpdate(parameters, userId);
        break;
        
      case 'supabase_delete':
        result = await dbHandler.supabaseDelete(parameters, userId);
        break;
        
      case 'create_and_set_rfp':
        result = await dbHandler.createAndSetRfp(parameters, userId, sessionContext);
        break;
        
      // MCP Protocol functions
      case 'get_conversation_history':
        result = await dbHandler.getConversationHistory(parameters, userId);
        break;
        
      case 'get_recent_sessions':
        result = await dbHandler.getRecentSessions(parameters, userId);
        break;
        
      case 'store_message':
        result = await dbHandler.storeMessage(parameters, userId);
        break;
        
      case 'create_session':
        result = await dbHandler.createSession(parameters, userId);
        break;
        
      case 'search_messages':
        result = await dbHandler.searchMessages(parameters, userId);
        break;
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
    
    // Generate client callbacks
    const clientCallbacks = generateClientCallbacks(functionName, result, parameters);
    
    return {
      success: true,
      data: result,
      clientCallbacks,
      requiresClientAction: clientCallbacks.length > 0,
      message: `Function ${functionName} executed successfully`
    };
    
  } catch (error) {
    console.error(`❌ Error handling function ${functionName}:`, error);
    
    return {
      success: false,
      data: null,
      clientCallbacks: [],
      requiresClientAction: false,
      message: `Error executing ${functionName}: ${error.message}`
    };
  }
}

// HTTP handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { functionName, parameters, stream, sessionContext } = body;
    
    if (!functionName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'functionName is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth header
    const authResult = await getUserFromAuth(req.headers.get('authorization'));
    const userId = authResult?.user?.id || 'anonymous';
    
    console.log(`🔑 User ID: ${userId}, Function: ${functionName}, Stream: ${stream}`);

    // Handle streaming requests for Claude API calls
    if (stream && functionName === 'generate_response') {
      console.log('🌊 Handling streaming Claude API request');
      
      const claudeHandler = new ClaudeAPIHandler();
      const streamResponse = await claudeHandler.generateStreamingResponse(parameters);
      
      return new Response(streamResponse, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Handle regular function calls
    const response = await handleFunction({ functionName, parameters, sessionContext }, userId);

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: null,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

console.log('🚀 Claude API Edge Function v2 is running');
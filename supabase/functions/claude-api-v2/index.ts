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
  const { functionName, parameters } = functionCall;
  
  console.log(`🚀 Handling function: ${functionName}`, { userId, parameters });
  
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
    const { functionName, parameters, stream } = body;
    
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
    const response = await handleFunction({ functionName, parameters }, userId);

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
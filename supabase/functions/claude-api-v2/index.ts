// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Edge Function v2 - Unified Architecture
// Handles ALL Claude API calls and tool executions server-side with streaming transparency

/// <reference types="https://deno.land/x/types/deno.d.ts" />
/// <reference types="https://deno.land/std@0.168.0/types.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.29.0';

// Global Deno environment access
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Enhanced streaming protocol types
interface ToolInvocationEvent {
  type: 'tool_start' | 'tool_progress' | 'tool_complete' | 'tool_error';
  toolName: string;
  parameters?: any;
  result?: any;
  error?: string;
  timestamp: string;
  duration?: number;
}

interface StreamingResponse {
  type: 'text' | 'tool_invocation' | 'completion' | 'error';
  content?: string;
  toolEvent?: ToolInvocationEvent;
  metadata?: {
    tokenCount?: number;
    model?: string;
    usage?: any;
  };
}

interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification' | 'rfp_created';
  target: string;
  payload: any;
  priority: 'low' | 'normal' | 'high';
}

interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  streamingEvents?: StreamingResponse[];
  clientCallbacks?: ClientCallback[];
  toolInvocations?: ToolInvocationEvent[];
  error?: string;
  metadata?: {
    executionTime: number;
    toolsUsed: string[];
    model: string;
    tokenUsage: any;
  };
}

// Initialize Supabase client with timeout configurations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Configure Supabase client with database timeout settings
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false // Disable session persistence for edge functions
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-edge-function'
    }
  }
});

// Database timeout utility - wraps database operations with timeout
function withDatabaseTimeout<T>(operation: Promise<T>, timeoutMs: number = 25000): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

// Database operation wrapper with automatic timeout
function dbQuery<T>(queryOperation: () => Promise<T>, operationName: string = 'Unknown'): Promise<T> {
  console.log(`🔍 DB QUERY START: ${operationName} at ${new Date().toISOString()}`);
  
  return withDatabaseTimeout(queryOperation(), 25000)
    .then(result => {
      console.log(`✅ DB QUERY SUCCESS: ${operationName} at ${new Date().toISOString()}`);
      return result;
    })
    .catch(error => {
      console.error(`❌ DB QUERY FAILED: ${operationName} at ${new Date().toISOString()}:`, error);
      throw error;
    });
}

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
    
    // 🔍 DEBUG: Log system prompt details
    console.log('🔍 CLAUDE API SYSTEM PROMPT DEBUG:', {
      hasSystem: !!params.system,
      systemLength: params.system?.length || 0,
      hasRfpCreationRule: (params.system || '').includes('CRITICAL RFP CREATION RULE'),
      hasCreateAndSetRfp: (params.system || '').includes('create_and_set_rfp'),
      systemPreview: params.system?.substring(0, 300) + '...',
      // 🔧 DEBUG: Show more of the RFP creation rules to verify they're complete
      rfpRulesSection: params.system?.includes('CRITICAL RFP CREATION RULE') 
        ? params.system.split('CRITICAL RFP CREATION RULE')[1]?.substring(0, 800) + '...'
        : 'RFP rules not found'
    });
    
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
    sessionContext?: any;
    userId?: string;
  }): Promise<ReadableStream> {
    console.log('🌊 Generating streaming Claude response');
    
    // Note: Using 'auto' tool_choice to allow Claude autonomous tool selection
    // Claude will intelligently choose appropriate tools based on context and system instructions
    // No legacy keyword filtering - tools selected based on AI understanding of user intent

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            // 🔍 DEBUG: Log streaming system prompt details
            console.log('🔍 CLAUDE STREAMING API SYSTEM PROMPT DEBUG:', {
              hasSystem: !!params.system,
              systemLength: params.system?.length || 0,
              hasRfpCreationRule: (params.system || '').includes('CRITICAL RFP CREATION RULE'),
              hasCreateAndSetRfp: (params.system || '').includes('create_and_set_rfp'),
              systemPreview: params.system?.substring(0, 300) + '...',
              // 🔧 DEBUG: Show more of the RFP creation rules to verify they're complete
              rfpRulesSection: params.system?.includes('CRITICAL RFP CREATION RULE') 
                ? params.system.split('CRITICAL RFP CREATION RULE')[1]?.substring(0, 800) + '...'
                : 'RFP rules not found',
              // 🚨 TOOL DEBUG: Check if create_and_set_rfp tool is available
              toolsCount: params.tools?.length || 0,
              hasCreateAndSetRfpTool: params.tools?.some((tool: any) => tool.name === 'create_and_set_rfp') || false,
              userMessage: params.messages?.[params.messages.length - 1]?.content || 'no user message',
              messageCount: params.messages?.length || 0,
              allToolNames: params.tools?.map((tool: any) => tool.name).join(', ') || 'no tools'
            });
            
            // 🎯 TOOL CHOICE: Always use 'auto' to let Claude intelligently select tools
            // Claude will autonomously choose appropriate tools based on context and system instructions
            const toolChoice = { type: 'auto' };
            
            const lastUserMessage = params.messages?.[params.messages.length - 1]?.content || '';
            console.log('🎯 TOOL CHOICE DEBUG:', { 
              toolChoice, 
              lastUserMessage: lastUserMessage.substring(0, 100) 
            });

            const stream = await anthropic.messages.create({
              model: params.model || 'claude-3-5-sonnet-20241022',
              max_tokens: params.max_tokens || 4000,
              temperature: params.temperature || 0.7,
              system: params.system,
              messages: params.messages,
              tools: params.tools,
              tool_choice: toolChoice,
              stream: true,
            });

            console.log('🌊 Claude streaming response initiated');

            let fullContent = '';
            let tokenCount = 0;
            let currentToolUse: any = null;
            let toolResults: any[] = [];
            let toolsExecuted = false;
            let anyToolsDetected = false;
            let contentBlocksFinished = 0;
            let totalContentBlocks = 0;

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
                  totalContentBlocks++;
                  console.log('🔍 TOOL DEBUG - Content block start:', messageStreamEvent.content_block?.type);
                  if (messageStreamEvent.content_block?.type === 'tool_use') {
                    console.log('🔧 TOOL DEBUG - Tool use detected:', messageStreamEvent.content_block.name);
                    anyToolsDetected = true; // Mark that we found tools - prevent message_stop from completing
                    currentToolUse = {
                      id: messageStreamEvent.content_block.id,
                      name: messageStreamEvent.content_block.name,
                      input: {},
                    };
                  }
                  
                } else if (messageStreamEvent.type === 'content_block_delta') {
                  if (messageStreamEvent.delta?.type === 'text_delta') {
                    const textChunk = messageStreamEvent.delta.text;
                    
                    // CRITICAL FIX: Don't accumulate or send text chunks when tools are expected
                    // This prevents truncated responses from being sent to the client
                    if (!anyToolsDetected) {
                      fullContent += textChunk;
                      tokenCount++;
                      
                      // Send text chunk only if no tools are involved
                      const sseData = JSON.stringify({
                        type: 'content_delta',
                        delta: textChunk,
                        full_content: fullContent,
                        token_count: tokenCount,
                      });
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                    } else {
                      // Tools detected - suppress text deltas but still count tokens
                      tokenCount++;
                      console.log('🚫 TOOL BYPASS - Suppressing text delta due to tool detection:', textChunk.substring(0, 50));
                    }
                    
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
                  contentBlocksFinished++;
                  console.log('🏁 TOOL DEBUG - Content block stop, currentToolUse:', currentToolUse?.name);
                  
                  if (currentToolUse) {
                    const toolName = currentToolUse?.name || 'Unknown Tool';
                    console.log('🚀 TOOL DEBUG - Executing tool:', toolName);
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
                      console.log(`🔧 DEBUG - Executing tool in streaming context: ${toolName}`);
                      
                      try {
                        console.log(`🔧 Starting tool execution: ${toolName} at ${new Date().toISOString()}`);
                        
                        // Add 30-second timeout to tool execution
                        const toolExecutionPromise = handleFunction({
                          functionName: toolName,
                          parameters: currentToolUse?.input || {},
                          sessionContext: params.sessionContext
                        }, params.userId || 'anonymous');
                        const timeoutPromise = new Promise((_, reject) => {
                          setTimeout(() => {
                            reject(new Error(`Tool execution timeout after 30 seconds for ${toolName}`));
                          }, 30000);
                        });
                        
                        // Execute the tool with timeout
                        const toolResult = await Promise.race([toolExecutionPromise, timeoutPromise]);
                        
                        console.log(`✅ Tool execution completed: ${toolName} at ${new Date().toISOString()}`);
                        
                        const typedResult = toolResult as EdgeFunctionResponse;
                        
                        console.log(`✅ DEBUG - Tool execution result:`, {
                          functionName: toolName,
                          success: typedResult.success,
                          hasCallbacks: typedResult.clientCallbacks && typedResult.clientCallbacks.length > 0
                        });
                        
                        toolResults.push({
                          tool_call_id: currentToolUse?.id || 'unknown',
                          tool_name: toolName,
                          tool_input: currentToolUse.input,
                          result: typedResult
                        });
                        
                        // Send tool result through streaming
                        const toolResultData = JSON.stringify({
                          type: 'tool_result',
                          tool_call_id: currentToolUse.id,
                          result: typedResult,
                        });
                        controller.enqueue(encoder.encode(`data: ${toolResultData}\n\n`));
                        
                        // If there are client callbacks, send them through streaming
                        if (typedResult.clientCallbacks && typedResult.clientCallbacks.length > 0) {
                          console.log(`📤 DEBUG - Sending ${typedResult.clientCallbacks.length} callbacks through streaming`);
                          
                          const callbackData = JSON.stringify({
                            type: 'client_callbacks',
                            callbacks: typedResult.clientCallbacks,
                          });
                          controller.enqueue(encoder.encode(`data: ${callbackData}\n\n`));
                        }
                        
                        toolsExecuted = true;
                        
                      } catch (toolError) {
                        console.error(`❌ Tool execution error for ${toolName}:`, toolError);
                        
                        const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
                        toolResults.push({
                          tool_call_id: currentToolUse?.id || 'unknown',
                          tool_name: toolName,
                          tool_input: currentToolUse.input,
                          error: errorMessage
                        });
                        
                        // Send tool error through streaming
                        const toolErrorData = JSON.stringify({
                          type: 'tool_error',
                          tool_call_id: currentToolUse.id,
                          error: errorMessage,
                        });
                        controller.enqueue(encoder.encode(`data: ${toolErrorData}\n\n`));
                        
                        toolsExecuted = true;
                      }
                      
                    } catch (e) {
                      console.error('Tool use parsing error:', e);
                    }
                    currentToolUse = null;
                  }

                  // Check if all content blocks are finished
                  if (contentBlocksFinished >= totalContentBlocks) {
                    console.log(`🔍 All content blocks finished: ${contentBlocksFinished}/${totalContentBlocks}, toolsExecuted: ${toolsExecuted}, toolResults: ${toolResults.length}`);
                    
                    // If tools were executed, generate a fresh response and send through streaming
                    if (toolsExecuted && toolResults.length > 0) {
                      console.log('🚀 FRESH TOOL RESPONSE - Tools executed, generating fresh response');
                      console.log('🚀 FRESH DEBUG - tool results:', JSON.stringify(toolResults, null, 2));
                      
                      // Format tool results for user-friendly display
                      let formattedResponse = '';
                      
                      // For get_available_agents, use the enhanced function result with IDs
                      const agentTool = toolResults.find(tr => tr.tool_name === 'get_available_agents');
                      const switchAgentTool = toolResults.find(tr => tr.tool_name === 'switch_agent');
                      
                      if (agentTool && !agentTool.error) {
                        console.log('📋 FRESH RESPONSE - Using enhanced agent list with IDs');
                        
                        const agentData = agentTool.result;
                        console.log('📋 DEBUG - Agent data received:', JSON.stringify(agentData, null, 2));
                        
                        // Handle both direct result and nested data structure
                        const data = agentData.data || agentData;
                        console.log('📋 DEBUG - Processed data structure:', { 
                          hasFormattedList: !!data?.formatted_agent_list, 
                          hasAgents: !!data?.agents,
                          agentCount: data?.agents?.length || 0
                        });
                        
                        // Use the pre-formatted agent list that includes IDs
                        if (data && data.formatted_agent_list) {
                          console.log('📋 DEBUG - Using formatted_agent_list');
                          formattedResponse = data.formatted_agent_list;
                        } else if (data && data.agents) {
                          console.log('📋 DEBUG - Using manual formatting with agents array');
                          // Enhanced formatting with IDs prominently displayed
                          formattedResponse = 'Available agents (use ID for switching):\n\n';
                          data.agents.forEach((agent: any) => {
                            formattedResponse += `🤖 **${agent.name}** (ID: ${agent.id})\n`;
                            formattedResponse += `   Access: ${agent.access_level || 'public'}\n`;
                            formattedResponse += `   Role: ${agent.role || 'Assistant'}\n`;
                            if (agent.instructions && agent.instructions.includes('Description:')) {
                              const desc = agent.instructions.split('Description:')[1]?.split('\n')[0]?.trim() || 'AI Assistant';
                              formattedResponse += `   Description: ${desc}\n\n`;
                            } else {
                              formattedResponse += `   Description: AI Assistant\n\n`;
                            }
                          });
                          formattedResponse += '\n💡 To switch agents, use: switch_agent with the agent ID above';
                        } else {
                          // This should not happen with enhanced function
                          formattedResponse = 'No agents available or error retrieving agent data.';
                          formattedResponse += '**Technical Support** (public)\n';
                          formattedResponse += 'Role: Technical Support\n';
                          formattedResponse += 'Description: Provides technical assistance and troubleshooting\n\n';
                        }
                        
                        console.log('📋 FRESH RESPONSE - Formatted response length:', formattedResponse.length);
                      } else if (switchAgentTool && !switchAgentTool.error) {
                        console.log('🔄 FRESH RESPONSE - Agent switch formatting');
                        
                        const switchResult = switchAgentTool.result;
                        if (switchResult.success && switchResult.new_agent) {
                          const agentName = switchResult.new_agent.name || 'Unknown Agent';
                          formattedResponse = `Successfully switched to ${agentName}. I'm now ready to help you with ${agentName.toLowerCase()} tasks.`;
                        } else {
                          formattedResponse = switchResult.message || 'Agent switch completed.';
                        }
                        
                        console.log('🔄 FRESH RESPONSE - Switch formatted response:', formattedResponse);
                      } else {
                        // For other tools, show formatted results
                        const directToolSummary = toolResults.map(tr => {
                          const result = tr.error ? `Error: ${tr.error}` : JSON.stringify(tr.result.data || tr.result, null, 2);
                          return `${tr.tool_name}: ${result}`;
                        }).join('\n\n');
                        formattedResponse = 'Tool Results:\n' + directToolSummary;
                      }
                      
                      console.log('🏁 FRESH RESPONSE - Final response length:', formattedResponse.length);
                      console.log('🏁 FRESH RESPONSE - Final response preview:', formattedResponse.substring(0, 100));
                      
                      // CRITICAL: Replace fullContent with fresh response to prevent truncation
                      fullContent = formattedResponse;
                      
                      // Send the fresh response through streaming instead of returning a Response
                      const freshResponseData = JSON.stringify({
                        type: 'fresh_response',
                        content: formattedResponse,
                        token_count: tokenCount,
                        tool_results: toolResults,
                      });
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(`data: ${freshResponseData}\n\n`));
                      
                      // Send completion event with the fresh content
                      const completionData = JSON.stringify({
                        type: 'complete',
                        full_content: formattedResponse,
                        token_count: tokenCount,
                        tool_results: toolResults,
                        fresh_response: true
                      });
                      controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
                      
                      console.log('✅ Claude streaming response completed with fresh tool response');
                      controller.close();
                      return;
                    }
                    
                    // If no tools were executed, we're done
                    if (!toolsExecuted || toolResults.length === 0) {
                      console.log('🏁 All content blocks completed - sending completion');
                      
                      // Send completion event
                      const sseData = JSON.stringify({
                        type: 'complete',
                        full_content: fullContent,
                        token_count: tokenCount,
                        tool_results: toolResults,
                      });
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                      
                      console.log('✅ Claude streaming response completed (all content blocks finished)');
                      
                      controller.close();
                      return;
                    }
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
                  console.log(`🛑 Message stop event - toolsExecuted: ${toolsExecuted}, toolResults: ${toolResults.length}`);
                  
                  // NEVER complete here if any tools were detected at all
                  // Let content_block_stop handle ALL tool-related completions
                  if (anyToolsDetected) {
                    console.log('🔄 Message stopped but tools detected - content_block_stop will handle all completions');
                    return;
                  }
                  
                  // Only complete if absolutely no tools were detected anywhere
                  const sseData = JSON.stringify({
                    type: 'complete',
                    full_content: fullContent,
                    token_count: tokenCount,
                    tool_results: toolResults,
                  });
                  const encoder = new TextEncoder();
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  
                  console.log('✅ Claude streaming response completed (no tools detected anywhere)');
                  
                  controller.close();
                  return;
                }
              } catch (chunkError) {
                console.error('❌ Error processing stream chunk:', chunkError);
                const errorMessage = chunkError instanceof Error ? chunkError.message : 'Stream processing error';
                const errorData = JSON.stringify({
                  type: 'error',
                  error: errorMessage,
                });
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              }
            }

          } catch (error) {
            console.error('❌ Claude streaming error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Streaming error';
            const errorData = JSON.stringify({
              type: 'error',
              error: errorMessage,
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
        error: error instanceof Error ? error.message : String(error),
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

  // Create and set RFP function - OPTIMIZED for performance (under 30 seconds)
  async createAndSetRfp(params: any, userId: string, sessionContext?: { sessionId: string; timestamp: string }) {
    const startTime = Date.now();
    console.log('� OPTIMIZED createAndSetRfp called:', { name: params?.name, userId });
    
    // Quick parameter validation
    if (!params?.name || typeof params.name !== 'string' || params.name.trim() === '') {
      throw new Error('RFP name is required and must be a non-empty string');
    }
    
    const { name, description = '', specification = '', due_date = null } = params;
    
    console.log('� DEBUG: Parameters validated and extracted:', { name, description, specification, due_date, userId });
    
    try {
      // OPTIMIZED: Single database operation to get user profile AND create session if needed
      console.log(`⏱️ [${new Date().toISOString()}] Step 1: Getting user profile...`);
      
      // Get user profile with current_session_id (with timeout and detailed debugging)
      console.log(`🔍 DEBUG: About to query user_profiles table for userId: ${userId}`);
      
      console.log('🔍 DEBUG: About to execute user profile query');
      
      const profileResult = await dbQuery(
        () => {
          console.log(`🔍 DEBUG: Executing user_profiles query at ${new Date().toISOString()}`);
          return supabase
            .from('user_profiles')
            .select('id, current_session_id')
            .eq('supabase_user_id', userId)
            .single();
        },
        'Get user profile'
      ) as any;
      const { data: profile, error: profileError } = profileResult;
      
      console.log(`🔍 DEBUG: user_profiles query completed at ${new Date().toISOString()}`, { 
        success: !profileError, 
        profileId: profile?.id, 
        error: profileError?.message 
      });
      
      console.log('🔍 DEBUG: Profile query result processed');
      
      console.log(`⏱️ [${new Date().toISOString()}] Step 1 COMPLETE: User profile retrieved`, { profileId: profile?.id, hasSession: !!profile?.current_session_id });
      
      if (profileError || !profile) {
        throw new Error('User profile not found');
      }
      
      // Use existing session or session context, create new session only if absolutely necessary
      let session_id = profile.current_session_id || sessionContext?.sessionId;
      console.log(`⏱️ [${new Date().toISOString()}] Step 2: Session handling - existing: ${session_id}`);
      
      // If no session exists, create one - but don't wait for RPC call
      if (!session_id) {
        console.log(`⏱️ [${new Date().toISOString()}] Step 2a: Creating new session...`);
        console.log(`🔍 DEBUG: About to insert into sessions table for profile.id: ${profile.id}`);
        
        console.log('🔍 DEBUG: About to create new session');
        
        const sessionInsertResult = await dbQuery(
          () => {
            console.log(`🔍 DEBUG: Executing sessions insert at ${new Date().toISOString()}`);
            return supabase
              .from('sessions')
              .insert({
                user_id: profile.id,
                title: `RFP Session - ${name}`,
                description: 'Auto-created for RFP'
              })
              .select('id')
              .single();
          },
          'Create new session'
        ) as any;
        
        const { data: newSession, error: sessionError } = sessionInsertResult;
        
        console.log(`🔍 DEBUG: sessions insert completed at ${new Date().toISOString()}`, {
          success: !sessionError,
          sessionId: newSession?.id,
          error: sessionError?.message
        });
        console.log(`⏱️ [${new Date().toISOString()}] Step 2a COMPLETE: New session created`, { sessionId: newSession?.id });
        
        if (sessionError) {
          throw new Error(`Failed to create session: ${sessionError.message}`);
        }
        session_id = newSession.id;
        
        // Set as current session asynchronously (don't wait)
        supabase.rpc('set_user_current_session', {
          user_uuid: userId,
          session_uuid: session_id
        }).catch((err: any) => console.warn('Non-critical: Failed to set current session:', err));
      }
      
      // OPTIMIZED: Create RFP and update session in parallel
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      
      const rfpData = {
        name: name.trim(),
        description: description?.trim() || 'Created via AI assistant',
        specification: specification?.trim() || 'To be specified',
        due_date: due_date || defaultDueDate.toISOString().split('T')[0]
      };
      
      console.log(`⏱️ [${new Date().toISOString()}] Step 3: Starting parallel RFP creation and session validation...`);
      console.log(`🔍 DEBUG: About to execute parallel operations - RFP insert and session validation`);
      console.log(`🔍 DEBUG: RFP data:`, rfpData);
      console.log(`🔍 DEBUG: Session ID to validate:`, session_id);
      
      console.log('🔍 DEBUG: About to execute parallel RFP creation and session validation');
      
      // Execute RFP creation and session update in parallel with timeout wrapper
      const [rfpResult, sessionResult] = await Promise.all([
        dbQuery(
          () => {
            console.log(`🔍 DEBUG: Executing RFP insert at ${new Date().toISOString()}`);
            return supabase
              .from('rfps')
              .insert(rfpData)
              .select('id, name, description, specification, due_date, created_at')
              .single();
          },
          'Create RFP'
        ),
        dbQuery(
          () => {
            console.log(`🔍 DEBUG: Executing session validation at ${new Date().toISOString()}`);
            return supabase
              .from('sessions')
              .select('id')
              .eq('id', session_id)
              .single();
          },
          'Validate session'
        )
      ]) as [any, any];
      
      console.log(`🔍 DEBUG: Parallel operations completed at ${new Date().toISOString()}`, {
        rfpSuccess: !rfpResult.error,
        rfpId: rfpResult.data?.id,
        sessionSuccess: !sessionResult.error,
        sessionId: sessionResult.data?.id
      });
      console.log(`⏱️ [${new Date().toISOString()}] Step 3 COMPLETE: Parallel operations finished`, { rfpId: rfpResult.data?.id, sessionValid: !sessionResult.error });
      
      if (rfpResult.error) {
        throw new Error(`Failed to create RFP: ${rfpResult.error.message}`);
      }
      
      if (sessionResult.error) {
        throw new Error(`Session validation failed: ${sessionResult.error.message}`);
      }
      
      const newRfp = rfpResult.data;
      
      console.log(`⏱️ [${new Date().toISOString()}] Step 4: Updating session with RFP ID...`);
      console.log(`🔍 DEBUG: About to update session ${session_id} with RFP ID ${newRfp.id}`);
      
      // OPTIMIZED: Update session with new RFP (final step) with timeout wrapper
      const updateResult = await dbQuery(
        () => {
          console.log(`🔍 DEBUG: Executing session update at ${new Date().toISOString()}`);
          return supabase
            .from('sessions')
            .update({ current_rfp_id: newRfp.id })
            .eq('id', session_id);
        },
        'Update session with RFP ID'
      ) as any;
      
      const { error: updateError } = updateResult;
      
      console.log(`🔍 DEBUG: Session update completed at ${new Date().toISOString()}`, {
        success: !updateError,
        error: updateError?.message
      });
      console.log(`⏱️ [${new Date().toISOString()}] Step 4 COMPLETE: Session updated with RFP`, { updateSuccess: !updateError });
      
      if (updateError) {
        console.warn('Non-critical: Failed to set as current RFP:', updateError);
        // Don't throw - RFP was created successfully
      }
      
      const totalTime = Date.now() - startTime;
      const endTimeStamp = new Date().toISOString();
      console.log(`✅ [${endTimeStamp}] RFP CREATION COMPLETE - Total time: ${totalTime}ms, RFP ID: ${newRfp.id}`);
      
      return {
        success: true,
        rfp: newRfp,
        current_rfp_id: newRfp.id,
        session_id: session_id,
        session_auto_created: !profile.current_session_id,
        message: `RFP "${newRfp.name}" created successfully`,
        execution_time_ms: totalTime
      };
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorTimeStamp = new Date().toISOString();
      console.error(`❌ [${errorTimeStamp}] createAndSetRfp FAILED after ${totalTime}ms:`, error);
      throw error;
    }
  }

  // Agent management functions
  async getAvailableAgents(parameters: any, userId: string): Promise<any> {
    try {
      console.log('🔍 DEBUG: getAvailableAgents called with parameters:', parameters, 'userId:', userId);
      
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, name, role, instructions, is_active')
        .eq('is_active', true)
        .order('name');
      
      console.log('🔍 DEBUG: Database query result - agents:', agents, 'error:', error);
      
      if (error) {
        throw new Error(`Failed to get available agents: ${error.message}`);
      }
      
      // Create enhanced agent list with IDs for switching
      const agentList = (agents || []).map((agent: any) => ({
        ...agent,
        display_name_with_id: `**${agent.name}** (public) - ID: ${agent.id}`
      }));

      const result = {
        success: true,
        agents: agentList,
        count: agents?.length || 0,
        formatted_agent_list: agentList.map((agent: any) => agent.display_name_with_id).join('\n'),
        agent_switching_instructions: "To switch agents, use: switch_agent with session_id and one of the agent IDs shown above"
      };
      
      console.log('🔍 DEBUG: Final result being returned:', JSON.stringify(result, null, 2));
      console.log('🔍 DEBUG: Result length:', JSON.stringify(result).length, 'characters');
      
      return result;
    } catch (error) {
      console.error('❌ Error getting available agents:', error);
      throw error;
    }
  }

  async getCurrentAgent(parameters: any, userId: string): Promise<any> {
    const { session_id } = parameters;
    
    try {
      // Get current agent for the session
      const { data: sessionAgent, error } = await supabase
        .from('session_agents')
        .select(`
          agent_id,
          agents!inner(id, name, role, instructions)
        `)
        .eq('session_id', session_id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Failed to get current agent: ${error.message}`);
      }
      
      return {
        success: true,
        current_agent: sessionAgent?.agents || null,
        agent_id: sessionAgent?.agent_id || null
      };
    } catch (error) {
      console.error('❌ Error getting current agent:', error);
      throw error;
    }
  }

  async switchAgent(parameters: any, userId: string): Promise<any> {
    const { session_id, agent_id } = parameters;
    
    if (!session_id || !agent_id) {
      throw new Error('Both session_id and agent_id are required for switch_agent');
    }
    
    try {
      // Verify the agent exists and is active
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, name, role, instructions')
        .eq('id', agent_id)
        .eq('is_active', true)
        .single();
      
      if (agentError) {
        throw new Error(`Agent not found or inactive: ${agentError.message}`);
      }
      
      // Deactivate current agent for this session
      await supabase
        .from('session_agents')
        .update({ is_active: false })
        .eq('session_id', session_id)
        .eq('is_active', true);
      
      // Activate new agent for this session
      const { data: sessionAgent, error: insertError } = await supabase
        .from('session_agents')
        .insert({
          session_id,
          agent_id,
          is_active: true
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Failed to switch agent: ${insertError.message}`);
      }
      
      return {
        success: true,
        new_agent: agent,
        session_agent_id: sessionAgent.id,
        message: `Successfully switched to ${agent.name} agent`
      };
    } catch (error) {
      console.error('❌ Error switching agent:', error);
      throw error;
    }
  }

  async recommendAgent(parameters: any, userId: string): Promise<any> {
    const { context, task_type } = parameters;
    
    try {
      // Simple recommendation logic based on task type
      let recommendedRole = 'Solutions'; // Default
      
      if (task_type) {
        if (task_type.includes('design') || task_type.includes('create')) {
          recommendedRole = 'RFP Design';
        } else if (task_type.includes('technical') || task_type.includes('spec')) {
          recommendedRole = 'Technical Support';
        } else if (task_type.includes('bid') || task_type.includes('proposal')) {
          recommendedRole = 'RFP Assistant';
        }
      }
      
      const { data: agent, error } = await supabase
        .from('agents')
        .select('id, name, role, instructions')
        .eq('role', recommendedRole)
        .eq('is_active', true)
        .single();
      
      if (error) {
        // Fallback to Solutions agent
        const { data: fallbackAgent } = await supabase
          .from('agents')
          .select('id, name, role, instructions')
          .eq('role', 'Solutions')
          .eq('is_active', true)
          .single();
        
        return {
          success: true,
          recommended_agent: fallbackAgent,
          reason: 'Default recommendation (Solutions agent)'
        };
      }
      
      return {
        success: true,
        recommended_agent: agent,
        reason: `Recommended based on task type: ${task_type}`
      };
    } catch (error) {
      console.error('❌ Error recommending agent:', error);
      throw error;
    }
  }

  // Artifact management functions
  async createFormArtifact(parameters: any, userId: string): Promise<any> {
    const { title, content, form_schema, session_id } = parameters;
    
    try {
      const { data: artifact, error } = await supabase
        .from('form_artifacts')
        .insert({
          title,
          content,
          form_schema,
          session_id,
          user_id: userId,
          type: 'form'
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create form artifact: ${error.message}`);
      }
      
      return {
        success: true,
        artifact_id: artifact.id,
        artifact,
        message: `Form artifact "${title}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating form artifact:', error);
      throw error;
    }
  }

  async createTextArtifact(parameters: any, userId: string): Promise<any> {
    const { title, content, session_id } = parameters;
    
    try {
      const { data: artifact, error } = await supabase
        .from('artifacts')
        .insert({
          title,
          content,
          session_id,
          user_id: userId,
          type: 'text'
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create text artifact: ${error.message}`);
      }
      
      return {
        success: true,
        artifact_id: artifact.id,
        artifact,
        message: `Text artifact "${title}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating text artifact:', error);
      throw error;
    }
  }

  async generateRequestArtifact(parameters: any, userId: string): Promise<any> {
    const { rfp_id, session_id } = parameters;
    
    try {
      // Get RFP details
      const { data: rfp, error: rfpError } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', rfp_id)
        .single();
      
      if (rfpError) {
        throw new Error(`Failed to get RFP: ${rfpError.message}`);
      }
      
      // Generate request content based on RFP
      const requestContent = {
        rfp_name: rfp.name,
        description: rfp.description,
        specification: rfp.specification,
        due_date: rfp.due_date,
        generated_at: new Date().toISOString()
      };
      
      const { data: artifact, error } = await supabase
        .from('artifacts')
        .insert({
          title: `Request for ${rfp.name}`,
          content: JSON.stringify(requestContent),
          session_id,
          user_id: userId,
          type: 'request',
          rfp_id
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create request artifact: ${error.message}`);
      }
      
      return {
        success: true,
        artifact_id: artifact.id,
        artifact,
        rfp,
        message: `Request artifact generated for "${rfp.name}"`
      };
    } catch (error) {
      console.error('❌ Error generating request artifact:', error);
      throw error;
    }
  }

  async updateFormArtifact(parameters: any, userId: string): Promise<any> {
    const { artifact_id, content, form_schema } = parameters;
    
    try {
      const updateData: any = {};
      if (content !== undefined) updateData.content = content;
      if (form_schema !== undefined) updateData.form_schema = form_schema;
      
      const { data: artifact, error } = await supabase
        .from('form_artifacts')
        .update(updateData)
        .eq('id', artifact_id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update form artifact: ${error.message}`);
      }
      
      return {
        success: true,
        artifact_id,
        artifact,
        message: 'Form artifact updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating form artifact:', error);
      throw error;
    }
  }

  async getFormSubmission(parameters: any, userId: string): Promise<any> {
    const { artifact_id } = parameters;
    
    try {
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('artifact_id', artifact_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to get form submissions: ${error.message}`);
      }
      
      return {
        success: true,
        submissions: submissions || [],
        count: submissions?.length || 0
      };
    } catch (error) {
      console.error('❌ Error getting form submissions:', error);
      throw error;
    }
  }

  async validateFormData(parameters: any, userId: string): Promise<any> {
    const { form_data, form_schema } = parameters;
    
    try {
      // Basic validation - in a real implementation, you'd use a schema validator
      const errors: string[] = [];
      
      if (!form_data || typeof form_data !== 'object') {
        errors.push('Form data must be an object');
      }
      
      if (!form_schema || typeof form_schema !== 'object') {
        errors.push('Form schema must be an object');
      }
      
      return {
        success: errors.length === 0,
        valid: errors.length === 0,
        errors,
        message: errors.length === 0 ? 'Form data is valid' : `Validation failed: ${errors.join(', ')}`
      };
    } catch (error) {
      console.error('❌ Error validating form data:', error);
      throw error;
    }
  }

  async createArtifactTemplate(parameters: any, userId: string): Promise<any> {
    const { name, template_schema, description } = parameters;
    
    try {
      const { data: template, error } = await supabase
        .from('artifact_templates')
        .insert({
          name,
          template_schema,
          description,
          created_by: userId
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create artifact template: ${error.message}`);
      }
      
      return {
        success: true,
        template_id: template.id,
        template,
        message: `Artifact template "${name}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating artifact template:', error);
      throw error;
    }
  }

  async listArtifactTemplates(parameters: any, userId: string): Promise<any> {
    try {
      const { data: templates, error } = await supabase
        .from('artifact_templates')
        .select('id, name, description, created_at')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Failed to list artifact templates: ${error.message}`);
      }
      
      return {
        success: true,
        templates: templates || [],
        count: templates?.length || 0
      };
    } catch (error) {
      console.error('❌ Error listing artifact templates:', error);
      throw error;
    }
  }

  // RFP management functions
  async setCurrentRfp(parameters: any, userId: string): Promise<any> {
    const { session_id, rfp_id } = parameters;
    
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .update({ current_rfp_id: rfp_id })
        .eq('id', session_id)
        .select('id, current_rfp_id')
        .single();
      
      if (error) {
        throw new Error(`Failed to set current RFP: ${error.message}`);
      }
      
      return {
        success: true,
        current_rfp_id: rfp_id,
        session_id,
        message: 'Current RFP set successfully'
      };
    } catch (error) {
      console.error('❌ Error setting current RFP:', error);
      throw error;
    }
  }

  async refreshCurrentRfp(parameters: any, userId: string): Promise<any> {
    const { session_id } = parameters;
    
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('current_rfp_id, rfps(*)')
        .eq('id', session_id)
        .single();
      
      if (error) {
        throw new Error(`Failed to refresh current RFP: ${error.message}`);
      }
      
      return {
        success: true,
        current_rfp: session.rfps,
        current_rfp_id: session.current_rfp_id,
        message: 'Current RFP refreshed successfully'
      };
    } catch (error) {
      console.error('❌ Error refreshing current RFP:', error);
      throw error;
    }
  }

  async getArtifactStatus(parameters: any, userId: string): Promise<any> {
    const { artifact_id } = parameters;
    
    try {
      const { data: artifact, error } = await supabase
        .from('artifacts')
        .select('id, title, type, created_at, updated_at')
        .eq('id', artifact_id)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        throw new Error(`Failed to get artifact status: ${error.message}`);
      }
      
      return {
        success: true,
        artifact,
        status: 'active',
        message: 'Artifact status retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error getting artifact status:', error);
      throw error;
    }
  }

  async generateRfpBidUrl(parameters: any, userId: string): Promise<any> {
    const { rfp_id } = parameters;
    
    try {
      // In a real implementation, this would generate a secure URL
      const bidUrl = `https://rfpez.ai/bid/${rfp_id}`;
      
      return {
        success: true,
        rfp_id,
        bid_url: bidUrl,
        message: 'RFP bid URL generated successfully'
      };
    } catch (error) {
      console.error('❌ Error generating RFP bid URL:', error);
      throw error;
    }
  }
}

// Client callback generator
function generateClientCallbacks(functionName: string, result: any, params?: any): ClientCallback[] {
  const callbacks: ClientCallback[] = [];
  
  console.log(`🔄 DEBUG - Generating callbacks for ${functionName}:`, {
    functionName,
    resultSuccess: result?.success,
    resultKeys: result ? Object.keys(result) : 'none',
    paramsKeys: params ? Object.keys(params) : 'none'
  });
  
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
      
    case 'create_and_set_rfp':
      if (result.success && result.current_rfp_id) {
        callbacks.push({
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: { 
            rfp_id: result.current_rfp_id,
            rfp_name: result.rfp?.name,
            rfp_data: result.rfp, // Include full RFP data to avoid database re-query
            message: result.message 
          }
        });
      }
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
  
  console.log(`📤 DEBUG - Generated callbacks:`, {
    functionName,
    callbackCount: callbacks.length,
    callbacks: callbacks.map(cb => ({
      type: cb.type,
      target: cb.target,
      payloadKeys: cb.payload ? Object.keys(cb.payload) : 'none'
    }))
  });
  
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
  
  console.log(`📊 DEBUG - Function call details:`, {
    functionName,
    parameterKeys: parameters ? Object.keys(parameters) : 'none',
    parametersSize: parameters ? JSON.stringify(parameters).length : 0,
    hasSessionContext: !!sessionContext
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
        console.log(`🚨 TIMEOUT TEST: About to call createAndSetRfp with database timeouts at ${new Date().toISOString()}`);
        result = await dbHandler.createAndSetRfp(parameters, userId, sessionContext);
        console.log(`🚨 TIMEOUT TEST: createAndSetRfp completed at ${new Date().toISOString()}`);
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
        
      // Agent management functions
      case 'get_available_agents':
        result = await dbHandler.getAvailableAgents(parameters, userId);
        break;
        
      case 'get_current_agent':
        result = await dbHandler.getCurrentAgent(parameters, userId);
        break;
        
      case 'switch_agent':
        result = await dbHandler.switchAgent(parameters, userId);
        break;
        
      case 'recommend_agent':
        result = await dbHandler.recommendAgent(parameters, userId);
        break;
        
      // Artifact management functions
      case 'create_form_artifact':
        result = await dbHandler.createFormArtifact(parameters, userId);
        break;
        
      case 'create_text_artifact':
        result = await dbHandler.createTextArtifact(parameters, userId);
        break;
        
      case 'generate_request_artifact':
        result = await dbHandler.generateRequestArtifact(parameters, userId);
        break;
        
      case 'update_form_artifact':
        result = await dbHandler.updateFormArtifact(parameters, userId);
        break;
        
      case 'get_form_submission':
        result = await dbHandler.getFormSubmission(parameters, userId);
        break;
        
      case 'validate_form_data':
        result = await dbHandler.validateFormData(parameters, userId);
        break;
        
      case 'create_artifact_template':
        result = await dbHandler.createArtifactTemplate(parameters, userId);
        break;
        
      case 'list_artifact_templates':
        result = await dbHandler.listArtifactTemplates(parameters, userId);
        break;
        
      // RFP management functions
      case 'set_current_rfp':
        result = await dbHandler.setCurrentRfp(parameters, userId);
        break;
        
      case 'refresh_current_rfp':
        result = await dbHandler.refreshCurrentRfp(parameters, userId);
        break;
        
      case 'get_artifact_status':
        result = await dbHandler.getArtifactStatus(parameters, userId);
        break;
        
      case 'generate_rfp_bid_url':
        result = await dbHandler.generateRfpBidUrl(parameters, userId);
        break;
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
    
    // Generate client callbacks
    const clientCallbacks = generateClientCallbacks(functionName, result, parameters);
    
    console.log(`📤 DEBUG - Response generation:`, {
      functionName,
      resultSuccess: result?.success,
      resultDataKeys: result?.data ? Object.keys(result.data) : 'none',
      callbackCount: clientCallbacks.length,
      callbacks: clientCallbacks,
      requiresClientAction: clientCallbacks.length > 0
    });
    
    const response = {
      success: true,
      data: result,
      clientCallbacks,
      requiresClientAction: clientCallbacks.length > 0,
      message: `Function ${functionName} executed successfully`
    };
    
    console.log(`📋 DEBUG - Final response:`, {
      responseSuccess: response.success,
      responseDataExists: !!response.data,
      responseCallbackCount: response.clientCallbacks?.length || 0,
      responseSize: JSON.stringify(response).length
    });
    
    return response;
    
  } catch (error) {
    console.error(`❌ Error handling function ${functionName}:`, error);
    
    return {
      success: false,
      data: null,
      clientCallbacks: [],
      requiresClientAction: false,
      message: `Error executing ${functionName}: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// HTTP handler
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
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
      
      // DEBUG: Log the tools parameter
      console.log('🔧 DEBUG: Tools parameter received:', {
        hasTools: !!parameters.tools,
        toolsLength: parameters.tools?.length || 0,
        toolNames: parameters.tools?.map((t: any) => t.name) || 'no tools',
        firstToolSchema: parameters.tools?.[0] || 'no first tool'
      });
      
      // DEBUG: Log system prompt with simplified instructions
      console.log('🧪 DEBUG: System prompt details:', {
        hasSystem: !!parameters.system,
        systemLength: parameters.system?.length || 0,
        systemPreview: parameters.system?.substring(0, 500) + '...',
        hasRfpRule: (parameters.system || '').includes('CRITICAL RFP CREATION RULE'),
        hasCreateTool: (parameters.system || '').includes('create_and_set_rfp'),
        hasTriggerWords: (parameters.system || '').includes('MANDATORY TRIGGER WORDS')
      });
      
      const claudeHandler = new ClaudeAPIHandler();
      // Add sessionContext and userId to parameters for streaming
      const streamingParams = {
        ...parameters,
        sessionContext: sessionContext,
        userId: userId
      };
      const streamResponse = await claudeHandler.generateStreamingResponse(streamingParams);
      
      return new Response(streamResponse, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
        },
      });
    }

    // Handle regular function calls
    const response = await handleFunction({ functionName, parameters, sessionContext }, userId);

    console.log(`🌐 DEBUG - Sending HTTP response:`, {
      functionName,
      responseSuccess: response.success,
      responseStatus: response.success ? 200 : 400,
      responseCallbacks: response.clientCallbacks?.length || 0,
      responseSize: JSON.stringify(response).length,
      hasData: !!response.data
    });

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
      },
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
      },
    });
  }
});

console.log('🚀 Claude API Edge Function v2 is running');
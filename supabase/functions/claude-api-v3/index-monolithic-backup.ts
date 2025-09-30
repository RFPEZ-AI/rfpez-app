// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Edge Function v3 - Unified Architecture with Stream Safety
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
    toolsUsed?: string[];
    executionTime?: number;
    toolInvocations?: number;
    clientCallbacks?: ClientCallback[];
  };
}

interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification';
  target: string;
  payload: any;
  priority?: 'low' | 'normal' | 'high'; // Optional with default
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
      console.error(`❌ DB QUERY ERROR: ${operationName} at ${new Date().toISOString()}:`, error);
      throw error;
    });
}

// Tool execution function
async function executeTool(
  toolName: string,
  parameters: any,
  userId: string,
  sessionContext: any
): Promise<any> {
  console.log(`🔧 Executing tool: ${toolName}`);
  
  try {
    switch (toolName) {
      case 'create_and_set_rfp':
        return await createAndSetRfp(parameters, userId, sessionContext);
      
      case 'store_message':
        return await storeMessage(parameters, userId);
      
      case 'create_form_artifact':
        return await createFormArtifact(parameters, userId);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`❌ Tool execution failed: ${toolName}`, error);
    throw error;
  }
}



// Store message tool implementation
async function storeMessage(parameters: any, userId: string, sessionContext?: any): Promise<any> {
  console.log('💬 Storing message:', parameters);
  
  try {
    // Get or create valid user ID for message storage
    const validUserId = await getOrCreateAnonymousUser(userId);
    
    // Get session ID to use - prefer sessionContext, fallback to parameters
    const inputSessionId = sessionContext?.sessionId || parameters.session_id;
    
    // Validate we have some session identifier
    if (!inputSessionId) {
      throw new Error('No session ID provided in sessionContext or parameters');
    }
    
    // Convert to valid database session UUID (handles both UUID and anonymous session formats)
    const validSessionId = await getOrCreateValidSession(inputSessionId, userId);
    
    console.log(`📝 Using session ID: ${validSessionId} (from input: ${inputSessionId})`);
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        session_id: validSessionId,
        content: parameters.message,
        role: parameters.role,
        user_id: validUserId,
        agent_id: parameters.agent_id || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store message: ${error.message}`);
    }

    // Update session timestamp to maintain proper ordering
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validSessionId);

    return {
      success: true,
      message_id: message.id,
      message: 'Message stored successfully'
    };
  } catch (error) {
    console.error('❌ storeMessage failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error storing message'
    };
  }
}

// Get or create anonymous user profile
async function getOrCreateAnonymousUser(userId: string): Promise<string> {
  if (userId === 'anonymous') {
    // For anonymous users, use the dedicated anonymous user profile
    // This UUID is seeded in the database specifically for anonymous sessions
    const anonymousUserId = '00000000-0000-0000-0000-000000000001';
    
    console.log(`✅ Using dedicated anonymous user profile: ${anonymousUserId}`);
    return anonymousUserId;
  }
  
  return userId; // Return existing authenticated user ID
}

// Get auth user ID for artifacts (which reference auth.users, not user_profiles)
async function getAuthUserIdForArtifacts(userId: string): Promise<string> {
  if (userId === 'anonymous') {
    // For anonymous users, use the auth user ID that backs the anonymous profile
    const authUserId = '4695d39c-38b9-4830-a9ed-c918e03058ca';
    
    console.log(`✅ Using auth user ID for artifacts: ${authUserId}`);
    return authUserId;
  }
  
  // For authenticated users, we need to look up their auth user ID from their profile
  // This assumes userId is a user_profiles.id, we need to get the supabase_user_id
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('supabase_user_id')
    .eq('id', userId)
    .single();
  
  if (userProfile?.supabase_user_id) {
    return userProfile.supabase_user_id;
  }
  
  // Fallback - assume userId is already an auth user ID
  return userId;
}

// Session management helper function
async function getOrCreateValidSession(sessionIdInput: string, userId: string): Promise<string> {
  // Check if the input is already a valid UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidPattern.test(sessionIdInput)) {
    // It's already a UUID, check if session exists
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionIdInput)
      .single();
    
    if (existingSession) {
      return sessionIdInput;
    }
  }
  
  // Get or create valid user ID for session creation
  const validUserId = await getOrCreateAnonymousUser(userId);
  
  // Either not a UUID or session doesn't exist - create a new session
  const { data: newSession, error } = await supabase
    .from('sessions')
    .insert({
      user_id: validUserId,
      title: `Session: ${sessionIdInput}`,
      description: `Generated from session identifier: ${sessionIdInput}`,
      session_metadata: { original_session_id: sessionIdInput }
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('❌ Failed to create session:', error);
    throw new Error(`Failed to create session: ${error.message}`);
  }
  
  console.log(`✅ Created new session ${newSession.id} for input: ${sessionIdInput}`);
  return newSession.id;
}

// Create form artifact tool implementation
// Map artifact roles to valid database constraint values
function mapArtifactRole(role: string): string | null {
  const roleMapping: Record<string, string> = {
    // Vendor/supplier response forms -> bid_form
    'vendor_response_form': 'bid_form',
    'supplier_response_form': 'bid_form',
    'vendor_form': 'bid_form',
    'supplier_form': 'bid_form',
    'response_form': 'bid_form',
    // Buyer forms -> buyer_questionnaire  
    'buyer_form': 'buyer_questionnaire',
    'requirements_form': 'buyer_questionnaire',
    // Valid roles pass through
    'buyer_questionnaire': 'buyer_questionnaire',
    'bid_form': 'bid_form',
    'request_document': 'request_document',
    'template': 'template'
  };
  
  return roleMapping[role] || null;
}

// Create form artifact function
async function createFormArtifact(parameters: any, userId: string): Promise<any> {
  console.log('📋 Creating form artifact:', parameters);
  
  try {
    // Generate unique artifact ID with proper UUID
    const artifactId = crypto.randomUUID();
    
    // Get or create a valid session UUID
    const validSessionId = await getOrCreateValidSession(parameters.session_id, userId);
    
    // Get auth user ID for artifact creation (artifacts table references auth.users.id)
    const authUserId = await getAuthUserIdForArtifacts(userId);
    
    const { data: artifact, error } = await supabase
      .from('artifacts')
      .insert({
        id: artifactId,
        session_id: validSessionId,
        name: parameters.title,
        description: `Form artifact: ${parameters.title}`,
        type: 'form',
        schema: parameters.form_schema,
        ui_schema: parameters.ui_schema || {},
        submit_action: { type: parameters.submit_action || 'save' },
        artifact_role: mapArtifactRole(parameters.artifact_role) || 'buyer_questionnaire',
        user_id: authUserId,
        status: 'active',
        processing_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create form artifact: ${error.message}`);
    }

    return {
      success: true,
      artifact_id: artifact.id,
      session_id: validSessionId,
      message: `Form artifact "${artifact.name}" created successfully`
    };
  } catch (error) {
    console.error('❌ createFormArtifact failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating form artifact'
    };
  }
}

// User authentication helper function
async function getUserFromAuth(authHeader: string | null): Promise<{ user: any; profile: any } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Check if this is the anonymous key - don't try to get user from anonymous key
  const anonymousKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM';
  
  if (token === anonymousKey) {
    console.log('🔓 Anonymous token detected, skipping user auth');
    return null; // Return null for anonymous users to avoid auth errors
  }
  
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

// Initialize Anthropic client
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
if (!anthropicApiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

// CORS headers for responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

// Claude API wrapper with enhanced streaming and tool transparency
class ClaudeAPIService {
  // Enhanced streaming response with tool execution transparency
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
    console.log('🌊 Starting unified streaming response with tool transparency');
    
    return new ReadableStream({
      start(controller) {
        (async () => {
          let streamClosed = false;
          
          // Helper function to safely enqueue data
          const safeEnqueue = (data: string) => {
            if (!streamClosed && controller.desiredSize !== null) {
              try {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(data));
              } catch (error) {
                console.error('❌ Stream enqueue error:', error);
                streamClosed = true;
              }
            }
          };
          
          // Helper function to safely close stream
          const safeClose = () => {
            if (!streamClosed && controller.desiredSize !== null) {
              try {
                controller.close();
                streamClosed = true;
              } catch (error) {
                console.error('❌ Stream close error:', error);
                streamClosed = true;
              }
            }
          };
          
          try {
            const streamingEvents: StreamingResponse[] = [];
            const toolInvocations: ToolInvocationEvent[] = [];
            const clientCallbacks: ClientCallback[] = [];
            
            // Start Claude streaming
            const stream = await anthropic.messages.stream({
              model: params.model || 'claude-sonnet-4-20250514',
              max_tokens: params.max_tokens || 4000,
              temperature: params.temperature || 0.3,
              system: params.system || '',
              messages: params.messages,
              tools: params.tools || [],
              tool_choice: { type: 'auto' }
            });

            // Tool processing variables
            let currentToolUse: any = null;
            let toolResults: any[] = [];
            let anyToolsDetected = false;
            let toolsExecuted = false;
            let totalContentBlocks = 0;
            let contentBlocksFinished = 0;
            let fullContent = '';
            let tokenCount = 0;

            // Process streaming events with tool execution
            for await (const chunk of stream) {
              switch (chunk.type) {
                case 'message_start':
                  console.log('📨 Message started');
                  break;
                  
                case 'content_block_start':
                  totalContentBlocks++;
                  
                  if (chunk.content_block.type === 'tool_use') {
                    console.log(`🔧 Tool detected: ${chunk.content_block.name}`);
                    anyToolsDetected = true;
                    
                    currentToolUse = {
                      id: chunk.content_block.id,
                      name: chunk.content_block.name,
                      input: {},
                      partial_input: ''
                    };
                    
                    const toolEvent: ToolInvocationEvent = {
                      type: 'tool_start',
                      toolName: chunk.content_block.name,
                      parameters: {},
                      timestamp: new Date().toISOString()
                    };
                    
                    toolInvocations.push(toolEvent);
                    
                    const streamingEvent: StreamingResponse = {
                      type: 'tool_invocation',
                      toolEvent: toolEvent
                    };
                    
                    streamingEvents.push(streamingEvent);
                    safeEnqueue(`data: ${JSON.stringify(streamingEvent)}\n\n`);
                  }
                  break;
                  
                case 'content_block_delta':
                  if (chunk.delta.type === 'text_delta') {
                    const textChunk = chunk.delta.text;
                    
                    if (!anyToolsDetected) {
                      fullContent += textChunk;
                      tokenCount++;
                      
                      const streamingEvent: StreamingResponse = {
                        type: 'text',
                        content: textChunk
                      };
                      
                      streamingEvents.push(streamingEvent);
                      safeEnqueue(`data: ${JSON.stringify(streamingEvent)}\n\n`);
                    } else {
                      tokenCount++;
                      console.log('🚫 Suppressing text delta due to tool detection');
                    }
                    
                  } else if (chunk.delta.type === 'input_json_delta') {
                    if (currentToolUse) {
                      currentToolUse.partial_input = (currentToolUse.partial_input || '') + chunk.delta.partial_json;
                    }
                  }
                  break;
                  
                case 'content_block_stop':
                  contentBlocksFinished++;
                  console.log(`🏁 Content block stop (${contentBlocksFinished}/${totalContentBlocks})`);
                  
                  if (currentToolUse) {
                    try {
                      // Parse complete tool input
                      currentToolUse.input = JSON.parse(currentToolUse.partial_input || '{}');
                      delete currentToolUse.partial_input;
                      
                      console.log(`🚀 Executing tool: ${currentToolUse.name}`);
                      
                      // Execute the tool
                      const toolStartTime = Date.now();
                      const toolResult = await executeFunction({
                        functionName: currentToolUse.name,
                        parameters: currentToolUse.input,
                        sessionContext: params.sessionContext
                      }, params.userId || 'anonymous');
                      
                      const executionTime = Date.now() - toolStartTime;
                      
                      console.log(`✅ Tool execution completed: ${currentToolUse.name} (${executionTime}ms)`);
                      
                      // Update tool invocation with result
                      const toolEvent: ToolInvocationEvent = {
                        type: 'tool_complete',
                        toolName: currentToolUse.name,
                        parameters: currentToolUse.input,
                        result: toolResult,
                        timestamp: new Date().toISOString(),
                        duration: executionTime
                      };
                      
                      toolInvocations.push(toolEvent);
                      
                      // Store result
                      toolResults.push({
                        tool_call_id: currentToolUse.id,
                        tool_name: currentToolUse.name,
                        tool_input: currentToolUse.input,
                        result: toolResult
                      });
                      
                      // Send tool result event
                      const resultEvent: StreamingResponse = {
                        type: 'tool_invocation',
                        toolEvent: toolEvent
                      };
                      
                      streamingEvents.push(resultEvent);
                      safeEnqueue(`data: ${JSON.stringify(resultEvent)}\n\n`);
                      
                      // Send client callbacks if any
                      if (toolResult.clientCallbacks && toolResult.clientCallbacks.length > 0) {
                        for (const callback of toolResult.clientCallbacks) {
                          clientCallbacks.push(callback);
                        }
                        
                        const callbackEvent: StreamingResponse = {
                          type: 'completion',
                          metadata: {
                            clientCallbacks: toolResult.clientCallbacks
                          }
                        };
                        
                        safeEnqueue(`data: ${JSON.stringify(callbackEvent)}\n\n`);
                      }
                      
                      toolsExecuted = true;
                      
                    } catch (toolError) {
                      console.error(`❌ Tool execution error for ${currentToolUse.name}:`, toolError);
                      
                      const errorMessage = toolError instanceof Error ? toolError.message : String(toolError);
                      
                      const toolEvent: ToolInvocationEvent = {
                        type: 'tool_error',
                        toolName: currentToolUse.name,
                        parameters: currentToolUse.input,
                        error: errorMessage,
                        timestamp: new Date().toISOString()
                      };
                      
                      toolInvocations.push(toolEvent);
                      
                      const errorEvent: StreamingResponse = {
                        type: 'tool_invocation',
                        toolEvent: toolEvent
                      };
                      
                      safeEnqueue(`data: ${JSON.stringify(errorEvent)}\n\n`);
                      
                      toolsExecuted = true;
                    }
                    
                    currentToolUse = null;
                  }
                  break;
                  
                case 'message_delta':
                  if (chunk.usage) {
                    const streamingEvent: StreamingResponse = {
                      type: 'completion',
                      metadata: {
                        tokenCount: chunk.usage.output_tokens,
                        usage: chunk.usage
                      }
                    };
                    
                    streamingEvents.push(streamingEvent);
                    safeEnqueue(`data: ${JSON.stringify(streamingEvent)}\n\n`);
                  }
                  break;
                  
                case 'message_stop':
                  console.log('✅ Message completed');
                  
                  // If tools were executed, we need a follow-up call for Claude's final response
                  if (toolsExecuted && toolResults.length > 0) {
                    console.log('🔄 Making follow-up call for final response after tool execution');
                    
                    try {
                      // Prepare follow-up messages
                      const followUpMessages = [...params.messages];
                      
                      // Add the assistant's tool calls using ORIGINAL tool IDs
                      const toolCallsContent = toolResults.map(result => ({
                        type: 'tool_use',
                        id: result.tool_call_id,
                        name: result.tool_name,
                        input: result.tool_input
                      }));
                      
                      if (toolCallsContent.length > 0) {
                        followUpMessages.push({
                          role: 'assistant',
                          content: toolCallsContent
                        });
                        
                        // Add tool results with matching IDs
                        const toolResultsContent = toolResults.map(result => ({
                          type: 'tool_result',
                          tool_use_id: result.tool_call_id,
                          content: JSON.stringify(result.result, null, 2)
                        }));
                        
                        followUpMessages.push({
                          role: 'user',
                          content: toolResultsContent
                        });
                        
                        // Ensure Claude provides a user-facing response
                        const followUpSystemPrompt = (params.system || '') + '\n\nCRITICAL: You MUST provide a helpful text response to the user after executing tools. The user is waiting for your response. Always explain what you did and provide relevant information, guidance, or next steps. Never end with just tool execution - always follow up with explanatory text for the user.';
                        
                        // Make non-streaming follow-up call
                        const followUpResponse = await anthropic.messages.create({
                          model: params.model || 'claude-sonnet-4-20250514',
                          max_tokens: params.max_tokens || 4000,
                          temperature: params.temperature || 0.7,
                          system: followUpSystemPrompt,
                          messages: followUpMessages,
                          stream: false
                        });
                        
                        // Stream the final response
                        console.log('Follow-up response content blocks:', followUpResponse.content?.length || 0);
                        if (followUpResponse.content) {
                          for (const contentBlock of followUpResponse.content) {
                            console.log('Processing content block:', contentBlock.type, contentBlock.type === 'text' ? contentBlock.text.length + ' chars' : '');
                            if (contentBlock.type === 'text') {
                              const text = contentBlock.text.trim();
                              if (text) {
                                console.log('Streaming follow-up text:', text.substring(0, 100) + '...');
                                const textEvent: StreamingResponse = {
                                  type: 'text',
                                  content: text
                                };
                                safeEnqueue(`data: ${JSON.stringify(textEvent)}\n\n`);
                              } else {
                                console.log('Warning: Follow-up text content is empty');
                                // Send a fallback message
                                const fallbackText = "Task completed successfully.";
                                const textEvent: StreamingResponse = {
                                  type: 'text',
                                  content: fallbackText
                                };
                                safeEnqueue(`data: ${JSON.stringify(textEvent)}\n\n`);
                              }
                            }
                          }
                        } else {
                          console.log('Warning: No follow-up response content');
                          // Send a fallback message
                          const fallbackText = "Task completed successfully.";
                          const textEvent: StreamingResponse = {
                            type: 'text',
                            content: fallbackText
                          };
                          safeEnqueue(`data: ${JSON.stringify(textEvent)}\n\n`);
                        }
                      }
                    } catch (followUpError) {
                      console.error('❌ Follow-up call failed:', followUpError);
                      const errorEvent: StreamingResponse = {
                        type: 'error',
                        content: `Follow-up call failed: ${followUpError instanceof Error ? followUpError.message : 'Unknown error'}`
                      };
                      safeEnqueue(`data: ${JSON.stringify(errorEvent)}\n\n`);
                    }
                  }
                  
                  // Send final completion event
                  const completionEvent: StreamingResponse = {
                    type: 'completion',
                    metadata: {
                      model: params.model || 'claude-sonnet-4-20250514',
                      toolsUsed: toolInvocations.map(t => t.toolName),
                      executionTime: 0, // TODO: Add proper timing
                      toolInvocations: toolInvocations.length,
                      clientCallbacks: clientCallbacks.length > 0 ? clientCallbacks : undefined
                    }
                  };
                  
                  safeEnqueue(`data: ${JSON.stringify(completionEvent)}\n\n`);
                  safeClose();
                  break;
              }
            }
            
          } catch (error) {
            console.error('❌ Streaming error:', error);
            const errorEvent: StreamingResponse = {
              type: 'error',
              content: `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
            
            safeEnqueue(`data: ${JSON.stringify(errorEvent)}\n\n`);
            safeClose();
          }
        })();
      }
    });
  }
}

const claudeService = new ClaudeAPIService();

// Tool execution function
async function executeFunction(functionCall: any, userId: string): Promise<any> {
  const { functionName, parameters, sessionContext } = functionCall;
  
  console.log(`🚀 Executing function: ${functionName}`, { 
    userId, 
    parameters,
    sessionContext: sessionContext ? { sessionId: sessionContext.sessionId } : 'none'
  });
  
  try {
    let result: any;
    
    // Route function calls
    switch (functionName) {
      case 'create_and_set_rfp':
        result = await createAndSetRfp(parameters, userId, sessionContext);
        break;
        
      case 'store_message':
        result = await storeMessage(parameters, userId, sessionContext);
        break;
        
      case 'create_form_artifact':
        result = await createFormArtifact(parameters, userId);
        break;
        
      case 'switch_agent':
        result = await switchAgent(parameters, userId, sessionContext);
        break;
        
      // Add other essential functions here as needed
      default:
        console.warn(`⚠️ Unknown function: ${functionName}`);
        result = {
          success: false,
          error: `Function ${functionName} not implemented in claude-api-v3`,
          data: null
        };
        break;
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Function execution error for ${functionName}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Create and set RFP function
async function createAndSetRfp(parameters: any, userId: string, sessionContext?: any): Promise<any> {
  console.log('🎯 Creating and setting RFP:', parameters);
  
  try {
    // Build RFP data using actual database schema
    const rfpData = {
      name: parameters.name || 'New RFP',
      description: parameters.description || null,
      specification: parameters.specification || null,
      due_date: parameters.due_date || null,
      status: 'draft',
      created_at: new Date().toISOString(),
      is_template: false,
      is_public: false,
      completion_percentage: 0
    };
    
    console.log('📝 Inserting RFP with data:', rfpData);
    
    // Insert RFP into database
    const { data: newRfp, error: insertError } = await supabase
      .from('rfps')
      .insert([rfpData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ RFP creation error:', insertError);
      throw new Error(`Failed to create RFP: ${insertError.message}`);
    }
    
    console.log('✅ RFP created successfully:', newRfp);
    
    // Update session to set current RFP if sessionId is provided
    if (sessionContext?.sessionId) {
      console.log('🔗 Setting current RFP in session:', sessionContext.sessionId);
      
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ current_rfp_id: newRfp.id })
        .eq('id', sessionContext.sessionId);
      
      if (updateError) {
        console.warn('⚠️ Failed to set current RFP in session:', updateError);
        // Don't fail the whole operation for this
      } else {
        console.log('✅ Current RFP set in session');
      }
    }
    
    // Return success response with client callbacks
    return {
      success: true,
      data: newRfp,
      current_rfp_id: newRfp.id,
      rfp: newRfp,
      message: `RFP "${newRfp.name}" created successfully with ID ${newRfp.id}`,
      clientCallbacks: [
        {
          type: 'ui_refresh',
          target: 'rfp_context',
          payload: {
            rfp_id: newRfp.id,
            rfp_name: newRfp.name,
            rfp_data: newRfp,
            message: `RFP "${newRfp.name}" has been created successfully`
          },
          priority: 'high'
        }
      ]
    };
    
  } catch (error) {
    console.error('❌ createAndSetRfp error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Switch agent function
async function switchAgent(parameters: any, userId: string, sessionContext?: any): Promise<any> {
  console.log('🔄 Switching agent:', parameters);
  
  try {
    const { session_id, agent_id, reason } = parameters;
    
    if (!session_id || !agent_id) {
      throw new Error('Both session_id and agent_id are required for switch_agent');
    }
    
    console.log('🔄 Agent switch attempt:', {
      session_id,
      agent_id,
      reason,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Get the target agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, role, instructions, initial_prompt, avatar_url, is_active, is_free, is_restricted')
      .eq('id', agent_id)
      .eq('is_active', true)
      .single();
    
    if (agentError || !agent) {
      console.error('❌ Agent not found:', agentError);
      throw new Error(`Agent not found with ID: ${agent_id}`);
    }
    
    // Check agent access permissions for authenticated users
    if (userId !== 'anonymous') {
      // Get user profile to check access levels
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, supabase_user_id')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError || !userProfile) {
        console.warn('⚠️ User profile not found, allowing switch to free agents only');
        if (agent.is_restricted && !agent.is_free) {
          throw new Error('User profile required for restricted agents');
        }
      } else {
        // Check if user has access to restricted agents
        const hasProperAccountSetup = userProfile.role === 'premium' || userProfile.role === 'admin';
        if (agent.is_restricted && !agent.is_free && !hasProperAccountSetup) {
          throw new Error('Premium account required for this agent');
        }
      }
    } else {
      // Anonymous users can only access free agents
      if (agent.is_restricted && !agent.is_free) {
        // Allow access to support-type agents even if restricted
        const isSupport = agent.name.toLowerCase().includes('support') || 
                         agent.name.toLowerCase().includes('help') ||
                         (agent.role && agent.role.toLowerCase().includes('support'));
        if (!isSupport) {
          throw new Error('Anonymous users can only access free or support agents');
        }
      }
    }
    
    // Perform the agent switch in the database
    console.log('🔄 Performing agent switch in database...');
    
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
        agent_id: agent.id,
        is_active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to switch agent:', insertError);
      throw new Error(`Failed to switch agent: ${insertError.message}`);
    }
    
    // Update session context if available
    if (sessionContext?.sessionId) {
      await supabase
        .from('sessions')
        .update({ 
          current_agent_id: agent.id,
          session_metadata: {
            last_agent_switch: {
              timestamp: new Date().toISOString(),
              reason: reason || 'User requested agent switch',
              agent_id: agent.id,
              agent_name: agent.name
            }
          }
        })
        .eq('id', sessionContext.sessionId);
    }
    
    console.log('✅ Agent switch completed successfully');
    
    // Return success response with client callbacks
    return {
      success: true,
      session_id,
      previous_agent_id: null, // Could track this if needed
      new_agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        instructions: agent.instructions,
        initial_prompt: agent.initial_prompt,
        avatar_url: agent.avatar_url
      },
      switch_reason: reason,
      message: `Successfully switched to ${agent.name} agent. The ${agent.name} will respond in the next message.`,
      stop_processing: true, // Signal to stop generating additional content
      clientCallbacks: [
        {
          type: 'ui_refresh',
          target: 'agent_context',
          payload: {
            agent_id: agent.id,
            agent_name: agent.name,
            agent_role: agent.role,
            agent_instructions: agent.instructions,
            agent_initial_prompt: agent.initial_prompt,
            agent_avatar_url: agent.avatar_url,
            message: `Successfully switched to ${agent.name} agent`
          },
          priority: 'high'
        }
      ]
    };
    
  } catch (error) {
    console.error('❌ switchAgent error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Main handler
serve(async (req: Request) => {
  // CORS headers
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
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const requestBody = await req.json();
    console.log('📨 Unified Claude API request received');

    // Get user from auth header
    const authResult = await getUserFromAuth(req.headers.get('authorization'));
    const userId = authResult?.user?.id || 'anonymous';
    
    console.log(`🔑 User ID: ${userId}, Stream: ${requestBody.stream || false}`);

    // Define core tools that agents can use (available for all request types)
    const tools = [
      {
        name: 'create_and_set_rfp',
        description: 'Create a new RFP and set it as the current active RFP for the session. Use this when user mentions RFP, procurement, sourcing, or proposal creation.',
        input_schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name/title of the RFP (required)'
            },
            description: {
              type: 'string',
              description: 'Optional description of the RFP'
            },
            specification: {
              type: 'string',
              description: 'Optional technical specifications'
            },
            due_date: {
              type: 'string',
              description: 'Optional due date in YYYY-MM-DD format'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'store_message',
        description: 'Store a message in the conversation history',
        input_schema: {
          type: 'object',
          properties: {
            session_id: { type: 'string' },
            message: { type: 'string' },
            role: { type: 'string', enum: ['user', 'assistant'] },
            agent_id: { type: 'string' }
          },
          required: ['session_id', 'message', 'role']
        }
      },
      {
        name: 'create_form_artifact',
        description: 'Create an interactive form artifact in the UI for data collection',
        input_schema: {
          type: 'object',
          properties: {
            session_id: { type: 'string', description: 'Current session UUID (required)' },
            title: { type: 'string', description: 'Form title' },
            form_schema: { type: 'object', description: 'JSON Schema for the form' },
            ui_schema: { type: 'object', description: 'UI configuration' },
            submit_action: { type: 'string', description: 'Action on form submit' },
            artifact_role: { type: 'string', description: 'Role of the artifact (e.g., buyer_questionnaire)' }
          },
          required: ['session_id', 'title', 'form_schema']
        }
      }
    ];

    // Check if this is a frontend-style request (with userMessage, agent, etc.) or direct Claude API format
    if (requestBody.userMessage || requestBody.functionName) {
      // Handle frontend/V2-style requests
      console.log('📨 Processing frontend-style request');
      
      if (requestBody.userMessage) {
        // Convert frontend payload to full Claude API call
        console.log('🔄 Converting frontend payload to Claude API call');
        
        try {
          // Build conversation messages from frontend payload
          const messages = [];
          
          // Add conversation history (ensure proper Claude API format)
          if (requestBody.conversationHistory && requestBody.conversationHistory.length > 0) {
            for (const historyMessage of requestBody.conversationHistory) {
              // Convert old-style messages to new format if needed
              if (typeof historyMessage.content === 'string') {
                messages.push({
                  role: historyMessage.role,
                  content: [
                    {
                      type: 'text',
                      text: historyMessage.content
                    }
                  ]
                });
              } else {
                // Already in new format
                messages.push(historyMessage);
              }
            }
          }
          
          // Add the current user message (Claude requires content as array of objects)
          messages.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: requestBody.userMessage
              }
            ]
          });

          // Build system prompt
          let systemPrompt = requestBody.agent?.instructions || 'You are a helpful AI assistant.';
          
          // Add user authentication context to system prompt
          if (requestBody.userProfile) {
            systemPrompt += `\n\nUSER CONTEXT:`;
            systemPrompt += `\n- User Status: AUTHENTICATED`;
            systemPrompt += `\n- User ID: ${requestBody.userProfile.id}`;
            systemPrompt += `\n- Email: ${requestBody.userProfile.email}`;
            if (requestBody.userProfile.full_name) {
              systemPrompt += `\n- Name: ${requestBody.userProfile.full_name}`;
            }
            if (requestBody.userProfile.role) {
              systemPrompt += `\n- Role: ${requestBody.userProfile.role}`;
            }
          } else {
            systemPrompt += `\n\nUSER CONTEXT:`;
            systemPrompt += `\n- User Status: ANONYMOUS (not logged in)`;
            
            // Add previous login evidence for anonymous users
            if (requestBody.loginEvidence?.hasPreviousLogin) {
              systemPrompt += `\n- Previous Login History: YES - This user has logged in before on this device`;
              if (requestBody.loginEvidence.loginCount) {
                systemPrompt += `\n- Login Count: ${requestBody.loginEvidence.loginCount} previous logins`;
              }
              if (requestBody.loginEvidence.lastLoginTime) {
                systemPrompt += `\n- Last Login: ${requestBody.loginEvidence.lastLoginTime}`;
              }
              systemPrompt += `\n- Recommendation: This is a returning user who should be encouraged to log back in rather than sign up`;
            } else {
              systemPrompt += `\n- Previous Login History: NO - This appears to be a new user`;
              systemPrompt += `\n- Recommendation: This user is a potential customer who has not yet signed up`;
            }
          }
          
          // Add session context to system prompt if available
          if (requestBody.sessionId) {
            systemPrompt += `\n\nCurrent session: ${requestBody.sessionId}`;
          }
          if (requestBody.currentRfp) {
            systemPrompt += `\n\nCurrent RFP: ${requestBody.currentRfp.name} (ID: ${requestBody.currentRfp.id})`;
          }



          console.log('🎯 Making Claude API call with:', {
            model: 'claude-sonnet-4-20250514',
            messageCount: messages.length,
            toolCount: tools.length,
            systemPromptLength: systemPrompt.length,
            userId
          });
          


          // Check if streaming is requested
          if (requestBody.stream === true) {
            // Use streaming response handler
            const streamResponse = await claudeService.generateStreamingResponse({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              temperature: 0.7,
              system: systemPrompt,
              messages: messages,
              tools: tools,
              sessionContext: {
                sessionId: requestBody.sessionId,
                agent: requestBody.agent,
                currentRfp: requestBody.currentRfp,
                currentArtifact: requestBody.currentArtifact
              },
              userId: userId
            });
            
            return new Response(streamResponse, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
              },
            });
          }

          // Make the Claude API call (non-streaming)
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 0.7,
            system: systemPrompt,
            messages: messages,
            tools: tools,
            stream: false
          });

          console.log('✅ Claude API response received:', {
            id: response.id,
            model: response.model,
            role: response.role,
            contentLength: response.content?.length || 0,
            usage: response.usage,
            stopReason: response.stop_reason
          });

          // Process tool calls if present
          let toolResults: any[] = [];
          let functionsExecuted: string[] = [];
          
          if (response.content && response.content.length > 0) {
            for (const contentBlock of response.content) {
              if (contentBlock.type === 'tool_use') {
                console.log('🔧 Executing tool:', contentBlock.name, 'with parameters:', contentBlock.input);
                
                try {
                  const toolResult = await executeTool(
                    contentBlock.name,
                    contentBlock.input,
                    userId,
                    {
                      sessionId: requestBody.sessionId,
                      agent: requestBody.agent,
                      currentRfp: requestBody.currentRfp,
                      currentArtifact: requestBody.currentArtifact
                    }
                  );
                  
                  toolResults.push({
                    tool_use_id: contentBlock.id,
                    type: 'tool_result',
                    content: JSON.stringify(toolResult, null, 2)
                  });
                  
                  functionsExecuted.push(contentBlock.name);
                  console.log('✅ Tool executed successfully:', contentBlock.name);
                  
                } catch (error) {
                  console.error('❌ Tool execution failed:', contentBlock.name, error);
                  toolResults.push({
                    tool_use_id: contentBlock.id,
                    type: 'tool_result',
                    content: JSON.stringify({ 
                      error: error instanceof Error ? error.message : 'Unknown error' 
                    }, null, 2)
                  });
                }
              }
            }
          }

          // Extract text response
          let textResponse = '';
          if (response.content && response.content.length > 0) {
            for (const contentBlock of response.content) {
              if (contentBlock.type === 'text') {
                textResponse += contentBlock.text;
              }
            }
          }

          // If tools were called, make a follow-up call to get the final response
          if (toolResults.length > 0) {
            console.log('🔄 Making follow-up call with tool results');
            
            const followUpMessages = [...messages];
            followUpMessages.push({
              role: 'assistant',
              content: response.content
            });
            followUpMessages.push({
              role: 'user',
              content: toolResults
            });

            const followUpResponse = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              temperature: 0.7,
              system: systemPrompt,
              messages: followUpMessages,
              tools: tools,
              stream: false
            });

            // Extract final text response
            if (followUpResponse.content && followUpResponse.content.length > 0) {
              textResponse = '';
              for (const contentBlock of followUpResponse.content) {
                if (contentBlock.type === 'text') {
                  textResponse += contentBlock.text;
                }
              }
            }
          }

          return new Response(JSON.stringify({
            success: true,
            response: textResponse || 'Claude API response received successfully.',
            functionsExecuted,
            toolResults: toolResults.length > 0 ? toolResults : undefined,
            usage: response.usage,
            model: response.model,
            stopReason: response.stop_reason
          }), {
            headers: corsHeaders
          });

        } catch (error) {
          console.error('❌ Claude API call failed:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Claude API call failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            userId
          }), {
            status: 500,
            headers: corsHeaders
          });
        }
      }
      
      // Handle V2-style function calls (functionName, parameters)
      return new Response(JSON.stringify({
        success: true,
        response: `V3 received function call: "${requestBody.functionName}". Authentication working! User ID: ${userId}`,
        functionsExecuted: [],
        usage: { input_tokens: 10, output_tokens: 20 }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
        },
      });
    }

    // Handle direct Claude API requests (streaming)
    if (requestBody.stream === true) {
      // Add userId and tools to request body for tool execution
      requestBody.userId = userId;
      requestBody.tools = tools;
      const streamResponse = await claudeService.generateStreamingResponse(requestBody);
      
      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
        },
      });
    }

    // Handle direct Claude API requests (non-streaming)
    // Validate that messages array exists and is not empty
    if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: messages array is required and must not be empty',
        message: 'Please provide a messages array with at least one message'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const response = await anthropic.messages.create({
      model: requestBody.model || 'claude-sonnet-4-20250514',
      max_tokens: requestBody.max_tokens || 4000,
      temperature: requestBody.temperature || 0.3,
      system: requestBody.system || '',
      messages: requestBody.messages,
      tools: requestBody.tools || [],
      tool_choice: { type: 'auto' }
    });

    return new Response(JSON.stringify({
      success: true,
      data: response,
      metadata: {
        model: response.model,
        usage: response.usage,
        toolsUsed: response.content
          .filter((c: any) => c.type === 'tool_use')
          .map((c: any) => c.name)
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
      },
    });

  } catch (error) {
    console.error('❌ Unified Claude API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

console.log('🚀 Claude API v3 Unified Architecture ready with streaming safety and authentication');
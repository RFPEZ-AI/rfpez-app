// Copyright Mark Skiba, 2025 All rights reserved

// Claude API service for RFPEZ.AI Multi-Agent System with MCP Integration
import Anthropic from '@anthropic-ai/sdk';
import type { Message, ContentBlock, TextBlock, ToolUseBlock, MessageParam } from '@anthropic-ai/sdk/resources';
import type { Agent } from '../types/database';
import { claudeApiFunctions, claudeAPIHandler } from './claudeAPIFunctions';
import { APIRetryHandler } from '../utils/apiRetry';
import { supabase } from '../supabaseClient';

// Isolated storage function that's immune to abort signal interference
const storeMessageIsolated = async (
  sessionId: string, 
  content: string, 
  role: 'user' | 'assistant', 
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    // Get auth token fresh to avoid any contamination
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error('No access token available for isolated storage');
    }
    
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('REACT_APP_SUPABASE_URL not configured');
    }
    
    // Create completely fresh AbortController that's isolated from any global state
    const isolatedController = new AbortController();
    const timeoutId = setTimeout(() => isolatedController.abort(), 30000); // 30s timeout
    
    const request = {
      jsonrpc: "2.0" as const,
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'store_message',
        arguments: { session_id: sessionId, content, role, metadata }
      }
    };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/mcp-server`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(request),
      signal: isolatedController.signal // Use our isolated signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`MCP Error: ${result.error.message}`);
    }
    
  } catch (error) {
    console.error('Storage failed:', error);
    throw error;
  }
};

interface ClaudeResponse {
  content: string;
  metadata: {
    model: string;
    tokens_used?: number;
    response_time: number;
    temperature: number;
    functions_called?: string[];
    function_results?: Array<{
      function: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result: any; // Function results can be various types depending on the function
    }>;
    agent_switch_occurred?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent_switch_result?: any;
    buyer_questionnaire?: Record<string, unknown>;
    is_streaming?: boolean;
    stream_complete?: boolean;
    [key: string]: unknown; // Allow additional metadata properties
  };
}

/**
 * Validates that a message has valid non-empty content
 */
function validateMessageContent(message: MessageParam): boolean {
  if (typeof message.content === 'string') {
    return message.content.trim().length > 0;
  }
  
  if (Array.isArray(message.content)) {
    return message.content.length > 0;
  }
  
  return false;
}

/**
 * Validates all messages in an array and filters out invalid ones
 */
function validateAndFilterMessages(messages: MessageParam[]): MessageParam[] {
  const validMessages = messages.filter(validateMessageContent);
  
  console.log('🔍 MESSAGE VALIDATION:', {
    totalMessages: messages.length,
    validMessages: validMessages.length,
    filteredOut: messages.length - validMessages.length
  });
  
  return validMessages;
}

export class ClaudeService {
  private static client: Anthropic | null = null;

  /**
   * Initialize Claude client
   */
  private static getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      
      if (!apiKey || apiKey === 'your_claude_api_key_here') {
        throw new Error('Claude API key not configured. Please set REACT_APP_CLAUDE_API_KEY in your environment variables.');
      }

      this.client = new Anthropic({
        apiKey: apiKey,
        // Note: Claude API is typically called from backend due to CORS restrictions
        // This might need a proxy endpoint in production
        dangerouslyAllowBrowser: true
      });
    }
    
    return this.client;
  }

  /**
   * Generate a response using Claude API with MCP function calling
   */
  static async generateResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: MessageParam[] = [],
    sessionId?: string,
    userProfile?: {
      id?: string;
      email?: string;
      full_name?: string;
      role?: string;
    },
    currentRfp?: {
      id: number;
      name: string;
      description: string;
      specification: string;
    } | null,
    currentArtifact?: {
      id: string;
      name: string;
      type: string;
      content?: string;
    } | null,
    abortSignal?: AbortSignal,
    stream = false,
    onChunk?: (chunk: string, isComplete: boolean, toolProcessing?: boolean) => void
  ): Promise<ClaudeResponse> {
    
    // CRITICAL: Check for RFP keywords IMMEDIATELY before any async operations
    const lastUserMessage = conversationHistory[conversationHistory.length - 1] || { content: userMessage };
    const userMessageContent = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : userMessage;
    const rfpKeywords = [
      'create rfp', 'rfp for', 'procurement', 'procure', 'sourcing', 'source', 
      'bid for', 'proposal for', 'vendor for', 'need to source',
      'looking for', 'find supplier', 'find vendor', 'buy',
      'purchase', 'need to buy', 'need to purchase', 'need to find',
      'need to get', 'require', 'looking to', 'want to source',
      'want to buy', 'want to purchase', 'need to procure'
    ];
    const shouldForceFunctionCall = rfpKeywords.some(keyword => 
      userMessageContent.toLowerCase().includes(keyword.toLowerCase())
    );

    // Check if function calling is needed for this message type
    
    const startTime = Date.now();
    const functionsExecuted: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allFunctionResults: any[] = [];
    
    // Basic abort signal validation
    if (abortSignal?.aborted) {
      throw new Error('Request was cancelled');
    }

    try {
      const client = this.getClient();
      
      // Build the conversation context
      const messages: MessageParam[] = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Create system prompt based on agent instructions with MCP context
      const userContext = userProfile ? `

CURRENT USER CONTEXT:
- User ID: ${userProfile.id || 'anonymous'}
- Name: ${userProfile.full_name || 'Anonymous User'}
- Email: ${userProfile.email || 'not provided'}
- Role: ${userProfile.role || 'user'}

Please personalize your responses appropriately based on this user information.` : '';

      const sessionContext = sessionId ? `

CURRENT SESSION CONTEXT:
- Session ID: ${sessionId}
- Use this session ID when calling functions that require a session_id parameter (like switch_agent, store_message, etc.)` : '';

      const rfpContext = currentRfp ? `

CURRENT RFP CONTEXT:
- RFP ID: ${currentRfp.id}
- RFP Name: ${currentRfp.name}
- Description: ${currentRfp.description}
- Specification: ${currentRfp.specification}

You are currently working with this specific RFP. When creating questionnaires, generating proposals, or managing RFP data, use this RFP ID (${currentRfp.id}) for database operations. You can reference the RFP details above to provide context-aware assistance.` : '';
      const artifactContext = currentArtifact ? `

CURRENT ARTIFACT CONTEXT:
- Artifact ID: ${currentArtifact.id}
- Artifact Name: ${currentArtifact.name}
- Artifact Type: ${currentArtifact.type}
${currentArtifact.type === 'form' ? `
This is the form currently displayed in the artifact window. When users ask you to "fill out the form" or "update the form", they are referring to this specific form artifact. Use the update_form_artifact function with this artifact ID (${currentArtifact.id}) to populate or modify the form data.` : `
This is the ${currentArtifact.type} currently displayed in the artifact window.`}` : '';

      const systemPrompt = `${agent.instructions || `You are ${agent.name}, an AI assistant.`}${userContext}${sessionContext}${rfpContext}${artifactContext}

You are part of a multi-agent system with integrated MCP (Model Context Protocol) support and have access to several powerful functions:

CONVERSATION MANAGEMENT (via MCP Server):
- Retrieve conversation history from previous sessions (get_conversation_history)
- Store messages and create new sessions (store_message, create_session)
- Search through past conversations (search_messages)
- Access recent sessions (get_recent_sessions)

AGENT MANAGEMENT:
- Get available agents in the system (get_available_agents)
- Check which agent is currently active (get_current_agent)
- Switch to a different agent when appropriate (switch_agent)
- Recommend the best agent for specific topics (recommend_agent)

MCP INTEGRATION NOTES:
- Your conversation functions now use a Supabase MCP server for enhanced reliability
- All conversation data is stored securely and can be accessed across sessions
- The MCP connection provides real-time access to the conversation database

AGENT SWITCHING GUIDELINES:
- Switch agents when the user's request would be better handled by a specialist
- For RFP creation/management: Switch to "RFP Assistant" or "RFP Design" agent
- For technical issues/support: Switch to "Technical Support" agent
- For sales/pricing questions: Switch to "Solutions" agent
- For platform guidance: Switch to "Onboarding" agent
- Always explain WHY you're switching and what the new agent can help with

AGENT ACCESS LEVELS:
- Default agents: Available to all users (even non-authenticated)
- Free agents: Available to any user with login (no billing setup required)
- Premium agents: Require account upgrade/billing setup
- Respect access restrictions when switching agents

Use these functions when relevant to help the user. For example:
- If they ask about previous conversations, use get_recent_sessions or search_messages
- If they reference something from earlier, use get_conversation_history
- If their request needs specialized help, recommend or switch to the appropriate agent
- Always store important conversation milestones using store_message

RFP MANAGEMENT FUNCTIONS - USE THESE ACTIVELY:
- When users want to CREATE an RFP: ALWAYS use create_and_set_rfp function
- When they say "create an RFP", "make an RFP", "I need an RFP": call create_and_set_rfp
- When they want to switch RFP context: use set_current_rfp
- When they ask about current RFP: use get_current_rfp or refresh_current_rfp
- For RFP questionnaires: use create_questionnaire_artifact
- For supplier forms: use create_supplier_form_artifact

CRITICAL: When users request RFP creation, you MUST call the create_and_set_rfp function with proper parameters. Do not just say you will create an RFP - actually call the function.

Be helpful, accurate, and professional. When switching agents, make the transition smooth and explain the benefits.`;

      let response: Message | undefined = undefined;
      let streamedContent = '';

      if (stream && onChunk) {
        // Streaming response with CORRECT tool handling
        try {
          const streamResponse = await APIRetryHandler.executeWithRetry(
            async () => {
              // Check for cancellation before each API call
              if (abortSignal?.aborted) {
                throw new Error('Request was cancelled');
              }
              
              // Prepare options object with conditional signal
              const apiOptions: { signal?: AbortSignal } = {};
              // DEBUGGING: Temporarily disable abort signal to prevent CLAUDE_SDK_CLEANUP_SUCCESS error
              // if (abortSignal) {
              //   apiOptions.signal = abortSignal;
              // }
              
              // Validate messages before sending to Claude API
              const validatedMessages = validateAndFilterMessages(messages);
              
              if (validatedMessages.length === 0) {
                throw new Error('No valid messages to send to Claude API');
              }
              
              return client.messages.stream({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 2000,
                temperature: 0.7,
                system: systemPrompt,
                messages: validatedMessages,
                tools: claudeApiFunctions,
                tool_choice: shouldForceFunctionCall ? { type: 'any' } : { type: 'auto' }
              }, apiOptions);
            },
            {
              maxRetries: 3,
              baseDelay: 2000,
              maxDelay: 60000
            }
          );

          // FIXED: Process streaming response with SEGMENTED tool handling
          const assistantContent: ContentBlock[] = [];
          let currentTextContent = '';
          // Removed toolCalls array - tools are now executed inline during streaming
          let chunkCount = 0;
          let lastAbortCheck = Date.now();
          
          // CRITICAL: Handle streaming events correctly per ChatGPT 5 guidance
          for await (const event of streamResponse) {
            chunkCount++;
            const chunkTime = Date.now();
            
            // Optimized abort checking - only check every 100ms or every 20 chunks
            const shouldCheckAbort = (chunkTime - lastAbortCheck > 100) || (chunkCount % 20 === 0);
            
            if (shouldCheckAbort) {
              lastAbortCheck = chunkTime;
              // Enhanced abort checking with defensive logic
              if (abortSignal?.aborted) {
                throw new Error('Request was cancelled during streaming');
              }
            }

            if (event.type === 'message_start') {
              console.log('🚀 Streaming message started');
            }
            else if (event.type === 'content_block_start') {
              console.log('📝 Content block started:', event.content_block.type);
              assistantContent.push(event.content_block);
              
              // If this is a tool_use block, prepare for tool execution
              if (event.content_block.type === 'tool_use') {
                console.log('🔧 Tool use detected during streaming:', event.content_block.name);
              }
            }
            else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                // Handle text streaming - stream to UI immediately
                const chunk = event.delta.text;
                currentTextContent += chunk;
                streamedContent += chunk;
                onChunk?.(chunk, false);
              }
              else if (event.delta.type === 'input_json_delta') {
                // Handle tool parameter streaming (fine-grained tool streaming)
                console.log('🔧 Tool parameter delta received');
              }
            }
            else if (event.type === 'content_block_stop') {
              console.log('🛑 Content block stopped, index:', event.index);
              
              // Update content block with final content
              if (assistantContent[event.index]) {
                if (assistantContent[event.index].type === 'text') {
                  (assistantContent[event.index] as TextBlock).text = currentTextContent;
                }
                else if (assistantContent[event.index].type === 'tool_use') {
                  // Tool is complete - IMMEDIATE EXECUTION APPROACH
                  const toolUse = assistantContent[event.index] as ToolUseBlock;
                  console.log('🔨 TOOL DETECTED DURING STREAMING:', {
                    toolName: toolUse.name,
                    toolId: toolUse.id,
                    toolInput: toolUse.input,
                    streamedContentLength: streamedContent.length,
                    currentBlockIndex: event.index
                  });
                  
                  // STEP 1: Close current message stream and signal tool processing
                  if (streamedContent.trim()) {
                    console.log('📝 CLOSING MESSAGE SEGMENT - streamedContent length:', streamedContent.length);
                    onChunk?.('', true, true); // Signal completion with tool processing flag
                  } else {
                    console.log('📝 NO STREAMED CONTENT to close, but tool processing starting');
                    onChunk?.('', true, true); // Still signal tool processing even with no content
                  }
                  
                  // STEP 2: Execute tool immediately
                  console.log('⚙️ EXECUTING TOOL:', toolUse.name);
                  try {
                    console.log('🔍 TOOL EXECUTION DEBUG:', {
                      toolName: toolUse.name,
                      toolId: toolUse.id,
                      inputKeys: Object.keys(toolUse.input || {}),
                      functionsExecutedSoFar: functionsExecuted.length
                    });
                    
                    functionsExecuted.push(toolUse.name);
                    const executionStart = Date.now();
                    const result = await claudeAPIHandler.executeFunction(toolUse.name, toolUse.input);
                    const executionTime = Date.now() - executionStart;
                    
                    allFunctionResults.push({ function: toolUse.name, result });
                    
                    console.log('✅ TOOL EXECUTION SUCCESS:', {
                      toolName: toolUse.name,
                      executionTimeMs: executionTime,
                      resultType: typeof result,
                      resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
                      totalFunctionsExecuted: functionsExecuted.length,
                      totalResults: allFunctionResults.length
                    });
                    
                    // STEP 3: Tool execution complete - continuation will happen in message_stop
                    console.log('🔄 Tool execution complete, awaiting continuation in message_stop phase');
                    
                  } catch (error) {
                    console.error('❌ TOOL EXECUTION FAILED:', {
                      toolName: toolUse.name,
                      error: error instanceof Error ? error.message : 'Unknown error',
                      errorType: error instanceof Error ? error.constructor.name : typeof error,
                      stack: error instanceof Error ? error.stack : undefined
                    });
                    
                    allFunctionResults.push({ 
                      function: toolUse.name, 
                      result: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });
                  }
                }
              }
              
              // Reset text content for next block
              if (assistantContent[event.index]?.type === 'text') {
                currentTextContent = '';
              }
            }
            else if (event.type === 'message_stop') {
              console.log('⏹️ STREAMING MESSAGE STOPPED:', {
                streamedContentLength: streamedContent.length,
                assistantContentBlocks: assistantContent.length,
                functionsExecuted: functionsExecuted.length,
                functionResults: allFunctionResults.length,
                contentBlockTypes: assistantContent.map(block => block.type)
              });
              
              // If we have function results from inline execution, we need to continue the conversation
              if (allFunctionResults.length > 0) {
                console.log('🔄 PROCESSING TOOL RESULTS - Functions executed during streaming:', {
                  functionsExecuted,
                  resultCount: allFunctionResults.length,
                  resultSummary: allFunctionResults.map(fr => ({ function: fr.function, hasResult: !!fr.result }))
                });
                
                // Add assistant's message with mixed content to conversation
                console.log('➕ Adding assistant message to conversation history');
                messages.push({
                  role: 'assistant',
                  content: assistantContent as any
                });

                // Add tool results as user message
                console.log('🔧 CREATING TOOL RESULTS MESSAGE');
                const toolResults = allFunctionResults.map((funcResult, index) => {
                  const toolUseBlock = assistantContent.find(block => 
                    block.type === 'tool_use' && (block as ToolUseBlock).name === funcResult.function
                  ) as ToolUseBlock | undefined;
                  
                  const toolResult = {
                    type: 'tool_result' as const,
                    tool_use_id: toolUseBlock?.id || `tool-${index}`,
                    content: JSON.stringify(funcResult.result, null, 2)
                  };
                  
                  console.log('🔧 Tool result created:', {
                    functionName: funcResult.function,
                    toolUseId: toolResult.tool_use_id,
                    contentLength: toolResult.content.length,
                    resultPreview: toolResult.content.substring(0, 200) + '...'
                  });
                  
                  return toolResult;
                });

                const toolMessage: MessageParam = {
                  role: 'user',
                  content: toolResults
                };
                
                messages.push(toolMessage);
                console.log('✅ TOOL RESULTS MESSAGE ADDED:', {
                  toolResultsCount: toolResults.length,
                  totalMessagesInConversation: messages.length,
                  toolResultsSize: JSON.stringify(toolResults).length
                });

                // Get Claude's response to the function results
                console.log('🚀 CALLING CLAUDE API FOR TOOL RESPONSE');
                try {
                  const toolResponseStart = Date.now();
                  
                  // Create timeout promise first
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('FORCE_TIMEOUT: Tool processing exceeded 30 second limit')), 30000);
                  });
                  
                  // Create API call with retry logic
                  const toolResponsePromise = APIRetryHandler.executeWithRetry(
                    async () => {
                      const validatedMessages = validateAndFilterMessages(messages);
                      console.log('📋 Making Claude API call with:', {
                        messageCount: validatedMessages.length,
                        lastMessageRole: validatedMessages[validatedMessages.length - 1]?.role,
                        lastMessageType: Array.isArray(validatedMessages[validatedMessages.length - 1]?.content) 
                          ? (validatedMessages[validatedMessages.length - 1]?.content?.[0] as any)?.type || 'text'
                          : 'text',
                        systemPromptLength: systemPrompt.length
                      });
                      
                      return client.messages.create({
                        model: 'claude-3-5-sonnet-latest',
                        max_tokens: 2000,
                        temperature: 0.7,
                        system: systemPrompt,
                        messages: validatedMessages,
                        tools: claudeApiFunctions,
                        tool_choice: { type: 'auto' }
                      });
                    },
                    { 
                      maxRetries: 1, // Reduced retries to prevent timeout conflicts
                      baseDelay: 1000, 
                      maxDelay: 5000 // Reduced max delay
                    }
                  );
                  
                  // Race the API call against timeout - timeout will win after 30 seconds
                  console.log('🏁 Starting Promise.race between API call and 30-second timeout');
                  const toolResponse = await Promise.race([toolResponsePromise, timeoutPromise]) as any;
                  
                  const toolResponseTime = Date.now() - toolResponseStart;
                  console.log('✅ CLAUDE TOOL RESPONSE RECEIVED:', {
                    responseTimeMs: toolResponseTime,
                    contentBlocks: toolResponse.content.length,
                    contentTypes: toolResponse.content.map((block: any) => block.type),
                    stopReason: toolResponse.stop_reason
                  });

                  // Stream Claude's response to the tool results
                  const toolResponseText = toolResponse.content
                    .filter((block: any) => block.type === 'text')
                    .map((block: any) => block.text)
                    .join('');
                  
                  console.log('📡 PROCESSING TOOL RESPONSE TEXT:', {
                    totalContentBlocks: toolResponse.content.length,
                    textBlocks: toolResponse.content.filter((block: any) => block.type === 'text').length,
                    toolResponseTextLength: toolResponseText.length,
                    toolResponsePreview: toolResponseText.substring(0, 200) + '...',
                    hasTrimmedContent: !!toolResponseText.trim()
                  });
                  
                  if (toolResponseText.trim()) {
                    console.log('📡 STREAMING TOOL RESPONSE TO UI:', {
                      contentLength: toolResponseText.length,
                      willStream: !!onChunk
                    });
                    // Stream the tool response content
                    onChunk?.(toolResponseText, false);
                  } else {
                    console.log('⚠️ NO TOOL RESPONSE TEXT TO STREAM - but still triggering continuation for UI cleanup');
                    // CRITICAL FIX: Even with empty response, trigger continuation to remove processing message
                    onChunk?.(' ', false); // Send minimal content to trigger continuation logic
                  }
                  
                  // Update the response object
                  response = toolResponse;
                  console.log('✅ Tool response object updated successfully');
                  
                } catch (error) {
                  console.error('❌ FAILED TO GET CLAUDE TOOL RESPONSE:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    stack: error instanceof Error ? error.stack : undefined,
                    toolResultsCount: allFunctionResults.length,
                    messagesInConversation: messages.length
                  });
                  
                  // CRITICAL FIX: When tool response fails, still trigger continuation to remove processing message
                  const isTimeout = error instanceof Error && error.message.includes('FORCE_TIMEOUT');
                  const errorMessage = isTimeout 
                    ? 'Tool processing exceeded time limit. Please try again.'
                    : 'I encountered an issue processing the tools. Please try again.';
                  
                  console.log('🔧 Tool response failed - sending error message to trigger UI cleanup:', errorMessage);
                  
                  // Use special marker to ensure tool processing cleanup happens
                  onChunk?.(errorMessage, false, true); // Third parameter forces tool completion cleanup
                }
              }
              
              // Signal final completion - not tool processing
              onChunk?.('', true, false);
              break;
            }
          }

          // Create response object from streamed content
          response = {
            content: assistantContent,
            model: 'claude-3-5-sonnet-latest',
            role: 'assistant',
            id: `stream-${Date.now()}`,
            stop_reason: 'end_turn',
            stop_sequence: null,
            type: 'message',
            usage: { input_tokens: 0, output_tokens: 0 }
          } as Message;
          
          // NOTE: Tool processing now happens inline during streaming for better UX
          
        } catch (streamError) {
          // Enhanced error analysis for Claude API error objects
          const errorAnalysis = {
            hasStatus: streamError && typeof streamError === 'object' && 'status' in streamError,
            hasHeaders: streamError && typeof streamError === 'object' && 'headers' in streamError,
            hasRequestID: streamError && typeof streamError === 'object' && 'requestID' in streamError,
            isEmpty: !streamError || (typeof streamError === 'object' && Object.keys(streamError).length === 0),
            isEmptyStrict: streamError === null || streamError === undefined || 
                          (typeof streamError === 'object' && Object.getOwnPropertyNames(streamError).length === 0)
          };
          
          let errorMessage = 'Unknown error occurred';
          
          if (errorAnalysis.hasStatus || errorAnalysis.hasHeaders || errorAnalysis.hasRequestID) {
            // This is a Claude API error response object
            const stringValue = streamError?.toString?.() || String(streamError);
            
            if (stringValue && stringValue !== '[object Object]') {
              errorMessage = stringValue;
              
              // Clean up error message format
              if (errorMessage.startsWith('Error: ')) {
                errorMessage = errorMessage.substring(7);
              }
            } else {
              // Try to extract error details
              try {
                const errorObj = streamError as Record<string, unknown>;
                const statusValue = errorObj.status;
                const errorValue = errorObj.error;
                
                if (errorValue && typeof errorValue === 'object' && 
                    (errorValue as Record<string, unknown>).message) {
                  errorMessage = String((errorValue as Record<string, unknown>).message);
                } else if (errorValue && typeof errorValue === 'string') {
                  errorMessage = errorValue;
                } else if (statusValue) {
                  errorMessage = `HTTP ${statusValue} error`;
                } else {
                  errorMessage = 'Claude API returned an error response';
                }
              } catch {
                errorMessage = 'Claude API error - details unavailable';
              }
            }
            
            throw new Error(`Claude API error: ${errorMessage}`);
            
          } else if (errorAnalysis.isEmpty && errorAnalysis.isEmptyStrict) {
            // Empty error from post-streaming function calls - usually not critical
            throw new Error('Function processing completed with empty error - this is usually not critical');
          } else {
            // Handle other error types
            if (streamError && typeof streamError === 'object' && 'name' in streamError) {
              const errorName = (streamError as { name: string }).name;
              
              if (errorName === 'APIUserAbortError') {
                throw new Error('Request was cancelled');
              }
            }
            
            // Default error handling
            throw streamError;
          }
        }
      } else {
        // Non-streaming response (existing logic)
        response = await APIRetryHandler.executeWithRetry(
          async () => {
            // Enhanced abort checking with defensive logic
            if (abortSignal?.aborted) {
              throw new Error('Request was cancelled');
            }
            
            // Prepare options object with conditional signal for non-streaming
            const apiOptions: { signal?: AbortSignal } = {};
            // DEBUGGING: Temporarily disable abort signal to prevent CLAUDE_SDK_CLEANUP_SUCCESS error
            // if (abortSignal) {
            //   apiOptions.signal = abortSignal;
            // }
            
            // Validate messages before sending to Claude API
            const validatedMessages = validateAndFilterMessages(messages);
            
            if (validatedMessages.length === 0) {
              throw new Error('No valid messages to send to Claude API');
            }

            return client.messages.create({
              model: 'claude-3-5-sonnet-latest',
              max_tokens: 2000,
              temperature: 0.7,
              system: systemPrompt,
              messages: validatedMessages,
              tools: claudeApiFunctions,
              tool_choice: shouldForceFunctionCall ? { type: 'any' } : { type: 'auto' }
            }, apiOptions);
          },
          {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 60000
          }
        );
      }



      // Collect final text content - FIXED to handle tool calls properly
      let finalContent = '';
      
      // Always extract text from the final response object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalTextBlocks = response.content.filter((block: any) => block.type === 'text') as any[];
      const responseTextContent = finalTextBlocks.map(block => block.text).join('');
      
      console.log('🔧 FINAL CONTENT ASSEMBLY DEBUG:', {
        streamingMode: stream && onChunk,
        nonStreamingMode: !stream || !onChunk,
        streamedContentLength: streamedContent.length,
        responseTextContentLength: responseTextContent.length,
        toolsExecuted: functionsExecuted.length,
        responseContentBlocks: response.content.length,
        responseContentTypes: response.content.map((block: any) => block.type)
      });
      
      if (stream && onChunk) {
        // For streaming with tool calls: combine streamed + response content
        if (streamedContent && responseTextContent) {
          // Both have content - combine them
          finalContent = streamedContent + responseTextContent;
          console.log('🔧 STREAMING FIX: COMBINED CONTENT:', {
            streamedLength: streamedContent.length,
            responseLength: responseTextContent.length,
            finalLength: finalContent.length,
            streamedPreview: streamedContent.substring(0, 100) + '...',
            responsePreview: responseTextContent.substring(0, 100) + '...'
          });
        } else if (responseTextContent) {
          // Only response has content (tool calls scenario)
          finalContent = responseTextContent;
          console.log('🔧 STREAMING FIX: TOOL RESPONSE ONLY:', {
            responseLength: responseTextContent.length,
            responsePreview: responseTextContent.substring(0, 200) + '...',
            willManuallyStream: !!onChunk
          });
          
          // CRITICAL: Stream the tool response content to UI since it wasn't streamed
          if (onChunk) {
            console.log('📡 STREAMING FIX: MANUALLY STREAMING TOOL RESPONSE TO UI');
            onChunk(responseTextContent, false);
            onChunk('', true); // Signal completion
          }
        } else if (streamedContent) {
          // Only streamed content (normal streaming case)
          finalContent = streamedContent;
          console.log('🔧 STREAMING FIX: STREAMED CONTENT ONLY:', {
            streamedLength: streamedContent.length,
            streamedPreview: streamedContent.substring(0, 100) + '...'
          });
        } else {
          console.log('⚠️ STREAMING FIX: NO CONTENT FOUND - both streamed and response are empty');
        }
      } else {
        // Non-streaming case
        finalContent = responseTextContent;
        console.log('🔧 NON-STREAMING CASE:', {
          responseLength: responseTextContent.length,
          responsePreview: responseTextContent.substring(0, 100) + '...'
        });
      }

      const responseTime = Date.now() - startTime;

      // Store the conversation in the current session if sessionId is provided
      // NOTE: Use completely isolated storage to avoid abort signal interference
      if (sessionId && finalContent.trim()) {
        // Execute isolated storage asynchronously without blocking
        const executeIsolatedStorage = async () => {
          try {
            await storeMessageIsolated(sessionId, userMessage, 'user');
            await storeMessageIsolated(sessionId, finalContent, 'assistant', {
              agent_id: agent.id,
              functions_called: functionsExecuted,
              model: response?.model || 'claude-3-5-sonnet-latest'
            });
          } catch (error) {
            console.warn('Failed to store conversation (non-critical):', error);
            // Storage errors are non-critical - don't propagate them
          }
        };
        
        // Execute storage in next tick to isolate from streaming context
        setTimeout(executeIsolatedStorage, 0);
      }

      // Check if any agent switching occurred
      const agentSwitchOccurred = functionsExecuted.includes('switch_agent');
      let agentSwitchResult = null;
      
      if (agentSwitchOccurred) {
        // Find the agent switch result
        agentSwitchResult = allFunctionResults.find(result => result.function === 'switch_agent')?.result;
      }

      return {
        content: finalContent,
        metadata: {
          model: response.model,
          tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          response_time: responseTime,
          temperature: 0.7,
          functions_called: functionsExecuted,
          function_results: allFunctionResults,
          agent_switch_occurred: agentSwitchOccurred,
          agent_switch_result: agentSwitchResult,
          is_streaming: stream,
          stream_complete: true
        }
      };

    } catch (error) {
      // Handle abort/cancellation errors with clean detection
      if (error instanceof Error) {
        if (error.message === 'Request was cancelled' ||
            error.message.includes('aborted') ||
            error.message.includes('cancelled')) {
          
          // Check for spurious aborts that should be ignored
          const isSpuriousAbort = (
            error.message.includes('signal is aborted without reason') ||
            error.message.includes('aborted without reason') ||
            (error.name === 'AbortError' && (!error.message || error.message.trim() === ''))
          );
          
          // Check for Claude SDK internal cleanup aborts
          const isClaudeSDKCleanupAbort = (
            error.message.includes('Request was aborted') &&
            !error.message.includes('User') &&
            !error.message.includes('timeout')
          );
          
          const isBrowserAbort = (
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('DOMException') ||
            error.stack?.includes('fetch')
          );
          
          const isUserInitiated = (
            error.message === 'Request was cancelled' &&
            !isBrowserAbort && 
            !isSpuriousAbort &&
            !isClaudeSDKCleanupAbort
          );
          
          // Only throw for legitimate user cancellations
          if (isUserInitiated && !isSpuriousAbort && !isClaudeSDKCleanupAbort) {
            throw new Error('Request was cancelled');
          } else if (isClaudeSDKCleanupAbort) {
            // Claude SDK cleanup - streaming was successful
            throw new Error('CLAUDE_SDK_CLEANUP_SUCCESS');
          } else if (isSpuriousAbort) {
            // Return recovery response for spurious aborts
            return {
              content: "I apologize, but there was a temporary connection issue. Please try your request again.",
              metadata: {
                model: 'claude-3-5-sonnet-latest',
                response_time: Date.now() - startTime,
                temperature: 0.7,
                streaming: stream,
                tokens_used: 0,
                error_recovery: 'spurious_abort_ignored'
              }
            };
          } else {
            // Browser/network abort recovery
            return {
              content: "There was a network connectivity issue. Please check your connection and try again.",
              metadata: {
                model: 'claude-3-5-sonnet-latest', 
                response_time: Date.now() - startTime,
                temperature: 0.7,
                streaming: stream,
                tokens_used: 0,
                error_recovery: 'network_abort_ignored'
              }
            };
          }
        }
        
        // Handle other specific error types
        if (error.message.includes('API key')) {
          throw new Error('Invalid Claude API key. Please check your configuration.');
        }
        if (error.message.includes('Rate limit exceeded')) {
          // Enhanced rate limit message from APIRetryHandler
          throw error; // Re-throw the enhanced error
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Claude API is temporarily busy. Please wait a moment and try again.');
        }
        if (error.message.includes('CORS')) {
          throw new Error('CORS error. Claude API may need to be called from a backend service.');
        }
        if (error.message.includes('network') || error.message.includes('timeout')) {
          throw new Error('Network connection issue. Please check your internet connection and try again.');
        }
        if (error.message.includes('quota') || error.message.includes('usage')) {
          throw new Error('Claude API usage quota exceeded. Please check your account billing or try again later.');
        }
        // Check for overloaded_error specifically
        if (error.message.includes('overloaded_error')) {
          throw new Error('Claude API is currently overloaded. Please wait a moment and try again.');
        }
      }
      
      // Check for APIUserAbortError specifically (for streaming)
      if (error && typeof error === 'object' && 'name' in error) {
        const errorName = (error as { name: string }).name;
        if (errorName === 'APIUserAbortError' || errorName === 'AbortError') {
          throw new Error('Request was cancelled');
        }
      }

      // Check for structured error responses from Claude API
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = (error as { error: { type?: string; message?: string } }).error;
        if (apiError && typeof apiError === 'object' && 'type' in apiError) {
          if (apiError.type === 'overloaded_error') {
            throw new Error('Claude API is currently experiencing high demand. Please wait a moment and try again.');
          }
        }
      }

      // Check for HTTP status codes if available
      const status = typeof error === 'object' && error !== null && 'status' in error 
        ? (error as { status: number }).status 
        : undefined;
      if (status) {
        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your Claude API key.');
          case 403:
            throw new Error('Access forbidden. Your API key may not have the required permissions.');
          case 429:
            throw new Error('Too many requests. Please wait before trying again.');
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error('Claude API is temporarily unavailable. Please try again in a few moments.');
          default:
            throw new Error(`Claude API Error (${status}): ${(error as Error).message || 'Unknown error'}`);
        }
      }
      
      throw new Error(`Claude API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a streaming response using Claude API
   */
  static async generateStreamingResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: MessageParam[] = [],
    sessionId?: string,
    userProfile?: {
      id?: string;
      email?: string;
      full_name?: string;
      role?: string;
    },
    currentRfp?: {
      id: number;
      name: string;
      description: string;
      specification: string;
    } | null,
    currentArtifact?: {
      id: string;
      name: string;
      type: string;
      content?: string;
    } | null,
    abortSignal?: AbortSignal,
    onChunk?: (chunk: string, isComplete: boolean, toolProcessing?: boolean) => void
  ): Promise<ClaudeResponse> {
    return this.generateResponse(
      userMessage,
      agent,
      conversationHistory,
      sessionId,
      userProfile,
      currentRfp,
      currentArtifact,
      abortSignal,
      true, // Enable streaming
      onChunk
    );
  }

  /**
   * Test Claude API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      
      const response = await APIRetryHandler.executeWithRetry(
        () => client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        }),
        {
          maxRetries: 2, // Fewer retries for connection test
          baseDelay: 1000,
          maxDelay: 10000
        }
      );

      return response.content.length > 0;
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }

  /**
   * Format conversation history for Claude API
   */
  static formatConversationHistory(messages: { role: string; content: string }[]): MessageParam[] {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .filter(msg => msg.content && msg.content.trim() !== '') // Filter out empty messages
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content.trim()
      }))
      .slice(-10); // Keep last 10 messages for context
  }

  /**
   * Create a new conversation session for MCP integration
   */
  static async createSession(title: string, description?: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await claudeAPIHandler.executeFunction('create_session', {
        title,
        description
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      return result.session_id;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create conversation session');
    }
  }

  /**
   * Get recent sessions for the current user
   */
  static async getRecentSessions(limit = 10) {
    try {
      return await claudeAPIHandler.executeFunction('get_recent_sessions', { limit });
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      throw new Error('Failed to retrieve recent sessions');
    }
  }

  /**
   * Get conversation history for a session
   */
  static async getConversationHistory(sessionId: string, limit = 50, offset = 0) {
    try {
      return await claudeAPIHandler.executeFunction('get_conversation_history', {
        session_id: sessionId,
        limit,
        offset
      });
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      throw new Error('Failed to retrieve conversation history');
    }
  }
}

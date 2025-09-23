// Copyright Mark Skiba, 2025 All rights reserved

// Claude API service for RFPEZ.AI Multi-Agent System with MCP Integration
import Anthropic from '@anthropic-ai/sdk';
import type { Message, ContentBlock, TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources';
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

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    conversationHistory: ClaudeMessage[] = [],
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
    onChunk?: (chunk: string, isComplete: boolean) => void
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();
    const functionsExecuted: string[] = [];
    
    // Basic abort signal validation
    if (abortSignal?.aborted) {
      throw new Error('Request was cancelled');
    }

    try {
      const client = this.getClient();
      
      // Build the conversation context
      const messages: ClaudeMessage[] = [
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

      if ((stream && onChunk) || (!stream || !onChunk)) {
        // Streaming response
        try {
          const streamResponse = await APIRetryHandler.executeWithRetry(
            async () => {
              // Check for cancellation before each API call
              if (abortSignal?.aborted) {
                throw new Error('Request was cancelled');
              }
              
              // Prepare options object with conditional signal
              const apiOptions: { signal?: AbortSignal } = {};
              if (abortSignal) {
                apiOptions.signal = abortSignal;
              }
              
              return client.messages.stream({
                model: 'claude-3-5-sonnet-latest',
                max_tokens: 2000,
                temperature: 0.7,
                system: systemPrompt,
                messages: messages,
                tools: claudeApiFunctions,
                tool_choice: { type: 'auto' }
              }, apiOptions);
            },
            {
              maxRetries: 3,
              baseDelay: 2000,
              maxDelay: 60000
            }
          );

          // Process streaming response
          let chunkCount = 0;
          let lastAbortCheck = Date.now();
          
          for await (const messageStreamEvent of streamResponse) {
            chunkCount++;
            const chunkTime = Date.now();
            
            // Optimized abort checking - only check every 100ms or every 20 chunks
            const shouldCheckAbort = (chunkTime - lastAbortCheck > 100) || (chunkCount % 20 === 0);
            if (shouldCheckAbort && abortSignal?.aborted) {
              throw new Error('Request was cancelled');
            }
            
            if (shouldCheckAbort) {
              lastAbortCheck = chunkTime;
            }

            if (messageStreamEvent.type === 'content_block_delta') {
              if (messageStreamEvent.delta.type === 'text_delta') {
                const chunk = messageStreamEvent.delta.text;
                streamedContent += chunk;
                onChunk?.(chunk, false);
              }
            } else if (messageStreamEvent.type === 'message_stop') {
              onChunk?.('', true); // Signal completion
              break;
            }
          }

          // Convert stream response to regular response format for function handling
          response = await streamResponse.finalMessage();
          

          
          // Update response content with streamed content
          if (response?.content?.length > 0 && response.content[0].type === 'text') {
            (response.content[0] as { text: string; type: string }).text = streamedContent;
          }
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
            if (abortSignal) {
              apiOptions.signal = abortSignal;
            }
            
            return client.messages.create({
              model: 'claude-3-5-sonnet-latest',
              max_tokens: 2000,
              temperature: 0.7,
              system: systemPrompt,
              messages: messages,
              tools: claudeApiFunctions,
              tool_choice: { type: 'auto' }
            }, apiOptions);
          },
          {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 60000
          }
        );
      }

      // Handle function calls if any
      let finalContent = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allFunctionResults: any[] = [];

      // Process the response and handle any function calls
      while (response.content.some((block: ContentBlock) => block.type === 'tool_use')) {
        const toolUses = response.content.filter((block: ContentBlock): block is ToolUseBlock => 
          block.type === 'tool_use');
        const textBlocks = response.content.filter((block: ContentBlock): block is TextBlock => 
          block.type === 'text');

        
        // Collect any text content
        if (textBlocks.length > 0) {
          finalContent += textBlocks.map(block => block.text).join('');
        }

        // Add assistant's message with tool calls to conversation
        messages.push({
          role: 'assistant',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: response.content as any
        });

        // Execute each function call and prepare tool results
        const toolResults = [];
        let shouldStopProcessing = false;
        
        for (const toolUse of toolUses) {
          try {
            functionsExecuted.push(toolUse.name);
            
            const result = await claudeAPIHandler.executeFunction(toolUse.name, toolUse.input);
            allFunctionResults.push({ function: toolUse.name, result });
            
            // Check if this is an agent switch that should stop processing
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (toolUse.name === 'switch_agent' && result && typeof result === 'object' && 'stop_processing' in result && (result as any).stop_processing) {
              shouldStopProcessing = true;
            }
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result, null, 2)
            });
          } catch (error) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              is_error: true
            });
          }
        }

        // Add tool results as user message
        messages.push({
          role: 'user',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: toolResults as any
        });

        // If agent switch occurred, stop processing and return the switch message
        if (shouldStopProcessing) {
          break; // Exit the while loop to prevent additional Claude responses
        }

        // Get Claude's response to the function results
        response = await APIRetryHandler.executeWithRetry(
          async () => {
            // Use fresh abort check to avoid Claude SDK cleanup interference
            return client.messages.create({
              model: 'claude-3-5-sonnet-latest',
              max_tokens: 2000,
              temperature: 0.7,
              system: systemPrompt,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              messages: messages as any,
              tools: claudeApiFunctions,
              tool_choice: { type: 'auto' }
            });
          },
          {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 60000
          }
        );
      }

      // Collect final text content
      if (stream && streamedContent) {
        finalContent += streamedContent;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalTextBlocks = response.content.filter((block: any) => block.type === 'text') as any[];
        finalContent += finalTextBlocks.map(block => block.text).join('');
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
    conversationHistory: ClaudeMessage[] = [],
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
    onChunk?: (chunk: string, isComplete: boolean) => void
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
  static formatConversationHistory(messages: { role: string; content: string }[]): ClaudeMessage[] {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
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

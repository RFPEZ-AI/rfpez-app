// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */

// Claude API service for RFPEZ.AI Multi-Agent System with MCP Integration
import Anthropic from '@anthropic-ai/sdk';
import type { Message, ContentBlock, TextBlock, ToolUseBlock, MessageParam } from '@anthropic-ai/sdk/resources';
import type { Agent } from '../types/database';
import { ToolInvocationEvent } from '../types/streamingProtocol';
import { claudeApiFunctions, claudeAPIHandler } from './claudeAPIFunctions';
import { APIRetryHandler } from '../utils/apiRetry';
import { supabase } from '../supabaseClient';
import { AgentService } from './agentService';

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
    
    const response = await fetch(`${supabaseUrl}/functions/v1/supabase-mcp-server`, {
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
   * Detect if user has previously logged in on this device
   */
  private static detectPreviousLoginEvidence(): {
    hasPreviousLogin: boolean;
    lastLoginTime?: string;
    loginCount?: number;
  } {
    try {
      // Check for Supabase auth evidence in localStorage
      const hasSupabaseAuth = Object.keys(localStorage).some(key => 
        key.startsWith('supabase.auth.') || key.includes('supabase-auth-token')
      );

      // Check our custom login tracking
      const loginHistory = localStorage.getItem('rfpez-login-history');
      let parsedHistory = null;
      
      if (loginHistory) {
        try {
          parsedHistory = JSON.parse(loginHistory);
        } catch {
          // Invalid JSON, ignore
        }
      }

      return {
        hasPreviousLogin: hasSupabaseAuth || !!parsedHistory,
        lastLoginTime: parsedHistory?.lastLogin,
        loginCount: parsedHistory?.count || 0
      };
    } catch (error) {
      console.debug('Error detecting previous login evidence:', error);
      return { hasPreviousLogin: false };
    }
  }

  /**
   * Track successful login for future detection
   */
  private static trackLogin(): void {
    try {
      const now = new Date().toISOString();
      const existing = localStorage.getItem('rfpez-login-history');
      let history = { count: 0, firstLogin: now, lastLogin: now };
      
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          history = {
            count: (parsed.count || 0) + 1,
            firstLogin: parsed.firstLogin || now,
            lastLogin: now
          };
        } catch {
          // Invalid JSON, use default
        }
      } else {
        history.count = 1;
      }
      
      localStorage.setItem('rfpez-login-history', JSON.stringify(history));
    } catch (error) {
      console.debug('Error tracking login:', error);
    }
  }

  /**
   * Initialize and clean up authentication state
   */
  private static async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Clear any stale auth data for anonymous users
        await supabase.auth.signOut();
      }
    } catch (error) {
      // Ignore auth errors for anonymous usage
      console.debug('Auth initialization (anonymous mode):', error);
    }
  }

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
   * Generate a response using claude-api-v3 edge function
   */
  private static async generateResponseViaEdgeFunction(
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
    onChunk?: (chunk: string, isComplete: boolean, toolProcessing?: boolean, toolEvent?: ToolInvocationEvent, forceToolCompletion?: boolean, metadata?: any) => void,
    processInitialPrompt = false // New parameter for initial prompt processing
  ): Promise<ClaudeResponse> {
    // Use centralized Supabase client to avoid multiple instance warnings
    
    // DEBUG: Check environment and auth status for anonymous key investigation
    const session = await supabase.auth.getSession();
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    console.log('🔍 Auth & Environment Debug:', {
      hasSession: !!session?.data?.session,
      hasAccessToken: !!session?.data?.session?.access_token,
      hasAnonKey: !!anonKey,
      anonKeyLength: anonKey?.length || 0,
      anonKeyPreview: anonKey ? anonKey.substring(0, 20) + '...' : 'undefined',
      userId: session?.data?.session?.user?.id || 'anonymous',
      streaming: stream
    });
    
    // Detect previous login evidence for anonymous users
    const loginEvidence = this.detectPreviousLoginEvidence();
    
    // Track login if user is currently authenticated
    if (userProfile?.id) {
      this.trackLogin();
    }
    
    // If sessionId is provided, verify it has an agent assigned (brief delay for database consistency)
    if (sessionId && userProfile?.id) {
      try {
        // Small delay to ensure database writes are committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const sessionAgent = await AgentService.getSessionActiveAgent(sessionId);
        if (!sessionAgent) {
          console.warn('Session has no agent assigned, edge function will use fallback logic:', sessionId);
        } else {
          console.log('Session agent verified:', { sessionId, agentId: sessionAgent.agent_id, agentName: sessionAgent.agent_name });
        }
      } catch (error) {
        console.warn('Could not verify session agent, proceeding anyway:', error);
      }
    }
    
    // Build memory context (only if user is authenticated)
    let memoryContext = '';
    if (userProfile?.id && agent.id) {
      try {
        const { MemoryService } = await import('./memoryService');
        memoryContext = await MemoryService.buildMemoryContext(
          userProfile.id,
          agent.id,
          userMessage,
          { limit: 5, similarityThreshold: 0.75 }
        );
      } catch (error) {
        console.warn('Failed to build memory context:', error);
        // Continue without memory context rather than failing the whole request
      }
    }
    
    const payload = {
      userMessage,
      agent,
      conversationHistory,
      sessionId,
      userProfile,
      currentRfp,
      currentArtifact,
      loginEvidence, // Add login evidence to payload
      memoryContext, // Add memory context to payload
      stream: stream, // Enable streaming - claude-api-v3 supports proper streaming
      processInitialPrompt // Add flag to indicate initial prompt processing
    };

    // 🚨 DEBUG: Log the processInitialPrompt flag value
    console.log('� generateResponseViaEdgeFunction - processInitialPrompt:', processInitialPrompt);
    console.log('🚨 Call stack trace:', new Error().stack?.split('\n').slice(2, 5).join('\n'));

    console.log('�🚀 Calling claude-api-v3 edge function with payload:', {
      userMessage: userMessage.substring(0, 100) + '...',
      agentId: agent?.id,
      sessionId,
      hasRfp: !!currentRfp,
      hasArtifact: !!currentArtifact,
      historyLength: conversationHistory.length,
      processInitialPrompt // Add to debug output
    });

    try {
      if (stream && onChunk) {
        // Use direct fetch for streaming responses
        const session = await supabase.auth.getSession();
        const authToken = session.data.session?.access_token || process.env.REACT_APP_SUPABASE_ANON_KEY;
        
        console.log('🔍 Streaming Auth Debug:', {
          hasAccessToken: !!session.data.session?.access_token,
          usingAnonKey: !session.data.session?.access_token,
          authTokenLength: authToken?.length || 0,
          authTokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'undefined'
        });
        
        // Validate auth token before making request
        if (!authToken) {
          throw new Error('No authentication token available (neither access token nor anonymous key)');
        }
        
        console.log('🚀 Making streaming request to:', `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-api-v3`);
        
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-api-v3`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload),
            signal: abortSignal
          }
        );
        
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          // Check for Claude API service outage errors
          if (response.status === 503) {
            const errorText = await response.text().catch(() => 'Service unavailable');
            if (errorText.includes('503') || errorText.includes('upstream connect error')) {
              throw new Error('Claude API error: 503 upstream connect error or disconnect/reset before headers. reset reason: remote connection failure, transport failure reason: delayed connect error: Connection refused');
            }
          }
          throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let toolsUsed: string[] = [];
        const functionResults: Array<{
          function: string;
          result: unknown;
        }> = [];
        let buffer = ''; // Buffer for incomplete lines
        let streamingCompletionMetadata: any = null; // Store completion metadata from Edge Function

        if (reader) {
          try {
            console.log('🌊 Starting streaming reader loop');
            let chunkCount = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read();
              chunkCount++;
              
              console.log('🔍 Reader iteration:', {
                chunkCount,
                done,
                valueLength: value?.length || 0,
                bufferLength: buffer.length,
                fullContentLength: fullContent.length
              });
              
              if (done) {
                console.log('✅ Stream reader completed - done=true');
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              console.log('📥 Decoded chunk:', {
                chunkLength: chunk.length,
                chunkPreview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''),
                bufferLengthBefore: buffer.length
              });

              buffer += chunk; // Add to buffer
              const lines = buffer.split('\n');
              
              // Keep the last line in buffer (might be incomplete)
              buffer = lines.pop() || '';
              
              console.log('📋 Processing lines:', {
                totalLines: lines.length,
                bufferLengthAfter: buffer.length,
                linePreviews: lines.slice(0, 3).map(line => line.substring(0, 50) + (line.length > 50 ? '...' : ''))
              });

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6);
                    console.log('🔍 Parsing JSON line:', {
                      lineLength: line.length,
                      jsonLength: jsonStr.length,
                      jsonPreview: jsonStr.substring(0, 100) + (jsonStr.length > 100 ? '...' : '')
                    });
                    const eventData = JSON.parse(jsonStr);
                    

                    
                    if ((eventData.type === 'text' && eventData.content) || (eventData.type === 'content_delta' && eventData.delta)) {
                      const content = eventData.content || eventData.delta;
                      fullContent += content;

                      console.log('📤 Calling onChunk with content:', {
                        contentLength: content.length,
                        contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        fullContentLength: fullContent.length,
                        eventType: eventData.type
                      });
                      
                      onChunk(content, false);
                    } else if (eventData.type === 'message_complete') {
                      console.log('✅ First agent message complete before agent switch');
                      // Pass metadata to signal message completion
                      onChunk('', false, false, undefined, false, {
                        message_complete: true,
                        agent_id: eventData.agent_id
                      });
                    } else if (eventData.type === 'message_start') {
                      console.log('🆕 New agent message starting:', {
                        agent_id: eventData.agent_id,
                        agent_name: eventData.agent_name
                      });
                      // Reset content accumulation and pass metadata to create new message
                      fullContent = '';
                      onChunk('', false, false, undefined, false, {
                        message_start: true,
                        agent_id: eventData.agent_id,
                        agent_name: eventData.agent_name
                      });
                    } else if (eventData.type === 'tool_invocation') {
                      if (eventData.toolEvent?.type === 'tool_start') {
                        const toolName = eventData.toolEvent.toolName;
                        if (!toolsUsed.includes(toolName)) {
                          toolsUsed.push(toolName);
                        }
                        // Pass the actual tool event data to the UI
                        onChunk('', false, true, eventData.toolEvent);
                      } else if (eventData.toolEvent?.type === 'tool_complete') {
                        functionResults.push({
                          function: eventData.toolEvent.toolName,
                          result: eventData.toolEvent.result
                        });
                        // Pass the tool completion event to the UI
                        onChunk('', false, true, eventData.toolEvent);
                      }
                    } else if (eventData.type === 'progress') {
                      // 📊 Handle progress events
                      console.log('📊 Progress event:', eventData.message);
                      // Pass progress event to UI with special metadata
                      onChunk('', false, false, undefined, false, {
                        progress: true,
                        progress_message: eventData.message,
                        progress_data: {
                          recursionDepth: eventData.recursionDepth,
                          toolCount: eventData.toolCount,
                          toolName: eventData.toolName,
                          toolIndex: eventData.toolIndex,
                          totalTools: eventData.totalTools,
                          action: eventData.action,
                          agentName: eventData.agentName
                        }
                      });
                    } else if (eventData.type === 'completion' || eventData.type === 'complete') {
                      console.log('✅ Stream completion detected:', eventData.type);
                      
                      // 🔧 CAPTURE COMPLETION METADATA for agent switching detection
                      if (eventData.metadata) {
                        streamingCompletionMetadata = eventData.metadata;
                        console.log('� Captured streaming completion metadata:', {
                          hasAgentSwitch: !!eventData.metadata.agent_switch_occurred,
                          functionsCallled: eventData.metadata.functions_called,
                          functionResultsCount: eventData.metadata.function_results?.length || 0
                        });
                      }
                      
                      // Process any final content from completion event if present
                      if (eventData.content || eventData.full_content) {
                        // If we have full_content and it's longer than what we've streamed, use the missing part
                        if (eventData.full_content && eventData.full_content.length > fullContent.length) {
                          const missingContent = eventData.full_content.substring(fullContent.length);
                          console.log('📝 Adding missing content from completion:', missingContent.length, 'chars');
                          fullContent = eventData.full_content; // Update to complete content
                          onChunk(missingContent, false);
                        } else if (eventData.content) {
                        fullContent += eventData.content;
                        console.log('� Adding final completion content:', eventData.content.length, 'chars');
                          onChunk(eventData.content, false);
                        }
                      }
                      
                      // Only call completion after processing any final content
                      console.log('🏁 Calling final completion with total content:', fullContent.length, 'chars');
                      console.log('🎯 STREAMING FINAL SUMMARY:', {
                        totalContentLength: fullContent.length,
                        totalChunksProcessed: chunkCount,
                        toolsUsedCount: toolsUsed.length,
                        toolsUsed: toolsUsed
                      });
                      onChunk('', true); // Indicate completion
                      
                      if (eventData.metadata?.toolsUsed) {
                        toolsUsed = [...new Set([...toolsUsed, ...eventData.metadata.toolsUsed])];
                      }
                      
                      // Process client callbacks if present
                      if (eventData.metadata?.clientCallbacks) {
                        console.log('🔄 Processing client callbacks:', eventData.metadata.clientCallbacks);
                        eventData.metadata.clientCallbacks.forEach((callback: Record<string, unknown>) => {
                          if (callback.type === 'ui_refresh') {
                            console.log('🔄 Dispatching UI refresh callback via window message:', callback);
                            
                            // Use proper EDGE_FUNCTION_CALLBACK message structure that Home.tsx expects
                            const message = {
                              type: 'EDGE_FUNCTION_CALLBACK',
                              callbackType: callback.type,
                              target: callback.target,
                              payload: callback.payload,
                              debugInfo: {
                                timestamp: new Date().toISOString(),
                                source: 'claudeService.streaming.completion',
                                originalCallbackType: callback.type
                              }
                            };
                            
                            console.log('📤 Posting EDGE_FUNCTION_CALLBACK message:', message);
                            window.postMessage(message, '*');
                          }
                        });
                      }
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', {
                      error: parseError,
                      lineLength: line.length,
                      linePreview: line.substring(0, 200) + '...',
                      rawLine: line
                    });
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }

        return {
          content: fullContent,
          metadata: {
            model: 'claude-sonnet-4-20250514',
            response_time: 0,
            temperature: 0.7,
            tokens_used: 0,
            functions_called: toolsUsed,
            function_results: functionResults,
            is_streaming: true,
            stream_complete: true,
            agent_switch_occurred: streamingCompletionMetadata?.agent_switch_occurred || false
          }
        };
      } else {
        // Use supabase invoke for non-streaming responses
        const { data, error } = await supabase.functions.invoke('claude-api-v3', {
          body: payload
        });

        if (error) {
          console.error('🚨 Edge function error:', error);
          
          const errorMessage = error.message || '';
          
          // Check for authentication errors (expired/invalid session)
          if (errorMessage.includes('AUTHENTICATION_REQUIRED') || 
              errorMessage.includes('Failed to get authenticated user') ||
              errorMessage.includes('session has expired')) {
            throw new Error('⚠️ SESSION_EXPIRED: Your session has expired. Please logout and login again to continue.');
          }
          
          // Check for Claude API service outage patterns
          if (errorMessage.includes('503') || 
              errorMessage.includes('upstream connect error') ||
              errorMessage.includes('remote connection failure') ||
              errorMessage.includes('Connection refused')) {
            throw new Error('Claude API error: 503 upstream connect error or disconnect/reset before headers. reset reason: remote connection failure, transport failure reason: delayed connect error: Connection refused');
          }
          
          throw new Error(`Edge function failed: ${error.message}`);
        }

        console.log('✅ Edge function response received:', {
          hasContent: !!data?.content,
          contentLength: data?.content?.length || 0,
          hasMetadata: !!data?.metadata,
          toolResults: data?.toolResults || [],
          usage: data?.usage
        });

        // Use metadata from edge function response if available, otherwise construct it
        const metadata = data.metadata || {
          model: 'claude-sonnet-4-20250514',
          response_time: data.response_time || 0,
          temperature: 0.7,
          tokens_used: data.usage?.input_tokens || 0,
          functions_called: data.functionsExecuted || [],
          function_results: data.functionResults || [],
          is_streaming: false,
          stream_complete: true,
          agent_switch_occurred: data.agent_switch_occurred || false
        };

        return {
          content: data.content || data.response || '', // Support both old and new response formats
          metadata: metadata
        };
      }
    } catch (error) {
      console.error('🚨 Error calling edge function:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to call claude-api-v3: ${errorMessage}`);
    }
  }

  /**
   * Process an agent's initial_prompt through Claude to generate a dynamic welcome message
   * This replaces static welcome messages with context-aware greetings
   */
  static async processInitialPrompt(
    agent: Agent,
    sessionId?: string,
    userProfile?: {
      id?: string;
      email?: string;
      full_name?: string;
      role?: string;
    },
    urlContext?: {
      bid_id?: string | null;
      rfp_id?: string | null;
    }
  ): Promise<string> {
    console.log('🎭 Processing initial prompt for agent:', agent.name);
    console.log('🎭 Initial prompt preview:', agent.initial_prompt?.substring(0, 100) + '...');
    console.log('🎭 Session ID:', sessionId);
    console.log('🎭 User profile:', userProfile ? 'Present' : 'None');
    console.log('🎭 URL context:', urlContext);
    
    try {
      // Use the edge function with processInitialPrompt flag
      console.log('🎭 Calling edge function with processInitialPrompt=true');
      // 🎯 IMPORTANT: processInitialPrompt MUST use streaming because edge function forces streaming
      // when processInitialPrompt=true to enable activation notices and memory search
      
      // Embed URL context (bid_id, rfp_id) in the initial prompt if available
      let promptWithContext = agent.initial_prompt || 'Hello! How can I help you today?';
      const contextParams: string[] = [];
      if (urlContext?.bid_id) {
        contextParams.push(`bid_id=${urlContext.bid_id}`);
        console.log('🎭 Embedded bid_id in initial prompt:', urlContext.bid_id);
      }
      if (urlContext?.rfp_id) {
        contextParams.push(`rfp_id=${urlContext.rfp_id}`);
        console.log('🎭 Embedded rfp_id in initial prompt:', urlContext.rfp_id);
      }
      if (contextParams.length > 0) {
        promptWithContext = `[URL Context: ${contextParams.join(', ')}]\n\n${promptWithContext}`;
      }
      
      const response = await this.generateResponseViaEdgeFunction(
        promptWithContext,
        agent,
        [], // No conversation history for initial prompts
        sessionId,
        userProfile,
        null, // No current RFP
        null, // No current artifact
        undefined, // No abort signal
        true, // ✅ Enable streaming - edge function forces streaming for processInitialPrompt
        (chunk: string, isComplete: boolean) => {
          // Silent streaming - no UI updates during initial prompt processing
          // The streaming handler accumulates chunks internally in fullContent
          if (isComplete) {
            console.log('✅ Initial prompt streaming complete');
          }
        },
        true // processInitialPrompt = true
      );
      
      console.log('🎭 Edge function response received:', response.content.substring(0, 100) + '...');
      console.log('🎭 Response type:', typeof response.content);
      console.log('🎭 Full response object:', response);
      
      return response.content;
    } catch (error) {
      console.error('❌ Error processing initial prompt:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Never fall back to static initial_prompt. Always show error to user.
      throw error;
    }
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
    onChunk?: (chunk: string, isComplete: boolean, toolProcessing?: boolean, toolEvent?: ToolInvocationEvent, forceToolCompletion?: boolean, metadata?: any) => void
  ): Promise<ClaudeResponse> {
    // Initialize and clean up authentication state
    await this.initializeAuth();

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
      // 🔧 SMART ROUTING: Use edge function if no API key available, otherwise use direct SDK
      const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      const useEdgeFunction = !apiKey || apiKey === 'your_claude_api_key_here';
      
      console.log('🔧 CLAUDE SERVICE ROUTING:', {
        useEdgeFunction,
        hasApiKey: !!apiKey,
        streaming: stream
      });
      
      if (useEdgeFunction) {
        // Route to claude-api-v3 edge function
        return this.generateResponseViaEdgeFunction(
          userMessage,
          agent,
          conversationHistory,
          sessionId,
          userProfile,
          currentRfp,
          currentArtifact,
          abortSignal,
          stream,
          onChunk
        );
      }
      
      // Use direct Anthropic SDK (fallback for when API key is available)
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

      // Build memory context (only if user is authenticated)
      let memoryContext = '';
      if (userProfile?.id && agent.id) {
        try {
          const { MemoryService } = await import('./memoryService');
          memoryContext = await MemoryService.buildMemoryContext(
            userProfile.id,
            agent.id,
            userMessage,
            { limit: 5, similarityThreshold: 0.75 }
          );
        } catch (error) {
          console.warn('Failed to build memory context:', error);
          // Continue without memory context rather than failing the whole request
        }
      }

      const systemPrompt = `${agent.instructions || `You are ${agent.name}, an AI assistant.`}${userContext}${sessionContext}${rfpContext}${artifactContext}${memoryContext}

You are part of a multi-agent system with integrated MCP (Model Context Protocol) support and have access to several powerful functions:

CONVERSATION MANAGEMENT (via MCP Server):
- Retrieve conversation history from previous sessions (get_conversation_history)
- Store messages and create new sessions (store_message, create_session)
- Search through past conversations (search_messages)
- Access recent sessions (get_recent_sessions)

AGENT MANAGEMENT:
- Get available agents in the system (get_available_agents) - ALWAYS show agent IDs when listing
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

CRITICAL AGENT SWITCHING RULE:
When switching agents, you MUST CALL the switch_agent function - do NOT just mention switching in text.
WRONG: "I'll connect you with the RFP Designer..." (without calling switch_agent)
RIGHT: Call switch_agent function AND explain the switch.
If you mention switching agents, you MUST immediately call the switch_agent function.

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



Be helpful, accurate, and professional. When switching agents, make the transition smooth and explain the benefits.`;

      // 🔍 DEBUG: Log the system prompt being sent to Claude
      console.log('🔍 SYSTEM PROMPT DEBUG:', {
        agentName: agent.name,
        agentRole: agent.role,
        instructionsLength: agent.instructions?.length || 0,
        systemPromptLength: systemPrompt.length,
        systemPromptPreview: systemPrompt.substring(0, 300) + '...'
      });

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
                tool_choice: { type: 'auto' }
              }, apiOptions);
            },
            {
              maxRetries: 3,
              baseDelay: 2000,
              maxDelay: 60000
            }
          );

          console.log('🚀 Stream response received:', {
            streamResponseType: typeof streamResponse,
            hasSymbolAsyncIterator: Symbol.asyncIterator in (streamResponse || {}),
            isStreamResponse: streamResponse !== null && streamResponse !== undefined,
            streamResponseKeys: Object.keys(streamResponse || {}),
            streamResponseMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(streamResponse || {}))
          });
          
          // EXPERIMENTAL: Try multiple streaming initialization patterns
          console.log('🔍 Stream response details:', {
            connected: (streamResponse as any)?._connected,
            ended: (streamResponse as any)?.ended,
            errored: (streamResponse as any)?.errored,
            aborted: (streamResponse as any)?.aborted,
            hasOn: typeof (streamResponse as any)?.on === 'function',
            hasEmit: typeof (streamResponse as any)?.emit === 'function',
            constructor: streamResponse.constructor.name
          });
          
          // Try to use stream event methods if available
          if (typeof (streamResponse as any).on === 'function') {
            console.log('🔧 Stream has EventEmitter pattern, trying alternative approach...');
            
            // const accumulatedText = ''; // Not used in current implementation
            let eventReceived = false;
            
            // Set up event listeners
            (streamResponse as any).on('data', (data: any) => {
              console.log('📡 Stream data event:', data);
              eventReceived = true;
            });
            
            (streamResponse as any).on('chunk', (chunk: any) => {
              console.log('📡 Stream chunk event:', chunk);
              eventReceived = true;
            });
            
            (streamResponse as any).on('message', (message: any) => {
              console.log('📡 Stream message event:', message);
              eventReceived = true;
            });
            
            // Wait a moment to see if events fire
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (eventReceived) {
              console.log('✅ EventEmitter pattern worked!');
              // Continue with EventEmitter pattern...
            } else {
              console.log('❌ No events received via EventEmitter, falling back to iterator');
            }
          }
          
          // POTENTIAL FIX: Some Claude SDK versions require explicit connection
          if (typeof (streamResponse as any)?._run === 'function') {
            console.log('🔧 Stream has _run method, attempting to start...');
            try {
              await (streamResponse as any)._run();
              console.log('✅ Stream _run completed');
            } catch (runError) {
              console.warn('⚠️ Stream _run failed:', runError);
            }
          }
          
          // FIXED: Process streaming response with SEGMENTED tool handling
          const assistantContent: ContentBlock[] = [];
          let currentTextContent = '';
          // Removed toolCalls array - tools are now executed inline during streaming
          let chunkCount = 0;
          let lastAbortCheck = Date.now();
          
          console.log('🎯 About to enter streaming event loop with async iterator...', {
            hasAsyncIterator: typeof streamResponse[Symbol.asyncIterator] === 'function',
            streamReadyState: (streamResponse as any)?._connected ? 'connected' : 'not connected',
            streamIteratorFunction: streamResponse[Symbol.asyncIterator]?.toString?.()
          });
          
          // EXPERIMENTAL: Try to manually get the iterator and check its state
          try {
            const iterator = streamResponse[Symbol.asyncIterator]();
            console.log('🔍 Manual iterator created:', {
              iteratorType: typeof iterator,
              iteratorMethods: Object.getOwnPropertyNames(iterator),
              hasNext: typeof iterator.next === 'function'
            });
            
            // Try to get first result manually
            const firstResult = await iterator.next();
            console.log('🔍 First manual iteration result:', {
              done: firstResult.done,
              hasValue: firstResult.value !== undefined,
              valueType: typeof firstResult.value
            });
            
            if (!firstResult.done && firstResult.value) {
              console.log('✅ Manual iteration SUCCESS! Processing first event...');
              // Process this first event
              const event = firstResult.value;
              console.log('🎯 FIRST STREAM EVENT:', {
                eventType: event.type,
                eventKeys: Object.keys(event)
              });
              
              // Continue with manual iteration...
              let iterationCount = 1;
              let iterationComplete = false;
              while (!iterationComplete) {
                const nextResult = await iterator.next();
                iterationCount++;
                
                if (nextResult.done) {
                  console.log(`✅ Manual iteration completed after ${iterationCount} events`);
                  iterationComplete = true;
                  break;
                }
                
                const event = nextResult.value;
                console.log(`🎯 STREAM EVENT ${iterationCount}:`, {
                  eventType: event.type,
                  eventKeys: Object.keys(event)
                });
                
                // Process the event here (same logic as below)
                // ...
                
                if (iterationCount > 1000) {
                  console.warn('⚠️ Breaking manual iteration after 1000 events');
                  break;
                }
              }
              
              // If we get here, manual iteration worked!
              console.log('✅ MANUAL ITERATION SUCCESSFUL - bypassing for-await loop');
              return { 
                content: currentTextContent,
                metadata: {
                  model: 'claude-sonnet-4-20250514',
                  response_time: Date.now() - startTime,
                  temperature: 0.7,
                  functions_called: [],
                  function_results: []
                }
              };
              
            } else {
              console.log('❌ Manual iteration failed - first result was done or empty');
            }
          } catch (manualIterError) {
            console.error('❌ Manual iteration error:', manualIterError);
          }
          
          // CRITICAL: Handle streaming events correctly per ChatGPT 5 guidance
          console.log('🎯 Falling back to for-await loop...');
          for await (const event of streamResponse) {
            chunkCount++;
            const chunkTime = Date.now();
            
            // DEBUG: Log all events to understand what's happening
            console.log('🎯 STREAM EVENT DEBUG:', {
              eventType: event.type,
              eventKeys: Object.keys(event),
              eventData: JSON.stringify(event, null, 2).substring(0, 500)
            });
            
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
                    
                    // ENHANCED: Support stream insertions during tool execution
                    if (toolUse.name === 'create_and_set_rfp' && onChunk) {
                      // Send real-time updates during RFP creation
                      onChunk('🔄 Creating RFP...', false, true);
                      setTimeout(() => onChunk('📝 Saving RFP details...', false, true), 500);
                      setTimeout(() => onChunk('🔗 Setting as current RFP...', false, true), 1000);
                      setTimeout(() => onChunk('✅ RFP creation in progress...', false, true), 1500);
                    }
                    
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
                  
                  // Create timeout promise first - increased from 30s to 90s for complex operations like RFP creation
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('FORCE_TIMEOUT: Tool processing exceeded 90 second limit')), 90000);
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
                    
                    // STREAMING BUFFER FIX: Clean tool response text to ensure no metadata contamination
                    // CRITICAL FIX: Clean metadata while preserving all necessary whitespace
                    const cleanToolResponseText = toolResponseText
                      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '') // Remove UUIDs completely
                      .replace(/\{"id":"[^"]+","type":"[^"]+"\}/g, '') // Remove JSON objects completely
                      .replace(/\btool_use_id\b[^,}\]]+[,}\]]/g, '') // Remove tool_use_id references completely
                      .replace(/[ \t]{2,}/g, ' ') // Only normalize multiple horizontal spaces (preserve single spaces and all newlines)
                      .trim();
                    
                    if (cleanToolResponseText && cleanToolResponseText !== toolResponseText) {
                      console.log('🔧 CLEANED TOOL RESPONSE TEXT:', {
                        originalLength: toolResponseText.length,
                        cleanedLength: cleanToolResponseText.length,
                        originalPreview: toolResponseText.substring(0, 100) + '...',
                        cleanedPreview: cleanToolResponseText.substring(0, 100) + '...'
                      });
                    }
                    
                    // Stream the cleaned tool response content
                    onChunk?.(cleanToolResponseText || toolResponseText, false);
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
                    ? 'Tool processing exceeded time limit (90s). Please try again. If this persists, there may be a database connectivity issue.'
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



      // Collect final text content - FIXED to handle tool calls properly
      let finalContent = '';
      
      // Always extract text from the final response object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalTextBlocks = response.content.filter((block: any) => block.type === 'text') as any[];
      const rawResponseTextContent = finalTextBlocks.map(block => block.text).join('');
      
      // STREAMING BUFFER FIX: Clean response text content to prevent tool metadata contamination
      const responseTextContent = rawResponseTextContent
        .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '') // Remove UUIDs
        .replace(/\{"id":"[^"]+","type":"[^"]+"\}/g, '') // Remove JSON objects
        .replace(/\btool_use_id\b[^,}\]]+[,}\]]/g, '') // Remove tool_use_id references
        .trim();
      
      if (responseTextContent !== rawResponseTextContent) {
        console.log('🔧 CLEANED RESPONSE TEXT CONTENT:', {
          originalLength: rawResponseTextContent.length,
          cleanedLength: responseTextContent.length,
          originalPreview: rawResponseTextContent.substring(0, 100) + '...',
          cleanedPreview: responseTextContent.substring(0, 100) + '...'
        });
      }
      
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

      // Debug: Check for missed agent switches
      if (!agentSwitchOccurred && finalContent) {
        const agentSwitchDebugger = (await import('../utils/agentSwitchDebugger')).default;
        const missedSwitch = agentSwitchDebugger.detectMissedAgentSwitch(finalContent, functionsExecuted);
        
        if (missedSwitch.shouldHaveSwitched) {
          agentSwitchDebugger.logMissedSwitch(finalContent, missedSwitch.suggestedAgent);
        }
      }

      // Check if we need recursive continuation after tool processing
      const needsContinuation = functionsExecuted.length > 0 && 
                              (!finalContent || finalContent.trim().length < 50) &&
                              !agentSwitchOccurred && 
                              stream && onChunk; // Only continue if streaming with callback
      
      if (needsContinuation) {
        console.log('🔄 Detected need for recursive continuation after tool processing');
        
        // Build updated conversation history with tool results
        const updatedMessages: MessageParam[] = [
          ...conversationHistory,
          {
            role: 'user',
            content: userMessage
          },
          {
            role: 'assistant',
            content: finalContent || 'I have processed your request and executed the necessary functions.'
          }
        ];
        
        // Add tool results as system messages to provide context
        if (allFunctionResults.length > 0) {
          const toolSummary = allFunctionResults.map(result => 
            `${result.function}: ${typeof result.result === 'object' ? JSON.stringify(result.result) : result.result}`
          ).join('; ');
          
          updatedMessages.push({
            role: 'user',
            content: `Based on the tool results (${toolSummary}), please continue your response with any additional information or next steps.`
          });
        }
        
        try {
          console.log('🔄 Starting recursive continuation call');
          const continuationResponse = await this.generateResponse(
            '', // Empty user message since we're continuing with updated history
            agent,
            updatedMessages,
            sessionId,
            userProfile,
            currentRfp,
            currentArtifact,
            abortSignal,
            stream,
            onChunk
          );
          
          // Combine responses
          const combinedContent = (finalContent + ' ' + continuationResponse.content).trim();
          const combinedFunctions = [...functionsExecuted, ...(continuationResponse.metadata.functions_called || [])];
          const combinedResults = [...allFunctionResults, ...(continuationResponse.metadata.function_results || [])];
          
          console.log('🔄 Recursive continuation completed, combined response length:', combinedContent.length);
          
          return {
            content: combinedContent,
            metadata: {
              model: response.model,
              tokens_used: (response.usage?.input_tokens + response.usage?.output_tokens || 0) + 
                          (continuationResponse.metadata.tokens_used || 0),
              response_time: responseTime,
              temperature: 0.7,
              functions_called: combinedFunctions,
              function_results: combinedResults,
              agent_switch_occurred: agentSwitchOccurred,
              agent_switch_result: agentSwitchResult,
              is_streaming: stream,
              stream_complete: true,
              recursive_continuation: true
            }
          };
        } catch (continuationError) {
          console.error('🔄 Recursive continuation failed:', continuationError);
          // Fall back to original response
        }
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
    onChunk?: (chunk: string, isComplete: boolean, toolProcessing?: boolean, toolEvent?: ToolInvocationEvent, forceToolCompletion?: boolean, metadata?: any) => void
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

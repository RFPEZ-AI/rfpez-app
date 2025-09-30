// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Proxy Service - HTTP client for edge function v2
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion */

import { supabase } from '../supabaseClient';

// Types for the hybrid architecture
export interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification';
  target: string;
  payload: any;
}

export interface EdgeFunctionResponse {
  success: boolean;
  data: any;
  clientCallbacks?: ClientCallback[];
  requiresClientAction?: boolean;
  message?: string;
}

// Memory Management Types
export interface MemoryBuffer {
  id: string;
  size: number;
  data: ArrayBuffer;
  isInUse: boolean;
  createdAt: number;
  lastUsed: number;
  useCount: number;
}

export interface MemoryPoolConfig {
  maxBufferSize: number;         // 1MB default
  maxPoolSize: number;           // 50 buffers
  bufferGrowthFactor: number;    // 1.5x growth
  minBufferSize: number;         // 4KB minimum
  gcThreshold: number;           // 0.8 (80% memory pressure)
  maxIdleTime: number;           // 5 minutes
  enableCompression: boolean;    // GZip compression
}

export interface MemoryMetrics {
  totalAllocated: number;
  totalUsed: number;
  bufferCount: number;
  poolUtilization: number;
  gcCount: number;
  lastMemoryPressure: number;
  averageBufferSize: number;
  memoryLeakRisk: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; [key: string]: any }>;
}

export interface ClaudeGenerateParams {
  messages: ClaudeMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  tools?: any[];
  sessionId?: string; // Add session context for edge function
}

class ClaudeAPIProxyService {
  private baseUrl: string;

  constructor() {
    // Use the edge function v3 endpoint
    this.baseUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-api-v3`;
  }

  // Get authentication headers
  private async getHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    };
  }

  // Execute edge function call
  private async callEdgeFunction(functionName: string, parameters: any): Promise<EdgeFunctionResponse> {
    const startTime = this.trackRequestStart();
    let responseBytes = 0;
    
    try {
      const headers = await this.getHeaders();
      
      console.log(`🌐 Calling edge function: ${functionName}`, { parameters });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⌛ Edge function timeout after 120 seconds: ${functionName}`);
        controller.abort();
      }, 120000); // 120 second timeout - increased for complex operations like RFP creation
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        signal: controller.signal, // Add abort signal
        body: JSON.stringify({
          functionName,
          parameters,
          sessionContext: parameters.sessionId ? {
            sessionId: parameters.sessionId,
            timestamp: new Date().toISOString()
          } : undefined,
        }),
      });
      
      clearTimeout(timeoutId); // Clear timeout on success

      if (!response.ok) {
        const errorText = await response.text();
        responseBytes = new Blob([errorText]).size;
        this.trackRequestEnd(startTime, false, responseBytes);
        throw new Error(`Edge function call failed: ${response.status} ${errorText}`);
      }

      const result: EdgeFunctionResponse = await response.json();
      responseBytes = new Blob([JSON.stringify(result)]).size;
      this.trackRequestEnd(startTime, true, responseBytes);
      
      console.log(`✅ Edge function response: ${functionName}`, { 
        success: result.success, 
        hasCallbacks: result.clientCallbacks && result.clientCallbacks.length > 0 
      });

      console.log(`📊 DEBUG - Detailed response analysis:`, {
        functionName,
        responseSuccess: result.success,
        responseData: !!result.data,
        responseDataKeys: result.data ? Object.keys(result.data) : 'none',
        responseMessage: result.message,
        callbackCount: result.clientCallbacks?.length || 0,
        callbacks: result.clientCallbacks?.map(cb => ({
          type: cb.type,
          target: cb.target,
          payloadKeys: cb.payload ? Object.keys(cb.payload) : 'none'
        })),
        requiresClientAction: result.requiresClientAction,
        responseSize: JSON.stringify(result).length
      });

      // Process client callbacks if present
      if (result.clientCallbacks && result.clientCallbacks.length > 0) {
        console.log(`🔄 DEBUG - Processing ${result.clientCallbacks.length} callbacks`);
        await this.processClientCallbacks(result.clientCallbacks);
      } else {
        console.log(`📭 DEBUG - No callbacks to process for ${functionName}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Edge function call failed: ${functionName}`, error);
      throw error;
    }
  }

  // Process client callbacks for UI updates
  private async processClientCallbacks(callbacks: ClientCallback[]): Promise<void> {
    console.log(`🎯 CALLBACK DEBUG - processClientCallbacks ENTRY:`, {
      callbackCount: callbacks?.length || 0,
      callbacksValid: Array.isArray(callbacks),
      timestamp: new Date().toISOString(),
      windowAvailable: typeof window !== 'undefined',
      callbackDetails: callbacks?.map((cb, index) => ({
        index,
        type: cb?.type,
        target: cb?.target,
        hasPayload: !!cb?.payload,
        payloadKeys: cb?.payload ? Object.keys(cb.payload) : []
      })) || []
    });
    
    if (!Array.isArray(callbacks)) {
      console.error('❌ CALLBACK DEBUG - Invalid callbacks array:', callbacks);
      return;
    }
    
    if (callbacks.length === 0) {
      console.warn('⚠️ CALLBACK DEBUG - No callbacks to process');
      return;
    }
    
    for (let i = 0; i < callbacks.length; i++) {
      const callback = callbacks[i];
      console.log(`🔄 CALLBACK DEBUG - Processing callback ${i + 1}/${callbacks.length}:`, {
        callbackIndex: i,
        type: callback?.type,
        target: callback?.target,
        hasPayload: !!callback?.payload,
        payloadSize: callback?.payload ? JSON.stringify(callback.payload).length : 0,
        payloadKeys: callback?.payload ? Object.keys(callback.payload) : [],
        fullCallback: callback
      });
      
      try {
        const startTime = Date.now();
        await this.executeClientCallback(callback);
        const duration = Date.now() - startTime;
        console.log(`✅ CALLBACK DEBUG - Callback ${i + 1} executed successfully in ${duration}ms`);
      } catch (error) {
        console.error(`❌ CALLBACK DEBUG - Callback ${i + 1} execution failed:`, {
          callback,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Don't throw - callback failures shouldn't break the main operation
      }
    }
    
    console.log(`🎯 CALLBACK DEBUG - processClientCallbacks COMPLETED - processed ${callbacks.length} callbacks`);
  }

  // Execute individual client callback
  private async executeClientCallback(callback: ClientCallback): Promise<void> {
    console.log('🔄 CALLBACK EXEC DEBUG - Starting callback execution:', {
      type: callback?.type,
      target: callback?.target,
      hasPayload: !!callback?.payload,
      windowAvailable: typeof window !== 'undefined',
      timestamp: new Date().toISOString()
    });

    if (!callback) {
      throw new Error('Callback is null or undefined');
    }

    if (!callback.type) {
      throw new Error('Callback type is missing');
    }

    switch (callback.type) {
      case 'ui_refresh':
        console.log(`🖼️ CALLBACK EXEC DEBUG - Processing ui_refresh:`, {
          target: callback.target,
          payloadKeys: callback.payload ? Object.keys(callback.payload) : 'none',
          payloadSize: callback.payload ? JSON.stringify(callback.payload).length : 0,
          windowExists: typeof window !== 'undefined',
          windowLocation: typeof window !== 'undefined' ? window.location.href : 'N/A'
        });
        
        // Trigger UI component refresh via window messaging
        if (typeof window !== 'undefined') {
          const message = {
            type: 'EDGE_FUNCTION_CALLBACK',
            callbackType: callback.type,
            target: callback.target,
            payload: callback.payload,
            debugInfo: {
              timestamp: new Date().toISOString(),
              source: 'claudeAPIProxy.executeClientCallback',
              originalCallbackType: callback.type
            }
          };
          
          console.log(`📤 CALLBACK EXEC DEBUG - About to post window message:`, {
            messageType: message.type,
            callbackType: message.callbackType,
            target: message.target,
            hasPayload: !!message.payload,
            messageSize: JSON.stringify(message).length
          });
          
          try {
            window.postMessage(message, '*');
            console.log(`✅ CALLBACK EXEC DEBUG - Window message posted successfully`);
            
            // Add a small delay to allow message processing
            await new Promise(resolve => setTimeout(resolve, 10));
            
            console.log(`🔍 CALLBACK EXEC DEBUG - Window message dispatch completed`);
          } catch (postError) {
            console.error(`❌ CALLBACK EXEC DEBUG - Failed to post window message:`, postError);
            throw postError;
          }
        } else {
          console.error(`❌ CALLBACK EXEC DEBUG - Window not available for ui_refresh callback`);
          throw new Error('Window object not available for ui_refresh callback');
        }
        break;

      case 'state_update':
        console.log(`🔄 CALLBACK EXEC DEBUG - Processing state_update:`, {
          target: callback.target,
          hasPayload: !!callback.payload
        });
        
        // Update local state via window messaging
        if (typeof window !== 'undefined') {
          const message = {
            type: 'EDGE_FUNCTION_CALLBACK',
            callbackType: callback.type,
            target: callback.target,
            payload: callback.payload,
            debugInfo: {
              timestamp: new Date().toISOString(),
              source: 'claudeAPIProxy.executeClientCallback.state_update'
            }
          };
          
          console.log(`📤 CALLBACK EXEC DEBUG - Posting state_update message:`, message);
          window.postMessage(message, '*');
          console.log(`✅ CALLBACK EXEC DEBUG - State_update message posted`);
        } else {
          console.error(`❌ CALLBACK EXEC DEBUG - Window not available for state_update`);
        }
        break;

      case 'notification':
        console.log(`🔔 CALLBACK EXEC DEBUG - Processing notification:`, {
          hasPayload: !!callback.payload
        });
        
        // Show user notification
        if (typeof window !== 'undefined') {
          const message = {
            type: 'EDGE_FUNCTION_CALLBACK',
            callbackType: callback.type,
            target: 'notification',
            payload: callback.payload,
            debugInfo: {
              timestamp: new Date().toISOString(),
              source: 'claudeAPIProxy.executeClientCallback.notification'
            }
          };
          
          console.log(`📤 CALLBACK EXEC DEBUG - Posting notification message:`, message);
          window.postMessage(message, '*');
          console.log(`✅ CALLBACK EXEC DEBUG - Notification message posted`);
        } else {
          console.error(`❌ CALLBACK EXEC DEBUG - Window not available for notification`);
        }
        break;

      default:
        console.error(`❌ CALLBACK EXEC DEBUG - Unknown callback type: ${callback.type}`, callback);
        throw new Error(`Unknown callback type: ${callback.type}`);
    }
  }

  // Claude API Methods

  // Generate Claude response with streaming callbacks enabled
  async generateMessage(params: ClaudeGenerateParams): Promise<any> {
    console.log('🔄 CLAUDE PROXY DEBUG: generateMessage called, using streaming internally for callbacks');
    
    // Use streaming internally but present as non-streaming interface
    let finalResult: any = null;
    const finalMetadata: any = null;
    
    try {
      const streamingResponse = await this.generateStreamingResponse(
        params,
        (chunk: string, isComplete: boolean, metadata?: any) => {
          console.log('🌊 STREAMING CHUNK DEBUG:', {
            chunkLength: chunk.length,
            isComplete,
            hasMetadata: !!metadata,
            metadataKeys: metadata ? Object.keys(metadata) : []
          });
          
          if (isComplete) {
            console.log('✅ STREAMING COMPLETE: Final metadata received');
            // finalMetadata = metadata; // Assigned but not used in current implementation
          }
        }
      );
      
      finalResult = streamingResponse;
      console.log('✅ CLAUDE PROXY DEBUG: Streaming completed, returning result');
      
    } catch (error) {
      console.error('❌ CLAUDE PROXY DEBUG: Streaming failed:', error);
      throw error;
    }
    
    // Return in same format as original generateMessage
    return finalResult;
  }

  // Test Claude API connection
  async testConnection(): Promise<any> {
    const response = await this.callEdgeFunction('test_connection', {});
    
    if (!response.success) {
      throw new Error(response.message || 'Claude API connection test failed');
    }

    return response.data;
  }

  // Database operation methods

  // Supabase SELECT operation
  async supabaseSelect(params: {
    table: string;
    columns?: string;
    filter?: {
      field: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in';
      value: any;
    };
    limit?: number;
    order?: {
      field: string;
      ascending?: boolean;
    };
  }): Promise<any> {
    const response = await this.callEdgeFunction('supabase_select', params);
    
    if (!response.success) {
      throw new Error(response.message || 'Supabase SELECT failed');
    }

    return response.data;
  }

  // Supabase INSERT operation
  async supabaseInsert(params: {
    table: string;
    data: any;
    returning?: string;
  }): Promise<any> {
    const response = await this.callEdgeFunction('supabase_insert', params);
    
    if (!response.success) {
      throw new Error(response.message || 'Supabase INSERT failed');
    }

    return response.data;
  }

  // Supabase UPDATE operation
  async supabaseUpdate(params: {
    table: string;
    data: any;
    filter: {
      field: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
      value: any;
    };
    returning?: string;
  }): Promise<any> {
    const response = await this.callEdgeFunction('supabase_update', params);
    
    if (!response.success) {
      throw new Error(response.message || 'Supabase UPDATE failed');
    }

    return response.data;
  }

  // Supabase DELETE operation
  async supabaseDelete(params: {
    table: string;
    filter: {
      field: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';
      value: any;
    };
  }): Promise<any> {
    const response = await this.callEdgeFunction('supabase_delete', params);
    
    if (!response.success) {
      throw new Error(response.message || 'Supabase DELETE failed');
    }

    return response.data;
  }

  // Generate streaming Claude response using Server-Sent Events
  async generateStreamingResponse(
    params: ClaudeGenerateParams,
    onChunk: (chunk: string, isComplete: boolean, metadata?: any) => void,
    abortSignal?: AbortSignal
  ): Promise<any> {
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🌊 Starting managed streaming request: ${streamId}`);
    
    // Track streaming request start
    const startTime = this.trackRequestStart();

    // Use stream manager with retry logic
    return streamManager.retryWithBackoff(async () => {
      const headers = await this.getHeaders();
      
      // Create managed stream controller
      const managedController = streamManager.createManagedStream(streamId);
      
      // Use provided abort signal or managed controller
      const effectiveSignal = abortSignal || managedController.signal;
      
      // DEBUG: Log the params being sent to edge function
      console.log('🔧 DEBUG PROXY: Params being sent to edge function:', {
        hasTools: !!params.tools,
        toolsLength: params.tools?.length || 0,
        toolNames: params.tools?.map((t: any) => t.name) || 'no tools',
        paramsKeys: Object.keys(params)
      });

      // Create the request body with streaming flag
      const requestBody = {
        functionName: 'generate_response',
        parameters: params,
        stream: true,
        sessionContext: params.sessionId ? {
          sessionId: params.sessionId,
          timestamp: new Date().toISOString()
        } : undefined,
      };

      try {
        // Add streaming headers for Server-Sent Events
        const streamingHeaders = {
          ...headers,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        
        console.log('🌊 STREAMING DEBUG: Making SSE request with headers:', streamingHeaders);

        // Use fetch for SSE connection
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: streamingHeaders,
          body: JSON.stringify(requestBody),
          signal: effectiveSignal,
        });

        if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if we got a non-streaming fallback response (regular JSON)
      const contentType = response.headers.get('content-type');
      console.log('🔍 RESPONSE DEBUG:', {
        status: response.status,
        contentType,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (contentType && contentType.includes('application/json')) {
        console.log('🚀 NON-STREAMING FALLBACK detected - handling as regular JSON response');
        
        const jsonResponse = await response.json();
        console.log('🚀 NON-STREAMING FALLBACK data:', jsonResponse);
        
        if (jsonResponse.success && jsonResponse.data) {
          // Handle as complete response
          onChunk(jsonResponse.data, true, jsonResponse.metadata || {});
          
          return {
            success: true,
            content: jsonResponse.data,
            metadata: jsonResponse.metadata || {},
          };
        } else {
          throw new Error('Invalid non-streaming fallback response format');
        }
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }      // Process Server-Sent Events stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let fullContent = '';
      const finalMetadata: any = {};

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🏁 Streaming completed');
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const rawData = line.slice(6);

                
                const eventData = JSON.parse(rawData);
                console.log('📥 Client received event:', eventData.type, eventData);
                
                switch (eventData.type) {
                  case 'start':
                    console.log('🚀 Stream started:', eventData);
                    finalMetadata.model = eventData.model;
                    finalMetadata.usage = eventData.usage;
                    break;

                  case 'content_delta': {
                    fullContent = eventData.full_content || fullContent;
                    
                    // Add token to batch for optimized UI updates
                    const token = eventData.delta || '';
                    const tokenMetadata = {
                      tokenCount: eventData.token_count,
                      fullContent,
                    };
                    
                    // Use token batching to reduce UI update frequency
                    streamManager.addTokenToBatch(streamId, token, tokenMetadata);
                    
                    // Check if batch is ready to flush
                    const batchedTokens = streamManager.getBatchedTokens(streamId);
                    if (batchedTokens) {
                      // Combine batched tokens and use the latest metadata
                      const combinedToken = batchedTokens.tokens.join('');
                      const latestMetadata = batchedTokens.metadata[batchedTokens.metadata.length - 1];
                      onChunk(combinedToken, false, latestMetadata);
                    }
                    break;
                  }

                  case 'tool_use':
                    console.log('🔧 Tool use:', eventData.tool_use);
                    finalMetadata.tool_use = eventData.tool_use;
                    break;

                  case 'usage_update':
                    finalMetadata.usage = { ...finalMetadata.usage, ...eventData.usage };
                    break;

                  case 'complete': {
                    console.log('✅ Stream complete');
                    console.log('🔍 CLIENT DEBUG - Complete event data:', {
                      full_content_length: eventData.full_content?.length || 0,
                      full_content_preview: eventData.full_content?.substring(0, 100) || '',
                      full_content_end: eventData.full_content?.substring((eventData.full_content?.length || 0) - 100) || '',
                      token_count: eventData.token_count,
                      tool_results_count: eventData.tool_results?.length || 0
                    });
                    
                    finalMetadata.full_content = eventData.full_content;
                    finalMetadata.token_count = eventData.token_count;
                    finalMetadata.tool_results = eventData.tool_results;
                    
                    // Flush any remaining batched tokens before completion
                    const remainingBatch = streamManager.getBatchedTokens(streamId, true);
                    if (remainingBatch && remainingBatch.tokens.length > 0) {
                      const combinedToken = remainingBatch.tokens.join('');
                      const latestMetadata = remainingBatch.metadata[remainingBatch.metadata.length - 1];
                      onChunk(combinedToken, false, latestMetadata);
                    }
                    
                    // Clean up batches for this stream
                    streamManager.cleanupBatches(streamId);
                    
                    // Track successful completion
                    const responseSize = eventData.full_content ? new Blob([eventData.full_content]).size : 0;
                    this.trackRequestEnd(startTime, true, responseSize);
                    
                    // Send final chunk
                    onChunk('', true, finalMetadata);
                    
                    return {
                      success: true,
                      content: eventData.full_content,
                      metadata: finalMetadata,
                    };
                  }

                  case 'client_callbacks':
                    console.log('🔄 STREAMING CALLBACK DEBUG - Processing client callbacks from streaming:', {
                      hasCallbacks: !!eventData.callbacks,
                      callbacksIsArray: Array.isArray(eventData.callbacks),
                      callbackCount: eventData.callbacks?.length || 0,
                      streamingEventData: eventData,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Process callbacks immediately when received from streaming
                    if (eventData.callbacks && Array.isArray(eventData.callbacks)) {
                      console.log(`📞 STREAMING CALLBACK DEBUG - Processing ${eventData.callbacks.length} callbacks from streaming`);
                      try {
                        await this.processClientCallbacks(eventData.callbacks);
                        console.log(`✅ STREAMING CALLBACK DEBUG - Successfully processed callbacks from streaming`);
                      } catch (callbackError) {
                        console.error(`❌ STREAMING CALLBACK DEBUG - Failed to process callbacks from streaming:`, callbackError);
                      }
                    } else {
                      console.warn(`⚠️ STREAMING CALLBACK DEBUG - Invalid callbacks data from streaming:`, eventData.callbacks);
                    }
                    break;

                  case 'tool_result':
                    console.log('🔧 Tool result from streaming:', eventData);
                    // Tool results are already processed server-side, just log for debugging
                    break;

                  case 'tool_error':
                    console.error('❌ Tool execution error from streaming:', eventData.error);
                    // Tool errors from server-side execution
                    break;

                  case 'fresh_response':
                    console.log('🔄 Fresh response received from tool execution:', {
                      content_length: eventData.content?.length || 0,
                      content_preview: eventData.content?.substring(0, 100) || '',
                      token_count: eventData.token_count,
                      tool_results_count: eventData.tool_results?.length || 0
                    });
                    
                    // CRITICAL: Completely replace content with fresh response
                    fullContent = eventData.content || '';
                    finalMetadata.token_count = eventData.token_count;
                    finalMetadata.tool_results = eventData.tool_results;
                    
                    console.log('🔄 CLIENT DEBUG - Fresh response will be handled by completion event');
                    break;

                  case 'error': {
                    console.error('❌ Stream error:', eventData.error);
                    // Handle both string and object error formats
                    const errorMessage = typeof eventData.error === 'string' 
                      ? eventData.error 
                      : eventData.error?.message || JSON.stringify(eventData.error);
                    throw new Error(errorMessage);
                  }

                  default:
                    console.log('📝 Unknown event type:', eventData.type);
                }
              } catch (parseError) {
                console.warn('⚠️ Failed to parse SSE data:', line, parseError);
              }
            }
          }

          // Check for abort signal
          if (abortSignal?.aborted) {
            throw new Error('Request aborted');
          }
        }

      } finally {
        reader.releaseLock();
      }

      // Return final result
      return {
        success: true,
        content: fullContent,
        metadata: finalMetadata,
      };

      } catch (error) {
        console.error(`❌ Streaming error for ${streamId}:`, error);
        
        // Track failed request
        this.trackRequestEnd(startTime, false, 0);
        
        // Clean up batches on error
        streamManager.cleanupBatches(streamId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`🛑 Stream ${streamId} aborted`);
          onChunk('', true, { aborted: true, streamId });
          throw new Error('Request aborted');
        }
        
        throw error;
      } finally {
        // Clean up managed stream
        streamManager.abortStream(streamId);
      }
    }, `streaming request ${streamId}`);
  }

  // Execute any function through edge function
  async executeFunction(functionName: string, parameters: any): Promise<any> {
    const response = await this.callEdgeFunction(functionName, parameters);
    
    if (!response.success) {
      throw new Error(response.message || `Function ${functionName} failed`);
    }

    return response.data;
  }

  // Performance tracking methods
  private responseTimes: number[] = [];
  private requestTimestamps: number[] = [];
  private bytesCounts: number[] = [];
  private readonly maxHistorySize = 1000; // Keep last 1000 records for calculations

  private trackRequestStart(): number {
    const startTime = Date.now();
    this.requestTimestamps.push(startTime);
    
    // Keep only recent timestamps for rate calculation
    if (this.requestTimestamps.length > this.maxHistorySize) {
      this.requestTimestamps = this.requestTimestamps.slice(-this.maxHistorySize);
    }
    
    return startTime;
  }

  private trackRequestEnd(startTime: number, success: boolean, bytes = 0): void {
    const responseTime = Date.now() - startTime;
    
    // Track response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxHistorySize) {
      this.responseTimes = this.responseTimes.slice(-this.maxHistorySize);
    }
    
    // Track bytes
    if (bytes > 0) {
      this.bytesCounts.push(bytes);
      if (this.bytesCounts.length > this.maxHistorySize) {
        this.bytesCounts = this.bytesCounts.slice(-this.maxHistorySize);
      }
    }
  }

  // Get performance metrics for the ClaudeAPIProxyService
  getPerformanceMetrics() {
    const now = Date.now();
    const totalRequests = this.requestTimestamps.length;
    const successfulRequests = totalRequests; // Assume successful for now, can be enhanced
    
    // Calculate response time metrics
    let avgResponseTime = 0;
    let minResponseTime = 0;
    let maxResponseTime = 0;
    let p95ResponseTime = 0;
    
    if (this.responseTimes.length > 0) {
      const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
      avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
      minResponseTime = Math.min(...this.responseTimes);
      maxResponseTime = Math.max(...this.responseTimes);
      
      // Calculate P95 response time
      const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
      p95ResponseTime = sortedTimes[p95Index] || 0;
    }
    
    // Calculate requests per minute
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;
    
    // Calculate throughput in bytes per second
    let throughputBytesPerSecond = 0;
    if (this.bytesCounts.length > 0 && this.requestTimestamps.length > 0) {
      const totalBytes = this.bytesCounts.reduce((a, b) => a + b, 0);
      const timeSpan = Math.max(1, (now - this.requestTimestamps[0]) / 1000); // seconds
      throughputBytesPerSecond = totalBytes / timeSpan;
    }
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests: 0, // Can be enhanced
      averageResponseTime: avgResponseTime,
      minResponseTime: minResponseTime === Infinity ? 0 : minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      requestsPerMinute,
      throughputBytesPerSecond,
      errorRate: 0, // Can be enhanced
    };
  }
}

// Connection pool interface for advanced pooling
interface ConnectionPool {
  id: string;
  controller: AbortController;
  createdAt: number;
  lastUsed: number;
  requestCount: number;
  isHealthy: boolean;
}

// Performance metrics interface
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  activeConnections: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  connectionPoolUtilization: number;
  errorRate: number;
  lastGarbageCollection: number;
  requestsPerMinute: number;
  throughputBytesPerSecond: number;
  p95ResponseTime: number;
  streamingMetrics: {
    activeStreams: number;
    totalChunksProcessed: number;
    averageChunkSize: number;
    streamingThroughput: number;
  };
}

interface TokenBatchConfig {
  maxBatchSize: number;        // Maximum tokens to batch before forcing flush
  flushIntervalMs: number;     // Time interval to flush batches
  minFlushSize: number;        // Minimum tokens to accumulate before flushing
  adaptiveThreshold: number;   // Adaptive batching based on stream velocity
  priorityKeywords: string[];  // Keywords that trigger immediate flush
}

interface TokenBatch {
  streamId: string;
  tokens: string[];
  metadata: any[];
  firstTokenTime: number;
  lastTokenTime: number;
  totalLength: number;
  memoryBuffer?: MemoryBuffer;  // Optional memory buffer for efficient storage
}

interface TokenBatchConfig {
  maxBatchSize: number;        // Maximum tokens to batch before forcing flush
  flushIntervalMs: number;     // Time interval to flush batches
  minFlushSize: number;        // Minimum tokens to accumulate before flushing
  adaptiveThreshold: number;   // Adaptive batching based on stream velocity
  priorityKeywords: string[];  // Keywords that trigger immediate flush
}

// Stream management class for connection lifecycle with advanced pooling
class StreamManager {
  private connectionPool = new Map<string, ConnectionPool>();
  private performanceMetrics: PerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    activeConnections: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    connectionPoolUtilization: 0,
    errorRate: 0,
    lastGarbageCollection: Date.now(),
    requestsPerMinute: 0,
    throughputBytesPerSecond: 0,
    p95ResponseTime: 0,
    streamingMetrics: {
      activeStreams: 0,
      totalChunksProcessed: 0,
      averageChunkSize: 0,
      streamingThroughput: 0,
    },
  };
  
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  };

  // Performance tracking
  private responseTimes: number[] = [];
  private requestTimestamps: number[] = [];
  private bytesCounts: number[] = [];
  private chunkProcessingTimes: number[] = [];
  private readonly maxHistorySize = 1000; // Keep last 1000 records for calculations
  
  private poolConfig = {
    maxPoolSize: 15,
    connectionTimeout: 300000, // 5 minutes
    healthCheckInterval: 60000, // 1 minute
    gcInterval: 120000, // 2 minutes
    maxConnectionAge: 600000, // 10 minutes
    reuseThreshold: 0.8, // Reuse connections when pool is 80% full
  };
  
  // Token batching configuration
  private batchConfig: TokenBatchConfig = {
    maxBatchSize: 50,           // Batch up to 50 tokens
    flushIntervalMs: 100,       // Flush every 100ms
    minFlushSize: 5,            // Minimum 5 tokens before flushing
    adaptiveThreshold: 200,     // Adaptive threshold for high-velocity streams
    priorityKeywords: ['ERROR', 'URGENT', 'COMPLETE', 'FAILED', 'SUCCESS'],
  };
  
  // Active token batches
  private tokenBatches = new Map<string, TokenBatch>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  
  // Memory Management Infrastructure
  private memoryPoolConfig: MemoryPoolConfig = {
    maxBufferSize: 1024 * 1024,      // 1MB per buffer
    maxPoolSize: 50,                 // 50 buffers max
    bufferGrowthFactor: 1.5,         // 50% growth factor
    minBufferSize: 4 * 1024,         // 4KB minimum
    gcThreshold: 0.8,                // 80% memory pressure
    maxIdleTime: 5 * 60 * 1000,      // 5 minutes idle timeout
    enableCompression: true,         // Enable GZip compression
  };

  private memoryPool = new Map<string, MemoryBuffer>();
  private memoryMetrics: MemoryMetrics = {
    totalAllocated: 0,
    totalUsed: 0,
    bufferCount: 0,
    poolUtilization: 0,
    gcCount: 0,
    lastMemoryPressure: 0,
    averageBufferSize: 0,
    memoryLeakRisk: 0,
  };

  private healthCheckTimer?: NodeJS.Timeout;
  private gcTimer?: NodeJS.Timeout;
  private memoryGCTimer?: NodeJS.Timeout;
  private memoryPressureTimer?: NodeJS.Timeout;

  constructor() {
    this.startHealthMonitoring();
    this.startGarbageCollection();
    this.startMemoryManagement();
  }

  // Create a managed stream with advanced connection pooling
  createManagedStream(streamId: string): AbortController {
    this.performanceMetrics.totalRequests++;
    
    // Try to reuse existing healthy connection if pool utilization is high
    if (this.shouldReuseConnection()) {
      const reusableConnection = this.findReusableConnection();
      if (reusableConnection) {
        console.log(`♻️ Reusing connection for stream: ${streamId}`);
        reusableConnection.lastUsed = Date.now();
        reusableConnection.requestCount++;
        return reusableConnection.controller;
      }
    }
    
    // Check pool capacity
    if (this.connectionPool.size >= this.poolConfig.maxPoolSize) {
      console.warn(`⚠️ Connection pool at capacity (${this.poolConfig.maxPoolSize}), cleaning up oldest connections`);
      this.cleanupOldestConnections(1);
    }
    
    // Abort any existing stream with the same ID
    this.abortStream(streamId);
    
    // Create new connection pool entry
    const controller = new AbortController();
    const now = Date.now();
    const poolEntry: ConnectionPool = {
      id: streamId,
      controller,
      createdAt: now,
      lastUsed: now,
      requestCount: 1,
      isHealthy: true,
    };
    
    this.connectionPool.set(streamId, poolEntry);
    this.updatePerformanceMetrics();
    
    console.log(`🔗 Created new pooled connection: ${streamId} (pool size: ${this.connectionPool.size})`);
    
    // Auto-cleanup after timeout
    setTimeout(() => {
      this.abortStream(streamId);
    }, this.poolConfig.connectionTimeout);
    
    return controller;
  }

  // Abort a specific stream and remove from connection pool
  abortStream(streamId: string): boolean {
    const poolEntry = this.connectionPool.get(streamId);
    if (poolEntry) {
      console.log(`🛑 Aborting pooled connection: ${streamId}`);
      poolEntry.controller.abort();
      poolEntry.isHealthy = false;
      this.connectionPool.delete(streamId);
      this.updatePerformanceMetrics();
      return true;
    }
    return false;
  }

  // Abort all active streams in connection pool
  abortAllStreams(): void {
    console.log(`🛑 Aborting ${this.connectionPool.size} pooled connections`);
    for (const [streamId, poolEntry] of this.connectionPool) {
      poolEntry.controller.abort();
      poolEntry.isHealthy = false;
    }
    this.connectionPool.clear();
    this.updatePerformanceMetrics();
  }

  // Get active connection count from pool
  getActiveStreamCount(): number {
    return this.connectionPool.size;
  }

  // Get advanced streaming health metrics with connection pool insights
  getStreamingHealthMetrics() {
    const healthyConnections = Array.from(this.connectionPool.values()).filter(c => c.isHealthy).length;
    const memoryMetrics = this.getMemoryMetrics();
    
    return {
      activeStreams: this.connectionPool.size,
      healthyConnections,
      maxConcurrentStreams: this.poolConfig.maxPoolSize,
      streamIds: Array.from(this.connectionPool.keys()),
      healthStatus: this.connectionPool.size < this.poolConfig.maxPoolSize * 0.8 ? 'healthy' : 'overloaded',
      lastCleanup: new Date(this.performanceMetrics.lastGarbageCollection).toISOString(),
      performanceMetrics: { ...this.performanceMetrics },
      poolUtilization: (this.connectionPool.size / this.poolConfig.maxPoolSize * 100).toFixed(1) + '%',
      connectionAgeDistribution: this.getConnectionAgeDistribution(),
      memoryHealth: {
        totalAllocated: `${(memoryMetrics.totalAllocated / 1024 / 1024).toFixed(2)} MB`,
        totalUsed: `${(memoryMetrics.totalUsed / 1024 / 1024).toFixed(2)} MB`,
        bufferCount: memoryMetrics.bufferCount,
        poolUtilization: `${memoryMetrics.poolUtilization.toFixed(1)}%`,
        memoryPressure: `${memoryMetrics.lastMemoryPressure.toFixed(1)}%`,
        memoryLeakRisk: memoryMetrics.memoryLeakRisk > 0.5 ? 'HIGH' : memoryMetrics.memoryLeakRisk > 0.2 ? 'MEDIUM' : 'LOW',
        gcCount: memoryMetrics.gcCount,
        averageBufferSize: `${(memoryMetrics.averageBufferSize / 1024).toFixed(1)} KB`,
      },
    };
  }

  // Helper methods for advanced connection pooling
  private shouldReuseConnection(): boolean {
    const utilization = this.connectionPool.size / this.poolConfig.maxPoolSize;
    return utilization >= this.poolConfig.reuseThreshold;
  }

  private findReusableConnection(): ConnectionPool | null {
    const healthyConnections = Array.from(this.connectionPool.values())
      .filter(c => c.isHealthy && c.requestCount < 10) // Don't overuse connections
      .sort((a, b) => a.lastUsed - b.lastUsed); // Use least recently used
    
    return healthyConnections[0] || null;
  }

  private cleanupOldestConnections(count: number): void {
    const connections = Array.from(this.connectionPool.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      .slice(0, count);
    
    for (const [streamId, poolEntry] of connections) {
      console.log(`🧹 Cleaning up old connection: ${streamId}`);
      poolEntry.controller.abort();
      this.connectionPool.delete(streamId);
    }
  }

  private trackRequestStart(): number {
    const startTime = Date.now();
    this.requestTimestamps.push(startTime);
    this.performanceMetrics.totalRequests++;
    
    // Keep only recent timestamps for rate calculation
    if (this.requestTimestamps.length > this.maxHistorySize) {
      this.requestTimestamps = this.requestTimestamps.slice(-this.maxHistorySize);
    }
    
    return startTime;
  }

  private trackRequestEnd(startTime: number, success: boolean, bytes = 0): void {
    const responseTime = Date.now() - startTime;
    
    // Track response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxHistorySize) {
      this.responseTimes = this.responseTimes.slice(-this.maxHistorySize);
    }
    
    // Track bytes
    if (bytes > 0) {
      this.bytesCounts.push(bytes);
      if (this.bytesCounts.length > this.maxHistorySize) {
        this.bytesCounts = this.bytesCounts.slice(-this.maxHistorySize);
      }
    }
    
    // Update success/failure counts
    if (success) {
      this.performanceMetrics.successfulRequests++;
    } else {
      this.performanceMetrics.failedRequests++;
    }
    
    this.updatePerformanceMetrics();
  }

  private trackChunkProcessing(chunkSize: number, processingTime: number): void {
    this.performanceMetrics.streamingMetrics.totalChunksProcessed++;
    this.chunkProcessingTimes.push(processingTime);
    
    if (this.chunkProcessingTimes.length > this.maxHistorySize) {
      this.chunkProcessingTimes = this.chunkProcessingTimes.slice(-this.maxHistorySize);
    }
    
    // Update streaming metrics
    this.updateStreamingMetrics(chunkSize);
  }

  private updateStreamingMetrics(chunkSize: number): void {
    const activeStreams = this.connectionPool.size;
    this.performanceMetrics.streamingMetrics.activeStreams = activeStreams;
    
    // Calculate average chunk size
    if (this.chunkProcessingTimes.length > 0) {
      const totalChunks = this.performanceMetrics.streamingMetrics.totalChunksProcessed;
      this.performanceMetrics.streamingMetrics.averageChunkSize = 
        totalChunks > 0 ? (this.bytesCounts.reduce((a, b) => a + b, 0) / totalChunks) : 0;
      
      // Calculate streaming throughput (chunks per second)
      const recentChunks = Math.min(100, this.chunkProcessingTimes.length);
      const recentTimes = this.chunkProcessingTimes.slice(-recentChunks);
      const avgProcessingTime = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
      this.performanceMetrics.streamingMetrics.streamingThroughput = 
        avgProcessingTime > 0 ? 1000 / avgProcessingTime : 0; // chunks per second
    }
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.activeConnections = this.connectionPool.size;
    this.performanceMetrics.connectionPoolUtilization = 
      (this.connectionPool.size / this.poolConfig.maxPoolSize) * 100;
    
    // Calculate response time metrics
    if (this.responseTimes.length > 0) {
      const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
      this.performanceMetrics.averageResponseTime = 
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
      this.performanceMetrics.minResponseTime = Math.min(...this.responseTimes);
      this.performanceMetrics.maxResponseTime = Math.max(...this.responseTimes);
      
      // Calculate P95 response time
      const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
      this.performanceMetrics.p95ResponseTime = sortedTimes[p95Index] || 0;
    }
    
    // Calculate error rate
    const totalRequests = this.performanceMetrics.totalRequests;
    this.performanceMetrics.errorRate = totalRequests > 0 
      ? (this.performanceMetrics.failedRequests / totalRequests) * 100 
      : 0;
    
    // Calculate requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    this.performanceMetrics.requestsPerMinute = recentRequests.length;
    
    // Calculate throughput in bytes per second
    if (this.bytesCounts.length > 0 && this.requestTimestamps.length > 0) {
      const totalBytes = this.bytesCounts.reduce((a, b) => a + b, 0);
      const timeSpan = Math.max(1, (now - this.requestTimestamps[0]) / 1000); // seconds
      this.performanceMetrics.throughputBytesPerSecond = totalBytes / timeSpan;
    }
  }

  private getConnectionAgeDistribution(): { [key: string]: number } {
    const now = Date.now();
    const distribution = { 
      'under1min': 0, 
      '1-5min': 0, 
      '5-10min': 0, 
      'over10min': 0 
    };
    
    for (const connection of this.connectionPool.values()) {
      const ageMs = now - connection.createdAt;
      const ageMin = ageMs / 60000;
      
      if (ageMin < 1) distribution['under1min']++;
      else if (ageMin < 5) distribution['1-5min']++;
      else if (ageMin < 10) distribution['5-10min']++;
      else distribution['over10min']++;
    }
    
    return distribution;
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.poolConfig.healthCheckInterval);
  }

  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.performGarbageCollection();
    }, this.poolConfig.gcInterval);
  }

  private performHealthCheck(): void {
    const now = Date.now();
    let unhealthyCount = 0;
    
    for (const [streamId, poolEntry] of this.connectionPool) {
      // Mark old connections as unhealthy
      if (now - poolEntry.createdAt > this.poolConfig.maxConnectionAge) {
        poolEntry.isHealthy = false;
        unhealthyCount++;
      }
    }
    
    if (unhealthyCount > 0) {
      console.log(`🔍 Health check found ${unhealthyCount} unhealthy connections`);
    }
  }

  private performGarbageCollection(): void {
    const now = Date.now();
    const before = this.connectionPool.size;
    
    for (const [streamId, poolEntry] of this.connectionPool) {
      // Remove unhealthy or very old connections
      if (!poolEntry.isHealthy || 
          now - poolEntry.lastUsed > this.poolConfig.maxConnectionAge) {
        poolEntry.controller.abort();
        this.connectionPool.delete(streamId);
      }
    }
    
    const cleaned = before - this.connectionPool.size;
    if (cleaned > 0) {
      console.log(`🗑️ Garbage collection cleaned ${cleaned} connections (${this.connectionPool.size} remaining)`);
    }
    
    this.performanceMetrics.lastGarbageCollection = now;
    this.updatePerformanceMetrics();
  }

  // Start advanced memory management
  private startMemoryManagement(): void {
    // DISABLED: Memory management causes memory pressure alerts and excessive monitoring
    // // Memory garbage collection every 30 seconds
    // this.memoryGCTimer = setInterval(() => {
    //   this.performMemoryGarbageCollection();
    // }, 30000);

    // // Memory pressure monitoring every 10 seconds
    // this.memoryPressureTimer = setInterval(() => {
    //   this.monitorMemoryPressure();
    // }, 10000);

    // console.log('🧠 Started advanced memory management');
  }

  // Allocate memory buffer from pool or create new one
  allocateBuffer(requestedSize: number): MemoryBuffer {
    const size = Math.max(requestedSize, this.memoryPoolConfig.minBufferSize);
    
    // Try to find a suitable existing buffer
    for (const [id, buffer] of this.memoryPool) {
      if (!buffer.isInUse && buffer.size >= size && buffer.size <= size * this.memoryPoolConfig.bufferGrowthFactor) {
        buffer.isInUse = true;
        buffer.lastUsed = Date.now();
        buffer.useCount++;
        this.updateMemoryMetrics();
        console.log(`🔄 Reused memory buffer ${id} (${buffer.size} bytes)`);
        return buffer;
      }
    }

    // Create new buffer if pool isn't full
    if (this.memoryPool.size < this.memoryPoolConfig.maxPoolSize) {
      const bufferId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const buffer: MemoryBuffer = {
        id: bufferId,
        size: Math.min(size, this.memoryPoolConfig.maxBufferSize),
        data: new ArrayBuffer(Math.min(size, this.memoryPoolConfig.maxBufferSize)),
        isInUse: true,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        useCount: 1,
      };

      this.memoryPool.set(bufferId, buffer);
      this.memoryMetrics.totalAllocated += buffer.size;
      this.updateMemoryMetrics();
      console.log(`🆕 Created new memory buffer ${bufferId} (${buffer.size} bytes)`);
      return buffer;
    }

    // Force garbage collection and try again
    this.performMemoryGarbageCollection();
    
    // Fallback: create temporary buffer (not pooled)
    const tempBuffer: MemoryBuffer = {
      id: `temp_${Date.now()}`,
      size: Math.min(size, this.memoryPoolConfig.maxBufferSize),
      data: new ArrayBuffer(Math.min(size, this.memoryPoolConfig.maxBufferSize)),
      isInUse: true,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
    };

    console.warn(`⚠️ Created temporary buffer ${tempBuffer.id} - pool full!`);
    return tempBuffer;
  }

  // Release memory buffer back to pool
  releaseBuffer(bufferId: string): boolean {
    const buffer = this.memoryPool.get(bufferId);
    if (buffer && buffer.isInUse) {
      buffer.isInUse = false;
      buffer.lastUsed = Date.now();
      this.updateMemoryMetrics();
      console.log(`✅ Released memory buffer ${bufferId}`);
      return true;
    }
    return false;
  }

  // Compress data using built-in compression if enabled
  private compressData(data: string): ArrayBuffer {
    if (!this.memoryPoolConfig.enableCompression) {
      return new TextEncoder().encode(data).buffer;
    }

    // Simple compression simulation (in real app would use gzip)
    const encoded = new TextEncoder().encode(data);
    const compressed = new Uint8Array(encoded.length);
    compressed.set(encoded);
    
    return compressed.buffer;
  }

  // Decompress data
  private decompressData(buffer: ArrayBuffer): string {
    if (!this.memoryPoolConfig.enableCompression) {
      return new TextDecoder().decode(buffer);
    }

    // Simple decompression simulation
    return new TextDecoder().decode(new Uint8Array(buffer));
  }

  // Memory garbage collection
  private performMemoryGarbageCollection(): void {
    const now = Date.now();
    const beforeCount = this.memoryPool.size;
    let releasedBytes = 0;

    // Remove idle and unused buffers
    for (const [id, buffer] of this.memoryPool) {
      const isIdle = now - buffer.lastUsed > this.memoryPoolConfig.maxIdleTime;
      const isUnused = !buffer.isInUse;
      
      if (isUnused && (isIdle || this.memoryMetrics.poolUtilization > this.memoryPoolConfig.gcThreshold)) {
        releasedBytes += buffer.size;
        this.memoryPool.delete(id);
      }
    }

    if (releasedBytes > 0) {
      this.memoryMetrics.gcCount++;
      this.memoryMetrics.totalAllocated -= releasedBytes;
      this.updateMemoryMetrics();
      console.log(`🗑️ Memory GC: Released ${releasedBytes} bytes from ${beforeCount - this.memoryPool.size} buffers`);
    }
  }

  // DISABLED: Memory pressure monitoring causes false alerts and memory issues
  // // Monitor memory pressure and trigger cleanup if needed
  // private monitorMemoryPressure(): void {
  //   const memoryPressure = this.memoryMetrics.poolUtilization;
  //   this.memoryMetrics.lastMemoryPressure = memoryPressure;

  //   if (memoryPressure > this.memoryPoolConfig.gcThreshold) {
  //     console.warn(`🔥 High memory pressure detected: ${memoryPressure.toFixed(1)}%`);
  //     this.performMemoryGarbageCollection();
      
  //     // Update memory leak risk assessment
  //     this.memoryMetrics.memoryLeakRisk = Math.min(1.0, memoryPressure / 100);
  //   }

  //   // Force cleanup if critically high
  //   if (memoryPressure > 0.95) {
  //     console.error(`🚨 Critical memory pressure: ${memoryPressure.toFixed(1)}% - forcing aggressive cleanup`);
  //     this.performAggressiveMemoryCleanup();
  //   }
  // }
  private monitorMemoryPressure(): void {
    // DISABLED: Memory monitoring disabled to prevent false alerts
  }

  // Aggressive memory cleanup for critical situations
  private performAggressiveMemoryCleanup(): void {
    let releasedBytes = 0;
    const before = this.memoryPool.size;

    // Release all non-active buffers immediately
    for (const [id, buffer] of this.memoryPool) {
      if (!buffer.isInUse) {
        releasedBytes += buffer.size;
        this.memoryPool.delete(id);
      }
    }

    // Clean up old batches
    this.cleanupBatches();

    this.memoryMetrics.totalAllocated -= releasedBytes;
    this.updateMemoryMetrics();

    // DISABLED: Aggressive cleanup logging causes memory pressure alerts
    // console.log(`🚨 Aggressive cleanup: Released ${releasedBytes} bytes from ${before - this.memoryPool.size} buffers`);
  }

  // Update memory metrics
  // DISABLED: Memory metrics updates cause overhead and memory pressure alerts
  private updateMemoryMetrics(): void {
    // Calculate current metrics based on memory pool state
    let totalUsed = 0;
    let inUseBuffers = 0;
    let totalBufferSize = 0;
    
    for (const buffer of this.memoryPool.values()) {
      totalBufferSize += buffer.size;
      if (buffer.isInUse) {
        totalUsed += buffer.size;
        inUseBuffers++;
      }
    }
    
    this.memoryMetrics.bufferCount = this.memoryPool.size;
    this.memoryMetrics.totalUsed = totalUsed;
    this.memoryMetrics.poolUtilization = this.memoryPool.size / this.memoryPoolConfig.maxPoolSize;
    this.memoryMetrics.averageBufferSize = this.memoryPool.size > 0 ? totalBufferSize / this.memoryPool.size : 0;
    
    // Calculate memory leak risk based on buffer age and usage patterns
    const now = Date.now();
    let unusedOldBuffers = 0;
    for (const buffer of this.memoryPool.values()) {
      if (!buffer.isInUse && (now - buffer.lastUsed) > this.memoryPoolConfig.maxIdleTime) {
        unusedOldBuffers++;
      }
    }
    this.memoryMetrics.memoryLeakRisk = this.memoryPool.size > 0 ? unusedOldBuffers / this.memoryPool.size : 0;
  }

  // Get comprehensive memory metrics
  getMemoryMetrics(): MemoryMetrics & { 
    bufferDetails: { id: string, size: number, isInUse: boolean, age: number }[],
    recommendations: string[]
  } {
    const now = Date.now();
    const bufferDetails = Array.from(this.memoryPool.values()).map(buffer => ({
      id: buffer.id,
      size: buffer.size,
      isInUse: buffer.isInUse,
      age: now - buffer.createdAt,
    }));

    const recommendations: string[] = [];
    
    // Pool utilization is a decimal (0.0 to 1.0), so check for 0.8 (80%)
    if (this.memoryMetrics.poolUtilization > 0.8) {
      recommendations.push('Consider increasing maxPoolSize or reducing buffer sizes');
    }
    
    if (this.memoryMetrics.memoryLeakRisk > 0.5) {
      recommendations.push('Potential memory leak detected - review buffer release patterns');
    }

    if (this.memoryMetrics.averageBufferSize > this.memoryPoolConfig.maxBufferSize * 0.8) {
      recommendations.push('Buffers are larger than optimal - consider size optimization');
    }

    return {
      ...this.memoryMetrics,
      bufferDetails,
      recommendations,
    };
  }

  // Stop monitoring timers (for cleanup)
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    if (this.memoryGCTimer) {
      clearInterval(this.memoryGCTimer);
    }
    if (this.memoryPressureTimer) {
      clearInterval(this.memoryPressureTimer);
    }
    this.abortAllStreams();
    // DISABLED: performAggressiveMemoryCleanup() to prevent memory pressure alerts
    // this.performAggressiveMemoryCleanup();
  }

  // Retry logic with exponential backoff
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryConfig.maxRetries - 1) {
          break; // Don't delay on the last attempt
        }
        
        // Check if this is a retryable error
        if (error instanceof Error && error.name === 'AbortError') {
          throw error; // Don't retry aborted requests
        }
        
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        
        console.log(`⚠️ ${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}), retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Memory-efficient token batching methods
  addTokenToBatch(streamId: string, token: string, metadata: any = {}): void {
    const now = Date.now();
    
    // Get or create batch with memory management
    let batch = this.tokenBatches.get(streamId);
    if (!batch) {
      // Allocate memory buffer for this batch
      const estimatedSize = this.batchConfig.maxBatchSize * 100; // Estimate ~100 chars per token
      const buffer = this.allocateBuffer(estimatedSize);
      
      batch = {
        streamId,
        tokens: [],
        metadata: [],
        firstTokenTime: now,
        lastTokenTime: now,
        totalLength: 0,
        memoryBuffer: buffer, // Add memory buffer reference
      };
      this.tokenBatches.set(streamId, batch);
    }

    // DISABLED: Memory pressure check causes false alerts and memory overhead
    // if (this.memoryMetrics.poolUtilization > 90) {
    //   console.warn(`🔥 High memory pressure (${this.memoryMetrics.poolUtilization.toFixed(1)}%) - forcing batch flush`);
    //   this.flushBatch(streamId, true);
    //   return;
    // }

    // Add token to batch with memory-efficient storage
    batch.tokens.push(token);
    batch.metadata.push(metadata);
    batch.lastTokenTime = now;
    batch.totalLength += token.length;

    // Check for priority keywords that trigger immediate flush
    const containsPriorityKeyword = this.batchConfig.priorityKeywords.some(keyword => 
      token.toUpperCase().includes(keyword)
    );

    // Determine if we should flush immediately
    const shouldFlushNow = containsPriorityKeyword ||
      batch.tokens.length >= this.batchConfig.maxBatchSize ||
      batch.totalLength > (batch.memoryBuffer?.size || Infinity) * 0.8 || // Buffer 80% full
      (batch.tokens.length >= this.batchConfig.minFlushSize && 
       now - batch.firstTokenTime > this.batchConfig.flushIntervalMs);

    if (shouldFlushNow) {
      // Force flush for priority keywords or when other conditions are met
      this.flushBatch(streamId, containsPriorityKeyword);
    } else {
      // Set or reset flush timer
      this.resetBatchTimer(streamId);
    }
  }

  private flushBatch(streamId: string, force = false): TokenBatch | null {
    const batch = this.tokenBatches.get(streamId);
    if (!batch || (!force && batch.tokens.length < this.batchConfig.minFlushSize)) {
      return null;
    }

    // Clear timer
    const timer = this.batchTimers.get(streamId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(streamId);
    }

    // Release memory buffer if allocated
    if (batch.memoryBuffer) {
      this.releaseBuffer(batch.memoryBuffer.id);
      console.log(`🧠 Released memory buffer ${batch.memoryBuffer.id} for batch ${streamId}`);
    }

    // Remove batch from active batches
    this.tokenBatches.delete(streamId);

    // Create batch copy for return (without memory buffer reference)
    const flushedBatch = { 
      ...batch,
      memoryBuffer: undefined // Don't return internal memory buffer
    };
    
    console.log(`📦 Flushed token batch for ${streamId}: ${batch.tokens.length} tokens, ${batch.totalLength} chars, ${batch.lastTokenTime - batch.firstTokenTime}ms duration`);
    
    return flushedBatch;
  }

  private resetBatchTimer(streamId: string): void {
    // Clear existing timer
    const existingTimer = this.batchTimers.get(streamId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.flushBatch(streamId, true);
      this.batchTimers.delete(streamId);
    }, this.batchConfig.flushIntervalMs);

    this.batchTimers.set(streamId, timer);
  }

  // Get batched tokens and flush if ready
  getBatchedTokens(streamId: string, forceFlush = false): { tokens: string[], metadata: any[] } | null {
    const batch = this.tokenBatches.get(streamId);
    if (!batch) {
      return null;
    }

    if (forceFlush || batch.tokens.length >= this.batchConfig.minFlushSize) {
      const flushedBatch = this.flushBatch(streamId, forceFlush);
      return flushedBatch ? { tokens: flushedBatch.tokens, metadata: flushedBatch.metadata } : null;
    }

    return null;
  }

  // Update batch configuration
  updateBatchConfig(config: Partial<TokenBatchConfig>): void {
    this.batchConfig = { ...this.batchConfig, ...config };
    console.log('📝 Updated token batch configuration:', this.batchConfig);
  }

  // Get current batch statistics
  getBatchStatistics(): { [streamId: string]: { tokenCount: number, length: number, age: number, batchSize?: number, memoryUsage?: number } } {
    const stats: { [streamId: string]: { tokenCount: number, length: number, age: number, batchSize?: number, memoryUsage?: number } } = {};
    const now = Date.now();
    
    for (const [streamId, batch] of this.tokenBatches) {
      stats[streamId] = {
        tokenCount: batch.tokens.length,
        length: batch.totalLength,
        age: now - batch.firstTokenTime,
        batchSize: batch.totalLength,
        memoryUsage: batch.memoryBuffer?.size || 0,
      };
    }
    
    return stats;
  }

  // Public method to flush batch (for testing)
  flushBatchForTesting(streamId: string, force = false): TokenBatch | null {
    return this.flushBatch(streamId, force);
  }

  // Clean up batches for completed streams with memory management
  cleanupBatches(streamId?: string): void {
    if (streamId) {
      // Clean specific stream
      const timer = this.batchTimers.get(streamId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(streamId);
      }
      
      // Release memory buffer for this specific batch
      const batch = this.tokenBatches.get(streamId);
      if (batch?.memoryBuffer) {
        this.releaseBuffer(batch.memoryBuffer.id);
        console.log(`🧠 Released memory buffer ${batch.memoryBuffer.id} during cleanup of batch ${streamId}`);
      }
      
      this.tokenBatches.delete(streamId);
    } else {
      // Clean all batches with memory cleanup
      for (const timer of this.batchTimers.values()) {
        clearTimeout(timer);
      }
      this.batchTimers.clear();
      
      // Release all memory buffers from batches
      for (const [batchStreamId, batch] of this.tokenBatches) {
        if (batch.memoryBuffer) {
          this.releaseBuffer(batch.memoryBuffer.id);
          console.log(`🧠 Released memory buffer ${batch.memoryBuffer.id} during full cleanup of batch ${batchStreamId}`);
        }
      }
      
      this.tokenBatches.clear();
      console.log('🧹 Completed full batch cleanup with memory management');
    }
  }
}

// Export singleton instances
export const streamManager = new StreamManager();
export const claudeAPIProxy = new ClaudeAPIProxyService();
export default claudeAPIProxy;
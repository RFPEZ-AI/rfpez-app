// Copyright Mark Skiba, 2025 All rights r  ): Promise<StreamingClaudeResponse> {
    console.log('🚨🚨🚨 UnifiedClaudeService.generateStreamingResponse CALLED 🚨🚨🚨');
    console.log('🌊 Starting unified streaming Claude request with tool transparency');
    
    try {
      // Get auth session for edge function
      const { data: { session } } = await supabase.auth.getSession();d
// Enhanced Claude Service with Unified Edge Function Architecture
// All Claude operations routed server-side with streaming tool transparency

import { supabase } from '../supabaseClient';
import { APIRetryHandler } from '../utils/apiRetry';
import { ToolInvocationEvent, StreamingResponse, ClientCallback } from '../types/streamingProtocol';

interface StreamingClaudeResponse {
  success: boolean;
  data?: any;
  streamingEvents: StreamingResponse[];
  toolInvocations: ToolInvocationEvent[];
  clientCallbacks: ClientCallback[];
  error?: string;
  metadata?: {
    executionTime: number;
    toolsUsed: string[];
    model: string;
    tokenUsage: any;
  };
}

class UnifiedClaudeService {
  private static readonly EDGE_FUNCTION_URL = '/functions/v1/claude-api-v3';
  
  /**
   * Generate Claude response via unified edge function with streaming tool transparency
   */
  static async generateStreamingResponse(params: {
    messages: any[];
    system?: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    tools?: any[];
    sessionContext?: any;
    onToolInvocation?: (toolEvent: ToolInvocationEvent) => void;
    onClientCallback?: (callback: ClientCallback) => void;
    onStreamingText?: (text: string) => void;
    onComplete?: (metadata: any) => void;
    onError?: (error: string) => void;
  }): Promise<StreamingClaudeResponse> {
    console.log('🚨🚨🚨 UnifiedClaudeService.generateStreamingResponse CALLED 🚨🚨🚨');
    console.log('🌊 Starting unified streaming Claude request with tool transparency');
    
    try {
      // Get auth session for edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      // Determine authentication token - use user token for authenticated users, anonymous key for anonymous users
      let authToken: string;
      if (session?.access_token) {
        // Authenticated user
        authToken = session.access_token;
      } else {
        // Anonymous user - use Supabase anonymous key
        authToken = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
        if (!authToken) {
          throw new Error('Anonymous access not configured - missing REACT_APP_SUPABASE_ANON_KEY');
        }
      }

      // Prepare streaming request
      const requestBody = {
        messages: params.messages,
        system: params.system,
        model: params.model || 'claude-sonnet-4-20250514',
        max_tokens: params.max_tokens || 4000,
        temperature: params.temperature || 0.3,
        tools: params.tools || [],
        stream: true, // Enable streaming
        sessionContext: params.sessionContext
      };

      // Make streaming request to unified edge function
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}${this.EDGE_FUNCTION_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Edge function request failed: ${response.status} ${response.statusText}`);
      }

      // Process Server-Sent Events streaming response
      const streamingEvents: StreamingResponse[] = [];
      const toolInvocations: ToolInvocationEvent[] = [];
      const clientCallbacks: ClientCallback[] = [];
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                const streamingEvent = eventData as StreamingResponse;
                streamingEvents.push(streamingEvent);

                // Handle different event types with callbacks
                switch (streamingEvent.type) {
                  case 'tool_invocation':
                    if (streamingEvent.toolEvent) {
                      toolInvocations.push(streamingEvent.toolEvent);
                      params.onToolInvocation?.(streamingEvent.toolEvent);
                      console.log(`🔧 Tool ${streamingEvent.toolEvent.type}: ${streamingEvent.toolEvent.toolName}`);
                    }
                    break;
                    
                  case 'text':
                    if (streamingEvent.content) {
                      params.onStreamingText?.(streamingEvent.content);
                    }
                    break;
                    
                  case 'completion':
                    params.onComplete?.(streamingEvent.metadata);
                    console.log('✅ Streaming completed with tool transparency');
                    break;
                    
                  case 'error':
                    params.onError?.(streamingEvent.content || 'Unknown streaming error');
                    break;
                }
              } catch (parseError) {
                console.warn('⚠️ Failed to parse streaming event:', parseError);
              }
            }
          }
        }
      }

      return {
        success: true,
        streamingEvents,
        toolInvocations,
        clientCallbacks,
        metadata: {
          executionTime: Date.now(),
          toolsUsed: toolInvocations.map(t => t.toolName),
          model: params.model || 'claude-sonnet-4-20250514',
          tokenUsage: {} // Will be populated from completion events
        }
      };

    } catch (error) {
      console.error('❌ Unified Claude streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
      params.onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        streamingEvents: [],
        toolInvocations: [],
        clientCallbacks: []
      };
    }
  }

  /**
   * Generate non-streaming Claude response via unified edge function
   */
  static async generateResponse(params: {
    messages: any[];
    system?: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
    tools?: any[];
    sessionContext?: any;
  }): Promise<any> {
    console.log('🤖 Generating unified Claude response');
    
    return APIRetryHandler.executeWithRetry(async () => {
      // Get auth session for edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required for Claude API access');
      }

      // Prepare non-streaming request
      const requestBody = {
        messages: params.messages,
        system: params.system,
        model: params.model || 'claude-sonnet-4-20250514',
        max_tokens: params.max_tokens || 4000,
        temperature: params.temperature || 0.3,
        tools: params.tools || [],
        stream: false, // Non-streaming
        sessionContext: params.sessionContext
      };

      // Make request to unified edge function
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}${this.EDGE_FUNCTION_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Edge function request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Edge function execution failed');
      }

      console.log('✅ Unified Claude response received');
      return result.data;
    });
  }

  /**
   * Legacy compatibility wrapper - routes to unified edge function
   */
  static async generateResponseViaEdgeFunction(params: {
    messages: any[];
    system?: string;
    tools?: any[];
    sessionContext?: any;
  }): Promise<any> {
    console.log('🔄 Legacy wrapper - routing to unified edge function');
    return this.generateResponse(params);
  }
}

export default UnifiedClaudeService;
// Copyright Mark Skiba, 2025 All rights reserved

// Updated Claude API service with hybrid proxy pattern
import Anthropic from '@anthropic-ai/sdk';
import type { Message, ContentBlock, TextBlock, ToolUseBlock, MessageParam } from '@anthropic-ai/sdk/resources';
import type { Agent } from '../types/database';
import { claudeApiFunctions, claudeAPIHandler } from './claudeAPIFunctions';
import { claudeAPIProxy } from './claudeAPIProxy';
import { APIRetryHandler } from '../utils/apiRetry';
import { supabase } from '../supabaseClient';

// Response interface
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
      result: any;
    }>;
    agent_switch_occurred?: boolean;
    agent_switch_result?: any;
    buyer_questionnaire?: Record<string, unknown>;
    is_streaming?: boolean;
    stream_complete?: boolean;
    [key: string]: unknown;
  };
}

// Message validation helper
function validateMessage(content: string | any[]): boolean {
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  
  if (Array.isArray(content)) {
    return content.some(block => {
      if (block.type === 'text') {
        return block.text && block.text.trim().length > 0;
      }
      return true; // Non-text blocks are considered valid
    });
  }
  
  return false;
}

function validateAndFilterMessages(messages: MessageParam[]): MessageParam[] {
  return messages.filter(message => {
    if (!message.content) return false;
    return validateMessage(message.content as any);
  });
}

export class ClaudeService {
  private static client: Anthropic | null = null;

  // Get Anthropic client (for streaming operations only - LEGACY MODE)
  // Note: API key moved to server-side edge function for security
  private static getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ REACT_APP_CLAUDE_API_KEY not found - this is expected as API key moved to server-side');
        throw new Error('Legacy direct API access unavailable - API key moved to server-side edge function');
      }
      
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
    
    return this.client;
  }

  /**
   * Generate a non-streaming response using the edge function proxy
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
    onChunk?: (chunk: string, isComplete: boolean, metadata?: any) => void
  ): Promise<ClaudeResponse> {
    
    const startTime = Date.now();
    
    // Check if streaming is requested - use new edge function proxy
    if (stream) {
      console.log('🌊 Streaming requested - using edge function proxy');
      return this.generateStreamingResponse(
        userMessage,
        agent,
        conversationHistory,
        sessionId,
        userProfile,
        currentRfp,
        currentArtifact,
        abortSignal,
        onChunk
      );
    }

    // For non-streaming, use the new edge function proxy
    console.log('🚀 Using edge function proxy for non-streaming Claude API call');

    try {
      // Build the conversation context - filter out empty messages
      const messages: MessageParam[] = [
        ...conversationHistory.filter(msg => {
          if (!msg.content) return false;
          if (typeof msg.content === 'string') {
            return msg.content.trim() !== '';
          }
          if (Array.isArray(msg.content)) {
            return msg.content.length > 0;
          }
          return true;
        }),
        {
          role: 'user',
          content: userMessage
        }
      ];

      // DISABLED: Debug logging causes memory pressure  
      // console.log('🔍 Messages being sent to Claude API (non-streaming):', JSON.stringify(messages, null, 2));
      
      // Validate no empty messages before sending (keep validation but disable verbose logging)
      const emptyMessages = messages.filter(msg => !msg.content || (typeof msg.content === 'string' && msg.content.trim() === ''));
      if (emptyMessages.length > 0) {
        console.error('❌ Found empty messages that should have been filtered');
        throw new Error(`Found ${emptyMessages.length} empty messages in conversation history`);
      }

      // Create system prompt
      const systemPrompt = this.buildSystemPrompt(
        agent,
        userProfile,
        sessionId,
        currentRfp,
        currentArtifact
      );

      // Call edge function for Claude API
      const response = await claudeAPIProxy.generateMessage({
        messages: messages,
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        tools: claudeApiFunctions,
        sessionId: sessionId, // Pass session context to edge function
      });

      console.log('✅ Edge function Claude API response received');

      // Process the response
      const content = this.extractContentFromResponse(response);
      const functionsExecuted: string[] = [];
      const allFunctionResults: any[] = [];

      // Handle function calls in the response
      if (response.content && Array.isArray(response.content)) {
        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const toolUse = block as ToolUseBlock;
            console.log(`🔧 Processing function call: ${toolUse.name}`);
            
            try {
              functionsExecuted.push(toolUse.name);
              const result = await claudeAPIProxy.executeFunction(toolUse.name, toolUse.input);
              allFunctionResults.push({ function: toolUse.name, result });
              console.log(`✅ Function executed: ${toolUse.name}`);
            } catch (error) {
              console.error(`❌ Function execution failed: ${toolUse.name}`, error);
              allFunctionResults.push({ 
                function: toolUse.name, 
                result: { error: error instanceof Error ? error.message : 'Unknown error' }
              });
            }
          }
        }
      }

      // If functions were called, get Claude's response to the results
      let finalContent = content;
      if (allFunctionResults.length > 0) {
        console.log('🔄 Functions executed, getting Claude response to results...');
        
        // Add assistant's message with tool calls to conversation
        messages.push({
          role: 'assistant',
          content: response.content as any
        });

        // Add tool results as user message
        const toolResults = allFunctionResults.map((funcResult, index) => {
          const toolUseBlock = response.content?.find((block: any) => 
            block.type === 'tool_use' && block.name === funcResult.function
          ) as ToolUseBlock | undefined;
          
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUseBlock?.id || `tool-${index}`,
            content: JSON.stringify(funcResult.result, null, 2)
          };
        });

        messages.push({
          role: 'user',
          content: toolResults
        });

        // Get Claude's response to the function results
        const followupResponse = await claudeAPIProxy.generateMessage({
          messages: messages,
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.7,
          system: systemPrompt,
          tools: claudeApiFunctions,
        });

        finalContent = this.extractContentFromResponse(followupResponse);
      }

      const responseTime = Date.now() - startTime;

      return {
        content: finalContent,
        metadata: {
          model: response.model || 'claude-3-5-sonnet-20241022',
          tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          response_time: responseTime,
          temperature: 0.7,
          functions_called: functionsExecuted,
          function_results: allFunctionResults,
          is_streaming: false,
          stream_complete: true,
        }
      };

    } catch (error) {
      console.error('❌ Edge function Claude API call failed:', error);
      throw error;
    }
  }

  /**
   * Build system prompt with context
   */
  private static buildSystemPrompt(
    agent: Agent,
    userProfile?: any,
    sessionId?: string,
    currentRfp?: any,
    currentArtifact?: any
  ): string {
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
- Use this session ID when calling functions that require a session_id parameter.` : '';

    const rfpContext = currentRfp ? `

CURRENT RFP CONTEXT:
- RFP ID: ${currentRfp.id}
- RFP Name: ${currentRfp.name}
- Description: ${currentRfp.description}
- Specification: ${currentRfp.specification}

You are currently working with this specific RFP. Use this RFP ID (${currentRfp.id}) for database operations.` : '';

    const artifactContext = currentArtifact ? `

CURRENT ARTIFACT CONTEXT:
- Artifact ID: ${currentArtifact.id}
- Artifact Name: ${currentArtifact.name}
- Artifact Type: ${currentArtifact.type}

This is the artifact currently displayed. When users reference "the form" or "this artifact", they mean this one.` : '';

    const functionGuidelines = `

FUNCTION USAGE INSTRUCTIONS:

**AGENT LISTING**: When users ask about available agents or what agents exist:
- Use get_available_agents function to retrieve current agent list
- Common phrases: "what agents are there?", "show me available agents", "list agents", "what agents do you have?", "what agents are available?", "agents available"
- ALWAYS include agent IDs in your response when listing agents - users need these IDs to switch agents
- Format: "**Agent Name** (access_level) - ID: agent_id"
- Include restricted agents only if user specifically asks about premium/paid agents

**AGENT SWITCHING**: When users explicitly request to switch agents or need specialized help:
- Use switch_agent function with the session_id and appropriate agent_id
- Common phrases: "switch to [agent name]", "I need the [role] agent", "change to [specialty] agent"
- Agent IDs to use:
  - RFP Design: 8c5f11cb-1395-4d67-821b-89dd58f0c8dc
  - Technical Support: eca68e1b-9803-440c-acea-79831e9313c1
  - Support: 2dbfa44a-a041-4167-8d3e-82aecd4d2424
  - RFP Assistant: a12243de-f8ed-4630-baff-762e0ca51aa1
  - Billing: 0fb62d0c-79fe-4995-a4ee-f6a462e2f05f
  - Sourcing: 021c53a9-8f7f-4112-9ad6-bc86003fadf7
  - Negotiation: 7b05b172-1ee6-4d58-a1e5-205993d16171
  - Audit: 0b17fcf1-365b-459f-82bd-b5ab73c80b27

**DATABASE OPERATIONS**: Use appropriate functions for data management:
- store_message: Save important messages to session history
- get_conversation_history: Retrieve past conversation context
- supabase_select/insert/update: Direct database operations when needed

**ARTIFACT MANAGEMENT**: Use artifact functions when users work with forms or documents.

IMPORTANT: Always use session_id parameter when available for functions that require it.`;

    return `${agent.instructions || `You are ${agent.name}, an AI assistant.`}${userContext}${sessionContext}${rfpContext}${artifactContext}${functionGuidelines}`;
  }

  /**
   * Extract text content from Claude response
   */
  private static extractContentFromResponse(response: any): string {
    if (!response.content) return '';
    
    if (Array.isArray(response.content)) {
      return response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');
    }
    
    if (typeof response.content === 'string') {
      return response.content;
    }
    
    return '';
  }

  /**
   * Generate streaming response (legacy method using direct API)
   */
  static async generateStreamingResponseLegacy(
    userMessage: string,
    agent: Agent,
    conversationHistory: MessageParam[] = [],
    sessionId?: string,
    userProfile?: any,
    currentRfp?: any,
    currentArtifact?: any,
    abortSignal?: AbortSignal,
    onChunk?: (chunk: string, isComplete: boolean) => void
  ): Promise<ClaudeResponse> {
    // TODO: Implement streaming via edge function in Phase 2
    // For now, fall back to direct API client for streaming
    console.log('⚠️ Streaming not yet implemented via edge function - using direct API');
    
    const startTime = Date.now();
    
    try {
      const client = this.getClient();
      const messages: MessageParam[] = [...conversationHistory, { role: 'user', content: userMessage }];
      const systemPrompt = this.buildSystemPrompt(agent, userProfile, sessionId, currentRfp, currentArtifact);

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: validateAndFilterMessages(messages),
        tools: claudeApiFunctions,
      });

      const content = this.extractContentFromResponse(response);
      const responseTime = Date.now() - startTime;

      // Send final chunk
      if (onChunk) {
        onChunk(content, true);
      }

      return {
        content,
        metadata: {
          model: response.model,
          tokens_used: response.usage.input_tokens + response.usage.output_tokens,
          response_time: responseTime,
          temperature: 0.7,
          is_streaming: true,
          stream_complete: true,
        }
      };

    } catch (error) {
      console.error('❌ Legacy streaming API call failed:', error);
      throw error;
    }
  }

  /**
   * Generate streaming response via edge function proxy
   */
  static async generateStreamingResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: MessageParam[] = [],
    sessionId?: string,
    userProfile?: any,
    currentRfp?: any,
    currentArtifact?: any,
    abortSignal?: AbortSignal,
    onChunk?: (chunk: string, isComplete: boolean, metadata?: any) => void
  ): Promise<ClaudeResponse> {
    console.log('🌊 Generating streaming response via edge function proxy');
    
    const startTime = Date.now();
    
    try {
      // Build the conversation context - filter out empty messages
      const messages: MessageParam[] = [
        ...conversationHistory.filter(msg => {
          if (!msg.content) return false;
          if (typeof msg.content === 'string') {
            return msg.content.trim() !== '';
          }
          if (Array.isArray(msg.content)) {
            return msg.content.length > 0;
          }
          return true;
        }),
        {
          role: 'user',
          content: userMessage
        }
      ];

      // DISABLED: Debug logging causes memory pressure
      // console.log('🔍 Messages being sent to Claude API:', JSON.stringify(messages, null, 2));
      
      // Validate no empty messages before sending (keep validation but disable verbose logging)
      const emptyMessages = messages.filter(msg => !msg.content || (typeof msg.content === 'string' && msg.content.trim() === ''));
      if (emptyMessages.length > 0) {
        console.error('❌ Found empty messages that should have been filtered');
        throw new Error(`Found ${emptyMessages.length} empty messages in conversation history`);
      }

      // Prepare the system prompt and parameters
      const systemPrompt = this.buildSystemPrompt(agent, userProfile, sessionId, currentRfp, currentArtifact);
      
      const params = {
        messages: messages as any[], // Convert MessageParam[] to ClaudeMessage[]
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        tools: claudeApiFunctions,
        sessionId: sessionId, // Pass session context to edge function
      };

      // DEBUG: Log the params being sent to proxy
      console.log('🔧 DEBUG CLIENT: Params being sent to claudeAPIProxy:', {
        hasTools: !!params.tools,
        toolsLength: params.tools?.length || 0,
        toolNames: params.tools?.map((t: any) => t.name) || 'no tools',
        paramsKeys: Object.keys(params)
      });

      // Use the streaming proxy
      const result = await claudeAPIProxy.generateStreamingResponse(
        params,
        (chunk: string, isComplete: boolean, metadata?: any) => {
          console.log('🔄 Proxy streaming callback:', { chunk, isComplete, metadata });
          if (onChunk) {
            // Convert metadata to proper toolProcessing flag
            // Only indicate tool processing if we actually have tool_use data
            const actuallyProcessingTools = metadata && (
              metadata.tool_use || 
              (metadata.tool_results && metadata.tool_results.length > 0) ||
              metadata.tools_processing === true
            );
            
            console.log('🔄 Tool processing check:', {
              hasMetadata: !!metadata,
              hasTool_use: !!(metadata?.tool_use),
              hasToolResults: !!(metadata?.tool_results?.length),
              toolsProcessingFlag: metadata?.tools_processing,
              actuallyProcessingTools
            });
            
            onChunk(chunk, isComplete, actuallyProcessingTools);
          }
        },
        abortSignal
      );

      const responseTime = Date.now() - startTime;

      return {
        content: result.content || '',
        metadata: {
          model: result.metadata?.model || 'claude-3-5-sonnet-20241022',
          tokens_used: result.metadata?.token_count || 0,
          response_time: responseTime,
          temperature: 0.7,
          is_streaming: true,
          stream_complete: true,
          functions_called: result.metadata?.tool_results?.map((t: any) => t.function) || [],
          function_results: result.metadata?.tool_results || [],
          ...result.metadata,
        }
      };

    } catch (error) {
      console.error('❌ Streaming proxy API call failed:', error);
      
      const responseTime = Date.now() - startTime;
      
      // Return error response
      return {
        content: `❌ I'm having trouble connecting to the AI service right now. ${error instanceof Error ? error.message : 'Unknown error'} Your message has been saved.`,
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          tokens_used: 0,
          response_time: responseTime,
          temperature: 0.7,
          is_streaming: true,
          stream_complete: true,
          error: true,
        }
      };
    }
  }

  /**
   * Test Claude API connection via edge function
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Claude API connection via edge function');
      const result = await claudeAPIProxy.testConnection();
      console.log('✅ Claude API connection test successful:', result);
      return true;
    } catch (error) {
      console.error('❌ Claude API connection test failed:', error);
      return false;
    }
  }
}

export default ClaudeService;
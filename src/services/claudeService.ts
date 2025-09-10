// Copyright Mark Skiba, 2025 All rights reserved

// Claude API service for RFPEZ.AI Multi-Agent System with MCP Integration
import Anthropic from '@anthropic-ai/sdk';
import type { Agent } from '../types/database';
import { claudeApiFunctions, claudeAPIHandler } from './claudeAPIFunctions';
import { APIRetryHandler } from '../utils/apiRetry';

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
    } | null
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();
    const functionsExecuted: string[] = [];
    
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

      const systemPrompt = `${agent.instructions || `You are ${agent.name}, an AI assistant.`}${userContext}${sessionContext}${rfpContext}

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

Be helpful, accurate, and professional. When switching agents, make the transition smooth and explain the benefits.`;

      console.log('Sending request to Claude API with MCP functions...', {
        agent: agent.name,
        messageCount: messages.length,
        sessionId,
        functionsAvailable: claudeApiFunctions.length,
        userContext: userProfile ? {
          name: userProfile.full_name,
          email: userProfile.email,
          role: userProfile.role
        } : 'anonymous',
        rfpContext: currentRfp ? {
          id: currentRfp.id,
          name: currentRfp.name
        } : 'none'
      });

      let response = await APIRetryHandler.executeWithRetry(
        () => client.messages.create({
          model: 'claude-3-5-sonnet-latest', // Use latest version automatically
          max_tokens: 2000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages,
          tools: claudeApiFunctions, // Include MCP functions
          tool_choice: { type: 'auto' } // Let Claude decide when to use functions
        }),
        {
          maxRetries: 3,
          baseDelay: 2000, // Start with 2 seconds
          maxDelay: 60000, // Max 1 minute delay
          onRetry: (attempt, error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`🔄 Retrying Claude API call (attempt ${attempt}) due to:`, errorMessage);
          }
        }
      );

      // Handle function calls if any
      let finalContent = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allFunctionResults: any[] = [];

      // Process the response and handle any function calls
      while (response.content.some(block => block.type === 'tool_use')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolUses = response.content.filter(block => block.type === 'tool_use') as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textBlocks = response.content.filter(block => block.type === 'text') as any[];
        
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
            console.log(`Executing function: ${toolUse.name}`, toolUse.input);
            functionsExecuted.push(toolUse.name);
            
            const result = await claudeAPIHandler.executeFunction(toolUse.name, toolUse.input);
            allFunctionResults.push({ function: toolUse.name, result });
            
            // Check if this is an agent switch that should stop processing
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (toolUse.name === 'switch_agent' && result && typeof result === 'object' && 'stop_processing' in result && (result as any).stop_processing) {
              shouldStopProcessing = true;
              console.log('Agent switch detected, stopping additional processing');
            }
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result, null, 2)
            });
          } catch (error) {
            console.error(`Function execution error for ${toolUse.name}:`, error);
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
          console.log('Stopping processing due to agent switch');
          break; // Exit the while loop to prevent additional Claude responses
        }

        // Get Claude's response to the function results
        response = await APIRetryHandler.executeWithRetry(
          () => client.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 2000,
            temperature: 0.7,
            system: systemPrompt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: messages as any,
            tools: claudeApiFunctions,
            tool_choice: { type: 'auto' }
          }),
          {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 60000,
            onRetry: (attempt, error) => {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.log(`🔄 Retrying Claude API follow-up call (attempt ${attempt}) due to:`, errorMessage);
            }
          }
        );
      }

      // Collect final text content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalTextBlocks = response.content.filter(block => block.type === 'text') as any[];
      finalContent += finalTextBlocks.map(block => block.text).join('');

      const responseTime = Date.now() - startTime;

      console.log('Claude API response with MCP integration received', {
        responseTime,
        contentLength: finalContent.length,
        functionsExecuted,
        functionResults: allFunctionResults.length,
        usage: response.usage
      });

      // Store the conversation in the current session if sessionId is provided
      if (sessionId && finalContent.trim()) {
        try {
          await claudeAPIHandler.executeFunction('store_message', {
            session_id: sessionId,
            content: userMessage,
            role: 'user'
          });
          
          await claudeAPIHandler.executeFunction('store_message', {
            session_id: sessionId,
            content: finalContent,
            role: 'assistant',
            metadata: {
              agent_id: agent.id,
              functions_called: functionsExecuted,
              model: response.model
            }
          });
        } catch (error) {
          console.warn('Failed to store conversation:', error);
        }
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
          agent_switch_result: agentSwitchResult
        }
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Handle specific error types with better user messaging
      if (error instanceof Error) {
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
   * Generate a streaming response (for future implementation)
   */
  static async generateStreamingResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: ClaudeMessage[] = [],
    sessionId?: string
    // onChunk parameter removed as it's not currently used
  ): Promise<ClaudeResponse> {
    // For now, fall back to regular response with session support
    // Streaming can be implemented later when needed
    return this.generateResponse(userMessage, agent, conversationHistory, sessionId);
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

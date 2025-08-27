// Claude API service for RFPEZ.AI Multi-Agent System with MCP Integration
import Anthropic from '@anthropic-ai/sdk';
import type { Agent } from '../types/database';
import { claudeApiFunctions, claudeAPIHandler } from './claudeAPIFunctions';

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
    sessionId?: string
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
      const systemPrompt = `${agent.instructions || `You are ${agent.name}, an AI assistant.`}

You have access to conversation management functions that allow you to:
- Retrieve conversation history from previous sessions
- Store messages and create new sessions
- Search through past conversations
- Access recent sessions

Use these functions when relevant to help the user. For example:
- If they ask about previous conversations, use get_recent_sessions or search_messages
- If they reference something from earlier, use get_conversation_history
- Always store important conversation milestones using store_message

Be helpful, accurate, and professional.`;

      console.log('Sending request to Claude API with MCP functions...', {
        agent: agent.name,
        messageCount: messages.length,
        sessionId,
        functionsAvailable: claudeApiFunctions.length
      });

      let response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Use Claude 3.5 Sonnet for better function calling
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages,
        tools: claudeApiFunctions, // Include MCP functions
        tool_choice: { type: 'auto' } // Let Claude decide when to use functions
      });

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
        for (const toolUse of toolUses) {
          try {
            console.log(`Executing function: ${toolUse.name}`, toolUse.input);
            functionsExecuted.push(toolUse.name);
            
            const result = await claudeAPIHandler.executeFunction(toolUse.name, toolUse.input);
            allFunctionResults.push({ function: toolUse.name, result });
            
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

        // Get Claude's response to the function results
        response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.7,
          system: systemPrompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          tools: claudeApiFunctions,
          tool_choice: { type: 'auto' }
        });
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

      return {
        content: finalContent,
        metadata: {
          model: response.model,
          tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          response_time: responseTime,
          temperature: 0.7,
          functions_called: functionsExecuted
        }
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid Claude API key. Please check your configuration.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('CORS')) {
          throw new Error('CORS error. Claude API may need to be called from a backend service.');
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
      
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      });

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

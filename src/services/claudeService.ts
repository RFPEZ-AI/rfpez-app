// Claude API service for RFPEZ.AI Multi-Agent System
import Anthropic from '@anthropic-ai/sdk';
import type { Agent } from '../types/database';

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
   * Generate a response using Claude API
   */
  static async generateResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: ClaudeMessage[] = []
  ): Promise<ClaudeResponse> {
    const startTime = Date.now();
    
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

      // Create system prompt based on agent instructions
      const systemPrompt = agent.instructions || 
        `You are ${agent.name}, an AI assistant. Be helpful, accurate, and professional.`;

      console.log('Sending request to Claude API...', {
        agent: agent.name,
        systemPrompt,
        messageCount: messages.length
      });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307', // Using Haiku for faster, cost-effective responses
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      });

      const responseTime = Date.now() - startTime;
      
      // Extract the text content from the response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { text: string }).text)
        .join('');

      console.log('Claude API response received', {
        responseTime,
        contentLength: content.length,
        usage: response.usage
      });

      return {
        content,
        metadata: {
          model: response.model,
          tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          response_time: responseTime,
          temperature: 0.7
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
    conversationHistory: ClaudeMessage[] = []
    // onChunk parameter removed as it's not currently used
  ): Promise<ClaudeResponse> {
    // For now, fall back to regular response
    // Streaming can be implemented later when needed
    return this.generateResponse(userMessage, agent, conversationHistory);
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
}

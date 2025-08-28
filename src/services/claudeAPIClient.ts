// Claude API client - handles only API communication
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { AppErrorHandler, ErrorType } from '../utils/errorHandler';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ClaudeAPIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export class ClaudeAPIClient {
  private static client: Anthropic | null = null;

  private static getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
      
      if (!apiKey || apiKey === 'your_claude_api_key_here') {
        throw AppErrorHandler.createError(
          ErrorType.AUTHENTICATION,
          'Claude API key not configured',
          'API configuration error. Please contact support.',
          { retryable: false }
        );
      }

      this.client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    
    return this.client;
  }

  static async sendMessage(
    messages: ClaudeMessage[],
    systemPrompt: string,
    tools?: unknown[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<ClaudeAPIResponse> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient();
      
      logger.debug('Sending Claude API request', {
        component: 'ClaudeAPIClient',
        messageCount: messages.length,
        model: options?.model || 'claude-3-5-sonnet-20241022'
      });

      const response = await client.messages.create({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
        system: systemPrompt,
        messages: messages as Anthropic.MessageParam[],
        tools: tools as Anthropic.Tool[],
        tool_choice: tools ? { type: 'auto' } : undefined
      });

      const responseTime = Date.now() - startTime;

      logger.info('Claude API response received', {
        component: 'ClaudeAPIClient',
        responseTime,
        usage: response.usage
      });

      // Extract text content
      const textBlocks = response.content.filter(block => block.type === 'text') as Array<{ text: string }>;
      const content = textBlocks.map(block => block.text).join('');

      return {
        content,
        usage: response.usage,
        model: response.model
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Claude API request failed', error as Error, {
        component: 'ClaudeAPIClient',
        responseTime
      });

      throw AppErrorHandler.handleError(error as Error, {
        component: 'ClaudeAPIClient',
        action: 'sendMessage'
      });
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(
        [{ role: 'user', content: 'Hello' }],
        'Respond with just "OK"',
        undefined,
        { maxTokens: 10 }
      );
      return true;
    } catch (error) {
      logger.error('Claude API connection test failed', error as Error);
      return false;
    }
  }
}

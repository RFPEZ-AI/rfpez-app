// Conversation management service - handles session/message logic
import { ClaudeAPIClient, ClaudeMessage } from './claudeAPIClient';
import { claudeAPIHandler } from './claudeAPIFunctions';
import { logger } from '../utils/logger';
import { AppErrorHandler } from '../utils/errorHandler';
import type { Agent } from '../types/database';

export interface ConversationResponse {
  content: string;
  metadata: {
    model: string;
    tokens_used: number;
    response_time: number;
    temperature: number;
    functions_called: string[];
  };
}

export class ConversationService {
  static async generateResponse(
    userMessage: string,
    agent: Agent,
    conversationHistory: ClaudeMessage[] = [],
    sessionId?: string
  ): Promise<ConversationResponse> {
    const startTime = Date.now();
    const functionsExecuted: string[] = [];

    try {
      logger.info('Generating conversation response', {
        component: 'ConversationService',
        agent: agent.name,
        sessionId,
        historyLength: conversationHistory.length
      });

      // Build the conversation context
      const messages: ClaudeMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Create system prompt based on agent instructions
      const systemPrompt = this.buildSystemPrompt(agent);

      // Send to Claude API with function calling capabilities
      const response = await ClaudeAPIClient.sendMessage(
        messages,
        systemPrompt,
        [] // Add claudeApiFunctions here when needed
      );

      // Store conversation if sessionId provided
      if (sessionId && response.content.trim()) {
        await this.storeConversation(sessionId, userMessage, response.content, agent, functionsExecuted);
      }

      const responseTime = Date.now() - startTime;

      logger.info('Conversation response generated successfully', {
        component: 'ConversationService',
        responseTime,
        contentLength: response.content.length,
        functionsExecuted
      });

      return {
        content: response.content,
        metadata: {
          model: response.model,
          tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
          response_time: responseTime,
          temperature: 0.7,
          functions_called: functionsExecuted
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Failed to generate conversation response', error as Error, {
        component: 'ConversationService',
        agent: agent.name,
        sessionId,
        responseTime
      });

      throw AppErrorHandler.handleError(error as Error, {
        component: 'ConversationService',
        action: 'generateResponse'
      });
    }
  }

  private static buildSystemPrompt(agent: Agent): string {
    const baseInstructions = agent.instructions || `You are ${agent.name}, an AI assistant.`;
    
    const mcpContext = `

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

    return baseInstructions + mcpContext;
  }

  private static async storeConversation(
    sessionId: string,
    userMessage: string,
    assistantResponse: string,
    agent: Agent,
    functionsExecuted: string[]
  ): Promise<void> {
    try {
      // Store user message
      await claudeAPIHandler.executeFunction('store_message', {
        session_id: sessionId,
        content: userMessage,
        role: 'user'
      });
      
      // Store assistant response
      await claudeAPIHandler.executeFunction('store_message', {
        session_id: sessionId,
        content: assistantResponse,
        role: 'assistant',
        metadata: {
          agent_id: agent.id,
          functions_called: functionsExecuted
        }
      });

      logger.debug('Conversation stored successfully', {
        component: 'ConversationService',
        sessionId,
        functionsExecuted
      });
      
    } catch (error) {
      logger.warn('Failed to store conversation', {
        component: 'ConversationService',
        sessionId,
        error: (error as Error).message
      });
      // Don't throw - conversation storage failure shouldn't break the response
    }
  }

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

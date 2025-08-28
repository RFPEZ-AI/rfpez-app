// Custom hook for conversation management
import { useState, useCallback } from 'react';
import { ConversationService } from '../services/conversationService';
import { useErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import type { Agent } from '../types/database';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string;
}

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { handleError } = useErrorHandler();

  const sendMessage = useCallback(async (
    content: string,
    agent: Agent,
    sessionId?: string
  ) => {
    if (!content.trim()) return;

    setIsLoading(true);
    
    // Add user message immediately for UI responsiveness
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      logger.info('Sending message', {
        component: 'useConversation',
        agent: agent.name,
        sessionId
      });

      // Convert messages to conversation history format
      const conversationHistory = ConversationService.formatConversationHistory(
        messages.map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        }))
      );

      const response = await ConversationService.generateResponse(
        content,
        agent,
        conversationHistory,
        sessionId
      );

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        agentName: agent.name
      };

      setMessages(prev => [...prev, assistantMessage]);

      logger.info('Message conversation completed', {
        component: 'useConversation',
        responseTime: response.metadata.response_time,
        tokensUsed: response.metadata.tokens_used
      });

    } catch (error) {
      const appError = handleError(error as Error, {
        component: 'useConversation',
        action: 'sendMessage'
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `Error: ${appError.userMessage}`,
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, handleError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadMessagesFromSession = useCallback((sessionMessages: Array<{ id: string; content: string; role: string; created_at: string; agent_name?: string }>) => {
    const formattedMessages: Message[] = sessionMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.role === 'user',
      timestamp: new Date(msg.created_at),
      agentName: msg.role === 'assistant' ? msg.agent_name || 'Assistant' : undefined
    }));
    
    setMessages(formattedMessages);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadMessagesFromSession
  };
}

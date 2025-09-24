// Copyright Mark Skiba, 2025 All rights reserved

import { ClaudeService as ClaudeServiceV2 } from '../claudeServiceV2';
import type { Agent } from '../../types/database';

// Mock the claudeAPIProxy
jest.mock('../claudeAPIProxy', () => ({
  claudeAPIProxy: {
    generateStreamingResponse: jest.fn(),
  },
  streamManager: {
    getActiveStreamCount: jest.fn(() => 0),
    abortAllStreams: jest.fn(),
  }
}));

describe('ClaudeServiceV2 Streaming Tests', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'Test agent for streaming tests',
    role: 'assistant',
    instructions: 'Test instructions',
    initial_prompt: 'Hello, I am a test agent.',
    is_active: true,
    is_default: false,
    is_restricted: false,
    is_free: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStreamingResponse', () => {
    it('should call proxy streaming and handle response correctly', async () => {
      const mockResponse = {
        content: 'Test response content',
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          token_count: 15,
          tool_results: []
        }
      };

      const { claudeAPIProxy } = require('../claudeAPIProxy');
      claudeAPIProxy.generateStreamingResponse.mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      let isComplete = false;
      let receivedMetadata: any = null;

      const result = await ClaudeServiceV2.generateStreamingResponse(
        'Test message',
        mockAgent,
        [],
        'test-session',
        undefined,
        undefined,
        undefined,
        undefined,
        (chunk: string, complete: boolean, metadata?: any) => {
          chunks.push(chunk);
          isComplete = complete;
          if (metadata) {
            receivedMetadata = metadata;
          }
        }
      );

      expect(claudeAPIProxy.generateStreamingResponse).toHaveBeenCalledTimes(1);
      expect(result.content).toBe('Test response content');
      expect(result.metadata.model).toBe('claude-3-5-sonnet-20241022');
      expect(result.metadata.is_streaming).toBe(true);
      expect(result.metadata.stream_complete).toBe(true);
    });

    it('should handle streaming with abort signal', async () => {
      const mockResponse = {
        content: 'Partial response',
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          token_count: 8,
          tool_results: []
        }
      };

      const { claudeAPIProxy } = require('../claudeAPIProxy');
      claudeAPIProxy.generateStreamingResponse.mockResolvedValue(mockResponse);

      const abortController = new AbortController();
      
      const result = await ClaudeServiceV2.generateStreamingResponse(
        'Test message with abort',
        mockAgent,
        [],
        'test-session',
        undefined,
        undefined,
        undefined,
        abortController.signal,
        (chunk: string, complete: boolean) => {
          // Callback should be called
        }
      );

      expect(claudeAPIProxy.generateStreamingResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Test message with abort'
            })
          ])
        }),
        expect.any(Function),
        abortController.signal
      );
    });

    it('should build correct system prompt with agent context', async () => {
      const mockResponse = {
        content: 'Response with context',
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          token_count: 12,
          tool_results: []
        }
      };

      const { claudeAPIProxy } = require('../claudeAPIProxy');
      claudeAPIProxy.generateStreamingResponse.mockResolvedValue(mockResponse);

      const userProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'buyer'
      };

      const currentRfp = {
        id: 1,
        name: 'Test RFP',
        description: 'Test description',
        specification: 'Test spec'
      };

      await ClaudeServiceV2.generateStreamingResponse(
        'Test with context',
        mockAgent,
        [],
        'test-session',
        userProfile,
        currentRfp,
        undefined,
        undefined,
        () => {}
      );

      expect(claudeAPIProxy.generateStreamingResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Test instructions'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: 'Test with context'
            })
          ])
        }),
        expect.any(Function),
        undefined
      );
    });

    it('should handle streaming errors gracefully', async () => {
      const { claudeAPIProxy } = require('../claudeAPIProxy');
      claudeAPIProxy.generateStreamingResponse.mockRejectedValue(new Error('Network error'));

      const result = await ClaudeServiceV2.generateStreamingResponse(
        'Test error handling',
        mockAgent,
        [],
        'test-session',
        undefined,
        undefined,
        undefined,
        undefined,
        () => {}
      );

      // Should handle error gracefully and return structured error response
      expect(result.metadata.error).toBe(true);
      expect(result.content).toContain('Network error');
      expect(result.metadata.is_streaming).toBe(true);
      expect(result.metadata.stream_complete).toBe(true);
    });
  });

  describe('generateResponse with streaming', () => {
    it('should delegate to generateStreamingResponse when stream=true', async () => {
      const mockResponse = {
        content: 'Streamed response',
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          token_count: 10,
          is_streaming: true,
          stream_complete: true
        }
      };

      // Mock the static method
      const originalGenerateStreamingResponse = ClaudeServiceV2.generateStreamingResponse;
      ClaudeServiceV2.generateStreamingResponse = jest.fn().mockResolvedValue(mockResponse);

      const result = await ClaudeServiceV2.generateResponse(
        'Test streaming delegation',
        mockAgent,
        [],
        'test-session',
        undefined,
        undefined,
        undefined,
        undefined,
        true, // Enable streaming
        () => {}
      );

      expect(ClaudeServiceV2.generateStreamingResponse).toHaveBeenCalledWith(
        'Test streaming delegation',
        mockAgent,
        [],
        'test-session',
        undefined,
        undefined,
        undefined,
        undefined,
        expect.any(Function)
      );

      expect(result.content).toBe('Streamed response');
      expect(result.metadata.is_streaming).toBe(true);

      // Restore original method
      ClaudeServiceV2.generateStreamingResponse = originalGenerateStreamingResponse;
    });
  });

  describe('Conversation History Handling', () => {
    it('should include conversation history in streaming requests', async () => {
      const mockResponse = {
        content: 'Response with history',
        metadata: {
          model: 'claude-3-5-sonnet-20241022',
          token_count: 15,
          tool_results: []
        }
      };

      const { claudeAPIProxy } = require('../claudeAPIProxy');
      claudeAPIProxy.generateStreamingResponse.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user' as const, content: 'Previous user message' },
        { role: 'assistant' as const, content: 'Previous assistant response' }
      ];

      await ClaudeServiceV2.generateStreamingResponse(
        'Current message',
        mockAgent,
        conversationHistory,
        'test-session-with-history',
        undefined,
        undefined,
        undefined,
        undefined,
        () => {}
      );

      expect(claudeAPIProxy.generateStreamingResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'Previous user message' },
            { role: 'assistant', content: 'Previous assistant response' },
            { role: 'user', content: 'Current message' }
          ]
        }),
        expect.any(Function),
        undefined
      );
    });
  });
});
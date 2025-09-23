// Test to verify that streaming messages are properly persisted
// Copyright Mark Skiba, 2025 All rights reserved

import { renderHook, act } from '@testing-library/react';
import { useMessageHandling } from '../useMessageHandling';
import DatabaseService from '../../services/database';
import { ClaudeService } from '../../services/claudeService';

// Mock dependencies
jest.mock('../../services/database');
jest.mock('../../services/claudeService');
jest.mock('../../services/agentService');

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockClaudeService = ClaudeService as jest.Mocked<typeof ClaudeService>;

describe('useMessageHandling - Streaming Message Persistence Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database operations
    mockDatabaseService.addMessage.mockResolvedValue({
      id: 'test-message-id',
      content: 'Test message',
      role: 'assistant',
      created_at: new Date().toISOString(),
      agent_name: 'Test Agent'
    } as any);
    
    mockDatabaseService.getSessionMessages.mockResolvedValue([]);
    mockDatabaseService.updateSession.mockResolvedValue(null);
  });

  it('should persist streaming messages when Claude SDK cleanup success occurs', async () => {
    // This is the main fix - when streaming completes successfully but throws CLAUDE_SDK_CLEANUP_SUCCESS,
    // the AI message should still be persisted to the database
    
    mockClaudeService.generateResponse.mockRejectedValue(
      new Error('CLAUDE_SDK_CLEANUP_SUCCESS')
    );

    const { result } = renderHook(() => useMessageHandling());

    // Simulate a streaming response that was built up in the UI
    const mockMessages = [
      {
        id: '1',
        content: 'Hello',
        isUser: true,
        timestamp: new Date(),
        agentName: 'Test Agent'
      },
      {
        id: '2',
        content: 'This is a streaming response that should be persisted even with cleanup success',
        isUser: false,
        timestamp: new Date(),
        agentName: 'Test Agent'
      }
    ];

    const mockSetMessages = jest.fn();
    const mockSetIsLoading = jest.fn();
    const mockCreateNewSession = jest.fn().mockResolvedValue('test-session-id');
    const mockLoadUserSessions = jest.fn();
    const mockAddClaudeArtifacts = jest.fn();

    await act(async () => {
      await result.current.handleSendMessage(
        'Test message',
        mockMessages,
        mockSetMessages,
        mockSetIsLoading,
        'test-session-id',
        jest.fn(),
        jest.fn(),
        mockCreateNewSession,
        mockLoadUserSessions,
        true, // isAuthenticated
        'test-user-id',
        { agent_id: 'test-agent', agent_name: 'Test Agent' } as any,
        null, // currentRfp
        null, // currentArtifact
        { id: 'test-user', email: 'test@example.com' } as any,
        mockAddClaudeArtifacts,
        jest.fn() // handleAgentChanged
      );
    });

    // Verify that both user and AI messages were saved
    expect(mockDatabaseService.addMessage).toHaveBeenCalledTimes(2);
    
    // Check user message was saved first
    expect(mockDatabaseService.addMessage).toHaveBeenNthCalledWith(
      1,
      'test-session-id',
      'test-user-id',
      'Test message',
      'user',
      'test-agent',
      'Test Agent'
    );

    // Check AI message was saved even with cleanup success error
    expect(mockDatabaseService.addMessage).toHaveBeenNthCalledWith(
      2,
      'test-session-id',
      'test-user-id',
      expect.stringContaining('streaming response that should be persisted'),
      'assistant',
      undefined, // agent_id not available in cleanup scope
      'Test Agent',
      {},
      expect.objectContaining({
        is_streaming: true,
        stream_complete: true
      }),
      undefined // artifactRefs not available in cleanup scope
    );
  });

  it('should not persist empty messages during cleanup success', async () => {
    // Edge case: if there's no content in the AI message, it shouldn't be saved
    
    mockClaudeService.generateResponse.mockRejectedValue(
      new Error('CLAUDE_SDK_CLEANUP_SUCCESS')
    );

    const { result } = renderHook(() => useMessageHandling());

    // Simulate messages with empty AI response
    const mockMessages = [
      {
        id: '1',
        content: 'Hello',
        isUser: true,
        timestamp: new Date(),
        agentName: 'Test Agent'
      },
      {
        id: '2',
        content: '', // Empty content
        isUser: false,
        timestamp: new Date(),
        agentName: 'Test Agent'
      }
    ];

    const mockSetMessages = jest.fn();
    const mockSetIsLoading = jest.fn();
    const mockCreateNewSession = jest.fn().mockResolvedValue('test-session-id');
    const mockLoadUserSessions = jest.fn();
    const mockAddClaudeArtifacts = jest.fn();

    await act(async () => {
      await result.current.handleSendMessage(
        'Test message',
        mockMessages,
        mockSetMessages,
        mockSetIsLoading,
        'test-session-id',
        jest.fn(),
        jest.fn(),
        mockCreateNewSession,
        mockLoadUserSessions,
        true, // isAuthenticated
        'test-user-id',
        { agent_id: 'test-agent', agent_name: 'Test Agent' } as any,
        null, // currentRfp
        null, // currentArtifact
        { id: 'test-user', email: 'test@example.com' } as any,
        mockAddClaudeArtifacts,
        jest.fn() // handleAgentChanged
      );
    });

    // Should only save the user message, not the empty AI message
    expect(mockDatabaseService.addMessage).toHaveBeenCalledTimes(1);
    expect(mockDatabaseService.addMessage).toHaveBeenCalledWith(
      'test-session-id',
      'test-user-id',
      'Test message',
      'user',
      'test-agent',
      'Test Agent'
    );
  });
});
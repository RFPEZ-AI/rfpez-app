// Copyright Mark Skiba, 2025 All rights reserved
// Mock implementations for Claude API v3 testing

// Mock Claude API response for testing
export function createMockClaudeResponse(content: string, hasTools: boolean = false) {
  const contentArray: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: content
    }
  ];

  if (hasTools) {
    contentArray.push({
      type: 'tool_use',
      id: 'toolu_test_123',
      name: 'create_session',
      input: {
        user_id: 'test-user-id',
        title: 'Test Session'
      }
    });
  }

  return {
    id: 'msg_test_123',
    type: 'message',
    role: 'assistant',
    content: contentArray,
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: hasTools ? 'tool_use' : 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 50
    }
  };
}

// Mock streaming Claude API response
export function createMockClaudeStreamingResponse(chunks: string[]) {
  return chunks.map((chunk, index) => {
    if (index === 0) {
      return `data: ${JSON.stringify({
        type: 'message_start',
        message: {
          id: 'msg_test_123',
          type: 'message',
          role: 'assistant',
          content: [],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 100, output_tokens: 0 }
        }
      })}\n\n`;
    } else if (index === chunks.length - 1) {
      return `data: ${JSON.stringify({
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: chunks.length }
      })}\n\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`;
    } else {
      return `data: ${JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: chunk }
      })}\n\n`;
    }
  });
}

// Mock tool execution results
export const mockToolResults = {
  create_session: {
    success: true,
    data: {
      id: 'test-session-id',
      user_id: 'test-user-id',
      title: 'Test Session',
      created_at: new Date().toISOString()
    }
  },
  store_message: {
    success: true,
    data: {
      id: 'test-message-id',
      session_id: 'test-session-id',
      role: 'user',
      content: 'Test message',
      created_at: new Date().toISOString()
    }
  },
  get_conversation_history: {
    success: true,
    data: [
      {
        id: 'test-message-1',
        role: 'user',
        content: 'Hello',
        created_at: new Date(Date.now() - 10000).toISOString()
      },
      {
        id: 'test-message-2',
        role: 'assistant',
        content: 'Hi there!',
        created_at: new Date().toISOString()
      }
    ]
  }
};

// Mock Supabase database responses
export const mockDatabaseResponses = {
  sessions: {
    id: 'test-session-id',
    user_id: 'test-user-id',
    title: 'Test Session',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  messages: {
    id: 'test-message-id',
    session_id: 'test-session-id',
    role: 'user',
    content: 'Test message',
    created_at: new Date().toISOString(),
    agent_id: null
  },
  agents: {
    id: 'test-agent-id',
    name: 'Test Agent',
    instructions: 'You are a helpful test assistant.',
    access_level: 'public',
    created_at: new Date().toISOString()
  }
};

// Mock error responses
export const mockErrorResponses = {
  invalidAuth: {
    error: 'Invalid authorization header',
    code: 'INVALID_AUTH',
    timestamp: new Date().toISOString()
  },
  missingApiKey: {
    error: 'Missing Claude API key',
    code: 'MISSING_API_KEY',
    timestamp: new Date().toISOString()
  },
  claudeApiError: {
    error: 'Claude API request failed',
    code: 'CLAUDE_API_ERROR',
    details: 'Rate limit exceeded',
    timestamp: new Date().toISOString()
  },
  databaseError: {
    error: 'Database operation failed',
    code: 'DATABASE_ERROR',
    timestamp: new Date().toISOString()
  }
};
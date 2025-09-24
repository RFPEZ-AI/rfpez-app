// Copyright Mark Skiba, 2025 All rights reserved

// Development utility for testing Claude streaming + tool usage fixes
// This adds a test function to the global window object for browser console testing

import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';

// Simple streaming test function for development
const testClaudeStreamingInBrowser = async () => {
  console.log('🧪 Testing Claude streaming + tool usage fixes...');
  
  try {
    // Get default agent
    console.log('🔍 Step 1: Getting default agent...');
    const defaultAgent = await AgentService.getDefaultAgent();
    if (!defaultAgent) {
      console.error('❌ No default agent found');
      return { success: false, error: 'No default agent available' };
    }

    console.log('✅ Step 2: Default agent loaded:', defaultAgent.name, 'ID:', defaultAgent.id);

    // Test with a message that should trigger function calls
    const testMessage = "Please switch to the Technical Support agent and then respond with some additional text.";
    console.log('📤 Step 3: Sending test message:', testMessage);

    let streamedContent = '';
    const onChunk = (chunk: string, isComplete: boolean) => {
      if (!isComplete) {
        streamedContent += chunk;
        console.log('📡 Streaming chunk received:', chunk.substring(0, 50));
      } else {
        console.log('✅ Streaming completed, total content length:', streamedContent.length);
      }
    };

    console.log('🚀 Step 4: About to call Claude API with streaming enabled...');
    console.log('🔧 API Configuration check:', {
      hasApiKey: !!process.env.REACT_APP_CLAUDE_API_KEY,
      apiKeyLength: process.env.REACT_APP_CLAUDE_API_KEY?.length || 0,
      agentId: defaultAgent.id,
      streaming: true
    });

    const response = await ClaudeService.generateResponse(
      testMessage,
      defaultAgent,
      [], // empty conversation history
      undefined, // no session ID
      undefined, // no user profile
      null, // no current RFP
      null, // no current artifact
      undefined, // no abort signal
      true, // use streaming
      onChunk // streaming callback
    );

    console.log('🎉 STREAMING TEST COMPLETED SUCCESSFULLY!');
    console.log('📄 Final response content:', response.content.substring(0, 200) + '...');
    console.log('🔧 Functions called:', response.metadata.functions_called);
    console.log('📊 Response metadata:', {
      model: response.metadata.model,
      response_time: response.metadata.response_time,
      is_streaming: response.metadata.is_streaming,
      stream_complete: response.metadata.stream_complete,
      functions_executed: response.metadata.functions_called?.length || 0
    });

    return {
      success: true,
      content: response.content,
      metadata: response.metadata,
      streamedContentLength: streamedContent.length
    };

  } catch (error) {
    console.error('❌ STREAMING TEST FAILED:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }
};

// Add to global window object for browser console access
declare global {
  interface Window {
    __testClaudeStreaming: () => Promise<any>;
    __resetProcessingState?: () => void;
  }
}

// Only add in development mode
if (process.env.NODE_ENV === 'development') {
  window.__testClaudeStreaming = testClaudeStreamingInBrowser;
  console.log('🧪 Claude streaming test function added to window.__testClaudeStreaming');
}

export { testClaudeStreamingInBrowser };
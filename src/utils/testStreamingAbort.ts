// Test for streaming abort error handling
// This demonstrates the fix for APIUserAbortError in streaming responses

import { ClaudeService } from '../services/claudeService';

// Mock test to verify error handling
export const testStreamingAbortHandling = async () => {
  console.log('Testing streaming abort error handling...');
  
  // Mock agent for testing
  const testAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    instructions: 'Test instructions',
    created_at: '',
    updated_at: '',
    user_id: '',
    is_active: true,
    initial_prompt: '',
    is_default: false,
    is_restricted: false,
    is_free: true,
    sort_order: 0,
    description: '',
    avatar_url: '',
    metadata: {}
  };

  // Create abort controller that will be aborted immediately
  const abortController = new AbortController();
  
  try {
    // Start a streaming request and immediately abort it
    const responsePromise = ClaudeService.generateResponse(
      'Tell me a very long story',
      testAgent,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      abortController.signal,
      true, // Enable streaming
      (chunk: string, isComplete: boolean) => {
        console.log('Received chunk:', chunk.length, 'chars, complete:', isComplete);
      }
    );

    // Abort the request immediately
    setTimeout(() => {
      console.log('Aborting request...');
      abortController.abort();
    }, 100);

    await responsePromise;
    
    console.log('❌ Expected request to be aborted');
    return false;
    
  } catch (error) {
    console.log('Caught error:', error);
    
    // Verify we get the clean cancellation error, not APIUserAbortError
    if (error instanceof Error && error.message === 'Request was cancelled') {
      console.log('✅ Abort error handled correctly');
      return true;
    } else {
      console.log('❌ Unexpected error type:', error);
      return false;
    }
  }
};

// Export for potential use in debug components
export default testStreamingAbortHandling;
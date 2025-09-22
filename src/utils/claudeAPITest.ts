// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Simple Claude API health check utility
 */

import { ClaudeService } from '../services/claudeService';

export const testClaudeAPIAvailability = async (): Promise<{
  available: boolean;
  status: string;
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Claude API availability...');
    
    // Simple test message that should get a quick response
    const testResponse = await ClaudeService.generateResponse(
      'Hello, please respond with just "API_TEST_OK"',
      {
        id: 'test',
        name: 'Test Agent',
        instructions: 'You are a test agent. Respond briefly.',
        initial_prompt: 'Testing API availability',
        is_active: true,
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      [], // No conversation history
      undefined, // No session ID
      undefined, // No user profile
      null, // No RFP context
      null, // No artifact context
      new AbortController().signal,
      false // No streaming for this test
    );
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Claude API test successful');
    console.log('📊 Response time:', responseTime + 'ms');
    console.log('📝 Response content:', testResponse.content.substring(0, 100));
    
    return {
      available: true,
      status: 'Available',
      responseTime,
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Claude API test failed');
    console.error('📊 Time to failure:', responseTime + 'ms');
    console.error('🚨 Error:', errorMessage);
    
    // Categorize the error
    let status = 'Unavailable';
    if (errorMessage.includes('overload') || errorMessage.includes('rate limit')) {
      status = 'Overloaded';
    } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      status = 'Authentication Error';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      status = 'Network Error';
    } else if (errorMessage.includes('abort') || errorMessage.includes('cancel')) {
      status = 'Request Cancelled';
    }
    
    return {
      available: false,
      status,
      responseTime,
      error: errorMessage
    };
  }
};

// Global function for browser console testing
declare global {
  interface Window {
    testClaudeAPI?: typeof testClaudeAPIAvailability;
    checkClaudeAPI?: () => Promise<unknown>;
  }
}

(window as Window).testClaudeAPI = testClaudeAPIAvailability;

// Also add a simpler version that logs results
(window as Window).checkClaudeAPI = async () => {
  console.log('🔍 Checking Claude API availability...');
  const result = await testClaudeAPIAvailability();
  
  if (result.available) {
    console.log('✅ Claude API is AVAILABLE');
    console.log(`📊 Response time: ${result.responseTime}ms`);
  } else {
    console.log('❌ Claude API is UNAVAILABLE');
    console.log(`🚨 Status: ${result.status}`);
    console.log(`📊 Time to failure: ${result.responseTime}ms`);
    if (result.error) {
      console.log(`💥 Error: ${result.error}`);
    }
  }
  
  return result;
};
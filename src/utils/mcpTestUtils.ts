// Copyright Mark Skiba, 2025 All rights reserved

// MCP Test Utilities
// Test utilities to verify Supabase MCP server availability

import { mcpClient } from '../services/mcpClient';

export interface MCPTestResult {
  mcpAvailable: boolean;
  fallbackUsed: boolean;
  responseTime: number;
  error?: string;
  details: string;
  testSteps: Array<{
    step: string;
    success: boolean;
    duration: number;
    error?: string;
  }>;
}

export const testClaudeMCPAvailability = async (): Promise<MCPTestResult> => {
  const startTime = Date.now();
  const testSteps: Array<{
    step: string;
    success: boolean;
    duration: number;
    error?: string;
  }> = [];

  console.log('🧪 Starting MCP availability test...');

  try {
    // Step 1: Initialize MCP client
    const step1Start = Date.now();
    try {
      await mcpClient.initialize();
      testSteps.push({
        step: 'Initialize MCP Client',
        success: true,
        duration: Date.now() - step1Start
      });
      console.log('✅ Step 1: MCP client initialized successfully');
    } catch (error) {
      testSteps.push({
        step: 'Initialize MCP Client',
        success: false,
        duration: Date.now() - step1Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 2: List available tools
    const step2Start = Date.now();
    try {
      const tools = await mcpClient.listTools();
      testSteps.push({
        step: 'List MCP Tools',
        success: true,
        duration: Date.now() - step2Start
      });
      console.log('✅ Step 2: Found MCP tools:', tools.length);
    } catch (error) {
      testSteps.push({
        step: 'List MCP Tools',
        success: false,
        duration: Date.now() - step2Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 3: Create a test session
    const step3Start = Date.now();
    let testSessionId: string;
    try {
      const testSession = await mcpClient.createSession(
        "MCP Test Session", 
        "Testing MCP availability from test utils"
      );
      testSessionId = testSession.session_id;
      testSteps.push({
        step: 'Create Test Session',
        success: true,
        duration: Date.now() - step3Start
      });
      console.log('✅ Step 3: Test session created:', testSessionId);
    } catch (error) {
      testSteps.push({
        step: 'Create Test Session',
        success: false,
        duration: Date.now() - step3Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 4: Store a test message
    const step4Start = Date.now();
    try {
      await mcpClient.storeMessage(
        testSessionId,
        "Test message for MCP availability check - " + new Date().toISOString(),
        "user"
      );
      testSteps.push({
        step: 'Store Test Message',
        success: true,
        duration: Date.now() - step4Start
      });
      console.log('✅ Step 4: Test message stored');
    } catch (error) {
      testSteps.push({
        step: 'Store Test Message',
        success: false,
        duration: Date.now() - step4Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 5: Retrieve conversation history
    const step5Start = Date.now();
    try {
      const history = await mcpClient.getConversationHistory(testSessionId, 10, 0);
      testSteps.push({
        step: 'Get Conversation History',
        success: true,
        duration: Date.now() - step5Start
      });
      console.log('✅ Step 5: Retrieved conversation history:', history.messages.length, 'messages');
    } catch (error) {
      testSteps.push({
        step: 'Get Conversation History',
        success: false,
        duration: Date.now() - step5Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 6: Get recent sessions
    const step6Start = Date.now();
    try {
      const recentSessions = await mcpClient.getRecentSessions(5);
      testSteps.push({
        step: 'Get Recent Sessions',
        success: true,
        duration: Date.now() - step6Start
      });
      console.log('✅ Step 6: Retrieved recent sessions:', recentSessions.sessions.length, 'sessions');
    } catch (error) {
      testSteps.push({
        step: 'Get Recent Sessions',
        success: false,
        duration: Date.now() - step6Start,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    const totalResponseTime = Date.now() - startTime;
    
    console.log('🎉 MCP test completed successfully in', totalResponseTime, 'ms');
    
    return {
      mcpAvailable: true,
      fallbackUsed: false,
      responseTime: totalResponseTime,
      details: `All MCP operations successful. Total time: ${totalResponseTime}ms. ${testSteps.length} steps completed.`,
      testSteps
    };
    
  } catch (error) {
    const totalResponseTime = Date.now() - startTime;
    
    console.error('❌ MCP test failed:', error);
    
    return {
      mcpAvailable: false,
      fallbackUsed: true,
      responseTime: totalResponseTime,
      error: error instanceof Error ? error.message : String(error),
      details: `MCP server unavailable after ${totalResponseTime}ms. HTTP fallback will be used. Failed at step: ${testSteps.reverse().find(s => !s.success)?.step || 'Unknown'}`,
      testSteps
    };
  }
};

// Quick test function for browser console
export const quickMCPTest = async (): Promise<boolean> => {
  try {
    console.log('🧪 Quick MCP test starting...');
    
    // Test MCP tools list
    const tools = await mcpClient.listTools();
    console.log('📋 Available MCP tools:', tools?.length || 0);
    
    // Test session creation
    const session = await mcpClient.createSession('Quick Console Test', 'Quick MCP test from console');
    console.log('✅ MCP Session created:', session?.session_id);
    
    console.log('🎉 Quick MCP test passed!');
    return true;
  } catch (error) {
    console.error('❌ Quick MCP test failed:', error);
    return false;
  }
};

// Make functions available globally for console testing
declare global {
  interface Window {
    mcpClient: typeof mcpClient;
    quickMCPTest: typeof quickMCPTest;
    testClaudeMCPAvailability: typeof testClaudeMCPAvailability;
  }
}

// Auto-expose to window for debugging
if (typeof window !== 'undefined') {
  window.mcpClient = mcpClient;
  window.quickMCPTest = quickMCPTest;
  window.testClaudeMCPAvailability = testClaudeMCPAvailability;
}

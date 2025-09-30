// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// Claude MCP Test Utilities
// Test Claude's ability to use MCP functions

export const MCP_TEST_PROMPT = `
Please help me test the MCP integration by doing the following:

1. Get my recent conversation sessions (use get_recent_sessions function with limit 5)
2. Tell me how many sessions you found and show me their titles
3. If you found any sessions, get the conversation history for the most recent one (use get_conversation_history)
4. Create a new test session called "MCP Integration Test" (use create_session function)
5. Store a test message in that session (use store_message function)
6. Search for messages containing the word "test" (use search_messages function)

This comprehensive test will verify that you can access all the Supabase MCP server functions for conversation management.

Please provide detailed feedback on each step, including:
- Whether each function call succeeded
- What data you received
- Any errors encountered
- Performance observations

This helps us verify the MCP integration is working properly.
`;

export const MCP_SIMPLE_TEST_PROMPT = `
Quick MCP test: Please use the get_recent_sessions function to show me my recent conversation sessions. This will test if you can access the Supabase MCP server.
`;

export const MCP_CONVERSATION_TEST_PROMPT = `
Let's test conversation management via MCP:

1. First, get my recent sessions using get_recent_sessions
2. Then create a new session called "Conversation Test Session" 
3. Store a message in that session saying "Testing MCP conversation storage"
4. Retrieve the conversation history to confirm it was stored

Please tell me the results of each step.
`;

export const sendMCPTestMessage = async (
  handleSendMessage: (content: string) => Promise<void>,
  testType: 'comprehensive' | 'simple' | 'conversation' = 'comprehensive'
): Promise<void> => {
  console.log(`🧪 Sending ${testType} MCP test prompt to Claude...`);
  
  let prompt: string;
  switch (testType) {
    case 'simple':
      prompt = MCP_SIMPLE_TEST_PROMPT;
      break;
    case 'conversation':
      prompt = MCP_CONVERSATION_TEST_PROMPT;
      break;
    case 'comprehensive':
    default:
      prompt = MCP_TEST_PROMPT;
      break;
  }
  
  await handleSendMessage(prompt);
};

export const analyzeMCPLogs = (): {
  mcpAttempts: number;
  mcpSuccesses: number;
  mcpFailures: number;
  fallbacksUsed: number;
  lastError?: string;
} => {
  // Manual analysis helper since we can't access console history directly
  const mcpAttempts = 0;
  const mcpSuccesses = 0;
  const mcpFailures = 0;
  const fallbacksUsed = 0;
  let lastError: string | undefined;

  // Provide instructions for manual analysis
  console.log('🔍 MCP Log Analysis:');
  console.log('To manually check MCP integration:');
  console.log('1. Look for: 🔗 Attempting MCP client for function: [function_name]');
  console.log('2. Look for: ✅ MCP client success for [function_name]');
  console.log('3. Look for: ❌ MCP client failed for [function_name], falling back to HTTP');
  console.log('4. Check Network tab for calls to /functions/v1/mcp-server');

  return {
    mcpAttempts,
    mcpSuccesses,
    mcpFailures,
    fallbacksUsed,
    lastError
  };
};

// Helper to monitor MCP function calls in real-time
export class MCPMonitor {
  private static logs: Array<{
    timestamp: Date;
    type: 'attempt' | 'success' | 'failure' | 'fallback';
    functionName: string;
    details?: string;
  }> = [];

  static logAttempt(functionName: string, details?: string) {
    // DISABLED: Excessive logging causes memory pressure
    // this.logs.push({
    //   timestamp: new Date(),
    //   type: 'attempt',
    //   functionName,
    //   details
    // });
    // console.log(`🔗 MCP Attempt: ${functionName}`, details);
  }

  static logSuccess(functionName: string, details?: string) {
    // DISABLED: Excessive logging causes memory pressure
    // this.logs.push({
    //   timestamp: new Date(),
    //   type: 'success',
    //   functionName,
    //   details
    // });
    // console.log(`✅ MCP Success: ${functionName}`, details);
  }

  static logFailure(functionName: string, error: string) {
    // DISABLED: Excessive logging causes memory pressure  
    // this.logs.push({
    //   timestamp: new Date(),
    //   type: 'failure',
    //   functionName,
    //   details: error
    // });
    // console.log(`❌ MCP Failure: ${functionName}`, error);
  }

  static logFallback(functionName: string, details?: string) {
    // DISABLED: Excessive logging causes memory pressure
    // this.logs.push({
    //   timestamp: new Date(),
    //   type: 'fallback',
    //   functionName,
    //   details
    // });
    // console.log(`🔄 MCP Fallback: ${functionName}`, details);
  }

  static getReport() {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => log.timestamp >= last5Minutes);
    
    const attempts = recentLogs.filter(log => log.type === 'attempt').length;
    const successes = recentLogs.filter(log => log.type === 'success').length;
    const failures = recentLogs.filter(log => log.type === 'failure').length;
    const fallbacks = recentLogs.filter(log => log.type === 'fallback').length;
    
    const report = {
      timeframe: '5 minutes',
      attempts,
      successes,
      failures,
      fallbacks,
      successRate: attempts > 0 ? (successes / attempts * 100).toFixed(1) + '%' : '0%',
      logs: recentLogs
    };

    console.table(report);
    return report;
  }

  static clearLogs() {
    this.logs = [];
    console.log('🧹 MCP monitor logs cleared');
  }
}

// Make MCP monitor available globally
declare global {
  interface Window {
    MCPMonitor: typeof MCPMonitor;
  }
}

if (typeof window !== 'undefined') {
  window.MCPMonitor = MCPMonitor;
}

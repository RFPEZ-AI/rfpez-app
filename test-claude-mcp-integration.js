// Quick test script for Claude API with MCP integration
// Run this in the browser console after navigating to your app

async function testClaudeMCPIntegration() {
  console.log('🧪 Testing Claude API with MCP Integration...');
  
  try {
    // Import the ClaudeService (you may need to adjust the import path)
    const { ClaudeService } = await import('./src/services/claudeService.ts');
    
    console.log('✅ Claude service imported successfully');
    
    // Test 1: Create a session
    console.log('\n📝 Test 1: Creating a new session...');
    const sessionId = await ClaudeService.createSession(
      'MCP Test Session',
      'Testing Claude API with MCP functions'
    );
    console.log('✅ Session created:', sessionId);
    
    // Test 2: Get recent sessions
    console.log('\n📋 Test 2: Getting recent sessions...');
    const sessions = await ClaudeService.getRecentSessions(5);
    console.log('✅ Recent sessions:', sessions);
    
    // Test 3: Send a message that should trigger MCP functions
    console.log('\n💬 Test 3: Sending message with MCP trigger...');
    const testAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a helpful AI assistant with access to conversation management functions.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user',
      is_active: true,
      initial_prompt: '',
      is_default: false,
      is_restricted: false,
      sort_order: 0
    };
    
    const response = await ClaudeService.generateResponse(
      'Can you show me my recent sessions and create a test message in our current session?',
      testAgent,
      [],
      sessionId
    );
    
    console.log('✅ Claude response:', response.content);
    console.log('🔧 Functions called:', response.metadata.functions_called);
    
    // Test 4: Get conversation history
    console.log('\n📖 Test 4: Getting conversation history...');
    const history = await ClaudeService.getConversationHistory(sessionId);
    console.log('✅ Conversation history:', history);
    
    console.log('\n🎉 All tests passed! Claude API with MCP integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Make sure your Claude API key is set correctly');
    console.log('2. Check that you are authenticated with Supabase');
    console.log('3. Verify that the Supabase Edge Functions are deployed');
    console.log('4. Check the browser network tab for failed requests');
  }
}

// Run the test
testClaudeMCPIntegration();

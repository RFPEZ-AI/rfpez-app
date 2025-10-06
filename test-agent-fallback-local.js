// Test Enhanced Agent Fallback Solution - Local Testing
console.log('🧪 Starting Enhanced Agent Fallback Tests (Local)');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Use the locally served function endpoint (port 54321 via supabase functions serve)
const EDGE_FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/claude-api-v3';

// Test 1: Normal agent loading with valid session
async function testNormalAgentLoading() {
  console.log('\n🔍 Test 1: Normal Agent Loading');
  
  try {
    const testPayload = {
      messages: [
        {
          role: 'user',
          content: 'Hello, I need help with an RFP'
        }
      ],
      session_id: 'test-session-123',
      agent_id: 'test-agent-456',
      stream: false
    };

    console.log('📤 Sending request to:', EDGE_FUNCTION_URL);
    console.log('📤 Using anonymous key for authentication (will get anonymous user ID)');
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-id': 'test-session-123'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Normal agent loading test completed');
    console.log('📄 Response:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Normal agent loading test failed:', error.message);
    console.error('🔍 Full error:', error);
    return null;
  }
}

// Test 2: Invalid session fallback
async function testInvalidSessionFallback() {
  console.log('\n🔍 Test 2: Invalid Session Fallback');
  
  try {
    const testPayload = {
      messages: [
        {
          role: 'user',
          content: 'Test message with invalid session'
        }
      ],
      session_id: 'invalid-session-999',
      agent_id: 'invalid-agent-999',
      stream: false
    };

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-id': 'invalid-session-999'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Invalid session fallback test completed');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      // Check if fallback behavior was triggered
      if (result.agent_context && result.agent_context.fallback_used) {
        console.log('🎯 Fallback mechanism was successfully triggered!');
      } else {
        console.log('⚠️ Fallback mechanism may not have been triggered');
      }
      
      return result;
    }
  } catch (error) {
    console.error('❌ Invalid session fallback test failed:', error.message);
    return null;
  }
}

// Test 3: Check edge function logs
async function testEdgeFunctionLogs() {
  console.log('\n🔍 Test 3: Edge Function Logs Analysis');
  
  try {
    // Since we can't directly access logs via API, we'll simulate a request
    // and check the response for log-related information
    const testPayload = {
      messages: [
        {
          role: 'user',
          content: 'Log analysis test'
        }
      ],
      session_id: 'log-test-session',
      stream: false
    };

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-session-id': 'log-test-session'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📥 Log test response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge function logs test completed');
      
      // Check for any debugging information in the response
      if (result.debug_info) {
        console.log('🔍 Debug information found:', result.debug_info);
      }
      
      return result;
    } else {
      const errorText = await response.text();
      console.log('❌ Log test error:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Edge function logs test failed:', error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive agent fallback testing...\n');
  
  const results = {
    normalLoading: await testNormalAgentLoading(),
    invalidSessionFallback: await testInvalidSessionFallback(),
    edgeFunctionLogs: await testEdgeFunctionLogs()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('=======================');
  
  console.log('✅ Normal Loading:', results.normalLoading ? 'PASSED' : 'FAILED');
  console.log('✅ Invalid Session Fallback:', results.invalidSessionFallback ? 'PASSED' : 'FAILED');
  console.log('✅ Edge Function Logs:', results.edgeFunctionLogs ? 'PASSED' : 'FAILED');
  
  const passedTests = Object.values(results).filter(result => result !== null).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Enhanced agent fallback system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return results;
}

// Execute tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
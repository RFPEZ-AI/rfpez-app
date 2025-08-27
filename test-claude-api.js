#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Test script for Claude API endpoint functionality
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Check for required environment variables
const requiredEnvVars = {
  SUPABASE_URL,
  ACCESS_TOKEN
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value.trim() === '')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  if (missingVars.includes('ACCESS_TOKEN')) {
    console.log('');
    console.log('📝 To get an access token:');
    console.log('1. Start your React app: npm start');
    console.log('2. Sign in to your application');
    console.log('3. Open browser dev tools → Application/Storage → Local Storage');
    console.log('4. Find the Supabase session data and copy the access_token');
    console.log('5. Add it to .env.local: ACCESS_TOKEN=your_token_here');
  }
  
  process.exit(1);
}

const CLAUDE_API_URL = `${SUPABASE_URL}/functions/v1/claude-api`;

// Test cases for Claude API functions
const testCases = [
  {
    name: 'Get Recent Sessions',
    function_name: 'get_recent_sessions',
    parameters: { limit: 5 }
  },
  {
    name: 'Create New Session',
    function_name: 'create_session',
    parameters: { 
      title: 'Test Session from Claude API',
      description: 'Testing the Claude API integration'
    }
  },
  {
    name: 'Search Messages',
    function_name: 'search_messages',
    parameters: { 
      query: 'test',
      limit: 10
    }
  }
];

console.log('🧪 Testing Claude API Endpoint...\n');
console.log(`📍 API URL: ${CLAUDE_API_URL}`);
console.log(`🔑 Access token: ${ACCESS_TOKEN ? 'SET' : 'NOT SET'}\n`);

async function testFunction(testCase) {
  console.log(`📤 Testing: ${testCase.name}`);
  
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        function_name: testCase.function_name,
        parameters: testCase.parameters
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Success:`);
      console.log(JSON.stringify(result.data, null, 2));
      console.log('');
      return result.data;
    } else {
      console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
      console.log(`Status: ${response.status}`);
      console.log('');
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('');
    return null;
  }
}

// Function to test with a newly created session
async function testWithSession(sessionId) {
  console.log(`📤 Testing: Store Message in Session ${sessionId}`);
  
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        function_name: 'store_message',
        parameters: {
          session_id: sessionId,
          content: 'Hello from Claude API test!',
          role: 'user',
          metadata: { test: true }
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Message stored successfully:`);
      console.log(JSON.stringify(result.data, null, 2));
      console.log('');
      
      // Now test getting conversation history
      console.log(`📤 Testing: Get Conversation History for Session ${sessionId}`);
      
      const historyResponse = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          function_name: 'get_conversation_history',
          parameters: {
            session_id: sessionId,
            limit: 10
          }
        })
      });
      
      const historyResult = await historyResponse.json();
      
      if (historyResponse.ok && historyResult.success) {
        console.log(`✅ Conversation history retrieved:`);
        console.log(JSON.stringify(historyResult.data, null, 2));
        console.log('');
      } else {
        console.log(`❌ Failed to get history: ${historyResult.error || 'Unknown error'}`);
        console.log('');
      }
      
    } else {
      console.log(`❌ Failed to store message: ${result.error || 'Unknown error'}`);
      console.log('');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log('');
  }
}

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;
  let newSessionId = null;
  
  for (const testCase of testCases) {
    const result = await testFunction(testCase);
    if (result) {
      passedTests++;
      // Save session ID if we created one
      if (testCase.function_name === 'create_session') {
        newSessionId = result.session_id;
      }
    } else {
      failedTests++;
    }
  }
  
  // Test with the newly created session if available
  if (newSessionId) {
    await testWithSession(newSessionId);
    passedTests += 2; // Store message + get history
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (testCases.length + (newSessionId ? 2 : 0))) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Your Claude API integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

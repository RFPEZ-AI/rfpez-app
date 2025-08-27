#!/usr/bin/env node

/**
 * Test script for Supabase MCP Functions
 * Tests both the MCP server and Claude API endpoints
 */

const https = require('https');

// Configuration - Update these with your actual values
const SUPABASE_PROJECT_ID = 'jxlutaztoukwbbgtoulc';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlZnK1RuWTg4YzZyRU1neFgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2p4bHV0YXp0b3Vrd2JiZ3RvdWxjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmNWU2MmY5Yy02MWY1LTQ5YjMtYWQxOC03ZTA4ZTRlZWJiN2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2MjY1MTIzLCJpYXQiOjE3NTYyNjE1MjMsImVtYWlsIjoibWFya0Blc3BoZXJlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnppUE04ZW1KLXNSWnNBWXJ2VG43VzJOMG40N0tsRnZianNlVnloQVBqb0pQanpzdz1zOTYtYyIsImN1c3RvbV9jbGFpbXMiOnsiaGQiOiJlc3BoZXJlLmNvbSJ9LCJlbWFpbCI6Im1hcmtAZXNwaGVyZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTWFyayBTa2liYSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJNYXJrIFNraWJhIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnppUE04ZW1KLXNSWnNBWXJ2VG43VzJOMG40N0tsRnZianNlVnloQVBqb0pQanpzdz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTA1NzIxNzQwMjM5MzUwNjY1NjI4Iiwic3ViIjoiMTA1NzIxNzQwMjM5MzUwNjY1NjI4In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NTYyNjE1MjN9XSwic2Vzc2lvbl9pZCI6ImE1NWZmOTE4LTgyNTEtNGVjNS04NTcyLTFiYjI2MWU2YjZmNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.1CrzD6h5gMJMePE1hMxt5fIgY6cnQyZfQ4ive8ZebLo'; // Get this from the web UI

// Test functions
const testFunctions = {
  
  // Test MCP server endpoint
  async testMCPServer(sessionId = null) {
    console.log('\n🔍 Testing MCP Server...');
    
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: sessionId ? 'get_conversation_history' : 'get_recent_sessions',
        arguments: sessionId ? {
          session_id: sessionId,
          limit: 5
        } : {
          limit: 5
        }
      }
    };

    return this.makeRequest('/functions/v1/mcp-server', mcpRequest);
  },

  // Test Claude API endpoint
  async testClaudeAPI() {
    console.log('\n🔍 Testing Claude API...');
    
    const claudeRequest = {
      function_name: 'get_recent_sessions',
      limit: 5
    };

    return this.makeRequest('/functions/v1/claude-api', claudeRequest);
  },

  // Test session creation via MCP
  async testCreateSession() {
    console.log('\n🔍 Testing Session Creation...');
    
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'create_session',
        arguments: {
          title: 'Test Session ' + new Date().toISOString(),
          description: 'Created by test script'
        }
      }
    };

    return this.makeRequest('/functions/v1/mcp-server', mcpRequest);
  },

  // Generic request helper
  makeRequest(path, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: `${SUPABASE_PROJECT_ID}.supabase.co`,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            console.log(`✅ Status: ${res.statusCode}`);
            console.log(`📄 Response:`, JSON.stringify(response, null, 2));
            resolve(response);
          } catch (error) {
            console.log(`❌ Failed to parse JSON response`);
            console.log(`📄 Raw response:`, responseData);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Request failed:`, error.message);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }
};

// Main test runner
async function runTests() {
  console.log('🚀 Starting MCP Function Tests...');
  console.log(`🔗 Target: ${SUPABASE_URL}`);
  
  if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.log('\n❌ Please update the ACCESS_TOKEN in this script!');
    console.log('   1. Go to http://localhost:3000/mcp-test');
    console.log('   2. Sign in to your app');
    console.log('   3. Copy the access token from the Authentication Info card');
    console.log('   4. Replace YOUR_ACCESS_TOKEN_HERE in this script');
    return;
  }

  try {
    // Test session creation first
    const sessionResult = await testFunctions.testCreateSession();
    let createdSessionId = null;
    
    // Extract session ID from the created session
    if (sessionResult && sessionResult.result && sessionResult.result.content) {
      try {
        const sessionData = JSON.parse(sessionResult.result.content[0].text);
        createdSessionId = sessionData.session_id;
        console.log(`✅ Created session ID: ${createdSessionId}`);
      } catch (e) {
        console.log('⚠️  Could not parse session ID from response');
      }
    }
    
    // Test MCP server with recent sessions
    await testFunctions.testMCPServer();
    
    // Test Claude API
    await testFunctions.testClaudeAPI();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = testFunctions;

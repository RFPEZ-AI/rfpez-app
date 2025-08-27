#!/usr/bin/env node

// Test script for MCP client functionality
const { spawn } = require('child_process');
const path = require('path');

// Test the MCP client with sample requests
const testRequests = [
  {
    name: 'Initialize',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {} },
        clientInfo: { name: 'Test Client', version: '1.0.0' }
      }
    }
  },
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }
  },
  {
    name: 'List Resources',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list'
    }
  }
];

console.log('🧪 Testing MCP Client...\n');

// Check if environment variables are set
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ACCESS_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease set these variables and try again.');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);
console.log(`🔑 Access token: ${process.env.ACCESS_TOKEN ? 'SET' : 'NOT SET'}\n`);

// Function to test a single request
function testRequest(testCase, index) {
  return new Promise((resolve, reject) => {
    console.log(`📤 Test ${index + 1}: ${testCase.name}`);
    
    const child = spawn('node', ['mcp-client.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const response = JSON.parse(output.trim());
          console.log(`📥 Response:`, JSON.stringify(response, null, 2));
          console.log('✅ Test passed\n');
          resolve(response);
        } catch (parseError) {
          console.log(`❌ Failed to parse response: ${parseError.message}`);
          console.log(`Raw output: ${output}`);
          reject(parseError);
        }
      } else {
        console.log(`❌ Test failed with code ${code}`);
        if (errorOutput) {
          console.log(`Error output: ${errorOutput}`);
        }
        if (output) {
          console.log(`Raw output: ${output}`);
        }
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ Failed to start process: ${error.message}`);
      reject(error);
    });
    
    // Send the test request
    child.stdin.write(JSON.stringify(testCase.request) + '\n');
    child.stdin.end();
    
    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Test timed out after 10 seconds'));
    }, 10000);
  });
}

// Run all tests sequentially
async function runTests() {
  let passedTests = 0;
  let failedTests = 0;
  
  for (let i = 0; i < testRequests.length; i++) {
    try {
      await testRequest(testRequests[i], i);
      passedTests++;
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}\n`);
      failedTests++;
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testRequests.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Your MCP connector is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

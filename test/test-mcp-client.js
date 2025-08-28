#!/usr/bin/env node

/**
 * MCP Client Test Script
 * Tests the MCP client locally before Claude Desktop integration
 */

const { spawn } = require('child_process');
const path = require('path');

// Test the MCP client
async function testMCPClient() {
  console.log('🧪 Testing MCP Client...\n');
  
  // Set environment variables
  const env = {
    ...process.env,
    SUPABASE_URL: 'https://jxlutaztoukwbbgtoulc.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM',
    ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlZnK1RuWTg4YzZyRU1neFgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2p4bHV0YXp0b3Vrd2JiZ3RvdWxjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmNWU2MmY5Yy02MWY1LTQ5YjMtYWQxOC03ZTA4ZTRlZWJiN2YiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2MjY1MTIzLCJpYXQiOjE3NTYyNjE1MjMsImVtYWlsIjoibWFya0Blc3BoZXJlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnppUE04ZW1KLXNSWnNBWXJ2VG43VzJOMG40N0tsRnZianNlVnloQVBqb0pQanpzdz1zOTYtYyIsImN1c3RvbV9jbGFpbXMiOnsiaGQiOiJlc3BoZXJlLmNvbSJ9LCJlbWFpbCI6Im1hcmtAZXNwaGVyZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTWFyayBTa2liYSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJNYXJrIFNraWJhIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnppUE04ZW1KLXNSWnNBWXJ2VG43VzJOMG40N0tsRnZianNlVnloQVBqb0pQanpzdz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTA1NzIxNzQwMjM5MzUwNjY1NjI4Iiwic3ViIjoiMTA1NzIxNzQwMjM5MzUwNjY1NjI4In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3NTYyNjE1MjN9XSwic2Vzc2lvbl9pZCI6ImE1NWZmOTE4LTgyNTEtNGVjNS04NTcyLTFiYjI2MWU2YjZmNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.1CrzD6h5gMJMePE1hMxt5fIgY6cnQyZfQ4ive8ZebLo'
  };
  
  // Spawn the MCP client
  const mcpClient = spawn('node', ['mcp-client.js'], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responses = [];
  let currentTest = 0;
  
  mcpClient.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        console.log(`✅ Test ${currentTest + 1} Response:`, JSON.stringify(response, null, 2));
      } catch (e) {
        console.log(`Raw output: ${line}`);
      }
    }
  });
  
  mcpClient.stderr.on('data', (data) => {
    console.error(`❌ Error: ${data}`);
  });
  
  // Test sequence
  const tests = [
    {
      name: 'Initialize',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
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
      name: 'Get Recent Sessions',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_recent_sessions',
          arguments: { limit: 5 }
        }
      }
    }
  ];
  
  // Send tests one by one
  for (const test of tests) {
    console.log(`\n🔍 Running: ${test.name}`);
    mcpClient.stdin.write(JSON.stringify(test.request) + '\n');
    currentTest++;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Wait for responses
  setTimeout(() => {
    mcpClient.kill();
    console.log('\n✅ MCP Client tests completed!');
    console.log(`📊 Total responses received: ${responses.length}`);
  }, 3000);
}

testMCPClient().catch(console.error);

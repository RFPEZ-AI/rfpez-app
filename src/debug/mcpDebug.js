// Copyright Mark Skiba, 2025 All rights reserved

// MCP Debug Console Utility
// Use this in the browser console to debug MCP issues

window.mcpDebug = {
  // Check environment variables
  checkEnv() {
    console.log('🔍 Environment Check:');
    // In browser environment, environment variables are replaced at build time
    const supabaseUrl = 'https://jxlutaztoukwbbgtoulc.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM';
    const hasAnonKey = anonKey ? 'Present' : 'Missing';
    
    console.log('REACT_APP_SUPABASE_URL:', supabaseUrl);
    console.log('REACT_APP_SUPABASE_ANON_KEY:', hasAnonKey);
    
    const mcpUrl = `${supabaseUrl}/functions/v1/supabase-mcp-server`;
    console.log('Computed MCP URL:', mcpUrl);
    
    return { supabaseUrl, mcpUrl };
  },
  
  // Check authentication
  async checkAuth() {
    console.log('🔐 Authentication Check:');
    
    // Check Supabase session
    const { supabase } = await import('../supabaseClient');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Supabase session:', session ? 'Present' : 'Missing');
    console.log('Access token:', session?.access_token ? 'Present' : 'Missing');
    console.log('Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
    console.log('Auth error:', error);
    
    return session;
  },
  
  // Test direct MCP server connectivity
  async testMCPConnection() {
    console.log('🌐 MCP Connection Test:');
    
    const { supabaseUrl } = this.checkEnv();
    const session = await this.checkAuth();
    
    if (!session?.access_token) {
      console.error('❌ No access token available');
      return false;
    }
    
    const mcpUrl = `${supabaseUrl}/functions/v1/supabase-mcp-server`;
    console.log('Testing URL:', mcpUrl);
    
    const testRequest = {
      jsonrpc: '2.0',
      id: 'debug-test',
      method: 'tools/list'
    };
    
    try {
      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(testRequest)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        return false;
      }
      
      const data = await response.json();
      console.log('✅ MCP Response:', data);
      
      if (data.result?.tools) {
        console.log(`📋 Available tools: ${data.result.tools.length}`);
        data.result.tools.forEach(tool => console.log(`  - ${tool.name}: ${tool.description}`));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Connection Error:', error);
      return false;
    }
  },
  
  // Test MCP client initialization
  async testMCPClient() {
    console.log('🧪 MCP Client Test:');
    
    try {
      const { mcpClient } = await import('../services/mcpClient');
      console.log('MCP Client imported successfully');
      
      // Test initialization
      console.log('Testing initialization...');
      const initResult = await mcpClient.initialize();
      console.log('✅ Initialize result:', initResult);
      
      // Test getting recent sessions
      console.log('Testing getRecentSessions...');
      const sessionsResult = await mcpClient.getRecentSessions(5);
      console.log('✅ Sessions result:', sessionsResult);
      
      return true;
    } catch (error) {
      console.error('❌ MCP Client Error:', error);
      console.error('Error stack:', error.stack);
      return false;
    }
  },
  
  // Run all debug tests
  async runAllTests() {
    console.log('🚀 Running MCP Debug Tests...\n');
    
    const results = {
      env: this.checkEnv(),
      auth: await this.checkAuth(),
      connection: await this.testMCPConnection(),
      client: await this.testMCPClient()
    };
    
    console.log('\n📊 Debug Summary:');
    console.log('Environment:', results.env.supabaseUrl ? '✅' : '❌');
    console.log('Authentication:', results.auth ? '✅' : '❌');
    console.log('MCP Connection:', results.connection ? '✅' : '❌');
    console.log('MCP Client:', results.client ? '✅' : '❌');
    
    return results;
  }
};

console.log('🛠️ MCP Debug utility loaded. Use window.mcpDebug.runAllTests() to start debugging.');

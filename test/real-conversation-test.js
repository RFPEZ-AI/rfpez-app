// Copyright Mark Skiba, 2025 All rights reserved
// Real conversation test to validate tool invocation persistence

/* global process */
const TEST_CONFIG = {
  edgeFunctionUrl: 'http://127.0.0.1:54321/functions/v1/claude-api-v3',
  supabaseUrl: 'http://127.0.0.1:54321',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  testUserId: 'efbffaac-37df-4d9a-9689-13f4984a89a7' // From our validation test
};

// Helper to create Supabase client
async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.anonKey);
}



// Step 1: Create a new test session
async function createTestSession(supabase) {
  console.log('\n📝 STEP 1: Creating new test session...');
  
  const sessionId = crypto.randomUUID();
  
  const { error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      user_id: TEST_CONFIG.testUserId,
      title: 'Real Conversation Tool Persistence Test'
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create session:', error);
    return null;
  }
  
  console.log(`✅ Session created: ${sessionId}`);
  return sessionId;
}

// Step 2: Send a message that triggers tool execution
async function sendMessageWithTools(sessionId) {
  console.log('\n💬 STEP 2: Sending message that triggers tool execution...');
  
  const messageContent = 'Create a new RFP for "Industrial Safety Equipment Procurement" with description "We need safety equipment including helmets, gloves, and protective gear for 50 employees."';
  
  console.log(`   Message: ${messageContent}`);
  
  const requestBody = {
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    sessionId: sessionId,
    userId: TEST_CONFIG.testUserId,
    stream: false // Use non-streaming for easier testing
  };
  
  console.log('\n📡 Calling edge function...');
  
  const response = await fetch(TEST_CONFIG.edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Edge function error (${response.status}):`, errorText);
    return null;
  }
  
  const result = await response.json();
  console.log('\n✅ Edge function response received');
  console.log(`   Response length: ${result.response?.length || 0} characters`);
  console.log(`   Tool calls: ${result.toolCalls?.length || 0}`);
  
  if (result.toolCalls && result.toolCalls.length > 0) {
    result.toolCalls.forEach((tool, idx) => {
      console.log(`   Tool ${idx + 1}: ${tool.name}`);
    });
  }
  
  return result;
}

// Step 3: Verify tool invocations in database
async function verifyToolInvocations(supabase, sessionId) {
  console.log('\n🔍 STEP 3: Verifying tool invocations in database...');
  
  // Query for messages in this session
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Failed to query messages:', error);
    return false;
  }
  
  console.log(`\n📊 Found ${messages.length} messages in session`);
  
  let foundToolInvocations = false;
  
  messages.forEach((msg, idx) => {
    console.log(`\n📝 Message ${idx + 1}:`);
    console.log(`   ID: ${msg.id}`);
    console.log(`   Role: ${msg.role}`);
    console.log(`   Content: ${msg.content.substring(0, 80)}...`);
    console.log(`   Created: ${msg.created_at}`);
    
    if (msg.metadata && msg.metadata.toolInvocations) {
      foundToolInvocations = true;
      const tools = msg.metadata.toolInvocations;
      console.log(`   🔧 Tool Invocations: ${tools.length}`);
      
      tools.forEach((tool, toolIdx) => {
        console.log(`      ${toolIdx + 1}. ${tool.type}: ${tool.toolName}`);
        if (tool.parameters) {
          console.log(`         Parameters: ${JSON.stringify(tool.parameters).substring(0, 100)}`);
        }
        if (tool.result) {
          console.log(`         Result: ${JSON.stringify(tool.result).substring(0, 100)}`);
        }
        console.log(`         Agent: ${tool.agentId}`);
        console.log(`         Timestamp: ${tool.timestamp}`);
      });
    } else {
      console.log(`   ⚠️  No tool invocations in metadata`);
    }
  });
  
  return foundToolInvocations;
}

// Step 4: Test page reload scenario (simulated)
async function testPageReloadScenario(supabase, sessionId) {
  console.log('\n🔄 STEP 4: Simulating page reload (re-fetching messages)...');
  
  // Simulate what happens when user refreshes page
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Failed to re-fetch messages:', error);
    return false;
  }
  
  console.log(`✅ Successfully re-fetched ${messages.length} messages`);
  
  const messagesWithTools = messages.filter(m => 
    m.metadata && m.metadata.toolInvocations && m.metadata.toolInvocations.length > 0
  );
  
  console.log(`📊 Messages with tool invocations: ${messagesWithTools.length}`);
  
  if (messagesWithTools.length > 0) {
    console.log('\n✅ PERSISTENCE CONFIRMED: Tool invocations survive page reload!');
    return true;
  } else {
    console.log('\n⚠️  WARNING: No tool invocations found after reload simulation');
    return false;
  }
}

// Main test execution
async function runRealConversationTest() {
  console.log('🚀 REAL CONVERSATION TEST - Tool Invocation Persistence');
  console.log('=' .repeat(80));
  console.log('This test validates tool invocations persist during actual conversations');
  console.log('=' .repeat(80));
  
  try {
    // Initialize Supabase client
    console.log('\n🔧 Initializing Supabase client...');
    const supabase = await createSupabaseClient();
    console.log('✅ Supabase client initialized');
    
    // Step 1: Create test session
    const sessionId = await createTestSession(supabase);
    if (!sessionId) {
      throw new Error('Failed to create test session');
    }
    
    // Step 2: Send message with tools
    const edgeResult = await sendMessageWithTools(sessionId);
    if (!edgeResult) {
      throw new Error('Failed to get edge function response');
    }
    
    // Wait a moment for async operations to complete
    console.log('\n⏳ Waiting 3 seconds for message storage to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Verify tool invocations in database
    const hasToolInvocations = await verifyToolInvocations(supabase, sessionId);
    
    // Step 4: Test page reload scenario
    const persistsAfterReload = await testPageReloadScenario(supabase, sessionId);
    
    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Session Created: ${sessionId}`);
    console.log(`${edgeResult ? '✅' : '❌'} Edge Function Response: ${edgeResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(`${hasToolInvocations ? '✅' : '⚠️'} Tool Invocations in Database: ${hasToolInvocations ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`${persistsAfterReload ? '✅' : '⚠️'} Persistence After Reload: ${persistsAfterReload ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    
    if (hasToolInvocations && persistsAfterReload) {
      console.log('\n🎉 TEST PASSED: Tool invocations persist correctly!');
      console.log('   - Tools are tracked during conversation');
      console.log('   - Tools are stored in message metadata');
      console.log('   - Tools survive page reload/re-fetch');
      return true;
    } else if (hasToolInvocations) {
      console.log('\n⚠️  PARTIAL SUCCESS: Tool invocations found but need further validation');
      return false;
    } else {
      console.log('\n❌ TEST FAILED: Tool invocations not found in database');
      console.log('   Possible reasons:');
      console.log('   1. Claude did not call store_message tool');
      console.log('   2. Tool tracking not working in edge function');
      console.log('   3. Metadata not being injected correctly');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    return false;
  }
}

// Run the test
runRealConversationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

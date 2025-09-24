// Quick test to verify the session context is properly passed to edge function
const { supabase } = require('./src/supabaseClient');

async function testSessionContextAPI() {
  console.log('🔬 Testing Session Context API Integration');
  console.log('=' .repeat(50));

  try {
    // Get current user session for authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('❌ No authenticated session found. Please login first.');
      return;
    }

    console.log('✅ Authenticated user found:', session.user.email);

    // Test the edge function with session context
    const mockSessionId = 'test-session-' + Date.now();
    
    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-api-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        functionName: 'create_and_set_rfp',
        parameters: {
          name: 'Test RFP - Session Context Fix',
          description: 'Testing that session context is properly passed to edge function'
        },
        sessionContext: {
          sessionId: mockSessionId,
          timestamp: new Date().toISOString()
        }
      }),
    });

    const result = await response.json();
    
    console.log('📡 Edge Function Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message || result.error);
    
    if (result.success) {
      console.log('✅ Session context fix is working!');
      console.log('RFP created successfully:', result.data?.rfp_id);
    } else {
      console.log('❌ Session context issue persists:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testSessionContextAPI();
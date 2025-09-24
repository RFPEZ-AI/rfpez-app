// Copyright Mark Skiba, 2025 All rights reserved

// Test script to demonstrate proper session setup for RFP creation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSessionSetup() {
  console.log('🧪 Testing session setup and RFP creation...\n');
  
  const testUserId = 'cd9f51b1-42a1-47b8-8b77-9f8c3ba4b2c7'; // Your test user
  
  try {
    // Step 1: Check user profile and current session
    console.log('📋 Step 1: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, current_session_id, email')
      .eq('supabase_user_id', testUserId)
      .single();
    
    console.log('User profile:', profile);
    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }
    
    // Step 2: Check if user has any sessions
    console.log('\n📋 Step 2: Checking user sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('User sessions:', sessions);
    if (sessionsError) {
      console.error('Sessions error:', sessionsError);
    }
    
    // Step 3: Create a new session if none exists or no current session
    let sessionId = profile.current_session_id;
    
    if (!sessionId || !sessions?.find(s => s.id === sessionId)) {
      console.log('\n🆕 Step 3: Creating new session...');
      
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: profile.id,
          title: 'Test RFP Session',
          description: 'Session created for RFP testing'
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return;
      }
      
      sessionId = newSession.id;
      console.log('✅ New session created:', sessionId);
      
      // Step 4: Set as current session in user profile
      console.log('\n📌 Step 4: Setting current session in user profile...');
      const { error: updateError } = await supabase
        .rpc('set_user_current_session', {
          user_uuid: testUserId,
          session_uuid: sessionId
        });
      
      if (updateError) {
        console.error('Update current session error:', updateError);
        return;
      }
      
      console.log('✅ Current session set in user profile');
    } else {
      console.log('\n✅ Step 3: Using existing current session:', sessionId);
    }
    
    // Step 5: Now test RFP creation
    console.log('\n🎯 Step 5: Testing RFP creation...');
    
    const startTime = Date.now();
    const { data: rfpResult, error: rfpError } = await supabase.functions.invoke('claude-api-v2', {
      body: {
        functionName: 'create_and_set_rfp',
        parameters: {
          name: 'Test RFP via Session Setup',
          description: 'Created after proper session setup',
          department: 'IT',
          expected_award_date: '2025-03-01',
          submission_deadline: '2025-02-15'
        }
      },
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'supabase-user-id': testUserId
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️ RFP creation completed in ${duration}ms`);
    
    if (rfpError) {
      console.error('❌ RFP creation failed:', rfpError);
      return;
    }
    
    console.log('✅ RFP creation succeeded!');
    console.log('📋 Result:', JSON.stringify(rfpResult, null, 2));
    
    // Step 6: Verify session context was updated
    console.log('\n🔍 Step 6: Verifying session context...');
    const { data: updatedSession, error: sessionCheckError } = await supabase
      .from('sessions')
      .select('id, current_rfp_id, title')
      .eq('id', sessionId)
      .single();
    
    if (sessionCheckError) {
      console.error('Session check error:', sessionCheckError);
    } else {
      console.log('✅ Session updated with RFP context:', updatedSession);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSessionSetup();
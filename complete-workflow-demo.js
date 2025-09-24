// Copyright Mark Skiba, 2025 All rights reserved

// Create a test user and demonstrate the full RFP creation workflow
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function demonstrateFullWorkflow() {
  console.log('🚀 Demonstrating full RFP creation workflow...\n');
  
  try {
    // Step 1: Create test user profile
    console.log('👤 Step 1: Creating test user profile...');
    
    const testSupabaseUserId = 'cd9f51b1-42a1-47b8-8b77-9f8c3ba4b2c7';
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        supabase_user_id: testSupabaseUserId,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user'
      })
      .select()
      .single();
    
    if (profileError) {
      if (profileError.code === '23505') { // Unique constraint violation
        console.log('ℹ️ User already exists, retrieving...');
        const { data: existingProfile, error: getError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('supabase_user_id', testSupabaseUserId)
          .single();
        
        if (getError) {
          console.error('❌ Error retrieving existing user:', getError);
          return;
        }
        userProfile = existingProfile;
      } else {
        console.error('❌ Error creating user profile:', profileError);
        return;
      }
    }
    
    console.log('✅ User profile ready:', {
      id: userProfile.id,
      email: userProfile.email,
      current_session_id: userProfile.current_session_id
    });
    
    // Step 2: Create a session
    console.log('\n📁 Step 2: Creating session...');
    
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userProfile.id,
        title: 'Test RFP Session',
        description: 'Session for demonstrating RFP creation'
      })
      .select()
      .single();
    
    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      return;
    }
    
    console.log('✅ Session created:', {
      id: session.id,
      title: session.title
    });
    
    // Step 3: Set as current session in user profile
    console.log('\n📌 Step 3: Setting current session...');
    
    const { error: setSessionError } = await supabase
      .rpc('set_user_current_session', {
        user_uuid: testSupabaseUserId,
        session_uuid: session.id
      });
    
    if (setSessionError) {
      console.error('❌ Error setting current session:', setSessionError);
      return;
    }
    
    console.log('✅ Current session set successfully');
    
    // Step 4: Verify session is set
    console.log('\n🔍 Step 4: Verifying session context...');
    
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('current_session_id')
      .eq('supabase_user_id', testSupabaseUserId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying session:', verifyError);
      return;
    }
    
    console.log('✅ Session verified in user profile:', updatedProfile.current_session_id);
    
    // Step 5: Now test RFP creation with proper session context
    console.log('\n🎯 Step 5: Creating RFP with proper session context...');
    
    const startTime = Date.now();
    const { data: rfpResult, error: rfpError } = await supabase.functions.invoke('claude-api-v2', {
      body: {
        functionName: 'create_and_set_rfp',
        parameters: {
          name: 'Test RFP - Full Workflow Demo',
          description: 'This RFP demonstrates the complete workflow with proper session setup',
          department: 'Technology',
          expected_award_date: '2025-03-15',
          submission_deadline: '2025-02-28'
        }
      },
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'supabase-user-id': testSupabaseUserId
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\n⏱️ RFP creation completed in ${duration}ms`);
    
    if (rfpError) {
      console.error('❌ RFP creation failed:');
      console.error('Status:', rfpError.status);
      console.error('Message:', rfpError.message);
      console.error('Details:', rfpError.details);
      return;
    }
    
    console.log('🎉 RFP creation succeeded!');
    console.log('📋 Result:', JSON.stringify(rfpResult, null, 2));
    
    // Step 6: Verify session was updated with RFP context
    console.log('\n🔍 Step 6: Verifying session RFP context...');
    
    const { data: finalSession, error: finalSessionError } = await supabase
      .from('sessions')
      .select('id, title, current_rfp_id')
      .eq('id', session.id)
      .single();
    
    if (finalSessionError) {
      console.error('❌ Error checking final session:', finalSessionError);
    } else {
      console.log('✅ Final session state:', finalSession);
    }
    
    // Step 7: Check the created RFP
    if (rfpResult.rfp_id) {
      console.log('\n📄 Step 7: Verifying created RFP...');
      
      const { data: createdRfp, error: rfpCheckError } = await supabase
        .from('rfps')
        .select('id, name, description, department')
        .eq('id', rfpResult.rfp_id)
        .single();
      
      if (rfpCheckError) {
        console.error('❌ Error checking created RFP:', rfpCheckError);
      } else {
        console.log('✅ Created RFP verified:', createdRfp);
      }
    }
    
    console.log('\n🎉 Complete workflow demonstration successful!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ User profile: ${userProfile.id}`);
    console.log(`   ✅ Session: ${session.id}`);
    console.log(`   ✅ RFP: ${rfpResult.rfp_id || 'N/A'}`);
    console.log(`   ✅ Duration: ${duration}ms`);
    
  } catch (error) {
    console.error('💥 Workflow failed:', error);
  }
}

demonstrateFullWorkflow();
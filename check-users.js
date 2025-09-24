// Copyright Mark Skiba, 2025 All rights reserved

// Check what users exist in the system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('🔍 Checking existing users in the system...\n');
  
  try {
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, supabase_user_id, email, current_session_id')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No user profiles found in the system');
      return;
    }
    
    console.log('✅ Found user profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   Supabase User ID: ${profile.supabase_user_id}`);
      console.log(`   Email: ${profile.email || 'N/A'}`);
      console.log(`   Current Session: ${profile.current_session_id || 'None'}`);
      console.log('');
    });
    
    // For the first user, check their sessions
    const firstUser = profiles[0];
    console.log(`🔍 Checking sessions for user: ${firstUser.email || firstUser.id}...`);
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, current_rfp_id, created_at')
      .eq('user_id', firstUser.id)
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
    } else if (sessions && sessions.length > 0) {
      console.log('✅ Found sessions:');
      sessions.forEach((session, index) => {
        console.log(`${index + 1}. ID: ${session.id}`);
        console.log(`   Title: ${session.title}`);
        console.log(`   Current RFP: ${session.current_rfp_id || 'None'}`);
        console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No sessions found for this user');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUsers();
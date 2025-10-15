#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* global process, require */
// Quick tool invocation checker for real conversation testing

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkToolInvocations() {
  console.log('🔍 Checking for tool invocations in recent messages...\n');

  // Get most recent assistant message
  const { data: recentMessage } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!recentMessage) {
    console.log('❌ No recent assistant messages found');
    return;
  }

  console.log('📝 Most Recent Assistant Message:');
  console.log(`   ID: ${recentMessage.id}`);
  console.log(`   Created: ${recentMessage.created_at}`);
  console.log(`   Content: ${recentMessage.content.substring(0, 100)}...`);

  if (recentMessage.metadata && recentMessage.metadata.toolInvocations) {
    console.log(`\n✅ TOOL INVOCATIONS FOUND!`);
    console.log(`   Count: ${recentMessage.metadata.toolInvocations.length}`);
    console.log('\n   Details:');
    recentMessage.metadata.toolInvocations.forEach((inv, idx) => {
      console.log(`\n   ${idx + 1}. ${inv.type.toUpperCase()}`);
      console.log(`      Tool: ${inv.toolName}`);
      console.log(`      Agent: ${inv.agentId}`);
      console.log(`      Time: ${inv.timestamp}`);
      if (inv.parameters) {
        console.log(`      Parameters: ${JSON.stringify(inv.parameters)}`);
      }
      if (inv.result) {
        console.log(`      Result: ${JSON.stringify(inv.result)}`);
      }
    });
  } else {
    console.log('\n⚠️  No tool invocations found in most recent message');
  }

  // Get statistics
  console.log('\n📊 Statistics (last 10 minutes):');
  const { data: stats } = await supabase.rpc('execute_sql', {
    query: `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END) as messages_with_tools
      FROM messages
      WHERE created_at > NOW() - INTERVAL '10 minutes'
    `
  });

  if (stats && stats.length > 0) {
    console.log(`   Total messages: ${stats[0].total_messages}`);
    console.log(`   Messages with tools: ${stats[0].messages_with_tools}`);
  }
}

checkToolInvocations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

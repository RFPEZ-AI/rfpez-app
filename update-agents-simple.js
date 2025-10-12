#!/usr/bin/env node
// Simple script to update agent instructions using @supabase/supabase-js
const fs = require('fs');
const path = require('path');

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Hardcode remote credentials (for this one-time update)
const SUPABASE_URL = 'https://jxlutaztoukwbbgtoulc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyODgxODMsImV4cCI6MjAzOTg2NDE4M30.1u3tSQJz3L2JdC7iQJPYL9lKJ_nfY8mEIWMu0gqQZ2Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateAgent(agentName, filePath) {
  console.log(`\n📝 Updating ${agentName}...`);
  
  // Read markdown file
  const fullPath = path.join(__dirname, filePath);
  const instructions = fs.readFileSync(fullPath, 'utf8');
  
  console.log(`   File size: ${instructions.length} characters`);
  
  // Execute raw SQL query using rpc call
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `UPDATE agents SET instructions = $1, updated_at = NOW() WHERE name = $2 RETURNING name, LENGTH(instructions) as new_length, updated_at;`,
    params: [instructions, agentName]
  });
  
  if (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
  
  console.log(`   ✅ Success! New length: ${data ? data[0]?.new_length : 'unknown'} characters`);
  return true;
}

async function main() {
  console.log('🚀 Starting agent instructions update...\n');
  console.log(`📡 Connected to: ${SUPABASE_URL}\n`);
  
  const agents = [
    { name: 'Solutions', file: 'Agent Instructions/Solutions Agent.md' },
    { name: 'RFP Design', file: 'Agent Instructions/RFP Design Agent.md' }
  ];
  
  for (const agent of agents) {
    await updateAgent(agent.name, agent.file);
  }
  
  // Verify updates
  console.log('\n🔍 Verifying all three agents...\n');
  const { data: verifyData, error: verifyError } = await supabase
    .from('agents')
    .select('name, updated_at')
    .in('name', ['Solutions', 'RFP Design', 'Support'])
    .order('name');
  
  if (verifyError) {
    console.error('❌ Verification error:', verifyError.message);
  } else {
    console.log('📊 Updated agents:');
    verifyData.forEach(agent => {
      const updateTime = new Date(agent.updated_at);
      console.log(`   ${agent.name}: ${updateTime.toLocaleString()}`);
    });
  }
  
  console.log('\n✨ Update complete!');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

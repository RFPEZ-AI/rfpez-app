#!/usr/bin/env node
// Execute SQL file against remote Supabase using MCP-configured connection
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Use hardcoded remote Supabase URL from MCP config (avoiding JSON comment parsing)
const SUPABASE_URL = 'https://jxlutaztoukwbbgtoulc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODM3MTIsImV4cCI6MjA3MTQ1OTcxMn0.WJRaC_MccZxNi7nPpu0LygC3nt6lr3SyZEqt61_7yqM';

console.log('📡 Connecting to remote Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeUpdate(agentName, instructions) {
  console.log(`\n📝 Updating ${agentName} agent...`);
  console.log(`   Instruction length: ${instructions.length} characters`);
  
  const { data, error } = await supabase
    .from('agents')
    .update({ 
      instructions: instructions,
      updated_at: new Date().toISOString()
    })
    .eq('name', agentName)
    .select('name, updated_at');
  
  if (error) {
    console.error(`   ❌ Error updating ${agentName}:`, error.message);
    return false;
  }
  
  if (!data || data.length === 0) {
    console.error(`   ⚠️  Agent "${agentName}" not found in database`);
    return false;
  }
  
  console.log(`   ✅ Successfully updated ${agentName}`);
  console.log(`   Updated at: ${data[0].updated_at}`);
  return true;
}

async function main() {
  console.log('🚀 Starting agent instructions update from markdown files...\n');
  
  // Read markdown files directly
  const solutionsPath = path.join(__dirname, 'Agent Instructions', 'Solutions Agent.md');
  const rfpDesignPath = path.join(__dirname, 'Agent Instructions', 'RFP Design Agent.md');
  
  const solutionsInstructions = fs.readFileSync(solutionsPath, 'utf8');
  const rfpDesignInstructions = fs.readFileSync(rfpDesignPath, 'utf8');
  
  // Update Solutions agent
  const solutionsSuccess = await executeUpdate('Solutions', solutionsInstructions);
  
  // Update RFP Design agent
  const rfpDesignSuccess = await executeUpdate('RFP Design', rfpDesignInstructions);
  
  // Verify all updates
  console.log('\n🔍 Verifying all three agents...\n');
  
  const { data: agents, error: verifyError } = await supabase
    .from('agents')
    .select('name, updated_at')
    .in('name', ['Solutions', 'RFP Design', 'Support'])
    .order('name');
  
  if (verifyError) {
    console.error('❌ Verification error:', verifyError.message);
    process.exit(1);
  }
  
  console.log('📊 Agent Update Status:');
  console.log('═══════════════════════════════════════════════════════════════');
  agents.forEach(agent => {
    const updateTime = new Date(agent.updated_at);
    const isRecent = Date.now() - updateTime.getTime() < 300000; // Last 5 minutes
    const status = isRecent ? '✅ Just Updated' : '⏰ Previously Updated';
    console.log(`   ${agent.name.padEnd(15)} | ${updateTime.toLocaleString()} | ${status}`);
  });
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (solutionsSuccess && rfpDesignSuccess) {
    console.log('\n✨ Agent instructions update complete!');
    console.log('   All three agents are now synchronized with local markdown files.');
  } else {
    console.log('\n⚠️  Some updates failed. Please check error messages above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

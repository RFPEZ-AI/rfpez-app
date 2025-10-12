#!/usr/bin/env node
// Update Agent Instructions in Remote Database
// Reads markdown files and updates remote Supabase agent records via MCP

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to execute SQL via Supabase CLI
function executeSql(sql) {
  try {
    // Use supabase db remote (works with linked project)
    const result = execSync(`supabase db remote exec "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large queries
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Agent files to update
const agentFiles = [
  { name: 'Solutions', file: 'Agent Instructions/Solutions Agent.md' },
  { name: 'RFP Design', file: 'Agent Instructions/RFP Design Agent.md' },
  { name: 'Support', file: 'Agent Instructions/Support Agent.md' }
];

function updateAgentInstructions() {
  console.log('🚀 Starting agent instructions update...\n');
  
  for (const agent of agentFiles) {
    try {
      console.log(`📝 Reading ${agent.name} agent instructions from: ${agent.file}`);
      
      // Read markdown file
      const filePath = path.join(__dirname, agent.file);
      const instructions = fs.readFileSync(filePath, 'utf8');
      
      console.log(`   File size: ${instructions.length} characters`);
      
      // Escape single quotes for SQL by doubling them
      const escapedInstructions = instructions.replace(/'/g, "''");
      
      // Build SQL update query
      const sql = `UPDATE agents SET instructions = '${escapedInstructions}', updated_at = NOW() WHERE name = '${agent.name}' RETURNING name, id;`;
      
      // Update database via Supabase CLI
      console.log(`   Updating database via Supabase CLI...`);
      const result = executeSql(sql);
      
      if (!result.success) {
        console.error(`   ❌ Error updating ${agent.name}:`, result.error);
        continue;
      }
      
      console.log(`   ✅ Successfully updated ${agent.name}`);
      console.log();
      
    } catch (err) {
      console.error(`   ❌ Error processing ${agent.name}:`, err.message);
      console.log();
    }
  }
  
  // Verify updates
  console.log('🔍 Verifying updates...\n');
  const verifySql = `SELECT name, LENGTH(instructions) as instruction_length, updated_at FROM agents WHERE name IN ('Solutions', 'RFP Design', 'Support') ORDER BY name;`;
  const verifyResult = executeSql(verifySql);
  
  if (!verifyResult.success) {
    console.error('❌ Error verifying updates:', verifyResult.error);
    process.exit(1);
  }
  
  console.log('📊 Verification Results:');
  console.log(verifyResult.result);
  
  console.log('\n✨ Agent instructions update complete!');
}

// Run update
try {
  updateAgentInstructions();
} catch (err) {
  console.error('❌ Fatal error:', err);
  process.exit(1);
}

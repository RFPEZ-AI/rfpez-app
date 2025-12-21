#!/usr/bin/env node
/**
 * Agent Synchronization Script
 * 
 * This script synchronizes agent access settings between local and remote environments.
 * It uses agent names instead of hardcoded UUIDs to ensure consistency across environments.
 * 
 * Usage:
 *   node scripts/sync-agents.js [--remote]
 * 
 * Options:
 *   --remote    Sync to remote Supabase (requires SUPABASE_ACCESS_TOKEN)
 *   --local     Sync to local Supabase (default)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_DB_CONTAINER = 'supabase_db_rfpez-app-local';
const REMOTE_PROJECT_ID = 'jxlutaztoukwbbgtoulc';

// Parse command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const environment = isRemote ? 'REMOTE' : 'LOCAL';

console.log(`\n🔄 RFPEZ.AI Agent Synchronization Tool`);
console.log(`==========================================`);
console.log(`📍 Target Environment: ${environment}\n`);

/**
 * Agent configuration template
 * Define all agents and their expected settings
 */
const AGENT_CONFIGS = {
  'Corporate TMC RFP Welcome': {
    is_restricted: false,
    is_free: true,
    is_abstract: false,
    parent_name: 'Solutions',
    description: 'Welcome agent for Corporate TMC RFP site - anonymous access'
  },
  'TMC Specialist': {
    is_restricted: true,
    is_free: false,
    is_abstract: false,
    parent_name: 'RFP Design',
    description: 'TMC RFP specialist - authenticated users only'
  },
  'TMC Tender': {
    is_restricted: true,
    is_free: false,
    is_abstract: false,
    parent_name: 'Sourcing',
    description: 'TMC tendering agent - authenticated users only'
  },
  'Solutions': {
    is_restricted: false,
    is_free: true,
    is_abstract: false,
    parent_name: null,
    description: 'Base sales agent - public access'
  },
  'RFP Design': {
    is_restricted: true,
    is_free: false,
    is_abstract: false,
    parent_name: null,
    description: 'RFP design agent - authenticated users'
  },
  'Sourcing': {
    is_restricted: true,
    is_free: false,
    is_abstract: false,
    parent_name: null,
    description: 'Sourcing agent - authenticated users'
  }
};

/**
 * Execute SQL query based on environment
 */
function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    let result;
    if (isRemote) {
      // For remote, use Supabase CLI
      const escapedSQL = sql.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      const command = `supabase db execute --project-ref ${REMOTE_PROJECT_ID} --sql "${escapedSQL}"`;
      result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    } else {
      // For local, use Docker exec
      const escapedSQL = sql.replace(/'/g, "'\\''");
      const command = `docker exec ${LOCAL_DB_CONTAINER} psql -U postgres -d postgres -c "${escapedSQL}"`;
      result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    }
    
    console.log(`✅ ${description} - Success`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(error.stderr || error.message);
    throw error;
  }
}

/**
 * Generate SQL for agent synchronization
 */
function generateSyncSQL() {
  const updates = [];
  
  // Generate UPDATE statements for each agent
  for (const [agentName, config] of Object.entries(AGENT_CONFIGS)) {
    const parentClause = config.parent_name 
      ? `(SELECT id FROM agents WHERE name = '${config.parent_name}')`
      : 'NULL';
    
    updates.push(`
      UPDATE agents
      SET 
        is_restricted = ${config.is_restricted},
        is_free = ${config.is_free},
        is_abstract = ${config.is_abstract},
        parent_agent_id = ${parentClause},
        updated_at = NOW()
      WHERE name = '${agentName}';
    `);
  }
  
  return updates.join('\n');
}

/**
 * Verify agent settings
 */
function verifyAgents() {
  const verifySQL = `
    SELECT 
      a.name,
      a.is_restricted,
      a.is_free,
      a.is_abstract,
      parent.name as parent_name
    FROM agents a
    LEFT JOIN agents parent ON a.parent_agent_id = parent.id
    WHERE a.name IN (${Object.keys(AGENT_CONFIGS).map(n => `'${n}'`).join(', ')})
    ORDER BY a.name;
  `;
  
  return executeSQL(verifySQL, 'Verifying agent configurations');
}

/**
 * Main synchronization function
 */
async function syncAgents() {
  try {
    console.log(`\n🔍 Step 1: Pre-sync verification`);
    const beforeState = verifyAgents();
    console.log(beforeState);
    
    console.log(`\n🔧 Step 2: Applying agent updates`);
    const syncSQL = generateSyncSQL();
    executeSQL(syncSQL, 'Updating agent configurations');
    
    console.log(`\n✅ Step 3: Post-sync verification`);
    const afterState = verifyAgents();
    console.log(afterState);
    
    console.log(`\n🎉 Agent synchronization completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Environment: ${environment}`);
    console.log(`   - Agents updated: ${Object.keys(AGENT_CONFIGS).length}`);
    console.log(`   - Status: All agents synchronized ✓`);
    
  } catch (error) {
    console.error(`\n❌ Agent synchronization failed!`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Display agent configuration reference
 */
function showAgentReference() {
  console.log(`\n📋 Agent Configuration Reference:`);
  console.log(`================================\n`);
  
  for (const [agentName, config] of Object.entries(AGENT_CONFIGS)) {
    console.log(`🤖 ${agentName}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Restricted: ${config.is_restricted} (${config.is_restricted ? 'Auth required' : 'Anonymous OK'})`);
    console.log(`   Free: ${config.is_free} (${config.is_free ? 'Free tier' : 'Premium'})`);
    console.log(`   Parent: ${config.parent_name || 'None (root agent)'}`);
    console.log('');
  }
}

// Run the synchronization
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/sync-agents.js [options]

Options:
  --local     Sync to local Supabase (default)
  --remote    Sync to remote Supabase (requires SUPABASE_ACCESS_TOKEN)
  --help      Show this help message
  --reference Show agent configuration reference

Examples:
  node scripts/sync-agents.js                 # Sync to local
  node scripts/sync-agents.js --remote        # Sync to remote
  node scripts/sync-agents.js --reference     # Show agent configs
  `);
  process.exit(0);
}

if (args.includes('--reference')) {
  showAgentReference();
  process.exit(0);
}

syncAgents();

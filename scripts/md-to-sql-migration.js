#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * CLI Tool: Convert Agent Markdown to SQL Migration
 * 
 * Usage: node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
 * 
 * This tool:
 * 1. Reads an agent instruction markdown file
 * 2. Extracts metadata (ID, name, role, description, etc.)
 * 3. Generates a SQL migration file to update the agent
 * 4. Saves the migration to supabase/migrations/
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseAgentMarkdown(content) {
  const metadata = {};
  
  // Extract Database ID
  const idMatch = content.match(/\*\*Database ID\*\*:\s*`([^`]+)`/);
  if (idMatch) {
    metadata.id = idMatch[1];
  }
  
  // Extract Name
  const nameMatch = content.match(/##\s*Name:\s*(.+)/);
  if (nameMatch) {
    metadata.name = nameMatch[1].trim();
  }
  
  // Extract Role
  const roleMatch = content.match(/\*\*Role\*\*:\s*`([^`]+)`/);
  if (roleMatch) {
    metadata.role = roleMatch[1];
  }
  
  // Extract Avatar URL
  const avatarMatch = content.match(/\*\*Avatar URL\*\*:\s*`([^`]+)`/);
  if (avatarMatch) {
    metadata.avatar_url = avatarMatch[1];
  }
  
  // Extract Description
  const descMatch = content.match(/##\s*Description:\s*\n(.+?)(?=\n##|\n\*\*)/s);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }
  
  // Extract Initial Prompt
  const promptMatch = content.match(/##\s*Initial Prompt:\s*\n([\s\S]+?)(?=\n##)/);
  if (promptMatch) {
    metadata.initial_prompt = promptMatch[1].trim();
  }
  
  // Full content as instructions
  metadata.instructions = content;
  
  return metadata;
}

function escapeSQL(text) {
  // Use dollar-quoted strings for PostgreSQL to handle complex content
  // Find a delimiter that doesn't exist in the text
  let delimiter = 'agent_content';
  let counter = 1;
  
  while (text.includes(`$${delimiter}$`)) {
    delimiter = `agent_content${counter}`;
    counter++;
  }
  
  return `$${delimiter}$${text}$${delimiter}$`;
}

function generateMigration(metadata, agentName) {
  // Generate timestamp in Supabase format: YYYYMMDDHHmmss (14 digits, no separators)
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const agentSlug = agentName.toLowerCase().replace(/\s+/g, '_');
  
  const updateFields = [];
  
  if (metadata.instructions) {
    updateFields.push(`  instructions = ${escapeSQL(metadata.instructions)}`);
  }
  
  if (metadata.initial_prompt) {
    updateFields.push(`  initial_prompt = ${escapeSQL(metadata.initial_prompt)}`);
  }
  
  if (metadata.description) {
    updateFields.push(`  description = ${escapeSQL(metadata.description)}`);
  }
  
  if (metadata.role) {
    updateFields.push(`  role = '${metadata.role}'`);
  }
  
  if (metadata.avatar_url) {
    updateFields.push(`  avatar_url = '${metadata.avatar_url}'`);
  }
  
  updateFields.push(`  updated_at = NOW()`);
  
  const sql = `-- Update ${metadata.name} Agent Instructions
-- Generated on ${new Date().toISOString()}
-- Source: Agent Instructions/${agentName}.md

-- Update ${metadata.name} agent
UPDATE agents 
SET 
${updateFields.join(',\n')}
WHERE id = '${metadata.id}';

-- Verify update
SELECT 
  id,
  name,
  role,
  LENGTH(instructions) as instructions_length,
  LENGTH(initial_prompt) as initial_prompt_length,
  updated_at
FROM agents 
WHERE id = '${metadata.id}';
`;
  
  return { sql, timestamp, agentSlug };
}

function main() {
  log('\n🔧 Agent Markdown to SQL Migration Generator', 'cyan');
  log('='.repeat(50), 'cyan');
  
  // Get the markdown file path from command line
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('\n❌ Error: No markdown file specified', 'red');
    log('\nUsage:', 'yellow');
    log('  node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"', 'yellow');
    log('\nAvailable agent files:', 'cyan');
    
    const agentDir = path.join(__dirname, '..', 'Agent Instructions');
    if (fs.existsSync(agentDir)) {
      const files = fs.readdirSync(agentDir).filter(f => f.endsWith('.md'));
      files.forEach(f => log(`  - Agent Instructions/${f}`, 'blue'));
    }
    
    process.exit(1);
  }
  
  const mdPath = path.join(__dirname, '..', args[0]);
  
  if (!fs.existsSync(mdPath)) {
    log(`\n❌ Error: File not found: ${args[0]}`, 'red');
    process.exit(1);
  }
  
  log(`\n📖 Reading: ${args[0]}`, 'blue');
  
  // Read and parse the markdown file
  const content = fs.readFileSync(mdPath, 'utf8');
  const metadata = parseAgentMarkdown(content);
  
  if (!metadata.id) {
    log('\n❌ Error: Could not find Database ID in markdown file', 'red');
    log('Expected format: **Database ID**: `uuid-here`', 'yellow');
    process.exit(1);
  }
  
  if (!metadata.name) {
    log('\n❌ Error: Could not find agent name in markdown file', 'red');
    log('Expected format: ## Name: Agent Name', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ Parsed agent metadata:', 'green');
  log(`   Name: ${metadata.name}`, 'bright');
  log(`   ID: ${metadata.id}`);
  log(`   Role: ${metadata.role || 'N/A'}`);
  log(`   Description length: ${metadata.description?.length || 0} chars`);
  log(`   Initial prompt length: ${metadata.initial_prompt?.length || 0} chars`);
  log(`   Instructions length: ${metadata.instructions?.length || 0} chars`);
  
  // Generate migration SQL
  log('\n🔨 Generating SQL migration...', 'blue');
  const { sql, timestamp, agentSlug } = generateMigration(metadata, metadata.name);
  
  // Save migration file
  const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFile = `${timestamp}_update_${agentSlug}_agent.sql`;
  const migrationPath = path.join(migrationDir, migrationFile);
  
  fs.writeFileSync(migrationPath, sql, 'utf8');
  
  log(`\n✅ Migration created: ${migrationFile}`, 'green');
  log(`   Path: ${migrationPath}`, 'bright');
  log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);
  
  log('\n📝 Next steps:', 'cyan');
  log('   1. Review the generated SQL file', 'yellow');
  log('   2. Apply to local database: supabase migration up', 'yellow');
  log('   3. Test the agent behavior locally', 'yellow');
  log('   4. Deploy to remote: supabase db push', 'yellow');
  
  log('\n✨ Done!', 'green');
}

// Run the tool
try {
  main();
} catch (error) {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

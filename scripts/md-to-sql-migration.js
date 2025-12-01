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
  
  // Extract Database ID (optional - for reference only, not used in WHERE clause)
  const idMatch = content.match(/\*\*Database ID\*\*:\s*`([^`]+)`/);
  if (idMatch) {
    metadata.id = idMatch[1];
  }
  
  // Extract Name (REQUIRED - used for WHERE clause)
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
  
  // Extract Allowed Tools (new feature)
  const toolsMatch = content.match(/##\s*Allowed Tools:\s*\n([\s\S]+?)(?=\n##)/);
  if (toolsMatch) {
    // Parse bullet list of tools
    const toolsList = toolsMatch[1].trim();
    const tools = toolsList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- '))
      .map(line => line.substring(2).trim());
    
    if (tools.length > 0) {
      metadata.allowed_tools = tools;
    }
  }
  
  // Extract Parent Agent (inheritance) - support both UUID and name
  const parentMatch = content.match(/\*\*Parent Agent(?:\sID)?\*\*:\s*`([^`]+)`/);
  const parentNameMatch = content.match(/\*\*Parent Agent Name\*\*:\s*`([^`]+)`/);
  
  if (parentNameMatch && parentNameMatch[1] !== 'None') {
    // Use parent agent name for lookup
    metadata.parent_agent_name = parentNameMatch[1];
  } else if (parentMatch && parentMatch[1] !== 'None') {
    const parentValue = parentMatch[1];
    // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidPattern.test(parentValue)) {
      // It's a UUID - check if it matches known _common agent UUIDs
      const commonAgentUUIDs = [
        '9bcfab80-08e5-424f-8ab9-86b91c3bae00', // Remote _common UUID
        'bd1c0dd4-e74c-4c25-acb6-f38d57473cc3'  // Local _common UUID
      ];
      
      if (commonAgentUUIDs.includes(parentValue.toLowerCase())) {
        // Use name-based lookup for _common agent to avoid UUID mismatches
        metadata.parent_agent_name = '_common';
      } else {
        // Other UUID - use legacy format
        metadata.parent_agent_id = parentValue;
      }
    } else {
      // Not a UUID - might be 'NULL' or agent name
      if (parentValue === 'NULL') {
        metadata.parent_agent_id = 'NULL';
      } else {
        // Treat as agent name
        metadata.parent_agent_name = parentValue;
      }
    }
  }
  
  // Extract Is Abstract flag
  const abstractMatch = content.match(/\*\*Is Abstract\*\*:\s*`(true|false)`/);
  if (abstractMatch) {
    metadata.is_abstract = abstractMatch[1] === 'true';
  }
  
  // Extract Access Override flag
  const overrideMatch = content.match(/\*\*Access Override\*\*:\s*`(true|false)`/);
  if (overrideMatch) {
    metadata.access_override = overrideMatch[1] === 'true';
  }
  
  // Extract Specialty
  const specialtyMatch = content.match(/\*\*Specialty\*\*:\s*`([^`]+)`/);
  if (specialtyMatch && specialtyMatch[1] !== 'None') {
    metadata.specialty = specialtyMatch[1];
  }
  
  // Extract Response Specialty
  const responseSpecialtyMatch = content.match(/\*\*Response [Ss]pecialty\*\*:\s*`([^`]+)`/);
  if (responseSpecialtyMatch && responseSpecialtyMatch[1] !== 'None') {
    metadata.specialty = responseSpecialtyMatch[1];
  }
  
  // Full content as instructions
  metadata.instructions = content;
  
  return metadata;
}

// Generate a unique dollar-quoting delimiter that does not appear in any field
function getUniqueDelimiter(fields, base) {
  let delimiter = base;
  let counter = 1;
  const allText = fields.filter(Boolean).join('');
  while (allText.includes(`$${delimiter}$`)) {
    delimiter = `${base}${counter}`;
    counter++;
  }
  return delimiter;
}

function escapeSQL(text, delimiter) {
  return `$${delimiter}$${text}$${delimiter}$`;
}


function generateMigration(metadata, agentName) {
  // Generate timestamp in Supabase format: YYYYMMDDHHmmss (14 digits, no separators)
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const agentSlug = agentName.toLowerCase().replace(/\s+/g, '_');
  // Unique delimiter: agent name + timestamp, sanitized
  const baseDelimiter = `${agentSlug}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '');
  
  // Generate UNIQUE delimiters for each field to avoid conflicts in same UPDATE statement
  const instructionsDelimiter = getUniqueDelimiter([metadata.instructions], `${baseDelimiter}_inst`);
  const promptDelimiter = getUniqueDelimiter([metadata.initial_prompt], `${baseDelimiter}_prompt`);
  const descDelimiter = getUniqueDelimiter([metadata.description], `${baseDelimiter}_desc`);
  
  const updateFields = [];
  if (metadata.instructions) {
    updateFields.push(`  instructions = ${escapeSQL(metadata.instructions, instructionsDelimiter)}`);
  }
  if (metadata.initial_prompt) {
    updateFields.push(`  initial_prompt = ${escapeSQL(metadata.initial_prompt, promptDelimiter)}`);
  }
  if (metadata.description) {
    updateFields.push(`  description = ${escapeSQL(metadata.description, descDelimiter)}`);
  }
  if (metadata.role) {
    updateFields.push(`  role = '${metadata.role}'`);
  }
  if (metadata.avatar_url) {
    updateFields.push(`  avatar_url = '${metadata.avatar_url}'`);
  }
  if (metadata.allowed_tools && metadata.allowed_tools.length > 0) {
    // Store as PostgreSQL array - properly escape single quotes in tool names
    const toolsArray = `ARRAY[${metadata.allowed_tools.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]`;
    updateFields.push(`  access = ${toolsArray}::text[]`);
  }
  
  // Inheritance fields - ALWAYS use name-based lookups, never hardcoded UUIDs
  if (metadata.parent_agent_name) {
    // Use subquery to look up parent agent by name (environment-independent)
    updateFields.push(`  parent_agent_id = (SELECT id FROM agents WHERE name = '${metadata.parent_agent_name}' LIMIT 1)`);
  } else if (metadata.parent_agent_id !== undefined) {
    // Handle NULL parent (root agent)
    if (metadata.parent_agent_id === 'NULL' || metadata.parent_agent_id === null) {
      updateFields.push(`  parent_agent_id = NULL`);
    } else {
      // WARN: Using UUID directly is discouraged - should use name-based lookup
      // This code path should not be reached with updated markdown files
      console.warn(`⚠️  WARNING: Using hardcoded UUID for parent_agent_id: ${metadata.parent_agent_id}`);
      console.warn(`   This may cause issues between local and remote environments.`);
      console.warn(`   Please update the markdown file to use Parent Agent Name instead.`);
      updateFields.push(`  parent_agent_id = '${metadata.parent_agent_id}'`);
    }
  }
  if (metadata.is_abstract !== undefined) {
    updateFields.push(`  is_abstract = ${metadata.is_abstract}`);
  }
  if (metadata.access_override !== undefined) {
    updateFields.push(`  access_override = ${metadata.access_override}`);
  }
  
  // Specialty field (for RFP Design/Sourcing agents)
  if (metadata.specialty !== undefined) {
    updateFields.push(`  specialty = ${metadata.specialty ? `'${metadata.specialty}'` : 'NULL'}`);
  }
  
  updateFields.push(`  updated_at = NOW()`);
  const sql = `-- Update ${metadata.name} Agent Instructions
-- Generated on ${new Date().toISOString()}
-- Source: Agent Instructions/${agentName}.md

-- Update ${metadata.name} agent
UPDATE agents 
SET 
${updateFields.join(',\n')}
WHERE name = '${metadata.name}';

-- Verify update
SELECT 
  id,
  name,
  role,
  LENGTH(instructions) as instructions_length,
  LENGTH(initial_prompt) as initial_prompt_length,
  updated_at
FROM agents 
WHERE name = '${metadata.name}';
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
  
  if (!metadata.name) {
    log('\n❌ Error: Could not find agent name in markdown file', 'red');
    log('Expected format: ## Name: Agent Name', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ Parsed agent metadata:', 'green');
  log(`   Name: ${metadata.name}`, 'bright');
  log(`   ID: ${metadata.id || 'N/A (will use name-based lookup)'}`);
  log(`   Role: ${metadata.role || 'N/A'}`);
  log(`   Description length: ${metadata.description?.length || 0} chars`);
  log(`   Initial prompt length: ${metadata.initial_prompt?.length || 0} chars`);
  log(`   Instructions length: ${metadata.instructions?.length || 0} chars`);
  log(`   Allowed tools: ${metadata.allowed_tools?.length || 0} tools`);
  if (metadata.allowed_tools) {
    metadata.allowed_tools.forEach(tool => log(`      - ${tool}`, 'blue'));
  }
  log(`   Parent agent: ${metadata.parent_agent_name || metadata.parent_agent_id || 'None (root agent)'}`);
  log(`   Is abstract: ${metadata.is_abstract !== undefined ? metadata.is_abstract : 'N/A'}`);
  log(`   Access override: ${metadata.access_override !== undefined ? metadata.access_override : 'N/A'}`);
  log(`   Specialty: ${metadata.specialty || 'None (general purpose)'}`);
  
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

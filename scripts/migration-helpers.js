#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Improved Migration Generator with Dynamic UUID Lookups
 * 
 * This script generates migrations that:
 * 1. Use name/slug lookups instead of hardcoded UUIDs
 * 2. Wrap operations in DO blocks for variable support
 * 3. Include error handling for missing references
 * 4. Follow best practices for cross-environment compatibility
 */

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

/**
 * Extract parent agent name from parent_agent_id field in markdown
 * Handles formats like:
 * - `8c5f11cb-1395-4d67-821b-89dd58f0c8dc` (RFP Design)
 * - `8c5f11cb-1395-4d67-821b-89dd58f0c8dc` (_common)
 */
function extractParentAgentName(parentAgentField) {
  if (!parentAgentField) return null;
  
  // Check for parent name in parentheses
  const nameMatch = parentAgentField.match(/\(([^)]+)\)/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  // If just a UUID, return null (will need manual specification)
  if (parentAgentField.match(/^[0-9a-f-]{36}$/i)) {
    log(`⚠️  Warning: Parent agent specified as UUID without name. Consider adding name in markdown.`, 'yellow');
    return null;
  }
  
  return null;
}

/**
 * Generate UPDATE migration with dynamic parent lookup
 */
function generateUpdateWithParentLookup(metadata, agentName, delimiter) {
  const needsParentLookup = metadata.parent_agent_id && metadata.parent_agent_name;
  
  if (!needsParentLookup) {
    // Standard update without parent lookup
    return generateStandardUpdate(metadata, agentName, delimiter);
  }
  
  // Generate DO block with parent lookup
  const updateFields = buildUpdateFields(metadata, delimiter);
  
  const sql = `-- Update ${metadata.name} Agent Instructions
-- Generated on ${new Date().toISOString()}
-- Source: Agent Instructions/${agentName}.md

-- Wrap in DO block to lookup parent agent dynamically
DO $$
DECLARE
  parent_id UUID;
BEGIN
  -- Lookup ${metadata.parent_agent_name} agent by name
  SELECT id INTO parent_id FROM agents WHERE name = '${metadata.parent_agent_name}';
  
  IF parent_id IS NULL THEN
    RAISE EXCEPTION '${metadata.parent_agent_name} agent not found - ensure it exists before updating ${metadata.name}';
  END IF;
  
  -- Update ${metadata.name} agent with looked-up parent ID
  UPDATE agents 
  SET 
${updateFields.map(f => f === 'parent_agent_id' ? `    parent_agent_id = parent_id` : `    ${f}`).join(',\n')},
    updated_at = NOW()
  WHERE id = '${metadata.id}';
  
END $$;

-- Verify update
SELECT 
  id,
  name,
  role,
  parent_agent_id,
  LENGTH(instructions) as instructions_length,
  LENGTH(initial_prompt) as initial_prompt_length,
  updated_at
FROM agents 
WHERE id = '${metadata.id}';
`;
  
  return sql;
}

/**
 * Build UPDATE field assignments
 */
function buildUpdateFields(metadata, delimiter) {
  const fields = [];
  
  if (metadata.instructions) {
    fields.push(`instructions = ${escapeSQL(metadata.instructions, delimiter)}`);
  }
  if (metadata.initial_prompt) {
    fields.push(`initial_prompt = ${escapeSQL(metadata.initial_prompt, delimiter)}`);
  }
  if (metadata.description) {
    fields.push(`description = ${escapeSQL(metadata.description, delimiter)}`);
  }
  if (metadata.role) {
    fields.push(`role = '${metadata.role}'`);
  }
  if (metadata.avatar_url) {
    fields.push(`avatar_url = '${metadata.avatar_url}'`);
  }
  if (metadata.allowed_tools && metadata.allowed_tools.length > 0) {
    const toolsArray = `ARRAY[${metadata.allowed_tools.map(t => `'${t}'`).join(', ')}]`;
    fields.push(`access = ${toolsArray}::text[]`);
  }
  
  // Parent agent (marked for variable substitution)
  if (metadata.parent_agent_id !== undefined) {
    fields.push('parent_agent_id');  // Placeholder - will be replaced with variable
  }
  
  if (metadata.is_abstract !== undefined) {
    fields.push(`is_abstract = ${metadata.is_abstract}`);
  }
  if (metadata.access_override !== undefined) {
    fields.push(`access_override = ${metadata.access_override}`);
  }
  if (metadata.specialty !== undefined) {
    fields.push(`specialty = ${metadata.specialty ? `'${metadata.specialty}'` : 'NULL'}`);
  }
  if (metadata.response_specialty !== undefined) {
    fields.push(`response_specialty = ${metadata.response_specialty ? `'${metadata.response_specialty}'` : 'NULL'}`);
  }
  
  return fields;
}

/**
 * Standard update without dynamic lookups
 */
function generateStandardUpdate(metadata, agentName, delimiter) {
  const updateFields = buildUpdateFields(metadata, delimiter)
    .filter(f => f !== 'parent_agent_id')  // Remove placeholder
    .map(f => `  ${f}`);
  
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
  
  return sql;
}

/**
 * Escape SQL string with dollar quoting
 */
function escapeSQL(content, delimiter) {
  return `${delimiter}${content}${delimiter}`;
}

// Re-export existing functions from md-to-sql-migration.js
// (This is a template - actual implementation would extend the existing script)

module.exports = {
  extractParentAgentName,
  generateUpdateWithParentLookup,
  buildUpdateFields,
  generateStandardUpdate,
  escapeSQL
};

log('\n✅ Improved migration generation functions loaded', 'green');
log('📖 See .github/instructions/migration-best-practices.instructions.md for usage patterns\n', 'cyan');

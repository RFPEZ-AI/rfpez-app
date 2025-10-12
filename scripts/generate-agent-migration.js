#!/usr/bin/env node
/**
 * Generate SQL Migration from Agent Instruction Markdown Files
 * Copyright Mark Skiba, 2025 All rights reserved
 * 
 * This script reads all Agent Instructions/*.md files and generates a SQL migration
 * to update the agents table with the current instruction content.
 */

const fs = require('fs');
const path = require('path');

const AGENT_DIR = path.join(__dirname, '..', 'Agent Instructions');
const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '20251011231137_update_agent_instructions_from_md_files.sql');

// Agent metadata extracted from filenames and content
const agentMetadata = {
  'Solutions Agent.md': {
    id: '4fe117af-da1d-410c-bcf4-929012d8a673',
    role: 'sales',
    sort_order: 0,
    is_default: true,
    is_free: true,
    is_restricted: false
  },
  'RFP Design Agent.md': {
    id: '8c5f11cb-1395-4d67-821b-89dd58f0c8dc',
    role: 'design',
    sort_order: 1,
    is_default: false,
    is_free: true,
    is_restricted: false
  },
  'Support Agent.md': {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    role: 'support',
    sort_order: 2,
    is_default: false,
    is_free: true,
    is_restricted: false
  },
  'Sourcing Agent.md': {
    id: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
    role: 'sourcing',
    sort_order: 3,
    is_default: false,
    is_free: false,
    is_restricted: false
  },
  'Negotiation Agent.md': {
    id: 'b2c3d4e5-f6a7-4890-b123-456789abcdef',
    role: 'negotiation',
    sort_order: 4,
    is_default: false,
    is_free: false,
    is_restricted: false
  },
  'Audit Agent.md': {
    id: 'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    role: 'audit',
    sort_order: 5,
    is_default: false,
    is_free: false,
    is_restricted: false
  },
  'Publishing Agent.md': {
    id: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
    role: 'publishing',
    sort_order: 6,
    is_default: false,
    is_free: false,
    is_restricted: false
  },
  'Signing Agent.md': {
    id: 'e5f6a7b8-c9d0-4123-e456-789abcdef012',
    role: 'signing',
    sort_order: 7,
    is_default: false,
    is_free: false,
    is_restricted: false
  },
  'Billing Agent.md': {
    id: 'f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    role: 'billing',
    sort_order: 8,
    is_default: false,
    is_free: false,
    is_restricted: false
  }
};

function extractAgentInfo(content, filename) {
  const lines = content.split('\n');
  let name = '';
  let description = '';
  let initialPrompt = '';
  let avatarUrl = '/assets/avatars/default-agent.svg';
  
  // Extract from markdown headers
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const line = lines[i];
    
    if (line.startsWith('## Name:')) {
      name = line.replace('## Name:', '').trim();
    } else if (line.startsWith('**Avatar URL**:')) {
      avatarUrl = line.replace('**Avatar URL**:', '').trim().replace(/`/g, '');
    } else if (line.startsWith('## Description:')) {
      // Next line is the description
      if (i + 1 < lines.length) {
        description = lines[i + 1].trim();
      }
    } else if (line.startsWith('## Initial Prompt:')) {
      // Collect all lines until next ## header
      let j = i + 1;
      const promptLines = [];
      while (j < lines.length && !lines[j].startsWith('##')) {
        if (lines[j].trim()) {
          promptLines.push(lines[j]);
        }
        j++;
      }
      initialPrompt = promptLines.join('\n').trim();
    }
  }
  
  // Fallback: extract name from filename
  if (!name) {
    name = filename.replace('.md', '').replace(' Agent', '');
  }
  
  return { name, description, initialPrompt, avatarUrl };
}

function escapeForDollarQuote(str) {
  // Dollar-quoted strings in PostgreSQL don't need escaping except for the delimiter itself
  // We'll use a unique delimiter that won't appear in content
  return str;
}

function generateMigration() {
  console.log('📖 Reading agent instruction files...');
  
  const files = fs.readdirSync(AGENT_DIR).filter(f => f.endsWith('.md'));
  
  let sql = `-- Update Agent Instructions from Markdown Files
-- Generated on ${new Date().toISOString()}
-- This migration updates all agent instructions with current content from Agent Instructions/*.md files

`;

  files.forEach(filename => {
    const filePath = path.join(AGENT_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = agentMetadata[filename];
    
    if (!metadata) {
      console.warn(`⚠️  No metadata found for ${filename}, skipping...`);
      return;
    }
    
    const { name, description, initialPrompt, avatarUrl } = extractAgentInfo(content, filename);
    
    console.log(`  ✅ ${name} (${content.length} characters)`);
    
    sql += `
-- Update ${name} agent
UPDATE agents 
SET 
  instructions = $agent_${metadata.role}$${escapeForDollarQuote(content)}$agent_${metadata.role}$,
  description = '${description.replace(/'/g, "''")}',
  initial_prompt = $prompt_${metadata.role}$${escapeForDollarQuote(initialPrompt)}$prompt_${metadata.role}$,
  avatar_url = '${avatarUrl}',
  sort_order = ${metadata.sort_order},
  is_default = ${metadata.is_default},
  is_free = ${metadata.is_free},
  is_restricted = ${metadata.is_restricted},
  role = '${metadata.role}',
  updated_at = NOW()
WHERE id = '${metadata.id}';

-- Insert ${name} if it doesn't exist
INSERT INTO agents (id, name, description, instructions, initial_prompt, avatar_url, sort_order, is_default, is_free, is_restricted, role)
SELECT 
  '${metadata.id}',
  '${name}',
  '${description.replace(/'/g, "''")}',
  $agent_${metadata.role}$${escapeForDollarQuote(content)}$agent_${metadata.role}$,
  $prompt_${metadata.role}$${escapeForDollarQuote(initialPrompt)}$prompt_${metadata.role}$,
  '${avatarUrl}',
  ${metadata.sort_order},
  ${metadata.is_default},
  ${metadata.is_free},
  ${metadata.is_restricted},
  '${metadata.role}'
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = '${metadata.id}');

`;
  });
  
  sql += `
-- Verify the migration
SELECT 
  name, 
  role, 
  LENGTH(instructions) as instruction_length,
  is_active, 
  is_default, 
  is_free,
  sort_order
FROM agents 
ORDER BY sort_order, name;
`;
  
  fs.writeFileSync(MIGRATION_FILE, sql);
  console.log(`\n✅ Migration file generated: ${MIGRATION_FILE}`);
  console.log(`📊 Total agents: ${files.length}`);
}

try {
  generateMigration();
} catch (error) {
  console.error('❌ Error generating migration:', error);
  process.exit(1);
}

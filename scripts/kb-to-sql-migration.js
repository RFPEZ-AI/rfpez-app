#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * CLI Tool: Convert Knowledge Base Markdown to SQL Migration
 * 
 * Usage: node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md" [agent-id]
 * 
 * This tool:
 * 1. Reads a knowledge base markdown file
 * 2. Parses knowledge entries with metadata
 * 3. Generates a SQL migration to insert knowledge memories
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

function parseKnowledgeBase(content) {
  const entries = [];
  
  // Split by ## headers (main sections)
  const sections = content.split(/\n##\s+/).filter(s => s.trim());
  
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    // Skip the file header
    if (title.includes('Knowledge Base Content')) continue;
    
    const entry = {
      title,
      id: null,
      type: 'knowledge',
      category: null,
      phase: null,
      importance: 0.8,
      content: '',
      tags: []
    };
    
    let contentStarted = false;
    let contentLines = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('### ID:')) {
        entry.id = line.replace('### ID:', '').trim();
      } else if (line.startsWith('### Type:')) {
        entry.type = line.replace('### Type:', '').trim();
      } else if (line.startsWith('### Category:')) {
        entry.category = line.replace('### Category:', '').trim();
      } else if (line.startsWith('### Phase:')) {
        entry.phase = line.replace('### Phase:', '').trim();
      } else if (line.startsWith('### Importance:')) {
        entry.importance = parseFloat(line.replace('### Importance:', '').trim());
      } else if (line.startsWith('### Tags:')) {
        const tagsStr = line.replace('### Tags:', '').trim();
        entry.tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
      } else if (line === '### Content:') {
        contentStarted = true;
      } else if (contentStarted && line.trim()) {
        contentLines.push(line);
      }
    }
    
    entry.content = contentLines.join('\n').trim();
    
    if (entry.id && entry.content) {
      entries.push(entry);
    }
  }
  
  return entries;
}

// Generate a unique dollar-quoting delimiter
function getUniqueDelimiter(texts, base) {
  let delimiter = base;
  let counter = 1;
  const allText = texts.join('');
  while (allText.includes(`$${delimiter}$`)) {
    delimiter = `${base}${counter}`;
    counter++;
  }
  return delimiter;
}

function escapeSQL(text, delimiter) {
  return `$${delimiter}$${text}$${delimiter}$`;
}

function generateMigration(entries, kbName, agentId = null) {
  // Generate timestamp in Supabase format
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const kbSlug = kbName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  // Get unique delimiter for all content
  const allContent = entries.map(e => e.content);
  const baseDelimiter = `kb_${kbSlug}_${timestamp}`;
  const delimiter = getUniqueDelimiter(allContent, baseDelimiter);
  
  // Build SQL for each entry
  const insertStatements = [];
  
  for (const entry of entries) {
    const metadata = {
      knowledge_id: entry.id,
      category: entry.category,
      importance: entry.importance,
      tags: entry.tags
    };
    
    if (entry.phase) {
      metadata.phase = entry.phase;
    }
    
    const metadataJson = JSON.stringify(metadata, null, 2);
    
    // Build INSERT statement
    const insert = `-- ${entry.title}
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata,
  search_vector
)
SELECT 
  ${agentId ? `(SELECT id FROM accounts LIMIT 1)` : `(SELECT id FROM accounts LIMIT 1)`},
  NULL, -- System knowledge (no specific user)
  '${entry.type}'::memory_type,
  ${escapeSQL(entry.content, delimiter)},
  NULL, -- Embedding will be generated later
  ${entry.importance},
  '${metadataJson.replace(/'/g, "''")}'::jsonb,
  to_tsvector('english', ${escapeSQL(entry.title + ' ' + entry.content, delimiter)})
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = '${entry.id}'
);`;
    
    insertStatements.push(insert);
  }
  
  const sql = `-- Knowledge Base: ${kbName}
-- Generated on ${new Date().toISOString()}
-- Source: ${kbName}.md
-- Entries: ${entries.length}

-- Insert knowledge base entries
${insertStatements.join('\n\n')}

-- Verify insertions
SELECT 
  memory_type,
  metadata->>'knowledge_id' as knowledge_id,
  metadata->>'category' as category,
  LEFT(content, 100) as content_preview,
  importance_score,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge'
  AND metadata->>'knowledge_id' IN (${entries.map(e => `'${e.id}'`).join(', ')})
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';
`;
  
  return { sql, timestamp, kbSlug };
}

function main() {
  log('\n📚 Knowledge Base Markdown to SQL Migration Generator', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Get the markdown file path from command line
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('\n❌ Error: No markdown file specified', 'red');
    log('\nUsage:', 'yellow');
    log('  node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md"', 'yellow');
    log('  node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md" agent-uuid', 'yellow');
    log('\nAvailable knowledge base files:', 'cyan');
    
    const scriptsDir = path.join(__dirname, '..', 'scripts');
    if (fs.existsSync(scriptsDir)) {
      const files = fs.readdirSync(scriptsDir).filter(f => f.includes('knowledge-base') && f.endsWith('.md'));
      files.forEach(f => log(`  - scripts/${f}`, 'blue'));
    }
    
    process.exit(1);
  }
  
  const mdPath = path.join(__dirname, '..', args[0]);
  const agentId = args[1] || null;
  
  if (!fs.existsSync(mdPath)) {
    log(`\n❌ Error: File not found: ${args[0]}`, 'red');
    process.exit(1);
  }
  
  log(`\n📖 Reading: ${args[0]}`, 'blue');
  if (agentId) {
    log(`   Agent ID: ${agentId}`, 'blue');
  }
  
  // Read and parse the markdown file
  const content = fs.readFileSync(mdPath, 'utf8');
  const entries = parseKnowledgeBase(content);
  
  if (entries.length === 0) {
    log('\n❌ Error: No valid knowledge entries found in markdown file', 'red');
    log('Expected format: ## Title with ### metadata fields and ### Content:', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ Parsed knowledge base:', 'green');
  log(`   Total entries: ${entries.length}`, 'bright');
  log(`   Avg importance: ${(entries.reduce((sum, e) => sum + e.importance, 0) / entries.length).toFixed(2)}`);
  
  log('\n📝 Knowledge entries:', 'cyan');
  entries.forEach((entry, i) => {
    log(`   ${i + 1}. ${entry.title}`, 'bright');
    log(`      ID: ${entry.id}`, 'blue');
    log(`      Type: ${entry.type}, Category: ${entry.category || 'N/A'}`);
    log(`      Importance: ${entry.importance}, Tags: ${entry.tags.join(', ') || 'none'}`);
    log(`      Content length: ${entry.content.length} chars`);
  });
  
  // Generate migration SQL
  log('\n🔨 Generating SQL migration...', 'blue');
  const kbName = path.basename(args[0], '.md');
  const { sql, timestamp, kbSlug } = generateMigration(entries, kbName, agentId);
  
  // Save migration file
  const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFile = `${timestamp}_load_${kbSlug}.sql`;
  const migrationPath = path.join(migrationDir, migrationFile);
  
  fs.writeFileSync(migrationPath, sql, 'utf8');
  
  log(`\n✅ Migration created: ${migrationFile}`, 'green');
  log(`   Path: ${migrationPath}`, 'bright');
  log(`   Size: ${(sql.length / 1024).toFixed(2)} KB`);
  log(`   Entries: ${entries.length}`);
  
  log('\n📝 Next steps:', 'cyan');
  log('   1. Review the generated SQL file', 'yellow');
  log('   2. Apply to local database: supabase migration up', 'yellow');
  log('   3. (Optional) Generate embeddings: node scripts/generate-embeddings.js', 'yellow');
  log('   4. Test knowledge search with agent', 'yellow');
  log('   5. Deploy to remote: supabase db push', 'yellow');
  
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

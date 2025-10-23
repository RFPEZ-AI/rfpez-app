/**
 * Load RFP Design Agent Knowledge Base
 * 
 * This script reads the knowledge base markdown file and creates
 * system-level knowledge memories that are accessible to all users.
 * 
 * Usage:
 *   node scripts/load-knowledge-base.js
 * 
 * Requirements:
 *   - Supabase service role key (uses anon key with service role JWT if needed)
 *   - Knowledge base migration must be applied first
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   REACT_APP_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse knowledge base markdown file
 * Format expected:
 * ## Section Title
 * ### ID: knowledge-id
 * ### Type: knowledge
 * ### Category: workflow|best-practices|troubleshooting|etc
 * ### Phase: 1-6 (optional)
 * ### Importance: 0.0-1.0
 * 
 * **Content:**
 * Content text here...
 */
function parseKnowledgeBase(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
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
        entry.tags.push(entry.category);
      } else if (line.startsWith('### Phase:')) {
        entry.phase = line.replace('### Phase:', '').trim();
        entry.tags.push(`phase-${entry.phase}`);
      } else if (line.startsWith('### Importance:')) {
        entry.importance = parseFloat(line.replace('### Importance:', '').trim());
      } else if (line.startsWith('**Content:**')) {
        contentStarted = true;
      } else if (contentStarted && line.trim() === '---') {
        // End of this entry
        break;
      } else if (contentStarted) {
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

/**
 * Generate text embedding using Supabase Edge Function
 */
async function generateEmbedding(text) {
  try {
    // Call the embedding generation edge function
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text }
    });
    
    if (error) throw error;
    return data.embedding;
  } catch (error) {
    console.warn('⚠️  Embedding generation failed, will insert without embedding:', error.message);
    return null;
  }
}

/**
 * Get RFP Design Agent ID
 */
async function getRFPDesignAgentId() {
  const { data, error } = await supabase
    .from('agents')
    .select('id')
    .eq('name', 'RFP Design')
    .single();
  
  if (error) {
    console.error('❌ Failed to get RFP Design agent:', error);
    throw error;
  }
  
  return data.id;
}

/**
 * Get default account ID (first account in system)
 * Returns NULL for system-wide knowledge
 */
async function getDefaultAccountId() {
  // System-wide knowledge doesn't need an account_id
  return null;
}

/**
 * Check if knowledge entry already exists
 */
async function knowledgeExists(accountId, knowledgeId) {
  let query = supabase
    .from('account_memories')
    .select('id')
    .eq('memory_type', 'knowledge')
    .ilike('content', `%ID: ${knowledgeId}%`)
    .limit(1);
  
  // For system-wide knowledge, filter by NULL user_id
  if (accountId === null) {
    query = query.is('user_id', null);
  } else {
    query = query.eq('account_id', accountId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.warn(`⚠️  Error checking existence for ${knowledgeId}:`, error);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Insert knowledge memory into database
 */
async function insertKnowledgeMemory(entry, accountId) {
  const metadata = {
    knowledge_id: entry.id,
    title: entry.title,
    category: entry.category,
    phase: entry.phase,
    tags: entry.tags,
    source: 'knowledge-base-script'
  };
  
  // Generate embedding
  console.log(`   Generating embedding for "${entry.title}"...`);
  const embedding = await generateEmbedding(entry.content);
  
  const record = {
    account_id: null,  // NULL for system-wide knowledge
    user_id: null,     // NULL for system-level memory
    session_id: null,
    memory_type: 'knowledge',
    content: `${entry.title}\n\nID: ${entry.id}\n\n${entry.content}`,
    importance_score: entry.importance,
    metadata,
    embedding
  };
  
  const { data, error } = await supabase
    .from('account_memories')
    .insert(record)
    .select('id')
    .single();
  
  if (error) {
    console.error(`   ❌ Failed to insert "${entry.title}":`, error);
    throw error;
  }
  
  return data.id;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Loading RFP Design Agent Knowledge Base\n');
  
  // Parse knowledge base file
  const knowledgeBasePath = path.join(__dirname, 'rfp-design-knowledge-base.md');
  console.log(`📖 Reading knowledge base from: ${knowledgeBasePath}`);
  
  const entries = parseKnowledgeBase(knowledgeBasePath);
  console.log(`   Found ${entries.length} knowledge entries\n`);
  
  // Get agent and account IDs
  console.log('🔍 Looking up agent and account...');
  const agentId = await getRFPDesignAgentId();
  const accountId = await getDefaultAccountId();
  console.log(`   RFP Design Agent ID: ${agentId}`);
  console.log(`   System-wide knowledge (account_id: NULL)\n`);
  
  // Insert knowledge entries
  console.log('💾 Inserting knowledge memories...\n');
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const entry of entries) {
    try {
      // Check if already exists
      const exists = await knowledgeExists(accountId, entry.id);
      
      if (exists) {
        console.log(`⏭️  Skipping "${entry.title}" (already exists)`);
        skipped++;
        continue;
      }
      
      console.log(`📝 Inserting "${entry.title}"...`);
      const memoryId = await insertKnowledgeMemory(entry, accountId);
      console.log(`   ✅ Created memory: ${memoryId}\n`);
      inserted++;
    } catch (error) {
      console.error(`   ❌ Failed to process "${entry.title}":`, error.message);
      failed++;
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📚 Total: ${entries.length}\n`);
  
  if (failed > 0) {
    console.log('⚠️  Some entries failed to insert. Check errors above.');
    process.exit(1);
  }
  
  console.log('✅ Knowledge base loaded successfully!');
}

// Run main function
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

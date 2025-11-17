const fs = require('fs');

// Read the UPDATE migration
const updateFile = 'supabase/migrations/20251116234524_update_tmc_tender_agent.sql';
const content = fs.readFileSync(updateFile, 'utf8');

// Extract the dollar-quoted strings
const instMatch = content.match(/instructions = (\$tmc_tender_\d+\$[\s\S]+?\$tmc_tender_\d+\$)/);
const initMatch = content.match(/initial_prompt = (\$tmc_tender_\d+\$[\s\S]+?\$tmc_tender_\d+\$)/);

if (!instMatch || !initMatch) {
  console.error('Could not extract instructions or initial_prompt');
  process.exit(1);
}

const instructions = instMatch[1];
const initialPrompt = initMatch[1];

// Create INSERT migration
const insertSQL = `-- Insert new TMC Tender Agent
-- Generated on 2025-11-16T23:47:00.000Z
-- Source: Agent Instructions/TMC Tender Agent.md

INSERT INTO agents (
  id,
  name,
  parent_agent_id,
  is_abstract,
  role,
  avatar_url,
  specialty,
  access,
  description,
  initial_prompt,
  instructions,
  created_at,
  updated_at
)
SELECT
  '1bfa8897-43c7-4270-8503-e91f59af40ab'::uuid,
  'TMC Tender',
  '021c53a9-8f7f-4112-9ad6-bc86003fadf7'::uuid,
  false,
  'tmc_tender',
  '/assets/avatars/tmc-tender-agent.svg',
  'tmc',
  ARRAY['RFP management: get_current_rfp, set_current_rfp', 'Artifacts: list_artifacts, select_active_artifact, create_document_artifact, create_form_artifact, update_form_data', 'Vendor selection: manage_vendor_selection', 'Email: send_email, search_emails, list_recent_emails', 'Perplexity: perplexity_search, perplexity_ask, perplexity_research, perplexity_reason', 'Memory: create_memory, search_memories', 'Conversation: get_conversation_history, store_message, search_messages', 'Agent switching: get_available_agents, get_current_agent, switch_agent, recommend_agent'],
  'Specialized tendering agent for Travel Management Company (TMC) procurement. Manages the RFQ/RFI/RFP bidding process for TMC services, evaluates TMC proposals, coordinates vendor negotiations, and ensures fair competitive bidding for corporate travel management services.',
  ${initialPrompt},
  ${instructions},
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM agents WHERE id = '1bfa8897-43c7-4270-8503-e91f59af40ab'
);

-- Verify insertion
SELECT
  id,
  name,
  parent_agent_id,
  specialty,
  role,
  inheritance_depth,
  LENGTH(instructions) as instructions_length
FROM agents
WHERE id = '1bfa8897-43c7-4270-8503-e91f59af40ab';
`;

// Write INSERT migration
const insertFile = 'supabase/migrations/20251116234700_insert_tmc_tender_agent.sql';
fs.writeFileSync(insertFile, insertSQL, 'utf8');
console.log('Created INSERT migration:', insertFile);
console.log('Size:', (fs.statSync(insertFile).size / 1024).toFixed(2), 'KB');

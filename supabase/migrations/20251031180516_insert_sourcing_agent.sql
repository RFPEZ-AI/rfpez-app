-- Insert Sourcing Agent
-- This must run before 20251031154119_update_sourcing_agent.sql

-- First, update the constraint to allow Sourcing as a system agent
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  ((name = ANY (ARRAY['Solutions'::text, 'RFP Design'::text, 'Support'::text, 'RFP Assistant'::text, 'Sourcing'::text])) AND account_id IS NULL)
  OR
  ((name <> ALL (ARRAY['Solutions'::text, 'RFP Design'::text, 'Support'::text, 'RFP Assistant'::text, 'Sourcing'::text])) AND account_id IS NOT NULL)
);

-- Now insert the Sourcing agent
INSERT INTO agents (
  id,
  name,
  role,
  description,
  instructions,
  initial_prompt,
  avatar_url,
  is_active,
  is_default,
  is_restricted,
  is_free,
  sort_order,
  access,
  account_id
) VALUES (
  '021c53a9-8f7f-4112-9ad6-bc86003fadf7'::uuid,
  'Sourcing',
  'sourcing',
  'Vendor discovery and supplier engagement specialist',
  'Initial instructions - will be updated by subsequent migration',
  'Hello! I''m the Sourcing Agent, specialized in finding qualified vendors and managing supplier engagement for your RFP. I can help you:

- Discover potential vendors using real-time web search
- Research supplier capabilities and certifications
- Create and manage vendor selection criteria
- Send professional RFP invitation emails with safety controls
- Track vendor responses and engagement

What would you like to do?',
  '/assets/avatars/sourcing-agent.svg',
  true,  -- is_active
  false, -- is_default
  false, -- is_restricted
  true,  -- is_free (accessible to authenticated users)
  5,     -- sort_order (after RFP Design agent)
  ARRAY['get_current_rfp', 'set_current_rfp', 'list_artifacts', 'select_active_artifact', 'create_document_artifact', 'update_form_data', 'send_email', 'search_emails', 'list_recent_emails', 'get_conversation_history', 'store_message', 'search_messages', 'create_memory', 'search_memories', 'get_available_agents', 'get_current_agent', 'switch_agent', 'recommend_agent', 'perplexity_search', 'perplexity_ask', 'perplexity_research', 'perplexity_reason']::text[],
  NULL   -- account_id (system agent, not account-specific)
)
ON CONFLICT (id) DO NOTHING;

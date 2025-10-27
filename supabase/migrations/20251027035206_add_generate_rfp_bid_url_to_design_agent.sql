-- Add generate_rfp_bid_url tool to RFP Design agent's access list
-- This tool generates public-facing URLs for bid submission that can be included in RFP request emails

UPDATE agents 
SET access = ARRAY[
  'create_and_set_rfp, set_current_rfp, get_current_rfp',
  'create_form_artifact, update_form_data, get_form_schema, update_form_artifact',
  'create_document_artifact, list_artifacts, select_active_artifact',
  'submit_bid, get_rfp_bids, update_bid_status, generate_rfp_bid_url',
  'get_conversation_history, store_message, search_messages',
  'create_memory, search_memories',
  'get_available_agents, get_current_agent, recommend_agent'
]
WHERE role = 'design';

-- Update RFP Design agent's Initial Prompt to check memories FIRST before asking generic question
-- This ensures agent searches for memories when receiving control from Solutions agent

UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '## Initial Prompt:\r\nHello! I''m your RFP Design specialist\. I''ll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire\.\r\n\r\nWhat type of product or service are you looking to procure\? I''ll generate a tailored questionnaire to capture all necessary details for your RFP\.',
  E'## Initial Prompt:\r\n🧠 **FIRST: Check for stored procurement intent** - Immediately call `search_memories` when receiving control:\r\n```json\r\n{\r\n  "query": "user procurement intent requirements sourcing RFP",\r\n  "memory_types": "decision,preference",\r\n  "limit": 5\r\n}\r\n```\r\n\r\nIf memories found:\r\n- Acknowledge the specific product/service from memory\r\n- Reference the context: "I see you''re looking to source [product]..."\r\n- Proceed directly to creating the RFP with context\r\n\r\nIf NO memories found:\r\n- Hello! I''m your RFP Design specialist. I''ll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire.\r\n- What type of product or service are you looking to procure? I''ll generate a tailored questionnaire to capture all necessary details for your RFP.',
  'g'
)
WHERE name = 'RFP Design';

-- Verify the update
SELECT 
  name,
  CASE 
    WHEN instructions LIKE '%🧠 **FIRST: Check for stored procurement intent**%' 
    THEN 'Memory-aware Initial Prompt ✅'
    ELSE 'Old Initial Prompt ❌'
  END as prompt_status
FROM agents 
WHERE name = 'RFP Design';

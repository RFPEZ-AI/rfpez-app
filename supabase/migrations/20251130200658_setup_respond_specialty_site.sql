-- Setup Respond Specialty Site
-- Creates the respond specialty site, links the Respond agent, and updates constraints

-- Update agents_account_id_check constraint to include 'Respond' in system agents
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check 
CHECK (
  (
    (name = ANY (ARRAY[
      'Solutions'::text, 
      'RFP Design'::text, 
      'Support'::text, 
      'RFP Assistant'::text, 
      'Sourcing'::text, 
      'TMC Specialist'::text, 
      'TMC Tender'::text, 
      'Respond'::text, 
      '_common'::text
    ])) 
    AND (account_id IS NULL)
  ) 
  OR 
  (
    (name <> ALL (ARRAY[
      'Solutions'::text, 
      'RFP Design'::text, 
      'Support'::text, 
      'RFP Assistant'::text, 
      'Sourcing'::text, 
      'TMC Specialist'::text, 
      'TMC Tender'::text, 
      'Respond'::text, 
      '_common'::text
    ])) 
    AND (account_id IS NOT NULL)
  )
);

-- Create the respond specialty site if it doesn't exist
INSERT INTO specialty_sites (id, name, slug, description, is_active)
VALUES (
  '055cf2ec-b289-4fab-84c4-b3e44e8d75db'::uuid,
  'Supplier Response',
  'respond',
  'Help suppliers create winning responses to RFP bid invitations. Store previous proposals, track deadlines, and submit competitive bids.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Link Respond agent to respond specialty site as the default agent
-- Use a subquery to get the actual specialty_site_id from the slug
INSERT INTO specialty_site_agents (specialty_site_id, agent_id, is_default_agent, sort_order)
SELECT 
  ss.id,
  'e06c2eb5-5da8-4ceb-8843-e8cd4b2e43b2'::uuid,
  true,
  0
FROM specialty_sites ss
WHERE ss.slug = 'respond'
ON CONFLICT (specialty_site_id, agent_id) DO UPDATE SET
  is_default_agent = EXCLUDED.is_default_agent,
  sort_order = EXCLUDED.sort_order;

-- Verify setup
SELECT 
  ss.name as specialty_site,
  ss.slug,
  a.name as agent_name,
  a.is_free,
  ssa.is_default_agent
FROM specialty_site_agents ssa
JOIN specialty_sites ss ON ssa.specialty_site_id = ss.id
JOIN agents a ON ssa.agent_id = a.id
WHERE ss.slug = 'respond';

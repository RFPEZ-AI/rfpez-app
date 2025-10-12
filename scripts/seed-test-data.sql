-- Seed Test Data for RFPEZ.AI Local Development
-- Copyright Mark Skiba, 2025 All rights reserved
-- 
-- This script creates a complete set of test data for local development:
-- - Test user profile
-- - Multiple RFPs (LED Lighting, Office Furniture, IT Services)
-- - Form artifacts linked to RFPs
-- - Sessions with messages
-- - Agents assignments
--
-- Usage:
--   docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres < scripts/seed-test-data.sql
--
-- Or from bash:
--   cat scripts/seed-test-data.sql | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

\echo '🌱 Starting test data seeding...'

-- Clean up existing test data (preserves schema)
\echo '🧹 Cleaning up existing test data...'
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE session_agents CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE rfp_artifacts CASCADE;
TRUNCATE TABLE artifacts CASCADE;
TRUNCATE TABLE rfps CASCADE;

-- Note: Not truncating user_profiles since that requires Supabase auth setup
-- You'll need to login via the UI first, which will create your user profile

-- Create test RFPs
\echo '📋 Creating test RFPs...'
INSERT INTO rfps (id, name, description, status, created_at, updated_at)
VALUES
  (1, 'LED Lighting Procurement', 'Procure energy-efficient LED bulbs for municipal facilities', 'draft', NOW() - INTERVAL '2 days', NOW()),
  (2, 'Office Furniture Replacement', 'Replace aging office furniture with ergonomic alternatives', 'draft', NOW() - INTERVAL '1 day', NOW()),
  (3, 'IT Services Contract', 'Annual IT support and maintenance services', 'gathering_requirements', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- Create form artifacts for LED Lighting RFP
\echo '📝 Creating form artifacts...'
INSERT INTO artifacts (
  id, 
  session_id, 
  name, 
  type, 
  artifact_role,
  schema, 
  ui_schema, 
  default_values,
  submit_action,
  status,
  created_at, 
  updated_at
)
VALUES
  -- LED Bulb Specifications Form
  (
    'led-bulb-specs-001',
    NULL, -- Not tied to a specific session
    'LED Bulb Technical Specifications',
    'form',
    'bid_form',
    '{
      "type": "object",
      "required": ["bulb_type", "wattage", "color_temp", "quantity"],
      "properties": {
        "bulb_type": {
          "type": "string",
          "enum": ["A19", "BR30", "PAR38", "T8"],
          "title": "Bulb Type"
        },
        "wattage": {
          "type": "number",
          "title": "Wattage",
          "minimum": 5,
          "maximum": 100
        },
        "color_temp": {
          "type": "string",
          "enum": ["2700K", "3000K", "4000K", "5000K"],
          "title": "Color Temperature"
        },
        "quantity": {
          "type": "integer",
          "title": "Quantity Required",
          "minimum": 1
        },
        "lumens": {
          "type": "number",
          "title": "Lumens Output",
          "minimum": 100
        }
      }
    }'::jsonb,
    '{
      "bulb_type": {"ui:widget": "select"},
      "color_temp": {"ui:widget": "radio"},
      "quantity": {"ui:widget": "updown"},
      "lumens": {"ui:help": "Minimum lumens per bulb"}
    }'::jsonb,
    '{
      "bulb_type": "A19",
      "wattage": 9,
      "color_temp": "3000K",
      "quantity": 500,
      "lumens": 800
    }'::jsonb,
    '{
      "type": "create_bid_item",
      "target": "rfp_bid_items",
      "label": "Add to Bid"
    }'::jsonb,
    'active',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- LED Installation Requirements Form
  (
    'led-install-req-001',
    NULL,
    'Installation Requirements',
    'form',
    'buyer_questionnaire',
    '{
      "type": "object",
      "required": ["install_location", "install_date"],
      "properties": {
        "install_location": {
          "type": "string",
          "title": "Installation Location",
          "enum": ["Indoor", "Outdoor", "Both"]
        },
        "install_date": {
          "type": "string",
          "format": "date",
          "title": "Required Installation Date"
        },
        "special_requirements": {
          "type": "string",
          "title": "Special Requirements"
        }
      }
    }'::jsonb,
    '{
      "special_requirements": {"ui:widget": "textarea"}
    }'::jsonb,
    '{
      "install_location": "Indoor",
      "install_date": "2025-11-01"
    }'::jsonb,
    '{
      "type": "update_rfp",
      "target": "rfp_requirements",
      "label": "Save Requirements"
    }'::jsonb,
    'active',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  -- Office Furniture Specifications Form
  (
    'furniture-specs-001',
    NULL,
    'Office Furniture Specifications',
    'form',
    'bid_form',
    '{
      "type": "object",
      "required": ["item_type", "quantity"],
      "properties": {
        "item_type": {
          "type": "string",
          "enum": ["Desk", "Chair", "Filing Cabinet", "Conference Table"],
          "title": "Furniture Type"
        },
        "quantity": {
          "type": "integer",
          "title": "Quantity",
          "minimum": 1
        },
        "color": {
          "type": "string",
          "title": "Preferred Color"
        },
        "material": {
          "type": "string",
          "enum": ["Wood", "Metal", "Composite"],
          "title": "Material"
        }
      }
    }'::jsonb,
    '{
      "item_type": {"ui:widget": "select"},
      "color": {"ui:widget": "color"}
    }'::jsonb,
    '{
      "item_type": "Chair",
      "quantity": 25,
      "material": "Composite"
    }'::jsonb,
    '{
      "type": "create_bid_item",
      "target": "rfp_bid_items",
      "label": "Add Item"
    }'::jsonb,
    'active',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  -- IT Services Scope Form
  (
    'it-services-scope-001',
    NULL,
    'IT Services Scope',
    'form',
    'bid_form',
    '{
      "type": "object",
      "required": ["service_type", "hours_per_month"],
      "properties": {
        "service_type": {
          "type": "string",
          "enum": ["Help Desk", "Network Support", "Security", "Cloud Services"],
          "title": "Service Type"
        },
        "hours_per_month": {
          "type": "number",
          "title": "Hours per Month",
          "minimum": 10
        },
        "response_time": {
          "type": "string",
          "enum": ["4 hours", "8 hours", "24 hours"],
          "title": "Required Response Time"
        }
      }
    }'::jsonb,
    '{
      "service_type": {"ui:widget": "radio"},
      "response_time": {"ui:widget": "radio"}
    }'::jsonb,
    '{
      "service_type": "Help Desk",
      "hours_per_month": 40,
      "response_time": "4 hours"
    }'::jsonb,
    '{
      "type": "create_bid_item",
      "target": "rfp_bid_items",
      "label": "Add Service"
    }'::jsonb,
    'active',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  );

-- Link artifacts to RFPs
\echo '🔗 Linking artifacts to RFPs...'
INSERT INTO rfp_artifacts (rfp_id, artifact_id, role, created_at)
VALUES
  (1, 'led-bulb-specs-001', 'supplier', NOW() - INTERVAL '2 days'),
  (1, 'led-install-req-001', 'buyer', NOW() - INTERVAL '2 days'),
  (2, 'furniture-specs-001', 'supplier', NOW() - INTERVAL '1 day'),
  (3, 'it-services-scope-001', 'supplier', NOW() - INTERVAL '5 days');

-- Note: Sessions and messages require a valid user_id from user_profiles
-- Since user_profiles requires Supabase auth, you'll need to:
-- 1. Login to the app first (creates your user profile automatically)
-- 2. Then manually create sessions/messages, or use the app to create them

\echo '💬 Skipping session creation (requires authenticated user)'
\echo '   Login to the app first, then sessions will be created automatically'

-- Display summary
\echo ''
\echo '✅ Test data seeding complete!'
\echo ''
\echo '📊 Summary:'
SELECT 
  '� RFPs' as entity, 
  COUNT(*)::text as count 
FROM rfps
UNION ALL
SELECT 
  '📝 Artifacts', 
  COUNT(*)::text 
FROM artifacts
UNION ALL
SELECT 
  '🔗 RFP-Artifact Links', 
  COUNT(*)::text 
FROM rfp_artifacts;

\echo ''
\echo '🎯 Test Data Available:'
\echo '  - RFP #1: LED Lighting Procurement (2 artifacts: 1 buyer, 1 supplier)'
\echo '  - RFP #2: Office Furniture Replacement (1 supplier artifact)'
\echo '  - RFP #3: IT Services Contract (1 supplier artifact)'
\echo ''
\echo '🔍 Quick Verification Queries:'
\echo '  -- View all RFPs with artifact counts:'
\echo '  SELECT r.id, r.name, COUNT(ra.artifact_id) as artifact_count'
\echo '  FROM rfps r'
\echo '  LEFT JOIN rfp_artifacts ra ON r.id = ra.rfp_id'
\echo '  GROUP BY r.id, r.name;'
\echo ''
\echo '  -- Test the fixed RPC function (get_rfp_artifacts):'
\echo '  SELECT artifact_id, artifact_name, artifact_role, created_at IS NOT NULL as has_created_at'
\echo '  FROM get_rfp_artifacts(1);'
\echo ''

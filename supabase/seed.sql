-- Agents are populated by migration 20251002030545_populate_agents_local.sql

-- Create anonymous user profile for unauthenticated sessions
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'anonymous@rfpez.ai',
  'anonymous',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "anonymous"}',
  '{"name": "Anonymous User"}',
  false,
  'authenticated'
);

-- Create a test user profile
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
  'ab0ff5c2-177a-4589-97f1-95ed9b77a00f',
  'test@local.dev',
  '$2a$10$test.hash.here',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User"}',
  false,
  'authenticated'
);

-- Create corresponding user profiles
INSERT INTO public.user_profiles (id, supabase_user_id, email, full_name, role, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'anonymous@rfpez.ai',
    'Anonymous User',
    'user',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'ab0ff5c2-177a-4589-97f1-95ed9b77a00f',
    'test@local.dev',
    'Test User',
    'user',
    NOW(),
    NOW()
  );
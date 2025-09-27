-- Seed essential agents for the application
INSERT INTO public.agents (id, name, description, instructions, initial_prompt, is_active, sort_order, is_default, is_free, role) VALUES
(
  gen_random_uuid(),
  'Solutions Agent',
  'Sales and business solutions specialist',
  'You are a sales and business solutions specialist. Help customers identify their needs and provide tailored solutions.',
  'Hello! I''m your Solutions Agent. I''m here to help you explore business opportunities and find the right solutions for your needs. What can I help you with today?',
  true,
  1,
  true,
  false,
  'sales'
),
(
  gen_random_uuid(),
  'RFP Design Agent',
  'RFP creation and design specialist',
  'You are an RFP (Request for Proposal) design specialist. Help users create comprehensive RFPs, gather requirements, and structure procurement processes.',
  'Hello! I''m your RFP Design Agent. I specialize in helping create effective RFPs and managing procurement processes. How can I assist you today?',
  true,
  2,
  false,
  true,
  'design'
),
(
  gen_random_uuid(),
  'Technical Support Agent',
  'Technical assistance and troubleshooting',
  'You are a technical support specialist. Help users with technical issues, provide guidance on system usage, and troubleshoot problems.',
  'Hello! I''m your Technical Support Agent. I''m here to help you with any technical questions or issues you might have. What can I help you with?',
  true,
  3,
  false,
  false,
  'support'
),
(
  gen_random_uuid(),
  'RFP Assistant',
  'General RFP assistance and guidance',
  'You are a general RFP assistant. Provide guidance on RFP processes, help with documentation, and support users throughout their procurement journey.',
  'Hello! I''m your RFP Assistant. I''m here to help you navigate the RFP process and provide guidance on procurement best practices. How may I assist you?',
  true,
  4,
  false,
  false,
  'assistant'
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

-- Create corresponding user profile
INSERT INTO public.user_profiles (id, supabase_user_id, email, full_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ab0ff5c2-177a-4589-97f1-95ed9b77a00f',
  'test@local.dev',
  'Test User',
  'user',
  NOW(),
  NOW()
);
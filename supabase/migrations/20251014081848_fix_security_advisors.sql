-- Fix Security Advisor Warnings
-- 1. Move vector extension from public schema to extensions schema
-- 2. Add search_path = '' to all functions with SECURITY DEFINER

-- ============================================================================
-- PART 1: Move vector extension to extensions schema
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the extension from public and recreate in extensions schema
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- PART 2: Fix function search_path for all affected functions
-- ============================================================================

-- Use ALTER FUNCTION to add SET search_path = '' to existing SECURITY DEFINER functions
-- This prevents search_path manipulation attacks

-- 1. set_user_current_session (uuid, uuid)
ALTER FUNCTION public.set_user_current_session(uuid, uuid) SET search_path = '';

-- 2. update_memory_access
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'update_memory_access'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.update_memory_access(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 3. cleanup_empty_welcome_sessions()
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'cleanup_empty_welcome_sessions'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.cleanup_empty_welcome_sessions(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 4. rank_bids_for_rfp
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'rank_bids_for_rfp'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.rank_bids_for_rfp(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 5. update_session_context_with_agent(uuid, integer, uuid, uuid)
ALTER FUNCTION public.update_session_context_with_agent(uuid, integer, uuid, uuid) SET search_path = '';

-- 6. get_memory_statistics
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_memory_statistics'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.get_memory_statistics(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 7. set_user_current_context - has two overloads
ALTER FUNCTION public.set_user_current_context(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.set_user_current_context(uuid, uuid, uuid) SET search_path = '';

-- 8. get_user_current_session(uuid)
ALTER FUNCTION public.get_user_current_session(uuid) SET search_path = '';

-- 9. search_agent_memories
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'search_agent_memories'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.search_agent_memories(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 10. get_rfp_artifacts(integer)
ALTER FUNCTION public.get_rfp_artifacts(integer) SET search_path = '';

-- 11. get_user_current_agent(uuid)
ALTER FUNCTION public.get_user_current_agent(uuid) SET search_path = '';

-- 12. save_form_data
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'save_form_data'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.save_form_data(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 13. update_bid_status
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'update_bid_status'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.update_bid_status(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 14. submit_bid
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'submit_bid'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.submit_bid(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 15. get_form_data
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_form_data'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.get_form_data(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 16. update_artifact_submissions_updated_at() - trigger function
ALTER FUNCTION public.update_artifact_submissions_updated_at() SET search_path = '';

-- 17. get_bid_response(integer)
ALTER FUNCTION public.get_bid_response(integer) SET search_path = '';

-- 18. get_latest_submission(text, uuid)
ALTER FUNCTION public.get_latest_submission(text, uuid) SET search_path = '';

-- 19. get_rfp_bids
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_rfp_bids'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.get_rfp_bids(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 20. cleanup_expired_memories
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_memories'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.cleanup_expired_memories(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- 21. update_artifact_save_timestamp() - trigger function
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_sig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'update_artifact_save_timestamp'
  LIMIT 1;
  
  IF func_sig IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.update_artifact_save_timestamp(%s) SET search_path = ''''', func_sig);
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- This migration fixes all security advisor warnings by:
-- 1. Moving vector extension from public to extensions schema
-- 2. Adding SET search_path = '' to all SECURITY DEFINER functions
-- 
-- This prevents search_path manipulation attacks and follows Supabase best practices

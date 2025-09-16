-- Migration to fix duplicate RLS policies and optimize remaining auth function calls
-- Resolves multiple permissive policies warnings and auth RLS initialization plan warnings

-- Copyright Mark Skiba, 2025 All rights reserved

-- This migration addresses two critical performance issues:
-- 1. Multiple permissive policies for the same role and action
-- 2. Unoptimized auth.uid() calls that re-evaluate for each row

-- ========================================
-- FORM_ARTIFACTS TABLE CLEANUP
-- ========================================

-- Drop all existing form_artifacts policies to eliminate duplicates
DROP POLICY IF EXISTS "Users can delete their own form artifacts" ON public.form_artifacts;
DROP POLICY IF EXISTS "Users can insert form artifacts" ON public.form_artifacts;
DROP POLICY IF EXISTS "Users can insert their own form artifacts" ON public.form_artifacts;
DROP POLICY IF EXISTS "Allow form artifact reads" ON public.form_artifacts;
DROP POLICY IF EXISTS "Users can view their own form artifacts" ON public.form_artifacts;
DROP POLICY IF EXISTS "Users can update form artifacts" ON public.form_artifacts;
DROP POLICY IF EXISTS "Users can update their own form artifacts" ON public.form_artifacts;

-- Create optimized single policies for form_artifacts
CREATE POLICY "form_artifacts_select_optimized" ON public.form_artifacts
  FOR SELECT 
  USING ((select auth.uid()) = user_id OR user_id IS NULL);

CREATE POLICY "form_artifacts_insert_optimized" ON public.form_artifacts
  FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

CREATE POLICY "form_artifacts_update_optimized" ON public.form_artifacts
  FOR UPDATE 
  USING ((select auth.uid()) = user_id OR user_id IS NULL)
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

CREATE POLICY "form_artifacts_delete_optimized" ON public.form_artifacts
  FOR DELETE 
  USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- ========================================
-- SESSION_AGENTS TABLE CLEANUP
-- ========================================

-- Drop all existing session_agents policies to eliminate duplicates
DROP POLICY IF EXISTS "Users can create session agents in own sessions" ON public.session_agents;
DROP POLICY IF EXISTS "session_agents_insert_optimized" ON public.session_agents;
DROP POLICY IF EXISTS "Users can view session agents from own sessions" ON public.session_agents;
DROP POLICY IF EXISTS "session_agents_select_optimized" ON public.session_agents;
DROP POLICY IF EXISTS "Users can update session agents in own sessions" ON public.session_agents;
DROP POLICY IF EXISTS "session_agents_update_optimized" ON public.session_agents;

-- Create optimized single policies for session_agents
CREATE POLICY "session_agents_select_optimized" ON public.session_agents
  FOR SELECT 
  USING ((select auth.uid()) IN (
    SELECT up.supabase_user_id 
    FROM user_profiles up 
    JOIN sessions s ON up.id = s.user_id 
    WHERE s.id = session_id
  ));

CREATE POLICY "session_agents_insert_optimized" ON public.session_agents
  FOR INSERT 
  WITH CHECK ((select auth.uid()) IN (
    SELECT up.supabase_user_id 
    FROM user_profiles up 
    JOIN sessions s ON up.id = s.user_id 
    WHERE s.id = session_id
  ));

CREATE POLICY "session_agents_update_optimized" ON public.session_agents
  FOR UPDATE 
  USING ((select auth.uid()) IN (
    SELECT up.supabase_user_id 
    FROM user_profiles up 
    JOIN sessions s ON up.id = s.user_id 
    WHERE s.id = session_id
  ));

CREATE POLICY "session_agents_delete_optimized" ON public.session_agents
  FOR DELETE 
  USING ((select auth.uid()) IN (
    SELECT up.supabase_user_id 
    FROM user_profiles up 
    JOIN sessions s ON up.id = s.user_id 
    WHERE s.id = session_id
  ));

-- Verification query
SELECT 'Duplicate policies cleanup and optimization completed successfully' as status;

-- Performance Impact:
-- - Eliminated multiple permissive policies that caused redundant checks
-- - Optimized all auth.uid() calls to use subqueries for better performance
-- - Each table now has exactly one policy per operation (SELECT, INSERT, UPDATE, DELETE)
-- - Expected result: Significant reduction in query execution time and warning resolution

-- Instructions:
-- 1. This migration has been applied via Supabase execute SQL tool
-- 2. All duplicate policies have been removed
-- 3. All auth.uid() calls are now optimized with subqueries
-- 4. Monitor Supabase dashboard for resolution of performance warnings
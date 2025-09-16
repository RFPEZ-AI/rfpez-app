-- Migration to optimize Row Level Security (RLS) performance
-- Fixes performance issue where auth.uid() is re-evaluated for each row
-- by wrapping auth function calls in subqueries

-- Copyright Mark Skiba, 2025 All rights reserved

-- Drop and recreate user_profiles RLS policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Re-create policies with subquery optimization for better performance
CREATE POLICY "Users can read own profile" ON public.user_profiles 
  FOR SELECT USING ((select auth.uid()) = supabase_user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK ((select auth.uid()) = supabase_user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING ((select auth.uid()) = supabase_user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles 
  FOR DELETE USING ((select auth.uid()) = supabase_user_id);

-- Drop and recreate session_artifacts RLS policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view session artifacts from own sessions" ON public.session_artifacts;
DROP POLICY IF EXISTS "Users can create session artifacts in own sessions" ON public.session_artifacts;
DROP POLICY IF EXISTS "Users can delete session artifacts from own sessions" ON public.session_artifacts;

-- Re-create policies with subquery optimization
CREATE POLICY "Users can view session artifacts from own sessions" ON public.session_artifacts FOR SELECT 
  USING ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can create session artifacts in own sessions" ON public.session_artifacts FOR INSERT 
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));
CREATE POLICY "Users can delete session artifacts from own sessions" ON public.session_artifacts FOR DELETE 
  USING ((select auth.uid()) IN (SELECT user_id FROM public.sessions WHERE id = session_id));

-- Test query to verify policies are working correctly
SELECT 'RLS performance optimization migration completed successfully' as status;

-- Instructions:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. Test that user authentication and access controls still work as expected
-- 3. Monitor performance improvements in query execution times
--
-- Performance Impact:
-- - Before: auth.uid() evaluated for every row in the table scan
-- - After: auth.uid() evaluated once per query and cached for reuse
-- - Expected improvement: Significant reduction in query time for large datasets
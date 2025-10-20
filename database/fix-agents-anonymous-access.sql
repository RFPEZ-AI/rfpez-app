-- Fix RLS policy to allow anonymous users to view active agents
-- This resolves the "No agent selected" error on homepage for anonymous users

-- Drop both existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents" ON public.agents;

-- Create a single comprehensive SELECT policy that handles both anonymous and authenticated users
-- The key is to check auth.uid() IS NULL FIRST to avoid calling functions that query user_profiles
CREATE POLICY "select_agents" ON public.agents 
  FOR SELECT 
  USING (
    is_active = true 
    AND (
      -- Anonymous users: MUST be checked first to short-circuit the OR
      -- Only non-restricted active agents (no database lookups)
      (auth.uid() IS NULL AND is_restricted = false)
      OR
      -- Authenticated users: additional checks allowed
      (auth.uid() IS NOT NULL AND (
        is_restricted = false 
        OR COALESCE(user_is_in_account(account_id, NULL::uuid), false)
        OR EXISTS (
          SELECT 1 FROM user_profiles up 
          WHERE up.supabase_user_id = auth.uid() 
          AND up.role = 'administrator'
        )
      ))
    )
  );

-- Grant SELECT permission to anonymous users explicitly
GRANT SELECT ON public.agents TO anon;
GRANT SELECT ON public.agents TO authenticated;

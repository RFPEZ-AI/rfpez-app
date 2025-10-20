-- Alternative approach: Create a SECURITY DEFINER function to bypass RLS for agent queries
-- This allows anonymous users to safely query agents without triggering user_profiles permission errors

-- First, let's create a simpler policy that just checks basic conditions
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents" ON public.agents;

-- Simple policy: Anonymous users see non-restricted active agents
-- Authenticated users see all active agents they have access to
CREATE POLICY "select_agents_v2" ON public.agents 
  FOR SELECT 
  USING (
    is_active = true 
    AND CASE 
      WHEN auth.uid() IS NULL THEN 
        -- Anonymous: only non-restricted agents
        is_restricted = false
      ELSE 
        -- Authenticated: check restrictions properly
        (
          is_restricted = false 
          OR account_id IS NULL
          OR (
            auth.uid() IS NOT NULL 
            AND (
              COALESCE((
                SELECT user_is_in_account(account_id, NULL::uuid)
              ), false)
              OR EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.supabase_user_id = auth.uid() 
                AND up.role = 'administrator'
              )
            )
          )
        )
    END
  );

-- Grant permissions
GRANT SELECT ON public.agents TO anon;
GRANT SELECT ON public.agents TO authenticated;

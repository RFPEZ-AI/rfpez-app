-- Simplest fix: Remove all user_profiles references from RLS policy
-- Anonymous users get non-restricted agents
-- Authenticated users get non-restricted agents + their account agents

DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents_v2" ON public.agents;

-- Ultra-simple policy with NO user_profiles references
CREATE POLICY "agents_select_policy" ON public.agents 
  FOR SELECT 
  USING (
    is_active = true 
    AND (
      -- Everyone sees non-restricted agents
      is_restricted = false
      OR
      -- Authenticated users ALSO see agents in their accounts (skip admin check for now)
      (auth.uid() IS NOT NULL AND account_id IS NOT NULL AND user_is_in_account(account_id, NULL::uuid))
    )
  );

-- Grant permissions
GRANT SELECT ON public.agents TO anon;
GRANT SELECT ON public.agents TO authenticated;

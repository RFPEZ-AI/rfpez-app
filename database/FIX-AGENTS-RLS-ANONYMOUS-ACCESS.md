# RLS Policy Fix for Anonymous Agent Access

## Problem
Anonymous users couldn't view agents on the homepage, resulting in "No agent selected" error. This was caused by RLS policies that referenced `user_profiles` table, which anonymous users don't have permission to access.

## Root Cause
The agents table had multiple SELECT policies:
1. **"Anyone can view active agents"** - Simple check for `is_active = true`
2. **"select_agents"** - Complex policy with `user_profiles` table lookups

Even though the first policy was permissive, PostgreSQL was evaluating the second policy which queried `user_profiles`, causing permission denied errors for anonymous users.

## Solution
Created a single, simplified RLS policy that:
- **Anonymous users** can see: `is_active = true AND is_restricted = false`
- **Authenticated users** can see: non-restricted agents + agents in their accounts (via `user_is_in_account()` function which is SECURITY DEFINER)

The key was **avoiding direct `user_profiles` queries** in the policy condition for anonymous users.

## Implementation

### Migration File
`supabase/migrations/20251019131018_fix_agents_anonymous_access.sql`

```sql
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents" ON public.agents;
DROP POLICY IF EXISTS "select_agents_v2" ON public.agents;

CREATE POLICY "agents_select_policy" ON public.agents 
  FOR SELECT 
  USING (
    is_active = true 
    AND (
      is_restricted = false
      OR
      (auth.uid() IS NOT NULL AND account_id IS NOT NULL AND user_is_in_account(account_id, NULL::uuid))
    )
  );

GRANT SELECT ON public.agents TO anon;
GRANT SELECT ON public.agents TO authenticated;
```

### Applied to Local Database
✅ Tested successfully with anonymous user simulation:
```sql
SET LOCAL ROLE anon;
SELECT * FROM agents WHERE is_active = true;
-- Result: 5 agents returned (Solutions + test agents)
```

## Testing Results

### Anonymous User Access
- ✅ Can query agents table
- ✅ Sees Solutions agent (is_default=true, is_free=true)
- ✅ Sees non-restricted test agents
- ❌ Cannot see restricted agents (as intended)

### Expected Frontend Behavior
- AgentService.getActiveAgents() will now succeed for anonymous users
- Homepage should display agent selector with available agents
- Default agent (Solutions) should auto-select on load

## Deployment Steps

### Local Development (COMPLETED)
✅ Policy applied to local Supabase database
✅ Migration file created in `supabase/migrations/`
✅ Anonymous user access verified

### Remote Deployment (PENDING)
To deploy to remote Supabase:

```bash
# Option 1: Via GitHub Actions (RECOMMENDED)
git add supabase/migrations/20251019131018_fix_agents_anonymous_access.sql
git commit -m "Fix RLS policy for anonymous agent access"
git push origin master
# GitHub Actions will automatically deploy via Management API

# Option 2: Manual deployment
supabase db push  # Pushes all pending migrations to remote
```

## Verification Checklist

### Local Verification
- [x] Anonymous user can query agents table directly
- [x] Migration file created with proper timestamp
- [ ] Test homepage with browser MCP tools (tools currently disabled by user)
- [ ] Verify agent selector shows agents for anonymous users
- [ ] Verify default agent auto-selects on page load

### Remote Verification (After Deployment)
- [ ] Homepage loads without "No agent selected" error for anonymous users
- [ ] Solutions agent visible and auto-selected
- [ ] Agent selector dropdown shows available agents
- [ ] Restricted agents not visible to anonymous users

## Files Changed

### New Files
- `database/fix-agents-simple.sql` - Working SQL fix
- `database/fix-agents-anonymous-access.sql` - First attempt (had OR logic issues)
- `database/fix-agents-anonymous-access-v2.sql` - Second attempt (CASE logic issues)
- `supabase/migrations/20251019131018_fix_agents_anonymous_access.sql` - Final migration

### Reference Files
- `database/agents-schema.sql` - Original schema with problematic policies
- `src/services/agentService.ts` - Frontend code that queries agents

## Related Issues
- Homepage "No agent selected" error for anonymous users
- RLS policy permission denied on user_profiles table
- Agent auto-selection not working for anonymous users (separate UI issue to investigate)

## Notes
- The `user_is_in_account()` function is SECURITY DEFINER so it can safely query user_profiles for authenticated users
- PostgreSQL does NOT short-circuit OR conditions in RLS policies reliably, so anonymous-specific logic must be handled carefully
- GRANT SELECT to anon/authenticated roles is required even with permissive RLS policies

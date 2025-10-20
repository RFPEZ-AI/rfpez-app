# Anonymous Agent Access - Ready for Testing

## ✅ COMPLETED

### RLS Policy Fix Applied
- **Issue**: Anonymous users couldn't view agents due to RLS policies referencing user_profiles table
- **Fix**: Simplified RLS policy that allows anonymous users to see non-restricted active agents
- **Status**: ✅ Applied to local Supabase database
- **Migration**: Created at `supabase/migrations/20251019131018_fix_agents_anonymous_access.sql`

### Database Verification
```sql
-- Test query as anonymous user
SET LOCAL ROLE anon;
SELECT id, name, is_default, is_free, is_restricted FROM agents WHERE is_active = true;

-- ✅ Result: 5 agents returned including Solutions (is_default=true)
```

### Files Changed
- ✅ `supabase/migrations/20251019131018_fix_agents_anonymous_access.sql` - Migration file ready for remote deployment
- ✅ `database/FIX-AGENTS-RLS-ANONYMOUS-ACCESS.md` - Detailed documentation of fix
- ✅ `database/fix-agents-simple.sql` - Source SQL for migration

## 🔄 NEXT STEPS

### 1. Browser Testing (REQUIRES MCP TOOLS)
Browser MCP tools were disabled by user during testing. To verify the fix works end-to-end:

```javascript
// Activate browser tools
activate_mcp_browser_navigation_tools();
activate_mcp_browser_visual_tools();

// Navigate to homepage
mcp_browser_navigate({ url: 'http://localhost:3100' });

// Take screenshot to verify no "No agent selected" error
mcp_browser_screenshot({ name: 'homepage-after-rls-fix' });

// Verify agent selector shows agents
mcp_browser_get_clickable_elements();
// Should show: Solutions agent, SELECT AGENT button (with agents in dropdown)
```

### 2. Verify Agent Auto-Selection
If agents load but "No agent selected" warning persists, investigate:
- `src/components/AgentSelector.tsx` - Check if default agent auto-selects on mount
- `src/hooks/useAgentManagement.ts` - Check initialization logic for anonymous users
- Look for code like: `if (agents.length > 0 && !selectedAgent) { selectDefaultAgent(); }`

### 3. Deploy to Remote Supabase

#### Option A: Automated via GitHub Actions (RECOMMENDED)
```bash
git add supabase/migrations/20251019131018_fix_agents_anonymous_access.sql
git add database/FIX-AGENTS-RLS-ANONYMOUS-ACCESS.md
git add database/fix-agents-simple.sql
git commit -m "Fix RLS policy for anonymous agent access"
git push origin master
```

GitHub Actions workflow `.github/workflows/deploy-migrations.yml` will automatically deploy the migration.

#### Option B: Manual Deployment
```bash
# Push migrations to remote
supabase db push

# Verify policy applied
# Check remote Supabase Dashboard → Database → Policies → agents table
```

### 4. Remote Verification
After deployment, test at remote URL (if deployed):
1. Open homepage without authentication
2. Verify no "No agent selected" error
3. Verify Solutions agent visible and selectable
4. Verify agent selector dropdown works
5. Verify restricted agents NOT visible to anonymous users

## 📋 TESTING CHECKLIST

### Local Testing
- [x] Database query as anonymous user succeeds
- [x] Migration file created
- [ ] Homepage loads without error (needs browser MCP tools)
- [ ] Agent selector shows agents (needs browser MCP tools)
- [ ] Default agent auto-selects (needs browser MCP tools)

### Remote Testing (After Deployment)
- [ ] Migration deployed successfully
- [ ] RLS policy visible in Supabase Dashboard
- [ ] Homepage works for anonymous users
- [ ] Agent selector functional
- [ ] Restricted agents hidden from anonymous users

## 🐛 KNOWN ISSUES TO INVESTIGATE

### If Agent Selector Still Shows Warning
- Check browser console for errors (not Jest test logs)
- Verify `AgentService.getActiveAgents()` is called on mount
- Verify agents state updates in `AgentSelector` component
- Check if default agent selection logic exists for anonymous users

### If Default Agent Not Auto-Selected
Search for initialization code:
```bash
# Find agent initialization code
grep -r "useEffect.*agents.*selectedAgent" src/components/
grep -r "defaultAgent" src/hooks/
grep -r "is_default.*true" src/
```

## 📝 SUMMARY

**What Was Fixed**: RLS policy on agents table now allows anonymous users to query non-restricted agents without permission errors on user_profiles table.

**What Works**: Anonymous database queries for agents return results successfully.

**What's Next**: Browser testing to verify frontend displays agents properly for anonymous users, then remote deployment.

**Deployment Ready**: Yes - migration file created and tested locally. Ready for GitHub Actions or manual `supabase db push`.

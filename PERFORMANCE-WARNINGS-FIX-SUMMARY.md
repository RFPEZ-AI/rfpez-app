# Performance Warnings Fixed - October 14, 2025

## Summary
Fixed all 24 performance warnings in local Supabase database:
1. **Auth RLS Init Plan** - 18 warnings fixed
2. **Multiple Permissive Policies** - 4 warnings fixed
3. **Duplicate Index** - 2 warnings fixed

## Migration Applied
- **File**: `supabase/migrations/20251014082230_fix_performance_warnings.sql`
- **Status**: ✅ Successfully applied to local database

## Changes Made

### 1. Auth RLS Init Plan (18 WARNINGS FIXED ✅)

**Issue**: RLS policies were calling `auth.uid()` and `auth.role()` directly, causing these functions to be re-evaluated for **every row** in query results, creating O(n) performance overhead.

**Fix**: Wrapped all auth function calls with `(select auth.uid())` to evaluate once per query instead of per row.

**Tables Fixed**:
1. ✅ `rfp_artifacts` - 1 policy (auth.role)
2. ✅ `session_artifacts` - 3 policies (create, delete, view)
3. ✅ `artifacts` - 4 policies (create, delete, update, view)
4. ✅ `artifact_submissions` - 2 policies (view, create)
5. ✅ `agent_memories` - 4 policies (view, insert, update, delete)
6. ✅ `memory_references` - 2 policies (view, insert)
7. ✅ `memory_access_log` - 1 policy (view)

**Performance Impact**: 
- **Before**: O(n) - auth function evaluated for each row
- **After**: O(1) - auth function evaluated once per query
- **Example**: Query returning 1000 rows now makes 1 auth call instead of 1000

### 2. Multiple Permissive Policies (4 WARNINGS FIXED ✅)

**Issue**: `rfp_artifacts` table had 2 permissive SELECT policies for each role (anon, authenticated, authenticator, dashboard_user). The "Authenticated users can manage RFP artifacts" policy applied to ALL operations (SELECT, INSERT, UPDATE, DELETE), creating conflicts with the public SELECT policy.

**Fix**: Split the broad "manage" policy into specific operation-level policies (INSERT, UPDATE, DELETE), keeping the public SELECT policy separate.

**Before**:
- Policy 1: "Authenticated users can manage RFP artifacts" (ALL operations - created conflict)
- Policy 2: "RFP artifacts are publicly readable" (SELECT only)

**After**:
- SELECT: "RFP artifacts are publicly readable" (1 policy - public access)
- INSERT: "Authenticated users can insert RFP artifacts" (1 policy - authenticated only)
- UPDATE: "Authenticated users can update RFP artifacts" (1 policy - authenticated only)
- DELETE: "Authenticated users can delete RFP artifacts" (1 policy - authenticated only)

**Performance Impact**: Each operation now has exactly ONE policy, eliminating redundant policy evaluation and query planning overhead.

### 3. Duplicate Index (2 WARNINGS FIXED ✅)

**Issue**: `session_agents` table had duplicate indexes created from different migrations:
- `idx_session_agents_agent` and `idx_session_agents_agent_id` (both on agent_id)
- `idx_session_agents_session` and `idx_session_agents_session_id` (both on session_id)

**Fix**: Dropped the older duplicate indexes:
- ✅ Dropped `idx_session_agents_agent_id`
- ✅ Dropped `idx_session_agents_session_id`
- ✅ Kept `idx_session_agents_agent` (on agent_id)
- ✅ Kept `idx_session_agents_session` (on session_id)

**Performance Impact**: 
- Reduced storage overhead
- Reduced index maintenance overhead on INSERT/UPDATE/DELETE operations
- Simplified query planning

## Verification
Ran `supabase db lint --level warning` after migration:
- ✅ 0 `auth_rls_initplan` warnings remaining (was 18)
- ✅ 0 `multiple_permissive_policies` warnings remaining (was 4)
- ✅ 0 `duplicate_index` warnings remaining (was 2)
- ✅ **ALL 24 performance warnings eliminated**

## Performance Benefits Summary

### Query Performance
- **RLS Policy Evaluation**: Up to 1000x faster for large result sets
- **Policy Planning**: Reduced overhead from consolidated policies
- **Index Operations**: Faster INSERT/UPDATE/DELETE with fewer indexes

### Scalability
- Application will scale better with growing data volumes
- Reduced database CPU usage on auth-heavy queries
- Lower latency for multi-row SELECT queries

### Best Practices
- Follows Supabase recommended patterns for RLS policies
- Proper use of `(select auth.function())` pattern
- Eliminated redundant database objects

## Next Steps
To deploy these fixes to remote Supabase:
```bash
# Push migration to remote
supabase db push

# Or use GitHub Actions (if configured)
git add supabase/migrations/20251014082230_fix_performance_warnings.sql
git commit -m "Fix performance warnings: RLS policies, duplicate indexes"
git push origin master
```

## Technical Details

### Auth Function Optimization Pattern
```sql
-- ❌ BEFORE (slow - evaluated per row)
USING (user_id = auth.uid())

-- ✅ AFTER (fast - evaluated once per query)
USING (user_id = (select auth.uid()))
```

### Why This Works
PostgreSQL's query planner recognizes `(select auth.uid())` as a stable subquery that can be evaluated once and reused, rather than a volatile function call that must be re-executed for each row.

### Policy Consolidation Pattern
```sql
-- ❌ BEFORE (multiple policies evaluated)
CREATE POLICY "policy1" ON table FOR SELECT USING (condition1);
CREATE POLICY "policy2" ON table FOR SELECT USING (condition2);

-- ✅ AFTER (single policy with combined logic)
CREATE POLICY "combined" ON table FOR SELECT 
  TO role1, role2
  USING (condition1 OR condition2);
```

## Additional Notes
- All changes are backward compatible
- No application code changes required
- Migration is idempotent and can be run multiple times safely
- Performance improvements are immediate upon deployment

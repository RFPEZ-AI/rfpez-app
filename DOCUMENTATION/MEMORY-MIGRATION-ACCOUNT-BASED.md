# Memory System Migration: Agent-Based → Account-Based

## Migration Details
**File:** `20251020165222_convert_memories_to_account_based.sql`  
**Date:** October 20, 2025  
**Status:** ✅ Applied Successfully

## Summary of Changes

### Architectural Change
**Before:** Memories were scoped to individual agents  
**After:** Memories are now account-based organizational assets

### Schema Changes

#### Removed Columns:
- ❌ `agent_id` (UUID) - No longer needed, memories are account-wide

#### Added Columns:
- ✅ `account_id` (UUID, NOT NULL) - Links memories to accounts
- ✅ Foreign key constraint to `accounts` table with CASCADE delete

#### Updated Indexes:
- ❌ Dropped: `idx_agent_memories_user_agent`
- ✅ Added: `idx_agent_memories_account` 
- ✅ Added: `idx_agent_memories_account_user`

### RLS Policy Changes

#### Old Policies (Removed):
```sql
-- User-based access only
"Users can view their own agent memories"
"Users can insert their own agent memories"
"Users can update their own agent memories"
"Users can delete their own agent memories"
```

#### New Policies (Active):
```sql
-- Account-based access for all account members
"Account users can view account memories"
"Account users can insert account memories"
"Account users can update account memories"
"Account users can delete account memories"
```

**Policy Logic:**
```sql
-- Example: SELECT policy
USING (
  account_id IN (
    SELECT au.account_id 
    FROM account_users au
    WHERE au.user_id = auth.uid()
  )
)
```

### Function Updates

#### Updated Functions:
1. **`search_agent_memories()`**
   - Changed parameter from `p_agent_id` to `p_account_id`
   - Filters by `account_id` instead of `agent_id`
   
2. **`search_agent_memories_fulltext()`**
   - Changed parameter from `p_agent_id` to `p_account_id`
   - Filters by `account_id` instead of `agent_id`

### Impact on Application

#### What This Means:

✅ **Team Collaboration:**
- All users in an account share the same memory pool
- Knowledge is organizational, not individual
- Team members can see and build upon each other's conversations

✅ **Consistency with Other Assets:**
- Memories now follow the same access pattern as RFPs, bids, artifacts, etc.
- All organizational assets are account-scoped

✅ **Multi-Tenancy:**
- Account-level isolation ensures data security
- Users in different accounts cannot access each other's memories
- Proper data segregation for SaaS model

#### Breaking Changes:

⚠️ **API Changes Required:**
- Memory creation/retrieval functions must pass `account_id` instead of `agent_id`
- Edge functions calling memory operations need updates
- Frontend memory tools need parameter updates

⚠️ **Agent Instructions:**
- Agents no longer have personal memory spaces
- All agents in an account share the same memory context
- Agent prompts referencing "agent memory" should be updated to "account memory"

### Current Table Structure

```sql
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  embedding vector(384),
  importance_score FLOAT,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector
);
```

### Verification

#### Structure Verified:
- ✅ `agent_id` column removed
- ✅ `account_id` column added (NOT NULL)
- ✅ Foreign key constraint to accounts table
- ✅ Indexes created for account-based queries
- ✅ RLS policies enforce account boundaries

#### No Data Loss:
- ✅ No existing memories in database (clean migration)
- ✅ Migration handles data migration logic for future use

### Next Steps

1. **Update Edge Functions:**
   - Modify memory tool calls to use `account_id` instead of `agent_id`
   - Update function signatures in `claude-api-v3`

2. **Update Agent Instructions:**
   - Replace references to "agent memory" with "account memory"
   - Update memory tool usage examples

3. **Test Memory Operations:**
   - Verify memory creation with account context
   - Test memory retrieval across account members
   - Verify isolation between different accounts

4. **Deploy to Remote:**
   ```bash
   supabase db push
   ```

### Migration Safety

✅ **Idempotent:** Can be run multiple times safely  
✅ **No Data Loss:** Includes data migration logic  
✅ **Rollback Safe:** Foreign key cascades ensure cleanup  
✅ **Performance:** New indexes optimize account-based queries

## Files Modified

1. **Migration File:** `supabase/migrations/20251020165222_convert_memories_to_account_based.sql`

## Related Issues

- Aligns memory system with account-based architecture
- Resolves inconsistency between memory access and other asset access
- Enables team collaboration through shared memory context

---

**Migration Status:** ✅ **COMPLETE**  
**Local Database:** ✅ **Updated**  
**Remote Database:** ⏸️ **Pending deployment**

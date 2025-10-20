# Memory System Edge Function Update

**Date**: October 20, 2025  
**Status**: ✅ Complete  
**Related Migrations**: 
- `20251020165222_convert_memories_to_account_based.sql`
- `20251020170232_rename_agent_memories_to_account_memories.sql`

## Issue Summary

After renaming the `agent_memories` table to `account_memories` and converting from agent-based to account-based architecture, the edge function memory tools were still using the old table name and parameters, causing memory creation to fail.

### Error Message
```
❌ Error creating memory: {
  code: "PGRST205",
  details: null,
  hint: "Perhaps you meant the table 'public.account_memories'",
  message: "Could not find the table 'public.agent_memories' in the schema cache"
}
```

## Changes Made

### File: `supabase/functions/claude-api-v3/tools/database.ts`

#### 1. **createMemory Function** (Lines ~2572-2610)

**Before:**
```typescript
// Insert memory record using user_profiles.id (not supabase auth id)
const { data: memory, error: memoryError } = await supabase
  .from('agent_memories')
  .insert({
    user_id: userProfileId,
    agent_id: agentId,
    session_id: sessionId,
    content: params.content,
    memory_type: params.memory_type,
    importance_score: params.importance_score,
    embedding: embedding,
    metadata: {}
  })
  .select('id')
  .single();
```

**After:**
```typescript
// Get the user's account_id from account_users
const { data: accountUser, error: accountError } = await supabase
  .from('account_users')
  .select('account_id')
  .eq('user_id', userProfileId)
  .single();

if (accountError || !accountUser) {
  console.error('❌ Error finding account for user:', accountError);
  throw new Error(`Account not found for user_id: ${userProfileId}`);
}

const accountId = accountUser.account_id;
console.log('✅ Found account_id:', accountId, 'for user_profile.id:', userProfileId);

// Generate placeholder embedding (will be replaced with real embeddings later)
const embedding = generatePlaceholderEmbedding();

// Insert memory record using account-based schema
const { data: memory, error: memoryError } = await supabase
  .from('account_memories')
  .insert({
    account_id: accountId,     // Account-based: shared across account users
    user_id: userProfileId,    // Track which user created the memory
    session_id: sessionId,
    content: params.content,
    memory_type: params.memory_type,
    importance_score: params.importance_score,
    embedding: embedding,
    metadata: {}
  })
  .select('id')
  .single();
```

**Key Changes:**
- ✅ Added account_id lookup from `account_users` table
- ✅ Changed table from `agent_memories` → `account_memories`
- ✅ Replaced `agent_id` parameter with `account_id`
- ✅ Memories now shared across all users in the account

#### 2. **searchMemories Function** (Lines ~2680-2710)

**Before:**
```typescript
const { data: memories, error } = await rpcClient.rpc('search_agent_memories', {
  query_user_id: userId,
  query_agent_id: agentId,
  query_embedding: queryEmbedding,
  memory_type_filter: memoryTypes || [],
  match_threshold: 0.5,
  match_count: limit
});
```

**After:**
```typescript
// Get user_profiles.id and account_id
const { data: userProfile, error: profileError } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('supabase_user_id', userId)
  .single();

// ... error handling ...

const { data: accountUser, error: accountError } = await supabase
  .from('account_users')
  .select('account_id')
  .eq('user_id', userProfileId)
  .single();

// ... error handling ...

const accountId = accountUser.account_id;
console.log('✅ Searching memories for account_id:', accountId);

// Call database search function with account-based parameters
const { data: memories, error } = await rpcClient.rpc('search_account_memories', {
  p_account_id: accountId,
  p_user_id: userProfileId,
  p_query_embedding: queryEmbedding,
  p_memory_types: memoryTypes || null,
  p_limit: limit,
  p_similarity_threshold: 0.5
});
```

**Key Changes:**
- ✅ Added user_profiles.id lookup
- ✅ Added account_id lookup from `account_users` table
- ✅ Changed function call from `search_agent_memories` → `search_account_memories`
- ✅ Updated parameter names to match new function signature:
  - `query_user_id` → `p_user_id`
  - `query_agent_id` → `p_account_id`
  - `query_embedding` → `p_query_embedding`
  - `memory_type_filter` → `p_memory_types`
  - `match_count` → `p_limit`
  - `match_threshold` → `p_similarity_threshold`

## Database Function Signature

```sql
CREATE OR REPLACE FUNCTION search_account_memories(
  p_account_id UUID,
  p_user_id UUID,
  p_query_embedding VECTOR(384),
  p_memory_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold DOUBLE PRECISION DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  memory_type TEXT,
  importance_score DOUBLE PRECISION,
  similarity DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  metadata JSONB
)
```

## Testing

### Memory Creation Test
1. ✅ Edge runtime restarted successfully
2. ⏸️ Ready for user to test: "create a memory of this project"
3. ⏸️ Verify in database:
   ```sql
   SELECT id, content, memory_type, account_id, user_id
   FROM account_memories
   ORDER BY created_at DESC
   LIMIT 1;
   ```

### Memory Search Test
1. ⏸️ Test search: "search for memories about LED desk lamp"
2. ⏸️ Verify account-based access (should see memories from all account users)

## Architecture Benefits

### Account-Based Memory System
- **Shared Knowledge**: All users in an account can access the same memories
- **Team Collaboration**: Memories persist across user sessions within the account
- **Multi-Tenancy**: Complete isolation between different accounts
- **Consistent Pattern**: Aligns with other account-scoped resources (RFPs, artifacts, bids)

### Access Control
- RLS policies ensure users can only access memories from their account(s)
- Uses `account_users` junction table for membership verification
- Memories track both account (scope) and user (creator) for audit trail

## Next Steps

1. ✅ Edge function updated
2. ✅ Edge runtime restarted
3. ⏸️ User testing of memory creation
4. ⏸️ User testing of memory search
5. ⏸️ Verify account-based isolation
6. ⏸️ Deploy to remote Supabase
7. ⏸️ Update agent instructions if needed

## Related Documentation

- `DOCUMENTATION/MEMORY-MIGRATION-ACCOUNT-BASED.md` - Database migration details
- `DOCUMENTATION/AGENTS.md` - Multi-agent system overview
- `.github/copilot-instructions.md` - Memory MCP integration patterns

---

**Status**: Edge function code updated and runtime restarted. Ready for testing memory creation and search operations with the new account-based architecture.

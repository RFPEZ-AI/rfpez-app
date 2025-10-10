# Agent Memory System - Testing Guide

## Quick Testing Checklist

### Prerequisites
- ✅ Local Supabase running: `supabase status`
- ✅ Migration applied: `supabase db reset` (confirms all migrations)
- ✅ Dev server running: VS Code Task "Start Development Server"
- ✅ Test user authenticated in browser

### Test 1: Manual Memory Storage
**Goal:** Verify we can store memories with embeddings

```typescript
// In browser console or test file
import { MemoryService } from './services/memoryService';

// Get current user ID (from Supabase auth)
const { data: { user } } = await supabaseClient.auth.getUser();
const userId = user?.id;

// Store a test preference
await MemoryService.storePreference(
  userId,
  'agent-uuid-here', // Use real agent ID from database
  'User prefers LED lighting with high energy efficiency ratings',
  { category: 'rfp_preferences', confidence: 0.9 }
);

// Expected: Success response with memory ID
// Check database: SELECT * FROM agent_memories WHERE user_id = 'user-uuid';
```

**Validation:**
- Memory appears in `agent_memories` table
- `embedding` field is populated (vector of 384 dimensions)
- `memory_type` is 'preference'
- `user_id` matches authenticated user

### Test 2: Semantic Search
**Goal:** Verify semantic search returns relevant memories

```typescript
// Search for memories related to a query
const results = await MemoryService.searchMemories(
  userId,
  'agent-uuid-here',
  'What are my lighting preferences?',
  { limit: 5, similarityThreshold: 0.7 }
);

console.log('Search results:', results);

// Expected: Array of MemorySearchResult objects
// Should include the LED preference memory from Test 1
// relevance_score should be > 0.7
```

**Validation:**
- Returns array of matching memories
- Relevance scores are > 0.7
- Most relevant memory appears first
- Memory content is complete

### Test 3: Memory Context Building
**Goal:** Verify context formatting for Claude prompts

```typescript
// Build context from memories
const context = await MemoryService.buildMemoryContext(
  userId,
  'agent-uuid-here',
  'Create an RFP for LED lighting',
  { limit: 5, similarityThreshold: 0.75 }
);

console.log('Memory context:', context);

// Expected: Formatted string with "RELEVANT MEMORIES FROM PREVIOUS INTERACTIONS:" header
// Contains memory snippets with timestamps and metadata
```

**Validation:**
- Context string starts with proper header
- Contains memory content
- Includes timestamps and relevance scores
- Format is Claude-friendly (clear sections)

### Test 4: Integration with Claude API
**Goal:** Verify memory context appears in Claude conversations

**Steps:**
1. Log in to RFPEZ.AI app
2. Create a new session
3. Store a memory manually (using Test 1 code in console)
4. Send a message related to that memory
5. Check Claude's response for evidence of memory usage

**Expected Behavior:**
- Claude's system prompt includes memory context
- Response reflects knowledge from stored memories
- No errors in console or edge function logs

**Debug Points:**
```typescript
// In claudeService.ts generateResponse method (around line 740)
console.log('Memory context built:', memoryContext);

// In edge function system-prompt.ts buildSystemPrompt (around line 180)
console.log('Has memory context:', !!context.memoryContext);
```

### Test 5: Memory Access Tracking
**Goal:** Verify memory retrieval is logged

```typescript
// After Test 2 (semantic search), check access log
const { data: accessLog } = await supabaseClient
  .from('memory_access_log')
  .select('*')
  .eq('user_id', userId)
  .order('accessed_at', { ascending: false })
  .limit(5);

console.log('Recent memory access:', accessLog);

// Expected: Entries for each searchMemories call
// Includes query_text and relevance_score
```

**Validation:**
- Access log entries created for searches
- Query text captured correctly
- Timestamps are accurate
- User ID matches

### Test 6: RLS Policies
**Goal:** Verify users can only access their own memories

**Steps:**
1. Create memory as User A
2. Log out, log in as User B
3. Try to search for User A's memories
4. Verify User B gets no results

**Expected:**
- User B cannot see User A's memories
- No errors (just empty results)
- Database enforces user_id isolation

### Test 7: Performance Under Load
**Goal:** Measure memory system performance impact

```typescript
// Measure context building time
const start = performance.now();
const context = await MemoryService.buildMemoryContext(
  userId,
  agentId,
  'test query',
  { limit: 5, similarityThreshold: 0.75 }
);
const duration = performance.now() - start;

console.log(`Context building took ${duration}ms`);

// Expected: < 200ms for typical query
```

**Benchmarks:**
- Embedding generation: 50-100ms
- Vector search: 5-10ms
- Total context building: 100-150ms
- Acceptable impact on response time

### Test 8: Error Handling
**Goal:** Verify graceful fallbacks when memory system fails

**Test Scenarios:**
1. **Invalid user ID:** Should log warning, continue without memory
2. **Invalid agent ID:** Should log warning, continue without memory
3. **Database error:** Should catch error, continue without memory
4. **Empty search results:** Should return empty context string

**Expected:**
- No crashes or unhandled errors
- Claude conversations continue normally
- Error messages logged for debugging
- User experience unaffected

## SQL Test Queries

### Check Memory Storage
```sql
-- View all memories for a user
SELECT 
  id, 
  memory_type, 
  LEFT(content, 100) as content_preview,
  importance,
  created_at,
  array_length(embedding, 1) as embedding_dimensions
FROM agent_memories 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Test Vector Search
```sql
-- Direct vector search test
SELECT 
  content,
  1 - (embedding <=> '[0.1, 0.2, 0.3, ...]'::vector) as similarity
FROM agent_memories
WHERE user_id = 'user-uuid-here'
ORDER BY embedding <=> '[0.1, 0.2, 0.3, ...]'::vector
LIMIT 5;
```

### Check Access Logs
```sql
-- Recent memory access activity
SELECT 
  mal.accessed_at,
  mal.query_text,
  mal.relevance_score,
  am.content
FROM memory_access_log mal
JOIN agent_memories am ON mal.memory_id = am.id
WHERE mal.user_id = 'user-uuid-here'
ORDER BY mal.accessed_at DESC
LIMIT 10;
```

### Memory Statistics
```sql
-- Use the built-in stats function
SELECT * FROM get_memory_statistics('agent-uuid-here');

-- Expected output:
-- total_memories, avg_importance, memory_type_distribution, recent_access_count
```

## Browser Console Testing

### Quick Test Script
```javascript
// Paste this in browser console (when logged in to RFPEZ.AI)

// 1. Get current user
const { data: { user } } = await window.supabaseClient.auth.getUser();
console.log('User ID:', user?.id);

// 2. Get agent ID (from UI or database)
const { data: agents } = await window.supabaseClient
  .from('agents')
  .select('id, name')
  .eq('name', 'RFP Design')
  .single();
console.log('Agent:', agents);

// 3. Import MemoryService (adjust path if needed)
const { MemoryService } = await import('./services/memoryService');

// 4. Store test memory
const result = await MemoryService.storePreference(
  user.id,
  agents.id,
  'Test preference: I prefer eco-friendly products',
  { category: 'test', confidence: 1.0 }
);
console.log('Stored memory:', result);

// 5. Search for it
const search = await MemoryService.searchMemories(
  user.id,
  agents.id,
  'eco-friendly preferences',
  { limit: 5, similarityThreshold: 0.5 }
);
console.log('Search results:', search);

// 6. Build context
const context = await MemoryService.buildMemoryContext(
  user.id,
  agents.id,
  'eco-friendly',
  { limit: 5, similarityThreshold: 0.5 }
);
console.log('Memory context:\n', context);
```

## Edge Function Testing

### Test Memory Context in Edge Function

1. **Add debug logging:**
```typescript
// In supabase/functions/claude-api-v3/handlers/http.ts
console.log('📝 Memory context received:', memoryContext?.substring(0, 200));
```

2. **Deploy and test:**
```bash
# Deploy edge function
supabase functions deploy claude-api-v3

# Send test request
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Test message",
    "agent": {...},
    "memoryContext": "Test memory context",
    "sessionId": "test-session"
  }'
```

3. **Check logs:**
```bash
# Local logs (immediate)
supabase functions serve claude-api-v3 --debug

# Remote logs (after deployment)
supabase functions logs claude-api-v3 --follow
```

## Success Criteria

### Phase 3 Complete ✅
- [x] Memories stored with embeddings
- [x] Semantic search returns relevant results
- [x] Memory context formatted for Claude
- [x] Context appears in system prompts (both paths)
- [x] Access logging works
- [x] RLS policies enforce isolation
- [x] Error handling graceful
- [x] Performance acceptable (<200ms impact)

## Troubleshooting

### Issue: "generateEmbedding is not a function"
**Cause:** MemoryService not imported correctly  
**Fix:** Check import path, rebuild if necessary

### Issue: Empty search results
**Cause:** Similarity threshold too high or no memories stored  
**Fix:** Lower threshold to 0.5, verify memories exist in database

### Issue: "embedding column does not exist"
**Cause:** Migration not applied  
**Fix:** Run `supabase db reset` to apply all migrations

### Issue: RLS policy blocks access
**Cause:** User not authenticated or wrong user_id  
**Fix:** Verify auth state, check user_id matches

### Issue: Slow embedding generation
**Cause:** Model loading on first call  
**Fix:** Expected behavior, subsequent calls will be faster

## Next Steps After Testing

1. **If all tests pass:** Move to Phase 4 (Automatic Extraction)
2. **If issues found:** Debug and fix before proceeding
3. **Performance concerns:** Consider caching strategies
4. **Production readiness:** Run comprehensive load tests

## Useful Queries

```sql
-- Clean up test data
DELETE FROM agent_memories WHERE content LIKE '%Test%';

-- Reset auto-increment
ALTER SEQUENCE agent_memories_id_seq RESTART WITH 1;

-- Check embedding dimensions
SELECT MIN(array_length(embedding, 1)), MAX(array_length(embedding, 1))
FROM agent_memories;

-- Find orphaned memories (no references)
SELECT am.* FROM agent_memories am
LEFT JOIN memory_references mr ON am.id = mr.memory_id
WHERE mr.id IS NULL;
```

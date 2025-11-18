# Cache Management API

## Overview

The Claude API v3 edge function includes cache management endpoints for flushing and monitoring agent instruction caches. This is useful when agent instructions are updated and you need to force a reload.

## Endpoints

### 1. Get Cache Statistics

**Endpoint:** `GET /functions/v1/claude-api-v3/cache/stats`

**Description:** Returns statistics about the current agent cache, including number of cached agents and their age.

**Example Request:**
```bash
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/stats
```

**Example Response:**
```json
{
  "success": true,
  "cache": {
    "size": 3,
    "entries": [
      {
        "agentId": "4fe117af-da1d-410c-bcf4-929012d8a673",
        "agentName": "Solutions",
        "age": 145
      },
      {
        "agentId": "8c5f11cb-1395-4d67-821b-89dd58f0c8dc",
        "agentName": "RFP Design",
        "age": 89
      }
    ]
  },
  "timestamp": "2025-11-18T05:42:30.123Z"
}
```

**Response Fields:**
- `success` - Boolean indicating request success
- `cache.size` - Total number of cached agents
- `cache.entries` - Array of cached agent details
  - `agentId` - UUID of the agent
  - `agentName` - Name of the agent
  - `age` - Age of cache entry in seconds
- `timestamp` - ISO 8601 timestamp of the response

---

### 2. Flush Agent Cache

**Endpoint:** `GET /functions/v1/claude-api-v3/cache/flush`

**Description:** Clears the agent cache, forcing a fresh reload of agent instructions on the next request.

#### Flush All Agents

**Example Request:**
```bash
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/flush
```

**Example Response:**
```json
{
  "success": true,
  "message": "All agent caches cleared",
  "timestamp": "2025-11-18T05:42:30.123Z"
}
```

#### Flush Specific Agent

**Query Parameters:**
- `agentId` - UUID of the agent to invalidate (optional)

**Example Request:**
```bash
curl "http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/flush?agentId=4fe117af-da1d-410c-bcf4-929012d8a673"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Cache invalidated for agent: 4fe117af-da1d-410c-bcf4-929012d8a673",
  "timestamp": "2025-11-18T05:42:30.123Z"
}
```

---

## Common Use Cases

### After Updating Agent Instructions

When you update agent instructions via SQL migration or direct database update:

```bash
# 1. Update agent instructions in database
UPDATE agents SET instructions = '...' WHERE id = '4fe117af-da1d-410c-bcf4-929012d8a673';

# 2. Flush the cache for that specific agent
curl "http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/flush?agentId=4fe117af-da1d-410c-bcf4-929012d8a673"

# 3. Verify cache was cleared
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/stats
```

### After Bulk Agent Updates

When you update multiple agents at once:

```bash
# Flush all agent caches
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/flush

# Verify all caches cleared
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/stats
```

### Monitoring Cache Performance

Check cache hit rates during development:

```bash
# Check cache stats periodically
watch -n 5 'curl -s http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/stats | jq'
```

---

## Cache Behavior

### Cache TTL

Agent caches have a **5-minute TTL (time-to-live)**. After 5 minutes, cached agents are automatically evicted and reloaded from the database on the next request.

### Cache Invalidation

Caches are invalidated in the following scenarios:

1. **Manual flush** - Using the `/cache/flush` endpoint
2. **TTL expiration** - After 5 minutes of inactivity
3. **Edge runtime restart** - All caches are cleared when the runtime restarts

### Cache Keys

Agents are cached by their UUID (`agent_id`). The cache includes:
- Merged agent instructions (with inheritance)
- Tool access permissions
- Agent metadata (name, role, etc.)
- Inheritance chain information

---

## Production vs Local

### Local Development

Use the local Supabase endpoint:
```bash
curl http://127.0.0.1:54321/functions/v1/claude-api-v3/cache/flush
```

### Production

Use the remote Supabase endpoint:
```bash
curl https://jxlutaztoukwbbgtoulc.supabase.co/functions/v1/claude-api-v3/cache/flush
```

**⚠️ Note:** Cache flush endpoints are unauthenticated for convenience during development. In production, you may want to add authentication checks.

---

## Implementation Details

The cache management system is implemented in:

- **Cache Logic:** `supabase/functions/claude-api-v3/utils/agent-inheritance.ts`
  - `clearAgentCache()` - Clears all cached agents
  - `invalidateAgentCache(agentId)` - Invalidates specific agent cache
  - `getCacheStats()` - Returns cache statistics

- **HTTP Endpoints:** `supabase/functions/claude-api-v3/index.ts`
  - GET `/cache/stats` - Cache statistics
  - GET `/cache/flush` - Cache flush (with optional `agentId` parameter)

---

## Error Handling

All endpoints return proper HTTP status codes:

- **200 OK** - Successful request
- **405 Method Not Allowed** - Wrong HTTP method (must be GET)
- **500 Internal Server Error** - Unexpected error

Example error response:
```json
{
  "error": "Internal server error",
  "message": "Detailed error message",
  "timestamp": "2025-11-18T05:42:30.123Z"
}
```

---

## Best Practices

1. **After Agent Updates:** Always flush the cache after updating agent instructions to ensure changes are immediately visible.

2. **Specific vs Full Flush:** Use specific agent cache invalidation when possible to avoid clearing unrelated caches.

3. **Verify Changes:** Use the `/cache/stats` endpoint to verify caches were cleared successfully.

4. **Production Deployments:** Consider flushing caches as part of your deployment workflow when updating agent instructions.

5. **Monitoring:** Periodically check cache stats to understand cache hit rates and performance.

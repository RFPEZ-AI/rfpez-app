# Edge Runtime Lock File Fix

## Problem
Supabase Edge Runtime fails with Deno integrity check errors:
```
error: Integrity check failed for remote specifier. The source code is invalid, as it does not match the expected hash in the lock file.
  Specifier: https://esm.sh/@supabase/supabase-js@2.45.0
```

Edge Functions return **502 Bad Gateway** errors.

## Quick Fix (Recommended)

```bash
# 1. Stop and remove Edge Runtime container
docker stop supabase_edge_runtime_rfpez-app-local
docker rm supabase_edge_runtime_rfpez-app-local

# 2. Delete all Deno lock files
find supabase/functions -name "deno.lock" -delete
find supabase/functions -name ".deno" -type d -exec rm -rf {} + 2>/dev/null || true

# 3. Restart Supabase (creates fresh Edge Runtime)
supabase stop
supabase start
```

## Verification

```bash
# Test Edge Function
curl -s -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)" \
  -d '{"messages":[{"role":"user","content":"test"}],"session_id":"test"}'

# Should return: {"success":true,"content":"..."}
```

## VS Code Task Alternative

Use the task: **"Fix Edge Runtime Lock Issues"**
- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Fix Edge Runtime Lock Issues"

## Root Cause

Deno caches remote dependencies with integrity hashes in lock files. When the upstream source changes (e.g., `@supabase/supabase-js` updated) but the lock file isn't regenerated, the integrity check fails.

## Prevention

After updating Edge Function dependencies:
1. Delete `deno.lock` files
2. Restart Edge Runtime to regenerate locks
3. Commit regenerated lock files (if they exist)

## Related Issues

- **MCP Browser Testing**: Edge Function errors block browser automation tests
- **Local Development**: All Claude API calls fail when Edge Runtime is broken
- **Tool Testing**: Cannot validate tool execution locally

## Last Updated
October 25, 2025 - Successfully fixed persistent lock file corruption

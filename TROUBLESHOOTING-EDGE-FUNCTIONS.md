# Edge Functions Troubleshooting Guide

## Common Issue: 502 Bad Gateway / Deno Lock File Corruption

### Symptoms
- Edge function returns `502 Bad Gateway`
- Error in logs: `Integrity check failed for remote specifier`
- Hash mismatch between cached dependencies and lock file

### Root Cause
Deno caches dependencies with integrity hashes in `deno.lock` files. When:
1. A dependency updates on the CDN (esm.sh/@supabase/supabase-js)
2. Edge runtime uses an old cached version
3. Hash mismatch occurs → edge runtime fails to start

### Quick Fix (Manual)
```bash
# 1. Stop Supabase
supabase stop

# 2. Delete all Deno lock files
find supabase/functions -name "deno.lock" -delete
# Windows: del /s /q supabase\functions\deno.lock

# 3. Restart Supabase (regenerates lock files)
supabase start
```

### Prevention (Automatic)
**Use the shutdown script** - it now automatically cleans lock files:

**Linux/Mac:**
```bash
./scripts/shutdown-workspace.sh
```

**Windows:**
```bash
scripts\shutdown-workspace.bat
```

Or use VS Code task: `Ctrl+Shift+P` → "Tasks: Run Task" → "Shutdown Workspace"

### What the Shutdown Script Does
1. ✅ Backs up Supabase database
2. ✅ **Cleans Deno lock files** (prevents corruption)
3. ✅ Stops Supabase services gracefully
4. ✅ Cleans up Docker containers

### Why This Works
- Lock files are regenerated fresh on `supabase start`
- No stale hashes from previous dependency versions
- Edge runtime gets clean cache state

### Alternative: VS Code Task
There's also a dedicated task for lock file issues:

`Ctrl+Shift+P` → "Tasks: Run Task" → "Fix Edge Runtime Lock Issues"

This task:
1. Clears edge runtime internal cache
2. Deletes all function lock files
3. Restarts edge runtime container

### Best Practices
1. **Always use shutdown script** when closing workspace
2. **Don't manually edit** `deno.lock` files
3. **Regenerate locks** after dependency updates
4. **Use `--reload`** flag when updating dependencies:
   ```bash
   cd supabase/functions/claude-api-v3
   deno cache --reload index.ts
   ```

### Verification
After fix, test edge function:
```bash
curl -s http://127.0.0.1:54121/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"sessionId":"test"}'
```

Should return authentication error (expected) instead of 502.

### When to Use Manual Fix
- Shutdown script wasn't used
- VS Code crashed/force-closed
- Docker containers weren't stopped cleanly
- After system reboot without proper shutdown

### Related Tasks
- **Startup Workspace**: Automatically runs on folder open
- **Shutdown Workspace**: Run before closing VS Code
- **Fix Edge Runtime Lock Issues**: Emergency fix for active issues
- **Restart Edge Runtime**: Simple container restart (doesn't fix locks)

# Supabase Port Update - January 14, 2026

## Issue
Windows reserves port range **54234-54333**, which conflicted with our Supabase local ports (54321, 54322, 54323, 54324).

Error:
```
ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: 
listen tcp 0.0.0.0:54322: bind: An attempt was made to access a socket 
in a way forbidden by its access permissions.
```

## Solution
Moved all Supabase local ports from **54xxx** to **55xxx** range to avoid Windows reserved ports.

## Port Changes

| Service | Old Port | New Port | Notes |
|---------|----------|----------|-------|
| Supabase API | 54321 | **55321** | Local REST API endpoint |
| PostgreSQL | 54322 | **55322** | Local database |
| Supabase Studio | 54323 | **55323** | Web UI for database management |
| Mailpit | 54324 | **55324** | Email testing interface |

## Files Updated

### Configuration Files
1. **supabase/config.toml** - Updated all port configurations
2. **.env.local** - Updated `REACT_APP_SUPABASE_URL` to use port 55321

### Scripts
3. **scripts/health-check.sh** - Updated health check port references
4. **scripts/startup-workspace.sh** - Updated startup script port checks

### Documentation
5. **.github/instructions/core.instructions.md** - Updated port reference table
6. **.github/copilot-instructions.md** - Updated all port references and examples

## New Local URLs

- **API**: http://127.0.0.1:55321
- **Studio**: http://127.0.0.1:55323
- **Database**: postgresql://postgres:postgres@127.0.0.1:55322/postgres
- **Mailpit**: http://127.0.0.1:55324

## Verification

Run health check to verify all services:
```bash
bash scripts/health-check.sh
```

Expected output:
```
✅ Supabase API: Running
✅ Supabase Studio: Running
✅ PostgreSQL (port 55322): Running
✅ Claude API V3: Responding
```

## Impact

- ✅ No code changes required (services use environment variables)
- ✅ All existing data preserved (Docker volumes maintained)
- ✅ Scripts and documentation updated
- ⚠️ Team members need to pull latest changes and restart Supabase

## Team Action Required

1. Pull latest changes from master
2. Stop Supabase: `supabase stop`
3. Start Supabase: `supabase start`
4. Verify with: `bash scripts/health-check.sh`

The new ports are now active and all services are running successfully!

# Startup & Shutdown Best Practices

## Problem: Container Failures After Reboot

### Root Cause
When shutting down the workspace before a system reboot, Docker containers are stopped but **not removed**. After the reboot:
- Containers remain in "exited" state with potentially corrupted configurations
- Network bindings and port mappings may be stale
- Deno lock files in edge runtime can cause conflicts
- `supabase start` may try to restart existing containers instead of creating fresh ones

This leads to startup failures with various container health check issues.

## Solution: Improved Shutdown Process

### Automatic Improvements (Already Implemented)

#### 1. Enhanced Shutdown Script
The `shutdown-workspace.sh` script now:
- ✅ Stops all Supabase containers
- ✅ **Removes containers** (not just stops them)
- ✅ Cleans up orphaned Docker volumes
- ✅ Removes Deno lock files to prevent corruption
- ✅ Creates automatic database backup before shutdown

#### 2. Enhanced Startup Script
The `startup-workspace.sh` script now:
- ✅ Checks for and removes stale containers on startup
- ✅ Detects containers in "exited" state and cleans them up
- ✅ Performs health diagnostics if startup fails
- ✅ Retries with cleanup if initial start fails

### Available VS Code Tasks

#### Shutdown Workspace
```
Ctrl+Shift+P → "Tasks: Run Task" → "Shutdown Workspace"
```
**When to use:** Before closing VS Code or rebooting your system

**What it does:**
1. Stops all npm dev servers and test runners
2. Creates database backup
3. Cleans Deno lock files
4. Stops AND removes all Supabase containers
5. Cleans up orphaned volumes

#### Clean Restart Supabase
```
Ctrl+Shift+P → "Tasks: Run Task" → "Clean Restart Supabase"
```
**When to use:** When containers are in an inconsistent state after reboot

**What it does:**
1. Stops all Supabase containers
2. Removes all Supabase containers
3. Removes Deno lock files
4. Starts fresh Supabase instance from scratch

#### Startup Workspace
```
Ctrl+Shift+P → "Tasks: Run Task" → "Startup Workspace"
```
**When to use:** When opening the workspace (runs automatically on folder open)

**What it does:**
1. Checks prerequisites (Docker, Supabase CLI, Node.js)
2. Removes any stale containers from previous sessions
3. Starts Supabase with retry logic
4. Installs/updates dependencies
5. Verifies services are healthy

## Best Practices

### Before System Reboot
1. **Always run "Shutdown Workspace" task**
   ```bash
   Ctrl+Shift+P → "Tasks: Run Task" → "Shutdown Workspace"
   ```
2. Wait for confirmation message: "Safe to close VS Code workspace now!"
3. Close VS Code

### After System Reboot
1. Open VS Code workspace
2. "Startup Workspace" task runs automatically
3. If containers fail to start, run "Clean Restart Supabase"

### Manual Cleanup (if needed)
```bash
# Remove all Supabase containers for this project
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | xargs -r docker rm -f

# Remove Deno lock files
find supabase/functions -name 'deno.lock' -type f -delete

# Start fresh
supabase start
```

## Troubleshooting

### Symptoms: Containers Won't Start
**Problem:** Containers stuck in "exited" state or health checks failing

**Solution:**
```
Ctrl+Shift+P → "Tasks: Run Task" → "Clean Restart Supabase"
```

### Symptoms: Edge Runtime Issues
**Problem:** Edge functions not responding or Deno errors

**Solution 1:** Restart edge runtime
```
Ctrl+Shift+P → "Tasks: Run Task" → "Restart Edge Runtime"
```

**Solution 2:** Clean restart
```bash
docker stop supabase_edge_runtime_rfpez-app-local
docker rm supabase_edge_runtime_rfpez-app-local
find supabase/functions -name 'deno.lock' -type f -delete
supabase start
```

### Symptoms: Port Conflicts
**Problem:** Port 54321, 54322, or 54323 already in use

**Solution:**
```bash
# Check what's using the port (Windows)
netstat -ano | findstr :54321

# Check what's using the port (Linux/Mac)
lsof -ti:54321

# Kill the process and restart
# Then run "Clean Restart Supabase" task
```

### Symptoms: Database Connection Issues
**Problem:** Can't connect to local database after startup

**Solution:**
```bash
# Check if database container is healthy
docker ps --filter name=supabase_db_rfpez-app-local

# Check database logs
docker logs supabase_db_rfpez-app-local --tail 100

# If unhealthy, clean restart
Ctrl+Shift+P → "Tasks: Run Task" → "Clean Restart Supabase"
```

## Why This Works

### Container Lifecycle Management
- **Stop alone** preserves container state but can cause issues across reboots
- **Stop + Remove** ensures containers are recreated fresh on next start
- Supabase CLI handles recreation automatically when containers don't exist

### Lock File Management
- Deno lock files can become corrupted if containers stop unexpectedly
- Removing them before shutdown prevents edge runtime startup failures
- Lock files regenerate automatically on first use

### Volume Cleanup
- Orphaned volumes from removed containers waste disk space
- Cleaning them prevents accumulation of stale data
- Active volumes are preserved (safety check before removal)

## Key Differences from Before

| Before | After |
|--------|-------|
| Containers stopped only | Containers stopped AND removed |
| No stale container cleanup | Automatic cleanup on startup |
| No volume cleanup | Orphaned volumes removed |
| Manual Deno lock cleanup | Automatic cleanup in shutdown |
| No retry logic | Startup retries with cleanup |

## Quick Reference Commands

```bash
# Recommended: Use VS Code Tasks
Ctrl+Shift+P → "Tasks: Run Task" → "Shutdown Workspace"
Ctrl+Shift+P → "Tasks: Run Task" → "Clean Restart Supabase"

# Manual: Full cleanup and restart
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | xargs -r docker stop
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | xargs -r docker rm
find supabase/functions -name 'deno.lock' -type f -delete
supabase start

# Check container status
docker ps -a --filter name=supabase --format "table {{.Names}}\t{{.Status}}"

# View container logs
docker logs supabase_edge_runtime_rfpez-app-local --tail 100
docker logs supabase_db_rfpez-app-local --tail 100
```

## Database Backups

The shutdown script automatically creates backups before stopping Supabase:
- Location: `database/backups/`
- Format: `local-supabase-backup-YYYYMMDD-HHMMSS.sql`
- Retention: Last 5 backups kept automatically
- Full dump with `--clean --if-exists --create` flags for easy restoration

**To restore a backup:**
```bash
# Find latest backup
ls -lh database/backups/

# Restore (replace TIMESTAMP with actual timestamp)
docker exec -i supabase_db_rfpez-app-local psql -U postgres postgres < database/backups/local-supabase-backup-TIMESTAMP.sql
```

## Monitoring and Diagnostics

### Health Check Task
```
Ctrl+Shift+P → "Tasks: Run Task" → "Health Check"
```

Checks:
- Supabase API status
- Database connectivity
- Edge function availability
- Dev server status
- Port usage

### Container Diagnostics
```bash
# View all Supabase containers with health status
docker ps -a --filter name=supabase --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check specific container health
docker inspect --format '{{.State.Health.Status}}' supabase_edge_runtime_rfpez-app-local

# View recent logs
docker logs --since 5m supabase_edge_runtime_rfpez-app-local
```

## Future Improvements (Potential)

- [ ] Detect system shutdown and auto-run cleanup
- [ ] Pre-reboot checklist automation
- [ ] Container state validation before VS Code close
- [ ] Automatic backup restoration on corruption detection
- [ ] Health check integration in startup workflow
- [ ] Container performance metrics logging

---

**Last Updated:** November 16, 2025
**Related Documentation:** 
- `core.instructions.md` - Quick reference commands
- `scripts/startup-workspace.sh` - Startup implementation
- `scripts/shutdown-workspace.sh` - Shutdown implementation
- `.vscode/tasks.json` - VS Code task definitions

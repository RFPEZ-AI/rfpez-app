# Workspace Shutdown Guide

This guide explains how to gracefully shut down the RFPEZ.AI development environment when closing VS Code.

## Quick Shutdown Options

### Option 1: VS Code Task (Recommended)
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "Tasks: Run Task"
3. Select **"Shutdown Workspace"**
4. Wait for completion message
5. Close VS Code

### Option 2: Manual Script Execution
**Windows:**
```bash
./scripts/shutdown-workspace.bat
```

**Linux/Mac/WSL:**
```bash
./scripts/shutdown-workspace.sh
```

### Option 3: Individual Component Shutdown
If you prefer manual control:

1. **Stop Development Servers:**
   - Use `Ctrl+Shift+P` → "Tasks: Terminate Task"
   - Select running tasks (Development Server, API Server, Test Runners)

2. **Stop Supabase:**
   - Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Stop Supabase"
   - Or run: `supabase stop`

3. **Clean up Edge Functions:**
   ```bash
   pkill -f "supabase functions serve"
   ```

## What Gets Shut Down

The shutdown process handles:

- ✅ **Supabase Local Stack** - All containers and services
- ✅ **Development Servers** - React app (port 3100) and API server (port 3001)  
- ✅ **Edge Functions** - Standalone function servers
- ✅ **Test Runners** - Jest watch mode processes
- ✅ **Docker Containers** - Supabase-related containers
- ✅ **Background Processes** - Any lingering development processes

## Startup After Shutdown

When you reopen the workspace:

1. **Automatic Tasks** will restart:
   - Jest test runner (watch mode)
   - Development server (if configured)

2. **Manual Restart** (if needed):
   - `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Development Server"
   - `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Supabase"

## Troubleshooting

### If Shutdown Fails
```bash
# Force kill all Node processes
taskkill /f /im node.exe        # Windows
pkill -9 node                   # Linux/Mac

# Force stop Docker containers
docker stop $(docker ps -q --filter name=supabase)

# Manual Supabase stop
supabase stop --no-backup
```

### If Ports Stay Occupied
```bash
# Check what's using ports
netstat -ano | findstr :3100    # Windows
lsof -ti:3100                   # Linux/Mac

# Kill specific port users
taskkill /PID <PID> /F          # Windows (replace <PID>)
kill -9 <PID>                   # Linux/Mac (replace <PID>)
```

### If Services Won't Start After Restart
```bash
# Clean restart Supabase
supabase stop
docker system prune -f
supabase start

# Reset VS Code tasks
# Ctrl+Shift+P → "Tasks: Terminate All Tasks"
# Then restart needed tasks
```

## Best Practices

1. **Always use the shutdown script** before closing VS Code to prevent:
   - Port conflicts on next startup
   - Database connection issues
   - Docker container resource leaks

2. **Wait for completion** - The script shows progress and final status

3. **Check the summary** - Verify all services stopped successfully

4. **Use VS Code tasks** instead of manual command line for consistency

## Integration with VS Code

The shutdown process is integrated through:
- **VS Code Tasks** (`Ctrl+Shift+P` → Tasks)
- **Background task management** (terminates watch processes)
- **Workspace-specific configuration** (handles project-specific services)

This ensures a clean development environment restart every time you open the workspace.
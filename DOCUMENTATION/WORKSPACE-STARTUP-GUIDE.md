# Workspace Startup Guide

This guide explains how the RFPEZ.AI development environment automatically starts when you open VS Code.

## 🚀 Automatic Startup Features

### What Happens When You Open the Workspace

1. **✅ Automatic Test Runner** - Jest watch mode starts immediately
2. **🏗️ Supabase Stack** - Starts automatically via startup task
3. **📦 Dependency Check** - Installs missing packages if needed
4. **🔧 Service Verification** - Checks that all services are responding

### Manual Startup Options

If automatic startup is disabled or fails:

#### Option 1: Full Workspace Startup (Recommended)
```bash
# Via VS Code Task
Ctrl+Shift+P → "Tasks: Run Task" → "Startup Workspace"

# Or manually
./scripts/startup-workspace.sh    # Linux/Mac/WSL
./scripts/startup-workspace.bat   # Windows
```

#### Option 2: Quick Supabase Only
```bash
# Via VS Code Task
Ctrl+Shift+P → "Tasks: Run Task" → "Quick Startup (Supabase Only)"

# Or manually
supabase start
```

#### Option 3: Individual Services
```bash
# Start services individually via VS Code tasks:
Ctrl+Shift+P → "Tasks: Run Task" → Select:
• "Start Development Server" (React app - port 3100)
• "Start API" (API server - port 3001)
• "Run Tests (Watch Mode)" (Jest test runner)
```

## 🔧 Configuration

### Automatic Startup Settings

The workspace is configured to automatically start essential services:

**VS Code Tasks (`.vscode/tasks.json`):**
- `"runOptions": { "runOn": "folderOpen" }` - Auto-runs on workspace open
- `"isBackground": true` - Runs in background without blocking

**VS Code Settings (`.vscode/settings.json`):**
- `"task.autoDetect": "on"` - Automatically detects and runs tasks
- `"task.showDecorations": true` - Shows task status in UI

### Startup Sequence

1. **Prerequisites Check** - Verifies Supabase CLI, Node.js, Docker installed
2. **Port Conflict Detection** - Checks if services already running
3. **Supabase Stack Startup** - Starts database, API, auth services
4. **Dependency Management** - Installs/updates npm packages if needed
5. **Service Verification** - Tests that edge functions respond
6. **Status Report** - Shows what's running and next steps

## 📊 Service Status After Startup

Once startup completes, you should have:

- ✅ **Supabase API**: http://127.0.0.1:54321 (edge functions, auth, storage)
- ✅ **Supabase Studio**: http://127.0.0.1:54323 (database admin UI)
- ✅ **PostgreSQL**: localhost:54322 (local database)
- ✅ **Jest Tests**: Running in watch mode (auto-rerun on changes)
- 🔄 **Development Servers**: Ready to start via tasks

### Next Steps After Startup

1. **Start React App**: `Ctrl+Shift+P` → "Start Development Server" → http://localhost:3100
2. **Start API Server**: `Ctrl+Shift+P` → "Start API" → http://localhost:3001  
3. **Open Supabase Studio**: http://localhost:54323
4. **Begin Development**: All services are ready!

## 🛠️ Troubleshooting

### Common Startup Issues

#### Port Conflicts
```bash
# Check what's using ports
netstat -ano | findstr :54321    # Windows
lsof -ti:54321                   # Linux/Mac

# Kill conflicting processes
taskkill /PID <PID> /F           # Windows
kill -9 <PID>                    # Linux/Mac
```

#### Docker Issues
```bash
# Check Docker status
docker ps

# Restart Docker service
# Windows: Restart Docker Desktop
# Linux: sudo systemctl restart docker

# Clean up old containers
docker system prune -f
```

#### Supabase Won't Start
```bash
# Check for conflicts and clean restart
supabase stop
docker ps -a --filter name=supabase | grep rfpez-app-local | awk '{print $1}' | xargs docker rm -f
supabase start
```

#### Missing Dependencies
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# For API server
cd api-server
rm -rf node_modules package-lock.json  
npm install
cd ..
```

### Disable Automatic Startup

If you prefer manual control:

1. **Edit `.vscode/tasks.json`**
2. **Remove or comment out** `"runOptions": { "runOn": "folderOpen" }` from tasks
3. **Restart VS Code**

## 💡 Best Practices

### Development Workflow

1. **Open VS Code** → Services start automatically
2. **Wait for startup completion** → Check terminal output
3. **Start development servers** → Use VS Code tasks
4. **Begin coding** → All services ready

### Performance Tips

- **SSD Recommended** - Faster Docker container startup
- **8GB+ RAM** - Multiple services require memory
- **Close unused VS Code windows** - Reduces resource usage
- **Use VS Code tasks** - Better process management than command line

### Daily Workflow

```bash
# Morning startup
1. Open VS Code workspace
2. Wait for automatic startup (30-60 seconds)
3. Start development server: Ctrl+Shift+P → "Start Development Server"
4. Begin development

# Evening shutdown  
1. Save all work and commit changes
2. Ctrl+Shift+P → "Shutdown Workspace" 
3. Close VS Code
```

## 🎯 Integration with Development

### VS Code Integration

- **Task Status**: Shows in status bar and problems panel
- **Terminal Management**: Each service gets dedicated terminal
- **Problem Matching**: Errors highlighted in editor
- **Background Tasks**: Non-blocking startup process

### Testing Integration

- **Auto-running Tests**: Jest watch mode starts with workspace
- **Coverage Reports**: Available via tasks
- **Test-driven Development**: Tests run automatically on code changes

This startup system ensures you can focus on coding rather than service management! 🚀
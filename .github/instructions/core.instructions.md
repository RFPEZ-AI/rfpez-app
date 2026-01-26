---
applyTo: '**'
description: Core RFPEZ.AI project overview and quick reference commands
---

# RFPEZ.AI Core Instructions

## Project Overview
RFPEZ.AI is a multi-agent RFP management platform with React/TypeScript frontend, Supabase backend, and Claude API integration via MCP (Model Context Protocol). The system features specialized AI agents for different RFP workflows.

## Current goal
The current goal is to get the product demo ready following the instructions in DEMO-INSTRUCTIONS.md

## Quick Reference

### Essential Commands
```bash
# Environment Status Check
echo "Current Supabase Config:" && grep -E "REACT_APP_SUPABASE_URL|REACT_APP_SUPABASE_ANON_KEY" .env.local
# Local: 127.0.0.1:54321 | Remote: jxlutaztoukwbbgtoulc.supabase.co

# Server Management (Use VS Code Tasks ONLY)
# Ctrl+Shift+P → "Tasks: Run Task" → Select:
# - "Start Development Server" (React app - port 3100)
# - "Start API" (API server - port 3001) 
# - "Start Edge Runtime" (Edge functions)

# Local Supabase Stack
supabase start                    # Start all local services
supabase status                   # Check service status
supabase stop                     # Stop all services

# Edge Function Development
supabase functions serve claude-api-v3 --debug    # Local testing with logs
supabase functions deploy claude-api-v3           # Deploy to remote
supabase functions list                           # Check versions

# Database Operations
supabase migration new feature_name         # Create new migration
supabase migration up                      # Apply pending migrations to current DB
supabase db push                           # Deploy schema to remote
supabase migration list                    # Check sync status
# ⚠️ AVOID: supabase db reset (wipes all data - use only for recovery)

# Testing Commands
npm test -- --watchAll=false              # Single test run
# Use VS Code Task: "Run Tests (Watch Mode)" for continuous testing
# Use VS Code Task: "Run Tests with Coverage" for coverage reports
```

### Environment Verification
```bash
# Check Current Environment
echo "🔍 Environment Check:"
echo "Supabase URL: $(grep REACT_APP_SUPABASE_URL .env.local | cut -d'=' -f2)"
echo "Local Supabase Status:" && supabase status --output env 2>/dev/null || echo "❌ Local Supabase not running"
echo "React Dev Server:" && curl -s http://localhost:3100 >/dev/null && echo "✅ Running" || echo "❌ Not running"
echo "API Server:" && curl -s http://localhost:3001/health >/dev/null && echo "✅ Running" || echo "❌ Not running"

# Switch Environments
./scripts/supabase-local.bat     # Switch to LOCAL (Windows)
./scripts/supabase-remote.bat    # Switch to REMOTE (Windows)
./scripts/supabase-local.sh      # Switch to LOCAL (Linux/Mac)
./scripts/supabase-remote.sh     # Switch to REMOTE (Linux/Mac)
```

### Port Usage Reference
- **3100**: React Development Server (VS Code Task)
- **3001**: API Server (VS Code Task)
- **3000**: Supabase MCP Server
- **55321**: Local Supabase API (moved to 55xxx to avoid Windows reserved ports 54234-54333)
- **55322**: Local PostgreSQL Database
- **55323**: Local Supabase Studio
- **55324**: Local Mailpit (email testing)

### Troubleshooting Quick Fixes
```bash
# Port Conflicts
netstat -ano | findstr :3100              # Check what's using port 3100 (Windows)
lsof -ti:3100 | xargs kill -9             # Kill process on port 3100 (Linux/Mac)

# Edge Runtime Issues
docker restart supabase_edge_runtime_rfpez-app-local
# Or use VS Code Task: "Restart Edge Runtime"

# Clean Restart After Reboot (if containers fail to start)
# Use VS Code Task: "Clean Restart Supabase" 
# Or manually:
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | xargs -r docker stop
docker ps -a --filter name=supabase_*_rfpez-app-local --format "{{.Names}}" | xargs -r docker rm
find supabase/functions -name 'deno.lock' -type f -delete
supabase start

# VS Code Task Issues
# Ctrl+Shift+P → "Tasks: Terminate Task" → Select task to stop
# Then restart with "Tasks: Run Task"

# Agent UUID Lookup (for instruction updates)
SELECT id, name FROM agents WHERE name IN ('Solutions', 'RFP Design', 'Support');
```

## Environment Configuration
Required environment variables:
- `REACT_APP_CLAUDE_API_KEY` - Claude API access
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_ENABLE_MCP` - Enable MCP integration

## Key Files for Understanding
- `src/pages/Home.tsx` - Main application orchestration
- `src/services/claudeService.ts` - Claude API integration patterns
- `src/hooks/useMessageHandling.ts` - Message processing workflow
- `database/agents-schema.sql` - Multi-agent database structure
- `DOCUMENTATION/AGENTS.md` - Agent system documentation
- `DOCUMENTATION/DEPLOYMENT-GUIDE.md` - Comprehensive deployment procedures from local to remote
- `DOCUMENTATION/DEPLOYMENT-QUICK-REFERENCE.md` - Quick deployment commands and troubleshooting fixes
- `FINAL-SOLUTION-MANAGEMENT-API.md` - GitHub Actions deployment using Management API (automated CI/CD)
- `scripts/md-to-sql-migration.js` - CLI tool to convert agent markdown to SQL migrations
- `.github/workflows/deploy-migrations.yml` - Automated migration deployment workflow
- `.github/workflows/deploy-edge-functions.yml` - Automated edge function deployment workflow
- `supabase/functions/supabase-mcp-server/index.ts` - MCP protocol implementation
- `supabase/functions/claude-api-v3/index.ts` - HTTP REST API for Claude integration (V3)

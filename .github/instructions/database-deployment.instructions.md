---
applyTo: '{supabase/**,scripts/**,.github/workflows/**,database/**}'
description: Supabase database operations, migrations, deployment workflows, and agent management
---

# RFPEZ.AI Database & Deployment Instructions

## Local-First Development Strategy ⭐
**ALWAYS DEVELOP LOCALLY FIRST** before deploying to remote Supabase. This ensures rapid iteration, safe testing, and proper validation before production changes.

### Local Development Setup
```bash
# 1. Start Local Supabase Stack (if not already running)
supabase start
# This starts: DB (54322), API (54321), Studio (54323)

# 2. Switch to Local Configuration
# Use scripts: ./scripts/supabase-local.bat (Windows) or ./scripts/supabase-local.sh (Linux/Mac)
# Or manually edit .env.local to use local URLs

# 3. Start React Development Server
use VS Code task "Start Development Server" (Ctrl+Shift+P → Tasks: Run Task)
```

### Edge Function Development Workflow
```bash
# LOCAL-FIRST Edge Function Development:

# 1. Ensure Edge Runtime is Running (if not already started)
# Use VS Code Task: "Start Edge Runtime" if functions aren't responding
# Or manually: docker start supabase_edge_runtime_rfpez-app-local

# 2. Develop & Test Functions Locally
supabase functions serve claude-api-v3 --debug  # Serves locally on port 54321
# Test against local function endpoint: http://127.0.0.1:54321/functions/v1/claude-api-v3

# 3. Local Function Testing
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 4. Only Deploy to Remote After Local Testing
supabase functions deploy claude-api-v3  # Deploy to production

# ❌ NEVER: Deploy directly to remote without local testing
# ✅ ALWAYS: Local development → Local testing → Remote deployment
```

### Database Change Workflow
```bash
# LOCAL-FIRST Database Development:

# 1. Create Migration Locally
supabase migration new add_new_feature
# Edit the generated SQL file in supabase/migrations/

# 2. Apply Migration to Current Database (PRESERVES DATA)
supabase migration up  # Apply only pending migrations

# 🚨 CRITICAL DATABASE RULE 🚨
# ❌❌❌ NEVER EVER USE 'supabase db reset' ❌❌❌
# This command WIPES ALL DATA and causes massive disruption!
# - Destroys all test data and development state
# - Requires complete data recreation
# - Breaks active development workflows
# - Should ONLY be used in emergency recovery (with explicit user approval)
#
# ✅ ALWAYS USE: supabase migration up
# This applies migrations incrementally while preserving all existing data

# 3. Test Changes Locally
# - Run React app against local DB
# - Execute test queries in local Studio (localhost:54323)
# - Validate RLS policies and permissions
# - Verify existing data is preserved and migrations work incrementally

# 4. Deploy to Remote Only After Local Validation
# Instead use migration files created locally
#   supabase db push  # Push schema changes to remote
# OR
# Instead use GITHUB actions to deploy migrations automatically on push
# supabase migration repair  # If needed to sync migration state

# 💡 Migration Best Practices:
# - Write idempotent migrations (use IF NOT EXISTS, IF EXISTS)
# - Use DROP ... IF EXISTS before CREATE OR REPLACE for functions with signature changes
# - Test migrations on copy of production data when possible
# - Never modify existing migration files - create new ones
# - Keep migrations small and focused on single changes
# - Always include rollback instructions in migration comments
```

### Local Configuration Management
```bash
# Environment Switching (Use provided scripts)
./scripts/supabase-local.bat    # Switch to LOCAL (Windows)
./scripts/supabase-local.sh     # Switch to LOCAL (Linux/Mac)
./scripts/supabase-remote.bat   # Switch to REMOTE (Windows)
./scripts/supabase-remote.sh    # Switch to REMOTE (Linux/Mac)

# Manual Configuration Check
# LOCAL URLs:
# - API: http://127.0.0.1:54321
# - Studio: http://127.0.0.1:54323
# - Database: localhost:54322

# REMOTE URLs:
# - API: https://jxlutaztoukwbbgtoulc.supabase.co
# - Studio: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
```

### Data Synchronization Patterns
```bash
# Sync Remote Data to Local (for testing with real data)
supabase db pull  # Pull schema from remote
supabase db dump --data-only > data.sql  # Export remote data
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < data.sql  # Import to local

# Sync Local Schema to Remote (after local development)
supabase db push  # Push schema changes
supabase functions deploy  # Deploy function changes
```

### Local Testing Validation Checklist
Before deploying to remote, ensure:
- ✅ Functions work locally with `supabase functions serve`
- ✅ Database migrations apply cleanly with `supabase migration up` (without data loss)
- ✅ React app connects to local services without errors
- ✅ RLS policies work correctly in local Studio
- ✅ Edge Functions handle authentication properly
- ✅ Agent system functions correctly with local database
- ✅ MCP integration works with local endpoints

## Deployment Workflows

### Automated Deployment (PREFERRED)
**🎯 Simply commit and push - GitHub Actions handles deployment automatically:**

```bash
# For database migrations:
git add supabase/migrations/*.sql
git commit -m "Add new migration"
git push origin master
# → .github/workflows/deploy-migrations.yml deploys via Management API

# For edge functions:
git add supabase/functions/**/*
git commit -m "Update edge function"
git push origin master
# → .github/workflows/deploy-edge-functions.yml deploys functions

# For agent instructions:
node scripts/md-to-sql-migration.js "Agent Instructions/AgentName.md"
git add supabase/migrations/*.sql
git commit -m "Update agent instructions"
git push origin master
# → Automatically deployed as a migration
```

**📖 See `.github/workflows/` for workflow configurations and `FINAL-SOLUTION-MANAGEMENT-API.md` for technical details.**

### Manual Deployment (Fallback)
```bash
# STEP 1: Verify Local Development Complete
# Ensure all local testing validation checklist items are complete ✅

# STEP 2: Check Migration Status
supabase migration list
# Identify any local migrations not yet on remote (missing from Remote column)

# STEP 3: Push Database Changes
supabase db push
# Pushes all pending migrations to remote database
# ⚠️ Review and confirm migration changes when prompted

# STEP 4: Deploy Edge Functions
# Deploy primary functions (order matters for dependencies):
supabase functions deploy claude-api-v3    # Primary Claude API endpoint (V3)
supabase functions deploy supabase-mcp-server       # MCP protocol server

# STEP 5: Verify Deployment Success
supabase migration list    # Confirm all migrations now show in Remote column
supabase functions list    # Verify function versions updated with recent timestamps
```

## Agent Instructions and Knowledge Base Management

### Agent Instructions Update Workflow

**1. Edit Agent Markdown File**
```bash
# Edit the agent instruction file
# Location: Agent Instructions/[Agent Name].md
# Example: Agent Instructions/RFP Design Agent.md
```

**2. Generate Migration Using CLI Tool**
```bash
# Use the md-to-sql-migration.js script to generate SQL migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Output: Creates timestamped migration file
# Example: supabase/migrations/20251024032255_update_rfp_design_agent.sql
```

**3. Apply Migration Locally**
```bash
# Apply the migration to local database
supabase migration up

# This applies ONLY pending migrations incrementally
# ⚠️ NEVER use 'supabase db reset' - it wipes all data!
```

**4. Verify Agent Update**
```bash
# Using Docker SQL command line
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT name, 
       LENGTH(instructions) as instruction_length,
       LEFT(instructions, 100) as preview, 
       updated_at 
FROM agents 
WHERE name = 'RFP Design'
ORDER BY updated_at DESC;"
```

**5. Deploy to Remote**
```bash
# Commit and push - GitHub Actions deploys automatically
git add supabase/migrations/*.sql
git commit -m "Update RFP Design Agent instructions"
git push origin master

# Monitor deployment: https://github.com/markesphere/rfpez-app/actions
```

### Knowledge Base Update Workflow

**1. Edit Knowledge Base Markdown File**
```bash
# Create or edit knowledge base file
# Location: scripts/[agent-name]-knowledge-base.md
```

**2. Generate Knowledge Base Migration**
```bash
# Get agent UUID first
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT id, name FROM agents WHERE name = 'RFP Design';"

# Use kb-to-sql-migration.js script to generate migration
node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md" "AGENT_UUID"

# Output: Creates timestamped migration file
```

**3. Apply and Deploy**
```bash
# Apply migrations locally
supabase migration up

# Commit and deploy
git add supabase/migrations/*.sql scripts/*.js
git commit -m "Add RFP Design agent knowledge base entries"
git push origin master
```

## Database Operations

### MCP Tool Usage Guidelines

**For Database Operations (in order of preference):**
1. **Primary**: Docker exec with psql commands - Direct SQL execution via `docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "QUERY"`
2. **Alternative**: Native Supabase CLI commands (`supabase migration up`, `supabase db push`)
3. **Fallback**: `mcp_supabase-offi_execute_sql` - Only when Docker and CLI unavailable
4. **❌ NEVER USE**: `mcp_supabase-loca_*` tools - These tools have been experiencing chronic hanging issues and should be completely avoided

**⚠️ CRITICAL: Supabase Local MCP Tools Are Unreliable**
- `mcp_supabase-loca_*` tools frequently hang and cause timeouts
- Use Docker commands or Supabase CLI instead for all local database operations
- For queries: `docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "SELECT ..."`
- For logs: `docker logs -f supabase_edge_runtime_rfpez-app-local`

### Common SQL Patterns
```sql
-- Check recent artifacts and their schema structure
SELECT id, name, type, created_at, 
  LENGTH(schema::text) as schema_length,
  LEFT(schema::text, 200) as schema_preview
FROM artifacts 
ORDER BY created_at DESC LIMIT 10;

-- Verify session and message relationships
SELECT s.id, s.title, s.created_at, 
  COUNT(m.id) as message_count,
  COUNT(a.id) as artifact_count
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN artifacts a ON s.id = a.session_id
GROUP BY s.id, s.title, s.created_at
ORDER BY s.created_at DESC LIMIT 10;
```

### Database Schema Reference

**agents table:**
- `id` - UUID primary key
- `name` - VARCHAR agent name
- `instructions` - TEXT agent system prompts
- `initial_prompts` - TEXT[] user-facing initial messages
- `access_level` - VARCHAR (public, free, premium)
- `updated_at` - TIMESTAMP last update time

**account_memories table:**
- `account_id` - UUID (nullable for global knowledge)
- `user_id` - UUID (nullable for global knowledge)
- `memory_type` - VARCHAR (knowledge, fact, guideline, procedure, context)
- `content` - TEXT the knowledge content
- `embedding` - extensions.vector(768) vector representation
- `importance_score` - FLOAT8 (0.0-1.0)
- `metadata` - JSONB (knowledge_id, category, importance, tags, etc.)
- `search_vector` - tsvector (GENERATED COLUMN - do not insert)
- `updated_at` - TIMESTAMP last update time

## Debugging and Logging

### Edge Function Logging
```bash
# LOCAL Edge Function Debugging:

# 1. Serve Functions Locally with Logs
supabase functions serve claude-api-v3 --debug  # Shows detailed logs in terminal

# 2. Monitor Function Logs in Real-time
supabase functions logs claude-api-v3 --follow  # Stream logs (remote only)

# 3. View Recent Function Logs  
supabase functions logs claude-api-v3 --limit 50  # Last 50 log entries
```

### Logging Best Practices
- **Edge Functions**: Use `console.log()` for debugging info, `console.error()` for errors
- **Database Issues**: Use direct SQL queries via `mcp_supabase-offi_execute_sql`
- **Log Timing**: Edge function logs appear immediately in local serve, may have delays in remote
- **Error Context**: Always include session_id, user_id, and timestamp context in logs

### Troubleshooting Workflow
1. **Local First**: Always debug with local Supabase stack when possible
2. **Function Logs**: Check edge function logs via `supabase functions serve --debug`
3. **Database State**: Use direct SQL to verify data integrity and relationships
4. **Schema Validation**: Verify JSON Schema structure and transformation in database

## CLI Tool Reference

**md-to-sql-migration.js:**
- Purpose: Convert agent instruction markdown to SQL migration
- Usage: `node scripts/md-to-sql-migration.js "Agent Instructions/[Agent Name].md"`
- Output: `supabase/migrations/[timestamp]_update_[agent_name].sql`

**kb-to-sql-migration.js:**
- Purpose: Convert knowledge base markdown to SQL migration
- Usage: `node scripts/kb-to-sql-migration.js "[markdown-file]" "[agent-uuid]"`
- Output: `supabase/migrations/[timestamp]_load_[agent_name]knowledgebase.sql`

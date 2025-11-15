# GitHub Copilot Instructions for RFPEZ.AI

## 📋 Scoped Instruction Files

This project uses **scoped instruction files** to reduce context size and improve Copilot performance. Instructions are automatically applied based on file type:

### Active Instruction Files

1. **core.instructions.md** (`applyTo: **`)
   - Project overview and quick reference
   - Environment configuration
   - Essential commands
   - Port usage and troubleshooting

2. **architecture.instructions.md** (`applyTo: src/**/*.{ts,tsx}`)
   - Service layer patterns
   - Component structure
   - Multi-agent system
   - Coding conventions

3. **database-deployment.instructions.md** (`applyTo: {supabase/**,scripts/**,.github/workflows/**}`)
   - Local-first development workflow
   - Database migrations
   - Edge function deployment
   - Agent instructions management

4. **testing.instructions.md** (`applyTo: **/*.{test.ts,test.tsx,spec.ts}`)
   - Testing patterns
   - Unit and integration testing
   - Pre-commit testing checklist

5. **chrome-mcp-testing.instructions.md** (`applyTo: {**/test-automation/**,**/tests/**}`)
   - Chrome MCP browser automation
   - E2E testing workflows
   - UI test identifiers

6. **memory-mcp.instructions.md** (`applyTo: **`)
   - Memory MCP integration
   - Process tracking
   - Workflow patterns

---

**ℹ️ Note:** Most detailed instructions are now in scoped files above. This main file contains essential quick reference information that applies globally. For specific topics:
- Working with TypeScript/React code → See `architecture.instructions.md`
- Database migrations or deployment → See `database-deployment.instructions.md`
- Writing tests → See `testing.instructions.md` and `chrome-mcp-testing.instructions.md`
- Process tracking → See `memory-mcp.instructions.md`

---

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
- **54321**: Local Supabase API (changed to 54321 from 54121 to avoid Windows reserved ports)
- **54322**: Local PostgreSQL Database (changed to 54322 from 54122 to avoid Windows reserved ports)
- **54323**: Local Supabase Studio (changed to 54323 from 54123 to avoid Windows reserved ports)
- **54324**: Local Mailpit (email testing)

### Troubleshooting Quick Fixes
```bash
# Port Conflicts
netstat -ano | findstr :3100              # Check what's using port 3100 (Windows)
lsof -ti:3100 | xargs kill -9             # Kill process on port 3100 (Linux/Mac)

# Edge Runtime Issues
docker restart supabase_edge_runtime_rfpez-app-local
# Or use VS Code Task: "Restart Edge Runtime"

# VS Code Task Issues
# Ctrl+Shift+P → "Tasks: Terminate Task" → Select task to stop
# Then restart with "Tasks: Run Task"

# Agent UUID Lookup (for instruction updates)
SELECT id, name FROM agents WHERE name IN ('Solutions', 'RFP Design', 'Support');
```

## Architecture Patterns

### Service Layer Pattern
- **ClaudeService** (`src/services/claudeService.ts`): Claude API integration with function calling and MCP support primarily via `claude-api-v3` Edge Function
- **DatabaseService** (`src/services/database.ts`): Supabase operations with RLS policies
- **AgentService** (`src/services/agentService.ts`): Multi-agent system management
- Services use static methods and error handling with APIRetryHandler

### Component Structure
- **Pages**: `src/pages/` - Route-level components (Home, DebugPage, etc.)
- **Components**: `src/components/` - Reusable UI components with Ionic React
- **Hooks**: `src/hooks/` - Custom hooks for state management (useHomeState, useSessionState, useAgentManagement)
- **Types**: `src/types/` - TypeScript interfaces for database, home, RFP entities
- **Refactoring**: If the component becomes complex, common logic extracted to hooks and services for maintainability.

### Multi-Agent System
- Agents stored in `public.agents` table with instructions, prompts, and access control
- Agent switching via `session_agents` junction table tracking active agent per session
- All messages linked to agent_id for conversation attribution
- Three access tiers: public, free (authenticated), premium (billing required)
- Default agents: Solutions (sales), RFP Design (free), Support, RFP Assistant
- Agent switching via Claude function calls now properly updates UI in real-time

## Critical Workflows

### Local-First Development Strategy ⭐
**ALWAYS DEVELOP LOCALLY FIRST** before deploying to remote Supabase. This ensures rapid iteration, safe testing, and proper validation before production changes.

#### **Local Development Setup**
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

#### **Edge Function Development Workflow**
```bash
# LOCAL-FIRST Edge Function Development:

# 1. Ensure Edge Runtime is Running (if not already started)
# Use VS Code Task: "Start Edge Runtime" if functions aren't responding
# Or manually: docker start supabase_edge_runtime_rfpez-app-local

# 2. Develop & Test Functions Locally
supabase functions serve claude-api-v3  # Serves locally on port 54321
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

#### **Database Change Workflow**
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
supabase db push  # Push schema changes to remote
# OR
supabase migration repair  # If needed to sync migration state

# 💡 Migration Best Practices:
# - Write idempotent migrations (use IF NOT EXISTS, IF EXISTS)
# - Use DROP ... IF EXISTS before CREATE OR REPLACE for functions with signature changes
# - Test migrations on copy of production data when possible
# - Never modify existing migration files - create new ones
# - Keep migrations small and focused on single changes
# - Always include rollback instructions in migration comments
```

#### **Local Configuration Management**
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

#### **Data Synchronization Patterns**
```bash
# Sync Remote Data to Local (for testing with real data)
supabase db pull  # Pull schema from remote
supabase db dump --data-only > data.sql  # Export remote data
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres < data.sql  # Import to local

# Sync Local Schema to Remote (after local development)
supabase db push  # Push schema changes
supabase functions deploy  # Deploy function changes
```

#### **Local Testing Validation Checklist**
Before deploying to remote, ensure:
- ✅ Functions work locally with `supabase functions serve`
- ✅ Database migrations apply cleanly with `supabase migration up` (without data loss)
- ✅ React app connects to local services without errors
- ✅ RLS policies work correctly in local Studio
- ✅ Edge Functions handle authentication properly
- ✅ Agent system functions correctly with local database
- ✅ MCP integration works with local endpoints

#### **Local-to-Remote Deployment Workflow** 🚀

**🎯 PREFERRED: Automated via GitHub Actions**
Simply commit and push your changes - GitHub Actions handles deployment automatically:

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

**🛠️ Manual Deployment (if needed):**
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

# Optional: Deploy other functions as needed:
# supabase functions deploy claude-api-v2  # Legacy V2 endpoint
# supabase functions deploy debug-claude   # Debug utilities

# STEP 5: Update Agent Instructions (if modified)
# Use CLI tool to generate migration:
node scripts/md-to-sql-migration.js "Agent Instructions/AgentName.md"
# Then commit and push (or manually deploy with supabase db push)

# STEP 6: Verify Deployment Success
supabase migration list    # Confirm all migrations now show in Remote column
supabase functions list    # Verify function versions updated with recent timestamps


**🎯 Agent Instructions Deployment Pattern:**

**✅ RECOMMENDED: Automated CLI Tool Approach**
```bash
# When agent instructions are updated in Agent Instructions/*.md files:

# 1. Use CLI tool to generate migration (handles all escaping automatically)
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# 2. Review generated migration in supabase/migrations/
# Example: supabase/migrations/20251014020920_update_rfp_design_agent.sql

# 3. Commit and push - GitHub Actions deploys automatically
git add supabase/migrations/*.sql
git commit -m "Update RFP Design Agent instructions"
git push origin master

# 4. Monitor deployment at: https://github.com/markesphere/rfpez-app/actions

# 5. Verify updates with:
SELECT name, 
       LENGTH(instructions) as instruction_length,
       LEFT(instructions, 100) as preview, 
       updated_at 
FROM agents 
WHERE name = 'RFP Design'
ORDER BY updated_at DESC;
```

**🛠️ Manual SQL Approach (Legacy/Fallback):**
```bash
# When you need to update directly via SQL:

# 1. Get Agent UUIDs (run this query first):
SELECT id, name FROM agents WHERE name IN ('Solutions', 'RFP Design', 'Support');
# Copy the UUID for the agent you're updating

# 2. Update remote database with proper SQL escaping:
UPDATE agents 
SET instructions = $$FULL_AGENT_INSTRUCTIONS_HERE$$,
    updated_at = NOW()
WHERE id = 'paste-uuid-from-step-1-here';

# 3. Test agent functionality after update
# Switch to updated agent in app and verify behavior
```

**💡 CLI Tool Benefits:**
- Automatically handles SQL escaping and special characters
- Generates timestamped migrations following project conventions
- Integrates with GitHub Actions for automated deployment
- Maintains deployment history and rollback capability
- No need to manually escape quotes or handle encoding

**🚨 Critical Deployment Rules:**
- **Always test locally first** - Never deploy untested code to remote
- **Migrations are one-way** - Database changes cannot be easily reverted
- **Function versioning** - Each deployment increments version number
- **Agent instructions** - Must be updated via direct SQL, not migrations
- **Validate after deployment** - Always verify functionality in remote environment
- **Rollback plan** - Keep note of previous function versions for emergency rollback

**🎯 Edge Function Versioning Strategy:**
- **claude-api-v3**: Primary endpoint for all new development and production use
- **claude-api-v2**: Legacy endpoint - kept for compatibility, avoid for new features
- **supabase-mcp-server**: MCP protocol server - deploy after claude-api-v3
- **Version Migration**: Always test V3 functionality before deprecating V2 usage

**📊 Deployment Success Verification:**
```bash
# Database: All migrations synchronized
supabase migration list  # Local and Remote columns should match

# Edge Functions: Version numbers incremented
supabase functions list  # Check updated timestamps and version numbers

# Agent Instructions: Updated timestamps
SELECT name, updated_at FROM agents WHERE name IN ('Solutions', 'RFP Design', 'Support');

# Application: Remote functionality verified
# Test core workflows against remote endpoints
```

**🎯 Recent Deployment Example (October 2025):**
Successfully deployed local changes to remote:
- ✅ **Database Migration**: `20251002030545_populate_agents_local.sql` pushed to remote
- ✅ **Edge Functions**: `claude-api-v3` (version 120) and `supabase-mcp-server` (version 13→14) deployed
- ✅ **Agent Instructions**: Solutions and RFP Design agents updated with latest local instructions
- ✅ **Verification**: All migrations synchronized, function versions incremented, agent timestamps updated

This demonstrates the complete local-to-remote workflow ensuring all development work is properly deployed to production.

**🚀 Complete Deployment Workflow Summary:**
```bash
# Pre-Deployment Checklist
✅ All local tests passing (npm test -- --watchAll=false)
✅ Edge functions working locally (supabase functions serve --debug)
✅ Local database migrations applied (supabase db reset)
✅ Environment switched to local for testing

# Deployment Steps (in order)
1. supabase migration list                    # Check pending migrations
2. supabase db push                          # Deploy database changes
3. supabase functions deploy claude-api-v3   # Deploy primary API
4. supabase functions deploy supabase-mcp-server  # Deploy MCP server
5. Update agent instructions via SQL (if needed)
6. supabase migration list                   # Verify sync
7. Switch to remote environment and test

# Post-Deployment Verification
✅ All migrations synchronized (Local = Remote)
✅ Function versions incremented with recent timestamps
✅ Agent instructions updated if modified
✅ Core functionality tested against remote endpoints
```

### Agent Instructions and Knowledge Base Management

#### **Overview**
Agent instructions and knowledge base entries are managed through markdown files converted to SQL migrations. This ensures version control, automated deployment via GitHub Actions, and consistent application across environments.

#### **Agent Instructions Update Workflow**

**1. Edit Agent Markdown File**
```bash
# Edit the agent instruction file
# Location: Agent Instructions/[Agent Name].md
# Example: Agent Instructions/RFP Design Agent.md

# File structure:
# - Metadata fields at top (ID, Name, Access Level, etc.)
# - Instructions section with system prompts
# - Initial Prompts section with user-facing messages
```

**2. Generate Migration Using CLI Tool**
```bash
# Use the md-to-sql-migration.js script to generate SQL migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Output: Creates timestamped migration file
# Example: supabase/migrations/20251024032255_update_rfp_design_agent.sql

# Benefits:
# - Automatically handles SQL escaping and special characters
# - Generates proper UPDATE statements with agent metadata
# - Creates timestamped migration following project conventions
# - Ready for version control and automated deployment
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

# Expected output shows updated timestamp and instruction length
```

**5. Deploy to Remote**
```bash
# Commit and push - GitHub Actions deploys automatically
git add supabase/migrations/*.sql
git commit -m "Update RFP Design Agent instructions"
git push origin master

# Monitor deployment: https://github.com/markesphere/rfpez-app/actions
```

#### **Knowledge Base Update Workflow**

**1. Edit Knowledge Base Markdown File**
```bash
# Create or edit knowledge base file
# Location: scripts/[agent-name]-knowledge-base.md
# Example: scripts/rfp-design-knowledge-base.md

# Required format for each entry:
## [Entry Title]

### ID: [unique-identifier]
### Type: [knowledge|fact|guideline|procedure|context]
### Importance: [0.0-1.0]
### Category: [workflow|validation|best-practices|troubleshooting|communication]

**Content:**
[Multi-line content with markdown formatting]
[Can include code blocks, lists, etc.]

**Metadata:**
```json
{
  "knowledge_id": "[unique-identifier]",
  "category": "[category-value]",
  "importance": [0.0-1.0],
  "tags": ["tag1", "tag2"]
}
```

**Relations:** (optional)
- relates_to: [other-knowledge-id]
- prerequisite: [other-knowledge-id]

---
```

**2. Generate Knowledge Base Migration**
```bash
# Get agent UUID first
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT id, name FROM agents WHERE name = 'RFP Design';"

# Use kb-to-sql-migration.js script to generate migration
node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md" "8c5f11cb-1395-4d67-821b-89dd58f0c8dc"

# Output: Creates timestamped migration file
# Example: supabase/migrations/20251024032829_load_rfp_design_agentknowledgebase.sql

# Script handles:
# - Parsing markdown format (both ### Content: and **Content:** formats)
# - Proper SQL escaping for content and JSON metadata
# - Embedding vector generation (placeholder - actual embeddings computed by backend)
# - Correct INSERT statements without generated columns (search_vector)
```

**3. Apply Migration Locally**
```bash
# Apply the migration to local database
supabase migration up

# Applies only pending migrations incrementally
```

**4. Verify Knowledge Base Entries**
```bash
# Using Docker SQL command line
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT COUNT(*) as knowledge_entries,
       COUNT(DISTINCT metadata->>'category') as categories,
       MIN(importance_score) as min_importance,
       MAX(importance_score) as max_importance,
       AVG(importance_score) as avg_importance
FROM account_memories 
WHERE memory_type = 'knowledge';"

# Expected output shows entry count, category count, and importance statistics

# View specific entries:
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT LEFT(content, 100) as content_preview,
       metadata->>'category' as category,
       importance_score
FROM account_memories 
WHERE memory_type = 'knowledge'
ORDER BY importance_score DESC
LIMIT 10;"
```

**5. Deploy to Remote**
```bash
# Commit and push - GitHub Actions deploys automatically
git add supabase/migrations/*.sql scripts/kb-to-sql-migration.js
git commit -m "Add RFP Design agent knowledge base entries"
git push origin master

# Monitor deployment: https://github.com/markesphere/rfpez-app/actions
```

#### **Complete Agent + Knowledge Update Example**
```bash
# Full workflow to update both agent instructions and knowledge base:

# 1. Edit markdown files
# Agent Instructions/RFP Design Agent.md - update agent instructions
# scripts/rfp-design-knowledge-base.md - update knowledge entries

# 2. Get agent UUID
AGENT_UUID=$(docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -t -c "SELECT id FROM agents WHERE name = 'RFP Design';")

# 3. Generate both migrations
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
node scripts/kb-to-sql-migration.js "scripts/rfp-design-knowledge-base.md" "$AGENT_UUID"

# 4. Review generated migrations
ls -lh supabase/migrations/ | tail -5

# 5. Apply migrations locally
supabase migration up

# 6. Verify updates
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT 'Agent:' as type, name, updated_at FROM agents WHERE name = 'RFP Design'
UNION ALL
SELECT 'Knowledge:' as type, COUNT(*)::text as name, MAX(updated_at) as updated_at 
FROM account_memories WHERE memory_type = 'knowledge';"

# 7. Commit and deploy
git add supabase/migrations/*.sql scripts/*.js
git commit -m "Update RFP Design agent instructions and knowledge base"
git push origin master
```

#### **Database Schema Reference**

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

#### **Common Issues and Solutions**

**Vector Type Error:**
```
ERROR: type "vector" does not exist
```
**Solution:** Use schema-qualified type `extensions.vector(768)` instead of just `vector(768)`

**Memory Type Casting Error:**
```
ERROR: invalid input syntax for type memory_type
```
**Solution:** Remove `::memory_type` cast. The column is VARCHAR, not enum. Use `'knowledge'` not `'knowledge'::memory_type`

**Generated Column Error:**
```
ERROR: cannot insert into column "search_vector"
```
**Solution:** Remove `search_vector` from INSERT statements. It's a GENERATED column computed automatically.

**Parser Format Error:**
```
Could not parse knowledge entry
```
**Solution:** Ensure markdown uses either `### Content:` or `**Content:**` format (both supported). Script handles `.trim()` for whitespace.

**File Corruption from sed Commands:**
```
Syntax error near ','
```
**Solution:** Don't use sed to modify SQL files. Regenerate the migration instead of repairing corrupted files.

#### **Best Practices**

1. **Always Test Locally First**: Apply migrations with `supabase migration up` locally before pushing
2. **Use Docker SQL for Verification**: Preferred over MCP tools for database inspection
3. **Incremental Migrations**: Use `supabase migration up`, never `supabase db reset` (wipes data)
4. **Schema-Qualified Types**: Always use `extensions.vector` not just `vector`
5. **Generated Columns**: Never include in INSERT statements (search_vector)
6. **Version Control**: Keep both markdown source and generated SQL in git
7. **Automated Deployment**: Rely on GitHub Actions for production deployment
8. **Importance Scores**: Use 0.75-0.95 range for high-importance knowledge, 0.5-0.75 for general knowledge
9. **Categories**: Standardize on: workflow, validation, best-practices, troubleshooting, communication
10. **Relations**: Use metadata relations field to link related knowledge entries

#### **CLI Tool Reference**

**md-to-sql-migration.js:**
- Purpose: Convert agent instruction markdown to SQL migration
- Usage: `node scripts/md-to-sql-migration.js "Agent Instructions/[Agent Name].md"`
- Output: `supabase/migrations/[timestamp]_update_[agent_name].sql`
- Features: SQL escaping, metadata extraction, UPDATE statement generation

**kb-to-sql-migration.js:**
- Purpose: Convert knowledge base markdown to SQL migration
- Usage: `node scripts/kb-to-sql-migration.js "[markdown-file]" "[agent-uuid]"`
- Output: `supabase/migrations/[timestamp]_load_[agent_name]knowledgebase.sql`
- Features: Multi-entry parsing, JSON metadata handling, vector placeholder, category extraction

### Debugging and Logging Patterns

#### **Edge Function Logging & Debugging**
```bash
# LOCAL Edge Function Debugging:

# 1. Serve Functions Locally with Logs
supabase functions serve claude-api-v3 --debug  # Shows detailed logs in terminal

# 2. Monitor Function Logs in Real-time
supabase functions logs claude-api-v3 --follow  # Stream logs (remote only)

# 3. View Recent Function Logs  
supabase functions logs claude-api-v3 --limit 50  # Last 50 log entries

# 4. Function Error Debugging
# - Check console.log/console.error output in serve terminal
# - Verify function deployment with 'supabase functions list'
# - Test with curl against local endpoint first
```

#### **Database Debugging with Direct SQL**
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

-- Debug artifact loading issues
SELECT id, name, type, status, processing_status,
  schema_type, LENGTH(schema::text) as schema_size,
  CASE 
    WHEN schema IS NULL THEN 'NULL_SCHEMA'
    WHEN schema::text = '{}' THEN 'EMPTY_SCHEMA'
    WHEN schema ? 'type' THEN 'HAS_TYPE'
    ELSE 'UNKNOWN_FORMAT'
  END as schema_status
FROM artifacts 
WHERE type = 'form'
ORDER BY created_at DESC LIMIT 5;
```

#### **Chrome MCP Browser Access for Log Inspection**
**Example Code Pattern (for reference only):**
```javascript
// Example: Use official Chrome MCP tools to access Supabase Dashboard logs
// Note: These are examples for documentation purposes only

// 1. Navigate to Supabase Dashboard
// chrome_navigate({ 
//   url: 'https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/logs/edge-functions',
//   width: 1920,
//   height: 1080
// });

// 2. Access Edge Function Logs via Browser
// chrome_click_element({ selector: '[data-function="claude-api-v3"]' });
// chrome_screenshot({ name: 'edge-function-logs', fullPage: true });

// 3. Browser Console Access for Client-side Errors
// Use Chrome DevTools for JavaScript errors, network failures, API call issues
// chrome_network_capture_start({ maxCaptureTime: 30000 });
// ... perform actions ...
// const networkData = chrome_network_capture_stop();

// 4. Real-time Log Monitoring
// Use chrome_screenshot and chrome_get_web_content to capture log entries
// Useful when supabase CLI logs are not accessible or delayed
```

#### **Logging Best Practices**
- **Edge Functions**: Use `console.log()` for debugging info, `console.error()` for errors
- **Database Issues**: Use direct SQL queries via `mcp_supabase-offi_execute_sql` instead of MCP tools
- **Client-side Debugging**: Use Chrome MCP tools to access console logs and network requests
- **Log Timing**: Edge function logs appear immediately in local serve, may have delays in remote
- **Error Context**: Always include session_id, user_id, and timestamp context in logs

#### **Troubleshooting Workflow**
1. **Local First**: Always debug with local Supabase stack when possible
2. **Function Logs**: Check edge function logs via `supabase functions serve --debug`
3. **Database State**: Use direct SQL to verify data integrity and relationships
4. **Browser Inspection**: Use Chrome MCP tools for dashboard access and console monitoring
5. **Network Analysis**: Monitor API calls and responses using `chrome_network_capture_*` tools
6. **Schema Validation**: Verify JSON Schema structure and transformation in database

### Memory MCP Integration
- **Knowledge Graph**: Use memory MCP tools to track session state, terminal processes, and workflow context
- **Terminal Session Tracking**: Maintain awareness of which terminals have active processes
- **Server State Management**: Track dev server status to prevent unnecessary restarts
- **Command Context**: Remember command execution context to avoid conflicts

### Development Commands & Terminal Management

#### **⚡ CRITICAL: Use VS Code Tasks for Server Management**
**ALWAYS use VS Code tasks instead of command line npm commands to avoid port conflicts and ensure proper terminal management.**

#### **Primary VS Code Tasks (Ctrl+Shift+P → Tasks: Run Task)**
- **"Start Development Server"** - Main React app (port 3100) - BACKGROUND TASK
- **"Start API"** - API server (port 3001) - BACKGROUND TASK  
- **"Run Tests (Watch Mode)"** - Auto-running Jest tests - BACKGROUND TASK
- **"Test MCP Connection"** - Validate MCP integration
- **"Setup MCP Environment"** - Configure MCP dependencies

#### **❌ AVOID Command Line npm Commands for Servers**
```bash
# ❌ DON'T USE - Can cause port conflicts
npm start          # Use "Start Development Server" task instead
npm run start:api  # Use "Start API" task instead
```

#### **✅ Acceptable Command Line Usage**
```bash
# Testing patterns (OK for one-time commands)
npm test           # For single test runs (use task for watch mode)
npm run test:coverage  # Coverage reports

# Supabase Edge Functions
supabase functions deploy supabase-mcp-server    # Deploy MCP server
supabase functions deploy claude-api-v3  # Deploy Claude API function (V3)
npm run mcp:test   # Test MCP server connection
```

### Server Management Rules
**ALWAYS use VS Code tasks for starting/stopping development and API servers to avoid port conflicts.**

### Workspace Startup & Shutdown

#### **Automatic Startup (When Opening Workspace):**
- **Supabase Stack**: Starts automatically via "Startup Workspace" task
- **Test Runner**: Jest watch mode auto-starts on folder open
- **Dependency Check**: Installs missing packages automatically
- **Service Verification**: Checks edge functions and database connectivity
- **Manual Trigger**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Startup Workspace"

#### **Workspace Shutdown (When Closing VS Code):**
- **Recommended**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Shutdown Workspace"
- **Alternative**: Run `./scripts/shutdown-workspace.sh` (Linux/Mac) or `./scripts/shutdown-workspace.bat` (Windows)
- **Manual**: Use "Tasks: Terminate Task" for individual services, then "Tasks: Run Task" → "Stop Supabase"
- **Benefits**: Prevents port conflicts, cleans up Docker containers, ensures clean restart


### Database Operations
- Use Supabase MCP tools for SQL operations, not raw queries
- All tables use RLS policies - ensure proper user context
- Agent operations require session_id parameter for context
- Form artifacts stored in `form_artifacts` table with JSON schema
- Two Edge Functions: `supabase-mcp-server` (MCP protocol) and `claude-api-v3` (HTTP REST)

### MCP Integration Architecture
- **MCP Server**: `supabase/functions/supabase-mcp-server/index.ts` - JSON-RPC 2.0 protocol
- **MCP Client**: `src/services/mcpClient.ts` - TypeScript client for React app
- **Protocol**: Model Context Protocol 2024-11-05 for Claude Desktop integration
- **Tools**: get_conversation_history, store_message, create_session, search_messages
- **Testing**: MCPTestComponent for browser-based MCP debugging

#### **MCP Tool Usage Guidelines**

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

**For Logging and Monitoring:**
- **Local Development**: `supabase functions serve --debug` for real-time edge function logs
- **Local Container Logs**: `docker logs -f supabase_edge_runtime_rfpez-app-local` for edge runtime logs
- **Remote Debugging**: Browser MCP tools to access Supabase Dashboard logs
- **Historical Logs**: Direct dashboard access or Docker logs (avoid Supabase local MCP tools)

**For Testing and Validation:**
- **Database State**: Direct SQL queries via `mcp_supabase-offi_execute_sql`
- **API Testing**: Browser MCP tools for end-to-end workflow validation
- **Performance**: Combine direct SQL analysis with browser automation

### Memory MCP Workflow Patterns
- **Process Management**: Create entities for active processes (DevServer, TestRunner, etc.) with status observations
- **Command Context**: Store command execution context and results for continuity
- **Error Prevention**: Use memory to avoid repeating failed commands or interrupting critical processes
- **Temporary Files**: Use memory to track temporary files for cleanup before commits
- **Temporary Logging**: Use memory to track temporary logging/debug cleanup before commits

**Memory Entity Types:**
- `Process`: Active processes like dev server, test runners
- `Workflow`: Development workflows and their states
- `Guidelines`: Rules and best practices for process management

**Key Memory Operations:**
```typescript
// Track server startup
mcp_memory_create_entities([{
  name: "DevServer_Port3100", 
  entityType: "Process",
  observations: ["Started at [timestamp]", "Status: Running"]
}]);

// Before running commands, check process status
mcp_memory_search_nodes({ query: "DevServer port 3100 status" });

// Update process observations
mcp_memory_add_observations({
  observations: [{
    entityName: "DevServer_Port3100",
    contents: ["Status check: Still running", "Last checked: [timestamp]"]
  }]
});
```

### Testing Patterns
- Custom render wrapper in `src/test-utils.tsx` with SupabaseProvider
- Mock Supabase client for unit tests
- Async components wrapped in `act()` for proper testing
- Console filtering for expected warnings in `setupTests.ts`

## Project-Specific Conventions

### Error Handling
```typescript
// Use categorizeError for consistent error handling
import { categorizeError } from '../components/APIErrorHandler';

try {
  // operation
} catch (error) {
  const categorized = categorizeError(error);
  // Handle based on category
}
```

### Pre Commit Cleanup
- Remove temporary test files from `/temp` & / folder
- Fix all linting errors before commit
- Ensure all unit tests are passing app and edge functions
- Update documentation if significant design changes are made

### File Organization
- Place temporary test files in `/temp` folder to avoid clutter
- Agent instructions in `Agent Instructions/` directory
- Database schemas in `database/` directory with migration files
- MCP integration files in `supabase/functions/`

### Component Patterns
```typescript
// Standard component structure with copyright header
// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonCard, IonContent } from '@ionic/react';

interface ComponentProps {
  // Props with JSDoc comments
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // Component logic
  return (
    // JSX with Ionic components
  );
};

export default Component;
```

### Message Flow Architecture
1. User input → `SessionDialog` component
2. `useMessageHandling` hook processes via `ClaudeService`
3. Claude API calls with function definitions for database operations
4. Function results create artifacts via `DatabaseService`
5. UI updates with artifact references and agent attribution

### Development Workflow with Memory Integration
**Before Starting Services:**
1. Check memory for existing process states: `mcp_memory_search_nodes`
2. Verify if servers are already running via VS Code tasks

**When Starting Dev Server:**
1. Check if server already running: `mcp_memory_search_nodes({ query: "DevServer status running" })`
2. Use VS Code task "Start Development Server" to start if needed

**Error Recovery:**
1. Use memory to track failed commands and their context
2. Store error patterns to avoid repeating mistakes
3. Maintain process recovery procedures in memory entities

### Agent System Integration
- Agent switching updates both database and UI state
- Session context always included in Claude API calls
- Agent instructions combined with user messages for context
- Current agent displayed in `AgentIndicator` component

### Deployment Workflow

#### **🚀 Automated Deployment via GitHub Actions (PREFERRED)**
**All deployments now happen automatically when pushing to master:**

1. **Database Migrations**: Automatically deployed via `.github/workflows/deploy-migrations.yml`
   - Uses Supabase Management API (`supabase link` + `supabase db push`)
   - Triggered on push to `supabase/migrations/**/*.sql` files
   - No database credentials needed - uses `SUPABASE_ACCESS_TOKEN` secret
   - Avoids IPv6 issues, password encoding, and connection string complexity

2. **Edge Functions**: Automatically deployed via `.github/workflows/deploy-edge-functions.yml`
   - Deploys `claude-api-v3` and `supabase-mcp-server`
   - Triggered on push to `supabase/functions/**/*` files
   - Uses project password authentication

3. **Agent Instructions**: Use CLI tool to generate migrations
   ```bash
   # Convert agent markdown to SQL migration
   node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
   
   # Review generated migration in supabase/migrations/
   # Commit and push - GitHub Actions will deploy automatically
   git add supabase/migrations/*.sql
   git commit -m "Update agent instructions"
   git push origin master
   ```

**✅ GitHub Actions Workflow Status:**
- Monitor deployments: https://github.com/markesphere/rfpez-app/actions
- Migrations deploy via Management API (no direct DB connection)
- Edge functions deploy via CLI with password auth
- All secrets managed in GitHub repository settings

#### **🛠️ Manual Deployment (Fallback/Local Testing)**
**Use when testing locally or GitHub Actions unavailable:**

1. **Pre-deployment Quality Checks**: Run linting (`npm run lint`), unit tests (`npm test -- --watchAll=false`), and edge function tests
2. **Clean Up**: Remove temporary files, debug artifacts, and development-only content
3. **Database Deployment**: Push migrations (`supabase db push`), update agent instructions if modified
4. **Edge Function Deployment**: Deploy functions (`supabase functions deploy claude-api-v3`, `supabase functions deploy supabase-mcp-server`)
5. **Code Repository**: Commit all changes and push to origin (`git push origin master`)
6. **Verification**: Test remote environment, verify all services operational
7. **Documentation**: Update deployment history and verify success criteria

**📖 See `DOCUMENTATION/DEPLOYMENT-GUIDE.md` for complete step-by-step instructions and troubleshooting.**

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

## Environment Configuration
Required environment variables:
- `REACT_APP_CLAUDE_API_KEY` - Claude API access
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_ENABLE_MCP` - Enable MCP integration

## Test Automation Integration
- Separate repository: `rfpez-test-automation` for comprehensive testing
- LED bulb procurement test suite validates end-to-end RFP workflows
- MCP integration testing with browser automation
- Health check utilities for API server validation
- Cross-project test execution via VS Code tasks

## Chrome MCP Browser Automation (Official mcp-chrome API)
The project uses the official **mcp-chrome** browser automation server for comprehensive end-to-end testing and validation.

**📚 Official Documentation:** https://github.com/hangwin/mcp-chrome/blob/main/docs/TOOLS.md

### Prerequisites for Chrome MCP Testing
```bash
# Ensure the main application is running via VS Code Tasks
# Use: Ctrl+Shift+P → "Tasks: Run Task" → "Start Development Server"
# This starts the React app on http://localhost:3100 via VS Code task
# ⚠️ NEVER use "npm start" directly - always use the VS Code task to avoid port conflicts

# For authentication tests, use test account:
# Email: mskiba@esphere.com
# Password: thisisatest

# Ensure mcp-chrome is configured in .vscode/mcp.json
# Chrome browser must be installed with Playwright support
```

### 🎯 Chrome MCP Tool Categories

#### **📊 Browser Management**
- `get_windows_and_tabs` - List all open windows and tabs
- `chrome_navigate` - Navigate to URL with viewport control
- `chrome_close_tabs` - Close specific tabs or windows
- `chrome_switch_tab` - Switch to specific tab by ID
- `chrome_go_back_or_forward` - Navigate browser history

#### **� Screenshots & Visual**
- `chrome_screenshot` - Advanced screenshots (full page, element-specific, base64)

#### **🌐 Network Monitoring**
- `chrome_network_capture_start` - Capture network requests (webRequest API)
- `chrome_network_capture_stop` - Stop capture and return collected data
- `chrome_network_debugger_start` - Capture with response bodies (Debugger API)
- `chrome_network_debugger_stop` - Stop debugger capture
- `chrome_network_request` - Send custom HTTP requests

#### **🔍 Content Analysis**
- `search_tabs_content` - AI-powered semantic search across tabs
- `chrome_get_web_content` - Extract HTML or text content
- `chrome_get_interactive_elements` - Find clickable/interactive elements

#### **🎯 Interaction**
- `chrome_click_element` - Click elements using CSS selectors
- `chrome_fill_or_select` - Fill form fields or select options
- `chrome_keyboard` - Simulate keyboard input and shortcuts

#### **📚 Data Management**
- `chrome_history` - Search browser history with filters
- `chrome_bookmark_search` - Search bookmarks by keywords
- `chrome_bookmark_add` - Add new bookmarks with folder support
- `chrome_bookmark_delete` - Delete bookmarks by ID or URL

### ⚡ Chrome MCP Best Practices & Patterns

#### **🔑 Primary Selection Strategy: Use CSS Selectors**
```javascript
// ✅ ALWAYS PREFER: CSS selector targeting (reliable, stable)
chrome_click_element({ 
  selector: '[data-testid="new-session-button"]' 
});

chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP' 
});

// Use data-testid attributes for test reliability
// All critical UI elements in RFPEZ.AI have data-testid attributes
```

#### **🎨 Advanced Screenshot Capabilities**
```javascript
// Full page screenshot with base64 data
chrome_screenshot({
  fullPage: true,
  storeBase64: true,
  width: 1920,
  height: 1080,
  name: 'full-page-capture'
});

// Element-specific screenshot
chrome_screenshot({
  selector: '.main-content',
  fullPage: false,
  storeBase64: true
});
```

#### **🌐 Network Request Monitoring**
```javascript
// Start capturing network requests
chrome_network_capture_start({
  url: 'http://localhost:3100',
  maxCaptureTime: 30000,      // 30 seconds max
  inactivityTimeout: 3000,    // Stop after 3s inactivity
  includeStatic: false         // Exclude CSS/images/fonts
});

// Perform actions that trigger API calls...

// Stop and retrieve captured requests
chrome_network_capture_stop();
// Returns: { capturedRequests: [...], summary: { totalRequests, captureTime } }
```

#### **🔍 AI Semantic Search Across Tabs**
```javascript
// Search for specific content across all browser tabs
search_tabs_content({
  query: 'RFP requirements validation'
});

// Returns matched tabs with semantic scores and snippets
// Useful for multi-tab testing scenarios
```

#### **⌨️ Keyboard Shortcuts & Input**
```javascript
// Simulate keyboard combinations
chrome_keyboard({
  keys: 'Ctrl+A',           // Select all
  selector: '#text-input',
  delay: 100
});

chrome_keyboard({
  keys: 'Enter',            // Submit form
  selector: '[data-testid="message-input"]'
});
```

#### **🪟 Window & Tab Management**
```javascript
// Get all windows and tabs
const windows = get_windows_and_tabs();
// Returns: { windowCount, tabCount, windows: [...] }

// Switch to specific tab
chrome_switch_tab({
  tabId: 456,
  windowId: 123  // Optional
});

// Close specific tabs
chrome_close_tabs({
  tabIds: [123, 456],
  windowIds: [789]  // Close entire windows
});
```

### 🎯 RFPEZ.AI Testing Workflows

#### **Standard Login & Authentication Flow**
```javascript
// Navigate to app
chrome_navigate({ 
  url: 'http://localhost:3100',
  width: 1920,
  height: 1080
});

// Click login button using data-testid
chrome_click_element({ 
  selector: '[data-testid="login-button"]' 
});

// Fill credentials
chrome_fill_or_select({ 
  selector: 'input[type="email"]', 
  value: 'mskiba@esphere.com' 
});

chrome_fill_or_select({ 
  selector: 'input[type="password"]', 
  value: 'thisisatest' 
});

// Submit login
chrome_keyboard({ 
  keys: 'Enter', 
  selector: 'input[type="password"]' 
});

// Verify login success
chrome_screenshot({ 
  name: 'logged-in-state',
  fullPage: true 
});
```

#### **Message Sending & RFP Creation Flow**
```javascript
// Create new session
chrome_click_element({ 
  selector: '[data-testid="new-session-button"]' 
});

// Fill message using data-testid
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP for LED lighting procurement' 
});

// ⚡ CRITICAL: Submit message with keyboard
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Wait for response and take screenshot
chrome_screenshot({ 
  name: 'rfp-created',
  fullPage: true,
  storeBase64: false
});
```

#### **Network Monitoring for API Debugging**
```javascript
// Start network capture before action
chrome_network_capture_start({
  maxCaptureTime: 60000,
  includeStatic: false
});

// Perform action that triggers API calls
chrome_click_element({ 
  selector: '[data-testid="submit-message-button"]' 
});

// Stop capture and analyze requests
const networkData = chrome_network_capture_stop();
// Inspect networkData.capturedRequests for API call details
```

#### **Multi-Tab Content Search**
```javascript
// Open multiple tabs with different RFPs
chrome_navigate({ 
  url: 'http://localhost:3100/rfp/1',
  newWindow: false 
});

chrome_navigate({ 
  url: 'http://localhost:3100/rfp/2',
  newWindow: false 
});

// Search across all tabs
const results = search_tabs_content({
  query: 'technical specifications'
});

// Results include semantic matching and snippets from all tabs
```

### 📋 RFPEZ.AI UI Test Identifiers (data-testid)

### 📋 RFPEZ.AI UI Test Identifiers (data-testid)

All critical UI elements are decorated with `data-testid` attributes for reliable Chrome MCP testing:

**Navigation & Menu Access:**
- `data-testid="new-session-button"` - New session creation (✅ CRITICAL - always use selector)
- `data-testid="main-menu-button"` - Main developer/admin menu trigger (developer role+)
- `data-testid="rfp-menu-button"` - RFP management menu trigger (administrators only)
- `data-testid="agents-menu-button"` - Agent management menu trigger (administrators only)

**Core Messaging & Actions:**
- `data-testid="message-input"` - Main message input textarea (✅ CRITICAL)
- `data-testid="submit-message-button"` - Message submit button
- `data-testid="agent-selector"` - Agent indicator/selector (click to switch agents)
- `data-testid="select-agent-button"` - Explicit agent selection button

**RFP & Context Management:**
- `data-testid="new-rfp-button"` - New RFP creation button in RFP menu
- `data-testid="rfp-context-footer"` - Footer container showing current RFP context
- `data-testid="current-rfp-display"` - Specific text showing "Current RFP: [name]"
- `data-testid="set-current-rfp-{id}"` - Buttons to set specific RFP as current

**Artifact & Form Interaction:**
- `data-testid="artifact-window-toggle"` - Button to show/hide artifact panel
- `data-testid="artifact-window"` - Main artifact panel container
- `data-testid="artifact-item-{name}"` - Individual artifact items (name slugified)
- `data-testid="form-submit-button"` - Form submission button in artifacts
- `data-testid="artifact-toggle"` - Artifact panel expand/collapse button

### 🚨 Chrome MCP Critical Testing Rules

1. **✅ ALWAYS USE CSS SELECTORS** - Use `data-testid` attributes for all interactions
   - More reliable than index-based selection
   - Survives UI refactoring and layout changes
   - Self-documenting test code

2. **⚡ SUBMIT MESSAGES WITH KEYBOARD** - After filling message input, MUST press Enter:
   ```javascript
   chrome_fill_or_select({ 
     selector: '[data-testid="message-input"]', 
     value: 'message text' 
   });
   chrome_keyboard({ keys: 'Enter', selector: '[data-testid="message-input"]' });
   ```

3. **📸 TAKE SCREENSHOTS FOR VERIFICATION** - Use screenshots to verify state changes:
   ```javascript
   chrome_screenshot({ name: 'descriptive-state-name', fullPage: true });
   ```

4. **🌐 MONITOR NETWORK FOR API DEBUGGING** - Capture API calls when debugging:
   ```javascript
   chrome_network_capture_start({ maxCaptureTime: 30000 });
   // ... perform actions ...
   const requests = chrome_network_capture_stop();
   ```

5. **🔍 USE SEMANTIC SEARCH FOR MULTI-TAB TESTING** - Search content across tabs:
   ```javascript
   const results = search_tabs_content({ query: 'specific content' });
   ```

### 📚 Chrome MCP vs Legacy Browser MCP

**⚠️ MIGRATION NOTE:** The current test suite may use legacy tool names. When refactoring tests:

| ❌ Legacy (Old) | ✅ Chrome MCP (New) | Notes |
|----------------|---------------------|-------|
| `mcp_browser_navigate()` | `chrome_navigate()` | Use new tool |
| `mcp_browser_click({ index })` | `chrome_click_element({ selector })` | Prefer CSS selectors |
| `mcp_browser_form_input_fill({ index })` | `chrome_fill_or_select({ selector })` | More reliable |
| `mcp_browser_screenshot()` | `chrome_screenshot()` | Enhanced options |
| `mcp_browser_press_key()` | `chrome_keyboard()` | More keyboard features |
| `mcp_browser_get_clickable_elements()` | `chrome_get_interactive_elements()` | Better detection |
| N/A | `search_tabs_content()` | NEW: AI semantic search |
| N/A | `chrome_network_capture_*()` | NEW: Network monitoring |

### 🎯 Complete Test Example: RFP Creation E2E

```javascript
// 1. Navigate to app with proper viewport
chrome_navigate({ 
  url: 'http://localhost:3100',
  width: 1920,
  height: 1080
});

// 2. Take initial screenshot
chrome_screenshot({ 
  name: '01-homepage',
  fullPage: true 
});

// 3. Start network monitoring
chrome_network_capture_start({
  maxCaptureTime: 60000,
  includeStatic: false
});

// 4. Login using data-testid selectors
chrome_click_element({ selector: '[data-testid="login-button"]' });
chrome_fill_or_select({ selector: 'input[type="email"]', value: 'mskiba@esphere.com' });
chrome_fill_or_select({ selector: 'input[type="password"]', value: 'thisisatest' });
chrome_keyboard({ keys: 'Enter', selector: 'input[type="password"]' });

// 5. Verify login success
chrome_screenshot({ name: '02-logged-in' });

// 6. Create new session
chrome_click_element({ selector: '[data-testid="new-session-button"]' });
chrome_screenshot({ name: '03-new-session' });

// 7. Send RFP creation message
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP for LED lighting procurement with technical specs' 
});
chrome_keyboard({ keys: 'Enter', selector: '[data-testid="message-input"]' });

// 8. Wait and capture response
chrome_screenshot({ name: '04-rfp-response', fullPage: true });

// 9. Stop network capture and analyze
const networkData = chrome_network_capture_stop();
// Check networkData for API calls to /api/sessions, /api/messages, etc.

// 10. Verify RFP context in footer
const footerText = chrome_get_web_content({ 
  selector: '[data-testid="current-rfp-display"]',
  format: 'text'
});
// Should contain "Current RFP: LED Lighting Procurement"

// 11. Final state screenshot
chrome_screenshot({ name: '05-final-state', fullPage: true, storeBase64: true });
```

### 📖 Test File Examples (Update Needed)

### 📖 Test File Examples (Update Needed)

**⚠️ MIGRATION NOTICE:** Current test files use legacy MCP browser tools. They should be refactored to use official Chrome MCP API:

- `nail-procurement/real-browser-mcp-test.js` - ⚠️ Uses legacy `mcp_browser_*` tools
- `nail-procurement/active-mcp-test.js` - ⚠️ Needs migration to `chrome_*` tools
- `nail-procurement/mcp-browser-demo.js` - ⚠️ Update to showcase Chrome MCP capabilities

**Migration Checklist for Test Files:**
1. Replace `mcp_browser_navigate` → `chrome_navigate`
2. Replace index-based selection with CSS selectors (`data-testid`)
3. Use `chrome_keyboard` instead of `mcp_browser_press_key`
4. Add network monitoring with `chrome_network_capture_*`
5. Use `chrome_screenshot` with enhanced options
6. Remove activation tool calls (not needed with Chrome MCP)

## Testing Notes
- Console warnings for Ionic/Stencil components are expected
- Use `test-utils.tsx` render wrapper for component tests
- Chrome MCP tests integrated into debug page for real-time validation
- VS Code tasks available for automated test execution
- **⚡ CRITICAL**: Always submit messages with `chrome_keyboard({ keys: 'Enter' })` after filling input
- **✅ BEST PRACTICE**: Use `data-testid` selectors for all element interactions
- Test identifiers follow kebab-case naming: `data-testid="element-name-action"`

## Memory MCP Best Practices

### Proactive Memory Usage
1. **Check process states**: Use `mcp_memory_search_nodes` to understand current server states
2. **Track server lifecycle**: Create/update memory entities when starting/stopping servers via tasks
3. **Document command context**: Store why certain commands were run and their outcomes
4. **Maintain process awareness**: Keep track of background processes to prevent conflicts

### Memory Entity Naming Conventions
- **Processes**: `DevServer_Port3100`, `TestRunner_Jest`, `EdgeFunction_Deploy`
- **Workflows**: `Workflow_[Name]` (e.g., `Workflow_Testing`, `Workflow_Deployment`)
- **Guidelines**: `Rules_[Category]` (e.g., `Rules_ProcessManagement`)

### IO Port Usage & VS Code Task Management
- **Dev server: Port 3100** - Managed by VS Code task "Start Development Server"
- **API server: Port 3001** - Managed by VS Code task "Start API"
- **Supabase MCP: Port 3000** - MCP protocol server
- **Supabase Local: Port 54321** - Local Supabase stack

**⚡ Task Management Rules:**
- Use VS Code tasks (Ctrl+Shift+P → Tasks: Run Task) for all server operations
- Never use `npm start` or `npm run start:api` directly in command line
- Restart servers using "Tasks: Terminate Task" then "Tasks: Run Task"

### Error Prevention Through Memory
- Before starting servers: Check if already running via memory search and task status
- After command failures: Document the failure context for future reference
- During troubleshooting: Use memory to avoid repeating failed approaches
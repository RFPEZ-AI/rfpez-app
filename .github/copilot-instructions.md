# GitHub Copilot Instructions for RFPEZ.AI

## Project Overview
RFPEZ.AI is a multi-agent RFP management platform with React/TypeScript frontend, Supabase backend, and Claude API integration via MCP (Model Context Protocol). The system features specialized AI agents for different RFP workflows.

## Current goal
The current goal is to get the product demo ready following the instructions in DEMO-INSTRUCTIONS.md

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
- Default agents: Solutions (sales), RFP Design (free), Technical Support, RFP Assistant
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
use task "Start Dev Server" in VS Code tasks (Ctrl+Shift+B)
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

# 2. Apply Migration Locally
supabase db reset  # Apply all migrations to local DB
# OR
supabase migration up  # Apply latest migration

# 3. Test Changes Locally
# - Run React app against local DB
# - Execute test queries in local Studio (localhost:54323)
# - Validate RLS policies and permissions

# 4. Deploy to Remote Only After Local Validation
supabase db push  # Push schema changes to remote
# OR
supabase migration repair  # If needed to sync migration state
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
- ✅ Database migrations apply cleanly with `supabase db reset`
- ✅ React app connects to local services without errors
- ✅ RLS policies work correctly in local Studio
- ✅ Edge Functions handle authentication properly
- ✅ Agent system functions correctly with local database
- ✅ MCP integration works with local endpoints

#### **Local-to-Remote Deployment Workflow** 🚀
**Complete deployment process to push all local changes to remote Supabase:**

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
# Use direct SQL to update agent instructions in remote database:
# UPDATE agents SET instructions = 'new_instructions' WHERE name = 'Agent Name';

# STEP 6: Verify Deployment Success
supabase migration list    # Confirm all migrations now show in Remote column
supabase functions list    # Verify function versions updated with recent timestamps

# STEP 7: Test Remote Environment
# Switch to remote configuration and verify functionality:
./scripts/supabase-remote.bat  # (Windows) or ./scripts/supabase-remote.sh (Linux/Mac)
# Use VS Code Task: "Start Development Server" to test against remote Supabase
# ✅ Verify core functionality works with remote endpoints
```

**🎯 Agent Instructions Deployment Pattern:**
```bash
# When agent instructions are updated in Agent Instructions/*.md files:

# 1. Read local agent instruction files
# 2. Update remote database directly via SQL:
UPDATE agents 
SET instructions = 'FULL_AGENT_INSTRUCTIONS_HERE'
WHERE id = 'agent-uuid-here';

# 3. Verify updates with:
SELECT name, LEFT(instructions, 100) as preview, updated_at 
FROM agents 
WHERE name IN ('Solutions', 'RFP Design', 'Agent Name');
```

**🚨 Critical Deployment Rules:**
- **Always test locally first** - Never deploy untested code to remote
- **Migrations are one-way** - Database changes cannot be easily reverted
- **Function versioning** - Each deployment increments version number
- **Agent instructions** - Must be updated via direct SQL, not migrations
- **Validate after deployment** - Always verify functionality in remote environment
- **Rollback plan** - Keep note of previous function versions for emergency rollback

**📊 Deployment Success Verification:**
```bash
# Database: All migrations synchronized
supabase migration list  # Local and Remote columns should match

# Edge Functions: Version numbers incremented
supabase functions list  # Check updated timestamps and version numbers

# Agent Instructions: Updated timestamps
SELECT name, updated_at FROM agents WHERE name IN ('Solutions', 'RFP Design');

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

#### **MCP Browser Access for Log Inspection**
```javascript
// Use MCP browser tools to access Supabase Dashboard logs
// when immediate log access is needed during debugging

// 1. Navigate to Supabase Dashboard
await mcp_browser_navigate({ 
  url: 'https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/logs/edge-functions' 
});

// 2. Access Edge Function Logs via Browser
await mcp_browser_click({ element: 'claude-api-v3 function', ref: '[function-link]' });
await mcp_browser_screenshot(); // Capture current log state

// 3. Browser Console Access for Client-side Errors
const consoleLogs = await mcp_browser_get_console_logs();
// Check for JavaScript errors, network failures, API call issues

// 4. Real-time Log Monitoring
// Use browser automation to refresh logs page and capture new entries
// Useful when supabase CLI logs are not accessible or delayed
```

#### **Logging Best Practices**
- **Edge Functions**: Use `console.log()` for debugging info, `console.error()` for errors
- **Database Issues**: Use direct SQL queries via `mcp_supabase-offi_execute_sql` instead of MCP tools
- **Client-side Debugging**: Use browser MCP tools to access console logs and network requests
- **Log Timing**: Edge function logs appear immediately in local serve, may have delays in remote
- **Error Context**: Always include session_id, user_id, and timestamp context in logs

#### **Troubleshooting Workflow**
1. **Local First**: Always debug with local Supabase stack when possible
2. **Function Logs**: Check edge function logs via `supabase functions serve --debug`
3. **Database State**: Use direct SQL to verify data integrity and relationships
4. **Browser Inspection**: Use MCP browser tools for dashboard access and console monitoring
5. **Network Analysis**: Monitor API calls and responses through browser dev tools via MCP
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
- **Preferred**: Use `mcp_supabase-offi_execute_sql` for direct SQL queries and database operations
- **Avoid**: supabase-local MCP tools - they have limitations and timing constraints (1-minute log window)
- **Database Operations**: Always use direct SQL execution instead of supabase-local MCP wrappers
- **Log Access**: Use browser MCP tools to access Supabase Dashboard when CLI logs are insufficient
- **Real-time Debugging**: Combine direct SQL queries with browser automation for comprehensive debugging

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
**Complete local-to-remote deployment process:**
1. **Pre-deployment Quality Checks**: Run linting (`npm run lint`), unit tests (`npm test -- --watchAll=false`), and edge function tests.  Note use --watchAll=false to avoid hanging process
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

## Browser MCP Connector Usage
The project includes comprehensive browser automation through MCP (Model Context Protocol) tools for end-to-end testing and validation.

### Prerequisites for Browser MCP Testing
```bash
# Ensure the main application is running via VS Code Tasks
# Use: Ctrl+Shift+P → "Tasks: Run Task" → "Start Development Server"
# This starts the React app on http://localhost:3100 via VS Code task
# ⚠️ NEVER use "npm start" directly - always use the VS Code task to avoid port conflicts
# For authentication tests, use test account:
# Email: mskiba@esphere.com
# Password: thisisatest
```

### ⚡ MCP Browser Testing Speed Tips & Best Practices

#### **Quick Test Setup Workflow**
```javascript
// ESSENTIAL: Always activate tools first in this order
await activate_mcp_browser_navigation_tools();    // Navigate, tabs
await activate_mcp_browser_interaction_tools();   // Click, fill, keys
await activate_mcp_browser_script_tools();        // Get elements, evaluate
await activate_mcp_browser_visual_tools();        // Screenshot, scroll

// SPEED TIP: Navigate and screenshot in one go
await mcp_browser_navigate({ url: 'http://localhost:3100' });
await mcp_browser_screenshot({ name: 'initial-state' });
```

#### **Authentication Testing Pattern**
```javascript
// FAST LOGIN SEQUENCE - Use this exact pattern
const loginSequence = async () => {
  // 1. Get elements (always fresh)
  const elements = await mcp_browser_get_clickable_elements();
  
  // 2. Click Login button (usually index 2)
  await mcp_browser_click({ index: 2 });
  
  // 3. Fill credentials (email: index 3, password: index 5)
  await mcp_browser_form_input_fill({ index: 3, value: 'mskiba@esphere.com' });
  await mcp_browser_form_input_fill({ index: 5, value: 'thisisatest' });
  
  // 4. Submit (Sign In button: index 6)
  await mcp_browser_click({ index: 6 });
  
  // 5. Verify success (look for username in top right)
  await mcp_browser_screenshot({ name: 'logged-in' });
};
```

#### **Browser Session Reset Prevention**
```javascript
// CRITICAL: Browser can reset unexpectedly
// Always check login state before running tests
const verifyAuthentication = async () => {
  const elements = await mcp_browser_get_clickable_elements();
  const hasLoginButton = elements.some(el => el.text?.includes('Login'));
  
  if (hasLoginButton) {
    console.log('⚠️ Session reset detected - need to login again');
    await loginSequence();
  }
  return !hasLoginButton;
};
```

#### **Message Testing Optimization**
```javascript
// FAST MESSAGE SENDING - Always use this pattern
const sendTestMessage = async (message) => {
  // 1. Get current elements
  const elements = await mcp_browser_get_clickable_elements();
  
  // 2. Find textarea (usually last input element)
  const textareaIndex = elements.findIndex(el => el.tag === 'textarea');
  
  // 3. Click and fill
  await mcp_browser_click({ index: textareaIndex });
  await mcp_browser_form_input_fill({ index: textareaIndex, value: message });
  
  // 4. Submit with Enter key (faster than finding button)
  await mcp_browser_press_key({ key: 'Enter' });
  
  // 5. Take screenshot for verification
  await mcp_browser_screenshot({ name: 'message-sent' });
};
```

#### **Element Finding Speed Tips**
```javascript
// DON'T: Call get_clickable_elements multiple times
// ❌ Slow approach
const elements1 = await mcp_browser_get_clickable_elements();
await mcp_browser_click({ index: 2 });
const elements2 = await mcp_browser_get_clickable_elements(); // Unnecessary

// ✅ Fast approach - reuse elements until interaction changes page
const elements = await mcp_browser_get_clickable_elements();
await mcp_browser_click({ index: 2 });
await mcp_browser_form_input_fill({ index: 3, value: 'test' });
// Only refresh elements after major page changes
```

#### **Common Index Patterns (for speed)**
```javascript
// These indices are typically consistent:
const COMMON_INDICES = {
  LOGIN_BUTTON: 2,           // Main login button
  EMAIL_FIELD: 3,            // Email input in login modal
  PASSWORD_FIELD: 5,         // Password input in login modal  
  SIGNIN_BUTTON: 6,          // Sign in submit button
  MAIN_TEXTAREA: 11,         // Main chat textarea (when logged in)
  AGENT_SELECTOR: 1,         // Agent chip in header
  ARTIFACT_TOGGLE: 13        // Artifact panel toggle
};

// Use with caution - verify with screenshot if failing
await mcp_browser_click({ index: COMMON_INDICES.LOGIN_BUTTON });
```

#### **Error Recovery Patterns**
```javascript
// Handle common browser issues
const robustClick = async (index, retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mcp_browser_click({ index });
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Refresh elements and try again
      await mcp_browser_get_clickable_elements();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};
```

#### **Testing Session Checklist**
```javascript
// Before starting any test session:
// 1. ✅ Dev server running (VS Code task)
// 2. ✅ Activate all MCP browser tools
// 3. ✅ Navigate to localhost:3100
// 4. ✅ Take initial screenshot  
// 5. ✅ Check authentication state
// 6. ✅ Login if needed
// 7. ✅ Verify successful login (username visible)
// 8. ✅ Ready for testing!
```

### Available MCP Browser Tools
- **Navigation**: `mcp_browser_navigate`, `mcp_browser_go_back`, `mcp_browser_go_forward`
- **Interaction**: `mcp_browser_click`, `mcp_browser_hover`, `mcp_browser_form_input_fill`, `mcp_browser_press_key`
- **Content**: `mcp_browser_get_text`, `mcp_browser_get_markdown`, `mcp_browser_read_links`
- **Visual**: `mcp_browser_screenshot`, `mcp_browser_scroll`
- **Elements**: `mcp_browser_get_clickable_elements`
- **Downloads**: `mcp_browser_get_download_list`

### Test File Examples
- `nail-procurement/real-browser-mcp-test.js` - Live browser automation with real MCP calls
- `nail-procurement/active-mcp-test.js` - Full test suite with mock and real modes
- `nail-procurement/mcp-browser-demo.js` - Demonstration of MCP capabilities

### Activating Real Browser Tools
```javascript
// Activate MCP browser tool categories
await activate_mcp_browser_navigation_tools();
await activate_mcp_browser_interaction_tools();
await activate_mcp_browser_content_tools();
await activate_mcp_browser_visual_tools();

// Example usage
await mcp_browser_navigate({ url: 'http://localhost:3100' });
await mcp_browser_screenshot({ name: 'homepage' });
const elements = await mcp_browser_get_clickable_elements();
await mcp_browser_click({ index: elements[0].index });
```

### UI Test Automation Identifiers
Key UI elements are decorated with `data-testid` attributes for reliable MCP browser testing:

**Core Navigation & Actions:**
- `data-testid="new-rfp-button"` - New RFP creation button in RFP menu
- `data-testid="message-input"` - Main message input textarea
- `data-testid="submit-message-button"` - Message submit button (or use ENTER key)
- `data-testid="agent-selector"` - Agent indicator/selector (click to switch agents)
- `data-testid="select-agent-button"` - Explicit agent selection button (when no agent selected)

**RFP & Context Management:**
- `data-testid="rfp-context-footer"` - Footer container showing current RFP context
- `data-testid="current-rfp-display"` - Specific text showing "Current RFP: [name]"
- `data-testid="set-current-rfp-{id}"` - Buttons to set specific RFP as current
- `data-testid="artifact-window-toggle"` - Button to show/hide artifact panel

**Artifact & Form Interaction:**
- `data-testid="artifact-window"` - Main artifact panel container
- `data-testid="artifact-item-{name}"` - Individual artifact items (name slugified)
- `data-testid="form-submit-button"` - Form submission button in artifacts
- `data-testid="artifact-toggle"` - Artifact panel expand/collapse button

**Usage in MCP Browser Tests:**
```javascript
// Navigate and interact with key elements
await mcp_browser_click({ selector: '[data-testid="new-rfp-button"]' });
await mcp_browser_form_input_fill({ selector: '[data-testid="message-input"]', value: 'test message' });
await mcp_browser_press_key({ key: 'Enter' }); // Submit message
await mcp_browser_click({ selector: '[data-testid="agent-selector"]' }); // Switch agent
await mcp_browser_click({ selector: '[data-testid="artifact-item-led-lighting-requirements-assessment"]' });
await mcp_browser_click({ selector: '[data-testid="form-submit-button"]' });

// Verify state changes
const footer = await mcp_browser_get_text({ selector: '[data-testid="current-rfp-display"]' });
// Should show "Current RFP: [name]" immediately after creation
```

## Testing Notes
- Console warnings for Ionic/Stencil components are expected
- Use `test-utils.tsx` render wrapper for component tests
- MCP tests in separate automation project for integration testing integrated into the debug page
- VS Code tasks available for automated test execution and MCP validation
- When sending message prompts using the mcp browser tools, add the enter key to submit the message
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
# GitHub Copilot Instructions for RFPEZ.AI

## Project Overview
RFPEZ.AI is a multi-agent RFP management platform with React/TypeScript frontend, Supabase backend, and Claude API integration via MCP (Model Context Protocol). The system features specialized AI agents for different RFP workflows.

## Architecture Patterns

### Service Layer Pattern
- **ClaudeService** (`src/services/claudeService.ts`): Claude API integration with function calling and MCP support
- **DatabaseService** (`src/services/database.ts`): Supabase operations with RLS policies
- **AgentService** (`src/services/agentService.ts`): Multi-agent system management
- Services use static methods and error handling with APIRetryHandler

### Component Structure
- **Pages**: `src/pages/` - Route-level components (Home, DebugPage, etc.)
- **Components**: `src/components/` - Reusable UI components with Ionic React
- **Hooks**: `src/hooks/` - Custom hooks for state management (useHomeState, useSessionState, useAgentManagement)
- **Types**: `src/types/` - TypeScript interfaces for database, home, RFP entities

### Multi-Agent System
- Agents stored in `public.agents` table with instructions, prompts, and access control
- Agent switching via `session_agents` junction table tracking active agent per session
- All messages linked to agent_id for conversation attribution
- Three access tiers: public, free (authenticated), premium (billing required)
- Default agents: Solutions (sales), RFP Design (free), Technical Support, RFP Assistant
- Agent switching via Claude function calls now properly updates UI in real-time

## Critical Workflows

### Development Commands
```bash
# Start development with API server
npm run start:dev  # Runs both frontend and API server concurrently

# Testing patterns
npm test           # Jest tests with watch mode
npm run test:coverage  # Coverage reports

# Supabase Edge Functions
supabase functions deploy mcp-server    # Deploy MCP server
supabase functions deploy claude-api    # Deploy Claude API function
npm run mcp:test   # Test MCP server connection

# Available VS Code tasks
# - "Run Tests (Watch Mode)" - Auto-running Jest tests
# - "Test MCP Connection" - Validate MCP integration
# - "Setup MCP Environment" - Configure MCP dependencies
```

### Database Operations
- Use Supabase MCP tools for SQL operations, not raw queries
- All tables use RLS policies - ensure proper user context
- Agent operations require session_id parameter for context
- Form artifacts stored in `form_artifacts` table with JSON schema
- Two Edge Functions: `mcp-server` (MCP protocol) and `claude-api` (HTTP REST)

### MCP Integration Architecture
- **MCP Server**: `supabase/functions/mcp-server/index.ts` - JSON-RPC 2.0 protocol
- **MCP Client**: `src/services/mcpClient.ts` - TypeScript client for React app
- **Protocol**: Model Context Protocol 2024-11-05 for Claude Desktop integration
- **Tools**: get_conversation_history, store_message, create_session, search_messages
- **Testing**: MCPTestComponent for browser-based MCP debugging

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

### Agent System Integration
- Agent switching updates both database and UI state
- Session context always included in Claude API calls
- Agent instructions combined with user messages for context
- Current agent displayed in `AgentIndicator` component

## Key Files for Understanding
- `src/pages/Home.tsx` - Main application orchestration
- `src/services/claudeService.ts` - Claude API integration patterns
- `src/hooks/useMessageHandling.ts` - Message processing workflow
- `database/agents-schema.sql` - Multi-agent database structure
- `DOCUMENTATION/AGENTS.md` - Agent system documentation
- `supabase/functions/mcp-server/index.ts` - MCP protocol implementation
- `supabase/functions/claude-api/index.ts` - HTTP REST API for Claude integration

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
# Ensure the main application is running
npm run start:dev  # Starts app on http://localhost:3000

# For authentication tests, use test account:
# Email: mskiba@esphere.com
# Password: thisisatest
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
await mcp_browser_navigate({ url: 'http://localhost:3000' });
await mcp_browser_screenshot({ name: 'homepage' });
const elements = await mcp_browser_get_clickable_elements();
await mcp_browser_click({ index: elements[0].index });
```

## Testing Notes
- Tests expect Supabase mocks in test environment
- Console warnings for Ionic/Stencil components are expected
- Use `test-utils.tsx` render wrapper for component tests
- MCP tests in separate automation project for integration testing
- VS Code tasks available for automated test execution and MCP validation
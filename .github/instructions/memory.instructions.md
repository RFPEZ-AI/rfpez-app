---
applyTo: '**'
description: Workspace-specific AI memory for this project
lastOptimized: '2025-09-27T23:53:44.224669+00:00'
entryCount: 2
optimizationVersion: 1
autoOptimize: true
sizeThreshold: 50000
entryThreshold: 20
timeThreshold: 7
---

# Workspace AI Memory
This file contains workspace-specific information for AI conversations.

## Professional Context
- **2025-09-27 16:53:** RFPEZ.AI Architecture: Service Layer Pattern — ClaudeService, DatabaseService, AgentService use static methods with APIRetryHandler for consistent error handling

## Memories/Facts
- **2025-09-27 16:53:** RFPEZ.AI Architecture: Service Layer Pattern — ClaudeService, DatabaseService, AgentService use static methods with APIRetryHandler for consistent error handling

*(No other entries were provided. All information preserved, organized, and formatted as requested.)*- **2025-09-27 16:53:** Terminal Management Rule: Always use memory MCP tools to track terminal sessions. Dev server terminal is PROTECTED - never run additional commands after npm start. Use separate terminals for other commands.
- **2025-09-27 16:53:** Component Structure Pattern: Pages in src/pages/, reusable UI in src/components/ with Ionic React, custom hooks in src/hooks/ (useHomeState, useSessionState, useAgentManagement), TypeScript interfaces in src/types/
- **2025-09-27 16:54:** Testing Pattern: Use test-utils.tsx render wrapper with SupabaseProvider, mock Supabase client for unit tests, wrap async components in act(), expect console warnings for Ionic/Stencil components
- **2025-09-27 16:54:** MCP Integration: Use Supabase MCP tools for SQL operations, not raw queries. MCP Server uses JSON-RPC 2.0 protocol. Edge Functions: supabase-mcp-server (protocol) and claude-api (HTTP REST). Test with MCPTestComponent for browser debugging.
- **2025-09-27 17:09:** MCP Server Package Fix: Use `supabase-mcp@latest` instead of `@modelcontextprotocol/server-supabase` (which doesn't exist). Official packages are @modelcontextprotocol/server-filesystem, @modelcontextprotocol/server-everything, @modelcontextprotocol/server-memory.
- **2025-10-25:** Chrome MCP Browser Testing - Official API Migration: Use chrome_* tools (chrome_navigate, chrome_click_element, chrome_fill_or_select, chrome_keyboard) instead of legacy mcp_browser_* tools. Always use CSS selectors with data-testid attributes for reliability. Critical: Submit messages with chrome_keyboard({ keys: 'Enter' }) after filling input.
- **2025-10-25:** Chrome MCP Advanced Features: Network monitoring (chrome_network_capture_start/stop), AI semantic search (search_tabs_content), window/tab management (get_windows_and_tabs, chrome_switch_tab), browser history (chrome_history), bookmarks (chrome_bookmark_*), interactive elements (chrome_get_interactive_elements).
- **2025-10-25:** Chrome MCP Testing Best Practice: ALWAYS use data-testid selectors for element targeting (e.g., [data-testid="new-session-button"]) instead of index-based selection. More reliable, survives UI changes, self-documenting. All RFPEZ.AI critical elements have data-testid attributes.

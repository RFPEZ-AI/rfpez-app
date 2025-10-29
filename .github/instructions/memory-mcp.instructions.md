---
applyTo: '**'
description: Memory MCP integration for tracking development workflows and process states
---

# Memory MCP Best Practices

## Proactive Memory Usage

1. **Check process states**: Use `mcp_memory_search_nodes` to understand current server states
2. **Track server lifecycle**: Create/update memory entities when starting/stopping servers via tasks
3. **Document command context**: Store why certain commands were run and their outcomes
4. **Maintain process awareness**: Keep track of background processes to prevent conflicts

## Memory Entity Naming Conventions

- **Processes**: `DevServer_Port3100`, `TestRunner_Jest`, `EdgeFunction_Deploy`
- **Workflows**: `Workflow_[Name]` (e.g., `Workflow_Testing`, `Workflow_Deployment`)
- **Guidelines**: `Rules_[Category]` (e.g., `Rules_ProcessManagement`)

## IO Port Usage & VS Code Task Management

- **Dev server: Port 3100** - Managed by VS Code task "Start Development Server"
- **API server: Port 3001** - Managed by VS Code task "Start API"
- **Supabase MCP: Port 3000** - MCP protocol server
- **Supabase Local: Port 54321** - Local Supabase stack

### Task Management Rules

- Use VS Code tasks (Ctrl+Shift+P → Tasks: Run Task) for all server operations
- Never use `npm start` or `npm run start:api` directly in command line
- Restart servers using "Tasks: Terminate Task" then "Tasks: Run Task"

## Error Prevention Through Memory

- Before starting servers: Check if already running via memory search and task status
- After command failures: Document the failure context for future reference
- During troubleshooting: Use memory to avoid repeating failed approaches

## Memory Entity Types

- `Process`: Active processes like dev server, test runners
- `Workflow`: Development workflows and their states
- `Guidelines`: Rules and best practices for process management

## Key Memory Operations

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

## Workflow Patterns

### Process Management
- Create entities for active processes (DevServer, TestRunner, etc.) with status observations
- Use memory to track temporary files for cleanup before commits
- Use memory to track temporary logging/debug cleanup before commits

### Command Context
- Store command execution context and results for continuity
- Remember which terminals have active processes
- Track server status to prevent unnecessary restarts

### Error Prevention
- Use memory to avoid repeating failed commands
- Prevent interrupting critical processes
- Document error patterns for future reference

# MCP Integration with Claude Sessions

## Overview

The RFPEZ.AI application now integrates the Supabase MCP (Model Context Protocol) server directly with Claude sessions. This provides enhanced conversation management and persistent context across sessions.

## Architecture

### Before Integration
```
Claude Session → HTTP Functions → Supabase Database
```

### After Integration
```
Claude Session → MCP Client → Supabase Edge Function MCP Server → Supabase Database
```

## What's Changed

### 1. Enhanced Function Handler (`claudeAPIFunctions.ts`)
- Added MCP client integration for conversation functions
- Maintains HTTP fallback for reliability
- Functions now routed through MCP server:
  - `get_conversation_history`
  - `get_recent_sessions`
  - `store_message`
  - `create_session`
  - `search_messages`

### 2. Updated Claude Service (`claudeService.ts`)
- System prompt now includes MCP integration information
- Claude is aware of the enhanced conversation capabilities
- Better context awareness across sessions

### 3. MCP Client Integration (`mcpClient.ts`)
- Existing MCP client now used by Claude sessions
- Connects to Supabase Edge Function MCP server
- Provides real-time conversation management

## Benefits

### For Users
- More reliable conversation persistence
- Enhanced search across conversation history
- Better session management
- Improved context retention

### For Developers
- Standardized MCP protocol for conversation management
- Better separation of concerns
- Enhanced debugging with MCP logs
- Future extensibility with MCP ecosystem

## How It Works

1. **Claude Function Call**: When Claude needs conversation data, it calls a function like `get_conversation_history`

2. **MCP Integration**: The function handler first attempts to use the MCP client:
   ```typescript
   const historyResult = await mcpClient.getConversationHistory(
     parameters.session_id, 
     parameters.limit || 50, 
     parameters.offset || 0
   );
   ```

3. **Fallback**: If MCP fails, it falls back to direct HTTP implementation:
   ```typescript
   } catch (error) {
     console.warn(`❌ MCP client failed for ${functionName}, falling back to HTTP:`, error);
     // Fall through to original HTTP implementation
   }
   ```

4. **MCP Server**: The MCP client connects to the Supabase Edge Function at:
   ```
   ${supabaseUrl}/functions/v1/mcp-server
   ```

## Testing

Run the MCP integration test:
```bash
node test-mcp-integration.js
```

This test verifies:
- MCP client initialization
- Available MCP tools
- Function handler integration
- Direct MCP client methods

## Configuration

The MCP server URL is automatically configured from your Supabase environment:
- `REACT_APP_SUPABASE_URL` - Used to construct MCP server endpoint
- Supabase authentication tokens are passed to MCP server

## Debugging

MCP integration includes extensive logging:
- `🔗 Attempting MCP client for function: ${functionName}`
- `✅ MCP client success for ${functionName}`
- `❌ MCP client failed for ${functionName}, falling back to HTTP`

Enable debug mode in MCP client for detailed protocol logging:
```typescript
export const mcpClient = new MCPClient(undefined, true); // Debug enabled
```

## Future Enhancements

With MCP integration in place, future enhancements are possible:
- Real-time conversation sync across browser tabs
- Enhanced conversation analytics
- Integration with other MCP-compatible tools
- Cross-session agent memory
- Advanced conversation search and indexing

## Rollback Plan

If issues arise, the integration includes automatic fallback to HTTP functions. To completely disable MCP:

1. Comment out MCP attempts in `executeFunction`
2. All functions will use original HTTP implementation
3. No data loss or functionality impact

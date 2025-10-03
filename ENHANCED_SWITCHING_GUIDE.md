# Enhanced Supabase Environment Switching with MCP Configuration

## Overview
The local and remote Supabase switching scripts have been enhanced to automatically manage MCP (Model Context Protocol) server configurations in addition to environment variables and database connections.

## What's New
Each switching script now:
1. **Updates .env.local** with appropriate Supabase URLs and keys
2. **Manages MCP Configuration** by commenting/uncommenting the correct Supabase MCP server
3. **Provides clear status output** showing which configurations are active
4. **Handles local Supabase stack** startup/shutdown as appropriate

## Files Enhanced
- `scripts/supabase-local.bat` (Windows)
- `scripts/supabase-local.sh` (Linux/Mac)
- `scripts/supabase-remote.bat` (Windows)
- `scripts/supabase-remote.sh` (Linux/Mac)

## MCP Configuration Management
The scripts automatically toggle between two MCP server configurations in `.vscode/mcp.json`:

### Local Development Mode
```jsonc
{
  "servers": {
/*     "supabase-remote": { ... }, */
    "supabase-local": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "supabase-mcp@latest"],
      "env": {
        "SUPABASE_URL": "http://127.0.0.1:54321",
        "SUPABASE_ANON_KEY": "[local-key]",
        "SUPABASE_SERVICE_ROLE_KEY": "[local-service-key]",
        "MCP_API_KEY": "[local-service-key]"
      }
    }
  }
}
```

### Remote Production Mode
```jsonc
{
  "servers": {
    "supabase-remote": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "supabase-mcp@latest"],
      "env": {
        "SUPABASE_URL": "https://jxlutaztoukwbbgtoulc.supabase.co",
        "SUPABASE_ANON_KEY": "[remote-key]",
        "MCP_API_KEY": "[remote-api-key]"
      }
    },
/*     "supabase-local": { ... }, */
  }
}
```

## Usage Examples

### Switch to Local Development
```bash
# Windows
./scripts/supabase-local.bat

# Linux/Mac
./scripts/supabase-local.sh
```

**Output:**
```
🔄 Switching to Supabase LOCAL development...
🔧 Updating MCP configuration for LOCAL...
✅ MCP configuration updated for LOCAL
✅ Switched to LOCAL Supabase
🚀 Starting local Supabase stack...
🔗 Local Supabase URLs:
  - API: http://127.0.0.1:54321
  - Studio: http://127.0.0.1:54323
  - Database: http://127.0.0.1:54322
🔧 MCP Configuration: supabase-local ACTIVE, supabase-remote INACTIVE
💡 Restart your React app to connect to local Supabase
```

### Switch to Remote Production
```bash
# Windows
./scripts/supabase-remote.bat

# Linux/Mac
./scripts/supabase-remote.sh
```

**Output:**
```
🔄 Switching to Supabase REMOTE production...
🔧 Updating MCP configuration for REMOTE...
✅ MCP configuration updated for REMOTE
✅ Switched to REMOTE Supabase
🔗 Remote Supabase URLs:
  - API: https://jxlutaztoukwbbgtoulc.supabase.co
  - Studio: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
🔧 MCP Configuration: supabase-remote ACTIVE, supabase-local INACTIVE
💡 Restart your React app to connect to remote Supabase
❓ Stop local Supabase stack? (y/N):
```

## Technical Implementation
The scripts use Node.js one-liners to perform precise regex-based find-and-replace operations on the `mcp.json` file:

- **Comment/Uncomment**: Toggle between `"supabase-*"` and `/*     "supabase-*"`
- **JSON Syntax**: Maintain proper comma placement and comment formatting
- **Error Prevention**: Handle edge cases and syntax validation

## Benefits
1. **Seamless Development**: One command switches entire environment
2. **MCP Consistency**: Database operations through MCP always use correct endpoint
3. **Error Prevention**: No manual editing of configuration files required
4. **Clear Status**: Always know which environment and MCP server is active
5. **Cross-Platform**: Works on Windows, Linux, and Mac

## Workflow Integration
This enhancement supports the **Local-First Development Strategy**:
1. **Develop locally** with automatic local MCP configuration
2. **Test thoroughly** with local database and MCP endpoints  
3. **Deploy to remote** when ready, with automatic remote MCP configuration
4. **Switch back to local** for continued development

## Troubleshooting
If MCP configuration issues occur:
1. Check `.vscode/mcp.json` syntax is valid JSON
2. Verify only one Supabase MCP server is uncommented
3. Run the switching script again if needed
4. Manual cleanup: ensure no double commas (`,,`) in JSON

## Next Steps
After running a switching script:
1. **Restart React development server** to pick up new environment variables
2. **Restart VS Code** if MCP connection issues occur
3. **Verify connections** through the application or MCP debugging tools
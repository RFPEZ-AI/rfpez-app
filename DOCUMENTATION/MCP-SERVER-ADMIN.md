# Supabase MCP Server - Administrative Tool Documentation

**Edge Function:** `supabase-mcp-server`  
**Current Version:** v12  
**Status:** Deployed but not actively used by production agents  
**Purpose:** Reserved for future administrative agent functionality

---

## Overview

The Supabase MCP (Model Context Protocol) server provides low-level database access capabilities through a JSON-RPC 2.0 interface. While deployed and functional, it is intentionally **not used by current production agents** for security reasons.

### Why MCP Server Exists But Isn't Used

**Current Agent Architecture:**
- Production agents (Solutions, RFP Design, Support) use specialized tools from `claude-api-v3`
- These specialized tools have built-in validation, role-based access control, and business logic
- Example: `create_and_set_rfp` validates inputs and maintains referential integrity

**MCP Server Architecture:**
- Provides generic database operations: `supabase_select`, `supabase_update`, `supabase_insert`, `supabase_delete`
- Direct SQL execution without business logic layer
- Suitable for administrative tasks requiring database-level access

---

## Security Model

### Current Agent Tool Access (claude-api-v3)
✅ **Validated Operations:** All tools enforce business rules  
✅ **Role-Based Restrictions:** Tools filtered by agent role (sales/design/support)  
✅ **Type Safety:** Parameters validated against schemas  
✅ **Audit Trail:** Operations logged through conversation history

### MCP Server Tool Access (supabase-mcp-server)
⚠️ **Generic Database Access:** Direct table operations without validation  
⚠️ **SQL Execution:** Can run arbitrary queries within RLS policy constraints  
⚠️ **Requires Careful Use:** No built-in business logic enforcement

**Authentication:** MCP server requires valid JWT authentication (returns 401 without proper credentials)

---

## Available MCP Server Tools

### Conversation Management
- `get_conversation_history` - Retrieve session messages
- `store_message` - Save messages to database
- `create_session` - Create new conversation sessions
- `search_messages` - Search across message history

### Direct Database Operations
- `supabase_select` - Query database tables with filters
- `supabase_update` - Update records in database tables
- `supabase_insert` - Insert new records into tables
- `supabase_delete` - Remove records from tables

### Schema Inspection
- `list_tables` - Get available database tables
- `get_table_schema` - Inspect table structure and columns

---

## Future Use Cases

### Potential Administrator Agent Capabilities

**Database Maintenance:**
- Bulk data cleanup operations
- Schema migration verification
- Data integrity checks across multiple tables

**Advanced Reporting:**
- Cross-table analytics requiring complex joins
- Historical data analysis
- Performance metrics gathering

**System Administration:**
- User account management
- Permission auditing
- Configuration updates

**Development & Testing:**
- Test data generation
- Database state inspection during debugging
- Migration validation

---

## Why Specialized Tools Are Better for Production

### Example: RFP Creation

**Using MCP Server (Not Recommended for Production):**
```javascript
// Requires multiple manual steps with potential for errors
1. supabase_insert into rfps table
2. Manually construct session_rfp_context record
3. Update session state separately
4. Handle error cases manually
5. Validate relationships exist
```

**Using Specialized Tool (Current Production Approach):**
```javascript
// Single atomic operation with built-in validation
create_and_set_rfp({
  name: "LED Lighting RFP",
  description: "Office lighting upgrade"
})
// ✅ Creates RFP, sets as current, validates inputs, logs operation
```

---

## Deployment Information

**GitHub Actions Workflow:** `.github/workflows/deploy-edge-functions.yml`  
**Deployment Trigger:** Automatic on push to master branch  
**Testing:** Use Supabase Dashboard for manual testing  
**Logs:** `supabase functions logs supabase-mcp-server`

---

## Related Documentation

- **Available Production Tools:** `DOCUMENTATION/AVAILABLE-TOOLS.md`
- **Edge Function Validation:** `DOCUMENTATION/EDGE-FUNCTION-VALIDATION-REPORT.md`
- **Agent Instructions:** `Agent Instructions/` directory
- **Tool Definitions Source:** `supabase/functions/claude-api-v3/tools/definitions.ts`

---

## Decision Log

**October 13, 2025 - Security Hardening Decision:**
- **Issue:** Agent instructions referenced `supabase_update` and `supabase_select` that don't exist in claude-api-v3
- **Finding:** These tools exist in MCP server but aren't called by agents
- **Decision:** Keep MCP server deployed for future admin use, but document that production agents use specialized tools from claude-api-v3
- **Rationale:** Specialized tools provide better validation, security, and maintainability for production workflows
- **Future Path:** MCP server reserved for administrative agent when database-level access is genuinely required

---

## Usage Guidelines

### When to Use MCP Server (Future)
✅ Administrative tasks requiring direct database access  
✅ Bulk operations across multiple tables  
✅ Development and debugging scenarios  
✅ Operations not covered by specialized tools

### When to Use Specialized Tools (Always for Production)
✅ RFP creation and management  
✅ Form and artifact creation  
✅ User-facing operations  
✅ Any operation with business logic requirements  
✅ Operations needing role-based access control

---

## Technical Details

**Protocol:** JSON-RPC 2.0 (Model Context Protocol 2024-11-05)  
**Runtime:** Deno on Supabase Edge Functions  
**Authentication:** JWT-based (Supabase auth tokens)  
**Source Code:** `supabase/functions/supabase-mcp-server/index.ts`

**Endpoint:** `https://[project-ref].supabase.co/functions/v1/supabase-mcp-server`

---

**Last Updated:** October 13, 2025  
**Maintained By:** Development Team

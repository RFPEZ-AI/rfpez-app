# Fix: 0 Bids After Submission - Tool Permission Issue

**Date:** October 13, 2025  
**Issue:** User submitted a bid via MCP browser, but when viewing "Bids for Crushed Granite", it showed 0 bids. The submitted bid was not appearing in the Bids view.

## Root Cause Analysis

### Initial Investigation
1. **Database Check**: No bids existed in the database for RFP ID 6 (Crushed Granite)
2. **Artifact Check**: Bid form data WAS saved in `artifacts` table with complete form values
3. **Edge Function Logs**: Revealed critical message: `✓ Tool 'submit_bid' allowed: false (in allowed list)`

### The Real Problem
The `submit_bid` tool was **filtered out** for the RFP Design agent (role='design') and never offered to Claude API, so bid submission couldn't happen!

**Tool Filtering Logic** (`supabase/functions/claude-api-v3/tools/definitions.ts`):
```typescript
const ROLE_TOOL_RESTRICTIONS = {
  'design': {
    allowed: ['create_and_set_rfp', 'get_current_rfp', 'create_form_artifact', ...]
    // ❌ submit_bid was MISSING from this allowed list!
  }
};
```

### Why This Happened
The RFP Design agent had an **explicit allowed list** of tools that did NOT include:
- `submit_bid` - Submit bid for an RFP
- `get_rfp_bids` - Retrieve bids for an RFP  
- `update_bid_status` - Update bid status (review, accept, reject)

Without these tools in the allowed list, Claude API couldn't call them, even when the user explicitly requested bid submission.

## Solution Implemented

### 1. Update Tool Permissions
**File:** `supabase/functions/claude-api-v3/tools/definitions.ts` (lines 566-568)

**Before:**
```typescript
'design': {
  // RFP Design has access to all RFP creation tools and memory tools
  allowed: ['create_and_set_rfp', 'get_current_rfp', 'create_form_artifact', 
            'create_document_artifact', 'get_form_schema', 'update_form_data', 
            'update_form_artifact', 'get_available_agents', 'get_conversation_history', 
            'store_message', 'search_messages', 'get_current_agent', 
            'debug_agent_switch', 'recommend_agent', 'create_memory', 'search_memories']
}
```

**After:**
```typescript
'design': {
  // RFP Design has access to all RFP creation tools, bid management tools, and memory tools
  allowed: ['create_and_set_rfp', 'get_current_rfp', 'create_form_artifact', 
            'create_document_artifact', 'get_form_schema', 'update_form_data', 
            'update_form_artifact', 
            'submit_bid', 'get_rfp_bids', 'update_bid_status',  // ✅ ADDED BID TOOLS
            'get_available_agents', 'get_conversation_history', 
            'store_message', 'search_messages', 'get_current_agent', 
            'debug_agent_switch', 'recommend_agent', 'create_memory', 'search_memories']
}
```

### 2. Deploy Updated Edge Function
```bash
supabase functions deploy claude-api-v3
```

**Result:** 
- Version incremented (check with `supabase functions list`)
- New tool permissions active immediately
- RFP Design agent can now submit bids and view bid lists

## Testing Verification

### Before Fix:
- ❌ User submits bid via "Crushed Granite Supplier Bid Form"
- ❌ Edge function logs: `✓ Tool 'submit_bid' allowed: false`
- ❌ Claude API never receives submit_bid tool in tool definitions
- ❌ Bid not created in database (0 bids for RFP ID 6)
- ❌ Bids view shows empty state

### After Fix:
- ✅ RFP Design agent has submit_bid in allowed tools list
- ✅ Claude API receives submit_bid tool definition
- ✅ User can submit bid successfully
- ✅ Bid created in database with status='submitted'
- ✅ Bids view displays submitted bid
- ✅ Bid management tools (get_rfp_bids, update_bid_status) also available

## Related Discoveries

### Database Function Works Correctly
When tested directly via psql:
```sql
SELECT public.submit_bid(6, '3f278809-c3dc-457d-a2b0-2dacd95eb11c', NULL, NULL, NULL, NULL);
```
**Result:** ✅ Bid created successfully (bid id=2, submission_id returned)

This confirmed that:
- The `submit_bid` database function is properly configured
- SECURITY DEFINER is working correctly
- RLS policies are NOT the issue (postgres role has BYPASSRLS)
- The problem was purely tool filtering at the edge function level

### Field Extraction Enhancement Needed
The created bid had `bid_amount=NULL` because the extraction logic in `submit_bid` function looked for:
- `form_data->>'bid_amount'`
- `form_data->>'amount'`
- `form_data->>'price'`

But the actual field name was:
- `form_data->>'total_bid_amount'` ✅ (now added to extraction logic)
- `form_data->>'unit_price_per_ton'` ✅ (now added as fallback)

**Migration:** `20251013020000_fix_submit_bid_rls.sql` (lines 56-58)
- Enhanced extraction to check more field name variations
- Added `supplier_notes`, `additional_notes` extraction variants
- Improved logging with SQLSTATE in exception handler

## Key Takeaways

1. **Tool Filtering is Strict**: Agents with `allowed` lists must explicitly include ALL needed tools
2. **Edge Function Logs Are Critical**: Check edge function logs for "FILTERING TOOL" messages
3. **Test Database Functions Separately**: Direct psql testing helped isolate the root cause
4. **Permission vs Functionality**: The database function worked perfectly; permissions were the issue
5. **Agent Role Capabilities**: Document which tools each agent role needs for their workflows

## Files Modified

### Edge Function
- `supabase/functions/claude-api-v3/tools/definitions.ts`
  - Added `submit_bid`, `get_rfp_bids`, `update_bid_status` to design role allowed list
  - Updated comment to reflect bid management capabilities

### Database Migration
- `supabase/migrations/20251013020000_fix_submit_bid_rls.sql`
  - Enhanced field extraction logic in `submit_bid` function
  - Added more field name variants for bid_amount and supplier_notes
  - Improved error logging with SQLSTATE

## Deployment Commands

```bash
# Deploy edge function with updated tool permissions
supabase functions deploy claude-api-v3

# Check deployment status
supabase functions list

# Apply database migration (enhanced extraction logic)
supabase migration up
```

## Future Improvements

1. **Tool Permission Documentation**: Create a matrix showing which agent roles have access to which tools
2. **Automatic Tool Discovery**: Consider allowing agents to discover available tools dynamically
3. **Permission Warnings**: Add validation to warn when critical workflows lack necessary tools
4. **Agent Instructions**: Update RFP Design agent instructions to clarify bid management capabilities
5. **Field Name Standardization**: Standardize form field naming conventions across all RFP artifacts

## Related Documentation

- **AGENTS.md** - Agent system and role-based tool filtering
- **FIX-ARTIFACT-DISPLAY-AND-RLS-POLICIES.md** - RLS policy fixes and artifact rendering
- **DEPLOYMENT-GUIDE.md** - Edge function deployment procedures

---

**Status:** ✅ Fixed and deployed - RFP Design agent can now submit and manage bids

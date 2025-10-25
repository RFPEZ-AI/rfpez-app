# Automatic RFP Attribution Fix

## Problem
Artifacts were being attributed to the wrong RFPs because the LLM was attempting to track the current RFP ID manually, leading to errors where artifacts would be associated with incorrect RFP contexts.

## Solution
Modified all artifact creation and bid-related tools to automatically inject the current RFP ID from the session context instead of requiring the LLM to provide it.

## Changes Made

### 1. Tool Definitions Updated (`tools/definitions.ts`)

**Removed `rfp_id` parameter from:**
- `create_form_artifact` - Now auto-associates with current session RFP
- `create_document_artifact` - Now auto-associates with current session RFP
- `submit_bid` - Now auto-uses current session RFP
- `get_rfp_bids` - Now auto-uses current session RFP

**Updated descriptions to clarify:**
- Artifacts are automatically associated with the session's current active RFP
- Users must call `create_and_set_rfp` first before creating artifacts
- `get_current_rfp` is now only for informational purposes, not required for artifact creation

### 2. Tool Execution Logic (`services/claude.ts`)

**Added automatic RFP injection for:**
- `create_form_artifact` - Fetches `current_rfp_id` from session and injects it
- `create_document_artifact` - Fetches `current_rfp_id` from session and injects it
- `submit_bid` - Fetches `current_rfp_id` from session and injects it
- `get_rfp_bids` - Fetches `current_rfp_id` from session and injects it

**Implementation pattern:**
```typescript
// Fetch current_rfp_id from session
const sessionQuery = await this.supabase
  .from('sessions')
  .select('current_rfp_id')
  .eq('id', sessionId)
  .single();

const { data: sessionData, error: sessionError } = sessionQuery as { 
  data: { current_rfp_id?: number } | null; 
  error: Error | null 
};

// Validate RFP is set
if (!sessionData?.current_rfp_id) {
  return {
    success: false,
    error: 'No current RFP set',
    message: 'You must call create_and_set_rfp first...'
  };
}

// Inject into tool parameters
return await toolFunction(this.supabase, sessionId, this.userId, {
  ...input,
  rfp_id: sessionData.current_rfp_id  // 🎯 AUTO-INJECTED
});
```

### 3. Database Functions Updated (`tools/database.ts`)

**Updated error messages in:**
- `createFormArtifact` - Now indicates auto-injection system error if rfp_id missing
- `createDocumentArtifact` - Now indicates auto-injection system error if rfp_id missing
- `getCurrentRfp` - Simplified message when no RFP is set

**Before:**
```typescript
throw new Error('You must either call create_and_set_rfp first or use get_current_rfp to get the session\'s current RFP ID.');
```

**After:**
```typescript
throw new Error('rfp_id is required but was not auto-injected. This indicates a system error - the current RFP should be automatically retrieved from the session.');
```

### 4. Type System Enhanced (`types.ts`)

**Added `recovery_action` field to `ToolResult` interface:**
```typescript
export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown> | string | number | boolean | unknown[] | null;
  error?: string;
  message?: string;
  clientCallbacks?: ClientCallback[];
  current_rfp_id?: number;
  rfp?: RFPRecord;
  recovery_action?: {  // 🆕 NEW: Recovery guidance for Claude
    tool: string;
    instruction: string;
  };
}
```

This allows error responses to include actionable recovery steps that Claude can execute automatically.

### 5. Intelligent Error Recovery

**When no current RFP is set, Claude receives:**
```typescript
{
  success: false,
  error: 'No current RFP set',
  message: 'No RFP is currently active for this session. To create this form artifact, you must first create an RFP using the create_and_set_rfp tool. Call it now with a descriptive name based on what the user is procuring (e.g., "LED Bulbs RFP" or "Industrial Alcohol RFP"), then retry creating the form artifact.',
  recovery_action: {
    tool: 'create_and_set_rfp',
    instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
  }
}
```

This enables Claude to:
1. Understand the specific issue (no current RFP)
2. Know exactly which tool to call (`create_and_set_rfp`)
3. Receive guidance on parameters (descriptive name based on procurement)
4. Automatically retry the original operation after recovery

## Benefits

### 1. **Eliminates Attribution Errors**
- Artifacts are always associated with the session's current active RFP
- No risk of LLM providing wrong RFP ID or outdated context

### 2. **Simpler Tool Interface**
- LLM doesn't need to track or pass `rfp_id` parameters
- Reduced cognitive load on the AI model
- Fewer tool parameters to manage

### 3. **Clearer User Experience**
- Current RFP is a session-level concept managed server-side
- Users can trust artifacts are associated correctly
- Consistent behavior across all RFP-related operations

### 4. **Better Error Handling**
- Clear error messages when no RFP is set
- **🎯 NEW: Automatic Recovery Instructions** - When no RFP is set, Claude receives actionable guidance to create one first
- Validation happens automatically at execution time
- System ensures RFP exists before allowing artifact creation

### 5. **Intelligent Recovery System**
When Claude attempts to create artifacts without a current RFP, the system now returns:
- Clear error message explaining the issue
- Specific recovery action: `create_and_set_rfp`
- Contextual instruction on how to proceed
- Example: "Call create_and_set_rfp with a descriptive name based on what the user is procuring (e.g., 'LED Bulbs RFP'), then retry creating the form artifact."

This enables Claude to self-correct by creating the RFP first, then retrying the artifact creation automatically.

## Migration Notes

### For Existing Code
No changes needed to existing database schema or RLS policies. The change is entirely in the Edge Function layer.

### For Testing
When testing artifact creation:
1. Always call `create_and_set_rfp` first to establish a current RFP
2. All subsequent artifact operations will use that RFP automatically
3. No need to track or pass `rfp_id` in tool calls

### For Future Development
When adding new RFP-related tools:
- Follow the same pattern of auto-injecting `current_rfp_id` from session
- Update tool definitions to remove `rfp_id` from input schema
- Add validation in `executeTool` to fetch and inject the current RFP

## Files Modified

1. `supabase/functions/claude-api-v3/tools/definitions.ts`
   - Removed `rfp_id` parameter from 4 tools
   - Updated tool descriptions

2. `supabase/functions/claude-api-v3/services/claude.ts`
   - Added RFP auto-injection logic to 4 tool handlers
   - Added proper error handling and validation
   - **🆕 Added recovery instructions for missing RFP scenarios**

3. `supabase/functions/claude-api-v3/tools/database.ts`
   - Updated error messages to reflect auto-injection
   - Clarified system vs user errors

4. `supabase/functions/claude-api-v3/types.ts`
   - **🆕 Added `recovery_action` field to `ToolResult` interface**
   - Enables structured recovery guidance in error responses

## Testing Checklist

- [x] Tool definitions updated and validated
- [x] Execution logic implemented with proper type handling
- [x] Error messages updated for clarity
- [ ] Manual testing: Create RFP → Create artifact → Verify association
- [ ] Manual testing: Create multiple RFPs → Switch contexts → Verify correct attribution
- [ ] Edge case: Attempt artifact creation without setting RFP (should fail gracefully)
- [ ] Edge case: Session with deleted RFP (should detect and report error)

## Deployment Notes

This is a **breaking change** for any external integrations that call the Edge Function directly with `rfp_id` parameters. However:
- Internal React app will work seamlessly as it relies on tool definitions
- The Edge Function will ignore extra parameters, so passing `rfp_id` won't cause errors
- The auto-injected value will override any manually passed `rfp_id`

## Future Enhancements

Consider extending this pattern to:
- Auto-inject `account_id` from session context
- Auto-inject `agent_id` for all agent-related operations
- Create a centralized session context injection middleware

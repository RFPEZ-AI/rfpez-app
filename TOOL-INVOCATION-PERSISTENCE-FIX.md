# Tool Invocation Persistence Fix

## Problem Statement
Tool completions were not showing in message cards because tool invocations were being tracked during streaming but **not persisted to the database** when messages were stored.

## Root Cause Analysis

### What Was Working ✅
1. **Edge Function Streaming**: `claude-api-v3` correctly sends `tool_invocation` events with `tool_start` and `tool_complete` during streaming
2. **Frontend Display**: `SessionDialog` component has logic to display tool invocations from `message.metadata.toolInvocations`
3. **Real-time Updates**: Tool invocations appear correctly during live streaming

### What Was Broken ❌
1. **Database Persistence**: Tool invocations were NOT saved to the database when messages were stored
2. **Message Reload**: When reloading a session, tool invocations were missing because they weren't in the database
3. **Missing Metadata**: The `store_message` tool wasn't including tool invocation data in message metadata

## Solution Implementation

### Changes Made

#### 1. Enhanced `ToolExecutionService` Class
**File**: `supabase/functions/claude-api-v3/services/claude.ts`

Added tool invocation tracking:
```typescript
private toolInvocations: Array<{
  type: 'tool_start' | 'tool_complete';
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  agentId?: string;
  timestamp: string;
}> = [];

// Methods added:
- addToolInvocation(): Track tool starts and completions
- getToolInvocations(): Retrieve all tracked invocations
- clearToolInvocations(): Clear tracking for new messages
```

#### 2. Inject Tool Invocations into `store_message`
**File**: `supabase/functions/claude-api-v3/services/claude.ts`

Modified `store_message` case to:
- Automatically inject tracked tool invocations into message metadata
- Only inject for assistant messages (not user messages)
- Clear invocations after storing to prepare for next message

```typescript
case 'store_message': {
  // ... validation ...
  
  // 🎯 INJECT TOOL INVOCATIONS into metadata
  if (inputData.sender === 'assistant' && this.toolInvocations.length > 0) {
    existingMetadata.toolInvocations = this.toolInvocations;
    inputData.metadata = existingMetadata;
  }
  
  // ... store message ...
  
  // Clear after storing
  if (inputData.sender === 'assistant') {
    this.clearToolInvocations();
  }
}
```

#### 3. Track Tool Invocations During Streaming
**File**: `supabase/functions/claude-api-v3/handlers/http.ts`

Added tracking calls:
- When tool use is detected: `toolService.addToolInvocation('tool_start', ...)`
- When tool execution completes: `toolService.addToolInvocation('tool_complete', ...)`

## Data Flow

### Before Fix 🔴
```
1. Claude calls tool → Edge function tracks in streaming
2. Tool invocation sent to frontend via SSE
3. Frontend displays tool in real-time ✅
4. Message stored without tool invocations ❌
5. Page reload → tool invocations missing ❌
```

### After Fix 🟢
```
1. Claude calls tool → Edge function tracks in streaming
2. Tool invocation tracked in ToolExecutionService ✅
3. Tool invocation sent to frontend via SSE
4. Frontend displays tool in real-time ✅
5. Message stored WITH tool invocations in metadata ✅
6. Page reload → tool invocations loaded from database ✅
```

## Database Schema

### Messages Table - Metadata Column
The `messages.metadata` JSONB column now includes:
```json
{
  "toolInvocations": [
    {
      "type": "tool_start",
      "toolName": "create_form_artifact",
      "parameters": { "name": "LED Specifications" },
      "agentId": "uuid-of-agent",
      "timestamp": "2025-10-14T..."
    },
    {
      "type": "tool_complete",
      "toolName": "create_form_artifact",
      "result": { "success": true, "artifact_id": "..." },
      "agentId": "uuid-of-agent",
      "timestamp": "2025-10-14T..."
    }
  ]
}
```

## Testing Checklist

### Manual Testing Steps
1. ✅ Start a new session
2. ✅ Send a message that triggers tool execution (e.g., "Create a new RFP")
3. ✅ Verify tool invocations appear in real-time during streaming
4. ✅ Refresh the page/reload the session
5. ✅ Verify tool invocations still appear in the message card
6. ✅ Check database directly to confirm metadata is stored

### Expected Results
- Tool invocations appear during streaming
- Tool invocations persist after page reload
- Multiple tool executions are tracked correctly
- Agent attribution is maintained (agentId field)

## Verification Queries

### Check Message Metadata in Database
```sql
-- View recent messages with tool invocations
SELECT 
  id,
  role,
  content,
  metadata->'toolInvocations' as tool_invocations,
  created_at
FROM messages
WHERE metadata ? 'toolInvocations'
ORDER BY created_at DESC
LIMIT 10;

-- Count messages with tool tracking
SELECT 
  COUNT(*) as messages_with_tools,
  COUNT(DISTINCT (metadata->>'agentId')) as agents_used
FROM messages
WHERE metadata ? 'toolInvocations';
```

## Backward Compatibility
- ✅ Existing messages without tool invocations continue to work
- ✅ Frontend checks for `metadata.toolInvocations` existence before displaying
- ✅ No database migrations required (metadata column already exists as JSONB)

## Future Enhancements
1. Add tool execution duration tracking
2. Add tool error state tracking
3. Create analytics dashboard for tool usage
4. Add tool invocation search/filtering

## Related Files
- `supabase/functions/claude-api-v3/services/claude.ts` - Service layer with tracking
- `supabase/functions/claude-api-v3/handlers/http.ts` - Streaming handler with tracking calls
- `supabase/functions/claude-api-v3/tools/database.ts` - `storeMessage` function
- `src/components/SessionDialog.tsx` - Frontend display logic
- `src/components/ToolExecutionDisplay.tsx` - Tool UI component

## Deployment Notes
1. Deploy edge function changes: `supabase functions deploy claude-api-v3`
2. No database migrations required
3. Test with existing sessions to verify backward compatibility
4. Monitor logs for tool invocation tracking messages

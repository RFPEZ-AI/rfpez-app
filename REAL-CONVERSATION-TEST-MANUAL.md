# Real Conversation Test - Manual Instructions

## Purpose
Validate that tool invocations persist during actual conversations and survive page reloads.

## Prerequisites
1. ✅ Edge function deployed (claude-api-v3 v201)
2. ✅ Local Supabase running on http://127.0.0.1:54321
3. ✅ React app running on http://localhost:3100
4. ✅ Browser with MCP extension connected

## Test Steps

### Step 1: Initial State Check
```sql
-- Check current state of tool invocations
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END) as messages_with_tools
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Expected:** Should show current baseline (e.g., 1 message with tools from validation test)

### Step 2: Create New Session
1. Open http://localhost:3100 in browser
2. Click "New Session" button (data-testid="new-session-button")
3. Verify new session created

### Step 3: Trigger Tool Execution
Send a message that will trigger tool execution:

**Message to send:**
```
Create a new RFP called "Industrial Safety Equipment Procurement" with description "We need safety helmets, protective gloves, steel-toed boots, and high-visibility vests for 50 factory workers. Equipment must meet OSHA standards."
```

**Expected behavior:**
1. Agent should switch to RFP Design (if not already)
2. Tool `create_and_set_rfp` should be called
3. RFP should be created
4. Response should confirm RFP creation

### Step 4: Verify Tool Tracking (Immediate)
Open browser console and check for log messages:
- Look for "📊 Tracked tool_start for create_and_set_rfp"
- Look for "📊 Tracked tool_complete for create_and_set_rfp"

### Step 5: Check Database (Before Reload)
```sql
-- Get the most recent assistant message with potential tool invocations
SELECT 
  m.id,
  m.session_id,
  m.role,
  LEFT(m.content, 100) as content_preview,
  m.created_at,
  CASE 
    WHEN m.metadata ? 'toolInvocations' THEN jsonb_array_length(m.metadata->'toolInvocations')
    ELSE 0
  END as tool_count
FROM messages m
WHERE m.role = 'assistant'
  AND m.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY m.created_at DESC
LIMIT 5;
```

**Expected:** Recent assistant message should have tool_count > 0

### Step 6: Detailed Tool Invocation Inspection
```sql
-- Get full tool invocation details for the most recent message with tools
SELECT 
  m.id,
  m.role,
  m.content,
  jsonb_pretty(m.metadata->'toolInvocations') as tool_invocations_detail
FROM messages m
WHERE m.metadata ? 'toolInvocations'
  AND m.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY m.created_at DESC
LIMIT 1;
```

**Expected:** Should show complete tool invocation structure:
- type: "tool_start" and "tool_complete"
- toolName: "create_and_set_rfp"
- agentId: (RFP Design agent UUID)
- parameters: (RFP name and description)
- result: (success status and rfp_id)
- timestamp: (ISO 8601 format)

### Step 7: Page Reload Test
1. Note the current session ID from the URL or UI
2. Press F5 or Ctrl+R to reload the page
3. Wait for page to fully load
4. Verify session messages are restored

### Step 8: UI Verification
After page reload, check the message cards:
1. Find the assistant message that created the RFP
2. Look for tool execution badges/indicators in the message card
3. Verify tool names are displayed (should show "create_and_set_rfp")
4. Verify agent attribution is shown

### Step 9: Post-Reload Database Check
```sql
-- Verify tool invocations still present after reload simulation
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END) as messages_with_tools,
  COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as percentage
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Expected:** Should show +1 more message with tools compared to Step 1

## Success Criteria

### ✅ Test Passes If:
1. Tool invocations appear in database after conversation
2. Database query shows tool_count > 0 for assistant message
3. Tool invocation structure is complete (all required fields)
4. Page reload successfully restores messages
5. UI displays tool execution indicators (badges/chips)
6. Tool invocations survive page reload (still in database)

### ❌ Test Fails If:
1. No tool invocations found in database after conversation
2. tool_count = 0 for assistant message
3. Missing fields in tool invocation structure
4. Page reload loses tool invocation data
5. UI doesn't show any tool execution indicators
6. Database queries fail or return errors

## Troubleshooting

### If tool invocations not found:
1. Check if `store_message` was called by Claude
   ```sql
   -- Check if ANY messages were stored during the conversation
   SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '5 minutes';
   ```
2. Check edge function logs for tool tracking messages
3. Verify edge function deployment (should be v201)

### If UI doesn't show tool badges:
1. Check browser console for JavaScript errors
2. Verify ToolExecutionDisplay component is being rendered
3. Check if metadata.toolInvocations is being passed to component
4. Inspect message card HTML for tool-related elements

### If page reload fails:
1. Check browser network tab for API errors
2. Verify session ID is preserved in URL/state
3. Check Supabase connection status
4. Look for RLS policy issues in database logs

## Quick Validation Query
```sql
-- One-line check to see if test passed
SELECT 
  CASE 
    WHEN COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END) > 0 
    THEN '✅ TEST PASSED - Tool invocations found!'
    ELSE '❌ TEST FAILED - No tool invocations'
  END as test_result
FROM messages
WHERE created_at > NOW() - INTERVAL '10 minutes'
  AND role = 'assistant';
```

## Notes
- Test user: alexeck@gmail.com (efbffaac-37df-4d9a-9689-13f4984a89a7)
- Test session can be cleaned up after test completes
- Tool invocation structure follows design in TOOL-INVOCATION-PERSISTENCE-FIX.md
- Edge function version should be v201 or higher

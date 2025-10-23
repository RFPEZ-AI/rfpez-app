# Agent Switch UI Bug - Analysis & Solution

## Problem Description

**User Report:**
- Signed up as mskiba@esphere.com
- Said: "I need to source concrete for a construction project"
- **Solutions Agent**: Should have created memory and switched to RFP Design
- **RFP Design Agent**: Response showed "nothing in the UI"
- **After page refresh**: RFP Design response appeared
- **No memory created**: RFP Design agent searched for procurement intent but found nothing

## Root Causes Identified

### Issue #1: Messages Not Saved to Database During Agent Switch

**Location**: `src/hooks/useMessageHandling.ts` line 1310-1323

**Problem**: Final message content update is **DISABLED** for debugging purposes

```typescript
// 🚨 DISABLED: Final message update to preserve streaming state
// setMessages(prev => {
//   return prev.map(msg => 
//     msg.id === aiMessageId 
//       ? { ...msg, content: finalContent }
//       : msg
//   );
// });
```

**Impact**: 
- Messages created during `message_start` event (agent switch) have content in UI
- BUT the message content is never refreshed after streaming completes
- Database save happens AFTER streaming completes (lines 1472-1573)
- If final content isn't updated in UI state, database save may use incomplete content
- **Page refresh loads messages from database** → shows the complete response

**Evidence**: Line 1272-1287 shows `message_start` handler creates new message with `hidden: true` and empty content, then updates as chunks arrive. But without final refresh, UI may not have complete content when database save happens.

### Issue #2: Solutions Agent Not Creating Memories

**Location**: `Agent Instructions/Solutions Agent.md` lines 127-145

**Expected Behavior**:
```markdown
**STEP 1 - Create Memory FIRST** (before switch_agent):
Call `create_memory` with:
{
  "content": "User wants to [specific procurement intent]. Details: [all relevant details]",
  "memory_type": "decision",
  "importance_score": 0.9
}

**STEP 2 - Then Switch Agents**:
{
  "agent_name": "RFP Design",
  "user_input": "[User's original request verbatim]"
}
```

**Actual Behavior**: 
- Solutions agent may be calling `switch_agent` ONLY
- Not executing `create_memory` tool call first
- RFP Design agent searches for memories but finds nothing

**Investigation Needed**:
1. Check Claude API logs for tool invocations
2. Verify if both `create_memory` and `switch_agent` are being called
3. Check if tool execution order is correct

### Issue #3: Message Visibility After Agent Switch

**Location**: `src/hooks/useMessageHandling.ts` lines 736-770

**Problem**: New agent messages created with `hidden: true`

```typescript
const newAgentMessage: Message = {
  id: newAgentMessageId,
  content: '',
  isUser: false,
  timestamp: new Date(),
  agentName: metadata.agent_name || 'AI Assistant',
  hidden: true // ✅ FIX: Hide empty agent switch messages
};
```

**Impact**:
- Message is created but hidden
- Content streams in during chunks
- BUT message might stay hidden if not explicitly unhidden
- **Need to verify**: Is `hidden: false` set when content arrives?

## Recommended Fixes

### Fix #1: Re-enable Final Message Update (HIGH PRIORITY)

**File**: `src/hooks/useMessageHandling.ts` line 1310

**Change**:
```typescript
// CRITICAL FIX: Re-enable final message update to ensure database saves complete content
setMessages(prev => {
  return prev.map(msg => 
    msg.id === aiMessageId 
      ? { ...msg, content: finalContent, hidden: false } // Also unhide message
      : msg
  );
});
```

**Why**: This ensures the UI state has the complete message content before database save

### Fix #2: Verify Tool Execution in Solutions Agent

**Action Required**:
1. Test with browser console open
2. User says: "I need to source concrete"
3. Check console logs for:
   - `🔧 Tool invocation event received: tool_start create_memory`
   - `✅ Updating tool to completed: create_memory`
   - `🔧 Tool invocation event received: tool_start switch_agent`
   - `✅ Updating tool to completed: switch_agent`

**Expected Order**:
```
1. create_memory (tool_start)
2. create_memory (tool_complete)
3. switch_agent (tool_start)
4. switch_agent (tool_complete)
```

**If Not Happening**: Update Solutions Agent instructions to be more explicit:
```markdown
**CRITICAL RULE**: You MUST execute TWO tools in this EXACT order:

FIRST: create_memory({
  content: "User wants to source [product/service]. Details: [all specifics]",
  memory_type: "decision",
  importance_score: 0.9
})

SECOND (only after create_memory completes): switch_agent({
  agent_name: "RFP Design",
  user_input: "[user's original message verbatim]"
})

DO NOT skip create_memory. DO NOT call tools in wrong order.
```

### Fix #3: Ensure Message Unhiding During Streaming

**File**: `src/hooks/useMessageHandling.ts`

**Check**: When chunks arrive for `message_start` messages, verify they're unhidden

**Location**: Around line 1220 where `setMessages` is called with accumulated content

**Add**:
```typescript
setMessages(prev => 
  prev.map(msg => 
    msg.id === aiMessageId 
      ? { 
          ...msg, 
          content: accumulatedContent,
          hidden: false // Explicitly unhide when content arrives
        }
      : msg
  )
);
```

## Testing Plan

### Test Case 1: Agent Switch with Message Persistence

**Steps**:
1. Sign up/log in as test user
2. Say: "I need to source LED bulbs"
3. Observe Solutions agent behavior in console
4. **Expected**: 
   - See `create_memory` tool call
   - See `switch_agent` tool call
   - RFP Design response appears immediately in UI
5. Refresh page
6. **Expected**: RFP Design response still shows (loaded from database)

### Test Case 2: Memory Search After Agent Switch

**Steps**:
1. Same as Test Case 1
2. When RFP Design agent loads, check console for:
   - `search_memories` tool invocation
   - Results showing the procurement intent memory
3. **Expected**: RFP Design agent finds and references the concrete sourcing intent

### Test Case 3: Message Visibility

**Steps**:
1. Same as Test Case 1
2. Watch UI carefully during agent switch
3. **Expected**: 
   - No "nothing in the UI" state
   - RFP Design response streams in smoothly
   - Message visible without refresh

## Additional Investigation

### Check Database Schema

**Query to verify message structure**:
```sql
SELECT 
  m.id,
  m.content,
  m.role,
  m.agent_name,
  m.metadata,
  m.created_at
FROM messages m
WHERE m.session_id = '[test-session-id]'
ORDER BY m.created_at DESC;
```

**Look for**:
- Are agent switch messages being saved?
- Is content complete or truncated?
- Is agent_name correct for each message?

### Check Memory Creation

**Query to verify memories**:
```sql
SELECT 
  am.id,
  am.content,
  am.memory_type,
  am.importance_score,
  am.created_at
FROM account_memories am
WHERE am.user_id = (SELECT id FROM auth.users WHERE email = 'mskiba@esphere.com')
  AND am.memory_type = 'decision'
ORDER BY am.created_at DESC;
```

**Look for**:
- Are procurement intent memories being created?
- Is memory content accurate?
- Is importance_score correct (0.9)?

## Priority Order

1. **IMMEDIATE**: Re-enable final message update (Fix #1)
2. **HIGH**: Verify and fix tool execution order (Fix #2)
3. **MEDIUM**: Ensure message unhiding (Fix #3)
4. **LOW**: Database verification queries

## Next Steps

Would you like me to:
1. ✅ **Apply Fix #1** (re-enable final message update)
2. ✅ **Add explicit unhiding** in streaming updates (Fix #3)
3. 🔍 **Test the current implementation** with browser console logging to verify tool execution
4. 📝 **Update Solutions Agent instructions** to be more explicit about tool order

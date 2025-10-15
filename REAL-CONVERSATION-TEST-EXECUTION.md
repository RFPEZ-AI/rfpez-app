# Real Conversation Test - EXECUTION GUIDE

## Test Status: Ready to Execute 🚀

**Created:** October 15, 2025 04:00 UTC  
**Purpose:** Validate tool invocations persist through real conversation flow  
**Duration:** ~5 minutes

---

## Quick Start (5-Minute Test)

### Prerequisites Check ✅
- [x] Dev Server: http://localhost:3100 (Running)
- [x] Edge Function: claude-api-v3 v201 (Deployed)
- [x] Local Supabase: http://127.0.0.1:54321 (Running)
- [ ] Browser: Opened to http://localhost:3100
- [ ] User: Logged in as test user

### Test Execution (Follow These Steps)

#### 1. Open Application (30 seconds)
```
🌐 Navigate to: http://localhost:3100
👤 Login with: alexeck@gmail.com / [password]
```

#### 2. Create New Session (10 seconds)
```
📝 Click: "New Session" button
✅ Verify: New session created
```

#### 3. Send Test Message (20 seconds)
**Copy and paste this exact message:**
```
Create a new RFP called "Industrial Safety Equipment Procurement" with description "We need safety helmets, protective gloves, steel-toed boots, and high-visibility vests for 50 factory workers. Equipment must meet OSHA standards."
```

**Click:** Send button (or press Enter)

**Watch for:**
- Agent might switch to "RFP Design"
- Tool execution indicator showing "create_and_set_rfp"
- Response confirming RFP creation

#### 4. Check Database Immediately (30 seconds)
**Run this query in a terminal:**
```bash
cd c:/Dev/RFPEZ.AI/rfpez-app && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

(async () => {
  const { data } = await supabase
    .from('messages')
    .select('id, role, content, metadata')
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (data && data.metadata && data.metadata.toolInvocations) {
    console.log('✅ TOOL INVOCATIONS FOUND!');
    console.log('Count:', data.metadata.toolInvocations.length);
    console.log(JSON.stringify(data.metadata.toolInvocations, null, 2));
  } else {
    console.log('⚠️ No tool invocations found');
    console.log('Message:', data);
  }
})();
"
```

**Expected output:**
```json
✅ TOOL INVOCATIONS FOUND!
Count: 2
[
  {
    "type": "tool_start",
    "toolName": "create_and_set_rfp",
    ...
  },
  {
    "type": "tool_complete",
    "toolName": "create_and_set_rfp",
    ...
  }
]
```

#### 5. Test Page Reload (60 seconds)
```
🔄 Press F5 in browser
⏳ Wait for page to reload
✅ Verify messages are restored
🔍 Look for tool execution badges in message cards
```

#### 6. Final Verification (30 seconds)
**Run quick validation query:**
```bash
cd c:/Dev/RFPEZ.AI/rfpez-app && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

(async () => {
  const { data } = await supabase.rpc('execute_sql', { 
    query: \`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN metadata ? 'toolInvocations' THEN 1 END) as messages_with_tools
      FROM messages
      WHERE created_at > NOW() - INTERVAL '10 minutes'
    \`
  });
  console.log('Recent Messages:', data);
})();
"
```

---

## Alternative: Direct Database Query Method

If you prefer SQL queries directly:

### Before Test
```sql
SELECT COUNT(*) as baseline_tool_messages
FROM messages
WHERE metadata ? 'toolInvocations'
  AND created_at > NOW() - INTERVAL '1 hour';
```

### After Sending Test Message
```sql
-- Check most recent assistant message
SELECT 
  m.id,
  LEFT(m.content, 80) as content_preview,
  jsonb_array_length(m.metadata->'toolInvocations') as tool_count,
  m.created_at
FROM messages m
WHERE m.metadata ? 'toolInvocations'
  AND m.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY m.created_at DESC
LIMIT 1;
```

### Detailed Inspection
```sql
-- See full tool invocation details
SELECT jsonb_pretty(metadata->'toolInvocations')
FROM messages
WHERE metadata ? 'toolInvocations'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Expected Results

### ✅ Success Indicators
1. **Database Check:**
   - Query returns 2 tool invocations (tool_start + tool_complete)
   - Tool name is "create_and_set_rfp"
   - Parameters include RFP name and description
   - Result includes success status and rfp_id

2. **UI Check:**
   - Message card shows tool execution badge
   - Tool name visible in UI
   - Agent attribution shown

3. **Persistence Check:**
   - Page reload doesn't lose tool data
   - Tool badges still visible after reload

### ❌ Failure Indicators
1. **No tool invocations in database**
   - Likely cause: Claude didn't call store_message
   - Fix: Check if assistant message was stored at all

2. **Empty metadata or null toolInvocations**
   - Likely cause: Tracking not working in edge function
   - Fix: Check edge function logs

3. **Tool badges not in UI**
   - Likely cause: Frontend not rendering ToolExecutionDisplay
   - Fix: Check browser console for errors

---

## Troubleshooting Commands

### Check Edge Function Logs
```bash
# If using local Supabase
docker logs -f supabase_edge_runtime_rfpez-app-local | grep -i tool
```

### Check Recent Messages
```bash
cd c:/Dev/RFPEZ.AI/rfpez-app && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
(async () => {
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Verify Edge Function Deployment
```bash
supabase functions list | grep claude-api-v3
```

---

## Test Completion Checklist

- [ ] New session created
- [ ] Test message sent
- [ ] Tool execution observed in UI
- [ ] RFP created successfully
- [ ] Tool invocations found in database (2 items)
- [ ] Tool structure complete (type, name, params, result, timestamp)
- [ ] Page reload successful
- [ ] Tool badges visible after reload
- [ ] Database queries confirm persistence

---

## Quick Pass/Fail Test

**Run this single command for instant validation:**
```bash
cd c:/Dev/RFPEZ.AI/rfpez-app && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
(async () => {
  const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).not('metadata->toolInvocations', 'is', null).gte('created_at', new Date(Date.now() - 10*60*1000).toISOString());
  console.log(count > 0 ? '✅ TEST PASSED - Tool invocations found!' : '❌ TEST FAILED - No tool invocations');
})();
"
```

---

**Ready to test? Follow steps 1-6 above and report results!** 🚀

# Memory System Testing Plan - Agent Handoff Workflow

## Test Environment Setup
- **Environment**: Remote Supabase (https://jxlutaztoukwbbgtoulc.supabase.co)
- **Edge Function**: claude-api-v3 (Version 173 - Deployed Oct 10, 2025 03:10:27 UTC)
- **React App**: http://localhost:3100
- **Test Account**: Use existing authenticated user or create test account

## Test Objective
Verify that RFP intent is preserved in memory when Solutions agent hands off to RFP Design agent.

---

## Test Scenario 1: Simple LED Bulb Procurement

### Expected Workflow:
1. User talks to Solutions agent
2. User expresses procurement need
3. Solutions agent creates memory
4. Solutions agent switches to RFP Design
5. RFP Design retrieves memory
6. RFP Design acts on intent immediately

### Step-by-Step Test:

#### Step 1: Navigate to Application
1. Open browser to http://localhost:3100
2. Verify you're logged in (if not, login with test account)
3. Start a new session (click "New Chat" or equivalent)

#### Step 2: Verify Current Agent
- Check that you're talking to **Solutions** agent (should be visible in UI)
- If not, switch to Solutions agent

#### Step 3: Express Procurement Intent
**Send this message to Solutions agent:**
```
I need to source 100 LED bulbs for our warehouse. They need to be energy efficient and last at least 5 years.
```

#### Step 4: Observe Solutions Agent Behavior
**Expected Response Pattern:**
- Solutions agent should acknowledge your request
- Should mention switching to RFP Design specialist
- Should NOT attempt to create RFP itself
- Example: "I'll connect you with our RFP Design specialist who will help you create a comprehensive procurement package for those LED bulbs!"

#### Step 5: Verify Memory Creation
**Open browser DevTools Console and check for logs:**
```
🧠 Creating memory: {...}
✅ Memory created: [memory_id]
```

**OR Query Database Directly:**
```sql
SELECT 
  id,
  content,
  memory_type,
  importance_score,
  created_at
FROM agent_memories
WHERE user_id = '[your_user_id]'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Memory Content:**
```json
{
  "content": "User wants to source 100 LED bulbs for warehouse lighting. Requirements: energy efficient, minimum 5-year lifespan, quantity 100 units.",
  "memory_type": "decision",
  "importance_score": 0.9
}
```

#### Step 6: Verify Agent Switch
- UI should update to show **RFP Design** agent is now active
- Agent avatar/name should change

#### Step 7: Observe RFP Design Agent Behavior
**Expected Response Pattern:**
- RFP Design should acknowledge the LED bulb requirement WITHOUT asking you to repeat
- Should say something like: "I see you're looking to source 100 energy-efficient LED bulbs..."
- Should immediately proceed with RFP creation
- Should call `create_and_set_rfp` function

**What NOT to See:**
- ❌ "What would you like to procure?" (generic greeting)
- ❌ "Tell me about your requirements" (asking to repeat)
- ❌ "What brings you here?" (no context)

#### Step 8: Verify Memory Retrieval
**Check browser DevTools Console for:**
```
🔍 Searching memories: {...}
✅ Found [N] memories
```

#### Step 9: Verify RFP Creation
- RFP should be created with appropriate name (e.g., "LED Bulb Procurement RFP")
- UI should show RFP in current context
- Buyer questionnaire form should be generated

### Success Criteria:
- ✅ Memory created by Solutions agent before switch
- ✅ Agent switch completed successfully
- ✅ Memory retrieved by RFP Design agent
- ✅ RFP Design acknowledged intent WITHOUT user repetition
- ✅ RFP created automatically
- ✅ Seamless conversation flow (feels like one agent)

### Failure Modes:
- ❌ Solutions agent tries to create RFP itself
- ❌ No memory created before switch
- ❌ RFP Design asks "What do you need?" after switch
- ❌ User has to repeat requirements
- ❌ Memory search not performed
- ❌ Memory created but not retrieved

---

## Test Scenario 2: Complex Multi-Item Procurement

### Step 1: Start New Session with Solutions Agent
**Send this message:**
```
We need to procure office supplies for 50 employees: printer paper (10 reams per person), pens (5 per person), folders (20 per person), and staplers (1 per person). Budget is $5000 and we need delivery within 3 weeks.
```

### Expected Behavior:
1. Solutions creates memory with ALL items and constraints
2. Memory should include: quantities, item types, budget, timeline
3. Switches to RFP Design
4. RFP Design retrieves complete context
5. RFP Design creates comprehensive RFP covering all items

### Success Criteria:
- ✅ Memory contains all 4 item types
- ✅ Memory includes budget ($5000)
- ✅ Memory includes timeline (3 weeks)
- ✅ RFP Design acknowledges ALL items without asking
- ✅ RFP created with comprehensive scope

---

## Test Scenario 3: Procurement with Special Requirements

### Step 1: Start New Session with Solutions Agent
**Send this message:**
```
I need to source industrial-grade acetone. Must be 99.5% pure or higher, quantity 500 gallons, and delivery required within 2 weeks. Also, we can only work with US-based suppliers.
```

### Expected Memory Content:
```
User wants to source industrial-grade acetone. Requirements: 99.5%+ purity, 500 gallons, delivery within 2 weeks. Constraint: US-based suppliers only.
```

### Success Criteria:
- ✅ Memory captures purity requirement
- ✅ Memory captures quantity (500 gallons)
- ✅ Memory captures timeline (2 weeks)
- ✅ Memory captures vendor constraint (US-based)
- ✅ RFP Design uses ALL constraints in RFP creation

---

## Test Scenario 4: Cross-Session Preference Retention

### Phase 1: Establish Preference
1. Complete Test Scenario 3 (acetone with US vendor preference)
2. RFP Design should create memory: "User prefers US-based vendors"

### Phase 2: New Session (Later)
1. Start completely new session
2. Send new procurement request: "I need to source printer toner cartridges"
3. RFP Design should retrieve vendor preference
4. Should mention or apply US vendor preference to new RFP

### Success Criteria:
- ✅ Preference stored in first session
- ✅ Preference retrieved in second session
- ✅ Preference applied to new procurement
- ✅ Cross-session memory persistence confirmed

---

## Database Verification Queries

### Check Memory Creation:
```sql
-- View all memories for a user
SELECT 
  id,
  content,
  memory_type,
  importance_score,
  created_at,
  agent_id,
  session_id
FROM agent_memories
WHERE user_id = '[your_user_id]'
ORDER BY created_at DESC;
```

### Check Memory References:
```sql
-- View memories linked to RFPs
SELECT 
  m.content,
  m.memory_type,
  mr.reference_type,
  mr.reference_id,
  r.name as rfp_name
FROM agent_memories m
JOIN memory_references mr ON m.id = mr.memory_id
LEFT JOIN rfps r ON mr.reference_id = r.id
WHERE m.user_id = '[your_user_id]'
ORDER BY m.created_at DESC;
```

### Check Memory Access Log:
```sql
-- See when memories were retrieved
SELECT 
  m.content,
  mal.accessed_at,
  mal.access_count,
  a.name as agent_name
FROM memory_access_log mal
JOIN agent_memories m ON mal.memory_id = m.id
JOIN agents a ON mal.agent_id = a.id
WHERE m.user_id = '[your_user_id]'
ORDER BY mal.accessed_at DESC;
```

### Check Agent Activity:
```sql
-- View which agents created which memories
SELECT 
  a.name as agent_name,
  COUNT(*) as memories_created,
  AVG(am.importance_score) as avg_importance
FROM agent_memories am
JOIN agents a ON am.agent_id = a.id
WHERE am.user_id = '[your_user_id]'
GROUP BY a.name;
```

---

## Edge Function Logs

### Check Function Execution:
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/logs/edge-functions
2. Filter to `claude-api-v3`
3. Look for these log patterns:

**Memory Creation (Solutions Agent):**
```
🧠 Creating memory: {...}
✅ Memory created: mem_[uuid]
```

**Memory Search (RFP Design Agent):**
```
🔍 Searching memories: {...}
✅ Found 3 memories
```

**Agent Switch:**
```
🔄 Switching agent: Solutions → RFP Design
```

---

## Troubleshooting Guide

### Issue: Memory Not Created
**Symptoms:** No memory in database after Solutions agent interaction
**Check:**
1. Verify authentication (memories require valid user_id)
2. Check edge function logs for errors
3. Verify `create_memory` tool is being called
4. Check if procurement intent was detected

**Solution:** Ensure user is logged in, use explicit procurement language

### Issue: Memory Not Retrieved
**Symptoms:** RFP Design asks to repeat requirements
**Check:**
1. Verify `search_memories` is called at session start
2. Check if memory exists in database
3. Verify similarity search is working (check embeddings)
4. Check agent_id matches between creation and search

**Solution:** Ensure agent switch includes session continuity

### Issue: Agent Not Switching
**Symptoms:** Solutions agent tries to create RFP
**Check:**
1. Verify `switch_agent` tool is available
2. Check agent instructions are deployed
3. Verify authentication status
4. Check for tool execution errors

**Solution:** Re-deploy agent instructions, verify tool definitions

### Issue: Incorrect Memory Content
**Symptoms:** Memory exists but incomplete or wrong
**Check:**
1. Review Solutions agent's memory creation logic
2. Check importance_score assignment
3. Verify all user details captured
4. Review memory content format

**Solution:** Update agent instructions for better detail capture

---

## Performance Metrics to Track

### Memory System:
- **Memory Creation Rate:** % of agent switches with memory created
- **Memory Retrieval Rate:** % of RFP Design sessions with memory search
- **Memory Relevance:** Average similarity score of retrieved memories
- **Memory Utilization:** % of retrieved memories actually used

### User Experience:
- **Repetition Rate:** % of users who repeat requirements after switch
- **Switch Success Rate:** % of agent switches completed without errors
- **Session Continuity:** % of sessions where context is preserved
- **User Satisfaction:** Subjective rating of handoff smoothness

### System Health:
- **Function Execution Time:** create_memory and search_memories latency
- **Database Performance:** Query response times for memory operations
- **Error Rate:** % of failed memory operations
- **Memory Growth:** Rate of memory table growth over time

---

## Expected vs Actual Results Template

### Test Scenario: [Name]
**Date:** [Date/Time]
**Tester:** [Name]
**Environment:** Remote Supabase

#### Expected Result:
- [Bullet point 1]
- [Bullet point 2]

#### Actual Result:
- [What actually happened]

#### Pass/Fail: [PASS/FAIL]

#### Notes:
- [Any observations]
- [Screenshots if applicable]

#### Database Evidence:
```sql
-- Query results showing memory state
```

#### Edge Function Logs:
```
-- Relevant log excerpts
```

---

## Quick Test Commands

### Memory Creation Test:
```bash
# Test user message
echo "Test message: I need to source 100 LED bulbs"

# Expected DB entry after
psql -h localhost -p 54322 -U postgres -c "SELECT content, memory_type FROM agent_memories ORDER BY created_at DESC LIMIT 1;"
```

### Memory Search Test:
```bash
# After agent switch, should retrieve memory
# Check function logs
supabase functions logs claude-api-v3 --limit 20 | grep "🔍 Searching memories"
```

---

## Test Execution Checklist

- [ ] Environment configured to REMOTE Supabase
- [ ] Edge function deployed (claude-api-v3 v173+)
- [ ] React dev server running (localhost:3100)
- [ ] Test user authenticated
- [ ] Browser DevTools open (Console tab)
- [ ] Database query tool ready (psql or Supabase Dashboard)
- [ ] Test Scenario 1 executed
- [ ] Test Scenario 1 results documented
- [ ] Database verified for Test Scenario 1
- [ ] Test Scenario 2 executed
- [ ] Test Scenario 2 results documented
- [ ] Test Scenario 3 executed
- [ ] Cross-session test executed (Scenario 4)
- [ ] All database queries run
- [ ] Edge function logs reviewed
- [ ] Performance metrics collected
- [ ] Issues documented
- [ ] Test report created

---

**Test Plan Version:** 1.0  
**Created:** October 9, 2025  
**Edge Function Version:** claude-api-v3 v173  
**Status:** Ready for Execution

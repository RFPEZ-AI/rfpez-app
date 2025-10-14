# RFP Context Switching - Test Plan

## 🎯 Test Objective
Verify that changing RFP context via the footer dropdown:
1. Filters artifacts to show only those associated with the selected RFP
2. Sends an auto-prompt notification to the active agent
3. Agent responds with helpful session management suggestions

## 🛠️ Prerequisites
- Development server running on http://localhost:3100
- Browser MCP connection active
- User authenticated (test account: mskiba@esphere.com / thisisatest)
- At least 2 RFPs created with different artifacts

## 📋 Test Scenarios

### Scenario 1: Create First RFP with Artifacts
**Steps:**
1. Navigate to http://localhost:3100
2. Login with test credentials
3. Create new session with RFP Design agent
4. Ask agent to create "LED Bulb Procurement RFP"
5. Verify RFP is created and shown in footer dropdown
6. Ask agent to create a vendor response form for this RFP
7. Verify form artifact appears in artifact window
8. Note the artifact ID/name for later verification

**Expected Results:**
- ✅ RFP appears in footer dropdown as "LED Bulb Procurement RFP"
- ✅ Form artifact visible in artifact window
- ✅ Footer shows current RFP name
- ✅ Artifact has green border (indicating RFP association)

### Scenario 2: Create Second RFP with Different Artifacts
**Steps:**
1. Create new session or continue in same session
2. Ask agent to create "Office Furniture RFP"
3. Verify second RFP is created and shown in footer
4. Ask agent to create a buyer questionnaire for office furniture
5. Verify questionnaire artifact appears
6. Note this artifact ID/name

**Expected Results:**
- ✅ Second RFP appears in footer dropdown as "Office Furniture RFP"
- ✅ Questionnaire artifact visible in artifact window
- ✅ Footer shows "Office Furniture RFP" as current
- ✅ Both RFPs available in dropdown

### Scenario 3: Test RFP Context Switching (No Messages)
**Steps:**
1. Create a new empty session
2. Use footer dropdown to select "LED Bulb Procurement RFP"
3. Check artifact window for filtered artifacts
4. Check chat for agent notification message

**Expected Results:**
- ✅ Artifact window shows ONLY LED Bulb artifacts (vendor response form)
- ✅ System message appears in chat with RFP context change notification
- ✅ Message includes: "RFP context set to 'LED Bulb Procurement RFP'"
- ✅ Agent response is brief (for empty session)
- ✅ No Office Furniture artifacts visible

### Scenario 4: Test RFP Context Switching (Active Session)
**Steps:**
1. In current session, send a message to agent ("Hi, can you help me?")
2. Wait for agent response
3. Use footer dropdown to switch to "Office Furniture RFP"
4. Check artifact window contents
5. Check agent notification and response

**Expected Results:**
- ✅ Artifact window shows ONLY Office Furniture artifacts (questionnaire)
- ✅ System notification appears: "RFP context changed from 'LED Bulb...' to 'Office Furniture...'"
- ✅ Notification includes RFP details and session status
- ✅ Agent offers 3 options:
   - Continue in current session
   - Switch to last session with this RFP
   - Create new session
- ✅ No LED Bulb artifacts visible
- ✅ Response is helpful and professional

### Scenario 5: Switch Back to First RFP
**Steps:**
1. Continue in same session
2. Use footer dropdown to switch back to "LED Bulb Procurement RFP"
3. Verify artifact filtering reverses
4. Check agent notification

**Expected Results:**
- ✅ Artifact window shows LED Bulb artifacts again
- ✅ Office Furniture artifacts are hidden
- ✅ Agent acknowledges the context switch
- ✅ Footer shows "LED Bulb Procurement RFP"

### Scenario 6: Test with Solutions Agent
**Steps:**
1. Switch to Solutions agent
2. Use footer dropdown to change RFP context
3. Check agent response

**Expected Results:**
- ✅ Solutions agent acknowledges RFP change
- ✅ Offers to switch to RFP Design agent for detailed work
- ✅ Response is brief and appropriate for Solutions agent role

## 🔍 Key Elements to Verify

### Artifact Window Behavior:
- [ ] Only artifacts linked to current RFP are visible
- [ ] Artifact count updates correctly
- [ ] Switching back and forth works consistently
- [ ] Claude-generated artifacts remain visible (if not RFP-specific)

### Agent Notification Content:
- [ ] System message clearly indicates RFP context change
- [ ] Previous RFP name mentioned (if applicable)
- [ ] New RFP name and details shown
- [ ] Session status correctly identified (active vs empty)
- [ ] Three workflow options presented (for active sessions)

### Agent Response Quality:
- [ ] Natural, professional language
- [ ] No technical jargon or code shown to user
- [ ] Helpful suggestions appropriate to context
- [ ] Brief for empty sessions, detailed for active sessions
- [ ] Matches agent role (RFP Design vs Solutions)

### UI/UX:
- [ ] Footer dropdown shows all available RFPs
- [ ] Current RFP highlighted in dropdown
- [ ] RFP name displays correctly in footer
- [ ] No visual glitches or delays
- [ ] Smooth transition between RFPs

## 🐛 Edge Cases to Test

### Edge Case 1: Same RFP Selection
**Steps:**
1. Select RFP "A" from dropdown
2. Immediately select RFP "A" again
**Expected:** No notification sent (no change occurred)

### Edge Case 2: Rapid Switching
**Steps:**
1. Quickly switch between multiple RFPs
**Expected:** Each switch triggers appropriate notification without crashes

### Edge Case 3: No RFP Selected
**Steps:**
1. Create session without RFP context
2. Verify artifacts window shows only Claude-generated artifacts
**Expected:** No RFP-specific filtering applied

### Edge Case 4: Anonymous User
**Steps:**
1. Test as anonymous user (if applicable)
2. Switch RFP contexts
**Expected:** Feature works with public RFPs (per RLS policies)

## 📸 Screenshots to Capture

1. **Initial State**: Two RFPs created, artifacts visible
2. **RFP Switch**: Footer dropdown showing RFP selection
3. **System Message**: Agent notification in chat
4. **Agent Response**: Agent's helpful suggestions
5. **Artifact Filtering**: Before/after artifact window state
6. **Different Agent**: Solutions agent response to RFP change

## 🎬 Test Execution Script

### Manual Browser Testing:
```javascript
// Navigate to app
// Login
// Create RFP 1
"Please create an RFP for LED bulb procurement"
"Create a vendor response form for this RFP"

// Create RFP 2  
"Please create an RFP for office furniture"
"Create a buyer questionnaire for office furniture requirements"

// Test switching
// Use footer dropdown to switch between RFPs
// Observe artifact window changes
// Read agent notifications
```

### Automated MCP Browser Testing:
```javascript
// See: nail-procurement/real-browser-mcp-test.js
// Adapt for RFP switching scenario
```

## ✅ Success Criteria

### Must Have:
- ✅ Artifact window filters by RFP correctly
- ✅ Agent receives notification on RFP change
- ✅ Agent responds with helpful suggestions
- ✅ No errors in console
- ✅ Database correctly links artifacts to RFPs

### Nice to Have:
- ✅ Smooth animations/transitions
- ✅ Artifact count badge updates
- ✅ Session title updates with RFP name
- ✅ Performance is acceptable (<500ms)

## 🚨 Failure Conditions

### Critical Failures:
- ❌ Artifacts not filtering by RFP
- ❌ Agent notification not appearing
- ❌ Application crashes on RFP switch
- ❌ Wrong artifacts shown after switch

### Minor Issues:
- ⚠️ Agent response not ideal
- ⚠️ Visual glitches
- ⚠️ Slow performance (>1s)
- ⚠️ Console warnings

## 📊 Test Results Log

### Test Run: [Date/Time]
**Tester:** [Name]
**Environment:** Local Development

| Scenario | Status | Notes |
|----------|--------|-------|
| Create RFP 1 | ⏳ | |
| Create RFP 2 | ⏳ | |
| Switch (Empty) | ⏳ | |
| Switch (Active) | ⏳ | |
| Switch Back | ⏳ | |
| Solutions Agent | ⏳ | |

**Overall Result:** ⏳ Pending

**Issues Found:**
- [List any issues discovered]

**Recommendations:**
- [List any suggested improvements]


# Manual RFP Context Switching Test Guide

## Prerequisites
- ✅ Development server running on http://localhost:3100
- ✅ Local Supabase running (supabase start)
- ✅ User logged in: mskiba@esphere.com / thisisatest

## Test Scenario 1: RFP Switch with Artifacts (Fresh Session)

### Setup:
1. **Navigate to http://localhost:3100**
2. **Login** if not already logged in
3. **Click "New Session"** button (data-testid="new-session-button")

### Test Steps:

#### Part A: Create First RFP with Artifacts
1. **Send message**: "Create a new RFP for LED bulb procurement for city streetlights. Make it comprehensive."
2. **Wait for response** - Agent should create RFP and artifacts
3. **Verify in footer**: Should show "Current RFP: LED Bulb Procurement" (or similar)
4. **Check artifacts window**: Should show artifacts related to LED RFP

#### Part B: Create Second RFP with Artifacts  
5. **Send message**: "Create another RFP for office furniture procurement - desks and chairs"
6. **Wait for response** - Agent should create second RFP
7. **Verify in footer**: Should now show "Current RFP: Office Furniture Procurement"
8. **Check artifacts window**: Should show artifacts for Office Furniture RFP only (LED artifacts hidden)

#### Part C: Switch Back to First RFP
9. **Click footer dropdown** (data-testid="current-rfp-display" area)
10. **Select "LED Bulb Procurement"** from list
11. **Verify system notification appears**:
    ```
    🔄 RFP Context Changed
    
    Previous RFP: Office Furniture Procurement
    Current RFP: LED Bulb Procurement
    
    You have messages in this session. Would you like to:
    - Switch to the last session for "LED Bulb Procurement"
    - Create a new session focused on this RFP
    - Continue in this session with the new context
    ```
12. **Verify artifacts window**: Should now show only LED artifacts again

#### Part D: Agent Response Validation
13. **Wait for agent response** - Should acknowledge RFP switch and offer options
14. **Example expected response**:
    > "I see you've switched back to the LED Bulb Procurement RFP. Since we're already working on the Office Furniture RFP in this session, would you like me to:
    > 
    > 1. **Switch to your last session** with the LED Bulb RFP to continue where you left off
    > 2. **Create a new session** focused specifically on LED procurement
    > 3. **Continue here** and work on the LED RFP in this session"

### Success Criteria:
- ✅ System notification appears in chat
- ✅ Artifact window filters correctly on RFP switch
- ✅ Agent acknowledges the switch
- ✅ Agent offers appropriate session management options
- ✅ No console errors
- ✅ Footer shows correct current RFP at all times

---

## Test Scenario 2: RFP Switch in Empty Session

### Setup:
1. **Click "New Session"** to start fresh
2. **Manually set RFP** from footer dropdown (don't create via message)

### Test Steps:
1. **Click footer dropdown**
2. **Select "LED Bulb Procurement"** (from previously created RFPs)
3. **Verify**: Should see "Current RFP: LED Bulb Procurement" in footer
4. **Verify**: Artifact window should show LED artifacts
5. **Verify**: NO system notification should appear (empty session = no notification)
6. **Switch to different RFP** via footer dropdown
7. **Verify**: Still no notification (session still empty)

### Success Criteria:
- ✅ RFP switches correctly in footer
- ✅ Artifacts filter correctly
- ✅ No notification in empty session
- ✅ No errors in console

---

## Test Scenario 3: Multiple RFP Switches in Active Session

### Setup:
1. **New session** with agent messages already sent

### Test Steps:
1. **Send initial message**: "Help me with RFP creation"
2. **Agent responds** (session now has messages)
3. **Switch RFP via footer dropdown** → Notification appears
4. **Immediately switch to another RFP** → Another notification
5. **Verify**: Each switch triggers new notification
6. **Verify**: Agent responds to each notification appropriately

### Success Criteria:
- ✅ Multiple notifications appear correctly
- ✅ Agent handles rapid context changes
- ✅ Artifacts update on each switch
- ✅ No UI lag or freezing

---

## Edge Cases to Test

### Edge Case 1: Switching to Same RFP
1. **Current RFP**: "LED Bulb Procurement"
2. **Click dropdown and select**: "LED Bulb Procurement" again
3. **Expected**: No notification (same RFP, no change)

### Edge Case 2: Clearing RFP Context
1. **Current RFP**: "LED Bulb Procurement"
2. **Click dropdown and select**: "(None)" or clear option
3. **Expected**: System notification about clearing context

### Edge Case 3: Deleting Current RFP
1. **Current RFP**: "LED Bulb Procurement"
2. **Delete the RFP** via RFP management menu
3. **Expected**: Footer clears, artifacts disappear, notification about deleted RFP

---

## Console Checks

### Open Browser DevTools (F12) and monitor:
- **Errors**: Should be zero related to RFP switching
- **Warnings**: Expected Ionic/Stencil warnings are OK
- **Network**: Check for DatabaseService calls on RFP switch
- **State Updates**: Verify React state updates cleanly

### Key Console Messages to Look For:
```javascript
// Expected (in development mode):
[useRFPManagement] Current RFP changed: {...}
[DatabaseService] Fetching artifacts for RFP: <id>

// Errors to watch for:
// ❌ "Cannot read property 'id' of null"
// ❌ "RFP not found"  
// ❌ "Failed to fetch artifacts"
```

---

## Database Verification Queries

### Run in Supabase Studio (http://127.0.0.1:54323):

```sql
-- Check RFPs created during test
SELECT id, title, status, created_at 
FROM rfps 
ORDER BY created_at DESC LIMIT 5;

-- Check artifacts associated with RFPs
SELECT 
  a.id, 
  a.name, 
  a.type, 
  r.rfp_id, 
  rfp.title as rfp_title
FROM artifacts a
LEFT JOIN rfp_artifacts r ON a.id = r.artifact_id
LEFT JOIN rfps rfp ON r.rfp_id = rfp.id
ORDER BY a.created_at DESC LIMIT 10;

-- Check system messages created for notifications
SELECT 
  id, 
  content, 
  role, 
  metadata
FROM messages 
WHERE metadata->>'isSystemNotification' = 'true'
ORDER BY created_at DESC LIMIT 5;
```

---

## Test Results Template

```markdown
# RFP Context Switching Test Results
**Date**: [Date]
**Tester**: [Name]
**Environment**: Local Development

## Scenario 1: RFP Switch with Artifacts
- [ ] RFP created successfully
- [ ] Artifacts filtered correctly
- [ ] System notification appeared
- [ ] Agent responded appropriately
- [ ] No console errors
- **Notes**: 

## Scenario 2: Empty Session
- [ ] No notification in empty session
- [ ] RFP switched correctly
- [ ] Artifacts updated
- **Notes**:

## Scenario 3: Multiple Switches
- [ ] Multiple notifications handled
- [ ] Agent responses appropriate
- [ ] UI remained responsive
- **Notes**:

## Edge Cases
- [ ] Same RFP switch handled
- [ ] RFP clearing handled
- [ ] Deleted RFP handled
- **Notes**:

## Overall Assessment
- **Status**: [Pass/Fail/Partial]
- **Critical Issues**: 
- **Minor Issues**:
- **Recommendations**:
```

---

## Quick Test Commands

### Terminal Commands for Setup:
```bash
# Check dev server running
curl http://localhost:3100

# Check Supabase running
supabase status

# View real-time logs
supabase functions logs claude-api-v3 --follow
```

### Browser Console Quick Test:
```javascript
// Check if current RFP is set
window.__RFPEZ_DEBUG = true;

// Watch state changes
console.log('Current RFP:', localStorage.getItem('currentRfpId'));
```

---

## Troubleshooting

### Issue: Footer not updating
**Solution**: Check useRFPManagement hook is receiving callback

### Issue: Artifacts not filtering  
**Solution**: Verify rfp_artifacts junction table has correct associations

### Issue: No system notification
**Solution**: Check hasMessagesInCurrentSession is true in Home.tsx

### Issue: Agent not responding to notification
**Solution**: Verify agent instructions were deployed via migration

---

## Next Steps After Manual Testing

Once manual testing passes:
1. ✅ Document any issues found
2. ✅ Create automated MCP browser tests
3. ✅ Deploy to remote environment
4. ✅ Test with real users

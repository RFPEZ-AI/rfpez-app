# Vendor Selection Artifact - Manual Test Plan

**Date Created:** November 2, 2025  
**Feature:** Vendor Selection Artifact with Auto-Save  
**Status:** Ready for Testing

## Test Environment Setup

### Prerequisites
✅ Local Supabase running on port 54121  
✅ React Dev Server running on port 3100  
✅ Database migration applied (vendor_selection type added)  
✅ Edge functions deployed (claude-api-v3)

### Quick Start
```bash
# Ensure everything is running:
supabase status
# Dev server should be running via VS Code task "Start Development Server"
```

## Test Scenarios

### Test 1: Create Vendor Selection Artifact

**Objective:** Verify Sourcing agent can create vendor selection artifact via manage_vendor_selection tool

**Steps:**
1. Navigate to http://localhost:3100
2. Login with test account (mskiba@esphere.com / thisisatest)
3. Click "New Session" button (`[data-testid="new-session-button"]`)
4. In message input, type: "Create a new RFP for office supplies"
5. Press Enter to submit
6. Wait for RFP to be created
7. Switch to Sourcing agent (or let system recommend it)
8. Type: "Find vendors for office supplies and create a vendor selection"
9. Wait for agent to:
   - Use Perplexity to discover vendors
   - Call `manage_vendor_selection` with `operation: "create"`
   - Display vendor selection artifact in UI

**Expected Results:**
- ✅ Vendor selection artifact created in artifacts table
- ✅ Artifact type is 'vendor_selection'
- ✅ Artifact role is 'vendor_selection_form'
- ✅ Artifact appears in artifact window with checkboxes
- ✅ Vendor list displays with metadata (email, phone, contact)
- ✅ Selection count shows "0 of X selected (0%)"
- ✅ "Auto-Save Enabled" badge visible

**Database Verification:**
```sql
-- Check artifact was created
SELECT id, name, type, artifact_role, 
       jsonb_array_length(schema->'vendors') as vendor_count
FROM artifacts 
WHERE type = 'vendor_selection'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 2: Toggle Vendor Selection (Auto-Save)

**Objective:** Verify checkbox toggles automatically save selections

**Steps:**
1. With vendor selection artifact visible, click checkbox next to first vendor
2. Observe UI feedback (checkbox should check immediately)
3. Click checkbox again to uncheck
4. Check 2-3 different vendors
5. Refresh the page
6. Verify selections persisted

**Expected Results:**
- ✅ Checkbox responds immediately to clicks
- ✅ Selection count updates: "3 of X selected (Y%)"
- ✅ Selected vendors show "Selected: [timestamp]" under their info
- ✅ Selections persist after page refresh
- ✅ Console shows: "Vendor selection changed: { vendorId: 'vendor-1', selected: true }"

**Database Verification:**
```sql
-- Check vendor selections in schema
SELECT name, 
       (schema->'vendors')::jsonb as vendors,
       schema->'lastModified' as last_modified
FROM artifacts 
WHERE type = 'vendor_selection'
ORDER BY created_at DESC LIMIT 1;

-- Count selected vendors
SELECT name,
       (SELECT COUNT(*) 
        FROM jsonb_array_elements(schema->'vendors') v
        WHERE (v->>'selected')::boolean = true) as selected_count,
       jsonb_array_length(schema->'vendors') as total_count
FROM artifacts 
WHERE type = 'vendor_selection';
```

---

### Test 3: Query Current Selection State

**Objective:** Verify agent can read current selections without form submission

**Steps:**
1. With some vendors selected (from Test 2)
2. In message input, type: "Which vendors are currently selected?"
3. Agent should call `manage_vendor_selection` with `operation: "read"`
4. Agent responds with list of selected vendors

**Expected Results:**
- ✅ Agent correctly lists selected vendor names
- ✅ Agent shows selection count and percentage
- ✅ No form submission required
- ✅ Real-time data retrieved from database

**Tool Call Verification (Console):**
```javascript
// Should see in edge function logs:
{
  "tool": "manage_vendor_selection",
  "operation": "read",
  "rfp_id": 123
}
```

---

### Test 4: One-Per-RFP Constraint

**Objective:** Verify system prevents duplicate vendor selection artifacts per RFP

**Steps:**
1. With existing vendor selection for current RFP
2. Ask agent: "Create another vendor selection with different vendors"
3. Agent should call `manage_vendor_selection` with `operation: "create"`
4. System should return error about existing artifact

**Expected Results:**
- ✅ Error message returned from backend
- ✅ Agent explains to user that vendor selection already exists
- ✅ Agent suggests using add_vendors operation instead
- ✅ No duplicate artifact created

**Database Verification:**
```sql
-- Should only be ONE vendor_selection per RFP
SELECT rfp_id, COUNT(*) as artifact_count
FROM artifacts a
JOIN rfp_artifacts ra ON ra.artifact_id = a.id
WHERE a.type = 'vendor_selection'
GROUP BY rfp_id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

---

### Test 5: Add Vendors Operation

**Objective:** Verify adding new vendors to existing selection

**Steps:**
1. With existing vendor selection
2. Type: "Add two more vendors: 'Staples Inc' and 'Office Depot'"
3. Agent should call `manage_vendor_selection` with `operation: "add_vendors"`
4. UI should update with new vendors added to list

**Expected Results:**
- ✅ New vendors appear in list
- ✅ Existing selections preserved
- ✅ New vendors have `selected: false` by default
- ✅ Vendor count increases
- ✅ No duplicate vendors by ID

**Database Verification:**
```sql
-- Verify vendor count increased
SELECT name,
       jsonb_array_length(schema->'vendors') as vendor_count,
       (schema->'vendors')::jsonb as vendors
FROM artifacts 
WHERE type = 'vendor_selection'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 6: Remove Vendors Operation

**Objective:** Verify removing vendors from selection

**Steps:**
1. With existing vendor selection (6+ vendors)
2. Type: "Remove the last two vendors from the list"
3. Agent should call `manage_vendor_selection` with `operation: "remove_vendors"`
4. UI should update with vendors removed

**Expected Results:**
- ✅ Specified vendors removed from list
- ✅ Remaining selections preserved
- ✅ Vendor count decreases
- ✅ UI refreshes automatically

**Database Verification:**
```sql
-- Verify vendors were removed
SELECT name,
       jsonb_array_length(schema->'vendors') as vendor_count
FROM artifacts 
WHERE type = 'vendor_selection'
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 7: Integration with Email Invitations

**Objective:** Verify complete workflow: select vendors → send invitations

**Steps:**
1. With vendor selection artifact and 3 vendors selected
2. Type: "Send RFP invitations to the selected vendors"
3. Agent should:
   - Call `manage_vendor_selection` with `operation: "read"`
   - Extract selected vendors
   - Call `send_email` for each selected vendor
4. Confirm emails sent

**Expected Results:**
- ✅ Agent queries current selections first
- ✅ Agent confirms: "Ready to send invitations to 3 vendors"
- ✅ Emails sent to each selected vendor
- ✅ Agent confirms completion with vendor names
- ✅ Email dev mode routing handled automatically (if enabled)

**Email Verification:**
Check Mailpit at http://127.0.0.1:54124 for sent emails

---

### Test 8: UI Component Rendering

**Objective:** Verify VendorSelectionRenderer displays correctly

**Steps:**
1. Open artifact window with vendor selection
2. Inspect UI elements

**Expected UI Elements:**
- ✅ Card header with "Vendor Selection" title and people icon
- ✅ Selection statistics badge: "X of Y selected (Z%)"
- ✅ Last modified timestamp
- ✅ "Auto-Save Enabled" badge
- ✅ Vendor list with checkboxes
- ✅ Vendor metadata (email, phone, contact) displayed
- ✅ Selected vendors show green checkmark and selection timestamp
- ✅ Empty state message if no vendors

**CSS/Styling:**
- ✅ Checkboxes aligned on left
- ✅ Vendor info properly formatted
- ✅ Responsive layout (portrait/landscape)
- ✅ Proper spacing and readability

---

## Regression Tests

### Test 9: Verify Other Artifact Types Unaffected

**Objective:** Ensure vendor_selection doesn't break existing artifact types

**Steps:**
1. Create form artifact (buyer questionnaire)
2. Create document artifact (RFP request)
3. Verify both render correctly
4. Create vendor selection
5. Verify all three types coexist

**Expected Results:**
- ✅ Form artifacts render with ArtifactFormRenderer
- ✅ Document artifacts render with ArtifactTextRenderer
- ✅ Vendor selection renders with ArtifactVendorSelectionRenderer
- ✅ Artifact dropdown shows all types
- ✅ Type detection works correctly for each

---

### Test 10: Agent Switching with Vendor Selection

**Objective:** Verify vendor selection works across agent switches

**Steps:**
1. Create vendor selection with Sourcing agent
2. Switch to Support agent
3. Switch back to Sourcing agent
4. Verify vendor selection still accessible and functional

**Expected Results:**
- ✅ Vendor selection persists across agent switches
- ✅ RFP context maintained
- ✅ Selections preserved
- ✅ Auto-save continues to work

---

## Performance Tests

### Test 11: Large Vendor Lists

**Objective:** Test performance with many vendors

**Steps:**
1. Create vendor selection with 50+ vendors
2. Toggle selections
3. Scroll through list
4. Query state

**Expected Results:**
- ✅ UI remains responsive
- ✅ Checkbox interactions fast (<100ms)
- ✅ Scroll smooth
- ✅ Database queries efficient (<500ms)

---

## Error Handling Tests

### Test 12: Invalid Operations

**Objective:** Verify proper error handling

**Test Cases:**
1. Try to create vendor selection without RFP → Error: "No current RFP"
2. Try to toggle non-existent vendor ID → Error: "Vendor not found"
3. Try to add duplicate vendor → Silently ignored (by design)
4. Try to read non-existent selection → Error: "No vendor selection found"

**Expected Results:**
- ✅ Appropriate error messages
- ✅ No data corruption
- ✅ Agent explains errors in user-friendly language
- ✅ Recovery suggestions provided

---

## Acceptance Criteria Summary

**Must Pass All:**
- [ ] Vendor selection artifact created successfully
- [ ] Checkbox toggles work with auto-save
- [ ] Real-time queries return current state
- [ ] One-per-RFP constraint enforced
- [ ] Add/remove vendor operations work
- [ ] Integration with email invitations works
- [ ] UI renders correctly with all elements
- [ ] No regressions in other artifact types
- [ ] Agent instructions followed correctly
- [ ] Error handling is user-friendly

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Remove test vendor selections
DELETE FROM rfp_artifacts 
WHERE artifact_id IN (
  SELECT id FROM artifacts WHERE type = 'vendor_selection'
);

DELETE FROM artifacts WHERE type = 'vendor_selection';

-- Verify cleanup
SELECT COUNT(*) FROM artifacts WHERE type = 'vendor_selection';
-- Should return 0
```

---

## Notes for Testers

**Key Features to Validate:**
1. **Auto-Save** - No submit button needed, selections save immediately
2. **Real-Time Queries** - Agent can check selections anytime via `operation: "read"`
3. **One Per RFP** - System prevents duplicates, use add/remove instead
4. **Rich Metadata** - Vendor contact info displayed in UI

**Common Issues to Watch For:**
- ❌ Checkbox not updating immediately (auto-save delay)
- ❌ Selections not persisting after refresh
- ❌ Multiple vendor_selection artifacts for same RFP
- ❌ Agent showing technical tool names to user
- ❌ UI component not rendering (missing import)

**Browser Console Monitoring:**
Watch for these logs during testing:
```javascript
"Vendor selection changed: { vendorId: '...', selected: true }"
"🚀 EXECUTING MANAGE_VENDOR_SELECTION TOOL!"
"✅ Auto-injected current RFP ID: 123"
"🎯 MANAGE_VENDOR_SELECTION RESULT: ..."
```

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Results - [Date]

**Tester:** [Name]  
**Environment:** Local Development  
**Branch:** master  

### Test 1: Create Vendor Selection
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

### Test 2: Toggle Vendor Selection
- Status: ✅ Pass / ❌ Fail  
- Notes: [Any observations]

[Continue for all tests...]

### Overall Status: ✅ Ready for Production / ❌ Needs Fixes

**Issues Found:**
1. [Description]
2. [Description]

**Recommendations:**
- [Suggestion 1]
- [Suggestion 2]
```

---

## Automated Test Script (Future)

Once Chrome MCP tools are fully available, use this script:

```javascript
// test-vendor-selection.js
// Run with: chrome MCP server active

async function testVendorSelection() {
  // Navigate and login
  await chrome_navigate({ url: 'http://localhost:3100' });
  await chrome_click_element({ selector: '[data-testid="login-button"]' });
  // ... complete test automation
}
```

---

**End of Test Plan**

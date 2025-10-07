# RFP-Artifact Integration Test Plan
**Date**: October 7, 2025  
**Purpose**: Validate RFP-centric artifact management functionality  
**Testing Method**: MCP Browser Automation  

## 🎯 **Test Objectives**

Validate that the system correctly implements:
1. **RFP-associated artifact loading** from `rfp_artifacts` junction table
2. **Session-specific RFP context** preservation and switching
3. **Interactive RFP dropdown** functionality in footer
4. **Session naming** reflects current RFP context
5. **Artifact window** displays RFP-specific artifacts
6. **Cross-session RFP context** switching works correctly

## 🏗️ **Test Environment Setup**

### Prerequisites
```bash
# Ensure all services are running
✅ React Dev Server (port 3100) - Use VS Code task "Start Development Server"
✅ Supabase Local Stack - Use "supabase start"
✅ Authentication: mskiba@esphere.com / thisisatest
```

### MCP Browser Tool Activation
```javascript
// Required MCP tool activations
await activate_mcp_browser_navigation_tools();
await activate_mcp_browser_interaction_tools();
await activate_mcp_browser_visual_tools();
await activate_mcp_browser_script_tools();
```

## 📋 **Test Suite 1: RFP Dropdown Functionality**

### **Test 1.1: Footer RFP Dropdown Display**
```javascript
// Navigate and authenticate
await mcp_browser_navigate({ url: 'http://localhost:3100' });
await mcp_browser_screenshot({ name: 'homepage-initial' });

// Login sequence
const elements = await mcp_browser_get_clickable_elements();
await mcp_browser_click({ index: 2 }); // Login button
await mcp_browser_form_input_fill({ index: 3, value: 'mskiba@esphere.com' });
await mcp_browser_form_input_fill({ index: 5, value: 'thisisatest' });
await mcp_browser_click({ index: 6 }); // Sign In
await mcp_browser_screenshot({ name: 'logged-in' });

// Verify footer RFP dropdown exists
const footerElements = await mcp_browser_get_clickable_elements();
// Look for data-testid="current-rfp-dropdown"
```

**✅ Expected Results:**
- Footer displays "Current RFP:" label
- Dropdown shows available RFPs for the account
- Dropdown is interactive and clickable
- When no RFP selected, shows placeholder "Select RFP..."

### **Test 1.2: RFP Selection from Dropdown**
```javascript
// Click RFP dropdown
await mcp_browser_click({ selector: '[data-testid="current-rfp-dropdown"]' });
await mcp_browser_screenshot({ name: 'rfp-dropdown-open' });

// Select an RFP (assume first option)
await mcp_browser_click({ index: 1 }); // First RFP option
await mcp_browser_screenshot({ name: 'rfp-selected' });

// Verify RFP context updated
// Check if dropdown now shows selected RFP
// Check if artifact window updates
```

**✅ Expected Results:**
- Dropdown opens showing list of available RFPs
- RFP selection updates dropdown display
- Current session context updates to selected RFP
- Artifact window refreshes with RFP-associated artifacts

## 📋 **Test Suite 2: Session-RFP Context Integration**

### **Test 2.1: New Session Creation with RFP Context**
```javascript
// With RFP selected from previous test
// Create new session
await mcp_browser_click({ selector: '[data-testid="new-session-button"]' });
await mcp_browser_screenshot({ name: 'new-session-with-rfp' });

// Send a message to establish session
await mcp_browser_form_input_fill({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a supplier evaluation form for LED lighting procurement' 
});
await mcp_browser_press_key({ key: 'Enter' });
await mcp_browser_screenshot({ name: 'message-sent-new-session' });

// Wait for response and artifacts
await new Promise(resolve => setTimeout(resolve, 5000));
await mcp_browser_screenshot({ name: 'artifacts-loaded-new-session' });
```

**✅ Expected Results:**
- New session inherits current RFP context
- Session name/title reflects RFP association (check session list)
- Artifacts created are associated with the current RFP
- Footer still shows selected RFP

### **Test 2.2: Session Switching Preserves RFP Context**
```javascript
// First, create a second session with different RFP context
// Select different RFP from dropdown
await mcp_browser_click({ selector: '[data-testid="current-rfp-dropdown"]' });
await mcp_browser_click({ index: 2 }); // Second RFP option
await mcp_browser_screenshot({ name: 'second-rfp-selection' });

// Create another session
await mcp_browser_click({ selector: '[data-testid="new-session-button"]' });
await mcp_browser_form_input_fill({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create office supplies procurement form' 
});
await mcp_browser_press_key({ key: 'Enter' });
await mcp_browser_screenshot({ name: 'second-session-created' });

// Now switch back to first session
// Click on session history to find first session
const sessionElements = await mcp_browser_get_clickable_elements();
// Look for session with LED lighting context
await mcp_browser_click({ index: /* first session index */ });
await mcp_browser_screenshot({ name: 'switched-to-first-session' });
```

**✅ Expected Results:**
- Switching to old session restores that session's RFP context
- Footer dropdown updates to show session's associated RFP
- Artifact window shows artifacts associated with session's RFP
- Session messages and context are properly restored

### **Test 2.3: Session Names Reflect RFP Context**
```javascript
// Check session list in sidebar
const sessionList = await mcp_browser_get_text();
console.log('Session list content:', sessionList);

// Take screenshot of session sidebar
await mcp_browser_screenshot({ name: 'session-list-with-rfp-context' });

// Verify session naming convention
// Sessions should show RFP association in names/descriptions
```

**✅ Expected Results:**
- Session names include RFP context information
- Session list clearly distinguishes between different RFP contexts
- Session descriptions or tooltips show RFP association

## 📋 **Test Suite 3: Artifact-RFP Association**

### **Test 3.1: RFP-Specific Artifact Loading**
```javascript
// With specific RFP selected, check artifact window
await mcp_browser_click({ selector: '[data-testid="artifact-window-toggle"]' });
await mcp_browser_screenshot({ name: 'artifact-window-rfp-specific' });

// Verify artifacts shown are RFP-associated
const artifactElements = await mcp_browser_get_clickable_elements();
// Look for artifacts with data-testid="artifact-item-*"

// Count artifacts and verify they're RFP-specific
console.log('Artifacts displayed for current RFP');
```

**✅ Expected Results:**
- Artifact window shows only artifacts associated with current RFP
- Artifacts from other RFPs are not displayed
- Claude-generated artifacts are preserved and shown
- Form artifacts specific to RFP are properly loaded

### **Test 3.2: Artifact Window Updates on RFP Change**
```javascript
// Take initial screenshot of artifacts
await mcp_browser_screenshot({ name: 'artifacts-before-rfp-change' });

// Change RFP via dropdown
await mcp_browser_click({ selector: '[data-testid="current-rfp-dropdown"]' });
await mcp_browser_click({ index: 3 }); // Third RFP option
await mcp_browser_screenshot({ name: 'rfp-changed-dropdown' });

// Wait for artifact refresh
await new Promise(resolve => setTimeout(resolve, 2000));
await mcp_browser_screenshot({ name: 'artifacts-after-rfp-change' });

// Compare artifact lists
```

**✅ Expected Results:**
- Artifact list changes when RFP is changed
- Different RFPs show different artifact sets
- Artifact window properly refreshes/reloads
- No artifacts are lost during RFP switching

## 📋 **Test Suite 4: Cross-Feature Integration**

### **Test 4.1: Agent Switching with RFP Context**
```javascript
// Select specific RFP and agent
await mcp_browser_click({ selector: '[data-testid="agent-selector"]' });
await mcp_browser_screenshot({ name: 'agent-selector-open' });

// Switch to different agent (e.g., Solutions to RFP Design)
await mcp_browser_click({ index: /* agent index */ });
await mcp_browser_screenshot({ name: 'agent-switched-with-rfp' });

// Verify RFP context is maintained
// Send message to new agent about current RFP
await mcp_browser_form_input_fill({ 
  selector: '[data-testid="message-input"]', 
  value: 'What artifacts are available for the current RFP?' 
});
await mcp_browser_press_key({ key: 'Enter' });
```

**✅ Expected Results:**
- Agent switching preserves RFP context
- New agent has access to RFP-specific information
- Artifacts remain RFP-associated after agent switch
- Agent responses reference correct RFP context

### **Test 4.2: Form Submission and RFP Association**
```javascript
// Click on a form artifact
await mcp_browser_click({ selector: '[data-testid="artifact-item-buyer-questionnaire"]' });
await mcp_browser_screenshot({ name: 'form-artifact-selected' });

// Fill out form fields
await mcp_browser_form_input_fill({ index: /* form field */, value: 'Test supplier data' });
await mcp_browser_click({ selector: '[data-testid="form-submit-button"]' });
await mcp_browser_screenshot({ name: 'form-submitted' });

// Verify submission is associated with correct RFP
```

**✅ Expected Results:**
- Form submissions are linked to current RFP
- Form data persists across sessions with same RFP
- Form submissions appear in correct RFP context
- Database properly stores RFP-form associations

## 🔍 **Critical Validation Points**

### **Database State Verification**
```javascript
// After each test, validate database state
// Check rfp_artifacts table for proper associations
// Verify session.current_rfp_id is updated correctly
// Confirm artifact submissions are RFP-linked
```

### **Error Handling Tests**
```javascript
// Test edge cases:
// 1. No RFPs available
// 2. RFP deleted while selected
// 3. Network errors during RFP switching
// 4. Invalid RFP IDs
// 5. Session without RFP context
```

## 📊 **Success Criteria Checklist**

- [ ] **Footer Dropdown**: Displays all user RFPs, allows selection
- [ ] **RFP Context Switch**: Selecting RFP updates current session context
- [ ] **Artifact Loading**: RFP change loads associated artifacts
- [ ] **Session Restoration**: Old sessions restore their RFP context
- [ ] **Session Naming**: Session names reflect RFP association
- [ ] **Cross-Session Consistency**: RFP context preserved across sessions
- [ ] **Agent Integration**: Agents work correctly with RFP context
- [ ] **Form Association**: Form submissions linked to correct RFP
- [ ] **Database Integrity**: All RFP-artifact associations stored correctly
- [ ] **Error Handling**: Graceful handling of edge cases

## 🚨 **Known Issues to Watch For**

1. **Timing Issues**: RFP context changes may take time to propagate
2. **Artifact Refresh**: Artifact window may not refresh immediately
3. **Session History**: Session names may not update dynamically
4. **Memory Leaks**: Multiple RFP switches could cause state issues
5. **Authentication**: RFP data requires proper user authentication

## 📝 **Test Execution Log Template**

```
Test: [Test Name]
Date: [Date/Time]
Environment: [Local/Remote]
RFPs Available: [Count and Names]
Session Count: [Before/After]

Steps Executed:
1. [Step description] - ✅/❌
2. [Step description] - ✅/❌
...

Results:
- Expected: [Description]
- Actual: [Description] 
- Status: PASS/FAIL
- Screenshots: [List]

Issues Found:
- [Issue description]
- [Severity: Low/Medium/High/Critical]

Notes:
- [Additional observations]
```

## 🔄 **Automated Test Script Template**

```javascript
// Complete automated test sequence
const runRFPArtifactIntegrationTest = async () => {
  console.log('🚀 Starting RFP-Artifact Integration Test');
  
  try {
    // Setup
    await setupTestEnvironment();
    
    // Test Suite 1: RFP Dropdown
    await testRFPDropdownFunctionality();
    
    // Test Suite 2: Session-RFP Context
    await testSessionRFPIntegration();
    
    // Test Suite 3: Artifact Association
    await testArtifactRFPAssociation();
    
    // Test Suite 4: Cross-Feature Integration
    await testCrossFeatureIntegration();
    
    console.log('✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mcp_browser_screenshot({ name: 'test-failure-state' });
  }
};
```

This comprehensive test plan ensures all aspects of the new RFP-centric artifact management system are thoroughly validated using MCP browser automation tools.
# RFP-Artifact Test Execution Checklist
**Quick Reference for Testing New RFP-Centric Features**

## 🚀 **Pre-Test Setup (5 minutes)**

### 1. Verify Services Running
```bash
# Check React Dev Server (should be running via VS Code task)
curl -s http://localhost:3100 > /dev/null && echo "✅ React Dev Server Running" || echo "❌ React Dev Server Not Running"

# Check Supabase Local Stack
supabase status

# If not running:
# Use VS Code Task: "Start Development Server" (Ctrl+Shift+P → Tasks: Run Task)
# Or: supabase start
```

### 2. Verify Test Data
- [ ] At least 2 RFPs exist in database for switching tests
- [ ] Test account credentials: `mskiba@esphere.com` / `thisisatest`
- [ ] Some existing sessions with different RFP contexts (optional)

### 3. Activate MCP Browser Tools
```javascript
await activate_mcp_browser_navigation_tools();
await activate_mcp_browser_interaction_tools();
await activate_mcp_browser_visual_tools();
await activate_mcp_browser_script_tools();
```

## 🎯 **Critical Test Points (10 minutes)**

### **Test 1: Footer RFP Dropdown** (2 min)
```javascript
// Navigate and login
await mcp_browser_navigate({ url: 'http://localhost:3100' });
// Look for RFP dropdown in footer - should be IonSelect component
// CRITICAL: Verify dropdown shows available RFPs, not static text
```
**✅ Expected**: Footer shows dropdown with RFP options  
**❌ Failure Signs**: Static "Current RFP: none" text, no dropdown

### **Test 2: RFP Selection Updates Context** (2 min)
```javascript
// Click RFP dropdown → Select different RFP
// CRITICAL: Verify session context updates, artifacts refresh
```
**✅ Expected**: Dropdown selection changes current RFP, artifacts update  
**❌ Failure Signs**: Selection doesn't stick, artifacts don't change

### **Test 3: New Session with RFP Context** (3 min)
```javascript
// Create new session → Send message about procurement
// CRITICAL: Check if RFP context is preserved in new session
```
**✅ Expected**: New session inherits current RFP, creates RFP-associated artifacts  
**❌ Failure Signs**: Session has no RFP context, artifacts not RFP-linked

### **Test 4: Session Switching Restores RFP Context** (3 min)
```javascript
// Switch between sessions with different RFP contexts
// CRITICAL: Verify footer dropdown updates to session's RFP
```
**✅ Expected**: Old session restores its RFP context, dropdown updates  
**❌ Failure Signs**: RFP context doesn't switch, dropdown shows wrong RFP

## 🔍 **Critical UI Elements to Verify**

### **HomeFooter.tsx Changes**
- [ ] **IonSelect Component**: Footer should have `<IonSelect>` not static text
- [ ] **Dropdown Options**: Shows actual RFPs from database
- [ ] **Selection Handler**: `onIonChange` updates session context
- [ ] **Loading State**: Shows loading while fetching RFPs

### **Artifact Window Changes**
- [ ] **RFP-Specific Loading**: Uses `loadRFPArtifacts()` function
- [ ] **Context Updates**: Artifacts refresh when RFP changes
- [ ] **Proper Association**: Shows only current RFP's artifacts
- [ ] **Claude Artifacts**: Preserves generated forms/content

### **Session Management**
- [ ] **Context Restoration**: `handleSelectSession` restores RFP context
- [ ] **Database Updates**: `updateSessionContext` called on RFP change
- [ ] **UI Consistency**: Footer dropdown reflects session's RFP

## ⚡ **Quick Manual Test (5 minutes)**

1. **Login** → Navigate to `http://localhost:3100`
2. **Check Footer** → Should see RFP dropdown (not static text)
3. **Select RFP** → Choose from dropdown, verify selection sticks
4. **Create Session** → New session button → Send message
5. **Check Artifacts** → Open artifact window, verify RFP-specific content
6. **Switch RFP** → Change dropdown selection, verify artifacts update
7. **Session History** → Click old session, verify RFP context restores

## 🐛 **Common Issues to Watch For**

### **UI Issues**
- Footer still shows static "Current RFP: none" text
- Dropdown appears but options don't load
- Selection doesn't visually update

### **Functional Issues**
- RFP selection doesn't update session context
- Artifacts don't refresh when RFP changes
- Session switching loses RFP context

### **Data Issues**
- No RFPs available in dropdown
- Database errors on context updates
- Artifact associations not working

## 📊 **Success Criteria**

- [ ] **Footer Dropdown Works**: Shows RFPs, allows selection
- [ ] **Context Updates**: RFP selection updates session
- [ ] **Artifact Loading**: Shows RFP-specific artifacts
- [ ] **Session Switching**: Restores correct RFP context
- [ ] **Database Integrity**: Proper RFP-session associations
- [ ] **No Console Errors**: Clean execution without errors

## 🎬 **Full MCP Test Execution**

```javascript
// Run complete automated test
await runRFPArtifactTest();

// Or execute specific test file
// Copy content from rfp-artifact-mcp-test.js and run
```

## 📝 **Test Results Template**

```
Date: [Date/Time]
Tester: [Name]
Environment: Local Development

RESULTS:
✅/❌ Footer RFP Dropdown: [Description]
✅/❌ RFP Selection: [Description]
✅/❌ Session Context: [Description]
✅/❌ Artifact Loading: [Description]
✅/❌ Session Switching: [Description]

ISSUES FOUND:
- [Issue 1]: [Severity]
- [Issue 2]: [Severity]

OVERALL STATUS: PASS/FAIL
READY FOR PRODUCTION: YES/NO
```

## 🎯 **Next Steps After Testing**

### If Tests Pass ✅
- Update failing unit tests (HomeFooter.test.tsx, HomeContent.test.tsx)  
- Document new functionality in user guide
- Consider deployment to remote environment

### If Tests Fail ❌
- Check browser console for JavaScript errors
- Verify database schema and RFP data
- Review implementation in useArtifactManagement.ts and HomeFooter.tsx
- Test individual components in isolation
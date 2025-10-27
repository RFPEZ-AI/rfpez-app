# Dev.rfpez.ai Deployment Test Guide
## Complete RFP Workflow Test with Chrome MCP Browser

**Test Date:** October 26, 2025
**Target:** https://dev.rfpez.ai
**Scenario:** Office Furniture Procurement

---

## Test Credentials
- **Email:** mskiba@esphere.com
- **Password:** thisisatest

---

## Test Scenario Details

### RFP Information
- **Name:** Office Furniture Procurement
- **Description:** Complete office furniture set for new 50-person office space

### Required Items
1. Executive desks (10 units)
2. Standard workstations (40 units)
3. Conference tables (3 units)
4. Office chairs - ergonomic (50 units)
5. Filing cabinets (15 units)

### Requirements
- BIFMA certified furniture
- Warranty minimum 5 years
- Delivery within 6 weeks
- Installation included

### Sample Supplier Bids

#### Supplier 1: Premier Office Solutions
- **Total Bid:** $125,000
- **Delivery:** 4 weeks
- **Warranty:** 7 years
- **Notes:** Includes white-glove installation and 2-year maintenance

#### Supplier 2: Corporate Workspace Inc
- **Total Bid:** $118,000
- **Delivery:** 5 weeks
- **Warranty:** 5 years
- **Notes:** Volume discount applied, standard installation included

#### Supplier 3: Modern Office Outfitters
- **Total Bid:** $135,000
- **Delivery:** 3 weeks
- **Warranty:** 10 years
- **Notes:** Premium furniture line, expedited delivery, extended warranty

---

## Chrome MCP Test Steps

### Phase 1: Login and Session Setup

```javascript
// Step 1: Navigate to dev.rfpez.ai
chrome_navigate({ 
  url: 'https://dev.rfpez.ai',
  width: 1920,
  height: 1080
});

// Step 2: Initial screenshot
chrome_screenshot({ 
  name: '01-homepage',
  fullPage: true 
});

// Step 3: Click login button
chrome_click_element({ 
  selector: '[data-testid="login-button"]' 
});

// Step 4: Fill email
chrome_fill_or_select({ 
  selector: 'input[type="email"]', 
  value: 'mskiba@esphere.com' 
});

// Step 5: Fill password
chrome_fill_or_select({ 
  selector: 'input[type="password"]', 
  value: 'thisisatest' 
});

// Step 6: Submit login
chrome_keyboard({ 
  keys: 'Enter', 
  selector: 'input[type="password"]' 
});

// Step 7: Wait and verify login
chrome_screenshot({ 
  name: '02-logged-in',
  fullPage: true 
});
```

### Phase 2: Create RFP

```javascript
// Step 8: Create new session
chrome_click_element({ 
  selector: '[data-testid="new-session-button"]' 
});

// Step 9: Screenshot new session
chrome_screenshot({ 
  name: '03-new-session' 
});

// Step 10: Request RFP creation
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP for Office Furniture Procurement. Complete office furniture set for new 50-person office space' 
});

// Step 11: Submit message
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 12: Wait for response (5 seconds)
// Manual wait

// Step 13: Screenshot RFP created
chrome_screenshot({ 
  name: '04-rfp-created',
  fullPage: true 
});
```

### Phase 3: Generate Technical Specifications

```javascript
// Step 14: Request specifications
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Generate detailed technical specifications including: Executive desks (10 units), Standard workstations (40 units), Conference tables (3 units), Office chairs - ergonomic (50 units), Filing cabinets (15 units). Requirements: BIFMA certified furniture, Warranty minimum 5 years, Delivery within 6 weeks, Installation included' 
});

// Step 15: Submit request
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 16: Wait for specifications (8 seconds)
// Manual wait

// Step 17: Screenshot specifications
chrome_screenshot({ 
  name: '05-specifications-generated',
  fullPage: true 
});
```

### Phase 4: Create Bid Form

```javascript
// Step 18: Request bid form
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a bid submission form for suppliers to respond to this RFP' 
});

// Step 19: Submit request
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 20: Wait for bid form (6 seconds)
// Manual wait

// Step 21: Screenshot bid form
chrome_screenshot({ 
  name: '06-bid-form-created',
  fullPage: true 
});
```

### Phase 5: Generate RFP Email

```javascript
// Step 22: Request RFP email
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Generate an RFP announcement email to send to potential suppliers' 
});

// Step 23: Submit request
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 24: Wait for email (5 seconds)
// Manual wait

// Step 25: Screenshot RFP email
chrome_screenshot({ 
  name: '07-rfp-email-generated',
  fullPage: true 
});
```

### Phase 6: Add Supplier Bids

```javascript
// Step 26: Add first supplier bid
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Record a bid from Premier Office Solutions: Total bid $125,000, Delivery: 4 weeks, Warranty: 7 years. Notes: Includes white-glove installation and 2-year maintenance' 
});

// Step 27: Submit bid
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 28: Wait (4 seconds)
// Manual wait

// Step 29: Screenshot first bid
chrome_screenshot({ 
  name: '08-first-bid-recorded',
  fullPage: true 
});

// Step 30: Add second supplier bid
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Record a bid from Corporate Workspace Inc: Total bid $118,000, Delivery: 5 weeks, Warranty: 5 years. Notes: Volume discount applied, standard installation included' 
});

// Step 31: Submit bid
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 32: Wait (4 seconds)
// Manual wait

// Step 33: Screenshot second bid
chrome_screenshot({ 
  name: '09-second-bid-recorded',
  fullPage: true 
});

// Step 34: Add third supplier bid
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Record a bid from Modern Office Outfitters: Total bid $135,000, Delivery: 3 weeks, Warranty: 10 years. Notes: Premium furniture line, expedited delivery, extended warranty' 
});

// Step 35: Submit bid
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 36: Wait (4 seconds)
// Manual wait

// Step 37: Screenshot third bid
chrome_screenshot({ 
  name: '10-third-bid-recorded',
  fullPage: true 
});
```

### Phase 7: Bid Comparison and Final State

```javascript
// Step 38: Request bid comparison
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a comparison table of all received bids with recommendations' 
});

// Step 39: Submit request
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Step 40: Wait for comparison (6 seconds)
// Manual wait

// Step 41: Screenshot comparison
chrome_screenshot({ 
  name: '11-bid-comparison',
  fullPage: true 
});

// Step 42: Final full page screenshot
chrome_screenshot({ 
  name: '12-final-state',
  fullPage: true 
});
```

---

## Validation Checklist

### ✅ RFP Creation
- [ ] RFP record created in database
- [ ] RFP name displayed: "Office Furniture Procurement"
- [ ] Current RFP context shown in footer

### ✅ Technical Specifications
- [ ] Specifications artifact generated
- [ ] All 5 item types included
- [ ] All 4 requirements included
- [ ] Properly formatted and displayed

### ✅ Bid Form
- [ ] Bid form artifact created
- [ ] Form fields appropriate for furniture procurement
- [ ] Validation rules present

### ✅ RFP Email
- [ ] Email artifact generated
- [ ] Professional formatting
- [ ] Includes key RFP details
- [ ] Contains submission instructions

### ✅ Supplier Bids
- [ ] All 3 bids recorded successfully
- [ ] Bid amounts captured correctly
- [ ] Delivery times and warranties stored
- [ ] Notes preserved

### ✅ Bid Comparison
- [ ] Comparison table generated
- [ ] All 3 suppliers included
- [ ] Key metrics compared
- [ ] Recommendation provided

### ✅ Overall System
- [ ] No console errors
- [ ] Agent switching works
- [ ] Artifact panel functional
- [ ] Message history preserved
- [ ] Database operations successful

---

## Expected Artifacts

1. **RFP Record** - Office Furniture Procurement
2. **Technical Specifications** - Detailed furniture specs
3. **Bid Form** - Supplier submission form
4. **RFP Email** - Announcement email template
5. **Bid Records** - 3 supplier bid entries
6. **Comparison Table** - Bid analysis and recommendations

---

## Success Criteria

✅ **All phases complete without errors**
✅ **All 6 artifact types generated**
✅ **All 3 supplier bids recorded**
✅ **UI responsive and functional**
✅ **Database operations successful**
✅ **Screenshots captured at each phase**

---

## Notes

- Take screenshots at each major step for documentation
- Monitor browser console for errors
- Verify database operations via Supabase Dashboard
- Check artifact panel for all generated artifacts
- Ensure RFP context persists throughout session

---

## Manual Execution Alternative

If Chrome MCP tools are unavailable, execute test manually following these steps:

1. Open https://dev.rfpez.ai in Chrome browser
2. Login with test credentials
3. Follow each phase step-by-step
4. Manually take screenshots at designated points
5. Verify each artifact is created correctly
6. Complete validation checklist
7. Document any issues or errors encountered

# RFPEZ.AI Acceptance Test Plan

## Overview
This test plan validates the end-to-end RFP creation workflow from initial user login through final artifact generation. The test covers multi-agent interaction, form generation, and supplier documentation creation.

## Prerequisites
- RFPEZ.AI development server running on `http://localhost:3000`
- Test user account credentials available
- MCP server connection active (supabase-remote)
- V3 Claude API edge function deployed

## Test Credentials
- **Email**: `mskiba@esphere.com`
- **Password**: `thisisatest`
- **Alternative**: Use Google OAuth login if available

## Test Scenario: Corporate Equipment Purchase RFP

### Test Case 1: Authentication and Session Setup

**Objective**: Verify user can authenticate and start a new session

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click "Login" or "Sign In" button
3. Enter test credentials or use Google OAuth
4. Verify successful authentication (user avatar/profile visible)
5. Start a new session by clicking "New Session" or similar button

**Expected Results**:
- User successfully logs in
- Dashboard/home page loads with user profile
- New session is created with default agent (typically Solutions Agent)

**Navigation Prompts for Claude**:
```javascript
// Navigate to login
await mcp_browser_navigate({ url: 'http://localhost:3000' });
await mcp_browser_click({ selector: '[data-testid="login-button"]' }); // or text "Login"

// Fill credentials
await mcp_browser_form_input_fill({ selector: 'input[type="email"]', value: 'mskiba@esphere.com' });
await mcp_browser_form_input_fill({ selector: 'input[type="password"]', value: 'thisisatest' });
await mcp_browser_click({ selector: 'button[type="submit"]' });

// Start new session
await mcp_browser_click({ selector: '[data-testid="new-session"]' }); // or text "New Session"
```

### Test Case 2: Agent Selection and RFP Designer Setup

**Objective**: Switch to RFP Designer Agent for specialized RFP creation

**Steps**:
1. Look for agent selector/switcher in the UI (typically top bar or sidebar)
2. Click on agent dropdown/selector
3. Select "RFP Designer" or "RFP Design" agent
4. Verify agent switch (UI should update to show new agent context)

**Expected Results**:
- Agent selector shows available agents
- Successfully switches to RFP Designer Agent
- Interface updates to reflect RFP-focused context
- Agent indicator shows "RFP Designer" as active

**Navigation Prompts for Claude**:
```javascript
// Find and click agent selector
await mcp_browser_click({ selector: '[data-testid="agent-selector"]' }); // or look for dropdown
await mcp_browser_click({ text: 'RFP Designer' }); // or similar agent name

// Verify agent switch
await mcp_browser_get_text(); // Look for "RFP Designer" in agent indicator
```

### Test Case 3: RFP Creation Request

**Objective**: Initiate RFP creation for a specific product/service

**Test RFP Scenarios** (choose one):

#### Scenario A: Office Equipment
**Product**: "High-quality LED desk lamps for open office environment"
**Details**: 50 units, adjustable brightness, USB charging ports, modern design

#### Scenario B: Professional Services  
**Service**: "Corporate IT training services for Microsoft Office 365"
**Details**: 25 employees, virtual delivery, certification included, 3-month program

#### Scenario C: Office Supplies
**Product**: "Ergonomic office chairs for corporate headquarters"
**Details**: 30 chairs, mesh back, adjustable height, 5-year warranty

**Steps**:
1. In the chat interface, enter RFP creation request
2. Wait for agent response asking for clarification
3. Provide additional details as requested
4. Continue conversation until agent understands requirements

**Sample Prompts**:
```
Initial Request: "I need to create an RFP for purchasing LED desk lamps for our office. We need about 50 high-quality adjustable lamps with USB charging ports."

Follow-up Details: "The lamps should have adjustable brightness levels, modern professional design, and be suitable for an open office environment. Budget is around $100-150 per lamp. We need them delivered within 6 weeks."

Requirements: "Must include warranty, bulk pricing, installation support if needed, and meet energy efficiency standards."
```

**Expected Results**:
- Agent acknowledges RFP request
- Agent asks relevant clarifying questions
- Conversation builds comprehensive understanding of requirements

### Test Case 4: Buyer Questionnaire Generation

**Objective**: Generate and complete the buyer requirements form

**Steps**:
1. Continue conversation until agent offers to create buyer questionnaire
2. Agent should present a form or link to form
3. Locate the generated buyer questionnaire form
4. Fill out the form with test data
5. Submit the completed form

**Sample Form Data**:
```json
{
  "company_name": "Acme Corporation",
  "contact_person": "Jane Smith",
  "email": "jane.smith@acme.com",
  "phone": "555-123-4567",
  "delivery_address": "123 Business Park Dr, Suite 100, Anytown, ST 12345",
  "quantity": "50",
  "budget_range": "$5000-7500 total",
  "delivery_timeline": "6 weeks from award",
  "special_requirements": "Energy efficient, adjustable brightness, USB charging capability",
  "evaluation_criteria": "Price (40%), Quality (30%), Warranty (20%), Delivery time (10%)"
}
```

**Expected Results**:
- Buyer questionnaire form is generated and displayed
- Form contains relevant fields for the RFP type
- Form accepts test data and submits successfully
- System confirms form submission

**Navigation Prompts for Claude**:
```javascript
// Look for form generation
await mcp_browser_get_text(); // Look for "questionnaire" or "form" in response

// Fill form fields (adapt selectors as needed)
await mcp_browser_form_input_fill({ selector: 'input[name="company_name"]', value: 'Acme Corporation' });
await mcp_browser_form_input_fill({ selector: 'input[name="contact_person"]', value: 'Jane Smith' });
// ... continue for all fields

// Submit form
await mcp_browser_click({ selector: 'button[type="submit"]' });
```

### Test Case 5: RFP Artifacts Generation

**Objective**: Verify generation of supplier-facing RFP documents

**Steps**:
1. After buyer form submission, wait for artifact processing
2. Look for generated artifacts in the session
3. Verify presence of:
   - Request for Proposal document
   - Supplier bid form
   - Any additional templates or documents

**Expected Artifacts**:
- **RFP Document**: Formal request document with requirements, timeline, submission instructions
- **Bid Form**: Structured form for suppliers to submit pricing and details
- **Proposal Template**: Guide for suppliers to structure their responses

**Expected Results**:
- Multiple artifacts are generated automatically
- Artifacts contain appropriate content based on buyer form
- Documents are accessible and properly formatted
- System indicates successful artifact creation

**Navigation Prompts for Claude**:
```javascript
// Look for artifacts section
await mcp_browser_get_text(); // Look for "artifacts", "documents", or "generated"

// Take screenshot of artifacts
await mcp_browser_screenshot({ name: 'generated-artifacts' });

// Click on artifacts to verify content
await mcp_browser_click({ text: 'RFP Document' }); // or similar
await mcp_browser_click({ text: 'Bid Form' }); // or similar
```

## Validation Checkpoints

### Functional Validation
- [ ] User can authenticate successfully
- [ ] Session creation works
- [ ] Agent switching functions correctly
- [ ] RFP conversation flows naturally
- [ ] Buyer form generates with appropriate fields
- [ ] Form submission processes successfully
- [ ] Supplier artifacts generate automatically
- [ ] Generated content is relevant and complete

### Technical Validation
- [ ] No console errors during workflow
- [ ] MCP server responds to all requests
- [ ] Database operations complete successfully
- [ ] V3 Claude API function processes requests
- [ ] Session persistence works across page refreshes
- [ ] Artifacts are stored in database correctly

### Content Quality Validation
- [ ] RFP document contains all key requirements
- [ ] Bid form has appropriate fields for the product/service
- [ ] Generated content is professional and complete
- [ ] Pricing structure is clear and logical
- [ ] Timeline and deliverables are well-defined

## Troubleshooting Common Issues

### Authentication Problems
- Clear browser cache and cookies
- Verify test credentials are correct
- Check if Google OAuth is properly configured
- Ensure Supabase auth is working

### MCP Connection Issues
- Verify MCP server status: "Waiting for MCP server" indicates connection problem
- Check `.vscode/mcp.json` configuration
- Ensure no `MCP_SERVER_PORT` environment variables causing HTTP mode conflict
- Restart VS Code if MCP tools aren't responding

### Agent/Session Issues
- Refresh page if agent doesn't switch
- Check browser console for JavaScript errors
- Verify session creation in browser network tab
- Ensure database has proper agent configurations

### Form Generation Problems
- Check Claude API quota and availability
- Verify V3 edge function deployment status
- Look for artifact generation errors in browser console
- Confirm database schema supports artifact creation

## Success Criteria

**Complete Success**: All test cases pass, full workflow completes with proper artifacts generated

**Partial Success**: Core functionality works but may have minor UI or content issues

**Failure**: Cannot complete authentication, agent switching, or core RFP workflow

## Test Execution Notes

- Record screenshots at each major step
- Note any error messages or unexpected behavior  
- Document actual vs expected results
- Time the overall workflow completion
- Verify data persistence after page refresh

## Browser Automation Support

This test plan is designed to support both manual testing and automated browser testing using MCP browser tools. The navigation prompts can be adapted for:

- Manual testing by QA teams
- Automated testing with MCP browser connector
- Demo scenarios for stakeholders
- Development validation workflows

## Post-Test Verification

After completing the test workflow:

1. Check database for created records:
   - Sessions table should have new session
   - Messages table should contain conversation
   - Artifacts table should have generated forms
   - RFPs table should have the created RFP

2. Verify artifact accessibility:
   - Generated forms should be viewable
   - Documents should be downloadable if applicable
   - Content should match input requirements

3. Test session persistence:
   - Refresh browser and verify session continues
   - Navigate away and back to verify state preservation
   - Check that generated artifacts remain accessible
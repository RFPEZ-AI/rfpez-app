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

### Test Case 6: RFP Request Email Generation

**Objective**: Generate the email template to send to potential suppliers

**Steps**:
1. After supplier bid form is created, agent should offer to generate RFP request email
2. Click "Generate RFP request email now" or similar button
3. Wait for email template generation
4. Verify email contains:
   - Professional greeting and introduction
   - Project overview and requirements summary
   - Link or instructions for accessing bid form
   - Submission deadline
   - Contact information

**Expected Results**:
- Email template is generated with all required elements
- Content is professional and comprehensive
- Includes clear call-to-action for suppliers
- Email is ready to be sent to vendors

**Navigation Prompts for Claude**:
```javascript
// Click to generate email
await mcp_browser_click({ text: 'Generate RFP request email now' });

// Wait for generation
await sleep(20000);

// Verify email artifact
await mcp_browser_get_text(); // Look for email content
await mcp_browser_screenshot({ name: 'rfp-request-email' });
```

### Test Case 7: Generate Demonstration Bids

**Objective**: Create sample bids to test the bid evaluation workflow

**Steps**:
1. Request agent to generate demonstration/sample bids
2. Ask for 3-5 sample bids with varying pricing and features
3. Verify sample bids are created with realistic data
4. Check that bids appear in the bid management system

**Sample Prompt**:
```
"Can you generate 3-4 demonstration bids from different vendors so I can test the bid evaluation process? Include varied pricing from $90-$160 per lamp with different features."
```

**Expected Results**:
- Multiple sample bids are generated (3-5 bids)
- Each bid has unique vendor information
- Pricing varies realistically within budget range
- Technical specifications differ across bids
- Bids are accessible in bid management interface

### Test Case 8: View and Evaluate Bid List

**Objective**: Access bid management interface and review submitted bids

**Steps**:
1. Navigate to "Bids" section or click "View Bids" button
2. Verify bid list displays all demonstration bids
3. Check that each bid shows key information:
   - Vendor name
   - Price per unit
   - Total bid amount
   - Key features summary
   - Submission date
4. Test sorting/filtering capabilities if available
5. Click on individual bids to view full details

**Navigation Prompts for Claude**:
```javascript
// Click Bids button
await mcp_browser_click({ selector: '[data-testid="bids-button"]' });
// or
await mcp_browser_click({ text: 'Bids' });

// Take screenshot of bid list
await mcp_browser_screenshot({ name: 'bid-list-view' });

// Click on individual bid to view details
await mcp_browser_click({ text: 'Vendor Name' }); // or bid item
await mcp_browser_screenshot({ name: 'bid-detail-view' });
```

**Expected Results**:
- Bid list interface loads successfully
- All demonstration bids are visible
- Bid information is clearly displayed
- Can navigate to individual bid details
- UI is intuitive and functional

### Test Case 9: Switch to Sourcing Agent

**Objective**: Change to RFP Sourcing Agent for vendor discovery and outreach

**Steps**:
1. Click on agent selector/indicator
2. Look for "Sourcing" or "RFP Sourcing" agent in list
3. Select the Sourcing Agent
4. Verify agent switch is successful
5. Confirm new agent context is active

**Expected Results**:
- Agent selector shows available agents
- Sourcing Agent is available in the list
- Successfully switches to Sourcing Agent
- UI updates to reflect sourcing-focused context
- Agent indicator shows "Sourcing Agent" as active

**Navigation Prompts for Claude**:
```javascript
// Click agent selector
await mcp_browser_click({ selector: '[data-testid="agent-selector"]' });

// Select Sourcing Agent
await mcp_browser_click({ text: 'Sourcing' }); // or 'RFP Sourcing'

// Verify agent switch
await mcp_browser_get_text(); // Look for "Sourcing" in agent indicator
await mcp_browser_screenshot({ name: 'sourcing-agent-active' });
```

### Test Case 10: Find Suitable Vendors

**Objective**: Use Sourcing Agent to discover potential suppliers for the RFP

**Steps**:
1. In chat with Sourcing Agent, request vendor recommendations
2. Provide RFP context (LED desk lamps, 50 units, specifications)
3. Review suggested vendors
4. Verify vendor information includes:
   - Company name
   - Specialization/capabilities
   - Contact information
   - Relevant experience or certifications

**Sample Prompts**:
```
"I need to find vendors who can supply high-quality LED desk lamps. We need 50 units with adjustable brightness and USB charging. Can you recommend some suitable suppliers?"

"Show me vendors who specialize in office lighting equipment and can handle bulk orders."
```

**Expected Results**:
- Sourcing Agent provides relevant vendor recommendations
- Vendors match the RFP requirements
- Contact information is included
- Recommendations are actionable
- Agent can provide additional vendor details on request

### Test Case 11: Send Email to Vendor

**Objective**: Compose and prepare to send RFP email to a selected vendor

**Steps**:
1. Select one vendor from recommendations
2. Request to send RFP email to that vendor
3. Verify email includes:
   - Vendor-specific greeting
   - RFP project details
   - Link to bid form or instructions
   - Deadline information
   - Contact details
4. Confirm email is ready to send or has been sent

**Sample Prompts**:
```
"I'd like to send the RFP email to [Vendor Name]. Can you prepare that email for me?"

"Send the LED desk lamp RFP to [Vendor Name] at [vendor@email.com]"
```

**Navigation Prompts for Claude**:
```javascript
// Send message to request email
await mcp_browser_form_input_fill({ 
  selector: '[data-testid="message-input"]',
  value: 'Send the RFP to BrightOffice Solutions'
});
await mcp_browser_click({ selector: '[data-testid="submit-button"]' });

// Wait for email generation
await sleep(15000);

// Verify email content
await mcp_browser_get_text(); // Look for email with vendor name
await mcp_browser_screenshot({ name: 'vendor-email-prepared' });
```

**Expected Results**:
- Email is generated with vendor-specific details
- All RFP information is included
- Email is professional and complete
- System confirms email preparation/sending
- Vendor receives appropriate information to submit bid

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
- [ ] RFP request email is generated successfully
- [ ] Demonstration bids can be created
- [ ] Bid list displays correctly
- [ ] Can switch to Sourcing Agent
- [ ] Vendor recommendations are relevant
- [ ] Vendor email can be composed and sent

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
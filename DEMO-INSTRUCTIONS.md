# RFPEZ.AI Demo Instructions

## Overview
This document provides step-by-step instructions for demonstrating the complete RFPEZ.AI RFP workflow, from initial user engagement through bid submission and review. The demo can be executed manually by a human or automated using browser MCP tools.


## Prerequisites
- RFPEZ.AI application running on http://localhost:3100
- Test account credentials:
  - Email: mskiba@esphere.com  
  - Password: thisisatest

## Demo Scenario: Office Supply Procurement
**Scenario**: A procurement manager needs to source office supplies (specifically LED desk lamps) for their organization.

---

## Phase 1: Initial User Engagement with Solutions Manager

### Step 1.1: Access Application
1. Navigate to `http://localhost:3100`
2. Log in using test credentials if not already authenticated
3. Verify the Solutions Agent is active (default agent)

### Step 1.2: Engage Solutions Manager
**User Input**: "Hi, I need to source some LED desk lamps for our office. Can you help?"

**Expected Behavior**:
- Solutions Agent should immediately recognize procurement intent
- Should automatically switch to RFP Designer using `switch_agent` function
- Should pass the user's request in the `user_input` parameter

**Validation Points**:
- ✅ Agent switches from "Solutions" to "RFP Designer"
- ✅ Message indicates switching to RFP Designer
- ✅ No attempt by Solutions Agent to create RFPs directly

---

## Phase 2: RFP Creation with RFP Designer

### Step 2.1: RFP Designer Engagement
**Expected Behavior**:
- RFP Designer welcomes user
- Acknowledges the LED desk lamp procurement need
- Should call `create_and_set_rfp` function to establish RFP record

**User Input**: "Yes, I need to create an RFP for LED desk lamps. We need about 50 units for our office."

**Validation Points**:
- ✅ `create_and_set_rfp` function called
- ✅ RFP record created in database
- ✅ Session linked to new RFP

### Step 2.2: Initial Requirements Gathering
**Expected Behavior**:
- RFP Designer should ask clarifying questions about:
  - Quantity (already provided: 50 units)
  - Budget constraints
  - Technical specifications
  - Delivery timeline
  - Quality requirements

---

## Phase 3: Buyer Questionnaire Creation and Completion

### Step 3.1: Generate Buyer Questionnaire
**User Input**: "Please create a buyer questionnaire to capture all the requirements."

**Expected Behavior**:
- RFP Designer calls `create_form_artifact` function
- Creates comprehensive LED desk lamp questionnaire
- Form includes fields for:
  - Quantity requirements
  - Budget parameters
  - Technical specifications (brightness, power consumption, etc.)
  - Delivery timeline
  - Quality/warranty requirements
  - Installation requirements

**Validation Points**:
- ✅ `create_form_artifact` called with complete `form_schema`
- ✅ Form artifact saved to database
- ✅ Interactive form displayed to user
- ✅ Form fields match LED desk lamp requirements

### Step 3.2: Fill Out Buyer Questionnaire
**Sample Data to Enter**:
```json
{
  "quantity": 50,
  "budget_per_unit": 150,
  "total_budget": 7500,
  "brightness_lumens": 800,
  "power_consumption_max": 15,
  "color_temperature": "4000K",
  "dimming_required": true,
  "arm_adjustability": "Multi-directional",
  "base_type": "Clamp or weighted base",
  "warranty_minimum": "2 years",
  "delivery_timeline": "30 days",
  "delivery_address": "123 Business Park, Suite 100, Anytown, ST 12345",
  "installation_support": "Self-installation acceptable",
  "special_requirements": "Energy efficient, modern design"
}
```

### Step 3.3: Submit Questionnaire
**Expected Behavior**:
- Form submission triggers data processing
- RFP record updated with requirements
- Confirmation message displayed
- Next steps outlined (supplier bid form generation)

**Validation Points**:
- ✅ Form data saved to database
- ✅ RFP record updated with requirements
- ✅ User receives confirmation

---

## Phase 4: Supplier Bid Form Generation

### Step 4.1: Generate Supplier Bid Form
**User Input**: "Now please generate the supplier bid form based on these requirements."

**Expected Behavior**:
- RFP Designer calls `create_form_artifact` for supplier bid form
- Bid form includes:
  - Company information fields
  - Product specification response fields
  - Pricing structure
  - Delivery commitment fields
  - Warranty and support information
  - File upload capabilities for product documentation

**Validation Points**:
- ✅ Supplier bid form created with appropriate fields
- ✅ Form mirrors buyer requirements for easy comparison
- ✅ Pricing fields support unit and total pricing
- ✅ File upload functionality included

### Step 4.2: Generate RFP Request Email
**User Input**: "Generate the RFP request email with a link to the bid form."

**Expected Behavior**:
- System generates professional RFP request email
- Email includes:
  - Project overview
  - Key requirements summary
  - Bid submission deadline
  - Direct link to bid form
  - Contact information
  - Submission instructions

**Sample Email Content**:
```
Subject: RFP Invitation - LED Desk Lamp Procurement (50 Units)

Dear Supplier,

We are pleased to invite your company to submit a proposal for our LED desk lamp procurement project.

Project Overview:
- Product: LED Desk Lamps
- Quantity: 50 units
- Budget: Up to $150 per unit
- Delivery Timeline: 30 days

Key Requirements:
- 800+ lumens brightness
- Dimming capability
- Multi-directional adjustment
- 2+ year warranty

Please submit your bid by [DEADLINE] using our online bid form:
[BID_FORM_LINK]

For questions, contact: [CONTACT_INFO]

Thank you for your interest.
```

**Validation Points**:
- ✅ Email generated with professional format
- ✅ Bid form URL included and accessible
- ✅ Key requirements summarized accurately
- ✅ Contact information provided

---

## Phase 5: Sample Bid Submission

### Step 5.1: Access Bid Form
1. Open the bid form URL in a new browser tab/window
2. Verify form loads correctly
3. Check all required fields are present

### Step 5.2: Fill Sample Bid
**Sample Supplier Data**:
```json
{
  "company_name": "Bright Light Solutions Inc.",
  "contact_name": "Sarah Johnson",
  "contact_email": "sarah.johnson@brightlight.com",
  "contact_phone": "(555) 123-4567",
  "company_address": "456 Industrial Way, Manufacturing City, ST 54321",
  "tax_id": "12-3456789",
  "product_model": "BL-LED-800 Professional Desk Lamp",
  "brightness_lumens": 850,
  "power_consumption": 12,
  "color_temperature": "3000K-6000K adjustable",
  "dimming_capability": "0-100% stepless dimming",
  "arm_adjustability": "360° base rotation, 180° arm pivot, 90° head tilt",
  "base_type": "Weighted base with optional clamp attachment",
  "warranty_period": "3 years",
  "unit_price": 142.50,
  "total_price": 7125.00,
  "delivery_timeline": "25 days",
  "installation_support": "Setup guide included, phone support available",
  "certifications": "Energy Star, UL Listed, FCC Compliant",
  "additional_notes": "Bulk discount applied. Free shipping included."
}
```

### Step 5.3: Submit Bid
**Expected Behavior**:
- Form validation passes
- Bid data saved to database
- Confirmation message displayed
- Bid reference number provided

**Validation Points**:
- ✅ All required fields completed
- ✅ Bid submission successful
- ✅ Database record created
- ✅ Confirmation with reference number

---

## Phase 6: Bid Review and Management

### Step 6.1: Access Bid View
**User Input** (back in main application): "Show me the submitted bids for this RFP."

**Expected Behavior**:
- System displays bid management interface
- Lists all submitted bids for the LED desk lamp RFP
- Shows key bid information in summary format

### Step 6.2: Review Bid Details
**Expected Display Elements**:
- Supplier company information
- Bid summary (price, delivery timeline)
- Detailed product specifications
- Comparison with RFP requirements
- Bid status and submission timestamp

**Validation Points**:
- ✅ Bid appears in bid management interface
- ✅ All submitted data displayed correctly
- ✅ Pricing information clearly shown
- ✅ Delivery timeline matches requirements
- ✅ Product specifications compare favorably

---

## Automated Testing Script Structure

```javascript
// Browser MCP automation structure
const demoSteps = [
  "navigate_to_app",
  "login_if_needed", 
  "engage_solutions_manager",
  "verify_agent_switch",
  "create_rfp_with_designer",
  "generate_buyer_questionnaire",
  "fill_questionnaire_sample_data",
  "submit_questionnaire",
  "generate_supplier_bid_form",
  "create_rfp_request_email",
  "open_bid_form_new_tab",
  "fill_sample_bid",
  "submit_bid",
  "return_to_main_app",
  "view_submitted_bids",
  "verify_bid_data"
];
```

---

## Success Criteria

### Complete Demo Success Indicators:
- ✅ Solutions Manager engages and switches to RFP Designer
- ✅ RFP Designer creates RFP record and questionnaire
- ✅ Buyer questionnaire loads and accepts sample data
- ✅ Supplier bid form generates with appropriate fields
- ✅ RFP request email creates with working bid form link
- ✅ Sample bid submits successfully
- ✅ Bid appears in bid management view
- ✅ All data flows correctly through the system

### Performance Benchmarks:
- Agent switches should occur within 2 seconds
- Form generation should complete within 5 seconds
- Form submissions should process within 3 seconds
- Bid form loading should complete within 2 seconds

---

## Common Issues and Troubleshooting

### Issue: Solutions Agent doesn't switch
**Symptoms**: Solutions Agent attempts to create RFPs directly
**Solution**: Verify procurement trigger words in user input

### Issue: RFP Designer doesn't create RFP record
**Symptoms**: Forms generate but no RFP in database
**Solution**: Ensure `create_and_set_rfp` is called first

### Issue: Forms don't display
**Symptoms**: Function calls succeed but no form appears
**Solution**: Verify `form_schema` parameter is complete and valid

### Issue: Bid form link doesn't work
**Symptoms**: Email generates but link is broken
**Solution**: Check form artifact URL generation and accessibility

### Issue: Bids don't appear in bid view
**Symptoms**: Bid submits but doesn't show in management interface
**Solution**: Verify bid-to-RFP relationship and query parameters

---

## Next Steps for Iteration

1. **Run Initial Demo**: Execute all steps manually
2. **Document Issues**: Record any failures or unexpected behaviors
3. **Debug and Fix**: Address identified issues one by one
4. **Create Automation**: Build MCP browser script for automated testing
5. **Performance Optimize**: Improve response times and user experience
6. **Polish UI/UX**: Enhance visual presentation and user guidance

---

*Demo Instructions Version 1.0 - Created for RFPEZ.AI Complete Workflow Testing*
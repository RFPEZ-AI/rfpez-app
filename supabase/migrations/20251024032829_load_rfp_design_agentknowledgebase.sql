-- Knowledge Base: RFP Design Agent-knowledge-base
-- Generated on 2025-10-24T03:28:29.971Z
-- Source: RFP Design Agent-knowledge-base.md
-- Entries: 10

-- Insert knowledge base entries
-- Phase 1: RFP Context - Detailed Workflow
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Phase 1 RFP Context Detailed Workflow:

CRITICAL FIRST ACTION - Never skip this step:

1. **Recognize Procurement Intent**: When user mentions creating an RFP, procurement, sourcing, or needing a proposal, immediately proceed to RFP creation.

2. **Call create_and_set_rfp Function**:
   - REQUIRED parameter: name (RFP title)
   - OPTIONAL parameters: description, specification, due_date
   - NO session_id needed - function auto-determines current session
   - Example: create_and_set_rfp({ name: "LED Bulb Procurement RFP" })

3. **Function Handles Everything**:
   - Creates RFP record in database
   - Sets as current RFP for session
   - Validates and refreshes UI
   - Returns rfp_id for subsequent operations

4. **Result**:
   - RFP ID is now available for all artifact creation
   - Session is linked to this RFP
   - User sees "Current RFP: [name]" in UI

5. **Next Steps**:
   - Proceed to Phase 2 (Requirements Gathering)
   - All artifacts MUST use this rfp_id parameter

**Common Mistakes to Avoid:**
- Skipping RFP creation and going straight to forms
- Asking permission before creating RFP (just do it)
- Forgetting to check get_current_rfp before creating artifacts
- Creating artifacts without valid rfp_id$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "rfp-design-phase1-workflow",
  "category": "workflow",
  "importance": 0.95,
  "tags": [],
  "phase": "1"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-phase1-workflow'
);

-- Phase 3: Interactive Questionnaire - Detailed Workflow
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Phase 3 Interactive Questionnaire Detailed Workflow:

STEP-BY-STEP PROCESS:

1. **Verify RFP Context**:
   - Ensure RFP was created in Phase 1
   - Call get_current_rfp to retrieve rfp_id if needed

2. **Design Form Schema** (CRITICAL - Use FLAT structure):
   - All fields at root properties level
   - NO nested objects (no type: "object" within properties)
   - Use snake_case for field names
   - Field types: string, number, boolean, array
   - Use enum for dropdowns
   - Specify required fields array

3. **Call create_form_artifact**:
   REQUIRED parameters:
   - session_id: Current session UUID
   - title: Descriptive form name
   - form_schema: Complete JSON Schema object
   - artifact_role: "buyer_questionnaire"
   
   OPTIONAL parameters:
   - description: Brief form description
   - ui_schema: UI customization (can be empty {})
   - submit_action: What happens on submit (default: save)
   - default_values: Pre-populate fields

4. **Capture Artifact ID**:
   - Function returns artifact_id (UUID)
   - Store this ID for subsequent operations
   - Use exact returned ID (never generate your own)

5. **Populate Sample Data** (if requested):
   - First: Call get_form_schema to see exact field names
   - Then: Call update_form_data with artifact_id and form_data
   - Match field names EXACTLY from schema
   - For enums: Use exact enum values to show selections

6. **Present to User**:
   - Form appears in artifact window
   - User-friendly explanation only
   - Never show code or JSON Schema to user

**Flat Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "company_name": { "type": "string", "title": "Company Name" },
    "quantity": { "type": "number", "title": "Quantity Needed" },
    "budget_range": {
      "type": "string",
      "enum": ["Under $5K", "$5K-$15K", "$15K+"],
      "title": "Budget Range"
    }
  },
  "required": ["company_name", "quantity"]
}
```

**Common Errors:**
- Nested schema structure (causes database issues)
- Missing form_schema parameter
- Missing session_id parameter
- Missing artifact_role parameter
- Wrong artifact_id in subsequent operations$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "rfp-design-phase3-workflow",
  "category": "workflow",
  "importance": 0.9,
  "tags": [],
  "phase": "3"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-phase3-workflow'
);

-- Phase 5-6: Auto-Generation - Detailed Workflow
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Phase 5-6 Auto-Generation Detailed Workflow:

COMPLETE SEQUENCE - Must follow EXACTLY:

**Step 1: Create Supplier Bid Form**
- Call create_form_artifact with:
  - artifact_role: "bid_form"
  - Include buyer details as read-only context fields
  - Design form for supplier to complete
  - Capture returned artifact_id

**Step 2: Generate Bid Submission URL**
- Call generate_rfp_bid_url({ rfp_id: current_rfp_id })
- Store the returned URL value
- Format: "/rfp/{rfpId}/bid"
- DO NOT proceed to Step 3 without this URL

**Step 3: Create Request Email with Link**
- Use URL from Step 2 in request content
- MUST include text like: "To submit your bid, please access our [Bid Submission Form](URL)"
- Call create_document_artifact with:
  - artifact_role: "request_document"
  - Content includes bid form link
  - Full RFP details and requirements
  
**Request Content Template:**
```
**IMPORTANT: Bid Submission**
To submit your bid for this RFP, please access our [Bid Submission Form](BID_URL_HERE)

[RFP Details content...]

**How to Submit Your Bid:**
1. Review all requirements above
2. Access our online [Bid Submission Form](BID_URL_HERE)
3. Complete all required fields
4. Submit before the deadline
```

**Step 4: Final Verification**
- Call list_artifacts to verify:
  - Bid form artifact exists
  - Request document artifact exists
- Verify request document contains bid URL
- Update RFP status to 'completed'
- Notify user package is ready

**Critical Rules:**
- Never skip Step 2 (URL generation)
- Never write request content before getting URL
- Always embed URL as named link, not raw URL
- Verify artifacts before marking complete$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "rfp-design-phase5-6-workflow",
  "category": "workflow",
  "importance": 0.9,
  "tags": [],
  "phase": "5-6"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-phase5-6-workflow'
);

-- Sample Data Population - Best Practices
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Sample Data Population Best Practices:

**When to Populate Sample Data:**
- User requests "sample data", "test data", "demo data"
- User asks to "fill out form" or "populate form"
- User wants to see example responses

**Two-Step Process:**

**Step 1: Get Form Schema**
- Always call get_form_schema FIRST
- Parameters: artifact_id, session_id
- Returns: exact field names and allowed values
- Identify enum fields and their options

**Step 2: Update Form Data**
- Call update_form_data with exact field names
- Parameters: artifact_id, session_id, form_data
- Match field names EXACTLY from schema
- Use exact enum values for selections

**Sample Data Guidelines:**
- **Realistic Business Values**: Use professional, believable data
- **Company Names**: "Green Valley [Industry]", "Mountain View [Business]"
- **Contact Names**: Professional-sounding names
- **Emails**: Standard formats (name@company.com)
- **Dates**: Reasonable future dates for timelines
- **Numbers**: Realistic quantities, budgets, measurements
- **Enums**: ALWAYS use exact enum values from schema
- **Multi-select**: Provide arrays with multiple enum values

**Dropdown Selection Critical Rule:**
```javascript
// Schema with dropdown:
"priority": {
  "type": "string",
  "enum": ["low", "medium", "high", "urgent"]
}

// Sample data MUST use exact enum value:
form_data: {
  "priority": "high"  // ← Shows "high" selected in UI
}

// NOT: "Priority" or "HIGH" or "3" - must match exactly
```

**Multi-Select Example:**
```javascript
// Schema:
"features": {
  "type": "array",
  "items": {
    "type": "string",
    "enum": ["energy_star", "dimmable", "smart_control"]
  }
}

// Sample data:
form_data: {
  "features": ["energy_star", "dimmable"]  // ← Shows both selected
}
```

**Workflow Example:**
```
User: "Can you fill out the questionnaire with sample data?"

Agent Actions:
1. get_form_schema({ artifact_id: "form-uuid", session_id: "session-uuid" })
   → Returns field names: site_address, delivery_time_preference, priority
   
2. update_form_data({
     artifact_id: "form-uuid",
     session_id: "session-uuid",
     form_data: {
       "site_address": "123 Construction Ave, Building Site 4",
       "delivery_time_preference": "Early Morning (6am-9am)",  // Exact enum value
       "priority": "high"  // Exact enum value
     }
   })

Agent Response to User:
"✅ I've populated the questionnaire with sample data for Green Valley Construction. The form now shows example responses including an early morning delivery preference. Feel free to modify any fields as needed!"
```

**Common Mistakes:**
- Not calling get_form_schema first
- Using wrong field names (e.g., "address" instead of "site_address")
- Using enum labels instead of values
- Generating your own artifact IDs instead of using returned ones
- Forgetting to press Enter or click submit in browser tests$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "rfp-design-sample-data-practices",
  "category": "best-practices",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-sample-data-practices'
);

-- Form Schema Validation Rules
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Form Schema Validation Rules:

**CRITICAL STRUCTURAL RULES:**

1. **Always Use Flat Schema Structure**
   - All fields at root properties level
   - NO nested objects
   - NO type: "object" within properties
   - Group visually with field ordering, not nesting

2. **Field Naming Convention**
   - Use snake_case for all field names
   - Examples: company_name, contact_email, delivery_date
   - NO camelCase, NO spaces, NO special characters

3. **Match Database Storage**
   - Flat structure aligns with JSONB storage
   - Nested structures cause database issues
   - Form data stored in default_values column as flat JSON

**Correct Flat Schema Example:**
```json
{
  "type": "object",
  "properties": {
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "contact_email": {
      "type": "string",
      "format": "email",
      "title": "Contact Email"
    },
    "quantity": {
      "type": "number",
      "title": "Quantity Needed",
      "minimum": 1
    },
    "budget_range": {
      "type": "string",
      "enum": ["Under $5K", "$5K-$15K", "$15K+"],
      "title": "Budget Range"
    }
  },
  "required": ["company_name", "contact_email", "quantity"]
}
```

**WRONG - Nested Schema (DO NOT USE):**
```json
{
  "type": "object",
  "properties": {
    "company_info": {  // ❌ Nested object!
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" }
      }
    }
  }
}
```

**Common Field Types:**
- Text Input: `{ "type": "string", "title": "Field Label" }`
- Email: `{ "type": "string", "format": "email" }`
- Number: `{ "type": "number", "minimum": 0 }`
- Date: `{ "type": "string", "format": "date" }`
- Dropdown: `{ "type": "string", "enum": ["A", "B", "C"] }`
- Multi-select: `{ "type": "array", "items": { "type": "string", "enum": ["X", "Y"] } }`
- Checkbox: `{ "type": "boolean" }`
- Text Area: `{ "type": "string", "title": "Description" }` (UI determines display)

**Required Fields:**
- Always include "required" array at root level
- List field names that must be filled
- Example: `"required": ["company_name", "contact_email"]`

**Error Prevention:**
- Missing form_schema causes "form_schema is required" error
- Nested schemas cause database storage issues
- Wrong field names in update_form_data cause silent failures
- Missing artifact_role causes "null value in column" error$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "rfp-design-form-schema-rules",
  "category": "validation",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-form-schema-rules'
);

-- Demonstration Bid Submission Workflow
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Demonstration Bid Submission Workflow:

**When User Requests Demo Bids:**
User says: "create some demo bids", "add test bids", "show sample bids"

**Direct Bid Submission Process:**

1. **Verify RFP Context**
   - Call get_current_rfp to confirm RFP is set
   - Get rfp_id for bid submissions

2. **Create Multiple Diverse Bids**
   - Submit 3-5 bids with varied profiles
   - Use submit_bid function with direct parameters
   - NO artifact_id needed for direct submission

3. **Required Parameters for Each Bid:**
   ```javascript
   {
     rfp_id: current_rfp_id,
     supplier_name: "Company Name",
     bid_price: numeric_amount,
     delivery_days: number_of_days
   }
   ```

4. **Bid Variety Guidelines:**
   - **Budget Option**: Lower price, longer delivery
   - **Mid-Range**: Balanced price and timeline
   - **Premium**: Higher price, faster delivery
   
5. **Realistic Supplier Names:**
   - Match procurement category
   - Professional company names
   - Examples: "EcoLite Solutions", "BrightPath Lighting Co", "LuminaTech Industries"

**Example: Creating 3 Demo Bids for LED Bulbs:**

```javascript
// Bid 1 - Budget
submit_bid({
  rfp_id: 69,
  supplier_name: "EcoLite Solutions",
  bid_price: 8500,
  delivery_days: 14
})

// Bid 2 - Mid-Range
submit_bid({
  rfp_id: 69,
  supplier_name: "BrightPath Lighting Co",
  bid_price: 12000,
  delivery_days: 7
})

// Bid 3 - Premium
submit_bid({
  rfp_id: 69,
  supplier_name: "LuminaTech Industries",
  bid_price: 15500,
  delivery_days: 3
})
```

**After Submission:**
1. Confirm success count to user
2. Provide brief summary of each bid
3. Suggest next steps (view bids, compare, evaluate)

**User-Friendly Response:**
```
✅ I've created 3 demonstration supplier bids for your LED Bulb RFP:

1. **EcoLite Solutions** - $8,500 (14-day delivery) - Budget option
2. **BrightPath Lighting Co** - $12,000 (7-day delivery) - Balanced choice
3. **LuminaTech Industries** - $15,500 (3-day delivery) - Premium express

All bids are now visible in the Bids view. Would you like me to help compare these options or create additional bids?
```

**Best Practices:**
- Vary pricing realistically based on delivery speed
- Use appropriate company names for industry
- Include 3-5 bids for good comparison
- Price-speed trade-off: faster = more expensive
- Scale prices based on RFP quantity requirements$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "rfp-design-demo-bid-workflow",
  "category": "workflow",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-demo-bid-workflow'
);

-- Error Messages and Troubleshooting
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Common Error Messages and Solutions:

**Error: "form_schema is required"**
- **Cause**: Called create_form_artifact without form_schema parameter
- **Solution**: Always include complete form_schema JSON object
- **Example Fix**: Add form_schema parameter with properties and required fields

**Error: "Session ID is required"**
- **Cause**: Missing session_id parameter in create_form_artifact
- **Solution**: Always include session_id from current session context
- **Prevention**: Check function signatures before calling

**Error: "CRITICAL ERROR: form_schema parameter is required"**
- **Cause**: Called create_form_artifact with only title/description
- **Solution**: RETRY with complete parameters: session_id, title, form_schema, artifact_role
- **Prevention**: Never call create_form_artifact without all REQUIRED parameters

**Error: "null value in column artifact_role"**
- **Cause**: Missing artifact_role parameter
- **Solution**: Always specify artifact_role:
  - "buyer_questionnaire" for buyer forms
  - "bid_form" for supplier forms
- **Prevention**: artifact_role is REQUIRED, not optional

**Error: "rfp_id is required"**
- **Cause**: Trying to create artifact without valid RFP
- **Solution**: Call create_and_set_rfp FIRST, then use returned rfp_id
- **Prevention**: Always verify RFP context before creating artifacts

**Issue: "RFP Not Saved"**
- **Symptom**: UI shows "Current RFP: none"
- **Cause**: Skipped Phase 1 RFP creation
- **Solution**: Call create_and_set_rfp before any other operations
- **Prevention**: NEVER skip RFP context creation

**Issue: "Form Not Clickable"**
- **Symptom**: Artifact reference doesn't load form
- **Cause**: Missing session_id prevents database persistence
- **Solution**: Always provide session_id in create_form_artifact
- **Prevention**: Use complete function parameters

**Issue: "Dropdown Shows Empty"**
- **Symptom**: Dropdown field appears with no selection
- **Cause**: form_data doesn't use exact enum values
- **Solution**: Call get_form_schema first, then use EXACT enum values
- **Example**: Use "Early Morning (6am-9am)" not "early_morning"

**Issue: "Wrong Field Names"**
- **Symptom**: update_form_data doesn't populate fields
- **Cause**: Field names don't match schema
- **Solution**: Call get_form_schema to get exact field names
- **Prevention**: Never guess field names - always check schema first

**Issue: "Missing Bid URL in Request"**
- **Symptom**: Request document doesn't have bid submission link
- **Cause**: Skipped generate_rfp_bid_url or didn't include URL in content
- **Solution**: Follow Phase 5-6 workflow exactly - generate URL BEFORE writing request
- **Prevention**: Always verify request content contains bid URL before marking complete

**Recovery Patterns:**
1. For missing RFP: Call create_and_set_rfp immediately
2. For form errors: Recreate with complete parameters
3. For field issues: Call get_form_schema to verify structure
4. For bid URL: Regenerate URL and update request document$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "rfp-design-error-troubleshooting",
  "category": "troubleshooting",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-error-troubleshooting'
);

-- User Communication Best Practices
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$User Communication Best Practices:

**CRITICAL RULE: NEVER Show Technical Details**
- NEVER show code, schemas, or JSON to users
- NEVER mention function names or technical operations
- NEVER display error messages verbatim
- ALWAYS use natural, professional language
- HIDE all technical implementation completely

**What Users Should See:**
- ✅ Friendly explanations of what's happening
- ✅ Interactive forms in artifact window
- ✅ Progress updates ("I'm creating your questionnaire...")
- ✅ Clear next steps ("The form is ready for your input")
- ✅ Professional business language

**What Users Should NEVER See:**
- ❌ JavaScript code examples
- ❌ JSON Schema structures
- ❌ Function call syntax
- ❌ Database operations
- ❌ Technical parameter names
- ❌ Error stack traces

**Good User-Facing Messages:**

"✅ I've created a detailed questionnaire to gather your LED bulb requirements. Please fill out the form in the artifact panel on the right. It will help me understand your specific needs for quantity, specifications, and delivery timeline."

"Perfect! I've generated a comprehensive RFP package including:
1. Detailed questionnaire (completed with your responses)
2. Supplier bid form
3. Request document with submission link

Everything is ready to send to potential suppliers!"

"I see you'd like to work on your Office Furniture RFP. Would you like to continue in this conversation, or should we switch to the session where we were previously discussing that procurement?"

**Bad User-Facing Messages:**

❌ "I'm calling create_form_artifact with form_schema parameter..."
❌ "Here's the JSON Schema for your form: { type: 'object', properties: {...} }"
❌ "Error: form_schema is required (SQLSTATE 42P01)"
❌ "Executing get_current_rfp() to retrieve rfp_id..."

**Professional Tone Guidelines:**
- Warm and helpful, not robotic
- Action-oriented, not passive
- Clear and concise, under 100 words when possible
- Proactive suggestions when appropriate
- Acknowledge context seamlessly

**Handling Errors Gracefully:**
Instead of: "Error: Missing required parameter form_schema"
Say: "Let me create a fresh questionnaire for you with all the details we need."

Instead of: "Function call failed - missing rfp_id"
Say: "I need to set up your RFP first before we can create forms. Let me do that now."

**Agent Switching Suggestions:**
- Proactively suggest appropriate agents
- Make switching sound natural and easy
- Examples:
  - "For technical support questions, our Technical Support agent would be perfect. Just say 'switch me to Support agent'!"
  - "Since you're asking about product features, would you like me to connect you with our Solutions agent?"

**Memory Integration - Natural Acknowledgment:**
- Don't say "I found a memory that says..."
- Instead: "I see you're looking to source 100 LED bulbs..."
- Act on retrieved information naturally
- Users shouldn't know you're using memory system$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "rfp-design-communication-practices",
  "category": "communication",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-communication-practices'
);

-- RFP Context Change Handling
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$RFP Context Change Handling Guidelines:

**When You Receive System Notification:**
Format: "[SYSTEM NOTIFICATION: RFP context changed from X to Y]"

**Your Response Strategy:**

**1. Acknowledge Briefly**
- Don't overwhelm with technical details
- Keep it natural and user-focused
- Example: "I see we've switched to working on [New RFP Name]."

**2. Assess Session State**
- Active conversation (has messages): Offer workflow options
- New/empty session: Simply acknowledge and ask how to proceed

**3. For Active Sessions, Offer Options:**
```
"I see we've switched to [New RFP Name]. Would you like to:

1. **Continue here** - Keep working with this RFP in our current conversation
2. **Switch sessions** - Move to the last session where we worked on this RFP
3. **Fresh start** - Create a new dedicated session for this RFP

What works best for you?"
```

**4. For New/Empty Sessions:**
```
"Great! We're now working on [RFP Name]. How can I help you with this RFP today?"
```

**Good Responses:**
✅ "I see we've switched to the Office Furniture RFP. Would you like to continue working on it here, or switch to your previous session where we were discussing this procurement?"

✅ "Perfect! We're now working on the LED Bulb Procurement RFP. What would you like to focus on first?"

**Bad Responses:**
❌ "SYSTEM NOTIFICATION RECEIVED: RFP_ID changed from 12 to 15. Database context updated..."
❌ "Context switch detected. Please acknowledge receipt and confirm next action parameters..."
❌ "Error: Multiple RFP contexts detected. Manual intervention required..."

**When NOT to Respond:**
- Automated system notifications during restoration
- User immediately follows with their own message
- Context change was part of ongoing workflow (like creating new RFP)

**Key Principles:**
- Be helpful, not intrusive
- Respect user intent (they changed for a reason)
- Provide value through workflow suggestions
- Keep it brief and return to helping quickly
- Make it feel like a tool, not a disruption$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.75,
  '{
  "knowledge_id": "rfp-design-context-change-handling",
  "category": "workflow",
  "importance": 0.75,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-context-change-handling'
);

-- Memory Search Best Practices
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_rfp_design_agentknowledgebase_20251024032829$Memory Search Best Practices for RFP Design Agent:

**When to Search Memories:**

**1. Session Start / Agent Switch**
- ALWAYS search when receiving control from Solutions agent
- Check for recent procurement intent stored by previous agent
- Query: "user procurement intent requirements sourcing RFP"
- Look for memory types: "decision", "preference"

**2. Context Recall**
- User refers to past preferences
- Need to recall previous requirements
- User asks about "what we discussed before"

**3. Understanding User Preferences**
- Recurring patterns in user requests
- Organizational standards or requirements
- Vendor preferences or restrictions

**Search Query Patterns:**

**For RFP Intent:**
```javascript
search_memories({
  query: "user procurement intent requirements sourcing RFP",
  memory_types: "decision,preference",
  limit: 5
})
```

**For User Preferences:**
```javascript
search_memories({
  query: "vendor preferences requirements standards",
  memory_types: "preference,fact",
  limit: 10
})
```

**For Project Context:**
```javascript
search_memories({
  query: "LED lighting procurement energy efficiency",
  memory_types: "context,decision",
  limit: 5
})
```

**Analyzing Retrieved Memories:**
- Check timestamps for recency
- Prioritize importance_score 0.8-0.9
- Focus on procurement-related content
- Look for explicit decisions and preferences

**Acting on Retrieved Memories:**

**If Clear Intent Found:**
```
Memory: "User wants 100 LED bulbs, energy efficient, 5-year lifespan"

Response: "I see you're looking to source 100 energy-efficient LED bulbs with at least a 5-year lifespan. Let me create an RFP and questionnaire to capture the detailed requirements..."
```

**If Multiple Memories:**
```
Memory 1: "Office furniture procurement"
Memory 2: "Prefers US-based vendors"

Response: "I understand you're sourcing office furniture and prefer working with US-based vendors. Let me create an RFP that captures these preferences..."
```

**If No Intent Found:**
```
Response: "Hello! I'm your RFP Design specialist. What type of product or service are you looking to procure?"
```

**Natural Acknowledgment:**
- Don't say "I found a memory"
- Act on information naturally
- Seamlessly integrate context into response
- Users shouldn't know you're using memories

**When NOT to Search:**
- User explicitly starts fresh ("something different")
- User says "new RFP" or "start over"
- User clearly changing topics
- Already searched in current session

**Storing Your Own Memories:**

**User Preferences:**
```javascript
create_memory({
  content: "User prefers detailed technical specs in RFPs, especially for electronics",
  memory_type: "preference",
  importance_score: 0.7
})
```

**Project Context:**
```javascript
create_memory({
  content: "LED bulb procurement RFP focused on energy efficiency and total cost of ownership over 10 years",
  memory_type: "context",
  importance_score: 0.6,
  reference_type: "rfp",
  reference_id: current_rfp_id
})
```

**Important Decisions:**
```javascript
create_memory({
  content: "User decided to split office furniture procurement into two phases: Phase 1 desks/chairs (immediate), Phase 2 storage (Q2 next year)",
  memory_type: "decision",
  importance_score: 0.8,
  reference_type: "rfp",
  reference_id: current_rfp_id
})
```

**Memory Best Practices:**
- Search early before asking questions
- Use specific keywords related to procurement
- Consider recency when evaluating results
- Combine explicit intent with general preferences
- Store decisions and preferences for future sessions$kb_rfp_design_agentknowledgebase_20251024032829$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "rfp-design-memory-search-practices",
  "category": "best-practices",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-design-memory-search-practices'
);

-- Verify insertions
SELECT 
  memory_type,
  metadata->>'knowledge_id' as knowledge_id,
  metadata->>'category' as category,
  LEFT(content, 100) as content_preview,
  importance_score,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge'
  AND metadata->>'knowledge_id' IN ('rfp-design-phase1-workflow', 'rfp-design-phase3-workflow', 'rfp-design-phase5-6-workflow', 'rfp-design-sample-data-practices', 'rfp-design-form-schema-rules', 'rfp-design-demo-bid-workflow', 'rfp-design-error-troubleshooting', 'rfp-design-communication-practices', 'rfp-design-context-change-handling', 'rfp-design-memory-search-practices')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';

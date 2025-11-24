-- Knowledge Base: Sourcing Agent-knowledge-base
-- Generated on 2025-11-22T21:37:21.499Z
-- Source: Sourcing Agent-knowledge-base.md
-- Entries: 8
-- Agent: 021c53a9-8f7f-4112-9ad6-bc86003fadf7 (UUID)

-- Insert knowledge base entries
-- Vendor Requirements Discovery Workflow
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**Step-by-Step Vendor Requirements Discovery:**

1. **Search Existing Memory First**
   ```javascript
   const memory = await search_memories({
     query: "vendor requirements supplier criteria certifications geography capabilities",
     memory_types: ["fact", "decision"],
     limit: 5
   });
   ```
   - Check for previously stored requirements
   - Look for user preferences from earlier conversations
   - Review RFP-specific vendor criteria

2. **Extract from RFP Context**
   ```javascript
   const rfp = await get_current_rfp({ sessionId });
   // Analyze RFP title, description for implicit criteria
   // E.g., "GSA-certified LED suppliers" → require GSA certification
   ```

3. **Ask User for Missing Criteria**
   Use conversational questions:
   - "What certifications are required? (e.g., GSA, ISO, minority-owned)"
   - "Any geographic preferences? (e.g., local, regional, national)"
   - "Minimum capabilities needed? (e.g., volume, delivery time, support)"
   - "Budget range or pricing expectations?"

4. **Store Requirements in Memory**
   ```javascript
   await create_memory({
     sessionId,
     memory_type: "fact",
     content: `Vendor requirements for ${rfpName}: ${requirementsList}`,
     importance_score: 0.9,
     metadata: {
       knowledge_id: "vendor-criteria-current-rfp",
       category: "sourcing-requirements"
     }
   });
   ```

5. **Confirm Requirements with User**
   Present summary: "I'll search for vendors that meet: [list]. Does this match your needs?"

**Metadata:**
```json
{
  "knowledge_id": "sourcing-vendor-requirements-workflow",
  "category": "workflow",
  "importance": 0.85,
  "tags": ["requirements", "discovery", "criteria"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "sourcing-vendor-requirements-workflow",
  "category": "workflow",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-vendor-requirements-workflow'
);

-- Perplexity Vendor Discovery Strategy
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**How to Research Vendors Using Perplexity Tools:**

**1. Craft Effective Search Queries**

Use `perplexity_search` for initial discovery:
```javascript
await perplexity_search({
  query: `${productOrService} suppliers in ${geography} with ${certifications}`,
  max_results: 10
});
```

**Example Queries:**
- "LED lighting manufacturers in California with GSA certification and contact emails"
- "Office furniture vendors in northeast US with sustainability certifications"
- "Industrial equipment distributors serving midwest region with ISO certification"

**2. Use Research for Comprehensive Analysis**

For detailed vendor analysis, use `perplexity_research`:
```javascript
await perplexity_research({
  messages: [{
    role: "user",
    content: `Research suppliers for ${productDescription}. For each vendor, provide: company name, contact email, phone number, website, capabilities summary, certifications, and geographic coverage. Focus on vendors with ${specificRequirements}.`
  }]
});
```

**3. Extract Structured Data**

Parse research results into structured vendor objects:
```javascript
const vendors = parsedResults.map(v => ({
  vendor_name: v.company_name,
  contact_email: v.email || "Email not found",
  contact_phone: v.phone || "",
  website: v.website || "",
  capabilities: `${v.products_services}. ${v.certifications}. ${v.coverage}`,
  location: v.city_state || v.region,
  certifications: v.certifications_list || []
}));
```

**4. Validate Contact Information**

- Prioritize vendors with verifiable email addresses
- Flag vendors missing contact info for manual lookup
- Use website URLs to find contact pages if email missing

**5. Target Vendor Count**

- Aim for 8-12 qualified vendors
- Include mix of sizes (large established + smaller specialized)
- Diversify geographically if no location preference
- Balance price points (budget, mid-range, premium)

**6. Store Research Citations**

```javascript
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `Vendor research sources: ${citationsList}`,
  importance_score: 0.7,
  metadata: {
    knowledge_id: "vendor-research-sources",
    category: "sourcing-research"
  }
});
```

**Best Practices:**
- Always cite sources in artifact descriptions
- Update memory with research timestamp
- Track which vendors were AI-discovered vs user-provided
- Note any vendors that couldn't be verified

**Metadata:**
```json
{
  "knowledge_id": "sourcing-perplexity-discovery",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["perplexity", "research", "vendor-discovery"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "sourcing-perplexity-discovery",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-perplexity-discovery'
);

-- Email Invitation Templates
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**Professional Vendor Invitation Email Structure:**

**Subject Line Formulas:**
- "RFP Invitation: [Project Name] - [Organization]"
- "Bid Opportunity: [Product/Service] for [Organization]"
- "Request for Proposal: [Brief Description]"

**Email Body Template (Initial Invitation):**
```markdown
Subject: RFP Invitation: {rfp_title}

Dear {vendor_name},

{organization_name} is requesting bids for {project_description}.

**Two Ways to Respond:**

**Option 1: Quick Form Submission**
Submit directly via our online form:
{bid_url}

**Option 2: FREE AI-Powered Response Assistant**
Get help from our RFP Respond agent (FREE signup):
https://ezrfp.app/respond?bid_id={bid_id}

With the Respond agent:
✅ Upload previous proposals and bids
✅ Get AI assistance writing your response
✅ Track all your RFPs in one place
✅ Save time on future opportunities

Completely free - no credit card required!

**Key Requirements:**
{bullet_point_requirements}

**Submission Deadline:** {deadline_date}
**Estimated Project Value:** {budget_range} (if applicable)
**Expected Start Date:** {start_date} (if applicable)

**Questions?** 
Contact: {buyer_contact_name}
Email: {buyer_contact_email}
Phone: {buyer_contact_phone}

We look forward to reviewing your proposal.

Best regards,
{organization_name} Procurement Team
```

**Follow-Up Email Template (No Response):**
```markdown
Subject: Follow-up: RFP #{rfp_number} - {rfp_title}

Dear {vendor_name},

We're following up on our RFP invitation sent on {original_date}. We haven't yet received your bid and wanted to ensure you have everything needed to respond.

**Quick Reminder - Two Ways to Submit:**

**Option 1: Direct Form**
{bid_url}

**Option 2: Get FREE Help from Our Respond Agent**
https://ezrfp.app/respond?bid_id={bid_id}

Many suppliers find our free Respond agent helpful because you can:
- Upload previous proposals to speed up your response
- Get AI assistance with bid writing
- Track multiple RFPs in one dashboard
- No signup fees or credit card required

**Submission Deadline:** {deadline} ({days_remaining} days remaining)

If you have questions or need any clarification, please don't hesitate to reach out.

Best regards,
{company_name} Procurement Team
```

**Follow-Up Email Template (Incomplete Submission):**
```markdown
Subject: Complete Your Bid - RFP #{rfp_number}

Dear {vendor_name},

Thank you for starting your bid submission! We noticed you haven't completed it yet.

**Complete Your Bid:**

**Via Form:**
{bid_url}

**OR Get FREE AI Assistance:**
https://ezrfp.app/respond?bid_id={bid_id}

Our free Respond agent can help you:
- Complete your bid faster with AI assistance
- Upload previous proposals for reference
- Track submission status

Deadline: {deadline} ({days_remaining} days remaining)

Need help? Reply to this email anytime.

Best regards,
{company_name} Procurement Team
```

**Markdown to HTML Conversion Requirements:**

When sending emails, ALWAYS convert markdown to HTML:
```javascript
// Convert markdown email content to HTML
const htmlContent = convertMarkdownToHTML(markdownContent);

await send_email({
  to: [vendorEmail],
  subject: extractSubject(markdownContent),
  body_text: markdownContent,  // Plain text fallback
  body_html: htmlContent        // Rich formatting - REQUIRED
});
```

**Conversion Rules:**
- `# Header` → `<h1>Header</h1>`
- `## Header` → `<h2>Header</h2>`
- `**bold**` → `<strong>bold</strong>`
- Line breaks → `<p>` tags for paragraphs
- `- item` → `<ul><li>item</li></ul>`
- `1. item` → `<ol><li>item</li></ol>`
- Links `[text](url)` → `<a href="url">text</a>`

**Critical Rules:**
1. NEVER send email without BOTH submission options
2. ALWAYS include /respond link with bid_id parameter
3. ALWAYS mention "FREE" and "no credit card required"
4. ALWAYS list Respond agent benefits
5. Use professional tone but friendly language
6. Include specific deadline dates
7. Provide clear contact information

**Metadata:**
```json
{
  "knowledge_id": "sourcing-email-invitation-template",
  "category": "communication",
  "importance": 0.95,
  "tags": ["email", "templates", "invitations", "communication"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "sourcing-email-invitation-template",
  "category": "communication",
  "importance": 0.95,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-email-invitation-template'
);

-- Vendor Criteria Best Practices
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**Common Vendor Qualification Criteria:**

**1. Certifications & Compliance**
- GSA Schedule (federal government)
- ISO 9001 (quality management)
- ISO 14001 (environmental)
- Minority/Women-owned Business Enterprise (MBE/WBE)
- Small Business Administration (SBA)
- Industry-specific certifications (e.g., UL, FDA, OSHA)

**2. Geographic Coverage**
- Local (city/county)
- Regional (multi-state)
- National (US-wide)
- International capabilities
- Service area limitations
- Shipping/delivery zones

**3. Capability Requirements**
- Minimum production capacity
- Lead time/delivery speed
- Quality control processes
- Technical support availability
- Warranty/guarantee terms
- Installation services
- Maintenance/ongoing support

**4. Financial & Business**
- Years in business
- Company size (employees, revenue)
- Financial stability indicators
- Insurance coverage
- Bonding capacity (construction/large projects)
- Payment terms flexibility

**5. Experience & Reputation**
- Industry experience (years)
- Similar project history
- Client references available
- Online reviews/ratings
- BBB rating
- Professional affiliations

**How to Qualify Vendors:**

**Minimum Requirements (Must Have):**
- Valid contact information
- Operates in required geography
- Offers required product/service
- Meets mandatory certifications

**Preferred Requirements (Nice to Have):**
- Industry certifications
- Established reputation
- Quick delivery capabilities
- Competitive pricing
- Additional services (support, training)

**Disqualifying Factors:**
- No verifiable contact info
- Outside service area
- Missing critical certifications
- Poor reputation/reviews
- Doesn't meet minimum capacity

**Metadata:**
```json
{
  "knowledge_id": "sourcing-vendor-criteria-best-practices",
  "category": "validation",
  "importance": 0.80,
  "tags": ["criteria", "qualifications", "best-practices"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "sourcing-vendor-criteria-best-practices",
  "category": "validation",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-vendor-criteria-best-practices'
);

-- Memory Management for Sourcing
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**What to Store in Memory During Sourcing:**

**1. Vendor Research Results**
```javascript
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `Researched ${vendorCount} vendors for ${rfpName}. Sources: ${citations}`,
  importance_score: 0.8,
  metadata: {
    knowledge_id: "vendor-research-results",
    rfp_id: rfpId,
    vendor_count: vendorCount
  }
});
```

**2. User Vendor Preferences**
```javascript
await create_memory({
  sessionId,
  memory_type: "decision",
  content: `User prefers ${preferences} for vendor selection`,
  importance_score: 0.85,
  metadata: {
    knowledge_id: "vendor-preferences",
    preference_type: "selection-criteria"
  }
});
```

**3. Email Send Confirmations**
```javascript
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `Sent RFP invitations to ${selectedCount} vendors: ${vendorNames}`,
  importance_score: 0.9,
  metadata: {
    knowledge_id: "email-send-record",
    rfp_id: rfpId,
    send_date: new Date().toISOString()
  }
});
```

**4. Vendor Selection Decisions**
```javascript
await create_memory({
  sessionId,
  memory_type: "decision",
  content: `Selected vendors: ${selectedVendors}. Reason: ${selectionReason}`,
  importance_score: 0.9,
  metadata: {
    knowledge_id: "vendor-selection-decision",
    selection_method: "form-submission"
  }
});
```

**5. Research Strategy Notes**
```javascript
await create_memory({
  sessionId,
  memory_type: "context",
  content: `Used Perplexity research strategy: ${strategyDetails}`,
  importance_score: 0.7,
  metadata: {
    knowledge_id: "research-methodology"
  }
});
```

**Memory Search Best Practices:**

**Before Starting Vendor Discovery:**
```javascript
const context = await search_memories({
  query: "vendor requirements criteria preferences certifications",
  memory_types: ["fact", "decision", "context"],
  limit: 5
});
```

**Before Sending Emails:**
```javascript
const emailHistory = await search_memories({
  query: "email sent invitations vendors contacted",
  memory_types: ["fact"],
  limit: 3
});
// Check if already sent to avoid duplicates
```

**Importance Score Guidelines:**
- 1.0: Critical decisions (final vendor selection)
- 0.9: Major actions (emails sent, vendors contacted)
- 0.8: Research results (vendor discovery findings)
- 0.7: Methodology notes (how research was done)
- 0.6: Minor context (search queries used)

**Metadata:**
```json
{
  "knowledge_id": "sourcing-memory-management",
  "category": "best-practices",
  "importance": 0.75,
  "tags": ["memory", "storage", "tracking"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.75,
  '{
  "knowledge_id": "sourcing-memory-management",
  "category": "best-practices",
  "importance": 0.75,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-memory-management'
);

-- Error Handling & Professional Responses
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**How to Handle Common Sourcing Errors Professionally:**

**1. No RFP Context Found**

**Technical Error:**
```
Error: No current RFP set for session
```

**Professional Response:**
```
I don't see an active RFP yet. Let me connect you with the RFP Design agent to create your RFP package first.

[Switch to RFP Design agent](prompt:complete)
[Tell me about your procurement needs](prompt:complete)
```

**2. Missing Bid Form or Email Template**

**Technical Issue:** Artifacts missing

**Professional Response:**
```
I see your RFP for [name], but the package needs:
❌ Supplier Bid Form
❌ RFP Request Email

These are created by the RFP Design agent. Would you like me to switch you over to complete them?

[Switch to RFP Design agent](prompt:complete)
```

**3. Email Send Failure**

**Technical Error:**
```
Error: Email delivery failed
```

**Professional Response:**
```
I encountered an issue sending the invitation emails. This might be a temporary issue.

Let me try again, or you can:
[Retry sending emails](prompt:complete)
[Contact Support for help](prompt:complete)
[Review vendor list first](prompt:complete)
```

**4. No Vendors Found in Research**

**Technical Issue:** Perplexity returned no results

**Professional Response:**
```
I couldn't find vendors matching those exact criteria. Let's try:

1. Broaden the geographic area
2. Adjust certification requirements
3. Try different product/service keywords

[Broaden search criteria](prompt:complete)
[Tell me more about what you need](prompt:open)
```

**5. Invalid Vendor Contact Information**

**Technical Issue:** Email validation failed

**Professional Response:**
```
I found some promising vendors, but a few are missing verified contact emails. I've included them in the list so you can manually look up their contact information if interested.

[Review vendor list](prompt:complete)
[Find more vendors](prompt:complete)
```

**6. Form Submission Processing Error**

**Technical Error:**
```
Error: Unable to read form submission
```

**Professional Response:**
```
I'm having trouble reading the vendor selections. Could you please:

[Resubmit the form](prompt:complete)
[Or tell me which vendors to contact](prompt:open)
```

**General Error Handling Principles:**

- ✅ Use friendly, professional language
- ✅ Offer actionable next steps
- ✅ Provide suggested prompts for quick recovery
- ✅ Never expose technical error messages
- ✅ Stay helpful and solution-oriented
- ❌ Don't blame user or system
- ❌ Don't use technical jargon
- ❌ Don't leave user stuck

**Metadata:**
```json
{
  "knowledge_id": "sourcing-error-handling",
  "category": "troubleshooting",
  "importance": 0.85,
  "tags": ["errors", "troubleshooting", "communication"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "sourcing-error-handling",
  "category": "troubleshooting",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-error-handling'
);

-- Agent Handoff Scenarios
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**When to Switch TO Sourcing Agent:**

**From RFP Design Agent:**
- User says: "ready to find vendors", "let's source suppliers", "who should I invite?"
- Trigger: RFP package complete (bid form + email template exist)
- Action: RFP Design recommends Sourcing agent

**From Solutions Agent:**
- User asks: "how do I invite vendors?", "vendor discovery process?"
- Context: User learning about platform capabilities
- Action: Solutions recommends trying Sourcing agent with sample RFP

**From Support Agent:**
- User issue: Email authentication problems resolved
- Context: Can now proceed with vendor outreach
- Action: Support suggests returning to Sourcing

**When to Switch FROM Sourcing Agent:**

**To RFP Design Agent:**
- Scenario: No RFP exists
- User says: "create an RFP first", "I need a bid form"
- Missing: Bid form or email template artifacts

**To Support Agent:**
- Scenario: Technical issues with email system
- User says: "emails not sending", "authentication error"
- Errors: Email delivery failures, authentication problems

**To Solutions Agent:**
- Scenario: Platform questions, feature explanations
- User asks: "how does pricing work?", "what's included?"
- Context: Needs platform information, not sourcing help

**Handoff Best Practices:**

1. **Always Explain Why**
   ```
   "I'll connect you with the RFP Design agent who specializes in creating bid forms and email templates."
   ```

2. **Provide Suggested Prompts**
   ```
   [Switch to RFP Design agent](prompt:complete)
   [Stay here and tell me more](prompt:complete)
   ```

3. **Set Expectations**
   ```
   "Once the RFP package is ready, come back to me and I'll help find vendors!"
   ```

4. **Store Handoff Context**
   ```javascript
   await create_memory({
     sessionId,
     memory_type: "context",
     content: `Switched to ${targetAgent} because ${reason}`,
     importance_score: 0.7
   });
   ```

**Metadata:**
```json
{
  "knowledge_id": "sourcing-agent-handoffs",
  "category": "workflow",
  "importance": 0.80,
  "tags": ["handoffs", "agent-switching", "workflow"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "sourcing-agent-handoffs",
  "category": "workflow",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-agent-handoffs'
);

-- Vendor Selection Form Creation
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
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcing_agentknowledgebase_20251122213721$**Complete Vendor Selection Form Schema:**

**JSON Schema:**
```json
{
  "type": "object",
  "title": "Vendor Selection for [RFP Name]",
  "properties": {
    "select_all": {
      "type": "boolean",
      "title": "Select All Vendors",
      "default": false
    },
    "vendors": {
      "type": "array",
      "title": "Available Vendors",
      "items": {
        "type": "object",
        "properties": {
          "selected": {
            "type": "boolean",
            "title": "✓ Select",
            "default": false
          },
          "vendor_name": {
            "type": "string",
            "title": "Vendor Name"
          },
          "contact_email": {
            "type": "string",
            "title": "Contact Email",
            "format": "email"
          },
          "contact_phone": {
            "type": "string",
            "title": "Phone"
          },
          "website": {
            "type": "string",
            "title": "Website",
            "format": "uri"
          },
          "capabilities": {
            "type": "string",
            "title": "Capabilities Summary"
          }
        },
        "required": []
      }
    },
    "notes": {
      "type": "string",
      "title": "Additional Notes (Optional)"
    }
  }
}
```

**UI Schema:**
```json
{
  "select_all": {
    "ui:widget": "checkbox",
    "ui:help": "Check to select all vendors below"
  },
  "vendors": {
    "ui:options": {
      "orderable": false,
      "addable": false,
      "removable": false
    },
    "items": {
      "ui:order": ["selected", "vendor_name", "contact_email", "contact_phone", "website", "capabilities"],
      "selected": {
        "ui:widget": "checkbox",
        "ui:label": true
      },
      "vendor_name": {
        "ui:readonly": true
      },
      "contact_email": {
        "ui:readonly": true
      },
      "contact_phone": {
        "ui:readonly": true
      },
      "website": {
        "ui:readonly": true
      },
      "capabilities": {
        "ui:widget": "textarea",
        "ui:readonly": true,
        "ui:options": {
          "rows": 2
        }
      }
    }
  },
  "notes": {
    "ui:widget": "textarea",
    "ui:placeholder": "Add any special instructions for vendor outreach...",
    "ui:options": {
      "rows": 3
    }
  }
}
```

**Default Values Structure:**
```json
{
  "select_all": false,
  "vendors": [
    {
      "selected": false,
      "vendor_name": "Example Vendor Corp",
      "contact_email": "contact@example.com",
      "contact_phone": "555-123-4567",
      "website": "https://www.example.com",
      "capabilities": "Brief capabilities summary including certifications and specialties"
    }
  ],
  "notes": ""
}
```

**Critical Implementation Notes:**

1. **Field Order Matters:** The "selected" field MUST be first in both:
   - JSON schema properties (for data structure)
   - UI schema ui:order array (for display order)
   This ensures checkbox appears as leftmost column

2. **Read-Only Fields:** All vendor data fields except "selected" and "notes" should be read-only

3. **Artifact Role:** MUST use `vendor_selection_form` (exact string)

4. **Type:** MUST be `form` not `document`

5. **Citations:** Include research sources in artifact description field

**Complete Implementation:**
```javascript
await create_form_artifact({
  name: `Vendor Selection for ${rfpName}`,
  description: `Found ${vendorCount} qualified vendors via Perplexity research. Sources: ${citations}`,
  content: {
    type: "object",
    title: `Vendor Selection for ${rfpName}`,
    properties: { /* schema above */ }
  },
  uiSchema: { /* ui schema above */ },
  defaultValues: {
    select_all: false,
    vendors: vendorsArray,
    notes: ""
  },
  artifactRole: "vendor_selection_form"
});
```

**Metadata:**
```json
{
  "knowledge_id": "sourcing-vendor-selection-form",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["forms", "vendor-selection", "artifacts"]
}
```$kb_sourcing_agentknowledgebase_20251122213721$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "sourcing-vendor-selection-form",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-vendor-selection-form'
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
  AND metadata->>'knowledge_id' IN ('sourcing-vendor-requirements-workflow', 'sourcing-perplexity-discovery', 'sourcing-email-invitation-template', 'sourcing-vendor-criteria-best-practices', 'sourcing-memory-management', 'sourcing-error-handling', 'sourcing-agent-handoffs', 'sourcing-vendor-selection-form')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';

-- Knowledge Base: sourcing-agent-knowledge-base
-- Generated on 2025-10-31T15:41:34.250Z
-- Source: sourcing-agent-knowledge-base.md
-- Entries: 8

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
  (SELECT id FROM accounts LIMIT 1),
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_sourcingagentknowledgebase_20251031154134$Complete step-by-step procedure for discovering and documenting vendor selection criteria before beginning vendor research.

**WHY THIS EXISTS:**
Effective vendor discovery requires clear criteria. Without understanding requirements, we waste time researching unsuitable vendors. This workflow ensures we gather comprehensive vendor criteria first.

**WHAT TO DO:**
1. Search memories for existing vendor criteria
2. If found, confirm and update
3. If not found, systematically ask user about requirements
4. Store criteria in memory for future use

**HOW TO DO IT:**

### Step 1: Search for Existing Criteria
```
search_memories({
  query: "vendor requirements supplier criteria certifications qualifications geographic preferences",
  memory_types: "preference,decision,fact",
  limit: 10
})
```

### Step 2: If Criteria Found
- Summarize existing criteria to user
- Ask: "Are these vendor requirements still accurate, or have your needs changed?"
- Update memory if changes needed

### Step 3: If NO Criteria Found
Ask user systematically about:

**Certifications & Compliance:**
- "Do you require any specific certifications? (e.g., GSA Schedule, ISO 9001, industry-specific)"
- "Any mandatory compliance requirements? (e.g., OSHA, FDA, environmental)"

**Geographic Preferences:**
- "Any geographic preferences? Local, regional, national, or international?"
- "Shipping/delivery constraints?"

**Company Qualifications:**
- "Minimum company size or years in business?"
- "Required experience level in this product/service area?"

**Capabilities:**
- "Any specialized capabilities required? (e.g., custom manufacturing, 24/7 support)"
- "Minimum capacity or volume requirements?"

**Budget & Pricing:**
- "Budget tier? (enterprise-level, mid-market, budget-conscious)"
- "Payment terms preferences? (Net 30, credit card, etc.)"

**Delivery & Logistics:**
- "Lead time requirements?"
- "Installation or setup services needed?"
- "Ongoing support or maintenance requirements?"

### Step 4: Store Vendor Criteria Memory
```json
{
  "content": "Vendor requirements for [RFP Name]: [detailed list of all requirements gathered]",
  "memory_type": "preference",
  "importance_score": 0.85,
  "reference_type": "rfp",
  "reference_id": "[current RFP ID]"
}
```

**Example Complete Criteria:**
```
Vendor requirements for Office LED Lighting Procurement:
- Certification: Energy Star certified products required
- Geographic: US-based suppliers preferred, willing to consider Canada
- Company: Minimum 5 years in commercial lighting industry
- Capabilities: Must provide installation support or recommendations
- Budget: Mid-market tier, target $10-15 per bulb
- Delivery: 30-day maximum lead time
- Minimum Order: Willing to fulfill 100-unit orders
```

**Metadata:**
```json
{
  "knowledge_id": "vendor-requirements-workflow",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["vendor-discovery", "requirements", "criteria", "sourcing"]
}
```

**Relations:**
- relates_to: perplexity-vendor-discovery
- prerequisite: rfp-context-verification$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "vendor-requirements-workflow",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'vendor-requirements-workflow'
);

-- Perplexity Vendor Discovery Strategies
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
  $kb_sourcingagentknowledgebase_20251031154134$Comprehensive guide for using Perplexity tools effectively to discover, research, and qualify vendors for RFP opportunities.

**WHY THIS EXISTS:**
Perplexity tools are powerful but require strategic use for optimal vendor discovery. This guide ensures consistent, thorough vendor research.

**TOOL SELECTION STRATEGY:**

### perplexity_search - Quick Vendor Listings
**WHEN TO USE:** Initial vendor discovery, contact information gathering
**BEST FOR:** Finding vendor lists, industry directories, contact details
**PARAMETERS:**
```json
{
  "query": "[product/service] suppliers [location] [key requirement] contact information",
  "recency_filter": "month",
  "return_related_questions": true
}
```

**EXAMPLE QUERIES:**
- "LED lighting suppliers California GSA certified contact email"
- "Office furniture manufacturers midwest region B2B sales contacts"
- "Medical device distributors Texas FDA approved directory"

### perplexity_research - Deep Vendor Analysis
**WHEN TO USE:** Comprehensive supplier evaluation, market analysis
**BEST FOR:** Detailed vendor capabilities, competitive analysis, market landscape
**PARAMETERS:**
```json
{
  "query": "Comprehensive analysis of [product/service] vendors with [requirements] in [location] including capabilities, certifications, and reputation",
  "search_recency_filter": "month"
}
```

**EXAMPLE QUERIES:**
- "Comprehensive analysis of commercial LED lighting suppliers in California with Energy Star certification and GSA schedule"
- "Detailed comparison of office furniture manufacturers in the midwest with sustainability certifications"

### perplexity_ask - Specific Vendor Questions
**WHEN TO USE:** Quick questions about specific vendors or requirements
**BEST FOR:** Verifying vendor capabilities, checking certifications, pricing inquiries
**PARAMETERS:**
```json
{
  "query": "What are the top [product/service] vendors with [specific requirement]?",
  "search_recency_filter": "month"
}
```

**EXAMPLE QUERIES:**
- "What LED lighting suppliers have both Energy Star and GSA certification?"
- "Which office furniture vendors offer bulk discounts for 50+ unit orders?"

### perplexity_reason - Vendor Comparison & Recommendation
**WHEN TO USE:** Comparing multiple vendors, trade-off analysis
**BEST FOR:** Vendor selection recommendations, pros/cons analysis
**PARAMETERS:**
```json
{
  "query": "Compare [Vendor A] vs [Vendor B] vs [Vendor C] for [specific use case] considering [key criteria]"
}
```

**EXAMPLE QUERIES:**
- "Compare Philips vs GE vs Cree for commercial LED office lighting considering cost, energy efficiency, and warranty"
- "Evaluate pros and cons of local vs national suppliers for 500-unit office chair procurement"

### RESEARCH WORKFLOW:

**Phase 1: Broad Discovery (5-10 minutes)**
1. Use `perplexity_search` with broad query to get initial vendor list
2. Scan for 10-15 potential vendors
3. Note contact information and websites

**Phase 2: Deep Research (10-15 minutes)**
1. Use `perplexity_research` for detailed analysis of top candidates
2. Verify certifications and capabilities
3. Check company reputation and reviews

**Phase 3: Specific Verification (5 minutes)**
1. Use `perplexity_ask` for specific questions about top 8-10 vendors
2. Verify contact information currency
3. Check for recent business activity

**Phase 4: Final Selection (5 minutes)**
1. Use `perplexity_reason` to compare top candidates
2. Select final 5-8 vendors to present to user

### INFORMATION TO GATHER:

**Essential (Required):**
- Official company name
- Primary contact email (sales@, info@, or named contact)
- Website URL
- Brief capabilities summary

**Important (Highly Desired):**
- Phone number
- Physical address or headquarters location
- Relevant certifications
- Years in business

**Nice to Have (Optional):**
- Recent customer reviews or testimonials
- Pricing tier indicators
- Notable clients or projects
- Social media presence

### QUALITY CHECKS:

**Verify Contact Information:**
- Cross-check email format (sales@domain.com is better than generic info@)
- Confirm website is active and professional
- Look for recent website updates (indicates active business)

**Assess Credibility:**
- Check for professional website presence
- Look for third-party validation (reviews, news mentions)
- Verify certifications claimed
- Check for Better Business Bureau or industry association membership

**Diversify Selection:**
- Mix of company sizes (enterprise and mid-market)
- Geographic diversity if appropriate
- Price tier variety
- Different specializations or niches

**Metadata:**
```json
{
  "knowledge_id": "perplexity-vendor-discovery",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["perplexity", "vendor-research", "supplier-discovery", "tool-usage"]
}
```

**Relations:**
- relates_to: vendor-requirements-workflow
- relates_to: vendor-presentation-workflow$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "perplexity-vendor-discovery",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'perplexity-vendor-discovery'
);

-- Email Development Mode Routing
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
  $kb_sourcingagentknowledgebase_20251031154134$Critical safety feature that routes non-whitelisted emails back to sender for review, preventing accidental vendor contact during development and demos.

**WHY THIS EXISTS:**
During development and demonstrations, we cannot send real emails to external vendors. This could cause:
- Embarrassment from test/demo content
- Confusion for vendors who receive unexpected inquiries
- Legal/compliance issues with unsolicited contact
- Reputational damage to platform

Development mode routing allows safe email testing while preserving workflow.

**HOW IT WORKS:**

### Email Routing Decision Tree:

```
1. Check if recipient email is whitelisted
   ├─ YES → Send email directly to recipient (normal flow)
   └─ NO → Redirect email to sender with routing notice

2. If redirecting:
   ├─ Change TO address to sender's email
   ├─ Prepend routing notice to email body
   └─ Send email
```

### Whitelist Check Procedure:

**Step 1: Get Recipient Email**
```javascript
const recipientEmail = vendor.email;  // e.g., "supplier@example.com"
```

**Step 2: Check Against Whitelist**
Search knowledge for whitelist:
```json
{
  "query": "email whitelist configuration whitelisted addresses domains",
  "memory_types": "knowledge",
  "limit": 1
}
```

**Default Whitelisted:**
- **Domains:** @rfpez.ai, @esphere.com
- **Specific Emails:** mskiba@esphere.com, agent@rfpez.ai

**Step 3: Apply Logic**
```javascript
function isWhitelisted(email) {
  // Check specific emails
  const whitelistedEmails = ['mskiba@esphere.com', 'agent@rfpez.ai'];
  if (whitelistedEmails.includes(email.toLowerCase())) {
    return true;
  }
  
  // Check whitelisted domains
  const whitelistedDomains = ['@rfpez.ai', '@esphere.com'];
  for (const domain of whitelistedDomains) {
    if (email.toLowerCase().endsWith(domain)) {
      return true;
    }
  }
  
  return false;
}
```

### Routing Notice Format:

**CRITICAL:** When redirecting email, PREPEND this exact notice to body:

```
⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️
This email was originally intended for: [original recipient email]

In development mode, all non-whitelisted emails are routed back to you for review.
To send this email to the actual recipient, add their address to the whitelist or switch to production mode.

---ORIGINAL EMAIL BELOW---

```

### Complete Send Email Workflow:

```javascript
// Example workflow
const vendor = {
  name: "Acme Lighting Supply",
  email: "sales@acmelighting.com"
};

// Step 1: Check whitelist
const isWhitelisted = checkWhitelist(vendor.email);

// Step 2: Determine recipient
const recipientEmail = isWhitelisted ? vendor.email : currentUser.email;

// Step 3: Prepare email body
let emailBody = composeInvitationEmail(rfp, vendor);

if (!isWhitelisted) {
  // Prepend routing notice
  const routingNotice = `
⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️
This email was originally intended for: ${vendor.email}

In development mode, all non-whitelisted emails are routed back to you for review.
To send this email to the actual recipient, add their address to the whitelist or switch to production mode.

---ORIGINAL EMAIL BELOW---

`;
  emailBody = routingNotice + emailBody;
}

// Step 4: Send email
send_email({
  to: [recipientEmail],
  subject: `Invitation to Bid - ${rfp.name}`,
  body_text: emailBody
});

// Step 5: Inform user
if (!isWhitelisted) {
  informUser(`Email to ${vendor.name} was sent to your email for review (development mode).`);
} else {
  informUser(`Email sent directly to ${vendor.name} at ${vendor.email}.`);
}
```

### User Communication:

**ALWAYS explain development mode to user BEFORE sending bulk emails:**

"Since we're in development mode, emails to vendors will be sent to your email address for review. This protects against accidental vendor contact during testing and demonstrations.

I'll prepare invitations for your selected vendors. The emails will come to you, and each will show the vendor it was originally intended for. When you're ready to actually contact these vendors, we can add their addresses to the whitelist or switch to production mode."

**AFTER sending, summarize:**

"I've sent [X] invitation emails to your email address for review:
- [Vendor A] (sales@vendora.com)
- [Vendor B] (info@vendorb.com)
- [Vendor C] (contact@vendorc.com)

Each email shows the vendor it's intended for. Review them, and let me know if you'd like me to help configure the whitelist for actual sending."

**Metadata:**
```json
{
  "knowledge_id": "development-mode-email-routing",
  "category": "workflow",
  "importance": 0.95,
  "tags": ["email", "safety", "development-mode", "routing", "whitelist"]
}
```

**Relations:**
- relates_to: email-whitelist-configuration
- relates_to: email-invitation-workflow$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "development-mode-email-routing",
  "category": "workflow",
  "importance": 0.95,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'development-mode-email-routing'
);

-- Email Whitelist Configuration
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
  $kb_sourcingagentknowledgebase_20251031154134$Configuration details for email whitelist system that determines which addresses can receive direct emails vs redirected emails.

**Default Configuration:**

### Whitelisted Domains:
- **@rfpez.ai** - Internal testing and platform emails
- **@esphere.com** - Development team domain

### Whitelisted Email Addresses:
- **mskiba@esphere.com** - Primary development/test account
- **agent@rfpez.ai** - Platform agent email

### Adding to Whitelist (Future Feature):
When user needs to whitelist new addresses:
1. Store in configuration table or environment variable
2. Format: comma-separated list or JSON array
3. Validate email format before adding
4. Confirm addition to user

**Example whitelist storage:**
```json
{
  "whitelisted_domains": ["@rfpez.ai", "@esphere.com"],
  "whitelisted_emails": ["mskiba@esphere.com", "agent@rfpez.ai", "supplier@trustedvendor.com"]
}
```

### Production Mode Override:
When system is in production mode:
- ALL emails sent directly (bypass whitelist check)
- No routing notices added
- Normal email delivery flow

**Configuration Flag:**
```
ENVIRONMENT_MODE = "development"  // or "production"
```

**Metadata:**
```json
{
  "knowledge_id": "email-whitelist-configuration",
  "category": "best-practices",
  "importance": 0.85,
  "tags": ["email", "whitelist", "configuration", "safety"]
}
```

**Relations:**
- relates_to: development-mode-email-routing
- relates_to: email-invitation-workflow$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "email-whitelist-configuration",
  "category": "workflow",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'email-whitelist-configuration'
);

-- Vendor Presentation Workflow
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
  $kb_sourcingagentknowledgebase_20251031154134$Procedure for presenting vendor research findings to user in a professional, organized, and selectable format using document artifacts.

**WHY THIS EXISTS:**
After vendor research, we need to present findings in a way that:
- Is easy to review and compare
- Allows user to select vendors to contact
- Provides all necessary information for decision-making
- Maintains professional presentation

**ARTIFACT FORMAT:**

### Vendor List Document Artifact:

**Artifact Properties:**
```json
{
  "name": "Vendor Candidates for [RFP Name]",
  "artifactRole": "vendor_list",
  "type": "document"
}
```

**Content Format (Markdown Table):**
```markdown
# Vendor Candidates for [RFP Name]

Below are qualified vendors matching your requirements for [brief RFP description].$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "vendor-presentation-workflow",
  "category": "workflow",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'vendor-presentation-workflow'
);

-- Email Invitation Workflow
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
  $kb_sourcingagentknowledgebase_20251031154134$Complete procedure for composing and sending professional RFP invitation emails to selected vendors with development mode safety features.

**PREREQUISITES:**
- Active RFP context
- Supplier bid form created (for bid URL)
- Vendor list presented and user has made selection
- User confirmation to proceed

**EMAIL COMPOSITION:**

### Standard RFP Invitation Template:

```
Subject: Invitation to Bid - [RFP Title]

Dear [Vendor Name] Team,

We are reaching out to invite you to submit a bid for our upcoming procurement opportunity:

**RFP Title:** [RFP Name]
**Organization:** [User's organization or RFPEZ.AI user]
**Description:** [Brief 2-3 sentence description of what's being procured]
**Submission Deadline:** [Due date if specified, or "Open until filled"]

**Bid Submission Link:** [Bid URL from generate_rfp_bid_url]

[OPTIONAL: Key requirements section]
Key Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

To submit your proposal, please use the bid submission link above. The form will guide you through providing your pricing, delivery details, and company information.

If you have any questions about this RFP, please reply to this email and we'll be happy to assist.

We look forward to receiving your bid.

Best regards,
[User's name/organization]
via RFPEZ.AI Procurement Platform
```

### Email Sending Workflow:

**Step 1: Gather Information**
```javascript
// Get RFP details
const rfp = await get_current_rfp();

// Get bid URL
const bidUrl = await generate_rfp_bid_url({ rfp_id: rfp.id });

// Get user's organization (from profile or RFP metadata)
const organization = user.organization || "RFPEZ.AI Platform User";
```

**Step 2: Compose Email for Each Vendor**
```javascript
for (const vendor of selectedVendors) {
  const emailBody = composeInvitation({
    rfp,
    vendor,
    bidUrl,
    organization
  });
  
  // Check whitelist
  const recipient = isWhitelisted(vendor.email) ? vendor.email : user.email;
  
  // Add routing notice if redirected
  if (recipient === user.email) {
    emailBody = addRoutingNotice(emailBody, vendor.email);
  }
  
  // Send email
  await send_email({
    to: [recipient],
    subject: `Invitation to Bid - ${rfp.name}`,
    body_text: emailBody
  });
}
```

**Step 3: Store Memory**
```javascript
create_memory({
  content: `Sent RFP invitation emails for "${rfp.name}" to vendors: ${vendorNames.join(', ')}`,
  memory_type: "decision",
  importance_score: 0.8,
  reference_type: "rfp",
  reference_id: rfp.id
});
```

**Step 4: Confirm to User**
```
"I've sent RFP invitations for '[RFP Name]' to [X] vendors:

[IF NOT WHITELISTED]
Since we're in development mode, these emails were sent to your email address for review:
- [Vendor A] (sales@vendora.com)
- [Vendor B] (info@vendorb.com)
- [Vendor C] (contact@vendorc.com)

Each email shows the original intended recipient. You can review them and forward manually if needed, or we can configure the whitelist for direct sending.

[IF WHITELISTED]
The following vendors received invitation emails directly:
- [Vendor A] - sent to sales@vendora.com
- [Vendor B] - sent to info@vendorb.com  
- [Vendor C] - sent to contact@vendorc.com

You can track responses by searching your email for replies, or I can help you monitor for incoming bids in the system.
"
```

### Handling Missing Bid URL:

**If bid URL doesn't exist:**
```
"I notice the supplier bid form hasn't been set up with a submission URL yet. I can:

1. Help you coordinate with the RFP Design agent to generate the bid URL
2. Draft the invitation emails now and send them once the URL is ready
3. Pause here while you finalize the bid form

What would you prefer?"
```

### Follow-up Suggestions:

After sending, offer:
```
"Would you like me to:
- Set a reminder to check for responses in a few days?
- Help you create a tracking system for bids as they come in?
- Search your email periodically for vendor replies?"
```

**Metadata:**
```json
{
  "knowledge_id": "email-invitation-workflow",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["email", "invitations", "rfp", "vendors", "sending"]
}
```

**Relations:**
- relates_to: development-mode-email-routing
- relates_to: vendor-presentation-workflow
- prerequisite: rfp-context-verification$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "email-invitation-workflow",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'email-invitation-workflow'
);

-- Vendor Selection Best Practices
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
  $kb_sourcingagentknowledgebase_20251031154134$Guidelines for helping users select appropriate vendors and determine how many vendors to contact for competitive bidding.

**OPTIMAL VENDOR COUNT:**
- **Minimum:** 3 vendors (establishes competition)
- **Recommended:** 5-8 vendors (good competition without overwhelming)
- **Maximum:** 12 vendors (beyond this, response rates typically drop)

**SELECTION CRITERIA GUIDANCE:**

### Small Procurements (< $10,000):
- 3-5 vendors sufficient
- Focus on local/regional suppliers
- Prioritize quick response capability
- Consider established relationships

### Medium Procurements ($10,000 - $100,000):
- 5-8 vendors recommended
- Mix of local and national suppliers
- Require specific certifications/qualifications
- Balance price with quality

### Large Procurements (> $100,000):
- 8-12 vendors appropriate
- National scope, possibly international
- Strict qualification requirements
- Formal evaluation criteria

**DIVERSITY CONSIDERATIONS:**

### Company Size Diversity:
- Mix enterprise vendors (stability, capacity)
- Include mid-market vendors (flexibility, service)
- Consider small businesses (competitive pricing, agility)

### Geographic Diversity:
- Local vendors (shipping costs, site visits, relationships)
- Regional vendors (balance of proximity and choice)
- National vendors (scale, consistency, support)

### Specialization Mix:
- Specialists (deep expertise, quality)
- Generalists (convenience, one-stop-shop)
- Niche players (unique capabilities)

**USER GUIDANCE PROMPTS:**

When user is unsure how many vendors to contact:
```
"For a procurement of this size ([estimated value or scope]), I'd recommend contacting [X-Y] vendors. This provides:
- Competitive pressure for better pricing
- Multiple options to compare
- Backup options if vendors decline

Would you like me to focus on [more/fewer] vendors, or does that sound about right?"
```

When discussing vendor mix:
```
"I found vendors ranging from [large/national] suppliers like [Example A] to [smaller/local] options like [Example B]. 

Would you prefer:
- A mix of different sized vendors for diverse options?
- Focus on [large/small] vendors specifically?
- Only vendors with specific capabilities like [capability]?"
```

**Metadata:**
```json
{
  "knowledge_id": "vendor-selection-best-practices",
  "category": "best-practices",
  "importance": 0.75,
  "tags": ["vendor-selection", "best-practices", "sourcing-strategy"]
}
```

**Relations:**
- relates_to: vendor-requirements-workflow
- relates_to: perplexity-vendor-discovery$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.75,
  '{
  "knowledge_id": "vendor-selection-best-practices",
  "category": "best-practices",
  "importance": 0.75,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'vendor-selection-best-practices'
);

-- Supplier Research Patterns
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
  $kb_sourcingagentknowledgebase_20251031154134$Common research patterns and strategies for different types of procurement categories.

**COMMODITY PRODUCTS (standard items):**
- Use broad perplexity_search queries
- Focus on price and availability
- Prioritize established distributors
- Verify inventory/stock levels

**SPECIALIZED EQUIPMENT:**
- Use perplexity_research for detailed analysis
- Focus on technical capabilities
- Verify certifications and compliance
- Check manufacturer vs distributor

**SERVICES:**
- Use perplexity_reason for capability comparison
- Focus on experience and references
- Verify licensing and insurance
- Check service area coverage

**CUSTOM/MANUFACTURED PRODUCTS:**
- Deep research on manufacturing capabilities
- Verify quality certifications
- Check production capacity
- Evaluate customization flexibility

**INDUSTRY-SPECIFIC PATTERNS:**

### Healthcare/Medical:
- FDA approval status critical
- Regulatory compliance verification
- Quality certifications (ISO 13485)
- Hospital/clinical experience

### IT/Technology:
- Technical specifications matching
- Integration capabilities
- Support and maintenance offerings
- Security certifications

### Construction/Industrial:
- Safety certifications (OSHA)
- Bonding and insurance
- Project portfolio
- Union affiliation if relevant

### Professional Services:
- Professional licenses
- Industry association memberships
- Client testimonials
- Specialized expertise areas

**Metadata:**
```json
{
  "knowledge_id": "supplier-research-patterns",
  "category": "best-practices",
  "importance": 0.70,
  "tags": ["research", "sourcing", "industry-specific", "procurement-categories"]
}
```

**Relations:**
- relates_to: perplexity-vendor-discovery
- relates_to: vendor-selection-best-practices$kb_sourcingagentknowledgebase_20251031154134$,
  NULL, -- Embedding will be generated later
  0.7,
  '{
  "knowledge_id": "supplier-research-patterns",
  "category": "best-practices",
  "importance": 0.7,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'supplier-research-patterns'
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
  AND metadata->>'knowledge_id' IN ('vendor-requirements-workflow', 'perplexity-vendor-discovery', 'development-mode-email-routing', 'email-whitelist-configuration', 'vendor-presentation-workflow', 'email-invitation-workflow', 'vendor-selection-best-practices', 'supplier-research-patterns')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';

# Sourcing Agent Knowledge Base# Sourcing Agent Knowledge Base# Sourcing Agent Knowledge Base



## Vendor Requirements Discovery Workflow



### ID: sourcing-vendor-requirements-workflow## Vendor Requirements Discovery Workflow## Vendor Requirements Discovery Workflow

### Type: workflow

### Importance: 0.85

### Category: vendor-discovery

### ID: sourcing-vendor-requirements-workflow### ID: vendor-requirements-workflow

**Content:**

### Type: workflow### Type: knowledge

Complete step-by-step procedure for discovering and documenting vendor selection criteria before beginning vendor research.

### Importance: 0.85### Importance: 0.90

**Step 1: Search Existing Criteria**

```javascript### Category: vendor-discovery### Category: workflow

search_memories({

  query: "vendor requirements supplier criteria certifications qualifications",

  memory_types: ["preference", "decision", "fact"],

  limit: 10**Content:****Content:**

})

```Complete step-by-step procedure for discovering and documenting vendor selection criteria before beginning vendor research.



**Step 2: If Found**Complete workflow for discovering and documenting vendor requirements:

- Summarize the existing criteria

- Ask user: "I see you previously wanted vendors with [criteria]. Are these still your requirements, or would you like to update them?"**WHY THIS EXISTS:**

- If confirmed, proceed to Phase 2 (vendor discovery)

- If changed, update memory and proceed**Step 1: Search Existing Criteria**Effective vendor discovery requires clear criteria. Without understanding requirements, we waste time researching unsuitable vendors. This workflow ensures we gather comprehensive vendor criteria first.



**Step 3: If Not Found - Ask User About:**```javascript

1. **Required certifications**: "What certifications should vendors have?" (e.g., GSA, ISO, industry-specific)

2. **Geographic preferences**: "Do you have location preferences?" (local, regional, national, international)search_memories({**WHAT TO DO:**

3. **Company size or experience**: "Any minimum company size or experience requirements?"

4. **Specific capabilities**: "What special capabilities or specializations do you need?"  query: "vendor requirements supplier criteria certifications qualifications",1. Search memories for existing vendor criteria

5. **Budget tier**: "What's your budget tier?" (enterprise, mid-market, small business)

6. **Delivery/shipping**: "Any delivery or shipping requirements?"  memory_types: ["preference", "decision", "fact"],2. If found, confirm and update



**Step 4: Store Criteria in Memory**  limit: 103. If not found, systematically ask user about requirements

```javascript

create_memories({})4. Store criteria in memory for future use

  memories: [{

    content: "Vendor requirements for [RFP Name]: [criteria summary]",```

    memory_type: "preference",

    importance_score: 0.8,**HOW TO DO IT:**

    metadata: {

      rfp_id: "[current RFP ID]",**Step 2: If Found**

      category: "vendor_criteria"

    }- Summarize the existing criteria### Step 1: Search for Existing Criteria

  }]

})- Ask user: "I see you previously wanted vendors with [criteria]. Are these still your requirements, or would you like to update them?"```

```

search_memories({

**Metadata:**

```json**Step 3: If Not Found - Ask User**  query: "vendor requirements supplier criteria certifications qualifications geographic preferences",

{

  "knowledge_id": "sourcing-vendor-requirements-workflow",Questions to ask:  memory_types: "preference,decision,fact",

  "category": "vendor-discovery",

  "importance": 0.85,1. "What certifications do vendors need?" (GSA, ISO, OEKO-TEX, BCI, Fair Trade, etc.)  limit: 10

  "tags": ["workflow", "requirements", "memory-search", "user-interview"]

}2. "Do you have geographic preferences?" (local, regional, national, international)})

```

3. "What's the minimum company size or experience level?"```

---

4. "Are there specific capabilities you need?" (certifications, specializations)

## Perplexity Vendor Discovery Strategies

5. "What budget tier are you targeting?" (enterprise, mid-market, small business)### Step 2: If Criteria Found

### ID: sourcing-perplexity-discovery

### Type: procedure6. "Any delivery or shipping requirements?"- Summarize existing criteria to user

### Importance: 0.90

### Category: vendor-research- Ask: "Are these vendor requirements still accurate, or have your needs changed?"



**Content:****Step 4: Create Memory**- Update memory if changes needed



Four complementary research strategies using Perplexity tools to find qualified vendors. Use multiple approaches for comprehensive coverage.```javascript



**Strategy 1: Quick Vendor Listings (perplexity_search)**create_memory({### Step 3: If NO Criteria Found

Best for: Getting initial list of vendor names

  memory_type: "preference",Ask user systematically about:

```javascript

perplexity_search({  content: "Vendor Requirements for [RFP Name]: [detailed criteria]",

  query: "[product/service] suppliers [location] [key requirement]",

  recency_filter: "month",  importance_score: 0.85,**Certifications & Compliance:**

  return_related_questions: true

})  metadata: {- "Do you require any specific certifications? (e.g., GSA Schedule, ISO 9001, industry-specific)"

```

    rfp_id: "[current_rfp_id]",- "Any mandatory compliance requirements? (e.g., OSHA, FDA, environmental)"

Example: "commercial LED lighting suppliers California Energy Star certification"

    category: "vendor_criteria"

**Strategy 2: Deep Supplier Analysis (perplexity_research)**

Best for: Comprehensive vendor comparison with pros/cons  }**Geographic Preferences:**



```javascript})- "Any geographic preferences? Local, regional, national, or international?"

perplexity_research({

  query: "Compare [product/service] vendors with [requirements] in [location]"```- "Shipping/delivery constraints?"

})

```



Example: "Comprehensive analysis of commercial LED lighting suppliers in California with Energy Star certification and GSA schedule"**Metadata:****Company Qualifications:**



**Strategy 3: Specific Vendor Questions (perplexity_ask)**```json- "Minimum company size or years in business?"

Best for: Targeted information about particular vendors or requirements

{- "Required experience level in this product/service area?"

```javascript

perplexity_ask({  "knowledge_id": "sourcing-vendor-requirements-workflow",

  query: "What vendors supply [specific item] with [certification]?"

})  "category": "vendor-discovery",**Capabilities:**

```

  "importance": 0.85,- "Any specialized capabilities required? (e.g., custom manufacturing, 24/7 support)"

Example: "What vendors supply 4ft LED tube lights with DLC certification and offer government pricing?"

  "tags": ["workflow", "vendor-criteria", "requirements-gathering"]- "Minimum capacity or volume requirements?"

**Strategy 4: Vendor Comparisons (perplexity_reason)**

Best for: Evaluating tradeoffs between specific vendors}



```javascript```**Budget & Pricing:**

perplexity_reason({

  query: "Compare pros and cons of [Vendor A] vs [Vendor B] for [use case]"- "Budget tier? (enterprise-level, mid-market, budget-conscious)"

})

```---- "Payment terms preferences? (Net 30, credit card, etc.)"



Example: "Compare pros and cons of Philips Lighting vs GE Lighting for government facility LED retrofits"



**Data to Gather for Each Vendor:**## Perplexity Vendor Discovery Strategies**Delivery & Logistics:**

- Official company name

- Primary contact email (sales@, info@, or named contact)- "Lead time requirements?"

- Website URL

- Phone number (if available)### ID: sourcing-perplexity-discovery- "Installation or setup services needed?"

- Key capabilities/specializations

- Relevant certifications### Type: procedure- "Ongoing support or maintenance requirements?"

- Geographic coverage

### Importance: 0.90

**Quality Standards:**

- Find 8-12 vendors minimum (gives user good selection)### Category: vendor-discovery### Step 4: Store Vendor Criteria Memory

- Verify contact information is current (check website)

- Include mix of vendor sizes (enterprise and mid-market)```json

- Geographic diversity when relevant

- Look for recent business activity (website updates, news)**Content:**{



**Metadata:**  "content": "Vendor requirements for [RFP Name]: [detailed list of all requirements gathered]",

```json

{Strategic approaches for vendor discovery using Perplexity AI tools:  "memory_type": "preference",

  "knowledge_id": "sourcing-perplexity-discovery",

  "category": "vendor-research",  "importance_score": 0.85,

  "importance": 0.90,

  "tags": ["perplexity", "research", "vendor-discovery", "tool-usage"]**Strategy 1: Quick Listings (perplexity_search)**  "reference_type": "rfp",

}

``````javascript  "reference_id": "[current RFP ID]"



---perplexity_search({}



## Email Invitation Template  query: "[product/service] suppliers [location] [key requirement]",```



### ID: sourcing-email-invitation-template  recency_filter: "month",

### Type: guideline

### Importance: 0.80  return_related_questions: true**Example Complete Criteria:**

### Category: email-outreach

})```

**Content:**

```Vendor requirements for Office LED Lighting Procurement:

Professional email template for RFP bid invitations with customization guidelines.

- Best for: Getting initial vendor lists- Certification: Energy Star certified products required

**Subject Line:**

```- Returns: 5-10 supplier names with links- Geographic: US-based suppliers preferred, willing to consider Canada

Invitation to Bid - [RFP Title]

```- Use when: Starting vendor research- Company: Minimum 5 years in commercial lighting industry



**Email Body:**- Capabilities: Must provide installation support or recommendations

```

Dear [Vendor Name] Team,**Strategy 2: Deep Analysis (perplexity_research)**- Budget: Mid-market tier, target $10-15 per bulb



We are reaching out to invite you to submit a bid for our upcoming procurement:```javascript- Delivery: 30-day maximum lead time



RFP Title: [RFP Name]perplexity_research({- Minimum Order: Willing to fulfill 100-unit orders

Description: [Brief RFP description - 1-2 sentences]

Submission Deadline: [Due date if available]  query: "Compare [product/service] vendors with [requirements] in [location]"```



Bid Submission Link: [Generated bid URL from RFP Design agent]})



[Key requirements or highlights - 2-3 bullet points if relevant]```**Metadata:**



Please review the full RFP details and submit your proposal using the link above.- Best for: Comprehensive market analysis```json



If you have questions, please reply to this email.- Returns: Detailed supplier comparisons, certifications, capabilities{



Best regards,- Use when: Need thorough vendor evaluation  "knowledge_id": "vendor-requirements-workflow",

[User's organization or RFPEZ.AI on behalf of user]

```  "category": "workflow",



**Customization Guidelines:****Strategy 3: Specific Questions (perplexity_ask)**  "importance": 0.90,

1. **Vendor Name**: Use official company name from research

2. **RFP Description**: Keep brief but informative```javascript  "tags": ["vendor-discovery", "requirements", "criteria", "sourcing"]

3. **Key Requirements**: Only include if critical for vendor decision (e.g., "Must have GSA schedule")

4. **Tone**: Professional, courteous, clearperplexity_ask({}

5. **Call to Action**: Always include bid submission link

  query: "What vendors supply [specific item] with [certification]?"```

**Development Mode Routing Notice (append if redirected):**

```})

---

NOTE: This email was redirected to you for review (development mode).```**Relations:**

Original recipient: [vendor_email]

To send directly to vendors, enable production mode.- Best for: Targeted queries about specific vendors- relates_to: perplexity-vendor-discovery

```

- Returns: Direct answers with citations- prerequisite: rfp-context-verification

**Before Sending Checklist:**

- ✓ Verify bid URL is available (coordinate with RFP Design if not)- Use when: Need specific vendor information

- ✓ Check vendor email against whitelist

- ✓ Confirm user approval for bulk sending---

- ✓ Spell-check and format properly

**Strategy 4: Vendor Comparison (perplexity_reason)**

**Metadata:**

```json```javascript## Perplexity Vendor Discovery Strategies

{

  "knowledge_id": "sourcing-email-invitation-template",perplexity_reason({

  "category": "email-outreach",

  "importance": 0.80,  query: "Compare pros and cons of [Vendor A] vs [Vendor B] for [use case]"### ID: perplexity-vendor-discovery

  "tags": ["email", "template", "invitation", "professional-communication"]

}})### Type: knowledge

```

```### Importance: 0.90

---

- Best for: Evaluating trade-offs between options### Category: workflow

## Email Whitelist Configuration

- Returns: Reasoned analysis with pros/cons

### ID: sourcing-email-whitelist

### Type: fact- Use when: User needs help choosing between vendors**Content:**

### Importance: 0.75

### Category: email-routingComprehensive guide for using Perplexity tools effectively to discover, research, and qualify vendors for RFP opportunities.



**Content:****Data Collection Checklist:**



Email whitelist configuration for development mode email routing protection.For each vendor, gather:**WHY THIS EXISTS:**



**Default Whitelisted Domains:**- ✅ Official company namePerplexity tools are powerful but require strategic use for optimal vendor discovery. This guide ensures consistent, thorough vendor research.

- @rfpez.ai (internal testing)

- @esphere.com (development team)- ✅ Primary contact email (sales@, info@, or named contact)



**Default Whitelisted Emails:**- ✅ Website URL**TOOL SELECTION STRATEGY:**

- mskiba@esphere.com

- agent@rfpez.ai- ✅ Phone number (if available)



**Whitelist Behavior:**- ✅ Key capabilities/specializations### perplexity_search - Quick Vendor Listings

- **Whitelisted addresses**: Emails sent directly to recipient, no routing notice

- **Non-whitelisted addresses**: Emails redirected to sender (user's email) with routing notice added to body- ✅ Relevant certifications**WHEN TO USE:** Initial vendor discovery, contact information gathering

- **Production mode**: All emails sent directly, whitelist ignored (override development mode)

- ✅ Geographic coverage**BEST FOR:** Finding vendor lists, industry directories, contact details

**How to Check Whitelist:**

Search knowledge with query "email whitelist configuration" to retrieve current whitelist settings.- ✅ Years in business (if available)**PARAMETERS:**



**Development Mode vs Production Mode:**```json

- **Development Mode** (default): Protects against accidental vendor contact, allows email review before actual sending

- **Production Mode**: Direct email delivery to all recipients, no routing notices, requires explicit configuration flag**Quality Guidelines:**{



**When to Mention to User:**- Find 8-12 vendors minimum for good selection  "query": "[product/service] suppliers [location] [key requirement] contact information",

Always explain development mode routing when:

- Sending first batch of vendor emails- Verify contact information is current  "recency_filter": "month",

- User asks about email delivery

- Non-whitelisted addresses are redirected- Include mix of vendor sizes  "return_related_questions": true



**Metadata:**- Check for recent business activity}

```json

{- Look for industry reputation indicators```

  "knowledge_id": "sourcing-email-whitelist",

  "category": "email-routing",

  "importance": 0.75,

  "tags": ["email", "whitelist", "development-mode", "configuration"]**Metadata:****EXAMPLE QUERIES:**

}

``````json- "LED lighting suppliers California GSA certified contact email"



**Relations:**{- "Office furniture manufacturers midwest region B2B sales contacts"

- relates_to: development-mode-email-routing

  "knowledge_id": "sourcing-perplexity-discovery",- "Medical device distributors Texas FDA approved directory"

---

  "category": "vendor-discovery",

## Vendor Selection Criteria Best Practices

  "importance": 0.90,### perplexity_research - Deep Vendor Analysis

### ID: sourcing-vendor-criteria-best-practices

### Type: guideline  "tags": ["perplexity", "research", "vendor-sourcing", "best-practices"]**WHEN TO USE:** Comprehensive supplier evaluation, market analysis

### Importance: 0.85

### Category: vendor-evaluation}**BEST FOR:** Detailed vendor capabilities, competitive analysis, market landscape



**Content:**```**PARAMETERS:**



Best practices for evaluating and presenting vendor selection criteria to users.```json



**Certification Types to Consider:**---{

- **GSA Schedule**: Required for many government contracts

- **ISO Certifications**: ISO 9001 (quality), ISO 14001 (environmental)  "query": "Comprehensive analysis of [product/service] vendors with [requirements] in [location] including capabilities, certifications, and reputation",

- **Industry-Specific**: DLC (lighting), ENERGY STAR (efficiency), FedRAMP (cloud security)

- **Minority/Women-Owned**: WOSB, MBE, DBE designations## Email Invitation Template  "search_recency_filter": "month"

- **Safety**: OSHA compliance, safety certifications

}

**Geographic Considerations:**

- **Local**: Supports local economy, faster delivery, easier site visits### ID: sourcing-email-invitation-template```

- **Regional**: Balance of proximity and vendor selection

- **National**: Broader vendor base, standardization across facilities### Type: guideline

- **International**: Cost savings vs logistics complexity

### Importance: 0.80**EXAMPLE QUERIES:**

**Company Size & Experience:**

- **Enterprise Vendors**: Established processes, national coverage, higher prices### Category: email-outreach- "Comprehensive analysis of commercial LED lighting suppliers in California with Energy Star certification and GSA schedule"

- **Mid-Market**: Flexibility, competitive pricing, strong customer service

- **Small Business**: Competitive pricing, personalized service, potential capacity limits- "Detailed comparison of office furniture manufacturers in the midwest with sustainability certifications"

- **Experience Level**: Years in business, similar project history, client references

**Content:**

**Budget Tier Alignment:**

- **Enterprise Budget**: National brands, premium service, comprehensive warranties### perplexity_ask - Specific Vendor Questions

- **Mid-Market Budget**: Regional players, balanced quality/price, standard warranties

- **Small Business Budget**: Local vendors, competitive pricing, flexible termsProfessional RFP invitation email template and best practices:**WHEN TO USE:** Quick questions about specific vendors or requirements



**Metadata:****BEST FOR:** Verifying vendor capabilities, checking certifications, pricing inquiries

```json

{**Subject Line Format:****PARAMETERS:**

  "knowledge_id": "sourcing-vendor-criteria-best-practices",

  "category": "vendor-evaluation",``````json

  "importance": 0.85,

  "tags": ["best-practices", "criteria", "evaluation", "certifications"]Invitation to Bid - [RFP Title]{

}

``````  "query": "What are the top [product/service] vendors with [specific requirement]?",



---  "search_recency_filter": "month"



## Memory Management for Vendor Decisions**Email Body Template:**}



### ID: sourcing-memory-management``````

### Type: procedure

### Importance: 0.80Dear [Vendor Name] Team,

### Category: data-storage

**EXAMPLE QUERIES:**

**Content:**

We are reaching out to invite you to submit a bid for our upcoming procurement:- "What LED lighting suppliers have both Energy Star and GSA certification?"

Guidelines for storing vendor-related information in memory system for future reference and continuity.

- "Which office furniture vendors offer bulk discounts for 50+ unit orders?"

**What to Store:**

1. **Vendor Criteria** (preference type)RFP Title: [RFP Name]

2. **Contacted Vendors** (decision type)

3. **Vendor Research Results** (fact type)Description: [Brief 1-2 sentence RFP description]### perplexity_reason - Vendor Comparison & Recommendation

4. **User Preferences** (preference type)

Submission Deadline: [Due date if available, or "TBD"]**WHEN TO USE:** Comparing multiple vendors, trade-off analysis

**Memory Types & Examples:**

**BEST FOR:** Vendor selection recommendations, pros/cons analysis

**Preference Type** - User's vendor preferences:

```javascriptBid Submission Link: [Generated bid URL from RFP Design agent]**PARAMETERS:**

create_memories({

  memories: [{```json

    content: "Prefers vendors with GSA schedule and local California presence",

    memory_type: "preference",Key Requirements:{

    importance_score: 0.8,

    metadata: {- [Requirement 1]  "query": "Compare [Vendor A] vs [Vendor B] vs [Vendor C] for [specific use case] considering [key criteria]"

      category: "vendor_criteria",

      rfp_id: "[current_rfp_id]"- [Requirement 2]}

    }

  }]- [Requirement 3]```

})

```



**Decision Type** - Vendors contacted:Please review the full RFP details and submit your proposal using the link above.**EXAMPLE QUERIES:**

```javascript

create_memories({- "Compare Philips vs GE vs Cree for commercial LED office lighting considering cost, energy efficiency, and warranty"

  memories: [{

    content: "Invited 8 vendors to bid on LED lighting RFP: [vendor list]",If you have questions about this opportunity, please reply to this email.- "Evaluate pros and cons of local vs national suppliers for 500-unit office chair procurement"

    memory_type: "decision",

    importance_score: 0.8,

    metadata: {

      category: "vendor_outreach",Best regards,### RESEARCH WORKFLOW:

      rfp_id: "[current_rfp_id]",

      vendor_count: 8[User's Name or "RFPEZ.AI on behalf of [Organization]"]

    }

  }]```**Phase 1: Broad Discovery (5-10 minutes)**

})

```1. Use `perplexity_search` with broad query to get initial vendor list



**Fact Type** - Research findings:**Personalization Guidelines:**2. Scan for 10-15 potential vendors

```javascript

create_memories({- Address vendor by company name3. Note contact information and websites

  memories: [{

    content: "Philips Lighting has GSA schedule, nationwide coverage, 50+ year history in commercial LED",- Include 2-3 key requirements specific to them

    memory_type: "fact",

    importance_score: 0.7,- Mention relevant certifications if applicable**Phase 2: Deep Research (10-15 minutes)**

    metadata: {

      category: "vendor_info",- Reference any prior relationship if known1. Use `perplexity_research` for detailed analysis of top candidates

      vendor_name: "Philips Lighting"

    }2. Verify certifications and capabilities

  }]

})**Email Checklist:**3. Check company reputation and reviews

```

- ✅ Professional, courteous tone

**When to Create Memories:**

- After user specifies vendor criteria (preference)- ✅ Clear subject line with RFP title**Phase 3: Specific Verification (5 minutes)**

- After sending invitation emails (decision)

- After discovering notable vendor information (fact)- ✅ All necessary information upfront1. Use `perplexity_ask` for specific questions about top 8-10 vendors

- When user makes vendor-related decisions (decision)

- ✅ Clear call-to-action (bid URL)2. Verify contact information currency

**Metadata:**

```json- ✅ Contact method for questions3. Check for recent business activity

{

  "knowledge_id": "sourcing-memory-management",- ✅ Spell-check and proper formatting

  "category": "data-storage",

  "importance": 0.80,**Phase 4: Final Selection (5 minutes)**

  "tags": ["memory", "storage", "vendor-info", "continuity"]

}**Development Mode Notice (Non-Whitelisted):**1. Use `perplexity_reason` to compare top candidates

```

When email must be redirected, prepend:2. Select final 5-8 vendors to present to user

---

```

## Error Handling Patterns

⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️### INFORMATION TO GATHER:

### ID: sourcing-error-handling

### Type: guidelineThis email was originally intended for: [original recipient email]

### Importance: 0.75

### Category: troubleshooting**Essential (Required):**



**Content:**In development mode, all non-whitelisted emails are routed back to you for review.- Official company name



Professional error handling patterns for common Sourcing agent scenarios.To send this email to the actual recipient, add their address to the whitelist or switch to production mode.- Primary contact email (sales@, info@, or named contact)



**Scenario 1: No RFP Context**- Website URL

If `get_current_rfp` returns null:

---ORIGINAL EMAIL BELOW---- Brief capabilities summary

**Response:**

"It looks like we need an RFP first before I can search for vendors. Would you like me to connect you with our RFP Design agent to create one?"



**Action:** Offer to switch to RFP Design agent[email body]**Important (Highly Desired):**



---```- Phone number



**Scenario 2: Perplexity Rate Limiting**- Physical address or headquarters location

If Perplexity tools fail with rate limit error:

**Metadata:**- Relevant certifications

**Response:**

"I'm experiencing a temporary issue with my research tools. Do you have any preferred vendors you'd like to start with, or would you like me to try again in a moment?"```json- Years in business



**Action:** {

- Ask for user's known vendors

- Offer to retry after delay  "knowledge_id": "sourcing-email-invitation-template",**Nice to Have (Optional):**

- Switch search approaches

  "category": "email-outreach",- Recent customer reviews or testimonials

---

  "importance": 0.80,- Pricing tier indicators

**Scenario 3: Email Send Failures**

If `send_email` fails:  "tags": ["email", "template", "invitation", "communication"]- Notable clients or projects



**Response:**}- Social media presence

"I encountered an issue sending the email: [simple explanation]. This might be an authorization issue. Would you like me to save the vendor list so we can send invitations once the issue is resolved?"

```

**Action:**

- Explain issue in simple terms### QUALITY CHECKS:

- Suggest checking email authorization

- Offer to save vendor list for later---



---**Verify Contact Information:**



**Scenario 4: Missing Bid URL**## Email Whitelist Configuration- Cross-check email format (sales@domain.com is better than generic info@)

If RFP has no bid submission URL:

- Confirm website is active and professional

**Response:**

"The RFP bid form needs a submission URL before we can invite vendors. Would you like me to coordinate with the RFP Design agent to generate one, or draft the invitation emails to send later?"### ID: sourcing-email-whitelist- Look for recent website updates (indicates active business)



**Action:**### Type: fact

- Suggest coordinating with RFP Design

- Offer to draft emails for later sending### Importance: 0.75**Assess Credibility:**

- Don't send incomplete invitations

### Category: email-outreach- Check for professional website presence

---

- Look for third-party validation (reviews, news mentions)

**Scenario 5: No Vendors Found**

If Perplexity research returns empty results:**Content:**- Verify certifications claimed



**Response:**- Check for Better Business Bureau or industry association membership

"I'm having trouble finding vendors that match all the criteria. Would you like me to broaden the search (e.g., expand geographic area, reduce certification requirements), or do you have vendor suggestions?"

Email whitelist configuration for development mode routing:

**Action:**

- Ask to relax criteria**Diversify Selection:**

- Request user's known vendors

- Suggest alternative search terms**Default Whitelisted Domains:**- Mix of company sizes (enterprise and mid-market)



**Metadata:**- @rfpez.ai (internal testing)- Geographic diversity if appropriate

```json

{- @esphere.com (development team)- Price tier variety

  "knowledge_id": "sourcing-error-handling",

  "category": "troubleshooting",- Different specializations or niches

  "importance": 0.75,

  "tags": ["error-handling", "troubleshooting", "professional-communication"]**Default Whitelisted Emails:**

}

```- mskiba@esphere.com**Metadata:**



---- agent@rfpez.ai```json



## Agent Handoff Protocols{



### ID: sourcing-agent-handoffs**Whitelist Behavior:**  "knowledge_id": "perplexity-vendor-discovery",

### Type: procedure

### Importance: 0.801. **Whitelisted addresses**: Emails sent directly to recipient  "category": "workflow",

### Category: agent-coordination

2. **Non-whitelisted addresses**: Emails redirected to sender with routing notice  "importance": 0.90,

**Content:**

3. **Production mode**: All emails sent directly (overrides whitelist)  "tags": ["perplexity", "vendor-research", "supplier-discovery", "tool-usage"]

When and how to switch between agents to ensure smooth user experience.

}

**When to Switch TO Sourcing Agent:**

**Checking Email Status:**```

**From RFP Design Agent:**

- User has completed and accepted supplier bid form- If email domain matches whitelisted domain → send directly

- User says "ready to find vendors" or "invite suppliers"

- User asks "who should I send this to?"- If specific email in whitelist → send directly**Relations:**

- RFP package is complete and needs vendor outreach

- Otherwise → redirect to sender with notice- relates_to: vendor-requirements-workflow

**From Solutions Agent:**

- User asks about vendor discovery process- relates_to: vendor-presentation-workflow

- User wants help finding suppliers

- User asks "how do I invite vendors to bid?"**Development Mode Purpose:**



---- Protects against accidental vendor contact during testing---



**When to Switch FROM Sourcing Agent:**- Allows email review before actual sending



**To RFP Design Agent:**- Preserves original recipient information for production deployment## Email Development Mode Routing

- No active RFP exists (need to create one first)

- Bid form doesn't exist yet (need to create supplier form)- Safe for demonstrations and testing

- User wants to modify RFP requirements

- Bid submission URL is missing### ID: development-mode-email-routing



**To Support Agent:****Production Mode:**### Type: knowledge

- Email authorization issues

- Technical problems with vendor discovery tools- All emails sent to intended recipients### Importance: 0.95

- General platform questions

- User is confused about process- No routing notices added### Category: workflow



**To Solutions Agent:**- Real vendor engagement

- User asks about platform pricing or features

- User is evaluating whether to use platform- Requires explicit configuration flag**Content:**

- Sales-related questions

Critical safety feature that routes non-whitelisted emails back to sender for review, preventing accidental vendor contact during development and demos.

---

**Metadata:**

**How to Perform Handoff:**

```json**WHY THIS EXISTS:**

```javascript

switch_agent({{During development and demonstrations, we cannot send real emails to external vendors. This could cause:

  agent_name: "[target agent name]",

  context: "User needs [specific help]. Current state: [brief summary]"  "knowledge_id": "sourcing-email-whitelist",- Embarrassment from test/demo content

})

```  "category": "email-outreach",- Confusion for vendors who receive unexpected inquiries



**Example Handoff Messages:**  "importance": 0.75,- Legal/compliance issues with unsolicited contact

- "Let me connect you with our RFP Design agent who can help create the bid form first."

- "I'll switch you to our Support agent who can help with email authorization."  "tags": ["email", "configuration", "whitelist", "development-mode"]- Reputational damage to platform

- "Our Solutions agent can answer questions about platform features and pricing."

}

**Context to Preserve:**

- Current RFP ID```Development mode routing allows safe email testing while preserving workflow.

- Vendor criteria discussed

- Vendors already researched

- User preferences mentioned

---**HOW IT WORKS:**

**Metadata:**

```json

{

  "knowledge_id": "sourcing-agent-handoffs",## Vendor Selection Criteria Best Practices### Email Routing Decision Tree:

  "category": "agent-coordination",

  "importance": 0.80,

  "tags": ["agent-switching", "handoff", "coordination", "user-experience"]

}### ID: sourcing-vendor-criteria-best-practices```

```

### Type: guideline1. Check if recipient email is whitelisted


### Importance: 0.85   ├─ YES → Send email directly to recipient (normal flow)

### Category: vendor-discovery   └─ NO → Redirect email to sender with routing notice



**Content:**2. If redirecting:

   ├─ Change TO address to sender's email

Best practices for establishing vendor selection criteria:   ├─ Prepend routing notice to email body

   └─ Send email

**Common Certification Requirements:**```

- **GSA Schedule**: For government procurement

- **ISO 9001**: Quality management### Whitelist Check Procedure:

- **ISO 14001**: Environmental management

- **OEKO-TEX Standard 100**: Textile safety**Step 1: Get Recipient Email**

- **GOTS**: Global Organic Textile Standard```javascript

- **BCI**: Better Cotton Initiativeconst recipientEmail = vendor.email;  // e.g., "supplier@example.com"

- **Fair Trade**: Ethical sourcing```

- **Industry-specific**: Medical device, food safety, etc.

**Step 2: Check Against Whitelist**

**Geographic Considerations:**Search knowledge for whitelist:

- **Local**: Same city/county (fastest delivery, relationship building)```json

- **Regional**: Same state/region (good balance){

- **National**: Across US (broader selection)  "query": "email whitelist configuration whitelisted addresses domains",

- **International**: Global sourcing (cost advantages, longer lead times)  "memory_types": "knowledge",

  "limit": 1

**Company Size Factors:**}

- **Enterprise**: Large established vendors (stability, capacity, higher prices)```

- **Mid-market**: Regional players (balance of service and cost)

- **Small business**: Specialized capabilities (personalized service, flexibility)**Default Whitelisted:**

- **Set-asides**: Women-owned, minority-owned, veteran-owned certifications- **Domains:** @rfpez.ai, @esphere.com

- **Specific Emails:** mskiba@esphere.com, agent@rfpez.ai

**Capability Requirements:**

- Technical specifications matching**Step 3: Apply Logic**

- Production capacity for order volume```javascript

- Quality control processesfunction isWhitelisted(email) {

- Compliance certifications  // Check specific emails

- Track record in industry  const whitelistedEmails = ['mskiba@esphere.com', 'agent@rfpez.ai'];

- Financial stability  if (whitelistedEmails.includes(email.toLowerCase())) {

- Customer references    return true;

  }

**Budget Tier Alignment:**  

- Premium: Enterprise vendors with premium certifications  // Check whitelisted domains

- Mid-range: Regional vendors with standard certifications  const whitelistedDomains = ['@rfpez.ai', '@esphere.com'];

- Economy: Smaller vendors, direct manufacturers  for (const domain of whitelistedDomains) {

    if (email.toLowerCase().endsWith(domain)) {

**Metadata:**      return true;

```json    }

{  }

  "knowledge_id": "sourcing-vendor-criteria-best-practices",  

  "category": "vendor-discovery",  return false;

  "importance": 0.85,}

  "tags": ["best-practices", "vendor-criteria", "certifications", "selection"]```

}

```### Routing Notice Format:



---**CRITICAL:** When redirecting email, PREPEND this exact notice to body:



## Memory Management for Vendor Decisions```

⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️

### ID: sourcing-memory-managementThis email was originally intended for: [original recipient email]

### Type: procedure

### Importance: 0.80In development mode, all non-whitelisted emails are routed back to you for review.

### Category: workflowTo send this email to the actual recipient, add their address to the whitelist or switch to production mode.



**Content:**---ORIGINAL EMAIL BELOW---



Guidelines for storing vendor-related information in memories:```



**Vendor Criteria Storage:**### Complete Send Email Workflow:

```javascript

create_memory({```javascript

  memory_type: "preference",// Example workflow

  content: "Vendor Requirements for [RFP Name]: [criteria details]",const vendor = {

  importance_score: 0.85,  name: "Acme Lighting Supply",

  metadata: {  email: "sales@acmelighting.com"

    rfp_id: "[current_rfp_id]",};

    category: "vendor_criteria",

    timestamp: "[ISO timestamp]"// Step 1: Check whitelist

  }const isWhitelisted = checkWhitelist(vendor.email);

})

```// Step 2: Determine recipient

const recipientEmail = isWhitelisted ? vendor.email : currentUser.email;

**Contacted Vendors Storage:**

```javascript// Step 3: Prepare email body

create_memory({let emailBody = composeInvitationEmail(rfp, vendor);

  memory_type: "decision",

  content: "Sent RFP invitations to [X] vendors for [RFP Name]: [vendor list]",if (!isWhitelisted) {

  importance_score: 0.80,  // Prepend routing notice

  metadata: {  const routingNotice = `

    rfp_id: "[current_rfp_id]",⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️

    category: "vendor_outreach",This email was originally intended for: ${vendor.email}

    vendor_count: X,

    timestamp: "[ISO timestamp]"In development mode, all non-whitelisted emails are routed back to you for review.

  }To send this email to the actual recipient, add their address to the whitelist or switch to production mode.

})

```---ORIGINAL EMAIL BELOW---



**Vendor Research Results:**`;

```javascript  emailBody = routingNotice + emailBody;

create_memory({}

  memory_type: "fact",

  content: "Vendor discovery for [RFP Name] found: [vendor summary]",// Step 4: Send email

  importance_score: 0.75,send_email({

  metadata: {  to: [recipientEmail],

    rfp_id: "[current_rfp_id]",  subject: `Invitation to Bid - ${rfp.name}`,

    category: "vendor_research",  body_text: emailBody

    source: "perplexity",});

    timestamp: "[ISO timestamp]"

  }// Step 5: Inform user

})if (!isWhitelisted) {

```  informUser(`Email to ${vendor.name} was sent to your email for review (development mode).`);

} else {

**Memory Type Guidelines:**  informUser(`Email sent directly to ${vendor.name} at ${vendor.email}.`);

- **preference**: User's vendor criteria and requirements}

- **decision**: Actions taken (vendors contacted, selections made)```

- **fact**: Research findings and vendor information

- **knowledge**: Workflow procedures and best practices### User Communication:



**Importance Scoring:****ALWAYS explain development mode to user BEFORE sending bulk emails:**

- 0.90-1.0: Critical decisions, final selections

- 0.80-0.89: Important actions, vendor outreach"Since we're in development mode, emails to vendors will be sent to your email address for review. This protects against accidental vendor contact during testing and demonstrations.

- 0.70-0.79: Supporting facts, research results

- 0.60-0.69: Minor details, exploratory searchesI'll prepare invitations for your selected vendors. The emails will come to you, and each will show the vendor it was originally intended for. When you're ready to actually contact these vendors, we can add their addresses to the whitelist or switch to production mode."



**Metadata:****AFTER sending, summarize:**

```json

{"I've sent [X] invitation emails to your email address for review:

  "knowledge_id": "sourcing-memory-management",- [Vendor A] (sales@vendora.com)

  "category": "workflow",- [Vendor B] (info@vendorb.com)

  "importance": 0.80,- [Vendor C] (contact@vendorc.com)

  "tags": ["memory", "storage", "vendor-tracking", "procedures"]

}Each email shows the vendor it's intended for. Review them, and let me know if you'd like me to help configure the whitelist for actual sending."

```

**Metadata:**

---```json

{

## Error Handling Patterns  "knowledge_id": "development-mode-email-routing",

  "category": "workflow",

### ID: sourcing-error-handling  "importance": 0.95,

### Type: guideline  "tags": ["email", "safety", "development-mode", "routing", "whitelist"]

### Importance: 0.75}

### Category: troubleshooting```



**Content:****Relations:**

- relates_to: email-whitelist-configuration

Common error scenarios and professional responses:- relates_to: email-invitation-workflow



**Scenario 1: No RFP Context**---

Detection: `get_current_rfp()` returns null

## Email Whitelist Configuration

Response:

"It looks like we need to set up an RFP first before we can source vendors. Would you like me to connect you with our RFP Design agent to create the RFP?"### ID: email-whitelist-configuration

### Type: knowledge

Action: Offer to switch to RFP Design agent### Importance: 0.85

### Category: workflow

**Scenario 2: Perplexity Rate Limiting**

Detection: Perplexity tool returns rate limit error**Content:**

Configuration details for email whitelist system that determines which addresses can receive direct emails vs redirected emails.

Response:

"I'm experiencing a temporary issue with vendor research. Do you have any preferred vendors in mind that we can start with? I can also try the search again in a moment."**Default Configuration:**



Action: Ask for manual vendor input or retry after delay### Whitelisted Domains:

- **@rfpez.ai** - Internal testing and platform emails

**Scenario 3: Email Send Failures**- **@esphere.com** - Development team domain

Detection: `send_email` returns error

### Whitelisted Email Addresses:

Response:- **mskiba@esphere.com** - Primary development/test account

"There was an issue sending the invitation emails. This could be related to email authorization. Let me save your vendor selection so we can send these once the connection is restored."- **agent@rfpez.ai** - Platform agent email



Action: Save vendor selection, suggest checking authorization### Adding to Whitelist (Future Feature):

When user needs to whitelist new addresses:

**Scenario 4: Missing Bid URL**1. Store in configuration table or environment variable

Detection: No bid submission URL in RFP artifacts2. Format: comma-separated list or JSON array

3. Validate email format before adding

Response:4. Confirm addition to user

"The RFP bid form needs a submission URL before we can send invitations. Would you like me to coordinate with the RFP Design agent to generate that URL first?"

**Example whitelist storage:**

Action: Offer to switch agents or wait for URL```json

{

**Scenario 5: Empty Vendor Search Results**  "whitelisted_domains": ["@rfpez.ai", "@esphere.com"],

Detection: Perplexity returns no vendors  "whitelisted_emails": ["mskiba@esphere.com", "agent@rfpez.ai", "supplier@trustedvendor.com"]

}

Response:```

"I'm having trouble finding vendors that match those exact criteria. Could we broaden the search? For example, we could expand the geographic area or adjust certification requirements."

### Production Mode Override:

Action: Suggest criteria adjustments, ask for guidanceWhen system is in production mode:

- ALL emails sent directly (bypass whitelist check)

**General Error Response Guidelines:**- No routing notices added

- Never show technical error messages- Normal email delivery flow

- Use friendly, professional language

- Offer actionable alternatives**Configuration Flag:**

- Preserve user's work/context```

- Provide clear next stepsENVIRONMENT_MODE = "development"  // or "production"

```

**Metadata:**

```json**Metadata:**

{```json

  "knowledge_id": "sourcing-error-handling",{

  "category": "troubleshooting",  "knowledge_id": "email-whitelist-configuration",

  "importance": 0.75,  "category": "best-practices",

  "tags": ["error-handling", "communication", "troubleshooting", "user-experience"]  "importance": 0.85,

}  "tags": ["email", "whitelist", "configuration", "safety"]

```}

```

---

**Relations:**

## Agent Handoff Protocols- relates_to: development-mode-email-routing

- relates_to: email-invitation-workflow

### ID: sourcing-agent-handoffs

### Type: procedure---

### Importance: 0.80

### Category: workflow## Vendor Presentation Workflow



**Content:**### ID: vendor-presentation-workflow

### Type: knowledge

When and how to switch between agents during sourcing workflows:### Importance: 0.85

### Category: workflow

**Switch TO Sourcing Agent (from others):**

**Content:**

From RFP Design Agent:Procedure for presenting vendor research findings to user in a professional, organized, and selectable format using document artifacts.

- User completed supplier bid form

- User says "ready to find vendors"**WHY THIS EXISTS:**

- User asks "who should I send this to?"After vendor research, we need to present findings in a way that:

- RFP package complete, needs outreach- Is easy to review and compare

- Allows user to select vendors to contact

From Solutions Agent:- Provides all necessary information for decision-making

- User asks about vendor discovery- Maintains professional presentation

- User wants help finding suppliers

- User asks "how do I invite vendors to bid?"**ARTIFACT FORMAT:**



**Switch FROM Sourcing Agent (to others):**### Vendor List Document Artifact:



To RFP Design Agent:**Artifact Properties:**

- No active RFP exists```json

- Bid form doesn't exist yet{

- User wants to modify RFP requirements  "name": "Vendor Candidates for [RFP Name]",

- Example: "It looks like we need to create the RFP first. Let me connect you with our RFP Design agent."  "artifactRole": "vendor_list",

  "type": "document"

To Support Agent:}

- Email authorization issues```

- Technical problems with Perplexity

- General platform questions**Content Format (Markdown Table):**

- Example: "This seems like a technical issue. Let me connect you with our Support agent for assistance."```markdown

# Vendor Candidates for [RFP Name]

To Solutions Agent:

- User asks about platform pricingBelow are qualified vendors matching your requirements for [brief RFP description].

- User asks about features

- User is evaluating platform## Selection Instructions

- Example: "Those are great questions about the platform. Let me connect you with our Solutions agent who can explain our features and pricing."Review the vendors below. Let me know which vendors you'd like me to contact with your RFP invitation.



**Handoff Message Format:**## Vendor List

```

[Brief acknowledgment of current state]| # | Vendor Name | Contact Email | Website | Capabilities | Certifications |

[Explain why switching agents]|---|-------------|---------------|---------|--------------|----------------|

[Use switch_agent or recommend_agent]| 1 | Acme Lighting Supply | sales@acmelighting.com | www.acmelighting.com | Commercial LED lighting, installation support | Energy Star, GSA Schedule |

```| 2 | BrightSource Industrial | info@brightsource.com | www.brightsource.com | LED bulbs & fixtures, 24/7 support | Energy Star, ISO 9001 |

| 3 | ...continue for all vendors... |

**Context Preservation:**

When switching agents, ensure:## Research Sources

- Current RFP context is saved*Information gathered from: [list sources like industry directories, vendor websites, reviews, etc.]*

- Vendor criteria stored in memory

- User's request is clearly communicated---

- Any partial work is preserved

**Note:** In development mode, email invitations will be sent to your email address for review before actual vendor contact.

**Metadata:**```

```json

{### Presentation Workflow Steps:

  "knowledge_id": "sourcing-agent-handoffs",

  "category": "workflow",**Step 1: Create Document Artifact**

  "importance": 0.80,```javascript

  "tags": ["agent-switching", "handoff", "workflow", "coordination"]create_document_artifact({

}  name: `Vendor Candidates for ${rfpName}`,

```  content: vendorListMarkdown,

  artifactRole: "vendor_list"

**Relations:**})

- relates_to: sourcing-vendor-requirements-workflow```

- relates_to: sourcing-memory-management

**Step 2: Present to User**
```
"I've completed my vendor research and found [X] qualified suppliers that match your requirements. 

I've created a vendor candidate list in the artifact panel showing:
- Company names and contact information
- Key capabilities and specializations  
- Relevant certifications

Please review the list and let me know which vendors you'd like me to contact. You can select one, several, or all of them for your RFP invitation."
```

**Step 3: Wait for User Selection**
User might say:
- "Contact vendors 1, 3, and 5"
- "Send to all of them"
- "Let's start with just the first three"
- "Can you add one more vendor that does X?"

**Step 4: Confirm Selection**
```
"Perfect! I'll prepare RFP invitation emails for:
- [Vendor A]
- [Vendor B]
- [Vendor C]

Before I send, let me confirm: do you want me to include any specific information or requirements in the invitation emails?"
```

**Step 5: Proceed to Email Workflow**
After confirmation, proceed to email invitation workflow.

### Best Practices:

**Vendor Ordering:**
- Order by best match to requirements (not alphabetically)
- Place most qualified/relevant vendors first
- Consider user's stated priorities

**Information Density:**
- Include essential info in table
- Keep descriptions concise (1-2 sentences)
- Use bullet points for multiple capabilities

**Professional Tone:**
- Neutral, objective presentation
- Highlight strengths without over-selling
- Note any potential concerns if significant

**Source Attribution:**
- Cite research sources for credibility
- Shows thoroughness and due diligence
- Allows user to verify if desired

**Metadata:**
```json
{
  "knowledge_id": "vendor-presentation-workflow",
  "category": "workflow",
  "importance": 0.85,
  "tags": ["vendor-presentation", "artifacts", "user-interaction"]
}
```

**Relations:**
- relates_to: perplexity-vendor-discovery
- relates_to: email-invitation-workflow

---

## Email Invitation Workflow

### ID: email-invitation-workflow
### Type: knowledge
### Importance: 0.90
### Category: workflow

**Content:**
Complete procedure for composing and sending professional RFP invitation emails to selected vendors with development mode safety features.

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
- prerequisite: rfp-context-verification

---

## Vendor Selection Best Practices

### ID: vendor-selection-best-practices
### Type: knowledge
### Importance: 0.75
### Category: best-practices

**Content:**
Guidelines for helping users select appropriate vendors and determine how many vendors to contact for competitive bidding.

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
- relates_to: perplexity-vendor-discovery

---

## Supplier Research Patterns

### ID: supplier-research-patterns
### Type: knowledge
### Importance: 0.70
### Category: best-practices

**Content:**
Common research patterns and strategies for different types of procurement categories.

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
- relates_to: vendor-selection-best-practices

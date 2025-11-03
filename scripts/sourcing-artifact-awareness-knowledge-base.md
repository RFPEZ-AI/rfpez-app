# Sourcing Agent - Knowledge Base: Artifact Awareness & RFP Package Validation

This knowledge base contains detailed procedures for the Sourcing agent to properly detect, acknowledge, and validate RFP package artifacts when starting work.

---

## Artifact Detection on Startup

### ID: sourcing-artifact-detection
### Type: knowledge
### Importance: 0.95
### Category: workflow

**Content:**

The Sourcing agent MUST check for existing artifacts at startup and accurately report their status to the user.

**MANDATORY STARTUP SEQUENCE:**

**STEP 1: Get Current RFP**
```javascript
const rfp = await get_current_rfp({ sessionId });

if (!rfp || !rfp.success) {
  return "I don't see an active RFP. Let me connect you with the RFP Design agent to create one. [Switch to RFP Design](prompt:complete)";
}
```

**STEP 2: List All Artifacts for Session**
```javascript
const artifactResponse = await list_artifacts({ sessionId });
const artifacts = artifactResponse.artifacts || [];

console.log('Artifacts found:', artifacts.length);
console.log('Artifact details:', artifacts.map(a => ({ 
  name: a.name, 
  role: a.artifact_role 
})));
```

**STEP 3: Identify Required Artifacts**
```javascript
const bidForm = artifacts.find(a => 
  a.artifact_role === 'bid_form' && a.status === 'active'
);

const requestEmail = artifacts.find(a => 
  a.artifact_role === 'rfp_request_email' && a.status === 'active'
);

const vendorSelection = artifacts.find(a => 
  a.artifact_role === 'vendor_selection_form' && a.status === 'active'
);
```

**STEP 4: Store Detection Results in Memory**
```javascript
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `Sourcing agent startup check for RFP "${rfp.name}": Found ${artifacts.length} artifacts. Bid form: ${!!bidForm}, Request email: ${!!requestEmail}, Vendor selection: ${!!vendorSelection}`,
  importance_score: 0.8,
  metadata: {
    rfp_id: rfp.id,
    artifact_count: artifacts.length,
    has_bid_form: !!bidForm,
    has_request_email: !!requestEmail,
    has_vendor_selection: !!vendorSelection,
    check_timestamp: new Date().toISOString()
  }
});
```

**STEP 5: Report Status to User Accurately**

**If Complete Package:**
```javascript
const response = `Great! I can see your RFP package for "${rfp.name}" is complete:
✅ Supplier Bid Form: "${bidForm.name}"
✅ RFP Request Email: "${requestEmail.name}"
${vendorSelection ? `✅ Vendor Selection: "${vendorSelection.name}"` : ''}

Ready to find and contact qualified vendors!

[Find vendors now](prompt:complete)
[Review artifacts](prompt:complete)`;
```

**If Incomplete Package:**
```javascript
const response = `I see your RFP for "${rfp.name}", but the package needs:
${bidForm ? '✅' : '❌'} Supplier Bid Form ${bidForm ? `(${bidForm.name})` : '(not created)'}
${requestEmail ? '✅' : '❌'} RFP Request Email ${requestEmail ? `(${requestEmail.name})` : '(not created)'}

Would you like me to switch you to the RFP Design agent to complete these?

[Switch to RFP Design](prompt:complete)`;
```

**CRITICAL ERROR TO AVOID:**
❌ **NEVER say "I don't see any artifacts" when artifacts exist**
✅ **ALWAYS check the list_artifacts response and report what was found**

**Metadata:**
```json
{
  "knowledge_id": "sourcing-artifact-detection",
  "category": "workflow",
  "importance": 0.95,
  "tags": ["startup", "artifact-detection", "validation", "error-prevention"]
}
```

**Relations:**
- relates_to: artifact-query-debugging
- relates_to: rfp-package-validation

---

## Artifact Query Debugging

### ID: artifact-query-debugging
### Type: knowledge
### Importance: 0.9
### Category: workflow

**Content:**

Common issue: Sourcing agent claims "no artifacts found" when artifacts actually exist.

**ROOT CAUSE:**
Agent ignores or doesn't properly process the `list_artifacts` response.

**DEBUGGING PATTERN:**

```javascript
// ❌ WRONG: Not checking response
const artifacts = await list_artifacts({ sessionId });
// Then incorrectly saying: "I don't see any artifacts"

// ✅ CORRECT: Always inspect response
const artifactResponse = await list_artifacts({ sessionId });

console.log('Raw response:', JSON.stringify(artifactResponse, null, 2));
console.log('Artifact count:', artifactResponse.artifacts?.length || 0);

if (artifactResponse.artifacts && artifactResponse.artifacts.length > 0) {
  // Process artifacts
  artifactResponse.artifacts.forEach(artifact => {
    console.log(`Found: ${artifact.name} (${artifact.artifact_role})`);
  });
} else {
  console.log('No artifacts found in response');
}
```

**VERIFICATION CHECKLIST:**
1. ✅ Did `list_artifacts` return success: true?
2. ✅ Does response have `artifacts` array?
3. ✅ Is `artifacts.length > 0`?
4. ✅ Did you check each artifact's `artifact_role`?
5. ✅ Did you filter by `status === 'active'`?

**STORAGE FOR FUTURE DEBUGGING:**
```javascript
// Store query result for troubleshooting
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `list_artifacts query returned ${artifactResponse.artifacts?.length || 0} artifacts for session ${sessionId}`,
  importance_score: 0.7,
  metadata: {
    query_timestamp: new Date().toISOString(),
    artifact_count: artifactResponse.artifacts?.length || 0,
    artifact_names: artifactResponse.artifacts?.map(a => a.name) || []
  }
});
```

**Metadata:**
```json
{
  "knowledge_id": "artifact-query-debugging",
  "category": "troubleshooting",
  "importance": 0.9,
  "tags": ["debugging", "artifact-detection", "common-errors"]
}
```

**Relations:**
- relates_to: sourcing-artifact-detection
- prerequisite: sourcing-artifact-detection

---

## RFP Package Validation Rules

### ID: rfp-package-validation
### Type: knowledge
### Importance: 0.9
### Category: workflow

**Content:**

The Sourcing agent must validate that the RFP package is complete before proceeding with vendor discovery and outreach.

**MINIMUM REQUIREMENTS:**
1. **Bid Form** (`artifact_role: "bid_form"`) - REQUIRED
   - Suppliers need this to submit structured bids
   - Contains fields for pricing, timeline, qualifications
   - Must be active status

2. **Request Email** (`artifact_role: "rfp_request_email"`) - REQUIRED
   - Vendors need invitation with bid URL
   - Contains RFP details and submission instructions
   - Must be active status

**VALIDATION FUNCTION:**
```javascript
function validateRfpPackage(artifacts) {
  const activeArtifacts = artifacts.filter(a => a.status === 'active');
  
  const hasBidForm = activeArtifacts.some(a => 
    a.artifact_role === 'bid_form'
  );
  
  const hasRequestEmail = activeArtifacts.some(a => 
    a.artifact_role === 'rfp_request_email'
  );
  
  return {
    isValid: hasBidForm && hasRequestEmail,
    hasBidForm,
    hasRequestEmail,
    missingArtifacts: [
      ...(!hasBidForm ? ['Supplier Bid Form'] : []),
      ...(!hasRequestEmail ? ['RFP Request Email'] : [])
    ]
  };
}
```

**RESPONSE BASED ON VALIDATION:**

**Valid Package:**
```javascript
if (validation.isValid) {
  return "Your RFP package is complete! Let's find qualified vendors.";
}
```

**Invalid Package:**
```javascript
if (!validation.isValid) {
  return `To begin sourcing, your RFP needs:
${validation.missingArtifacts.map(a => `❌ ${a}`).join('\n')}

Would you like me to switch you to the RFP Design agent to complete the package?`;
}
```

**Metadata:**
```json
{
  "knowledge_id": "rfp-package-validation",
  "category": "validation",
  "importance": 0.9,
  "tags": ["validation", "requirements", "rfp-completeness"]
}
```

**Relations:**
- relates_to: sourcing-artifact-detection
- relates_to: artifact-role-types-reference

---

## Artifact Role Types Reference

### ID: artifact-role-types-reference
### Type: knowledge
### Importance: 0.85
### Category: workflow

**Content:**

Understanding `artifact_role` values is critical for proper artifact detection and validation.

**SOURCING-CRITICAL ROLES:**
- `bid_form` - Supplier bid submission form (REQUIRED for sourcing)
- `rfp_request_email` - RFP invitation email (REQUIRED for sourcing)
- `vendor_selection_form` - Vendor selection checkboxes (used during sourcing)

**OTHER ROLES (not required for sourcing):**
- `buyer_questionnaire` - Requirements gathering form
- `request_document` - Supporting documentation
- `specification_document` - Technical specifications
- `analysis_document` - Analysis documents
- `report_document` - Reports and summaries

**FILTERING BY ROLE:**
```javascript
// Get all bid forms
const bidForms = artifacts.filter(a => a.artifact_role === 'bid_form');

// Get request emails
const requestEmails = artifacts.filter(a => a.artifact_role === 'rfp_request_email');

// Get active vendor selections
const vendorSelections = artifacts.filter(a => 
  a.artifact_role === 'vendor_selection_form' && a.status === 'active'
);
```

**IMPORTANT NOTES:**
- Always check `status === 'active'` to exclude deleted artifacts
- Multiple artifacts CAN have the same role (though uncommon)
- `artifact_role` is REQUIRED on all artifacts

**Metadata:**
```json
{
  "knowledge_id": "artifact-role-types-reference",
  "category": "best-practices",
  "importance": 0.85,
  "tags": ["artifact-roles", "reference", "data-model"]
}
```

---

## Memory Search for Context Recovery

### ID: memory-search-context-recovery
### Type: knowledge
### Importance: 0.85
### Category: workflow

**Content:**

Use memory search to recover context from previous sessions or agents.

**SEARCH PATTERNS FOR SOURCING AGENT:**

**1. Vendor Requirements:**
```javascript
const vendorRequirements = await search_memories({
  query: "vendor requirements supplier criteria certifications specifications qualifications",
  memory_types: "preference,decision",
  limit: 5
});
```

**2. RFP Specifications:**
```javascript
const rfpSpecs = await search_memories({
  query: `RFP ${rfp.name} requirements specifications products services`,
  memory_types: "fact,decision",
  limit: 5
});
```

**3. Previous Vendor Discoveries:**
```javascript
const previousVendors = await search_memories({
  query: "vendors suppliers discovered contacted invited",
  memory_types: "fact",
  limit: 10
});
```

**4. Handoff Context from RFP Design:**
```javascript
const handoffContext = await search_memories({
  query: "RFP package complete switching Sourcing ready",
  memory_types: "decision",
  limit: 3
});
```

**USING RECOVERED CONTEXT:**
```javascript
// Acknowledge previous work
if (handoffContext.length > 0) {
  const context = handoffContext[0];
  response += `\n\nI see the RFP Design agent completed your package and sent you to me for vendor sourcing.`;
}

// Apply vendor preferences
if (vendorRequirements.length > 0) {
  const requirements = vendorRequirements.map(m => m.content).join(', ');
  response += `\n\nI'll look for vendors matching: ${requirements}`;
}
```

**Metadata:**
```json
{
  "knowledge_id": "memory-search-context-recovery",
  "category": "workflow",
  "importance": 0.85,
  "tags": ["memory-search", "context-recovery", "continuity"]
}
```

**Relations:**
- relates_to: sourcing-artifact-detection

---

## Handling Incomplete RFP Packages

### ID: handling-incomplete-packages
### Type: knowledge
### Importance: 0.85
### Category: workflow

**Content:**

When the Sourcing agent detects an incomplete RFP package, guide the user back to completion.

**DECISION TREE:**

**Scenario 1: No RFP Context**
```javascript
if (!rfp) {
  return `I don't see an active RFP yet. Let me connect you with the RFP Design agent to create your RFP package.
  
[Switch to RFP Design agent](prompt:complete)`;
}
```

**Scenario 2: Missing Both Artifacts**
```javascript
if (!hasBidForm && !hasRequestEmail) {
  return `Your RFP "${rfp.name}" needs both:
❌ Supplier Bid Form
❌ RFP Request Email

The RFP Design agent can create these for you.

[Switch to RFP Design agent](prompt:complete)`;
}
```

**Scenario 3: Missing Bid Form Only**
```javascript
if (!hasBidForm && hasRequestEmail) {
  return `Your RFP "${rfp.name}" has the request email but needs:
❌ Supplier Bid Form

Vendors need this to submit structured bids. Let me connect you with the RFP Design agent.

[Switch to RFP Design agent](prompt:complete)`;
}
```

**Scenario 4: Missing Request Email Only**
```javascript
if (hasBidForm && !hasRequestEmail) {
  return `Your RFP "${rfp.name}" has the bid form but needs:
❌ RFP Request Email

This contains the invitation and bid URL for vendors. Let me connect you with the RFP Design agent.

[Switch to RFP Design agent](prompt:complete)`;
}
```

**SWITCHING BACK TO RFP DESIGN:**
```javascript
await switch_agent({
  session_id: sessionId,
  agent_name: "RFP Design",
  user_input: `Complete RFP package: missing ${missingArtifacts.join(' and ')}`
});
```

**Metadata:**
```json
{
  "knowledge_id": "handling-incomplete-packages",
  "category": "workflow",
  "importance": 0.85,
  "tags": ["error-handling", "agent-switching", "user-guidance"]
}
```

**Relations:**
- relates_to: rfp-package-validation
- relates_to: sourcing-artifact-detection

---

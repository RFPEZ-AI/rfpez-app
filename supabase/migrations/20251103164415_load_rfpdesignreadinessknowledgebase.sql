-- Knowledge Base: rfp-design-readiness-knowledge-base
-- Generated on 2025-11-03T16:44:15.809Z
-- Source: rfp-design-readiness-knowledge-base.md
-- Entries: 6

-- Insert knowledge base entries
-- RFP Readiness Criteria and Automatic Handoff
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$The RFP Design agent's PRIMARY RESPONSIBILITY is to monitor RFP package completeness and proactively suggest switching to the Sourcing agent when ready for vendor outreach.

**MINIMUM REQUIRED ARTIFACTS:**
1. Supplier Bid Form (`artifact_role: "bid_form"`)
2. RFP Request Letter/Email (`artifact_role: "rfp_request_email"`)

These two artifacts are the MINIMUM needed to begin supplier sourcing. Without both, vendors cannot:
- Submit structured bids (need bid form)
- Receive RFP invitation with bid URL (need request email)

**PROACTIVE SUGGESTION PATTERN:**
After creating ANY artifact, the RFP Design agent MUST check if both required artifacts exist and suggest switching to Sourcing with clickable prompts if complete.

**Metadata:**
```json
{
  "knowledge_id": "rfp-readiness-criteria",
  "category": "workflow",
  "importance": 0.95,
  "tags": ["rfp-readiness", "artifact-tracking", "agent-handoff", "sourcing-transition"]
}
```

**Relations:**
- relates_to: rfp-readiness-check-implementation
- prerequisite: artifact-role-types$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "rfp-readiness-criteria",
  "category": "workflow",
  "importance": 0.95,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-readiness-criteria'
);

-- RFP Readiness Check Implementation Pattern
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$After creating any artifact (bid form, request email, questionnaire, etc.), the RFP Design agent MUST execute this readiness check:

**STEP 1: Get Artifact Inventory**
```javascript
const artifacts = await list_artifacts({ sessionId });
```

**STEP 2: Check for Required Artifacts**
```javascript
const hasBidForm = artifacts.artifacts.some(a => 
  a.artifact_role === 'bid_form' && a.status === 'active'
);

const hasRequestEmail = artifacts.artifacts.some(a => 
  a.artifact_role === 'rfp_request_email' && a.status === 'active'
);
```

**STEP 3: Store Completion Status in Memory**
```javascript
await create_memory({
  sessionId,
  memory_type: "fact",
  content: `RFP readiness check: Bid form=${hasBidForm}, Request email=${hasRequestEmail}. ${hasBidForm && hasRequestEmail ? 'READY FOR SOURCING' : 'Not yet ready'}`,
  importance_score: 0.9,
  metadata: {
    rfp_id: currentRfp.id,
    check_timestamp: new Date().toISOString(),
    has_bid_form: hasBidForm,
    has_request_email: hasRequestEmail,
    ready_for_sourcing: hasBidForm && hasRequestEmail
  }
});
```

**STEP 4: If Complete, Suggest Switching to Sourcing**
```javascript
if (hasBidForm && hasRequestEmail) {
  // Store readiness milestone
  await create_memory({
    sessionId,
    memory_type: "decision",
    content: `RFP package for "${currentRfp.name}" is complete and ready for vendor sourcing. Bid form and request email both created.`,
    importance_score: 1.0,
    metadata: {
      rfp_id: currentRfp.id,
      ready_timestamp: new Date().toISOString(),
      package_status: "ready_for_sourcing"
    }
  });
  
  // Suggest switch with clickable prompts
  const response = `🎉 Your RFP package for "${currentRfp.name}" is complete! You have:
✅ Supplier Bid Form
✅ RFP Request Email

Ready to find qualified suppliers and send invitations?

[Switch to Sourcing agent](prompt:complete)
[Review artifacts first](prompt:complete)
[Make changes to ...](prompt:open)`;
  
  return response;
}
```

**USER CONFIRMS SWITCH:**
When user clicks "Switch to Sourcing agent" or says a trigger phrase:
```javascript
// Then execute the switch
await switch_agent({
  session_id: sessionId,
  agent_name: "Sourcing",
  user_input: "Ready to find vendors and send invitations"
});
```

**STEP 5: If Not Complete, Guide User**
```javascript
// If only partial completion, guide user to complete package
let guidance = "To start sourcing vendors, your RFP needs:\n";
guidance += hasBidForm ? "✅ Supplier Bid Form\n" : "❌ Supplier Bid Form (not yet created)\n";
guidance += hasRequestEmail ? "✅ RFP Request Email\n" : "❌ RFP Request Email (not yet created)\n";

if (!hasBidForm) {
  guidance += "\nLet me know when you're ready to create the supplier bid form.";
} else if (!hasRequestEmail) {
  guidance += "\nLet me know when you're ready to create the RFP request email.";
}

return guidance;
```

**Metadata:**
```json
{
  "knowledge_id": "rfp-readiness-check-implementation",
  "category": "workflow",
  "importance": 0.95,
  "tags": ["implementation", "code-pattern", "readiness-check", "automatic-handoff"]
}
```

**Relations:**
- relates_to: rfp-readiness-criteria
- relates_to: sourcing-handoff-context$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "rfp-readiness-check-implementation",
  "category": "workflow",
  "importance": 0.95,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-readiness-check-implementation'
);

-- Sourcing Agent Handoff Context
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$When the RFP Design agent suggests switching to the Sourcing agent, the handoff (once user confirms) includes:

**AUTOMATIC CONTEXT (No action needed):**
- Current RFP context (maintained via session)
- All artifacts (bid form, request email, etc.)
- Session conversation history
- User profile and preferences

**STORED IN MEMORY FOR SOURCING AGENT:**
- RFP package completion milestone
- Handoff reason and timestamp
- Any vendor preferences mentioned by user
- Product/service specifications

**USER-FACING SUGGESTION MESSAGE:**
Template with clickable prompts:
```markdown
🎉 Your RFP package for '[RFP Name]' is complete! You have:
✅ Supplier Bid Form
✅ RFP Request Email

Ready to find qualified suppliers and send invitations?

[Switch to Sourcing agent](prompt:complete)
[Review artifacts first](prompt:complete)
[Make changes to ...](prompt:open)
```

**SWITCH AGENT PARAMETERS (when user confirms):**
```javascript
switch_agent({
  session_id: sessionId,
  agent_name: "Sourcing",
  user_input: "Ready to find vendors and send invitations"
})
```

The `user_input` parameter provides context to the Sourcing agent about WHY the switch happened.

**Metadata:**
```json
{
  "knowledge_id": "sourcing-handoff-context",
  "category": "communication",
  "importance": 0.9,
  "tags": ["agent-handoff", "context-transfer", "sourcing-agent", "workflow-transition"]
}
```

**Relations:**
- relates_to: rfp-readiness-check-implementation
- relates_to: memory-storage-patterns$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "sourcing-handoff-context",
  "category": "communication",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'sourcing-handoff-context'
);

-- Artifact Role Types Reference
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$The system uses `artifact_role` field to categorize artifacts by their function in the RFP workflow.

**CRITICAL ROLES FOR SOURCING READINESS:**
- `bid_form`: Supplier bid submission form (REQUIRED)
- `rfp_request_email`: RFP invitation email sent to vendors (REQUIRED)

**OTHER ARTIFACT ROLES:**
- `buyer_questionnaire`: Requirements gathering form for buyers
- `request_document`: Supporting RFP documentation
- `specification_document`: Technical specifications
- `analysis_document`: Analysis and evaluation documents
- `report_document`: Reports and summaries
- `vendor_selection_form`: Vendor selection checkboxes

**CHECKING FOR REQUIRED ROLES:**
```javascript
// Filter artifacts by role
const bidForm = artifacts.artifacts.find(a => 
  a.artifact_role === 'bid_form'
);

const requestEmail = artifacts.artifacts.find(a => 
  a.artifact_role === 'rfp_request_email'
);

// Both must exist for sourcing readiness
const readyForSourcing = !!(bidForm && requestEmail);
```

**IMPORTANT NOTES:**
- Multiple artifacts can have the same role (though uncommon)
- Always check `status === 'active'` to exclude deleted/inactive artifacts
- `artifact_role` is a required field on all artifacts

**Metadata:**
```json
{
  "knowledge_id": "artifact-role-types",
  "category": "best-practices",
  "importance": 0.85,
  "tags": ["artifact-roles", "data-model", "reference"]
}
```$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "artifact-role-types",
  "category": "best-practices",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'artifact-role-types'
);

-- User-Initiated Sourcing Handoff Phrases
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$The RFP Design agent should SUGGEST switching to Sourcing when the package is complete. Users may also explicitly request the handoff via trigger phrases.

**TRIGGER PHRASES TO RECOGNIZE:**
- "Ready to find vendors"
- "Who should I send this to?"
- "How do I invite suppliers?"
- "I need to contact vendors"
- "Let's start sourcing"
- "Find suppliers now"
- "Send this to vendors"
- "Get quotes from suppliers"
- "Invite vendors to bid"

**HANDLER PATTERN:**
When user uses trigger phrase or clicks suggested prompt:
1. Check if RFP package is complete
2. If complete: Execute switch to Sourcing
3. If incomplete: Explain what's needed and offer to complete it

```javascript
// User says "Switch to Sourcing agent" or "Find vendors now"

// Check completeness
const artifacts = await list_artifacts({ sessionId });
const isComplete = checkRfpReadiness(artifacts);

if (isComplete) {
  // Execute the switch
  await switch_agent({
    session_id: sessionId,
    agent_name: "Sourcing",
    user_input: "Ready to find vendors and send invitations"
  });
} else {
  // Guide to completion
  return "To find vendors, we first need to complete your RFP package. Let me help you create the [missing artifact].";
}
```

**Metadata:**
```json
{
  "knowledge_id": "user-sourcing-handoff-phrases",
  "category": "communication",
  "importance": 0.8,
  "tags": ["trigger-phrases", "user-intent", "agent-switching"]
}
```

**Relations:**
- relates_to: rfp-readiness-check-implementation
- relates_to: sourcing-handoff-context$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "user-sourcing-handoff-phrases",
  "category": "workflow",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'user-sourcing-handoff-phrases'
);

-- Memory Storage Patterns for RFP Readiness
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
  $kb_rfpdesignreadinessknowledgebase_20251103164415$Store RFP readiness milestones in memory for continuity across sessions and agents.

**MILESTONE MEMORY TYPES:**

**1. Artifact Creation Facts (importance: 0.8)**
```javascript
create_memory({
  sessionId,
  memory_type: "fact",
  content: `Bid form created for RFP "${rfpName}"`,
  importance_score: 0.8,
  metadata: {
    rfp_id: rfpId,
    artifact_role: "bid_form",
    artifact_id: artifactId,
    created_at: timestamp
  }
});
```

**2. Readiness Check Results (importance: 0.9)**
```javascript
create_memory({
  sessionId,
  memory_type: "fact",
  content: `RFP readiness check: Bid form=${hasBidForm}, Request email=${hasRequestEmail}`,
  importance_score: 0.9,
  metadata: {
    rfp_id: rfpId,
    has_bid_form: hasBidForm,
    has_request_email: hasRequestEmail,
    ready_for_sourcing: isReady,
    check_timestamp: timestamp
  }
});
```

**3. Handoff Decisions (importance: 1.0)**
```javascript
create_memory({
  sessionId,
  memory_type: "decision",
  content: `RFP package complete. Switching to Sourcing agent for vendor discovery.`,
  importance_score: 1.0,
  metadata: {
    rfp_id: rfpId,
    rfp_name: rfpName,
    handoff_reason: "rfp_package_complete",
    handoff_timestamp: timestamp,
    from_agent: "RFP Design",
    to_agent: "Sourcing"
  }
});
```

**QUERYING READINESS STATUS:**
```javascript
// Future sessions can check if RFP was previously marked ready
const readiness = await search_memories({
  query: `RFP ${rfpName} readiness sourcing complete`,
  memory_types: "fact,decision",
  limit: 5
});
```

**Metadata:**
```json
{
  "knowledge_id": "memory-storage-patterns-readiness",
  "category": "best-practices",
  "importance": 0.85,
  "tags": ["memory-management", "milestone-tracking", "persistence"]
}
```

**Relations:**
- relates_to: rfp-readiness-check-implementation
- relates_to: sourcing-handoff-context$kb_rfpdesignreadinessknowledgebase_20251103164415$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "memory-storage-patterns-readiness",
  "category": "workflow",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'memory-storage-patterns-readiness'
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
  AND metadata->>'knowledge_id' IN ('rfp-readiness-criteria', 'rfp-readiness-check-implementation', 'sourcing-handoff-context', 'artifact-role-types', 'user-sourcing-handoff-phrases', 'memory-storage-patterns-readiness')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';

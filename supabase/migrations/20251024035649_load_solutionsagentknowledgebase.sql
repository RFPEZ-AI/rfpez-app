-- Knowledge Base: solutions-agent-knowledge-base
-- Generated on 2025-10-24T03:56:49.028Z
-- Source: solutions-agent-knowledge-base.md
-- Entries: 9

-- Insert knowledge base entries
-- Procurement Intent Memory Creation - Complete Workflow
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
  $kb_solutionsagentknowledgebase_20251024035649$Complete step-by-step procedure for creating procurement intent memories before agent switching.

**CRITICAL TWO-STEP PROCESS:**

**STEP 1 - Create Memory FIRST (MANDATORY)**
Call `create_memory` with:
```json
{
  "content": "User wants to [exact procurement request from user message]",
  "memory_type": "decision",
  "importance_score": 0.9
}
```

**STEP 2 - THEN Switch Agent (ONLY AFTER STEP 1)**
Call `switch_agent` with:
```json
{
  "agent_name": "RFP Design",
  "user_input": "[user's exact original message]"
}
```

**Example Execution:**

User says: "I need to source concrete for a construction project"

Step 1 - Call create_memory:
```json
{
  "content": "User wants to source concrete for a construction project",
  "memory_type": "decision",
  "importance_score": 0.9
}
```

Step 2 - Call switch_agent:
```json
{
  "agent_name": "RFP Design",
  "user_input": "I need to source concrete for a construction project"
}
```

**Complete Example Workflow:**
```
User says: "I need to source 100 LED bulbs for our warehouse, they need to be energy efficient and last at least 5 years"

STEP 1 - Create Memory:
{
  "content": "User wants to source 100 LED bulbs for warehouse lighting. Requirements: energy efficient, minimum 5-year lifespan, quantity 100 units.",
  "memory_type": "decision",
  "importance_score": 0.9
}

STEP 2 - Switch Agent:
{
  "agent_name": "RFP Design",
  "user_input": "I need to source 100 LED bulbs for our warehouse, they need to be energy efficient and last at least 5 years"
}
```

**Metadata:**
```json
{
  "knowledge_id": "procurement-memory-workflow",
  "category": "workflow",
  "importance": 0.95,
  "tags": ["memory", "procurement", "agent-switching", "critical-process"]
}
```

**Relations:**
- relates_to: anonymous-intent-workflow
- relates_to: procurement-trigger-patterns$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.95,
  '{
  "knowledge_id": "procurement-memory-workflow",
  "category": "workflow",
  "importance": 0.95,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'procurement-memory-workflow'
);

-- Anonymous Intent Handoff - Cross-Session Context Preservation
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
  $kb_solutionsagentknowledgebase_20251024035649$Detailed procedure for preserving procurement intent across authentication sessions when anonymous users express needs.

**THE PROBLEM:** Anonymous users express procurement intent but can't access RFP Design agent. When they sign up, we want to resume their workflow seamlessly.

**THE SOLUTION:** Store their intent BEFORE prompting signup, then check for it when they return authenticated.

### Anonymous User Workflow:

**STEP 1 - User Expresses Procurement Intent (while anonymous):**
```
User says: "I need to source LED bulbs for my office"
```

**STEP 2 - Store Intent with Special Memory Type:**
Call `create_memory`:
```json
{
  "content": "ANONYMOUS_INTENT: User wants to source LED bulbs for office lighting",
  "memory_type": "anonymous_intent",
  "importance_score": 0.95,
  "tags": ["procurement", "anonymous", "signup_trigger"]
}
```

**STEP 3 - Prompt for Signup:**
Respond with:
```
"I'd love to help you source LED bulbs for your office! The RFP Design agent requires a free account. Would you like to sign up? It just takes a moment and you'll get full access to our RFP creation tools. Once you're signed in, I'll remember what you wanted and we can get started right away!"
```

### Authenticated User Return Workflow:

**STEP 1 - Check for Anonymous Intent (in Initial Prompt):**
When greeting an authenticated user, FIRST search memories:
```json
{
  "query": "ANONYMOUS_INTENT",
  "memory_types": "anonymous_intent",
  "limit": 1
}
```

**STEP 2A - If Anonymous Intent Found:**
```
User's memory: "ANONYMOUS_INTENT: User wants to source LED bulbs for office lighting"

Response:
"Welcome back! I see you wanted to source LED bulbs for your office. Let me connect you with our RFP Design agent to get started on creating your RFP."

Then IMMEDIATELY:
1. Call create_memory (convert to authenticated user's intent):
   {
     "content": "User wants to source LED bulbs for office lighting",
     "memory_type": "decision",
     "importance_score": 0.9
   }
2. Call switch_agent:
   {
     "agent_name": "RFP Design",
     "user_input": "I need to source LED bulbs for my office"
   }
```

**STEP 2B - If No Anonymous Intent Found:**
Standard greeting:
```
"Welcome! I'm here to help with your procurement and sourcing needs. What brings you here today?"
```

### Memory Type Definitions:

- **`anonymous_intent`**: Used ONLY for storing procurement requests from anonymous users
  - Importance: 0.95 (high priority for retrieval)
  - Tagged with "anonymous", "signup_trigger"
  - Content format: "ANONYMOUS_INTENT: [user's request]"
  
- **`decision`**: Used for authenticated user procurement intents
  - Importance: 0.9 (high priority)
  - Standard format for RFP Design agent to search

### Complete Example Flow:

```
SESSION 1 (Anonymous):
User: "Create an RFP for industrial cleaning supplies"
You: [create_memory with type="anonymous_intent"]
You: "I'd love to help! RFP Design requires a free account. Sign up?"
User: [clicks signup button]

SESSION 2 (After Authentication):
Initial Prompt: [search_memories for "ANONYMOUS_INTENT"]
Memory Found: "ANONYMOUS_INTENT: User wants to create RFP for industrial cleaning supplies"
You: "Welcome back! I see you wanted to create an RFP for industrial cleaning supplies. Let me connect you with our RFP Design agent."
You: [create_memory with type="decision"] 
You: [switch_agent to "RFP Design" with original request]
RFP Design: [takes over and creates the RFP]
```

**Metadata:**
```json
{
  "knowledge_id": "anonymous-intent-workflow",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["anonymous", "authentication", "signup", "memory", "context-preservation"]
}
```

**Relations:**
- relates_to: procurement-memory-workflow
- relates_to: authentication-context-handling$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "anonymous-intent-workflow",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'anonymous-intent-workflow'
);

-- Procurement Trigger Patterns - Recognition Guide
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
  $kb_solutionsagentknowledgebase_20251024035649$Comprehensive list of phrases and patterns that indicate user procurement intent requiring agent switch.

**MANDATORY PROCUREMENT TRIGGERS - If user message contains ANY of these patterns:**

**FOR AUTHENTICATED USERS - IMMEDIATELY call `switch_agent`:**
- "I need to source [anything]" → Call `switch_agent` to "RFP Design"
- "I need to procure [anything]" → Call `switch_agent` to "RFP Design" 
- "I need to buy [anything]" → Call `switch_agent` to "RFP Design"
- "Create an RFP for [anything]" → Call `switch_agent` to "RFP Design"
- "I need an RFP for [anything]" → Call `switch_agent` to "RFP Design"
- "I want to create an RFP" → Call `switch_agent` to "RFP Design"
- "Help me create an RFP" → Call `switch_agent` to "RFP Design"
- "I need to find suppliers for [anything]" → Call `switch_agent` to "RFP Design"
- "I'm looking to source [anything]" → Call `switch_agent` to "RFP Design"
- "We need to source [anything]" → Call `switch_agent` to "RFP Design"
- "Create a questionnaire" → Call `switch_agent` to "RFP Design"
- "Create a buyer questionnaire" → Call `switch_agent` to "RFP Design"
- "Generate a questionnaire" → Call `switch_agent` to "RFP Design"
- "I need a questionnaire for [anything]" → Call `switch_agent` to "RFP Design"
- "Create a form for [anything]" → Call `switch_agent` to "RFP Design"
- "Generate a form" → Call `switch_agent` to "RFP Design"

**FOR ANONYMOUS USERS - Explain signup requirement:**
- Same triggers as above, but respond with: "I'd love to help you with that! The RFP Design agent is available with a free account. Would you like to sign up? It just takes a moment."

**EXAMPLES:**
- AUTHENTICATED: "I need to source acetone" → `switch_agent` to "RFP Design" 
- ANONYMOUS: "I need to source acetone" → "I'd love to help you create an RFP for acetone sourcing! The RFP Design agent requires a free account. Would you like to sign up?"

**Metadata:**
```json
{
  "knowledge_id": "procurement-trigger-patterns",
  "category": "validation",
  "importance": 0.85,
  "tags": ["triggers", "patterns", "procurement", "agent-switching"]
}
```

**Relations:**
- relates_to: procurement-memory-workflow
- relates_to: authentication-context-handling$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "procurement-trigger-patterns",
  "category": "validation",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'procurement-trigger-patterns'
);

-- Bid Management Tool Usage - Complete Reference
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
  $kb_solutionsagentknowledgebase_20251024035649$Complete reference for using bid management functions including get_rfp_bids, submit_bid, and update_bid_status.

### Available Bid Management Functions:

#### 1. **get_rfp_bids** - Retrieve All Bids for an RFP
**Purpose**: Get a list of all bid submissions for a specific RFP

**When to use**:
- User asks to "see bids", "show bids", "view bids", "check bid submissions"
- User wants to know how many suppliers have responded
- User needs to evaluate or review bid submissions
- User asks about bid status or supplier responses

**Function signature**:
```json
{
  "name": "get_rfp_bids",
  "input": {
    "rfp_id": 62
  }
}
```

**Response structure**:
```json
{
  "success": true,
  "bids": [
    {
      "id": 4,
      "rfp_id": 62,
      "response": {
        "supplier_name": "Test Medical Equipment Co.",
        "amount": 125000,
        "delivery_timeline": "90 days",
        "proposal": "Full bid details...",
        "contact_email": "sales@testmedical.com",
        "status": "pending"
      },
      "created_at": "2025-10-08T06:48:08.510568"
    }
  ],
  "count": 2,
  "message": "Found 2 bids for RFP 62"
}
```

**User Communication**:
- **Present bids in a clear, organized format** showing supplier name, bid amount, and key details
- **Highlight comparison points** like pricing differences, delivery times, and unique offerings
- **Offer next steps** like "Would you like me to connect you with our Negotiation specialist to help evaluate these bids?"
- **NEVER show raw JSON** - always format bid information in natural language

**Example user-friendly response**:
"I found 2 bid submissions for your CT Scan Equipment RFP:

**Bid #1: Test Medical Equipment Co.**
- Bid Amount: $125,000
- Delivery: 90 days
- Key Features: 0.5mm resolution, 10-second scans, 3-year warranty
- Contact: sales@testmedical.com

**Bid #2: Advanced Medical Imaging Inc.**
- Bid Amount: $135,000
- Delivery: 60 days (faster!)
- Key Features: 0.3mm ultra-high resolution, 5-second scans, 5-year warranty, AI diagnostics
- Contact: contact@advancedmedical.com

**Quick Analysis**: Bid #2 is $10K higher but offers faster delivery, better resolution, and advanced AI features. Would you like help evaluating which bid better meets your requirements?"

#### 2. **submit_bid** - Submit a Bid on Behalf of a Supplier
**Purpose**: Create a new bid submission for an RFP

**When to use**:
- **RARELY USED BY SOLUTIONS AGENT** - Typically suppliers submit directly
- Only when doing testing/demos or helping a supplier with technical issues
- When explicitly instructed to create sample bid data

**Function signature**:
```json
{
  "name": "submit_bid",
  "input": {
    "rfp_id": 62,
    "response": {
      "supplier_name": "Company Name",
      "amount": 125000,
      "delivery_timeline": "90 days",
      "proposal": "Detailed proposal text",
      "contact_email": "contact@supplier.com",
      "status": "pending"
    }
  }
}
```

#### 3. **update_bid_status** - Change Bid Status
**Purpose**: Update the status of a bid submission

**When to use**:
- User wants to mark bids as "accepted", "rejected", "under review", etc.
- User is managing bid evaluation workflow
- User wants to track which bids are still being considered

**Function signature**:
```json
{
  "name": "update_bid_status",
  "input": {
    "bid_id": 4,
    "status": "accepted"
  }
}
```

Status options: "pending", "under_review", "accepted", "rejected"

### Bid Management Workflow:
1. **User asks about bids** → Call `get_rfp_bids` with RFP ID
2. **Format results clearly** → Present in user-friendly format with comparison
3. **Offer next steps** → Suggest Negotiation agent for evaluation or Signing agent for contracts
4. **Update status as needed** → Use `update_bid_status` when user makes decisions

### Error Handling:
- **No bids found**: "Your RFP doesn't have any bid submissions yet. Suppliers may still be preparing their responses, or the RFP may need to be distributed to more potential bidders."
- **Invalid RFP ID**: "I couldn't find that RFP. Could you verify the RFP number?"
- **Database errors**: "I'm having trouble retrieving the bids right now. Let me connect you with Technical Support to resolve this."

**Metadata:**
```json
{
  "knowledge_id": "bid-management-tools",
  "category": "workflow",
  "importance": 0.85,
  "tags": ["bids", "tools", "rfp-management", "supplier-evaluation"]
}
```

**Relations:**
- relates_to: agent-referral-guidelines$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "bid-management-tools",
  "category": "workflow",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'bid-management-tools'
);

-- Agent Referral Guidelines - Complete Switching Logic
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
  $kb_solutionsagentknowledgebase_20251024035649$Complete guide for when and how to switch users to specialized agents based on their needs.

### When to Switch to Specialized Agents:

#### **RFP Design Agent** (`design` role)
- **Switch When**: User wants to create a new RFP or procurement request
- **Indicators**: "I need to create an RFP", "I want to gather requirements", "I need a bid form"
- **Agent Name**: RFP Design
- **Use**: `switch_agent` function with agent_id: "RFP Design"

#### **Technical Support Agent** (`support` role)
- **Switch When**: User has technical issues or needs platform help
- **Indicators**: "This isn't working", "I'm having trouble with", "How do I use", "I need help with the platform"
- **Agent Name**: Technical Support
- **Use**: `switch_agent` function with agent_id: "Technical Support"

#### **Support Agent** (`support` role)
- **Switch When**: User needs general platform assistance or troubleshooting
- **Indicators**: Similar to Technical Support for general help requests
- **Agent Name**: Support
- **Use**: `switch_agent` function with agent_id: "Support"

#### **RFP Assistant Agent** (`assistant` role)
- **Switch When**: User needs guidance on RFP management and procurement processes
- **Indicators**: "How should I structure my RFP", "What's the best practice for", "I need help managing"
- **Agent Name**: RFP Assistant
- **Use**: `switch_agent` function with agent_id: "RFP Assistant"

#### **Billing Agent** (`billing` role)
- **Switch When**: User has questions about pricing, plans, payments, or subscriptions
- **Indicators**: "What does this cost", "I want to upgrade", "Billing question", "Payment issue"
- **Agent Name**: Billing
- **Use**: `switch_agent` function with agent_id: "Billing"

#### **Sourcing Agent** (`sourcing` role)
- **Switch When**: User needs help finding suppliers or managing the bidding process
- **Indicators**: "I need suppliers", "Find vendors for", "Who can provide", "I need more bidders"
- **Agent Name**: Sourcing
- **Use**: `switch_agent` function with agent_id: "Sourcing"

#### **Negotiation Agent** (`negotiation` role)
- **Switch When**: User has received bids and needs help analyzing or negotiating
- **Indicators**: "I got responses", "How should I negotiate", "Which bid is better", "Counter offer"
- **Agent Name**: Negotiation
- **Use**: `switch_agent` function with agent_id: "Negotiation"

#### **Audit Agent** (`audit` role)
- **Switch When**: User needs compliance verification or agreement monitoring
- **Indicators**: "Is this compliant", "Verify agreement", "Check requirements", "Audit this"
- **Agent Name**: Audit
- **Use**: `switch_agent` function with agent_id: "Audit"

#### **Followup Agent** (`communication` role)
- **Switch When**: User needs help with supplier communication or follow-up
- **Indicators**: "Suppliers aren't responding", "Need to follow up", "Send reminders"
- **Agent Name**: Followup
- **Use**: `switch_agent` function with agent_id: "Followup"

#### **Publishing Agent** (`publishing` role)
- **Switch When**: User wants to create directories or publish procurement results
- **Indicators**: "Create a directory", "Publish results", "Generate report", "Share outcomes"
- **Agent Name**: Publishing
- **Use**: `switch_agent` function with agent_id: "Publishing"

#### **Signing Agent** (`contracting` role)
- **Switch When**: User is ready to finalize agreements or needs e-signature help
- **Indicators**: "Ready to sign", "Finalize agreement", "Contract signing", "DocuSign"
- **Agent Name**: Signing
- **Use**: `switch_agent` function with agent_id: "Signing"

### Referral Best Practices:
1. **Always explain why** you're referring them to a specialist
2. **Set expectations** about what the specialist will help with
3. **Use professional language**: "Let me connect you with our [Agent Name] who specializes in..."
4. **Provide context** when switching: Include relevant information from your conversation
5. **Stay in role** until the switch is confirmed successful

### Example Referral Language:
- "Based on your need to create an RFP, let me connect you with our RFP Design who specializes in gathering requirements and creating comprehensive procurement packages."
- "For technical assistance with the platform, I'll transfer you to our Technical Support specialist who can help resolve that issue."
- "Since you're ready to evaluate bids, our Negotiation specialist can help you analyze responses and develop the best strategy."

**Metadata:**
```json
{
  "knowledge_id": "agent-referral-guidelines",
  "category": "workflow",
  "importance": 0.90,
  "tags": ["agents", "switching", "referrals", "specialization"]
}
```

**Relations:**
- relates_to: procurement-trigger-patterns
- relates_to: bid-management-tools$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "agent-referral-guidelines",
  "category": "workflow",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'agent-referral-guidelines'
);

-- User Authentication Context Handling - Personalization Strategy
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
  $kb_solutionsagentknowledgebase_20251024035649$Guidelines for adapting communication style based on user authentication status and history.

### For AUTHENTICATED Users:
- Address them by name when available
- Reference their previous activities and preferences
- Provide full access to platform features and specialized agents
- Focus on helping them achieve their procurement goals efficiently
- Offer advanced features like saved RFPs, supplier networks, and analytics

### For ANONYMOUS Users:

#### New Users (No Previous Login History):
- Be welcoming but emphasize the benefits of creating an account
- Highlight what they're missing by not being logged in:
  - Saved RFP templates and history
  - Personalized supplier recommendations
  - Advanced analytics and reporting
  - Priority support access
  - Collaboration features
- Encourage signup with specific value propositions based on their expressed needs
- Explain that many advanced features require authentication for security and personalization

#### Returning Users (Previous Login History Detected):
- Acknowledge them as a returning user: "Welcome back! I see you've used RFPEZ.AI before."
- Focus on login rather than signup: "You'll want to log back in to access your previous work and settings."
- Emphasize continuity: "Once you're logged in, you'll have access to your saved RFPs, preferences, and supplier connections."
- Mention specific benefits of logging back in:
  - Access to previous RFP drafts and templates
  - Personalized dashboard with their project history
  - Established supplier relationships and preferences
  - Saved searches and favorite features
- Use phrases like "log back in" or "sign back in" rather than "sign up"$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "authentication-context-handling",
  "category": "communication",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'authentication-context-handling'
);

-- Memory Content Best Practices - Quality Guidelines
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
  $kb_solutionsagentknowledgebase_20251024035649$Guidelines for crafting high-quality memory content that preserves context and enables effective retrieval.

**Importance Score Guidelines:**
- **0.9**: Explicit procurement requests with specific details (most RFP intents)
- **0.8**: General procurement interest with some specifications
- **0.7**: Exploratory questions about sourcing or procurement

**Memory Content Best Practices:**
- **Be Specific**: Include product names, quantities, specifications
- **Capture Context**: Include timeline, budget, special requirements
- **Use Natural Language**: Write as if briefing a colleague
- **Include All Details**: Don't summarize - preserve all user-provided information
- **Action-Oriented**: Start with "User wants to..." or "User needs to..."

**Example Memory Contents:**
- "User wants to source LED desk lamps for office renovation. Requirements: 50 units, adjustable brightness, USB charging ports, budget $2000."
- "User needs to procure acetone for industrial cleaning. Quantity: 500 gallons, purity 99%+, delivery within 2 weeks."
- "User wants to create an RFP for office furniture including desks, chairs, and filing cabinets. Budget: $10,000, delivery needed by end of Q2."

**WHY THIS MATTERS:** The RFP Design agent will search memories at session start to understand the user's intent. Without detailed, well-structured memory, they won't have context about what the user wants!

**Metadata:**
```json
{
  "knowledge_id": "memory-content-best-practices",
  "category": "best-practices",
  "importance": 0.80,
  "tags": ["memory", "quality", "context", "retrieval"]
}
```

**Relations:**
- relates_to: procurement-memory-workflow$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.8,
  '{
  "knowledge_id": "memory-content-best-practices",
  "category": "best-practices",
  "importance": 0.8,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'memory-content-best-practices'
);

-- RFP Context Change Acknowledgment - Graceful Handoff
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
  $kb_solutionsagentknowledgebase_20251024035649$How to acknowledge RFP context changes and suggest appropriate agent switches.

**When you receive a SYSTEM NOTIFICATION about RFP context change:**

As the Solutions agent, you typically won't handle detailed RFP work, but you should acknowledge context changes gracefully:

```
"I see we've switched to working on [RFP Name]. Since I specialize in product questions and initial needs assessment, would you like me to switch you to the RFP Design agent to continue working on this procurement?"
```

**Key Guidelines:**
- Acknowledge the RFP context change briefly
- Offer to switch to RFP Design agent if appropriate
- Keep response short and helpful
- Don't dive into RFP technical details (that's RFP Design's job)

**Metadata:**
```json
{
  "knowledge_id": "rfp-context-change-handling",
  "category": "communication",
  "importance": 0.75,
  "tags": ["rfp", "context-switching", "handoff"]
}
```

**Relations:**
- relates_to: agent-referral-guidelines$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.75,
  '{
  "knowledge_id": "rfp-context-change-handling",
  "category": "communication",
  "importance": 0.75,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'rfp-context-change-handling'
);

-- Agent Query Database Lookup - Mandatory Live Data
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
  $kb_solutionsagentknowledgebase_20251024035649$Requirement to always use live database queries when users ask about available agents.

**MANDATORY**: When users ask questions like:
- "What agents are available?"
- "Which agents do you have?"
- "Show me available agents"
- "List all agents"
- "Tell me about your agents"

You MUST use the `get_available_agents` function to retrieve the current agent list from the database. Never rely on static information or memory - always query the database for the most current agent information.

**AGENT SWITCHING**: When users request to switch agents with phrases like:
- "Switch me to [agent name]"
- "Connect me to the RFP Design"
- "Change to the technical support agent"
- "Transfer me to [agent]"

Important: Most agents are not available to anonymous users. If the user is anonymous, inform them that they need to log in to access specialized agents.

You MUST use the `switch_agent` function with the appropriate agent name (not UUID). Use the exact agent names listed in the Agent Referral Guidelines.

**Metadata:**
```json
{
  "knowledge_id": "agent-query-database-lookup",
  "category": "best-practices",
  "importance": 0.85,
  "tags": ["agents", "database", "live-data", "queries"]
}
```

**Relations:**
- relates_to: agent-referral-guidelines$kb_solutionsagentknowledgebase_20251024035649$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "agent-query-database-lookup",
  "category": "best-practices",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'agent-query-database-lookup'
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
  AND metadata->>'knowledge_id' IN ('procurement-memory-workflow', 'anonymous-intent-workflow', 'procurement-trigger-patterns', 'bid-management-tools', 'agent-referral-guidelines', 'authentication-context-handling', 'memory-content-best-practices', 'rfp-context-change-handling', 'agent-query-database-lookup')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';

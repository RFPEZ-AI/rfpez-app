# Available Tools for RFPEZ.AI Agents
**Last Updated:** October 13, 2025  
**Source:** `supabase/functions/claude-api-v3/tools/definitions.ts`

---

## 📋 Table of Contents
1. [RFP Management Tools](#rfp-management-tools)
2. [Artifact Tools](#artifact-tools)
3. [Form Management Tools](#form-management-tools)
4. [Conversation Tools](#conversation-tools)
5. [Agent Management Tools](#agent-management-tools)
6. [Bid Management Tools](#bid-management-tools)
7. [Memory Tools](#memory-tools)
8. [Role-Based Tool Access](#role-based-tool-access)

---

## RFP Management Tools

### `create_and_set_rfp`
**Description:** Create a new RFP and automatically set it as the current active RFP for the session.

**Parameters:**
- `name` (required): Descriptive RFP name based on procurement subject
- `description` (optional): Detailed description of what is being procured
- `specification` (optional): Technical specifications or requirements
- `due_date` (optional): Due date in YYYY-MM-DD format

**Returns:** `{success: true, rfp_id: number, name: string, ...}`

**Example:**
```javascript
create_and_set_rfp({
  name: "Industrial Use Alcohol RFP",
  description: "Procurement of industrial-grade ethanol for manufacturing",
  due_date: "2025-12-31"
})
```

### `get_current_rfp`
**Description:** Get the currently active RFP for the session.

**Parameters:**
- `session_id` (required): Session ID to check for current RFP

**Returns:** `{rfp_id: number, name: string, ...}` or `null` if no RFP set

---

## Artifact Tools

### `list_artifacts`
**Description:** List artifacts with optional scope filtering.

**Parameters:**
- `session_id` (optional): Session ID (uses current if not provided)
- `all_artifacts` (optional): If true, lists all account artifacts; if false (default), lists only session artifacts
- `artifact_type` (optional): Filter by type (form, document, text, etc.)
- `limit` (optional): Maximum number to return (default: 50)

### `get_current_artifact_id`
**Description:** Get the ID of the currently selected artifact in the artifact window.

**Parameters:**
- `session_id` (optional): Session ID (uses current if not provided)

### `select_active_artifact`
**Description:** Select an artifact to be displayed in the artifact window.

**Parameters:**
- `artifact_id` (required): The ID of the artifact to select and display
- `session_id` (optional): Session ID (uses current if not provided)

---

## Form Management Tools

### `create_form_artifact`
**Description:** Create a form artifact (questionnaire, bid form, etc.) and store it in the database.

**⚠️ CRITICAL:** Must be associated with an RFP. Call `create_and_set_rfp` first or use `get_current_rfp` to get RFP ID.

**Parameters:**
- `rfp_id` (required): RFP ID to associate this artifact with
- `name` (required): Name of the form artifact
- `description` (required): Description of the form artifact
- `content` (required): Form schema object with fields, structure, validation rules
- `artifactRole` (required): Role/type - use `"buyer_questionnaire"` or `"bid_form"`

**Allowed artifact roles:**
- `buyer_questionnaire`, `bid_form`, `vendor_response_form`, `supplier_response_form`
- `vendor_form`, `supplier_form`, `response_form`, `buyer_form`
- `requirements_form`, `request_document`, `template`

**Example:**
```javascript
create_form_artifact({
  rfp_id: 123,
  name: "LED Lighting Requirements",
  description: "Buyer questionnaire for LED lighting procurement",
  content: {
    type: "object",
    properties: {
      quantity: { type: "number" },
      wattage: { type: "number" }
    },
    required: ["quantity"]
  },
  artifactRole: "buyer_questionnaire"
})
```

### `create_document_artifact`
**Description:** Create a document artifact (text, RFP document, etc.) and store in database.

**Parameters:**
- `rfp_id` (required): RFP ID to associate with
- `name` (required): Document name/title
- `description` (optional): Document description
- `content` (required): Text content (markdown, plain text, HTML)
- `content_type` (optional): `"markdown"`, `"plain"`, or `"html"` (default: markdown)
- `artifactRole` (required): Document type
- `tags` (optional): Array of tags for categorization

**Allowed artifact roles:**
- `request_document`, `rfp_document`, `proposal_document`
- `specification_document`, `contract_document`, `report_document`
- `template`, `other_document`

### `get_form_schema`
**Description:** Get the JSON schema for a form artifact to see available fields and constraints.

**⚠️ ALWAYS call this before `update_form_data`** to ensure correct field names and enum values.

**Parameters:**
- `artifact_id` (required): ID or name of form artifact
- `session_id` (required): Current session ID

### `update_form_data`
**Description:** Update form data (default_values) for an existing form artifact.

**Parameters:**
- `artifact_id` (required): ID or name of form artifact (UUID preferred)
- `session_id` (required): Current session ID
- `form_data` (required): Complete form data object with field names EXACTLY matching schema

**⚠️ IMPORTANT:** Field names must EXACTLY match the form schema properties from `get_form_schema`.

### `update_form_artifact`
**Description:** Update an existing form artifact with new data or schema.

**Parameters:**
- `artifact_id` (required): ID of artifact to update
- `updates` (required): Updates object (nested structure with form updates)

---

## Conversation Tools

### `get_conversation_history`
**Description:** Retrieve conversation history for the current session.

**Parameters:**
- `sessionId` (optional): Session ID (uses current if not provided)
- `limit` (optional): Max messages to retrieve (default: 50)

### `store_message`
**Description:** Store a message in conversation history with optional metadata.

**Parameters:**
- `sessionId` (optional): Session ID (uses current if not provided)
- `agentId` (optional): Agent ID for the message
- `sender` (required): `"user"` or `"assistant"`
- `content` (required): Message content
- `metadata` (optional): Tool execution tracking (functions_called, agent_id, model, etc.)

### `search_messages`
**Description:** Search messages across all user conversations.

**Parameters:**
- `query` (required): Search query to find in message content
- `limit` (optional): Max results to return (default: 20)

---

## Agent Management Tools

### `get_available_agents`
**Description:** Get all available agents with their IDs and details.

**Parameters:**
- `include_restricted` (optional): Include premium agents (default: false)

**⚠️ CRITICAL:** Always display the `formatted_agent_list` field from response.

### `get_current_agent`
**Description:** Get the currently active agent for a specific session.

**Parameters:**
- `session_id` (required): Session UUID

### `switch_agent`
**Description:** Switch to a different AI agent.

**Parameters:**
- `session_id` (required): Session UUID
- `agent_name` (required): Agent name to switch to
  - Use `"RFP Design"` for RFP creation
  - Use `"Solutions"` for sales questions
  - Use `"Support"` for technical help
- `agent_id` (optional): Alternative to agent_name (UUID)
- `user_input` (optional): Original user request for context
- `reason` (optional): Reason for switching

**Allowed agent names:**
- `"RFP Design"`, `"Solutions"`, `"Support"`, `"Technical Support"`, `"RFP Assistant"`

### `recommend_agent`
**Description:** Recommend the best agent for a specific topic or request.

**Parameters:**
- `topic` (required): Topic or user request
- `conversation_context` (optional): Context from current conversation

### `debug_agent_switch`
**Description:** Debug tool when unable to determine which agent user wants.

**Parameters:**
- `user_input` (required): Exact user input about switching agents
- `extracted_keywords` (required): Keywords found in input
- `confusion_reason` (required): Why target agent cannot be determined

---

## Bid Management Tools

### `submit_bid`
**Description:** Submit a bid to create permanent bid record.

**Two modes:**
1. **Form-based:** With `artifact_id` to submit from form artifact
2. **Direct:** With `supplier_name`, `bid_price`, `delivery_days` for quick submission

**Parameters:**
- `rfp_id` (required): RFP ID this bid is for
- `artifact_id` (optional): Form artifact ID (for form-based submission)
- `supplier_id` (optional): Supplier ID
- `form_data` (optional): Form data to save before submission
- `supplier_name` (optional): Company name (for direct submission)
- `bid_price` (optional): Bid amount in dollars (for direct submission)
- `delivery_days` (optional): Delivery days (for direct submission)

### `get_rfp_bids`
**Description:** Get all bids for a specific RFP with status and details.

**Parameters:**
- `rfp_id` (required): RFP ID to get bids for

### `update_bid_status`
**Description:** Update bid status (draft, submitted, under_review, accepted, rejected).

**Parameters:**
- `bid_id` (required): Bid ID to update
- `status` (required): New status
- `status_reason` (optional): Reason for status change
- `reviewer_id` (optional): Person making the change
- `score` (optional): Bid score (0-100)

**Allowed statuses:**
- `draft`, `submitted`, `under_review`, `accepted`, `rejected`

---

## Memory Tools

### `create_memory`
**Description:** Store important information about user preferences, decisions, facts, or context.

**Use when users say:** "prefer", "always", "never", "for all future", "remember this", etc.

**Parameters:**
- `content` (required): Memory content (clear, concise description)
- `memory_type` (required): Memory type
  - `"preference"`: User likes/dislikes/requirements
  - `"fact"`: Important info about user/organization
  - `"decision"`: Choices made during conversation
  - `"context"`: RFP/bid details
  - `"conversation"`: Notable conversation snippets
- `importance_score` (required): Score 0.0-1.0
  - `0.9`: Explicit preferences ("I always prefer...")
  - `0.7`: Decisions
  - `0.5`: Context
  - `0.3`: Conversation notes
- `reference_type` (optional): What memory relates to
  - `"rfp"`, `"bid"`, `"artifact"`, `"message"`, `"user_profile"`
- `reference_id` (optional): UUID of related entity

### `search_memories`
**Description:** Search for relevant memories from past conversations.

**Use when:** Starting new sessions, user refers to past preferences, need to recall context.

**Parameters:**
- `query` (required): Search query (e.g., "vendor preferences", "LED lighting requirements")
- `memory_types` (optional): Comma-separated types to filter ("preference,fact" or "decision")
- `limit` (optional): Max memories to return (default 10, max 20)

---

## Role-Based Tool Access

### Sales Role (`sales` - Solutions Agent)
**Blocked Tools:**
- `create_and_set_rfp` (must switch to RFP Design for RFP creation)

**All other tools:** Allowed

### Design Role (`design` - RFP Design Agent)
**Allowed Tools (explicit whitelist):**
- `create_and_set_rfp`, `get_current_rfp`
- `create_form_artifact`, `create_document_artifact`
- `get_form_schema`, `update_form_data`, `update_form_artifact`
- `submit_bid`, `get_rfp_bids`, `update_bid_status`
- `get_available_agents`, `get_current_agent`, `debug_agent_switch`, `recommend_agent`
- `get_conversation_history`, `store_message`, `search_messages`
- `create_memory`, `search_memories`

**Blocked Tools:**
- `switch_agent` (prevents self-switching loops)

### Support Role (`support` - Support Agent)
**Blocked Tools:**
- `create_and_set_rfp`
- `create_form_artifact`

**All other tools:** Allowed

---

## ⚠️ Deprecated Tools (DO NOT USE)

These tools are referenced in older instructions but are **NOT AVAILABLE** in claude-api-v3:

### ❌ `supabase_update`
**Status:** NOT AVAILABLE  
**Reason:** Direct database updates bypassed in favor of specialized tools  
**Replacement:** Use `update_form_data` or `update_form_artifact` for form updates

### ❌ `supabase_select`
**Status:** NOT AVAILABLE  
**Reason:** Direct database queries bypassed in favor of specialized retrieval tools  
**Replacement:** Use `get_current_rfp`, `get_form_schema`, `get_rfp_bids`, etc.

### ❌ `supabase_insert`
**Status:** NOT AVAILABLE  
**Reason:** Direct database inserts bypassed in favor of creation tools  
**Replacement:** Use `create_and_set_rfp`, `create_form_artifact`, `create_document_artifact`

---

## 🔒 Security Note

**Supabase MCP Server** (`supabase-mcp-server` edge function) provides generic database tools (`supabase_select`, `supabase_update`, `supabase_insert`, `supabase_delete`) but is **NOT USED** by current agents for security reasons.

- These generic tools are preserved for future Administrator agent use
- Current agents use specialized, validated tools from claude-api-v3
- Direct database access restricted to prevent unauthorized data manipulation

---

## 📚 Additional Resources

- **Tool Definitions Source:** `supabase/functions/claude-api-v3/tools/definitions.ts`
- **Tool Handlers:** `supabase/functions/claude-api-v3/tools/database.ts` and `tools/rfp.ts`
- **Agent Instructions:** `Agent Instructions/` directory
- **API Documentation:** See edge function inline comments

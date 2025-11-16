# Agent Inheritance System - Design Document

**Date**: 2025-11-16  
**Version**: 1.0  
**Status**: Design Phase

## Executive Summary

This document outlines the design and implementation plan for an agent inheritance system in RFPEZ.AI that enables specialized agents to inherit instructions, tools, and properties from parent agents. This creates a composable agent architecture that reduces duplication and enables rapid creation of specialized agents.

---

## Table of Contents

1. [Objectives](#objectives)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Proposed Design](#proposed-design)
4. [Database Schema Changes](#database-schema-changes)
5. [Implementation Steps](#implementation-steps)
6. [Testing Strategy](#testing-strategy)
7. [Migration Plan](#migration-plan)
8. [Success Criteria](#success-criteria)

---

## Objectives

### Primary Goals

1. **Enable Agent Inheritance**: Allow agents to inherit instructions and properties from parent agents
2. **Recursive Inheritance**: Support multi-level inheritance (e.g., TMC Specialist → RFP Design → Common)
3. **Reduce Duplication**: Extract common agent behavior into reusable `_common` abstract agent
4. **Maintain Backwards Compatibility**: Existing agents continue working without changes
5. **Comprehensive Logging**: Track instruction merging for debugging and verification

### Non-Goals

- Changing the Claude API integration architecture
- Modifying the UI agent selection experience
- Altering the session management system
- Performance optimization (this phase focuses on functionality)

---

## Current Architecture Analysis

### Agent Data Structure

**Current `agents` table schema:**
```sql
CREATE TABLE public.agents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  instructions TEXT NOT NULL,
  initial_prompt TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_restricted BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  role TEXT,
  access TEXT[] -- Array of allowed tool names
);
```

### Current Agent Loading Flow

1. **Entry Point**: `loadAgentContext()` in `utils/system-prompt.ts`
2. **Database Query**: Loads single agent by ID or session
3. **System Prompt Construction**: `buildSystemPrompt()` uses agent instructions directly
4. **Tool Access**: `access` array defines allowed tools per agent
5. **No Inheritance**: Each agent is self-contained

### Existing Agents

**Current agents with significant instruction overlap:**

1. **Solutions Agent** (sales) - 408 lines
2. **RFP Design Agent** (design) - 504 lines
3. **Support Agent** - Similar patterns
4. **Audit Agent** - Similar patterns
5. **Billing Agent** - Similar patterns
6. **Negotiation Agent** - Similar patterns
7. **Publishing Agent** - Similar patterns
8. **Signing Agent** - Similar patterns
9. **Sourcing Agent** - Similar patterns

**Common patterns across agents:**
- Memory MCP integration (create_memory, search_memories)
- Conversation history management (get_conversation_history, store_message)
- Agent management (switch_agent, get_available_agents, recommend_agent)
- Perplexity web search tools (perplexity_search, perplexity_ask, etc.)
- Basic greeting/welcome behavior
- Authentication context handling

---

## Proposed Design

### 1. Agent Inheritance Hierarchy

```
_common (Abstract Base Agent)
├── Solutions (Sales)
├── RFP Design (Design)
│   └── TMC Specialist (Specialized Design)
├── Support
├── Audit
├── Billing
├── Negotiation
├── Publishing
├── Signing
└── Sourcing
```

### 2. Inheritance Mechanism

**Recursive Instruction Merging:**

When loading an agent, the system will:

1. Load the requested agent from database
2. Check if `parent_agent_id` is set
3. If yes, recursively load parent agent(s)
4. Merge instructions from parent → child (child overwrites parent)
5. Aggregate tool access permissions
6. Return the fully composed agent

**Pseudo-code:**
```typescript
async function loadAgentWithInheritance(agentId: string): Promise<Agent> {
  const agent = await loadAgentFromDB(agentId);
  
  if (!agent.parent_agent_id) {
    return agent; // Base case: no parent
  }
  
  // Recursive case: load parent and merge
  const parent = await loadAgentWithInheritance(agent.parent_agent_id);
  
  return mergeAgents(parent, agent);
}

function mergeAgents(parent: Agent, child: Agent): Agent {
  return {
    ...child,
    instructions: parent.instructions + "\n\n" + child.instructions,
    access: [...new Set([...(parent.access || []), ...(child.access || [])])],
    // Other properties from child take precedence
  };
}
```

### 3. Abstract Agent Concept

**`_common` agent characteristics:**

- **Name**: `_common` (underscore prefix indicates abstract)
- **is_active**: `false` (not selectable in UI)
- **is_abstract**: `true` (new field)
- **parent_agent_id**: `null` (root of hierarchy)
- **Instructions**: Core behaviors shared across all agents
- **Access**: Base set of tools available to all agents

**What goes in `_common`:**

- Memory MCP integration instructions
- Conversation history management
- Agent switching protocols
- Perplexity integration guidelines
- Authentication context handling
- General greeting behavior
- Error handling patterns
- Logging/debugging instructions

**What stays in specialized agents:**

- Role-specific instructions (e.g., RFP creation for Design agent)
- Specialized tool usage (e.g., create_and_set_rfp)
- Domain-specific knowledge
- Role-specific initial prompts
- Custom greeting messages

### 4. Tool Access Aggregation

**Tool inheritance strategy:**

- **Union of parent tools**: Child inherits all parent tools
- **Additive only**: Child can add more tools, not remove
- **De-duplication**: Automatic removal of duplicates
- **Explicit override**: Child can specify `access_override` to replace parent tools entirely (rare)

**Example:**
```typescript
_common.access = ['create_memory', 'search_memories', 'get_conversation_history']
RFP_Design.access = ['create_and_set_rfp', 'create_form_artifact']
// Merged: ['create_memory', 'search_memories', 'get_conversation_history', 
//           'create_and_set_rfp', 'create_form_artifact']

TMC_Specialist.access = ['get_tmc_templates']
// Merged: All of the above + 'get_tmc_templates'
```

### 5. Logging & Verification

**Comprehensive logging at each stage:**

```typescript
console.log('🔗 AGENT INHERITANCE CHAIN:', {
  agentId: agent.id,
  agentName: agent.name,
  parentChain: ['_common', 'RFP Design', 'TMC Specialist'],
  totalInstructionsLength: mergedInstructions.length,
  instructionSources: [
    { agent: '_common', length: 5000 },
    { agent: 'RFP Design', length: 3000 },
    { agent: 'TMC Specialist', length: 1000 }
  ],
  mergedTools: mergedAccess,
  toolSources: [
    { agent: '_common', tools: ['create_memory', ...] },
    { agent: 'RFP Design', tools: ['create_and_set_rfp', ...] },
    { agent: 'TMC Specialist', tools: ['get_tmc_templates'] }
  ]
});

console.log('📝 MERGED INSTRUCTIONS PREVIEW:', {
  first200Chars: mergedInstructions.substring(0, 200),
  last200Chars: mergedInstructions.substring(mergedInstructions.length - 200),
  sectionBreaks: mergedInstructions.match(/\n\n## /g)?.length || 0
});
```

---

## Database Schema Changes

### 1. Add Inheritance Columns to `agents` Table

```sql
-- Migration: Add agent inheritance support
ALTER TABLE public.agents 
  ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_abstract BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inheritance_depth INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS access_override BOOLEAN DEFAULT FALSE;

-- Index for inheritance queries
CREATE INDEX IF NOT EXISTS idx_agents_parent ON public.agents(parent_agent_id) WHERE parent_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_abstract ON public.agents(is_abstract) WHERE is_abstract = TRUE;

-- Prevent circular inheritance (basic check)
ALTER TABLE public.agents 
  ADD CONSTRAINT chk_no_self_parent CHECK (id != parent_agent_id);

COMMENT ON COLUMN public.agents.parent_agent_id IS 'UUID of parent agent for inheritance';
COMMENT ON COLUMN public.agents.is_abstract IS 'True if agent is abstract (not selectable in UI)';
COMMENT ON COLUMN public.agents.inheritance_depth IS 'Cached depth in inheritance tree (0 = root)';
COMMENT ON COLUMN public.agents.access_override IS 'True to replace parent tools instead of merging';
```

### 2. Create Agent Hierarchy View (Optional)

```sql
-- Recursive CTE view to show full inheritance chains
CREATE OR REPLACE VIEW agent_hierarchy AS
WITH RECURSIVE agent_tree AS (
  -- Base case: agents with no parent
  SELECT 
    id,
    name,
    parent_agent_id,
    is_abstract,
    0 as depth,
    ARRAY[name] as inheritance_chain
  FROM agents
  WHERE parent_agent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: agents with parents
  SELECT 
    a.id,
    a.name,
    a.parent_agent_id,
    a.is_abstract,
    at.depth + 1,
    at.inheritance_chain || a.name
  FROM agents a
  INNER JOIN agent_tree at ON a.parent_agent_id = at.id
)
SELECT * FROM agent_tree;
```

### 3. Update Existing Agents to Set Inheritance Depth

```sql
-- Helper function to calculate inheritance depth
CREATE OR REPLACE FUNCTION calculate_inheritance_depth(agent_id UUID) 
RETURNS INTEGER AS $$
DECLARE
  depth INTEGER := 0;
  current_id UUID := agent_id;
  parent_id UUID;
BEGIN
  LOOP
    SELECT parent_agent_id INTO parent_id FROM agents WHERE id = current_id;
    EXIT WHEN parent_id IS NULL;
    depth := depth + 1;
    current_id := parent_id;
    
    -- Prevent infinite loops
    IF depth > 10 THEN
      RAISE EXCEPTION 'Inheritance depth exceeds maximum (10 levels)';
    END IF;
  END LOOP;
  
  RETURN depth;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update inheritance depth
CREATE OR REPLACE FUNCTION update_inheritance_depth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inheritance_depth := calculate_inheritance_depth(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inheritance_depth
  BEFORE INSERT OR UPDATE OF parent_agent_id ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_inheritance_depth();
```

---

## Implementation Steps

### Phase 1: Database Schema & Infrastructure (Day 1)

**Step 1.1: Create Migration File**
```bash
supabase migration new add_agent_inheritance
```

**Step 1.2: Apply Schema Changes Locally**
- Add columns to `agents` table
- Create indexes
- Add constraints
- Create helper functions and triggers
- Test with `supabase migration up`

**Step 1.3: Verify Schema**
```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents' 
  AND column_name IN ('parent_agent_id', 'is_abstract', 'inheritance_depth', 'access_override');
```

**Deliverable**: Migration file ready for deployment

---

### Phase 2: Core Inheritance Logic (Day 1-2)

**Step 2.1: Create Agent Inheritance Module**

Create new file: `supabase/functions/claude-api-v3/utils/agent-inheritance.ts`

```typescript
// Agent Inheritance Module
// Handles recursive agent loading and instruction merging

export interface InheritanceChain {
  agentId: string;
  agentName: string;
  depth: number;
  instructionsLength: number;
  toolsCount: number;
}

export interface MergedAgent extends Agent {
  _inheritanceChain?: InheritanceChain[];
  _mergedInstructionsLength?: number;
  _mergedToolsCount?: number;
}

/**
 * Recursively load agent with all parent agents in inheritance chain
 * @param supabase - Supabase client
 * @param agentId - ID of agent to load
 * @param depth - Current recursion depth (prevents infinite loops)
 * @returns Fully merged agent with inherited instructions and tools
 */
export async function loadAgentWithInheritance(
  supabase: any,
  agentId: string,
  depth: number = 0,
  maxDepth: number = 10,
  inheritanceChain: InheritanceChain[] = []
): Promise<MergedAgent | null> {
  
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.error('🚨 AGENT INHERITANCE - Maximum depth exceeded:', {
      agentId,
      depth,
      maxDepth,
      chain: inheritanceChain
    });
    throw new Error(`Agent inheritance depth exceeds maximum (${maxDepth})`);
  }

  // Load current agent
  console.log(`🔗 AGENT INHERITANCE - Loading agent (depth ${depth}):`, agentId);
  
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, instructions, initial_prompt, role, access, parent_agent_id, is_abstract, access_override')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    console.error('❌ AGENT INHERITANCE - Failed to load agent:', {
      agentId,
      error,
      depth
    });
    return null;
  }

  // Add current agent to inheritance chain
  const currentChainEntry: InheritanceChain = {
    agentId: agent.id,
    agentName: agent.name,
    depth: depth,
    instructionsLength: agent.instructions?.length || 0,
    toolsCount: agent.access?.length || 0
  };
  
  const updatedChain = [...inheritanceChain, currentChainEntry];

  // Base case: no parent agent
  if (!agent.parent_agent_id) {
    console.log('✅ AGENT INHERITANCE - Reached root agent:', {
      name: agent.name,
      depth,
      instructionsLength: agent.instructions?.length || 0
    });
    
    return {
      ...agent,
      _inheritanceChain: updatedChain,
      _mergedInstructionsLength: agent.instructions?.length || 0,
      _mergedToolsCount: agent.access?.length || 0
    };
  }

  // Recursive case: load parent and merge
  console.log('🔄 AGENT INHERITANCE - Loading parent agent:', {
    childName: agent.name,
    parentId: agent.parent_agent_id,
    depth
  });

  const parentAgent = await loadAgentWithInheritance(
    supabase,
    agent.parent_agent_id,
    depth + 1,
    maxDepth,
    updatedChain
  );

  if (!parentAgent) {
    console.error('❌ AGENT INHERITANCE - Parent agent not found:', {
      childName: agent.name,
      parentId: agent.parent_agent_id
    });
    // Return child agent without parent inheritance
    return {
      ...agent,
      _inheritanceChain: updatedChain,
      _mergedInstructionsLength: agent.instructions?.length || 0,
      _mergedToolsCount: agent.access?.length || 0
    };
  }

  // Merge parent and child
  return mergeAgentWithParent(parentAgent, agent, updatedChain);
}

/**
 * Merge parent and child agents
 * Instructions: parent first, then child (child can override)
 * Tools: union of parent and child (unless access_override is true)
 */
function mergeAgentWithParent(
  parent: MergedAgent,
  child: Agent,
  inheritanceChain: InheritanceChain[]
): MergedAgent {
  
  console.log('🔧 AGENT INHERITANCE - Merging agents:', {
    parent: parent.name,
    child: child.name,
    parentInstructionsLength: parent.instructions?.length || 0,
    childInstructionsLength: child.instructions?.length || 0
  });

  // Merge instructions: parent → child
  const mergedInstructions = [
    parent.instructions || '',
    '\n\n' + '='.repeat(80),
    `\n## SPECIALIZED AGENT: ${child.name}`,
    '='.repeat(80) + '\n',
    child.instructions || ''
  ].join('');

  // Merge tools
  let mergedAccess: string[];
  
  if (child.access_override) {
    // Child explicitly overrides parent tools
    mergedAccess = child.access || [];
    console.log('⚠️ AGENT INHERITANCE - Child overrides parent tools:', {
      child: child.name,
      childTools: child.access
    });
  } else {
    // Union of parent and child tools (default)
    const parentTools = parent.access || [];
    const childTools = child.access || [];
    mergedAccess = [...new Set([...parentTools, ...childTools])];
    
    console.log('✅ AGENT INHERITANCE - Merged tools:', {
      parent: parent.name,
      child: child.name,
      parentTools: parentTools.length,
      childTools: childTools.length,
      mergedTools: mergedAccess.length,
      tools: mergedAccess
    });
  }

  const merged: MergedAgent = {
    ...child, // Child properties take precedence
    instructions: mergedInstructions,
    access: mergedAccess,
    _inheritanceChain: inheritanceChain,
    _mergedInstructionsLength: mergedInstructions.length,
    _mergedToolsCount: mergedAccess.length
  };

  console.log('✅ AGENT INHERITANCE - Merge complete:', {
    finalAgent: merged.name,
    totalInstructions: merged._mergedInstructionsLength,
    totalTools: merged._mergedToolsCount,
    chainDepth: inheritanceChain.length,
    chain: inheritanceChain.map(c => c.agentName).join(' → ')
  });

  return merged;
}

/**
 * Log detailed inheritance information for debugging
 */
export function logInheritanceDetails(agent: MergedAgent): void {
  if (!agent._inheritanceChain || agent._inheritanceChain.length <= 1) {
    console.log('ℹ️ AGENT INHERITANCE - No inheritance for agent:', agent.name);
    return;
  }

  console.log('📊 AGENT INHERITANCE - Detailed breakdown:');
  console.log('━'.repeat(80));
  console.log(`Final Agent: ${agent.name} (ID: ${agent.id})`);
  console.log(`Total Instructions: ${agent._mergedInstructionsLength} characters`);
  console.log(`Total Tools: ${agent._mergedToolsCount}`);
  console.log('');
  console.log('Inheritance Chain:');
  
  agent._inheritanceChain.forEach((link, index) => {
    const indent = '  '.repeat(link.depth);
    console.log(`${indent}${index + 1}. ${link.agentName}`);
    console.log(`${indent}   - Instructions: ${link.instructionsLength} chars`);
    console.log(`${indent}   - Tools: ${link.toolsCount}`);
    console.log(`${indent}   - Depth: ${link.depth}`);
  });
  
  console.log('━'.repeat(80));
  console.log('');
  console.log('Merged Instructions Preview:');
  console.log('First 300 chars:', agent.instructions.substring(0, 300));
  console.log('...');
  console.log('Last 300 chars:', agent.instructions.substring(agent.instructions.length - 300));
  console.log('━'.repeat(80));
}
```

**Step 2.2: Update System Prompt Module**

Modify `supabase/functions/claude-api-v3/utils/system-prompt.ts`:

```typescript
import { loadAgentWithInheritance, logInheritanceDetails } from './agent-inheritance.ts';

// In loadAgentContext function, replace direct agent loading with inheritance-aware loading:

export async function loadAgentContext(
  supabase: unknown, 
  sessionId?: string, 
  agentId?: string
): Promise<Agent | null> {
  console.log('🔧 loadAgentContext - ENTRY POINT:', { sessionId, agentId });
  
  if (!sessionId && !agentId) {
    console.log('❌ loadAgentContext - No session ID or agent ID provided');
    return null;
  }

  try {
    let targetAgentId: string | null = null;

    // Determine which agent to load
    if (agentId) {
      targetAgentId = agentId;
    } else if (sessionId) {
      // Load active agent for session
      const { data } = await (supabase as any)
        .from('session_agents')
        .select('agent_id')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      targetAgentId = data?.agent_id;
    }

    if (!targetAgentId) {
      console.log('⚠️ loadAgentContext - No agent ID determined');
      return null;
    }

    // 🔗 NEW: Load agent with inheritance
    const agent = await loadAgentWithInheritance(supabase, targetAgentId);
    
    if (agent && agent._inheritanceChain) {
      // Log detailed inheritance information
      logInheritanceDetails(agent);
    }

    return agent;
    
  } catch (error) {
    console.error('🚨 Error in loadAgentContext:', error);
    return null;
  }
}
```

**Deliverable**: Core inheritance loading and merging logic

---

### Phase 3: Create `_common` Abstract Agent (Day 2)

**Step 3.1: Extract Common Instructions**

Analyze existing agents to identify common patterns:

```bash
# Compare agent instruction files
diff "Agent Instructions/Solutions Agent.md" "Agent Instructions/RFP Design Agent.md"
```

**Step 3.2: Create `_common` Agent Markdown**

Create: `Agent Instructions/_common.md`

```markdown
## Name: _common
**Database ID**: (to be generated)
**Role**: `abstract`
**Avatar URL**: null
**Is Abstract**: true
**Is Active**: false

## Allowed Tools:
- create_memory
- search_memories
- get_conversation_history
- store_message
- search_messages
- get_current_agent
- get_available_agents
- switch_agent
- recommend_agent
- perplexity_search
- perplexity_ask

## Description:
Abstract base agent containing common behavior shared across all RFPEZ.AI agents

## Instructions:

### Core Agent Behavior

You are an AI assistant for the RFPEZ.AI platform. You have access to a comprehensive memory system and conversation history that helps you provide personalized assistance across sessions.

### Memory System Integration

**CRITICAL: Always use memory for context**

1. **Check Memory First**: Before responding to any request, search memories for relevant context
2. **Store Important Information**: Save key decisions, preferences, and outcomes
3. **Cross-Session Continuity**: Use memories to maintain context across conversations

**Memory Best Practices:**
- Store user preferences and recurring needs
- Remember key decisions and their rationale
- Track ongoing projects and their status
- Note important deadlines and milestones

### Conversation History

Access conversation history to:
- Understand the full context of current discussion
- Reference previous decisions and agreements
- Maintain continuity in long conversations
- Avoid repeating questions or information

### Agent Switching & Recommendations

**When to Recommend Agent Switches:**
- User requests specialized assistance outside your core competency
- Task requires tools or knowledge specific to another agent
- User explicitly asks for a different type of help

**How to Switch Agents:**
1. Use `recommend_agent` to suggest appropriate agent
2. Explain why the switch would be beneficial
3. Use `switch_agent` when user confirms or task requires it
4. Include relevant context in the handoff

### Perplexity Web Search Integration

You have access to real-time web search and research capabilities:

**perplexity_search**: Quick web search for current information
- Use for: Market data, pricing, vendor info, industry standards
- Example: Finding current LED bulb suppliers

**perplexity_ask**: Conversational AI for quick answers
- Use for: Product specs, typical pricing, general guidance
- Example: "What are typical lead times for industrial components?"

**perplexity_research**: Comprehensive research
- Use for: Market analysis, competitive research, technical specs
- Example: Comparing energy efficiency standards

**perplexity_reason**: Advanced reasoning and comparison
- Use for: Vendor comparisons, trade-off analysis, recommendations
- Example: Bulk vs just-in-time purchasing analysis

**Important**: Don't mention tool names to users - naturally integrate results

### Authentication Context

**For Authenticated Users:**
- Greet by name if available
- Reference their role and permissions
- Access their full conversation and memory history
- Provide personalized recommendations

**For Anonymous Users:**
- Provide general assistance
- Encourage sign-up for advanced features
- Store intent in memory using `create_memory` with type "anonymous_intent"
- After authentication, retrieve and fulfill stored intent

### Error Handling

**When Errors Occur:**
- Apologize clearly and specifically
- Explain what went wrong in user-friendly terms
- Suggest alternative approaches
- Offer to escalate or get human help if needed

**Tool Execution Failures:**
- Retry once if transient error suspected
- Fall back to alternative tools if available
- Inform user of limitation and suggest workaround

### Logging & Debugging

**For Development/Testing:**
- Log key decision points
- Track tool usage and outcomes
- Note any unexpected behavior
- Include context in error messages

### Communication Style

- Professional yet friendly
- Clear and concise
- Action-oriented
- Empathetic to user needs
- Transparent about capabilities and limitations

---

## Initial Prompt:

You are a helpful AI assistant for RFPEZ.AI. I'll be specialized in a specific area, but I'm here to help you with procurement and RFP management.

(Note: Specialized agents will override this with their own initial prompts)
```

**Step 3.3: Create CLI Command to Insert `_common` Agent**

```bash
node scripts/md-to-sql-migration.js "Agent Instructions/_common.md"
```

**Step 3.4: Apply Migration and Verify**

```bash
supabase migration up

# Verify _common agent was created
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT id, name, is_abstract, is_active, LENGTH(instructions) as inst_len 
FROM agents 
WHERE name = '_common';"
```

**Deliverable**: `_common` abstract agent created in database

---

### Phase 4: Refactor Existing Agents (Day 2-3)

**Step 4.1: Update Solutions Agent**

1. Get `_common` agent UUID from database
2. Extract common instructions from Solutions Agent
3. Update Solutions Agent to reference `_common` as parent
4. Remove duplicated instructions

**Modified**: `Agent Instructions/Solutions Agent.md`

```markdown
## Name: Solutions
**Database ID**: `4fe117af-da1d-410c-bcf4-929012d8a673`
**Parent Agent**: `_common` (inherit common behavior)
**Role**: `sales`
**Avatar URL**: `/assets/avatars/solutions-agent.svg`

## Allowed Tools (in addition to parent tools):
- (Solutions-specific tools only - memory/search tools now inherited from _common)

## Description:
Sales agent for EZRFP.APP to help with product questions and competitive sourcing

## Instructions:

(Remove common Memory, Perplexity, Agent Switching sections - now inherited)

### Sales-Specific Behavior

You are the Solutions agent - the sales expert for RFPEZ.AI platform...

(Keep only Solutions-specific instructions)
```

**Step 4.2: Update RFP Design Agent**

Same process as Solutions Agent:

```markdown
## Name: RFP Design
**Database ID**: `8c5f11cb-1395-4d67-821b-89dd58f0c8dc`
**Parent Agent**: `_common` (inherit common behavior)
**Role**: `design`
**Avatar URL**: `/assets/avatars/rfp-designer.svg`

## Allowed Tools (in addition to parent tools):
- create_and_set_rfp
- set_current_rfp
- get_current_rfp
- create_form_artifact
- update_form_data
- get_form_schema
- update_form_artifact
- create_document_artifact
- list_artifacts
- select_active_artifact
- submit_bid
- get_rfp_bids
- update_bid_status
- perplexity_research

## Instructions:

### RFP Design Specialist Behavior

You are the RFP Design agent - expert in creating comprehensive procurement documents...

(Keep only RFP Design-specific instructions)
```

**Step 4.3: Update Database Records**

```sql
-- Get _common agent UUID first
SELECT id FROM agents WHERE name = '_common';
-- Copy the UUID (e.g., 'xxx-xxx-xxx')

-- Update Solutions Agent
UPDATE agents 
SET parent_agent_id = 'xxx-xxx-xxx'  -- _common UUID
WHERE name = 'Solutions';

-- Update RFP Design Agent
UPDATE agents 
SET parent_agent_id = 'xxx-xxx-xxx'  -- _common UUID
WHERE name = 'RFP Design';

-- Verify inheritance setup
SELECT 
  a.name,
  a.parent_agent_id,
  p.name as parent_name,
  a.inheritance_depth
FROM agents a
LEFT JOIN agents p ON a.parent_agent_id = p.id
WHERE a.name IN ('Solutions', 'RFP Design', '_common');
```

**Step 4.4: Use CLI Tool to Update Instructions**

```bash
# Regenerate migrations with updated markdown
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Apply migrations
supabase migration up
```

**Deliverable**: Solutions and RFP Design agents refactored to use inheritance

---

### Phase 5: Create TMC Specialist Agent (Day 3)

**Step 5.1: Define TMC Specialist**

Create: `Agent Instructions/TMC Specialist.md`

```markdown
## Name: TMC Specialist
**Database ID**: (to be generated)
**Parent Agent**: `RFP Design` (inherit RFP design capabilities)
**Role**: `design`
**Avatar URL**: `/assets/avatars/tmc-specialist.svg`

## Allowed Tools (in addition to parent tools):
- get_tmc_templates (hypothetical TMC-specific tool)

## Description:
Specialized RFP Design agent focused on Telecommunications Management Consulting (TMC) procurement

## Instructions:

### TMC Procurement Specialization

You are the TMC Specialist agent - an expert in telecommunications management consulting procurement.

**Inherited Capabilities:**
- From `_common`: Memory, conversation history, agent switching, web search
- From `RFP Design`: Full RFP creation, form artifacts, document management

**Additional TMC-Specific Expertise:**

1. **TMC Service Categories:**
   - Telecom expense management
   - Network optimization consulting
   - Carrier contract negotiation
   - Technology assessments
   - Strategic telecom planning

2. **TMC RFP Requirements:**
   - Minimum 3 years TMC experience
   - Industry certifications (TEM, CTNS)
   - Client references in similar industries
   - Proprietary tools and platforms
   - Cost savings methodologies

3. **TMC-Specific Questions:**
   - Billing audit capabilities
   - Invoice management platforms
   - Reporting and analytics tools
   - Integration with existing systems
   - Cost allocation methodologies

### Auto-Processing for TMC Requests

When user requests a TMC procurement or RFP:
1. Immediately create RFP using create_and_set_rfp
2. Generate TMC-specific questionnaire
3. Include TMC service category options
4. Add TMC vendor qualification criteria

**Example TMC Categories:**
- Telecom Expense Management (TEM)
- Wireless Expense Management (WEM)
- Fixed-line Cost Optimization
- Cloud Communications Consulting
- Network Design & Engineering
```

**Step 5.2: Create TMC Specialist in Database**

```bash
node scripts/md-to-sql-migration.js "Agent Instructions/TMC Specialist.md"
supabase migration up
```

**Step 5.3: Set Parent Relationship**

```sql
-- Get RFP Design agent UUID
SELECT id FROM agents WHERE name = 'RFP Design';
-- Copy UUID (e.g., '8c5f11cb-1395-4d67-821b-89dd58f0c8dc')

-- Get TMC Specialist UUID
SELECT id FROM agents WHERE name = 'TMC Specialist';
-- Copy UUID

-- Set parent relationship
UPDATE agents 
SET parent_agent_id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc'  -- RFP Design UUID
WHERE name = 'TMC Specialist';

-- Verify 3-level inheritance chain
SELECT 
  a.name,
  a.inheritance_depth,
  p.name as parent_name,
  gp.name as grandparent_name
FROM agents a
LEFT JOIN agents p ON a.parent_agent_id = p.id
LEFT JOIN agents gp ON p.parent_agent_id = gp.id
WHERE a.name = 'TMC Specialist';
```

**Deliverable**: TMC Specialist agent with 3-level inheritance (_common → RFP Design → TMC Specialist)

---

## Testing Strategy

### Test Plan Overview

1. **Unit Tests**: Agent merging logic
2. **Integration Tests**: Database inheritance queries
3. **End-to-End Tests**: Full conversation with inherited agents
4. **Verification Tests**: Logging and instruction merging

### Test Cases

#### Test 1: Simple Inheritance (Solutions → _common)

**Setup:**
```sql
-- Ensure Solutions agent has _common as parent
SELECT parent_agent_id FROM agents WHERE name = 'Solutions';
```

**Test:**
```typescript
// In edge function test or manual curl
POST /claude-api-v3
{
  "sessionId": "<test-session-id>",
  "agentId": "<solutions-agent-id>",
  "messages": [
    { "role": "user", "content": "Hello, I'd like help with procurement" }
  ]
}
```

**Expected:**
- Console logs show inheritance chain: `_common → Solutions`
- Merged instructions include both _common and Solutions content
- Merged tools include memory, search, and any Solutions-specific tools
- Response demonstrates both common behavior (greeting) and sales focus

**Verification:**
```bash
# Check edge function logs
docker logs -f supabase_edge_runtime_rfpez-app-local | grep "AGENT INHERITANCE"
```

Look for:
```
🔗 AGENT INHERITANCE CHAIN: ["_common", "Solutions"]
📊 Total Instructions: ~8000 characters
✅ Merged tools: ["create_memory", "search_memories", ...]
```

#### Test 2: Two-Level Inheritance (RFP Design → _common)

**Test:**
```typescript
POST /claude-api-v3
{
  "sessionId": "<test-session-id>",
  "agentId": "<rfp-design-agent-id>",
  "messages": [
    { "role": "user", "content": "Create an RFP for LED procurement" }
  ]
}
```

**Expected:**
- Inheritance chain: `_common → RFP Design`
- Instructions include common + RFP Design specific
- Tools include all common tools + RFP creation tools
- Agent creates RFP and form artifact (RFP Design behavior)
- Uses memory appropriately (common behavior)

#### Test 3: Three-Level Inheritance (TMC Specialist → RFP Design → _common)

**Test:**
```typescript
POST /claude-api-v3
{
  "sessionId": "<test-session-id>",
  "agentId": "<tmc-specialist-id>",
  "messages": [
    { "role": "user", "content": "I need to source TMC services" }
  ]
}
```

**Expected:**
- Inheritance chain: `_common → RFP Design → TMC Specialist`
- Instructions from all three agents merged
- Tools aggregated from all three levels
- Response shows:
  - Common behavior (memory usage)
  - RFP Design behavior (creates RFP)
  - TMC specialization (includes TMC-specific questions)

**Verification Checklist:**
```
✅ Console shows 3-level inheritance chain
✅ Total instructions > 10,000 characters
✅ Merged tools include:
   - Common: create_memory, search_memories
   - RFP Design: create_and_set_rfp, create_form_artifact
   - TMC: get_tmc_templates (if implemented)
✅ Created RFP has TMC-specific content
✅ Form artifact includes TMC service categories
```

#### Test 4: Instruction Merging Verification

**Manual Test:**
```bash
# Get merged instructions for TMC Specialist
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "\
SELECT name, LENGTH(instructions) as inst_len 
FROM agents 
WHERE name IN ('_common', 'RFP Design', 'TMC Specialist');"

# Expected output:
# _common: ~5000 chars
# RFP Design: ~3000 chars
# TMC Specialist: ~1000 chars
```

**In edge function logs, verify:**
```
🔧 AGENT INHERITANCE - Merging agents:
  parent: _common, child: RFP Design
  parentInstructionsLength: 5000, childInstructionsLength: 3000
✅ Merged Instructions: 8000+ chars

🔧 AGENT INHERITANCE - Merging agents:
  parent: RFP Design (merged), child: TMC Specialist
  parentInstructionsLength: 8000, childInstructionsLength: 1000
✅ Merged Instructions: 9000+ chars
```

#### Test 5: Tool Access Aggregation

**Test:**
```typescript
// Load TMC Specialist and inspect tools
const agent = await loadAgentWithInheritance(supabase, tmcSpecialistId);
console.log('Merged tools:', agent.access);
```

**Expected Tool List:**
```typescript
[
  // From _common:
  'create_memory',
  'search_memories',
  'get_conversation_history',
  'store_message',
  'search_messages',
  'get_current_agent',
  'get_available_agents',
  'switch_agent',
  'recommend_agent',
  'perplexity_search',
  'perplexity_ask',
  'perplexity_research',
  'perplexity_reason',
  
  // From RFP Design:
  'create_and_set_rfp',
  'set_current_rfp',
  'get_current_rfp',
  'create_form_artifact',
  'update_form_data',
  'get_form_schema',
  'update_form_artifact',
  'create_document_artifact',
  'list_artifacts',
  'select_active_artifact',
  'submit_bid',
  'get_rfp_bids',
  'update_bid_status',
  
  // From TMC Specialist:
  'get_tmc_templates'
]
```

#### Test 6: Abstract Agent Prevention

**Test:**
```typescript
// Attempt to load _common agent directly
POST /claude-api-v3
{
  "agentId": "<_common-agent-id>",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

**Expected:**
- System prevents loading abstract agent
- Falls back to default agent or returns error
- Logs indicate abstract agent was requested

**Implementation Check:**
```typescript
// In loadAgentContext, add check:
if (agent && agent.is_abstract) {
  console.warn('⚠️ Attempted to load abstract agent:', agent.name);
  return null; // or fallback to default
}
```

### Automated Test Suite

**Create test file**: `supabase/functions/claude-api-v3/tests/agent-inheritance.test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { loadAgentWithInheritance, mergeAgentWithParent } from "../utils/agent-inheritance.ts";

Deno.test("Agent Inheritance - Simple parent-child merge", async () => {
  // Mock agents
  const parent = {
    id: "parent-id",
    name: "Parent",
    instructions: "Parent instructions",
    access: ["tool1", "tool2"]
  };
  
  const child = {
    id: "child-id",
    name: "Child",
    instructions: "Child instructions",
    access: ["tool3"],
    parent_agent_id: "parent-id"
  };
  
  const merged = mergeAgentWithParent(parent, child, []);
  
  assertEquals(merged.instructions.includes("Parent instructions"), true);
  assertEquals(merged.instructions.includes("Child instructions"), true);
  assertEquals(merged.access.length, 3);
  assertEquals(merged.access.includes("tool1"), true);
  assertEquals(merged.access.includes("tool3"), true);
});

Deno.test("Agent Inheritance - Tool deduplication", async () => {
  const parent = {
    id: "parent-id",
    name: "Parent",
    instructions: "Parent",
    access: ["tool1", "tool2", "tool3"]
  };
  
  const child = {
    id: "child-id",
    name: "Child",
    instructions: "Child",
    access: ["tool2", "tool3", "tool4"], // Overlap with parent
    parent_agent_id: "parent-id"
  };
  
  const merged = mergeAgentWithParent(parent, child, []);
  
  // Should have 4 unique tools
  assertEquals(merged.access.length, 4);
  assertEquals(merged.access.sort(), ["tool1", "tool2", "tool3", "tool4"].sort());
});

Deno.test("Agent Inheritance - Access override", async () => {
  const parent = {
    id: "parent-id",
    name: "Parent",
    instructions: "Parent",
    access: ["tool1", "tool2"]
  };
  
  const child = {
    id: "child-id",
    name: "Child",
    instructions: "Child",
    access: ["tool3", "tool4"],
    access_override: true, // Override parent tools
    parent_agent_id: "parent-id"
  };
  
  const merged = mergeAgentWithParent(parent, child, []);
  
  // Should only have child tools
  assertEquals(merged.access.length, 2);
  assertEquals(merged.access.sort(), ["tool3", "tool4"].sort());
});
```

**Run tests:**
```bash
deno test --allow-all supabase/functions/claude-api-v3/tests/agent-inheritance.test.ts
```

### Manual Verification Steps

**After each implementation phase:**

1. **Check Database State:**
```sql
-- Verify parent relationships
SELECT 
  a.name as agent,
  p.name as parent,
  a.is_abstract,
  a.inheritance_depth,
  LENGTH(a.instructions) as inst_len,
  array_length(a.access, 1) as tool_count
FROM agents a
LEFT JOIN agents p ON a.parent_agent_id = p.id
WHERE a.name IN ('_common', 'Solutions', 'RFP Design', 'TMC Specialist')
ORDER BY a.inheritance_depth;
```

2. **Test Edge Function Locally:**
```bash
supabase functions serve claude-api-v3 --debug
```

3. **Send Test Request:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "<tmc-specialist-id>",
    "messages": [
      {"role": "user", "content": "Create a TMC RFP"}
    ]
  }'
```

4. **Review Logs:**
```bash
docker logs -f supabase_edge_runtime_rfpez-app-local
```

**Look for:**
- `🔗 AGENT INHERITANCE` logs showing chain
- `📊 AGENT INHERITANCE - Detailed breakdown` with all levels
- `✅ Merged Instructions:` with character counts
- No errors or warnings about missing parents

---

## Migration Plan

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migration tested locally
- [ ] Edge function changes tested locally
- [ ] Inheritance logging verified
- [ ] No performance degradation (check response times)
- [ ] Rollback plan documented
- [ ] Stakeholders notified of changes

### Deployment Steps

**Step 1: Deploy Database Changes**
```bash
# Push migration to remote
supabase db push

# Verify migration applied
supabase migration list
```

**Step 2: Create `_common` Agent Remotely**
```bash
# Use CLI tool to generate SQL
node scripts/md-to-sql-migration.js "Agent Instructions/_common.md"

# Apply via GitHub Actions or manual deployment
git add supabase/migrations/*.sql
git commit -m "Add _common abstract agent"
git push origin master
```

**Step 3: Deploy Edge Function Changes**
```bash
# Deploy updated claude-api-v3 with inheritance logic
supabase functions deploy claude-api-v3
```

**Step 4: Update Existing Agents**
```bash
# Generate SQL migrations for refactored agents
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Deploy via GitHub Actions
git add supabase/migrations/*.sql
git commit -m "Refactor agents to use inheritance"
git push origin master
```

**Step 5: Create TMC Specialist**
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/TMC Specialist.md"
git add supabase/migrations/*.sql
git commit -m "Add TMC Specialist agent with 3-level inheritance"
git push origin master
```

**Step 6: Verify Production**
```bash
# Check remote Supabase logs via dashboard
# Test with real user session
# Monitor error rates in production
```

### Rollback Plan

**If issues occur in production:**

**Option 1: Revert Edge Function**
```bash
# Deploy previous version of claude-api-v3
supabase functions deploy claude-api-v3 --version <previous-version>
```

**Option 2: Disable Inheritance**
```sql
-- Temporarily remove parent relationships
UPDATE agents SET parent_agent_id = NULL WHERE parent_agent_id IS NOT NULL;
```

**Option 3: Full Rollback**
```bash
# Revert database migration
supabase migration revert

# Redeploy previous edge function version
supabase functions deploy claude-api-v3 --version <previous-version>
```

---

## Success Criteria

### Functional Requirements

- [ ] Agents can inherit from parent agents
- [ ] Recursive inheritance works (3+ levels)
- [ ] Instructions merge correctly (parent → child)
- [ ] Tools aggregate correctly (union, no duplicates)
- [ ] Abstract agents cannot be selected in UI
- [ ] Inheritance logging provides full visibility

### Performance Requirements

- [ ] Agent loading time < 200ms (including inheritance)
- [ ] No significant increase in Claude API response time
- [ ] Database queries optimized (indexed parent relationships)

### Quality Requirements

- [ ] All tests passing (unit, integration, E2E)
- [ ] Comprehensive logging for debugging
- [ ] Error handling for circular inheritance
- [ ] Documentation complete and accurate

### User Experience Requirements

- [ ] No visible changes to existing agent behavior
- [ ] TMC Specialist provides specialized TMC guidance
- [ ] Inheritance transparent to end users
- [ ] Fallback to default agent if inheritance fails

---

## Next Steps After Implementation

### Future Enhancements

1. **Dynamic Agent Creation UI**: Allow admins to create new specialized agents via UI
2. **Multiple Inheritance**: Support inheriting from multiple parents (mixin pattern)
3. **Instruction Versioning**: Track changes to agent instructions over time
4. **Performance Optimization**: Cache merged agents to reduce database queries
5. **Agent Templates**: Pre-defined templates for common specializations
6. **Inheritance Visualization**: UI to visualize agent hierarchy tree

### Agent Caching Implementation

**Performance Enhancement**: Cache merged agents to reduce database queries and inheritance computation overhead.

**Cache Strategy**:
- In-memory Map cache keyed by agent ID
- Cache invalidation on agent updates
- TTL of 5 minutes for cache entries
- Warm cache on startup for common agents

### UI Changes for Abstract Agents

**Requirement**: Hide abstract agents from agent selector UI.

**Implementation**: Filter out `is_abstract = true` agents in queries.

### Additional Specialized Agents

Once inheritance system is proven:

1. **Government RFP Specialist** (inherits from RFP Design)
2. **Healthcare Procurement Specialist** (inherits from RFP Design)
3. **IT Services Specialist** (inherits from RFP Design)
4. **Construction RFP Specialist** (inherits from RFP Design)
5. **Marketing Services Specialist** (inherits from RFP Design)
6. **Sourcing Agent** (inherits from _common, adds perplexity_research)

Each can be created with minimal effort by:
- Creating markdown file with specialized instructions
- Setting parent to RFP Design
- Adding domain-specific tools if needed

---

## Appendix

### A. Database Queries for Debugging

**View full inheritance chain:**
```sql
WITH RECURSIVE agent_chain AS (
  SELECT 
    id, 
    name, 
    parent_agent_id,
    0 as level,
    name::text as chain
  FROM agents 
  WHERE id = '<target-agent-id>'
  
  UNION ALL
  
  SELECT 
    a.id, 
    a.name, 
    a.parent_agent_id,
    ac.level + 1,
    a.name || ' → ' || ac.chain
  FROM agents a
  INNER JOIN agent_chain ac ON a.id = ac.parent_agent_id
)
SELECT * FROM agent_chain ORDER BY level DESC;
```

**Find orphaned agents (parent doesn't exist):**
```sql
SELECT a.name, a.parent_agent_id
FROM agents a
LEFT JOIN agents p ON a.parent_agent_id = p.id
WHERE a.parent_agent_id IS NOT NULL AND p.id IS NULL;
```

**Tool coverage by agent:**
```sql
SELECT 
  name,
  array_length(access, 1) as tool_count,
  access as tools
FROM agents
WHERE is_active = true
ORDER BY tool_count DESC;
```

### B. Sample Logging Output

**Expected console output for TMC Specialist:**

```
🔧 loadAgentContext - ENTRY POINT: { agentId: 'xxx-xxx-xxx' }
🔗 AGENT INHERITANCE - Loading agent (depth 0): xxx-xxx-xxx
🔄 AGENT INHERITANCE - Loading parent agent: { 
  childName: 'TMC Specialist', 
  parentId: '8c5f11cb-1395-4d67-821b-89dd58f0c8dc',
  depth: 0 
}
🔗 AGENT INHERITANCE - Loading agent (depth 1): 8c5f11cb-1395-4d67-821b-89dd58f0c8dc
🔄 AGENT INHERITANCE - Loading parent agent: { 
  childName: 'RFP Design', 
  parentId: 'common-agent-id',
  depth: 1 
}
🔗 AGENT INHERITANCE - Loading agent (depth 2): common-agent-id
✅ AGENT INHERITANCE - Reached root agent: { 
  name: '_common', 
  depth: 2,
  instructionsLength: 5245 
}
🔧 AGENT INHERITANCE - Merging agents: {
  parent: '_common',
  child: 'RFP Design',
  parentInstructionsLength: 5245,
  childInstructionsLength: 2894
}
✅ AGENT INHERITANCE - Merged tools: {
  parent: '_common',
  child: 'RFP Design',
  parentTools: 13,
  childTools: 13,
  mergedTools: 23,
  tools: ['create_memory', 'search_memories', ..., 'create_and_set_rfp', ...]
}
🔧 AGENT INHERITANCE - Merging agents: {
  parent: 'RFP Design',
  child: 'TMC Specialist',
  parentInstructionsLength: 8139,
  childInstructionsLength: 1456
}
✅ AGENT INHERITANCE - Merge complete: {
  finalAgent: 'TMC Specialist',
  totalInstructions: 9595,
  totalTools: 24,
  chainDepth: 3,
  chain: '_common → RFP Design → TMC Specialist'
}
📊 AGENT INHERITANCE - Detailed breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Final Agent: TMC Specialist (ID: xxx-xxx-xxx)
Total Instructions: 9595 characters
Total Tools: 24

Inheritance Chain:
  1. _common
     - Instructions: 5245 chars
     - Tools: 13
     - Depth: 0
    2. RFP Design
       - Instructions: 2894 chars
       - Tools: 13
       - Depth: 1
      3. TMC Specialist
         - Instructions: 1456 chars
         - Tools: 1
         - Depth: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### C. Related Files

**Files modified in this implementation:**

- `database/agents-schema.sql` - Schema additions
- `supabase/functions/claude-api-v3/utils/agent-inheritance.ts` - NEW: Inheritance logic
- `supabase/functions/claude-api-v3/utils/system-prompt.ts` - Updated to use inheritance
- `Agent Instructions/_common.md` - NEW: Abstract base agent
- `Agent Instructions/Solutions Agent.md` - Refactored to use inheritance
- `Agent Instructions/RFP Design Agent.md` - Refactored to use inheritance
- `Agent Instructions/TMC Specialist.md` - NEW: Specialized agent
- `scripts/md-to-sql-migration.js` - Existing tool for SQL generation

---

## Conclusion

This design provides a robust, scalable agent inheritance system that:

1. **Reduces Duplication**: Common behavior extracted to `_common` agent
2. **Enables Specialization**: New specialized agents created with minimal effort
3. **Maintains Backwards Compatibility**: Existing agents continue working
4. **Provides Transparency**: Comprehensive logging for debugging
5. **Scales Gracefully**: Recursive inheritance supports arbitrary depth

The phased implementation plan ensures each component is tested before moving to the next, minimizing risk and ensuring quality.

**Estimated Timeline:**
- Phase 1 (Schema): 4 hours
- Phase 2 (Core Logic): 8 hours
- Phase 3 (`_common` Agent): 4 hours
- Phase 4 (Refactoring): 8 hours
- Phase 5 (TMC Specialist): 4 hours
- Testing & Verification: 8 hours
- **Total: ~36 hours (~1 week)**

Ready to proceed with implementation!

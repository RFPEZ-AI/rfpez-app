# Agent State Synchronization Architecture

## Overview
Agent switching in RFPEZ.AI can be initiated from **two layers**:
1. **UI Layer** - Direct user interaction (clicking agent selector)
2. **Edge Function Layer** - AI-driven agent switching via `switch_agent` tool

This document explains how agent state is synchronized between these layers to ensure consistent UI state.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐     ┌──────────────────┐                     │
│  │  AgentIndicator  │────▶│ useAgentManage-  │                     │
│  │   (UI Component) │     │ ment Hook        │                     │
│  └──────────────────┘     └────────┬─────────┘                     │
│                                     │                                │
│                          ┌──────────▼──────────┐                    │
│                          │  currentAgent State │                    │
│                          │  (SessionActiveAgent)│                   │
│                          └──────────┬──────────┘                    │
│                                     │                                │
└─────────────────────────────────────┼────────────────────────────────┘
                                      │
                      ┌───────────────▼──────────────┐
                      │   DATABASE (Supabase)        │
                      │   - sessions table           │
                      │   - session_agents table     │
                      │   - messages (agent_id)      │
                      └───────────────┬──────────────┘
                                      │
┌─────────────────────────────────────┼────────────────────────────────┐
│                         EDGE FUNCTION LAYER                          │
├─────────────────────────────────────┼────────────────────────────────┤
│                                     │                                │
│  ┌────────────────────────────────────────────────────────┐         │
│  │       Claude API v3 (claude-api-v3/index.ts)           │         │
│  │                                                         │         │
│  │  1. Receives message from UI                           │         │
│  │  2. Executes tools (including switch_agent)            │         │
│  │  3. Detects agent_switch_result                        │         │
│  │  4. Streams events back to UI:                         │         │
│  │     - message_complete (old agent)                     │         │
│  │     - message_start (new agent)                        │         │
│  │     - content chunks (new agent response)              │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                       │
│  ┌────────────────────────────────────────────────────────┐         │
│  │     tools/database.ts - switchAgent()                  │         │
│  │                                                         │         │
│  │  1. Validates authentication                           │         │
│  │  2. Updates session_agents table                       │         │
│  │  3. Returns new_agent data:                            │         │
│  │     - id, name, role, instructions                     │         │
│  │     - trigger_continuation: true                       │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                      │
                      ┌───────────────▼──────────────┐
                      │   STREAMING PROTOCOL         │
                      │   - Server-Sent Events (SSE) │
                      │   - JSON Event Stream        │
                      └──────────────────────────────┘
```

---

## Synchronization Flow

### **1. UI-Initiated Agent Switch**

**User Action**: Clicks on agent selector → selects new agent

```typescript
// src/components/AgentSelector.tsx - handleAgentSelect()

const handleAgentSelect = async (agent: Agent) => {
  // 1. Check authentication and access control
  if (!isAuthenticated) {
    // ✅ Anonymous users can ONLY access:
    // - Default agent (auto-assigned)
    // - Support agents (for help without login)
    const isSupport = agent.name?.toLowerCase().includes('support') || 
                     agent.role === 'support';
    
    canAccess = (agent.is_default === true) || (isSupport === true);
    
    if (!canAccess) {
      // Block access - show login prompt
      setToastMessage('Please sign in to access this agent.');
      return;
    }
  }
  
  // 2. Persist to database via AgentService
  const success = await AgentService.setSessionAgent(
    sessionId,
    agent.id,
    supabaseUserId
  );
  
  // 3. Update UI state
  if (success) {
    const newActiveAgent = await AgentService.getSessionActiveAgent(sessionId);
    if (newActiveAgent) {
      onAgentChanged(newActiveAgent);
    }
  }
  
  // 4. Close selector UI
  onClose();
};
```

**Database Update**:
```sql
-- session_agents table tracks active agent per session
INSERT INTO session_agents (session_id, agent_id, started_at, is_active)
VALUES (?, ?, NOW(), TRUE)
ON CONFLICT (session_id) WHERE is_active = TRUE
DO UPDATE SET
  agent_id = EXCLUDED.agent_id,
  started_at = NOW();
```

**Result**: UI and database are synchronized ✅

---

### **2. Edge Function-Initiated Agent Switch**

**Trigger**: User message → Claude decides to call `switch_agent` tool

#### **Phase 1: Tool Execution**

```typescript
// src/services/claudeAPIFunctions.ts - switchAgent()

async function switchAgent(params, userId) {
  // 1. CHECK AUTHENTICATION FIRST
  if (userId === 'anonymous') {
    // ✅ Anonymous users can ONLY access:
    // - Default agent (auto-assigned)
    // - Support agents (for help without login)
    const agent = await AgentService.getAgentById(params.agent_id);
    
    const isSupport = agent.name?.toLowerCase().includes('support') || 
                     agent.name?.toLowerCase().includes('help') ||
                     agent.role === 'support' ||
                     (agent.description && agent.description.toLowerCase().includes('support'));
    
    if (!isSupport) {
      // ❌ Block access to restricted agents
      throw new Error(
        `Authentication required to access ${agent.name} agent. ` +
        `Please sign in or return to the default agent.`
      );
    }
    
    // ✅ Support agent allowed for anonymous users
    return {
      success: true,
      new_agent: agent,
      trigger_continuation: true,
      context_message: 'Connected to Support agent for assistance.'
    };
  }
  
  // 2. Verify agent exists and user has access (authenticated users)
  const agent = await AgentService.getAgentById(params.agent_id);
  if (!agent) {
    throw new Error(`Agent with ID ${params.agent_id} not found`);
  }
  
  // 3. Update database
  const success = await AgentService.setSessionAgent(
    params.session_id,
    agent.id,
    userId
  );
  
  // 4. Return new agent data with continuation flag
  return {
    success: true,
    new_agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      instructions: agent.instructions,
      initial_prompt: agent.initial_prompt
    },
    trigger_continuation: true, // 🔥 Tells edge function to continue with new agent
    context_message: `You have been switched from another agent. Context: ${params.reason || 'User request'}`
  };
}
```

#### **Phase 2: Agent Continuation Detection**

```typescript
// supabase/functions/claude-api-v3/handlers/http.ts

// After tool execution, check for agent switch
const agentSwitchResult = executedToolResults.find(result => 
  result.function_name === 'switch_agent' && 
  result.result?.success === true && 
  result.result?.trigger_continuation === true
);

if (agentSwitchResult) {
  console.log('🚀 AGENT SWITCH WITH CONTINUATION DETECTED');
  
  const switchResult = agentSwitchResult.result;
  const newAgentData = switchResult.new_agent;
  
  // 1. Send completion event for old agent message
  controller.enqueue({
    type: 'message_complete',
    agent_id: oldAgentId,
    timestamp: new Date().toISOString()
  });
  
  // 2. Send start event for new agent message
  controller.enqueue({
    type: 'message_start',
    agent_id: newAgentData.id,
    agent_name: newAgentData.name,
    timestamp: new Date().toISOString()
  });
  
  // 3. Load new agent context and tools
  const newAgentContext = await loadAgentContext(supabase, sessionId, newAgentData.id);
  const newTools = getToolDefinitions(newAgentData.role);
  
  // 4. Recursive call with new agent
  await streamWithRecursiveTools(
    continuationMessages,
    newTools,
    newAgentSystemPrompt,
    claudeService,
    toolService,
    controller,
    supabase,
    sessionId,
    newAgentData.id, // 🎯 NEW AGENT ID for message attribution
    recursionDepth + 1
  );
}
```

#### **Phase 3: UI State Synchronization**

```typescript
// src/hooks/useMessageHandling.ts - onStreamingChunk()

const onStreamingChunk = (chunk, isComplete, toolProcessing, toolEvent, forceToolCompletion, metadata) => {
  
  // 1. Handle message completion for old agent
  if (metadata?.message_complete && !isComplete) {
    console.log('✅ Message completion signal - finalizing old agent message');
    
    // Flush buffer and finalize current message
    accumulatedContent += streamingBuffer;
    setMessages(prev => 
      prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: accumulatedContent }
          : msg
      )
    );
    streamingBuffer = '';
    return;
  }
  
  // 2. Handle new agent message start
  if (metadata?.message_start) {
    console.log('🆕 New agent message starting:', metadata.agent_name);
    
    // Create NEW message for new agent
    const newAgentMessageId = uuidv4();
    const newAgentMessage: Message = {
      id: newAgentMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      agentName: metadata.agent_name
    };
    
    setMessages(prev => [...prev, newAgentMessage]);
    
    // Switch message tracking to new agent
    aiMessageId = newAgentMessageId;
    accumulatedContent = '';
    streamingBuffer = '';
    
    // Update agent context
    agentForResponse = {
      agent_id: metadata.agent_id,
      agent_name: metadata.agent_name,
      agent_instructions: '',
      agent_initial_prompt: '',
      agent_avatar_url: undefined
    };
    
    // 🎯 CRITICAL: Trigger UI state refresh to update AgentIndicator
    // This is handled by the parent component monitoring messages
    return;
  }
  
  // 3. Continue streaming new agent's content
  streamingBuffer += chunk;
  // ... (buffer flushing logic)
};
```

#### **Phase 4: UI Component Updates**

```typescript
// src/pages/Home.tsx or parent component

useEffect(() => {
  // Monitor messages for agent changes
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    
    // If agent name changed in messages, update currentAgent state
    if (lastMessage.agentName && 
        lastMessage.agentName !== currentAgent?.agent_name) {
      
      // Load updated agent from database
      if (sessionId) {
        AgentService.getSessionActiveAgent(sessionId).then(agent => {
          if (agent) {
            setCurrentAgent(agent);
          }
        });
      }
    }
  }
}, [messages]);
```

---

## State Synchronization Guarantees

### **Invariants Maintained**

1. **Database is Source of Truth**
   - All agent switches update `session_agents` table
   - Message attribution uses `messages.agent_id`
   - UI reads from database on session load

2. **UI Reflects Database State**
   - `currentAgent` state loaded from `AgentService.getSessionActiveAgent()`
   - Agent changes trigger UI refresh via message monitoring
   - AgentIndicator displays current database state

3. **Streaming Events Provide Real-time Updates**
   - `message_complete` signals old agent finished
   - `message_start` signals new agent beginning
   - Content chunks attributed to correct agent

### **Race Condition Prevention**

**Problem**: UI-initiated switch vs. Edge function switch happening simultaneously

**Solution**: 
- Database uses `session_agents.is_active` flag with `ON CONFLICT` upsert
- Edge function always checks latest database state before continuing
- UI re-queries database after receiving streaming events

```sql
-- Upsert ensures single active agent per session
INSERT INTO session_agents (session_id, agent_id, is_active, started_at)
VALUES (?, ?, TRUE, NOW())
ON CONFLICT (session_id, is_active) WHERE is_active = TRUE
DO UPDATE SET
  agent_id = EXCLUDED.agent_id,
  started_at = NOW();
```

---

## Authentication & Access Control

### **Critical Security Fix (October 14, 2025)**

**Problem**: Anonymous users could switch to restricted agents (like RFP Design) through two paths:
1. AI-initiated agent switches via edge function `switch_agent` tool
2. Manual UI selection via AgentSelector header dropdown

**Root Cause**: 
- Edge function only checked `is_free` flag (which means "free tier for authenticated users")
- UI layer had no access control validation
- Service layer didn't filter agent list based on authentication status

**Solution**: Three-layer access control with consistent logic across all layers

---

### **Three-Layer Access Control Architecture**

#### **Layer 1: Edge Function (AI-Initiated Switches)**
**File**: `src/services/claudeAPIFunctions.ts`
**Function**: `switchAgent()`

```typescript
// src/services/claudeAPIFunctions.ts - switchAgent()

if (userId === 'anonymous') {
  const agent = await AgentService.getAgentById(agent_id);
  
  // ✅ ALLOW SUPPORT AGENT FOR ANONYMOUS USERS
  const isSupport = agent.name.toLowerCase().includes('support') || 
                   agent.name.toLowerCase().includes('help') ||
                   agent.role === 'support';
  
  if (!isSupport) {
    // ❌ AUTHENTICATION REQUIRED FOR NON-SUPPORT AGENTS
    throw new Error(
      `Authentication required to access ${agent.name} agent. Please log in to continue.`
    );
  }
  
  // Allow anonymous access to support agent
  return { success: true, new_agent: {...}, trigger_continuation: true };
}
```

**When Triggered**: Claude AI decides to call `switch_agent` tool during conversation

**Access Control**: Blocks anonymous users from accessing restricted agents

---

#### **Layer 2: UI Component (Manual Selection)**
**File**: `src/components/AgentSelector.tsx`
**Function**: `handleAgentSelect()`

```typescript
// src/components/AgentSelector.tsx - handleAgentSelect()

const handleAgentSelect = async (agent: Agent) => {
  let canAccess = true;
  let accessMessage = '';
  
  if (!isAuthenticated) {
    // ✅ SAME SUPPORT DETECTION LOGIC AS EDGE FUNCTION
    const isSupport = agent.name?.toLowerCase().includes('support') || 
                     agent.name?.toLowerCase().includes('help') ||
                     agent.role === 'support' ||
                     (agent.description && agent.description.toLowerCase().includes('support'));
    
    // Allow default agent OR support agent for anonymous users
    canAccess = (agent.is_default === true) || (isSupport === true);
    
    if (!canAccess) {
      accessMessage = isSupport ? '' : 'Please sign in to access this agent.';
    }
  } else {
    // Authenticated users: check premium requirements
    if (agent.is_restricted && !user?.has_premium) {
      canAccess = false;
      accessMessage = 'This agent requires a premium subscription.';
    }
  }
  
  // Show toast and block access if not allowed
  if (!canAccess) {
    setToastMessage(accessMessage);
    setShowToast(true);
    return;
  }
  
  // Proceed with agent switch...
};
```

**When Triggered**: User clicks header agent selector and chooses different agent

**Access Control**: UI validation prevents unauthorized selections before database call

---

#### **Layer 3: Service Layer (Available Agent Filtering)**
**File**: `src/services/agentService.ts`
**Function**: `getAvailableAgents()`

```typescript
// src/services/agentService.ts - getAvailableAgents()

static async getAvailableAgents(isAuthenticated: boolean, user?: User): Promise<Agent[]> {
  // Fetch all agents from database
  let availableAgents = await this.getAllAgents();
  
  if (!isAuthenticated) {
    // ✅ FILTER: Only show default + support agents for anonymous users
    availableAgents = availableAgents.filter(agent => {
      const isSupport = agent.name?.toLowerCase().includes('support') || 
                       agent.name?.toLowerCase().includes('help') ||
                       agent.role === 'support' ||
                       (agent.description && agent.description.toLowerCase().includes('support'));
      
      return agent.is_default || isSupport;
    });
  } else {
    // Filter based on user tier (free vs premium)
    if (!user?.has_premium) {
      availableAgents = availableAgents.filter(agent => !agent.is_restricted);
    }
  }
  
  return availableAgents;
}
```

**When Triggered**: AgentSelector component loads list of available agents

**Access Control**: Prevents restricted agents from appearing in dropdown for unauthorized users

---

### **Unified Access Matrix**

| User Type | Can See in Dropdown? | Can Select Manually? | Can AI Switch To? |
|-----------|---------------------|---------------------|-------------------|
| **Anonymous** | Default + Support only | ✅ Yes (Default + Support) | ✅ Yes (Support only) |
| **Authenticated (Free)** | Default + Free agents | ✅ Yes (no restrictions) | ✅ Yes (no restrictions) |
| **Authenticated (Premium)** | All agents | ✅ Yes (all agents) | ✅ Yes (all agents) |

### **Support Agent Exception**
The Support agent is intentionally accessible to anonymous users because:
- ✅ Users should get help without authentication barriers
- ✅ Support queries don't create sensitive artifacts
- ✅ Aligns with UX best practice: "Help should always be available"

### **Why "is_free" ≠ "Public"**
**Common Misconception**: `is_free` flag means "available to anonymous users"

**Actual Meaning**: `is_free` means "available to authenticated users without premium subscription"

| Agent Flag | Meaning | Anonymous Access | Free Tier Access | Premium Access |
|------------|---------|------------------|------------------|----------------|
| `is_default` | Default agent for new sessions | ✅ Yes | ✅ Yes | ✅ Yes |
| `is_free` | No subscription required | ❌ No | ✅ Yes | ✅ Yes |
| `is_restricted` | Premium subscription required | ❌ No | ❌ No | ✅ Yes |
| Support role/name | Help/support agent | ✅ Yes (exception) | ✅ Yes | ✅ Yes |

---

## Error Handling

### **Agent Switch Failures**

**Scenario 1**: User not authenticated
```typescript
// Edge function throws error
throw new Error('Authentication required to access RFP Design agent. Please log in to continue.');

// UI displays error
categorizeError(error); // Shows login prompt
```

**Scenario 2**: Agent not found
```typescript
// Edge function throws error
throw new Error(`Agent not found with ID: ${agent_id}`);

// UI falls back to default agent
await loadDefaultAgentWithPrompt();
```

**Scenario 3**: Database update fails
```typescript
// Edge function returns failure result
return { success: false, error: 'Failed to update session agent' };

// UI retries or shows error
console.error('Agent switch failed:', result.error);
```

---

## Testing Synchronization

### **Test Case 1: UI-Initiated Switch**
```typescript
// 1. Click agent selector
// 2. Select new agent
// 3. Verify:
expect(currentAgent.agent_name).toBe('RFP Design');
expect(await db.query('SELECT agent_id FROM session_agents WHERE session_id = ?')).toBe(rfpDesignId);
expect(AgentIndicator).toDisplay('RFP Design');
```

### **Test Case 2: Edge Function Switch**
```typescript
// 1. Send message: "I need to create an RFP"
// 2. Wait for switch_agent tool execution
// 3. Monitor streaming events:
expect(events).toContainEqual({ type: 'message_complete', agent_id: solutionsId });
expect(events).toContainEqual({ type: 'message_start', agent_id: rfpDesignId });
// 4. Verify UI updates:
expect(currentAgent.agent_name).toBe('RFP Design');
expect(messages[messages.length - 1].agentName).toBe('RFP Design');
```

### **Test Case 3: Anonymous User Switch Blocked**
```typescript
// 1. Open app without logging in
// 2. Trigger agent switch via message
// 3. Verify:
expect(error.message).toContain('Authentication required');
expect(currentAgent.agent_name).toBe('Solutions'); // Still default
expect(AgentIndicator).toDisplay('Solutions');
```

---

## Key Files Reference

### **UI Layer**
- `src/hooks/useAgentManagement.ts` - Agent state management and UI-initiated switches
- `src/hooks/useMessageHandling.ts` - Streaming event handling and agent switch detection
- `src/components/AgentIndicator.tsx` - UI component displaying current agent
- `src/services/agentService.ts` - Agent data access and session management

### **Edge Function Layer**
- `supabase/functions/claude-api-v3/handlers/http.ts` - Main request handler and agent continuation
- `supabase/functions/claude-api-v3/tools/database.ts` - switchAgent() implementation
- `supabase/functions/claude-api-v3/services/claude.ts` - Tool execution orchestration
- `supabase/functions/claude-api-v3/utils/system-prompt.ts` - Agent context loading

### **Database Schema**
- `database/agents-schema.sql` - Agent and session_agents table definitions
- `supabase/migrations/20251002030545_populate_agents_local.sql` - Agent data and access levels

---

## Best Practices

### **✅ DO**
1. Always update database before updating UI state
2. Use streaming events to trigger UI updates for edge function switches
3. Re-query database state after receiving `message_start` events
4. Validate authentication before allowing agent switches
5. Handle edge cases (agent not found, database failures)

### **❌ DON'T**
1. Update UI state without persisting to database
2. Assume agent state is synchronized without verification
3. Allow anonymous users to switch agents
4. Skip error handling for agent switch failures
5. Mix agent message content (old + new agent in same message)

---

## Future Improvements

1. **Real-time Agent State Sync**: Use Supabase Realtime subscriptions to push agent changes across tabs
2. **Agent Switch History**: Track agent switch timeline in session metadata
3. **Optimistic UI Updates**: Update UI immediately, rollback on failure
4. **Agent Handoff Protocol**: Standardize context passing between agents
5. **Multi-user Collaboration**: Handle agent switches in shared sessions

---

**Document Version**: 1.0  
**Last Updated**: October 14, 2025  
**Author**: AI Assistant (GitHub Copilot)

# Agent Switching Implementation Guide

## Overview

This document details the recent fixes and improvements to the agent switching functionality in RFPEZ.AI, specifically addressing issues where Claude function calls for agent switching were not working properly.

## Problem Summary

### Original Issues
1. **Missing Session Context**: Claude API calls were made without session context (`sessionId` was `undefined`)
2. **UI Not Updating**: Agent switches via Claude functions didn't refresh the UI
3. **Initial Prompts Missing**: Manual agent switches weren't showing new agent greetings
4. **Function Call Failures**: `switch_agent` function calls failed due to missing session parameters

### User Experience
Users would request agent switching (e.g., "switch to bid design agent"), Claude would attempt the switch, but:
- The wrong agent would continue responding
- The UI wouldn't update to show the new agent
- No initial prompt from the new agent would appear

## Technical Solution

### 1. Session Context Integration

**File**: `src/services/claudeService.ts`

**Problem**: Claude API calls didn't include session context, so function calls failed.

**Solution**: Added explicit session context to Claude's system prompt:
```typescript
const sessionContext = sessionId ? `

CURRENT SESSION CONTEXT:
- Session ID: ${sessionId}
- Use this session ID when calling functions that require a session_id parameter (like switch_agent, store_message, etc.)` : '';

const systemPrompt = `${agent.instructions}${userContext}${sessionContext}...`;
```

### 2. Session ID Parameter Fix

**File**: `src/pages/Home.tsx`

**Problem**: `undefined` was being passed as sessionId to Claude service.

**Solution**: Pass the actual `activeSessionId`:
```typescript
// BEFORE (BROKEN):
const claudeResponse = await ClaudeService.generateResponse(
  content, agentForClaude, conversationHistory, 
  undefined, // ❌ sessionId was undefined
  userProfile
);

// AFTER (FIXED):
const claudeResponse = await ClaudeService.generateResponse(
  content, agentForClaude, conversationHistory, 
  activeSessionId, // ✅ Now passes actual session ID
  userProfile
);
```

### 3. Enhanced Function Implementation

**File**: `src/services/claudeAPIFunctions.ts`

**Improvements**:
- Added comprehensive logging for debugging
- Implemented retry logic for database consistency
- Added verification that agent switches actually complete
- Enhanced error handling

```typescript
console.log('🔄 AGENT SWITCH ATTEMPT:', {
  session_id, agent_id, reason, userId, timestamp: new Date().toISOString()
});

// Database verification with retry
let newActiveAgent = null;
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries && !newActiveAgent) {
  await new Promise(resolve => setTimeout(resolve, 100));
  newActiveAgent = await AgentService.getSessionActiveAgent(session_id);
  // Verify the switch actually happened...
}
```

### 4. UI Synchronization

**File**: `src/pages/Home.tsx`

**Problem**: UI didn't refresh after Claude function agent switches.

**Solution**: Automatic UI refresh when agent switches are detected:
```typescript
// Check if an agent switch occurred during the Claude response
if (claudeResponse.metadata.agent_switch_occurred) {
  console.log('Agent switch detected via Claude function, refreshing UI...');
  // Small delay to ensure database transaction has completed
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Refresh the current agent from database to update UI
  if (activeSessionId) {
    const newAgent = await AgentService.getSessionActiveAgent(activeSessionId);
    if (newAgent) {
      handleAgentChanged(newAgent); // Updates UI and shows initial prompt
    }
  }
}
```

### 5. Initial Prompt Fix

**File**: `src/pages/Home.tsx`

**Problem**: Manual agent switches weren't showing initial prompts.

**Solution**: Modified `handleAgentChanged` to always show initial prompts:
```typescript
const handleAgentChanged = (newAgent: SessionActiveAgent) => {
  setCurrentAgent(newAgent);
  console.log('Agent changed to:', newAgent);
  
  // Always show the agent's initial prompt when switching agents
  if (newAgent.agent_initial_prompt) {
    const greetingMessage: Message = {
      id: Date.now().toString(),
      content: newAgent.agent_initial_prompt,
      isUser: false,
      timestamp: new Date(),
      agentName: newAgent.agent_name
    };
    setMessages(prev => [...prev, greetingMessage]);
  }
};
```

## Flow Diagrams

### Manual Agent Switch Flow
```
User clicks AgentSelector 
→ AgentSelector.handleAgentSelect() 
→ AgentService.setSessionAgent() 
→ onAgentChanged callback 
→ Home.handleAgentChanged() 
→ UI updates + Initial prompt shown
```

### Claude Function Agent Switch Flow
```
User: "switch to bid design agent"
→ Claude receives request with session context
→ Claude calls switch_agent function with session_id
→ AgentService.setSessionAgent() updates database
→ Claude response includes agent_switch_occurred: true
→ Home.tsx detects the flag
→ Delays for database consistency
→ Loads new agent from database
→ Calls handleAgentChanged()
→ UI updates + Initial prompt shown
```

## Testing Guide

### Manual Testing Steps

1. **Start the application** with proper session management
2. **Login** to ensure you have a valid session
3. **Manual Switch Test**:
   - Click the agent indicator in the UI
   - Select a different agent
   - Verify: UI updates, new agent name shown, initial prompt appears
4. **Claude Function Switch Test**:
   - Send message: "switch to bid design agent"
   - Verify: Claude acknowledges switch, UI updates, new agent responds with greeting

### Debugging

The implementation includes extensive logging. Check browser console for:
```
🔄 AGENT SWITCH ATTEMPT: {session_id, agent_id, reason, userId, timestamp}
🔄 Performing agent switch in database...
🔄 Agent switch database result: {success, session_id, agent_id, agent_name}
🔄 Agent switch verification - new active agent: {...}
🔄 Agent switch complete, returning result: {...}
Agent switch detected via Claude function, refreshing UI...
UI refresh after agent switch - loaded agent: [Agent Name]
```

### Common Issues and Solutions

1. **Switch appears to work but wrong agent responds**:
   - Check that sessionId is being passed correctly
   - Verify database actually updated (check logs)
   - Ensure UI refresh is triggered

2. **No initial prompt after switch**:
   - Verify handleAgentChanged is being called
   - Check that agent has an initial_prompt in database
   - Look for errors in message creation

3. **UI doesn't update after Claude function switch**:
   - Confirm agent_switch_occurred metadata is set
   - Check that activeSessionId is available
   - Verify no errors in the UI refresh logic

## Performance Considerations

- **Database Retry Logic**: Prevents race conditions but adds ~300ms delay
- **UI Refresh Delays**: 200ms delay ensures database consistency
- **Logging Overhead**: Comprehensive logging may impact performance in production

## Future Improvements

1. **Real-time Updates**: Consider WebSocket for instant UI updates
2. **Optimistic UI**: Update UI immediately, then verify database
3. **Agent Switch Animation**: Visual feedback during switches
4. **Switch History**: Track agent switch history for analytics
5. **Performance Optimization**: Reduce delays while maintaining reliability

## Related Files

- `src/services/claudeService.ts` - Claude API integration with session context
- `src/services/claudeAPIFunctions.ts` - Function implementations with debugging
- `src/pages/Home.tsx` - UI logic and agent switch detection
- `src/components/AgentSelector.tsx` - Manual agent selection component
- `src/services/agentService.ts` - Database operations for agents
- `DOCUMENTATION/AGENTS.md` - General agent system documentation
- `DOCUMENTATION/CLAUDE-API-INTEGRATION.md` - Claude API integration details

# Anonymous Intent Handoff Feature

**Date**: October 14, 2025  
**Status**: ✅ **IMPLEMENTED**  
**Priority**: High - Critical for user experience

## Problem Statement

When anonymous users express procurement intent (e.g., "Create an RFP for LED bulbs"), they can't access the RFP Design agent because it requires authentication. After they sign up, they have to repeat their request, creating friction in the user experience.

## Solution Overview

Implement a **seamless intent handoff** system that:
1. **Captures** anonymous user's procurement intent before prompting signup
2. **Stores** intent in memory with special type `anonymous_intent`
3. **Retrieves** stored intent when user returns authenticated
4. **Resumes** workflow automatically by switching to RFP Design agent

## Implementation Details

### 1. Anonymous User Flow

**Step 1: User Expresses Intent**
```
Anonymous User: "I need to source LED bulbs for my office"
```

**Step 2: Solutions Agent Captures Intent**
```javascript
// Agent calls create_memory tool
{
  "content": "ANONYMOUS_INTENT: User wants to source LED bulbs for office lighting",
  "memory_type": "anonymous_intent",
  "importance_score": 0.95,
  "tags": ["procurement", "anonymous", "signup_trigger"]
}
```

**Step 3: Solutions Agent Prompts Signup**
```
"I'd love to help you source LED bulbs for your office! The RFP Design agent 
requires a free account. Would you like to sign up? It just takes a moment and 
you'll get full access to our RFP creation tools. Once you're signed in, I'll 
remember what you wanted and we can get started right away!"
```

**Key Points:**
- Memory stored BEFORE prompting signup
- Uses special `memory_type: "anonymous_intent"`
- High importance score (0.95) ensures retrieval
- Content prefixed with "ANONYMOUS_INTENT:" for easy searching

### 2. Authenticated User Return Flow

**Step 1: Solutions Agent Initial Prompt**
```javascript
// On session start, agent searches memories
{
  "query": "ANONYMOUS_INTENT",
  "memory_types": "anonymous_intent",
  "limit": 1
}
```

**Step 2A: Intent Found - Resume Workflow**
```javascript
Memory Found: "ANONYMOUS_INTENT: User wants to source LED bulbs for office lighting"

// Agent response
"Welcome back! I see you wanted to source LED bulbs for your office. 
Let me connect you with our RFP Design agent to get started on creating your RFP."

// Agent actions (in order):
1. create_memory({
     "content": "User wants to source LED bulbs for office lighting",
     "memory_type": "decision",
     "importance_score": 0.9
   })

2. switch_agent({
     "agent_name": "RFP Design",
     "user_input": "I need to source LED bulbs for my office"
   })
```

**Step 2B: No Intent Found - Standard Greeting**
```
"Welcome! I'm here to help with your procurement and sourcing needs. 
What brings you here today?"
```

## User Experience Flow

### Scenario 1: Anonymous User Signs Up

```
┌─────────────────────────────────────────────────────────────┐
│ SESSION 1: Anonymous User                                   │
├─────────────────────────────────────────────────────────────┤
│ User: "Create an RFP for industrial cleaning supplies"      │
│ Solutions: [stores memory as "anonymous_intent"]            │
│ Solutions: "I'd love to help! Sign up for free access?"     │
│ User: [clicks signup, creates account]                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SESSION 2: Authenticated User (same browser/device)         │
├─────────────────────────────────────────────────────────────┤
│ Solutions: [searches for "ANONYMOUS_INTENT", finds it]      │
│ Solutions: "Welcome back! I see you wanted to create an     │
│            RFP for industrial cleaning supplies."           │
│ Solutions: [stores as authenticated intent]                 │
│ Solutions: [switches to RFP Design agent]                   │
│ RFP Design: "Great! Let me help you create that RFP..."     │
│ [Workflow continues seamlessly]                             │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 2: Anonymous User Doesn't Sign Up

```
┌─────────────────────────────────────────────────────────────┐
│ SESSION 1: Anonymous User                                   │
├─────────────────────────────────────────────────────────────┤
│ User: "Create an RFP for office furniture"                  │
│ Solutions: [stores memory as "anonymous_intent"]            │
│ Solutions: "Sign up for free access?"                       │
│ User: [leaves without signing up]                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SESSION 2: Anonymous User Returns (same browser)            │
├─────────────────────────────────────────────────────────────┤
│ Solutions: [searches for "ANONYMOUS_INTENT", finds it]      │
│ Solutions: "Welcome back! I see you were interested in      │
│            creating an RFP for office furniture. Ready to   │
│            sign up and get started?"                        │
│ [Memory persists until user signs up or clears browser]     │
└─────────────────────────────────────────────────────────────┘
```

## Memory Structure

### Anonymous Intent Memory
```json
{
  "content": "ANONYMOUS_INTENT: User wants to source LED bulbs for office lighting",
  "memory_type": "anonymous_intent",
  "importance_score": 0.95,
  "tags": ["procurement", "anonymous", "signup_trigger"],
  "reference_type": "user_profile",
  "reference_id": "[anonymous_user_id]"
}
```

**Properties:**
- **content**: Prefixed with "ANONYMOUS_INTENT:" for easy searching
- **memory_type**: Special type "anonymous_intent" (not "decision")
- **importance_score**: 0.95 (highest priority for retrieval)
- **tags**: Help categorize and find intent memories

### Converted Authenticated Intent Memory
```json
{
  "content": "User wants to source LED bulbs for office lighting",
  "memory_type": "decision",
  "importance_score": 0.9,
  "reference_type": "user_profile",
  "reference_id": "[authenticated_user_id]"
}
```

**Properties:**
- **content**: Original intent without "ANONYMOUS_INTENT:" prefix
- **memory_type**: Standard "decision" type for RFP Design agent
- **importance_score**: 0.9 (standard for procurement intents)
- **reference_id**: Now links to authenticated user

## Agent Instructions Updates

### Solutions Agent (`Agent Instructions/Solutions Agent.md`)

**Initial Prompt - Added Intent Check:**
```markdown
**CRITICAL FIRST STEP:** Search memories for any "anonymous_intent" to check 
if user had a request before authenticating.

For authenticated users:
- **IF FOUND anonymous_intent memory:**
  1. Greet them warmly and acknowledge their previous request
  2. Say: "Welcome back! I see you wanted to [their intent]. Let me connect you 
     with our RFP Design agent to get started."
  3. Call create_memory to store the intent as authenticated user's request
  4. Call switch_agent to "RFP Design" with the original intent
```

**RULE 2 - Added Anonymous Memory Storage:**
```markdown
- **If user is ANONYMOUS (not logged in):**
  Tool 1: create_memory - content: "ANONYMOUS_INTENT: [full user request]", 
          memory_type: "anonymous_intent", importance_score: 0.95
  Tool 2: Respond with signup prompt (mentioning intent will be remembered)
```

**New Section - Anonymous Intent Handoff:**
- Complete workflow documentation
- Memory type definitions
- Example flows for both scenarios
- Critical rules for handling transitions

## Files Modified

### Agent Instructions:
1. **`Agent Instructions/Solutions Agent.md`** - Added anonymous intent handoff logic
   - Updated Initial Prompt to check for stored intent
   - Modified RULE 2 to store anonymous intent before signup prompt
   - Added comprehensive "Anonymous Intent Handoff" section
   - Updated examples and workflows

### Database Migrations:
1. **`supabase/migrations/20251014190144_update_solutions_agent.sql`** (32.35 KB)
   - Updates Solutions agent instructions in database
   - Includes all new handoff logic

## Testing Plan

### Test 1: Anonymous Intent Capture
- [ ] Open app without logging in
- [ ] Send: "Create an RFP for LED bulbs"
- [ ] Verify: Solutions agent stores memory with type "anonymous_intent"
- [ ] Verify: Agent prompts for signup with reassurance about remembering intent
- [ ] Verify: Memory content includes "ANONYMOUS_INTENT:" prefix

### Test 2: Authenticated Return with Intent
- [ ] Continue from Test 1 after signup/login
- [ ] Verify: Solutions agent searches for "ANONYMOUS_INTENT" on greeting
- [ ] Verify: Agent acknowledges previous request ("Welcome back! I see you wanted...")
- [ ] Verify: Agent stores new memory with type "decision"
- [ ] Verify: Agent switches to RFP Design automatically
- [ ] Verify: RFP Design receives original intent in context

### Test 3: Authenticated User Without Prior Intent
- [ ] Log in with new account (no anonymous intent)
- [ ] Verify: Solutions agent gives standard greeting
- [ ] Verify: No automatic agent switch
- [ ] Send: "Create an RFP for office supplies"
- [ ] Verify: Normal authenticated workflow (memory + switch)

### Test 4: Anonymous User Returns Without Signup
- [ ] Open app without logging in
- [ ] Send: "Create an RFP for concrete"
- [ ] Close browser/tab
- [ ] Reopen app (still anonymous, same browser)
- [ ] Verify: Solutions agent still has access to anonymous intent memory
- [ ] Verify: Can reference previous request if user asks

## Technical Considerations

### Memory Persistence
- **Browser-based**: Memories stored in Supabase, linked to session/browser
- **Cross-device**: Won't work across devices (user needs same browser/session)
- **Expiration**: Memories should persist until user signs up or clears data

### Memory Cleanup
- Consider cleanup strategy for old anonymous intents:
  - After successful authentication and handoff
  - After X days of inactivity
  - When user explicitly clears browser data

### Edge Cases
1. **Multiple anonymous intents**: Keep only most recent (importance_score 0.95)
2. **User changes mind**: New intent replaces old before signup
3. **Signup failure**: Intent remains stored for retry
4. **Multiple sessions**: Each browser/session tracks own anonymous intent

## Benefits

1. **Seamless UX**: Users don't have to repeat their request after signup
2. **Higher Conversion**: Reduces friction in signup → usage flow
3. **Context Preservation**: No information loss during authentication
4. **Smart Greeting**: Personalized welcome for returning users
5. **Increased Engagement**: Users see immediate value after signup

## Future Enhancements

1. **Email Reminder**: Send email with their intent if they don't complete signup
2. **Cross-Device Sync**: Store intent with email/phone for cross-device handoff
3. **Intent Refinement**: Allow user to modify intent after authentication
4. **Multi-Intent Support**: Handle multiple procurement requests from anonymous users
5. **Analytics**: Track conversion rates of anonymous intent → RFP creation

---

**Implemented by**: AI Assistant  
**Migration Applied**: ✅ Local database updated  
**Status**: Ready for testing with browser MCP

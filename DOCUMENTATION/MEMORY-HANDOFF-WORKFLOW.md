# Memory-Based Agent Handoff Workflow

## Overview
This document describes the memory-based intent preservation system that enables seamless handoff between Solutions and RFP Design agents.

## Workflow Architecture

### Phase 1: Intent Capture (Solutions Agent)
**Trigger:** User expresses procurement need or RFP creation intent

**Actions:**
1. **Detect Procurement Intent** - Solutions agent identifies procurement-related requests
2. **Create Memory** - Store intent before switching agents
3. **Switch Agent** - Hand off to RFP Design agent with context

### Phase 2: Intent Retrieval (RFP Design Agent)
**Trigger:** Agent receives control (new session or agent switch)

**Actions:**
1. **Search Memories** - Query for stored RFP intents
2. **Analyze Results** - Prioritize recent, high-importance decisions
3. **Act on Intent** - Proceed as if continuing the conversation

## Complete End-to-End Example

### Scenario: User wants to source LED bulbs

#### Step 1: User Talks to Solutions Agent
```
User: "I need to source 100 LED bulbs for our warehouse. They need to be energy efficient and last at least 5 years."

Solutions Agent Internal Actions:
1. Detects procurement intent (keyword: "source", "LED bulbs")
2. Calls create_memory:
   {
     "content": "User wants to source 100 LED bulbs for warehouse lighting. Requirements: energy efficient, minimum 5-year lifespan, quantity 100 units.",
     "memory_type": "decision",
     "importance_score": 0.9
   }
3. Calls switch_agent:
   {
     "agent_name": "RFP Design",
     "user_input": "I need to source 100 LED bulbs for our warehouse. They need to be energy efficient and last at least 5 years."
   }

Solutions Agent Response to User:
"I'll connect you with our RFP Design specialist who will help you create a comprehensive procurement package for those LED bulbs!"
```

#### Step 2: RFP Design Agent Takes Control
```
RFP Design Agent Internal Actions:
1. Immediately calls search_memories:
   {
     "query": "user procurement intent requirements sourcing RFP LED bulbs",
     "memory_types": "decision,preference",
     "limit": 5
   }
   
2. Receives memory:
   {
     "id": "mem_123",
     "content": "User wants to source 100 LED bulbs for warehouse lighting. Requirements: energy efficient, minimum 5-year lifespan, quantity 100 units.",
     "memory_type": "decision",
     "importance_score": 0.9,
     "created_at": "2025-10-09T14:23:45Z",
     "similarity": 0.95
   }

3. Recognizes procurement intent and acts immediately

RFP Design Agent Response to User:
"I see you're looking to source 100 energy-efficient LED bulbs with at least a 5-year lifespan for your warehouse. Let me create an RFP to help you find the best suppliers.

I'll start by creating the RFP record and then gather additional details through a questionnaire..."

[Calls create_and_set_rfp with name: "LED Bulb Procurement RFP"]
[Proceeds to create buyer questionnaire]
```

#### Step 3: User Experience
From the user's perspective, the conversation is seamless:
1. Tell Solutions agent what they need
2. Instantly connected to RFP Design agent
3. RFP Design agent already knows what they want
4. No need to repeat requirements
5. Feels like talking to one intelligent system

## Memory Storage Guidelines

### Solutions Agent - What to Store

#### High Priority (Importance 0.9):
- Explicit procurement requests with specifications
- Product/service names with quantities
- Budget, timeline, or delivery requirements
- Specific vendor preferences or constraints

**Examples:**
```json
{
  "content": "User needs to procure 500 gallons of acetone (99%+ purity) for industrial cleaning, delivery within 2 weeks.",
  "memory_type": "decision",
  "importance_score": 0.9
}

{
  "content": "User wants to create RFP for office furniture: 20 desks, 20 chairs, 10 filing cabinets. Budget $10,000, delivery Q2.",
  "memory_type": "decision",
  "importance_score": 0.9
}
```

#### Medium Priority (Importance 0.8):
- General procurement interest with some details
- Product categories without full specifications
- Exploratory sourcing questions with context

**Examples:**
```json
{
  "content": "User exploring options for industrial cleaning supplies, specifically interested in eco-friendly alternatives.",
  "memory_type": "decision",
  "importance_score": 0.8
}
```

#### What NOT to Store:
- General platform questions
- Pricing inquiries without procurement intent
- Technical support requests
- Casual conversation

### RFP Design Agent - What to Store

#### User Preferences (Importance 0.7):
```json
{
  "content": "User prefers detailed technical specifications in all RFPs, especially for electronics.",
  "memory_type": "preference",
  "importance_score": 0.7
}

{
  "content": "User always requires 30-day payment terms and prefers net-60 when possible.",
  "memory_type": "preference",
  "importance_score": 0.7
}
```

#### Project Context (Importance 0.6):
```json
{
  "content": "LED bulb RFP focused on total cost of ownership over 10 years, not just unit price.",
  "memory_type": "context",
  "importance_score": 0.6,
  "reference_type": "rfp",
  "reference_id": "rfp_456"
}
```

#### Major Decisions (Importance 0.8):
```json
{
  "content": "User decided to split furniture procurement: Phase 1 (immediate) desks/chairs, Phase 2 (Q2) storage/cabinets.",
  "memory_type": "decision",
  "importance_score": 0.8,
  "reference_type": "rfp",
  "reference_id": "rfp_789"
}
```

## Memory Search Strategies

### RFP Design Agent - Search Patterns

#### Standard Session Start Search:
```json
{
  "query": "user procurement intent requirements sourcing RFP",
  "memory_types": "decision,preference",
  "limit": 5
}
```

#### Product-Specific Search:
```json
{
  "query": "LED bulbs lighting procurement requirements",
  "memory_types": "decision",
  "limit": 3
}
```

#### Preference Search:
```json
{
  "query": "user vendor preferences specifications requirements",
  "memory_types": "preference",
  "limit": 10
}
```

### Interpreting Search Results

#### High Relevance (Similarity > 0.8):
- Direct match to current intent
- Act immediately on the information
- No need to ask user to repeat

#### Medium Relevance (Similarity 0.5-0.8):
- Related but may need clarification
- Acknowledge and confirm with user
- Use as starting point for conversation

#### Low Relevance (Similarity < 0.5):
- Background context only
- Don't explicitly mention
- May inform your approach but don't assume

## User Experience Goals

### What Users Should Experience:
1. **Seamless Handoff** - No repetition of requirements
2. **Intelligent Context** - Agents "remember" what was discussed
3. **Natural Flow** - Conversation continues smoothly across agents
4. **Proactive Service** - RFP Design starts working immediately
5. **Single System Feel** - Appears as one intelligent assistant

### What Users Should NOT Experience:
1. "Can you repeat what you need?" after agent switch
2. "What are you looking to procure?" when they just told Solutions
3. Disconnected conversations between agents
4. Loss of context or intent
5. Need to "start over" with each agent

## Technical Implementation

### Database Tables Used:
- `agent_memories` - Stores memory content with embeddings
- `memory_references` - Links memories to RFPs, bids, artifacts
- `memory_access_log` - Tracks when memories are retrieved

### Functions Available:
- `create_memory()` - Store new memories
- `search_memories()` - Semantic search for memories
- `search_agent_memories()` - PostgreSQL function with vector similarity

### Current Limitations (MVP):
- Using placeholder embeddings (array of 384 zeros)
- Simple keyword matching until real embeddings implemented
- Manual memory management by agents

### Future Enhancements:
- Real embeddings via OpenAI or local model
- Automatic memory creation from conversation analysis
- Memory importance decay over time
- Cross-agent memory sharing (beyond Solutions → RFP Design)
- Memory consolidation and summarization

## Testing Scenarios

### Test Case 1: Simple Procurement Request
1. User to Solutions: "I need to source printer paper"
2. Solutions creates memory, switches to RFP Design
3. RFP Design searches memories, finds intent
4. RFP Design responds: "I see you need printer paper..." (no repetition)

### Test Case 2: Complex Multi-Product Request
1. User to Solutions: "We need office supplies - paper, pens, folders, and staplers for 50 people"
2. Solutions creates detailed memory with all items
3. RFP Design retrieves memory
4. RFP Design creates comprehensive RFP covering all items

### Test Case 3: Request with Constraints
1. User to Solutions: "I need to source acetone, but it must be 99% pure and delivered within 2 weeks"
2. Solutions captures all constraints in memory
3. RFP Design retrieves memory with full details
4. RFP Design creates RFP with purity and timeline requirements

### Test Case 4: Cross-Session Preference
1. User creates RFP, mentions "we always use US vendors"
2. RFP Design stores as preference memory
3. Week later: User starts new RFP
4. RFP Design retrieves preference, suggests US vendor focus

## Monitoring and Debugging

### Memory Creation Logs:
```
🧠 Creating memory: {...}
✅ Memory created: mem_123
🔗 Creating memory reference: {...}
```

### Memory Search Logs:
```
🔍 Searching memories: {...}
✅ Found 3 memories
```

### Success Metrics:
- Agent switch completion rate
- Memory retrieval accuracy
- User repetition rate (should be near 0%)
- Session continuation success
- User satisfaction with handoff

## Best Practices Summary

### For Solutions Agent:
1. ✅ **DO** create memory before switching agents
2. ✅ **DO** capture ALL user-provided details
3. ✅ **DO** use importance score 0.9 for explicit procurement
4. ❌ **DON'T** switch without storing intent
5. ❌ **DON'T** summarize - preserve full details

### For RFP Design Agent:
1. ✅ **DO** search memories at session start
2. ✅ **DO** act on retrieved intent immediately
3. ✅ **DO** acknowledge context naturally
4. ❌ **DON'T** ask user to repeat if memory found
5. ❌ **DON'T** mention "I found a memory" to user

### For Both Agents:
1. ✅ **DO** store preferences for future use
2. ✅ **DO** link memories to RFPs when applicable
3. ✅ **DO** use natural language in memory content
4. ❌ **DON'T** expose technical details to users
5. ❌ **DON'T** create duplicate memories

---

**Last Updated:** October 9, 2025  
**Status:** Implementation Complete - Ready for Testing

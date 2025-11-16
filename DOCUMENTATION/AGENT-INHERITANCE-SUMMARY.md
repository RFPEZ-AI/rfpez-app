# Agent Inheritance System - Executive Summary

**Quick Reference**: See [AGENT-INHERITANCE-DESIGN.md](./AGENT-INHERITANCE-DESIGN.md) for full details

## What We're Building

An agent inheritance system where specialized agents inherit instructions and tools from parent agents, enabling:

1. **Code Reuse**: Extract common behavior into `_common` abstract agent
2. **Rapid Specialization**: Create new specialized agents quickly
3. **Recursive Inheritance**: Support multi-level chains (e.g., TMC → RFP Design → _common)
4. **Tool Aggregation**: Automatically merge tool permissions from parent agents

## Architecture Overview

```
_common (Abstract Base)
├── Solutions (Sales)
├── RFP Design (Design)
│   └── TMC Specialist (Specialized Design) ← 3-level inheritance example
├── Support
├── Audit
└── ... (other agents)
```

**Key Mechanism**: When loading an agent, recursively load parent agents and merge their instructions/tools.

## Database Changes

### New Columns on `agents` Table

```sql
ALTER TABLE agents ADD COLUMN
  parent_agent_id UUID REFERENCES agents(id),
  is_abstract BOOLEAN DEFAULT FALSE,
  inheritance_depth INTEGER DEFAULT 0,
  access_override BOOLEAN DEFAULT FALSE;
```

### Example Data

| name | parent_agent_id | is_abstract | inheritance_depth |
|------|----------------|-------------|-------------------|
| _common | NULL | TRUE | 0 |
| Solutions | _common_id | FALSE | 1 |
| RFP Design | _common_id | FALSE | 1 |
| TMC Specialist | rfp_design_id | FALSE | 2 |

## Code Changes

### New File: `agent-inheritance.ts`

Core logic for recursive agent loading and merging:

```typescript
async function loadAgentWithInheritance(
  supabase: any,
  agentId: string,
  depth: number = 0
): Promise<MergedAgent | null>

function mergeAgentWithParent(
  parent: MergedAgent,
  child: Agent
): MergedAgent
```

### Updated: `system-prompt.ts`

Replace direct agent loading with inheritance-aware loading:

```typescript
// OLD:
const { data: agent } = await supabase
  .from('agents')
  .select(...)
  .single();

// NEW:
const agent = await loadAgentWithInheritance(supabase, agentId);
```

## Implementation Phases

### Phase 1: Database Schema (Day 1, ~4 hours)
- [ ] Create migration file
- [ ] Add inheritance columns
- [ ] Create indexes and constraints
- [ ] Test locally with `supabase migration up`

### Phase 2: Core Logic (Day 1-2, ~8 hours)
- [ ] Create `agent-inheritance.ts` module
- [ ] Implement recursive loading
- [ ] Implement merging logic
- [ ] Add comprehensive logging
- [ ] Update `system-prompt.ts` to use inheritance

### Phase 3: `_common` Agent (Day 2, ~4 hours)
- [ ] Analyze existing agents for common patterns
- [ ] Create `Agent Instructions/_common.md`
- [ ] Extract common sections:
  - Memory system integration
  - Perplexity web search
  - Agent switching
  - Authentication context
  - Error handling
- [ ] Deploy to database

### Phase 4: Refactor Existing Agents (Day 2-3, ~8 hours)
- [ ] Refactor Solutions Agent
  - Remove common sections
  - Set `parent_agent_id = _common`
  - Update instructions in DB
- [ ] Refactor RFP Design Agent
  - Remove common sections
  - Set `parent_agent_id = _common`
  - Update instructions in DB
- [ ] Verify both agents work correctly

### Phase 5: TMC Specialist (Day 3, ~4 hours)
- [ ] Create `Agent Instructions/TMC Specialist.md`
- [ ] Set `parent_agent_id = RFP Design`
- [ ] Test 3-level inheritance chain
- [ ] Verify TMC-specific behavior

### Phase 6: Testing (Day 3-4, ~8 hours)
- [ ] Unit tests for merging logic
- [ ] Integration tests for database queries
- [ ] E2E tests for each inheritance level
- [ ] Verify logging output
- [ ] Performance testing

## Testing Checklist

### Test Case 1: Solutions Agent (2-level)
```bash
# Expected inheritance chain: _common → Solutions
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"agentId": "solutions-id", "messages": [...]}'

# Verify logs show:
# - Inheritance chain: ["_common", "Solutions"]
# - Merged instructions: ~8000 chars
# - Merged tools: [memory, search, perplexity, ...]
```

### Test Case 2: RFP Design Agent (2-level)
```bash
# Expected: _common → RFP Design
# Verify:
# - Creates RFP (RFP Design behavior)
# - Uses memory (common behavior)
# - All tools available
```

### Test Case 3: TMC Specialist (3-level)
```bash
# Expected: _common → RFP Design → TMC Specialist
# Verify:
# - 3-level chain in logs
# - Instructions from all 3 agents
# - TMC-specific content in RFP
# - All tools from all 3 levels
```

## Key Logging Points

When agent loads, expect to see:

```
🔗 AGENT INHERITANCE - Loading agent (depth 0): TMC Specialist
🔄 Loading parent: RFP Design
🔗 AGENT INHERITANCE - Loading agent (depth 1): RFP Design
🔄 Loading parent: _common
🔗 AGENT INHERITANCE - Loading agent (depth 2): _common
✅ Reached root agent

🔧 Merging _common + RFP Design
✅ Merge complete: 8139 chars, 23 tools

🔧 Merging RFP Design + TMC Specialist
✅ Merge complete: 9595 chars, 24 tools

📊 AGENT INHERITANCE - Detailed breakdown:
Chain: _common → RFP Design → TMC Specialist
Total Instructions: 9595 characters
Total Tools: 24
```

## Success Criteria

- [ ] All agents load successfully with inheritance
- [ ] Instructions merge correctly (parent → child order)
- [ ] Tools aggregate without duplicates
- [ ] 3-level inheritance works (TMC example)
- [ ] Abstract agents cannot be selected
- [ ] No performance degradation (<200ms agent load)
- [ ] Comprehensive logging for debugging
- [ ] All tests passing

## Commands Quick Reference

```bash
# Create migration
supabase migration new add_agent_inheritance

# Apply migration locally
supabase migration up

# Create agent from markdown
node scripts/md-to-sql-migration.js "Agent Instructions/_common.md"

# Test edge function locally
supabase functions serve claude-api-v3 --debug

# View logs
docker logs -f supabase_edge_runtime_rfpez-app-local | grep "AGENT INHERITANCE"

# Deploy to remote
supabase db push
supabase functions deploy claude-api-v3
```

## Files to Create/Modify

### New Files
- ✅ `DOCUMENTATION/AGENT-INHERITANCE-DESIGN.md` (this design doc)
- `supabase/functions/claude-api-v3/utils/agent-inheritance.ts` (core logic)
- `supabase/functions/claude-api-v3/tests/agent-inheritance.test.ts` (tests)
- `Agent Instructions/_common.md` (abstract base agent)
- `Agent Instructions/TMC Specialist.md` (3-level example)
- `supabase/migrations/YYYYMMDDHHMMSS_add_agent_inheritance.sql`

### Modified Files
- `database/agents-schema.sql` (documentation)
- `supabase/functions/claude-api-v3/utils/system-prompt.ts` (use inheritance)
- `Agent Instructions/Solutions Agent.md` (refactor)
- `Agent Instructions/RFP Design Agent.md` (refactor)

## Next Steps

1. **Review this design** - Confirm approach and architecture
2. **Start Phase 1** - Create database migration
3. **Implement Phase 2** - Core inheritance logic
4. **Test incrementally** - Verify each phase before moving on
5. **Deploy when stable** - Push to production after full testing

**Ready to proceed?** Start with Phase 1 database schema changes.

## Questions to Consider

1. **Tool override strategy**: Should we support removing parent tools? (Currently: additive only)
2. **Performance caching**: Should we cache merged agents? (Future enhancement)
3. **Circular detection**: Database constraint enough or need runtime check?
4. **Max depth limit**: Is 10 levels sufficient? (Current design)
5. **UI changes**: Should abstract agents be visible but disabled in selector?

See full design document for detailed answers and implementation guidance.

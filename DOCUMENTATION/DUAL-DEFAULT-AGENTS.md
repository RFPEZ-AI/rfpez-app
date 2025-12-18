# Dual Default Agents for Specialty Sites

## Overview
Specialty sites like `/corporate-tmc-rfp` need different default agents for anonymous visitors versus authenticated users:
- **Anonymous Users**: Need a welcoming, informative agent (e.g., "Corporate TMC RFP Welcome")
- **Authenticated Users**: Need a work-focused agent (e.g., "TMC Specialist")

## Implementation

### Database Schema
Added `is_anonymous_default` column to `specialty_site_agents` table:

```sql
ALTER TABLE specialty_site_agents 
ADD COLUMN is_anonymous_default BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_specialty_site_agents_anonymous_default 
ON specialty_site_agents(specialty_site_id, is_anonymous_default);
```

### Configuration Example
For the `corporate-tmc-rfp` specialty site:

| Agent | is_default_agent | is_anonymous_default | is_restricted | is_free | Purpose |
|-------|------------------|----------------------|---------------|---------|---------|
| TMC Specialist | ✅ true | ❌ false | ❌ false | ✅ true | Work agent for authenticated users |
| Corporate TMC RFP Welcome | ❌ false | ✅ true | ❌ false | ✅ true | Welcome agent for anonymous users |
| TMC Tender | ❌ false | ❌ false | ✅ true | ❌ false | Premium agent |
| Support | ❌ false | ❌ false | ❌ false | ✅ true | Help agent |

### Service Layer Logic
`SpecialtySiteService.getDefaultAgentForSpecialtySite()` now uses the database columns:

```typescript
if (isAuthenticated) {
  // Get agent marked as is_default
  defaultAgent = agents.find(agent => agent.is_default);
} else {
  // Get agent marked as is_anonymous_default
  defaultAgent = agents.find(agent => agent.is_anonymous_default);
}
```

### RPC Function
Updated `get_specialty_site_agents()` to return `is_anonymous_default`:

```sql
CREATE OR REPLACE FUNCTION get_specialty_site_agents(site_slug text)
RETURNS TABLE (
  agent_id uuid,
  agent_name text,
  agent_instructions text,
  agent_initial_prompts text[],
  is_default boolean,
  is_anonymous_default boolean,  -- NEW FIELD
  sort_order integer,
  -- ... other fields
)
```

## User Experience Flow

### Anonymous User Visits `/corporate-tmc-rfp`
1. `useAgentManagement.loadDefaultAgentWithPrompt()` is called
2. Detects `specialtySlug = 'corporate-tmc-rfp'`
3. Calls `SpecialtySiteService.getDefaultAgentForSpecialtySite('corporate-tmc-rfp')`
4. Service checks `isAuthenticated = false`
5. Service finds agent with `is_anonymous_default = true` → **Corporate TMC RFP Welcome**
6. Agent loads with welcoming initial prompt
7. User can explore system and learn about features

### Authenticated User Visits `/corporate-tmc-rfp`
1. Same initialization flow
2. Service checks `isAuthenticated = true`
3. Service finds agent with `is_default = true` → **TMC Specialist**
4. Agent loads ready for work
5. User can immediately start creating RFPs

## Migration Files
- `20251218011500_add_anonymous_default_to_specialty_sites.sql` - Adds column and configures corporate-tmc-rfp site
- `20251218010904_update_tmc_specialist_agent.sql` - Updates TMC Specialist access (is_restricted=false, is_free=true)

## TypeScript Types
Updated `Agent` interface in `src/types/database.ts`:

```typescript
export interface Agent {
  // ...
  is_default?: boolean;                  // Default agent for authenticated users
  is_anonymous_default?: boolean;        // Default agent for anonymous users (specialty sites)
  // ...
}
```

## Benefits
1. **Better UX**: Anonymous users see welcoming content, authenticated users get straight to work
2. **Flexible**: Each specialty site can configure their own dual defaults
3. **Explicit**: Database columns make intent clear, no hardcoded logic
4. **Scalable**: Works for any future specialty sites

## Testing Checklist
- [ ] Anonymous user visits `/corporate-tmc-rfp` → Corporate TMC RFP Welcome loads
- [ ] Authenticated user visits `/corporate-tmc-rfp` → TMC Specialist loads
- [ ] Anonymous user sees TMC Specialist and TMC Tender as locked (is_restricted)
- [ ] Authenticated user (beta mode) can access all agents
- [ ] Agent switching works correctly between all agents
- [ ] Initial prompts display correctly for each default agent

## Related Documentation
- [BETA-TEST-CONFIG.md](./BETA-TEST-CONFIG.md) - Beta test mode configuration
- [AGENTS.md](./AGENTS.md) - Multi-agent system overview
- Agent Instructions files in `/Agent Instructions/` directory

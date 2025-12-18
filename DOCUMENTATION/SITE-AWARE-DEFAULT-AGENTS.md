# Site-Aware Default Agent Selection

## Overview
Implemented data-driven, site-aware default agent selection that eliminates hardcoded agent names and treats all pages (including `/home`) as specialty sites with their own agent configurations.

## Problem Statement
Previously, `AgentService.getDefaultAgent()` used hardcoded agent names ('Solutions', 'RFP Design') and queried global flags without site context. This caused issues like:
- TMC Specialist loading as default on `/home` page (wrong site)
- Agent selection not respecting site boundaries
- Hardcoded logic violating data-driven architecture principles

## Solution Implementation

### 1. Updated `AgentService.getDefaultAgent(siteSlug?: string)`
**File:** `src/services/agentService.ts`

**Changes:**
- Added optional `siteSlug` parameter to function signature
- When `siteSlug` provided, queries `get_specialty_site_agents()` RPC function
- Uses `is_default` for authenticated users, `is_anonymous_default` for anonymous users
- Fallback to global default query only when site-specific lookup fails
- Removed all hardcoded agent name references

**Query Logic:**
```typescript
// Determine which field to check based on authentication
const defaultField = isAuthenticated ? 'is_default' : 'is_anonymous_default';

// Query site-specific agents via RPC function
const { data: siteAgents } = await supabase
  .rpc('get_specialty_site_agents', { site_slug: siteSlug });

// Find agent with appropriate default flag
const defaultSiteAgent = siteAgents.find((row: any) => row[defaultField] === true);
```

### 2. Updated `useAgentManagement` Hook
**File:** `src/hooks/useAgentManagement.ts`

**Changes:**
- Modified fallback call to `AgentService.getDefaultAgent()` to pass site context
- Uses `specialtySlug || 'home'` to ensure all pages are treated as sites
- Maintains site-constrained agent selection throughout initialization

**Implementation:**
```typescript
// Pass specialtySlug or 'home' to get site-specific default
const siteSlug = specialtySlug || 'home';
defaultAgent = await AgentService.getDefaultAgent(siteSlug);
```

## Database Configuration

### Home Site (`/home`)
| Agent | is_default | is_anonymous_default | is_free | is_restricted |
|-------|------------|---------------------|---------|---------------|
| Solutions | ✅ true | ✅ true | ✅ true | ❌ false |
| RFP Design | ❌ false | ❌ false | ❌ false | ✅ true |
| Sourcing | ❌ false | ❌ false | ❌ false | ✅ true |
| Support | ❌ false | ❌ false | ✅ true | ❌ false |

### Corporate TMC RFP Site (`/corporate-tmc-rfp`)
| Agent | is_default | is_anonymous_default | is_free | is_restricted |
|-------|------------|---------------------|---------|---------------|
| TMC Specialist | ✅ true | ❌ false | ❌ false | ✅ true |
| Corporate TMC RFP Welcome | ❌ false | ✅ true | ✅ true | ❌ false |
| TMC Tender | ❌ false | ❌ false | ❌ false | ✅ true |
| Support | ❌ false | ❌ false | ✅ true | ❌ false |

## Expected Behavior

### Anonymous Users
- **On `/home`**: Loads Solutions agent (is_anonymous_default=true)
- **On `/corporate-tmc-rfp`**: Loads Corporate TMC RFP Welcome agent (is_anonymous_default=true)
- Restricted agents appear in selector but are locked/disabled

### Authenticated Users  
- **On `/home`**: Loads Solutions agent (is_default=true)
- **On `/corporate-tmc-rfp`**: Loads TMC Specialist agent (is_default=true)
- All agents accessible based on access level (free/premium)

## Benefits

1. **Data-Driven Architecture**: No hardcoded agent names, all configuration in database
2. **Site Isolation**: Agents properly constrained to their configured sites
3. **Scalability**: Easy to add new specialty sites without code changes
4. **Consistency**: Same logic applies to home and specialty sites
5. **Maintainability**: Single source of truth in `specialty_site_agents` table

## Testing Checklist

- [ ] Anonymous user on `/home` loads Solutions agent
- [ ] Authenticated user on `/home` loads Solutions agent  
- [ ] Anonymous user on `/corporate-tmc-rfp` loads Corporate TMC RFP Welcome
- [ ] Authenticated user on `/corporate-tmc-rfp` loads TMC Specialist
- [ ] Hard refresh on `/home` maintains correct agent
- [ ] Hard refresh on `/corporate-tmc-rfp` maintains correct agent
- [ ] Agent selector shows correct locked/unlocked states
- [ ] No TMC Specialist appearing on `/home` page

## Related Documentation

- **DUAL-DEFAULT-AGENTS.md**: Comprehensive dual default agent system guide
- **BETA-TEST-CONFIG.md**: Beta test mode configuration
- **AGENTS.md**: Complete agent system architecture

## Migration Notes

This change is backward compatible. Existing calls to `getDefaultAgent()` without parameters will use fallback logic. The function signature allows gradual migration of callers to pass site context.

## Future Enhancements

1. Consider making `siteSlug` parameter required after all callers updated
2. Add site-specific agent sorting and prioritization rules
3. Implement agent availability scheduling by site
4. Add analytics for agent selection patterns by site

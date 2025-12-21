# Agent Synchronization Guide

## Problem Statement

When deploying agents between local and remote Supabase environments, parent agent IDs differ because UUIDs are generated independently in each environment. This causes issues with:
- Agent inheritance relationships
- Access control settings (is_restricted, is_free)
- Anonymous user access to agents

## Solution: Name-Based Synchronization

Instead of hardcoding UUIDs, use agent **names** to establish relationships. This ensures migrations work across environments.

## Quick Fix: Deploy Migration to Remote

### Option 1: Via Supabase CLI (Recommended)

```bash
# 1. Apply the migration to remote
supabase db push

# 2. Verify deployment
supabase db remote --linked
```

### Option 2: Via Node.js Sync Script

```bash
# Sync to remote (requires SUPABASE_ACCESS_TOKEN in environment)
node scripts/sync-agents.js --remote

# Or sync to local for testing
node scripts/sync-agents.js --local
```

### Option 3: Manual SQL Execution (Remote Dashboard)

1. Go to https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc/sql/new
2. Paste the following SQL:

```sql
DO $$
DECLARE
    v_solutions_id uuid;
    v_rfp_design_id uuid;
    v_sourcing_id uuid;
    v_site_id uuid;
    v_welcome_id uuid;
BEGIN
    -- Get agent IDs by name (works across environments)
    SELECT id INTO v_solutions_id FROM agents WHERE name = 'Solutions';
    SELECT id INTO v_rfp_design_id FROM agents WHERE name = 'RFP Design';
    SELECT id INTO v_sourcing_id FROM agents WHERE name = 'Sourcing';
    SELECT id INTO v_site_id FROM specialty_sites WHERE slug = 'corporate-tmc-rfp';
    SELECT id INTO v_welcome_id FROM agents WHERE name = 'Corporate TMC RFP Welcome';
    
    -- =====================================================
    -- CORPORATE TMC RFP WELCOME AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = false,  -- Allow anonymous access ✓
        is_free = true,         -- Free tier agent ✓
        is_abstract = false,    -- Concrete agent
        parent_agent_id = v_solutions_id,  -- Parent: Solutions
        updated_at = NOW()
    WHERE name = 'Corporate TMC RFP Welcome';
    
    RAISE NOTICE 'Updated Corporate TMC RFP Welcome: anonymous access enabled';
    
    -- =====================================================
    -- TMC SPECIALIST AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = true,   -- Requires authentication
        is_free = false,        -- Premium agent
        is_abstract = false,
        parent_agent_id = v_rfp_design_id,  -- Parent: RFP Design
        updated_at = NOW()
    WHERE name = 'TMC Specialist';
    
    RAISE NOTICE 'Updated TMC Specialist: authenticated only';
    
    -- =====================================================
    -- TMC TENDER AGENT
    -- =====================================================
    UPDATE agents
    SET 
        is_restricted = true,   -- Requires authentication
        is_free = false,        -- Premium agent
        is_abstract = false,
        parent_agent_id = v_sourcing_id,  -- Parent: Sourcing
        updated_at = NOW()
    WHERE name = 'TMC Tender';
    
    RAISE NOTICE 'Updated TMC Tender: authenticated only';
    
    -- =====================================================
    -- SET ANONYMOUS DEFAULT FOR CORPORATE TMC SITE
    -- =====================================================
    UPDATE specialty_sites
    SET anonymous_default_agent_id = v_welcome_id
    WHERE slug = 'corporate-tmc-rfp';
    
    RAISE NOTICE 'Set Welcome agent as anonymous default for corporate-tmc-rfp';
    
END $$;
```

3. Click "Run" to execute
4. Verify output shows all agents updated

## Verification

### Check Agent Settings

```sql
SELECT 
    a.name,
    a.is_restricted,
    a.is_free,
    a.is_abstract,
    parent.name as parent_name
FROM agents a
LEFT JOIN agents parent ON a.parent_agent_id = parent.id
WHERE a.name IN ('Corporate TMC RFP Welcome', 'TMC Specialist', 'TMC Tender')
ORDER BY a.name;
```

**Expected Results:**
| name | is_restricted | is_free | parent_name |
|------|---------------|---------|-------------|
| Corporate TMC RFP Welcome | false | true | Solutions |
| TMC Specialist | true | false | RFP Design |
| TMC Tender | true | false | Sourcing |

### Check Anonymous Access

```sql
SELECT 
    ss.name as site_name,
    ss.slug,
    anon_agent.name as anonymous_default_agent,
    COUNT(ssa.agent_id) as total_agents
FROM specialty_sites ss
LEFT JOIN agents anon_agent ON ss.anonymous_default_agent_id = anon_agent.id
LEFT JOIN specialty_site_agents ssa ON ss.id = ssa.specialty_site_id
WHERE ss.slug = 'corporate-tmc-rfp'
GROUP BY ss.name, ss.slug, anon_agent.name;
```

**Expected Result:**
- anonymous_default_agent should be "Corporate TMC RFP Welcome"

## Best Practices for Future Migrations

### ✅ DO:
1. **Use agent names** for relationships instead of hardcoded UUIDs
2. **Use CTEs or variables** to look up IDs at runtime
3. **Test locally first** with `supabase migration up`
4. **Verify before deploying** using verification queries
5. **Use the sync script** for consistent deployments

### ❌ DON'T:
1. **Hardcode UUIDs** in migrations - they differ between environments
2. **Assume parent agent IDs** are the same across environments
3. **Skip verification** after deployment
4. **Modify agents manually** - use migrations for consistency

## Migration Template

```sql
-- Use this pattern for future agent migrations
DO $$
DECLARE
    v_parent_id uuid;
BEGIN
    -- Look up parent agent ID by name
    SELECT id INTO v_parent_id FROM agents WHERE name = 'ParentAgentName';
    
    -- Update target agent using name-based lookup
    UPDATE agents
    SET 
        is_restricted = true/false,
        is_free = true/false,
        parent_agent_id = v_parent_id,
        updated_at = NOW()
    WHERE name = 'TargetAgentName';
    
    RAISE NOTICE 'Updated TargetAgentName';
END $$;
```

## Troubleshooting

### Issue: "Corporate TMC RFP Welcome" not visible to anonymous users

**Solution:** Run the sync migration to set `is_restricted = false` and `is_free = true`

### Issue: Parent agent IDs are NULL or incorrect

**Solution:** Re-run the migration to fix parent relationships using agent names

### Issue: Anonymous users can't see the Welcome agent

**Solution:** Check RLS policies and ensure `anonymous_default_agent_id` is set:

```sql
SELECT slug, anonymous_default_agent_id 
FROM specialty_sites 
WHERE slug = 'corporate-tmc-rfp';
```

## Files Created

1. `supabase/migrations/20251221000000_sync_agent_access_settings.sql` - Main migration
2. `scripts/sync-agents.js` - Node.js synchronization script
3. `AGENT-SYNCHRONIZATION-GUIDE.md` - This guide

## Next Steps

1. Deploy migration to remote: `supabase db push`
2. Verify on dev.rfpez.ai that anonymous users can see "Corporate TMC RFP Welcome"
3. Test agent switching for authenticated users
4. Update deployment documentation with this pattern

## References

- Migration: `supabase/migrations/20251221000000_sync_agent_access_settings.sql`
- Sync Script: `scripts/sync-agents.js`
- Agent Markdown Files: `Agent Instructions/*.md`

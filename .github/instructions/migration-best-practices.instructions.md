---
applyTo: '{supabase/migrations/**,scripts/**}'
description: Best practices for creating database migrations that work across environments
---

# Migration Best Practices - Avoiding Hardcoded UUIDs

## Problem

Hardcoded UUIDs in migrations fail when deploying to different environments because:
- Local database has different UUIDs than remote database
- UUIDs are auto-generated and environment-specific
- Foreign key lookups fail when UUIDs don't match

## Solution: Use Dynamic Lookups

### Pattern 1: UPDATE Statements with Parent Agent

**❌ BAD - Hardcoded UUID:**
```sql
UPDATE agents 
SET parent_agent_id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc'  -- Local _common UUID
WHERE name = 'RFP Design';
```

**✅ GOOD - Dynamic Lookup:**
```sql
DO $$
DECLARE
  common_agent_id UUID;
BEGIN
  -- Lookup _common agent by name
  SELECT id INTO common_agent_id FROM agents WHERE name = '_common';
  
  IF common_agent_id IS NULL THEN
    RAISE EXCEPTION '_common agent not found';
  END IF;
  
  -- Use the looked-up ID
  UPDATE agents 
  SET parent_agent_id = common_agent_id
  WHERE name = 'RFP Design';
END $$;
```

### Pattern 2: INSERT Statements with Foreign Keys

**❌ BAD - Hardcoded UUIDs:**
```sql
INSERT INTO agents (name, parent_agent_id, ...)
VALUES ('TMC Specialist', '8c5f11cb-1395-4d67-821b-89dd58f0c8dc', ...);
```

**✅ GOOD - Dynamic Lookup:**
```sql
DO $$
DECLARE
  rfp_design_id UUID;
BEGIN
  -- Lookup parent agent by name
  SELECT id INTO rfp_design_id FROM agents WHERE name = 'RFP Design';
  
  IF rfp_design_id IS NULL THEN
    RAISE EXCEPTION 'RFP Design agent not found';
  END IF;
  
  -- Insert with looked-up ID
  INSERT INTO agents (name, parent_agent_id, ...)
  SELECT 'TMC Specialist', rfp_design_id, ...
  WHERE NOT EXISTS (
    SELECT 1 FROM agents WHERE name = 'TMC Specialist'
  );
END $$;
```

### Pattern 3: Multiple Lookups

**✅ GOOD - Multiple Foreign Keys:**
```sql
DO $$
DECLARE
  tmc_site_id UUID;
  tmc_specialist_id UUID;
  rfp_design_id UUID;
BEGIN
  -- Lookup all needed IDs by unique identifiers
  SELECT id INTO tmc_site_id FROM specialty_sites WHERE slug = 'tmc';
  SELECT id INTO tmc_specialist_id FROM agents WHERE name = 'TMC Specialist';
  SELECT id INTO rfp_design_id FROM agents WHERE name = 'RFP Design';
  
  -- Validate all lookups succeeded
  IF tmc_site_id IS NULL THEN
    RAISE EXCEPTION 'TMC specialty site not found';
  END IF;
  
  IF tmc_specialist_id IS NULL THEN
    RAISE EXCEPTION 'TMC Specialist agent not found';
  END IF;
  
  IF rfp_design_id IS NULL THEN
    RAISE EXCEPTION 'RFP Design agent not found';
  END IF;
  
  -- Use the looked-up IDs
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id, ...)
  VALUES (tmc_site_id, tmc_specialist_id, ...)
  ON CONFLICT DO NOTHING;
END $$;
```

### Pattern 4: Lookup with RETURNING Clause

**✅ GOOD - Insert and Capture ID:**
```sql
DO $$
DECLARE
  new_site_id UUID;
BEGIN
  -- Insert and get the ID in one step
  INSERT INTO specialty_sites (name, slug, ...)
  VALUES ('Respond', 'respond', ...)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO new_site_id;
  
  -- Use the returned ID
  INSERT INTO specialty_site_agents (specialty_site_id, agent_id)
  SELECT new_site_id, id FROM agents WHERE name = 'Respond';
END $$;
```

## Constraint Order Best Practices

### Pattern 5: Drop Before Update

When adding constraints that validate existing data, always:
1. DROP the old constraint first (if it exists)
2. UPDATE/fix the data to meet new requirements
3. ADD the new constraint

**✅ GOOD - Correct Order:**
```sql
-- 1. Drop old constraint so we can fix data
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;

-- 2. Fix existing data to meet new constraint
UPDATE agents 
SET account_id = NULL 
WHERE name IN ('Solutions', 'RFP Design', 'Support', ...)
  AND account_id IS NOT NULL;

-- 3. Add new constraint
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (...);
```

**❌ BAD - Wrong Order (update blocked by existing constraint):**
```sql
-- Update fails because old constraint is still active!
UPDATE agents SET account_id = NULL WHERE name = 'Solutions';

-- Try to drop constraint after update
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_account_id_check;
```

## System Agents vs Custom Agents

### Pattern 6: System Agent Constraints

System agents should have `account_id = NULL`, custom agents can have any value.

**✅ GOOD - Flexible Constraint:**
```sql
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  -- System agents MUST have account_id IS NULL
  (name IN ('Solutions', 'RFP Design', 'Support', ...') AND account_id IS NULL)
  OR
  -- Non-system agents can have ANY account_id value (NULL or NOT NULL)
  (name NOT IN ('Solutions', 'RFP Design', 'Support', ...'))
);
```

**❌ BAD - Too Restrictive:**
```sql
-- This forces ALL non-system agents to have account_id NOT NULL
-- But we need to allow NULL for newly created agents
ALTER TABLE agents ADD CONSTRAINT agents_account_id_check CHECK (
  (name IN (...) AND account_id IS NULL)
  OR
  (name NOT IN (...) AND account_id IS NOT NULL)  -- Too strict!
);
```

## Migration Generation Scripts

### Update md-to-sql-migration.js

When generating migrations from markdown, use lookup patterns:

```javascript
// Instead of:
updateFields.push(`  parent_agent_id = '${metadata.parent_agent_id}'`);

// Generate:
const sql = `
DO $$
DECLARE
  parent_id UUID;
BEGIN
  SELECT id INTO parent_id FROM agents WHERE name = '${parentName}';
  
  UPDATE agents 
  SET parent_agent_id = parent_id
  WHERE id = '${metadata.id}';
END $$;
`;
```

## Checklist for New Migrations

Before committing a migration, verify:

- [ ] No hardcoded UUIDs for foreign keys (use lookups instead)
- [ ] Lookup queries use stable identifiers (name, slug, email, etc.)
- [ ] Error handling for missing lookups (RAISE EXCEPTION)
- [ ] Constraint order: DROP → UPDATE → ADD
- [ ] System agent constraints allow NULL for custom agents
- [ ] NOT EXISTS checks for INSERT statements
- [ ] Test migration locally with `supabase migration up`
- [ ] Test migration on copy of remote data (if possible)

## Documentation for Developers

When creating migrations:

1. **Identify Dependencies**: What other records need to exist first?
2. **Use Stable Identifiers**: name, slug, email (not UUIDs)
3. **Wrap in DO Blocks**: For multi-step operations with variables
4. **Validate Lookups**: Check for NULL and raise exceptions
5. **Test Locally First**: Apply migration to local DB before pushing
6. **Handle Idempotency**: Use IF NOT EXISTS, ON CONFLICT, etc.

## Common Pitfalls

1. **Copying UUIDs from local database** → Use name/slug lookups
2. **Updating before dropping constraints** → Drop first
3. **Too restrictive constraints** → Allow flexibility for edge cases
4. **Missing error handling** → Always check lookup results
5. **Not testing locally** → Run `supabase migration up` before pushing
6. **Sequential migrations with dependencies** → Ensure correct timestamp order

## Examples from This Project

### Fixed Migrations

- `20251116220100_create_tmc_specialist.sql` - Lookup RFP Design by name
- `20251116220200_configure_tmc_specialty_agents.sql` - Lookup site/agents by name/slug
- `20251116222301_update_rfp_design_agent.sql` - Lookup _common by name
- `20251116233436_update_sourcing_agent.sql` - Lookup _common by name
- `20251116234650_add_tmc_tender_to_system_agents.sql` - Correct constraint order
- `20251117003530_update_respond_agent.sql` - Lookup _common by name

All follow the pattern: DO block → lookup → validate → use variable

# Migration Quick Reference - Avoid Hardcoded UUIDs

## Quick Patterns

### 1. Update with Parent Lookup
```sql
DO $$
DECLARE parent_id UUID;
BEGIN
  SELECT id INTO parent_id FROM agents WHERE name = 'ParentName';
  IF parent_id IS NULL THEN RAISE EXCEPTION 'Parent not found'; END IF;
  
  UPDATE agents SET parent_agent_id = parent_id WHERE name = 'ChildName';
END $$;
```

### 2. Insert with Foreign Key Lookup
```sql
DO $$
DECLARE parent_id UUID;
BEGIN
  SELECT id INTO parent_id FROM agents WHERE name = 'ParentName';
  IF parent_id IS NULL THEN RAISE EXCEPTION 'Parent not found'; END IF;
  
  INSERT INTO agents (name, parent_agent_id, ...) 
  SELECT 'ChildName', parent_id, ...
  WHERE NOT EXISTS (SELECT 1 FROM agents WHERE name = 'ChildName');
END $$;
```

### 3. Constraint Order (Critical!)
```sql
-- 1. DROP constraint first
ALTER TABLE agents DROP CONSTRAINT IF EXISTS constraint_name;

-- 2. UPDATE data to meet new requirements
UPDATE agents SET account_id = NULL WHERE name IN (...);

-- 3. ADD constraint
ALTER TABLE agents ADD CONSTRAINT constraint_name CHECK (...);
```

## Lookup Identifiers

Use stable identifiers for lookups:

| Table | Lookup Column | Example |
|-------|--------------|---------|
| `agents` | `name` | `WHERE name = 'RFP Design'` |
| `specialty_sites` | `slug` | `WHERE slug = 'tmc'` |
| `accounts` | `email` | `WHERE email = 'user@example.com'` |
| `users` | `email` | `WHERE email = 'user@example.com'` |

❌ **NEVER USE**: `WHERE id = 'uuid-literal'` for cross-table references

## Before Committing

- [ ] No hardcoded UUIDs for foreign keys
- [ ] Used DO block with DECLARE for lookups
- [ ] Added error checking (IF NULL THEN RAISE)
- [ ] Tested locally: `supabase migration up`
- [ ] Constraint order: DROP → UPDATE → ADD

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| `parent_agent_id = 'uuid'` | `parent_agent_id = parent_id` (from lookup) |
| UPDATE then DROP constraint | DROP constraint then UPDATE |
| No error checking | `IF var IS NULL THEN RAISE EXCEPTION` |
| Direct INSERT with UUID | DO block with lookup then INSERT |

## See Also

- `.github/instructions/migration-best-practices.instructions.md` - Full guide
- `scripts/migration-helpers.js` - Helper functions
- Recent fixed migrations in `supabase/migrations/2025111*`

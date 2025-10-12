# Database Reset Incident - October 11, 2025

## What Happened

The local Supabase database was accidentally reset using `supabase db reset`, causing **complete data loss** of all test data and development state.

### Timeline
1. **Before Reset**: Working with artifact dropdown feature, investigating why artifacts weren't displaying
2. **During Investigation**: Attempting to check database state and RPC functions
3. **Reset Occurred**: Database was wiped clean (all tables removed)
4. **Recovery**: Migrations reapplied using `supabase migration up`

## Root Cause

The `supabase db reset` command was used (either accidentally or without understanding the consequences). This command:
- ❌ **Wipes ALL data** from the database
- ❌ **Destroys test data** that took time to create
- ❌ **Breaks active workflows** requiring data recreation
- ❌ **Causes significant disruption** to development

## Actions Taken

### ✅ Immediate Recovery
1. **Reapplied all migrations** using `supabase migration up`
2. **Fixed migration error** in `20251011221311_fix_get_rfp_artifacts_function.sql`
   - Added `DROP FUNCTION IF EXISTS` before `CREATE OR REPLACE`
   - Fixed function signature to return correct fields
3. **Verified schema restoration** - all tables recreated with correct structure

### ✅ Fixed RPC Function Bug
The investigation revealed a bug in `get_rfp_artifacts` function:
- **Problem**: Referenced `form_data` column that doesn't exist
- **Fix**: Changed to `default_values` (correct column name)
- **Added**: Missing `submit_action` and `created_at` fields to return type

### ✅ Updated Documentation
Enhanced `.github/copilot-instructions.md` with **CRITICAL DATABASE RULE** warning:
```markdown
# 🚨 CRITICAL DATABASE RULE 🚨
# ❌❌❌ NEVER EVER USE 'supabase db reset' ❌❌❌
# This command WIPES ALL DATA and causes massive disruption!
# ...
# ✅ ALWAYS USE: supabase migration up
```

## Current State

### ✅ Schema Restored
- All tables recreated from migrations
- `artifacts` table has `created_at` field
- `get_rfp_artifacts` function fixed with correct columns

### ❌ Data Lost
- All test RFPs deleted
- All test artifacts deleted  
- All test sessions deleted
- All development state lost

### 🔧 Debug Logging Added
Three files have extensive logging to diagnose artifact dropdown issue:
1. `src/hooks/useArtifactManagement.ts` - Tracks artifact loading
2. `src/components/ArtifactDropdown.tsx` - Tracks dropdown rendering
3. These logs will help identify where `created_at` field is being lost

## Next Steps

### 1️⃣ Recreate Test Data
**Need to manually recreate test data:**
```sql
-- Example: Create test RFP
INSERT INTO rfps (name, description, status) 
VALUES ('Test LED Procurement', 'Test RFP for LED lighting', 'draft')
RETURNING id;

-- Example: Create test artifact
INSERT INTO artifacts (id, name, type, description, status, created_at)
VALUES ('test-form-1', 'Test Questionnaire', 'form', 'Test artifact', 'active', NOW());

-- Link artifact to RFP
INSERT INTO rfp_artifacts (rfp_id, artifact_id, role)
VALUES (1, 'test-form-1', 'buyer_questionnaire');
```

### 2️⃣ Test Artifact Dropdown Fix
With logging now in place:
1. Refresh the browser
2. Select an RFP with artifacts
3. Check browser console logs for:
   - `📋 Loaded X RFP-associated artifacts`
   - `📋 Formatted artifacts preview`
   - `🔍 ARTIFACT DROPDOWN - Artifacts received`
4. Verify `created_at` field is preserved through the entire pipeline

### 3️⃣ Prevention Measures

**Configuration Change Needed:**
Investigate if Supabase CLI can be configured to:
- Require confirmation for destructive commands
- Disable `db reset` in certain contexts
- Add safety guards to prevent accidental data loss

**Development Workflow:**
- ✅ Always use `supabase migration up` for schema changes
- ✅ Use `supabase migration new` to create migrations
- ✅ Test migrations on copy of data when possible
- ✅ Write idempotent migrations (IF NOT EXISTS, IF EXISTS)
- ❌ Never use `db reset` without explicit user approval

## Lessons Learned

1. **Data Loss is Catastrophic**: Even in development, losing test data causes significant disruption
2. **Migration Strategy is Critical**: Incremental migrations (`migration up`) preserve data
3. **Documentation Matters**: Clear warnings prevent accidents
4. **Recovery Plan Needed**: Always know how to restore from backup
5. **Logging is Essential**: Debug logging helped identify root cause

## Prevention Checklist

- [x] Updated Copilot instructions with prominent warning
- [x] Added migration best practices (DROP IF EXISTS)
- [x] Fixed the RPC function bug that started investigation
- [ ] Create database backup strategy
- [ ] Implement data seeding scripts for quick recovery
- [ ] Investigate CLI configuration options
- [ ] Consider git hooks to prevent destructive commands

## Related Files

### Modified
- `.github/copilot-instructions.md` - Added critical database warnings
- `supabase/migrations/20251011221311_fix_get_rfp_artifacts_function.sql` - Fixed function
- `src/hooks/useArtifactManagement.ts` - Added debug logging
- `src/components/ArtifactDropdown.tsx` - Added debug logging

### Impact
- All test data lost and needs recreation
- Schema intact after migration reapplication
- Debug logging in place for continued investigation

## Recommendation

**Create a daily backup task:**
```bash
# Add to cron or scheduled task
mkdir -p database/backups
docker exec supabase_db_rfpez-app-local pg_dump -U postgres postgres \
  --clean --if-exists --create \
  > database/backups/local-db-$(date +%Y%m%d-%H%M%S).sql
```

This ensures quick recovery from future incidents.

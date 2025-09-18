# Drop Legacy form_artifacts Table - Execution Guide

## Quick Start

To safely drop the legacy `form_artifacts` table, follow these steps:

### 1. Pre-Migration Validation (REQUIRED)
```sql
-- Run this first to check if it's safe to proceed
\i database/test-form-artifacts-cleanup.sql
```

### 2. Execute the Migration
```sql
-- Only run this if validation tests pass
\i database/drop-legacy-form-artifacts-table.sql
```

### 3. Verify Success
The migration script includes automatic verification, but you can also manually check:
```sql
-- Confirm table is gone
SELECT tablename FROM pg_tables WHERE tablename = 'form_artifacts';
-- Should return no rows

-- Confirm artifacts table still works
SELECT COUNT(*) FROM artifacts WHERE type = 'form';
-- Should return count of form artifacts
```

## What This Does

- ✅ **Safely drops** the legacy `form_artifacts` table
- ✅ **Creates backup** before dropping (form_artifacts_backup_TIMESTAMP)
- ✅ **Cleans up** all constraints, indexes, and policies
- ✅ **Validates** before and after the operation
- ✅ **No data loss** - data already migrated to `artifacts` table

## What Doesn't Change

- ✅ **API functions** - `create_form_artifact`, `update_form_artifact` still work
- ✅ **Frontend** - All form functionality continues normally
- ✅ **Agent operations** - Claude can still create/update forms
- ✅ **User experience** - No visible changes to users

## Rollback (if needed)

If you need to restore the table:
```sql
-- Restore from backup (replace TIMESTAMP with actual backup table name)
CREATE TABLE form_artifacts AS SELECT * FROM form_artifacts_backup_TIMESTAMP;
```

## Expected Output

The migration should show messages like:
```
NOTICE: Validation passed. Safe to proceed with dropping legacy table.
NOTICE: Created backup table: form_artifacts_backup_20250917_143022
NOTICE: ✅ Successfully dropped form_artifacts table and all dependencies
NOTICE: ✅ VERIFICATION PASSED: form_artifacts table successfully removed
NOTICE: 🎉 MIGRATION COMPLETE: Legacy form_artifacts table has been safely dropped
```

## Files Created

1. `database/drop-legacy-form-artifacts-table.sql` - Main migration script
2. `database/test-form-artifacts-cleanup.sql` - Pre-migration validation  
3. `database/legacy-table-cleanup-plan.md` - Detailed documentation
4. `database/drop-form-artifacts-guide.md` - This execution guide

---

**Ready to proceed?** Run the validation test first, then execute the migration if all tests pass!
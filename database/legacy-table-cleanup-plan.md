# Legacy form_artifacts Table Cleanup

## Overview
This document tracks the removal of the legacy `form_artifacts` table after schema consolidation to the unified `artifacts` table.

## Background
The `form_artifacts` table was created as a separate table for storing form-specific artifacts, but was later consolidated into the main `artifacts` table to:
- Eliminate data duplication
- Simplify the schema
- Reduce maintenance overhead
- Provide a single source of truth for all artifacts

## Migration Status

### ✅ Completed Tasks
1. **Schema Consolidation**: Data migrated from `form_artifacts` to `artifacts` table
2. **Migration Script Created**: `database/drop-legacy-form-artifacts-table.sql`
3. **Code Comments Updated**: References updated in `useArtifactManagement.ts`

### 🔄 Safe to Drop Table
The following references remain but are **intentional and should NOT be changed**:

#### API Function Names (Keep as-is)
- `create_form_artifact` - Claude API function name
- `update_form_artifact` - Claude API function name  
- `get_form_artifact` - Claude API function name

These are external API function names that agents use and should remain unchanged.

#### Code References (Keep as-is)
- `src/services/claudeAPIFunctions.ts` - All references are function names or descriptions
- `src/utils/functionStatusVerifier.ts` - Function name validation
- `src/hooks/useMessageHandling.ts` - Function name checking
- `src/services/claudeService.ts` - Function name in instructions

## Database Changes

### Tables Being Dropped
- `form_artifacts` - Legacy table (data migrated to `artifacts`)

### Tables Remaining  
- `artifacts` - Consolidated table containing all artifact types including forms
- `artifact_submissions` - Form submission data (unchanged)
- `rfp_artifacts` - Links RFPs to artifacts (unchanged)

## Code Impact Analysis

### No Breaking Changes Expected
The removal of the `form_artifacts` table should not break any functionality because:

1. **Data Migration Complete**: All data moved to `artifacts` table
2. **API Functions Unchanged**: `create_form_artifact` and `update_form_artifact` work with `artifacts` table
3. **Frontend Updated**: Already uses consolidated schema
4. **Backward Compatibility**: Database service handles both old/new patterns

### Files That Use Current Schema
- `src/services/database.ts` - Uses `artifacts` table
- `src/services/claudeAPIFunctions.ts` - Functions target `artifacts` table  
- `src/hooks/useArtifactManagement.ts` - Updated to current schema

## Migration Execution Plan

### Pre-Migration Checklist
- [ ] Verify schema consolidation migration is complete
- [ ] Backup production database
- [ ] Test migration script on staging environment
- [ ] Verify all form functionality works with `artifacts` table

### Execution Steps
1. Run validation queries to confirm data migration
2. Execute `database/drop-legacy-form-artifacts-table.sql`
3. Verify table is dropped and applications still function
4. Remove backup table after verification period

### Post-Migration Verification
- [ ] All form creation/update functions work
- [ ] Form data displays correctly in UI
- [ ] No database errors in application logs
- [ ] Agent form operations function normally

## Rollback Plan
If issues are discovered after dropping the table:

1. **Data Recovery**: Restore from `form_artifacts_backup_*` table created by migration
2. **Schema Revert**: Recreate table using `database/migration-add-form-artifacts-table.sql`
3. **Application**: No code changes needed due to backward compatibility

## Safety Measures
The migration script includes:
- ✅ Data validation before dropping
- ✅ Automatic backup table creation
- ✅ Constraint and index cleanup
- ✅ Cascade handling for dependencies
- ✅ Verification after completion

## Success Criteria
- [ ] `form_artifacts` table no longer exists
- [ ] All form functionality works normally  
- [ ] No application errors or warnings
- [ ] Database size reduced (table cleanup)
- [ ] Schema documentation updated
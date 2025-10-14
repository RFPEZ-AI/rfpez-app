# Agent MD to SQL Migration Tool - Troubleshooting Guide

## Issue: Duplicate Key Error on Migration

### Error Message
```
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey" (SQLSTATE 23505)
Key (version)=(20251014) already exists.
```

### Root Cause
The original tool was generating migration filenames with an underscore in the timestamp:
- **Incorrect Format**: `20251014_HHMMSS` → Supabase reads version as `20251014`
- **Correct Format**: `20251014HHMMSS` → Supabase reads version as `20251014HHMMSS`

When multiple migrations are created on the same day with underscores, they all get the same version key (just the date), causing duplicates.

### Solution Applied ✅

**Fixed the timestamp generation in `scripts/md-to-sql-migration.js`:**

```javascript
// OLD (incorrect):
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
// Generates: 20251014_020920 (version = 20251014)

// NEW (correct):
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
// Generates: 20251014020920 (version = 20251014020920)
```

### Migration Filename Format

**Supabase Standard Format:**
- Pattern: `YYYYMMDDHHmmss_description.sql`
- Example: `20251014020920_update_rfp_design_agent.sql`
- Version Key: Full 14-digit timestamp (no separators)

**Examples from existing migrations:**
- `20251001212124_remote_schema.sql` ✅
- `20251002012257_update_functions_schema.sql` ✅
- `20251003000000_allow_null_current_session.sql` ✅

## Recovery Steps (When Error Occurs)

### Step 1: Remove Problematic Migration Files
```bash
# Delete migrations with incorrect timestamp format
rm supabase/migrations/20251014_*.sql
```

### Step 2: Repair Migration History (if needed)
```bash
# If remote has orphaned entries
supabase migration repair --status reverted 20251014
```

### Step 3: Regenerate Migrations with Fixed Tool
```bash
# Tool now generates correct format
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
```

### Step 4: Apply Migration

**Method 1: Via Supabase CLI (recommended)**
```bash
supabase migration up
```

**Method 2: Direct Database Application (if CLI has issues)**
```bash
cat supabase/migrations/20251014020920_update_rfp_design_agent.sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres
```

### Step 5: Verify Success
```bash
# Check migration was applied
supabase migration list

# Verify agent updated in database
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, LENGTH(instructions), updated_at FROM agents WHERE name = 'RFP Design';"
```

## Testing Results (After Fix)

### Generated Migration ✅
```
File: 20251014020920_update_rfp_design_agent.sql
Size: 38,697 bytes
Format: Correct (14-digit timestamp, no separators)
```

### Applied Successfully ✅
```sql
UPDATE 1

-- Verification query output:
id                  | name       | role   | inst_len | updated_at
--------------------|------------|--------|----------|---------------------------
8c5f11cb-1395-...   | RFP Design | design | 36874    | 2025-10-14 02:09:55.59941
```

### Migration Status ✅
```
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20251014020920 |                | 2025-10-14 02:09:20
```

## Prevention

### Always Use the Fixed Tool
The tool has been updated to generate the correct timestamp format. Future migrations will not have this issue.

### Check Format Before Applying
```bash
# Verify migration filename matches pattern
ls supabase/migrations/20251014*.sql

# Should see: 20251014020920_description.sql (14 digits, no underscore in timestamp)
# NOT: 20251014_020920_description.sql (underscore in timestamp)
```

## Related Issues

### Remote Migration Sync Issues
If you see:
```
Remote migration versions not found in local migrations directory.
```

**Solution:**
```bash
# Repair the specific migration version
supabase migration repair --status reverted <version>

# Or pull remote schema
supabase db pull
```

### Multiple Migrations on Same Day
The fixed tool now supports multiple migrations per day because each gets a unique 14-digit timestamp:
- `20251014020920` - First migration (02:09:20)
- `20251014030145` - Second migration (03:01:45)
- `20251014151530` - Third migration (15:15:30)

Each has a unique version key, preventing duplicates.

## Summary

✅ **Issue Identified**: Incorrect timestamp format with underscore separator  
✅ **Root Cause Found**: Supabase treats everything before first underscore as version  
✅ **Fix Applied**: Updated tool to generate 14-digit timestamp without separators  
✅ **Tested**: RFP Design Agent migration applied successfully  
✅ **Verified**: Agent updated in database with correct content  

**Status**: Tool is now production-ready with correct Supabase migration format.

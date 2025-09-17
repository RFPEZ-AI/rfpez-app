# Artifact Submissions Table Migration

## Overview
This migration creates the `artifact_submissions` table that was missing from the database schema but referenced in the codebase.

## Problem
The code in `claudeAPIFunctions.ts` was trying to query an `artifact_submissions` table that didn't exist, causing console errors (though gracefully handled).

## Solution
Created the missing table with proper schema:

### Table: `public.artifact_submissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `artifact_id` | TEXT NOT NULL | References form_artifacts.id |
| `session_id` | TEXT | Optional session tracking |
| `user_id` | UUID | References auth.users.id |
| `submission_data` | JSONB | The actual form data submitted |
| `status` | TEXT | 'submitted', 'processed', or 'error' |
| `created_at` | TIMESTAMP WITH TIME ZONE | Auto-set creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Auto-updated modification time |

### Features
- **RLS Policies**: Users can only access their own submissions
- **Indexes**: Optimized for common query patterns
- **Auto-timestamps**: Automatic created_at and updated_at handling
- **Foreign Key Constraints**: Proper referential integrity
- **Status Tracking**: Ability to track submission processing status

## Application Impact
After applying this migration:
1. Console errors about missing table will be eliminated
2. Form submission tracking will be fully functional
3. Submission count analytics will work properly
4. Form submission history will be preserved

## How to Apply
Run this SQL in your Supabase SQL editor or via migration system:
```sql
-- Apply the migration
\i migration-add-artifact-submissions-table.sql
```

## Verification
After migration, verify the table exists:
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artifact_submissions' 
ORDER BY ordinal_position;
```

## Related Files
- `src/services/claudeAPIFunctions.ts` - Contains the code that uses this table
- `database/migration-add-form-artifacts-table.sql` - Parent table migration
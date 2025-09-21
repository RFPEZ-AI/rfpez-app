# Database Cleanup Scripts for RFPEZ.AI

This directory contains SQL scripts to clean test data from the development database while preserving essential configuration data.

## Scripts Available

### 1. `cleanup-test-data.sql` (DELETE version)
- Uses `DELETE` statements to remove data
- More conservative approach
- Manually resets sequences
- Safer for complex foreign key relationships

### 2. `cleanup-test-data-truncate.sql` (TRUNCATE version)
- Uses `TRUNCATE` statements with `RESTART IDENTITY CASCADE`
- Faster for large datasets
- Automatically resets auto-increment sequences
- More aggressive cleanup

## What Gets Cleaned

Both scripts remove ALL data from these tables:
- `sessions` - Chat sessions
- `messages` - All chat messages
- `artifacts` - File artifacts
- `form_artifacts` - Generated forms
- `artifact_submissions` - Form submissions
- `session_artifacts` - Session-artifact links
- `session_agents` - Session-agent links
- `rfps` - All RFP data
- `bids` - All bid responses
- `supplier_profiles` - Supplier information
- `rfp_artifacts` - RFP-artifact links
- Migration tables (`artifacts_new`, `artifact_submissions_new`)

## What Gets Preserved

Both scripts preserve these critical tables:
- `agents` - Agent definitions and configurations
- `user_profiles` - User account information

## Safety Features

### Built-in Safety Checks
- **Environment Detection**: Prevents running on databases with "prod" or "production" in the name
- **Transaction Wrapper**: All operations in a single transaction (can be rolled back)
- **Existence Checks**: Only operates on tables that actually exist
- **Pre/Post Counts**: Shows record counts before and after cleanup

### Manual Safety Steps
1. **Backup First**: Always backup your database before running cleanup
2. **Test Environment Only**: Only run on development/test environments
3. **Review Logs**: Check the NOTICE messages for verification

## Usage Instructions

### Option 1: Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste one of the cleanup scripts
4. Review the script carefully
5. Click "Run" to execute

### Option 2: psql Command Line
```bash
# Connect to your database
psql "postgresql://postgres:[password]@[host]:[port]/[database]"

# Run the cleanup script
\i /path/to/cleanup-test-data.sql

# Or run the truncate version
\i /path/to/cleanup-test-data-truncate.sql
```

### Option 3: From Application Directory
```bash
# Navigate to the database directory
cd database/

# Run with psql (adjust connection string as needed)
psql "$DATABASE_URL" -f cleanup-test-data.sql
```

## When to Use Each Script

### Use `cleanup-test-data.sql` (DELETE version) when:
- You have complex foreign key relationships
- You want maximum safety and control
- You're unsure about table dependencies
- You're running on a production-like environment (with backups)

### Use `cleanup-test-data-truncate.sql` (TRUNCATE version) when:
- You have large amounts of test data
- You want the fastest cleanup
- You want sequences reset to start at 1
- You're confident about the table structure

## Expected Output

Both scripts provide detailed logging:

```
NOTICE:  Starting RFPEZ.AI database cleanup...
NOTICE:  Preserving: agents, user_profiles
NOTICE:  ========================================
NOTICE:  Safety check passed: Database = rfpez_dev
NOTICE:  Pre-cleanup record counts:
NOTICE:  - sessions: 45
NOTICE:  - messages: 128
NOTICE:  - artifacts: 23
...
NOTICE:  Cleaned: sessions
NOTICE:  Cleaned: messages
NOTICE:  Cleaned: artifacts
...
NOTICE:  Post-cleanup verification:
NOTICE:  - sessions: 0
NOTICE:  - messages: 0
NOTICE:  - artifacts: 0
...
NOTICE:  Preserved table counts:
NOTICE:  - agents: 12
NOTICE:  - user_profiles: 3
NOTICE:  Database cleanup completed successfully!
```

## Recovery

If you need to restore data after cleanup:

1. **From Backup**: Restore from your database backup
2. **Re-seed Agents**: Run the agent seeding scripts if needed
3. **Reset User Context**: Users may need to log out and back in
4. **Clear Application Cache**: Restart your application to clear any cached data

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure your database user has DELETE/TRUNCATE permissions
   - Check if RLS policies are blocking the operation

2. **Foreign Key Constraint Errors**
   - Use the DELETE version instead of TRUNCATE
   - Check for tables not included in the cleanup

3. **Table Not Found Errors**
   - Scripts include existence checks, but ensure your schema is up to date
   - Check if table names have changed in recent migrations

### Verification Queries

After cleanup, verify the results:

```sql
-- Check all tables are empty (except preserved ones)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND tablename NOT IN ('agents', 'user_profiles')
ORDER BY tablename;

-- Verify agents and user_profiles are preserved
SELECT 'agents' as table_name, count(*) as rows FROM agents
UNION ALL
SELECT 'user_profiles' as table_name, count(*) as rows FROM user_profiles;
```

## Integration with Testing

These scripts are designed to work with the RFPEZ.AI test automation suite:

- Run cleanup before test suites for clean state
- Use in CI/CD pipelines for consistent test environments
- Integrate with VS Code tasks for development workflow

## Contributing

When adding new tables to the application:

1. Update both cleanup scripts to include the new table
2. Consider foreign key dependencies and cleanup order
3. Add the table to the verification section
4. Update this README with new table information
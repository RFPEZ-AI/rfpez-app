# Working Locally Without Remote Connection

## Issue: Remote Connection Failures

When running `supabase migration list` or other commands that try to connect to remote Supabase:

```
failed to connect to postgres: hostname resolving error 
(lookup aws-1-us-east-2.pooler.supabase.com: operation was canceled)
```

This is a **network connectivity issue** - your local machine cannot reach the remote Supabase instance.

## Solution: Work Locally Only

Since we're in **local-first development mode**, you don't need remote connectivity for testing and development.

### ✅ Commands That Work Locally (No Remote Needed)

#### 1. Generate Migrations
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"
```

#### 2. Apply Migrations Locally
```bash
cat supabase/migrations/YYYYMMDDHHMMSS_migration.sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres
```

#### 3. Check Local Database
```bash
# Query agents
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, LENGTH(instructions), updated_at FROM agents ORDER BY name;"

# Check migration history
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

#### 4. Test in Application
```bash
# No remote needed for local dev server
npm start
# Navigate to http://localhost:3100
```

### ❌ Commands That Require Remote (Skip These)

- `supabase migration list` - Tries to connect to remote
- `supabase migration up` - Checks both local and remote
- `supabase db push` - Deploys to remote
- `supabase migration repair` - Modifies remote

## Current Local Status ✅

### Agents Successfully Updated
```
    name    |  role  | inst_len | prompt_len |          updated_at
------------+--------+----------+------------+-------------------------------
 RFP Design | design |    36874 |        729 | 2025-10-14 02:09:55.599412+00
 Solutions  | sales  |    25710 |        649 | 2025-10-14 02:19:36.914408+00
```

### Local Migrations Applied
```
    version     |                    name
----------------+--------------------------------------------
 20251014020920 | 20251014020920_update_rfp_design_agent.sql
 20251014021930 | 20251014021930_update_solutions_agent.sql
```

## Workflow for Local-Only Development

### Complete Local Testing Workflow
```bash
# 1. Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# 2. Apply directly
MIGRATION=$(ls -t supabase/migrations/*.sql | head -1)
cat "$MIGRATION" | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# 3. Track in history
VERSION=$(basename "$MIGRATION" | cut -d'_' -f1)
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "INSERT INTO supabase_migrations.schema_migrations (version, name, statements) \
   VALUES ('$VERSION', '$(basename $MIGRATION)', ARRAY['UPDATE agents']) \
   ON CONFLICT (version) DO NOTHING;"

# 4. Verify locally
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, LENGTH(instructions), updated_at FROM agents WHERE updated_at > NOW() - INTERVAL '5 minutes';"

# 5. Test in browser
npm start
```

### When to Connect to Remote

**Only when you're ready to deploy to production:**

1. Ensure network connectivity is restored
2. Test thoroughly in local environment first
3. Use `supabase db push` to deploy

**For now:** Continue working locally without remote connection. All agent updates are working perfectly in your local environment.

## Verification Commands (Local Only)

### Check All Agents
```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, is_active, LENGTH(instructions) as inst_len, updated_at FROM agents ORDER BY sort_order;"
```

### Check Recent Updates
```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, updated_at FROM agents WHERE updated_at > NOW() - INTERVAL '1 hour' ORDER BY updated_at DESC;"
```

### Check Migration History
```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT version, name, to_char(inserted_at, 'YYYY-MM-DD HH24:MI:SS') as applied_at \
   FROM supabase_migrations.schema_migrations \
   ORDER BY version DESC LIMIT 10;"
```

### Check Supabase Local Services
```bash
# Check if local Supabase stack is running
supabase status

# If not running, start it
supabase start
```

## Summary

✅ **You don't need remote connectivity for local development**  
✅ **Both agents (RFP Design and Solutions) are updated locally**  
✅ **Ready to test in browser at http://localhost:3100**  
✅ **Deploy to remote later when connectivity is restored**

**Next Step:** Test the updated agents in your local application!

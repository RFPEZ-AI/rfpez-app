# Correct Workflow for Agent MD to SQL Tool

## ✅ Recommended Local-First Workflow

When working with agent instruction updates in **local development only**, use this simplified workflow:

### Step 1: Generate Migration
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
```

### Step 2: Apply Directly to Local Database
```bash
# Apply the SQL directly (bypasses migration tracking complexity)
cat supabase/migrations/20251014020920_update_rfp_design_agent.sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres
```

### Step 3: Mark Migration as Applied (for tracking)
```bash
# Register in migration history
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "INSERT INTO supabase_migrations.schema_migrations (version, name, statements) \
   VALUES ('20251014020920', '20251014020920_update_rfp_design_agent.sql', ARRAY['UPDATE agents']);"
```

### Step 4: Verify Success
```bash
# Check agent was updated
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, LENGTH(instructions), updated_at FROM agents WHERE name = 'RFP Design';"
```

### Step 5: Test in Application
```bash
# Start dev server (if not already running)
npm start

# Test agent behavior in browser
# Navigate to http://localhost:3100
```

## Why Not `supabase migration up`?

The `supabase migration up` command is designed for production-like workflows where local and remote must be in sync. It fails when:
- Local has migrations not on remote
- Remote has migrations not in local files
- There's any mismatch in migration history

**For local-only development and testing**, direct SQL application is simpler and more reliable.

## When to Use `supabase migration up`

Use `supabase migration up` when:
- ✅ Local and remote are already in sync
- ✅ You're applying migrations that exist in both environments
- ✅ You're following a strict deployment pipeline

## Deployment to Remote (After Local Testing)

Once you've tested locally and want to deploy to remote:

### Option 1: Direct Push (Recommended)
```bash
# Push all local migrations to remote
supabase db push
```

### Option 2: Manual Application
```bash
# Connect to remote and apply SQL
# (Use Supabase dashboard SQL editor or remote psql connection)
```

## Common Issues and Solutions

### Issue: "Remote migration versions not found in local migrations directory"
**Cause**: Migration history mismatch between local and remote

**Solution 1: Repair Remote History**
```bash
# Remove problematic remote entries
supabase migration repair --status reverted 20251014020920
```

**Solution 2: Skip `supabase migration up`**
```bash
# Use direct SQL application instead (see Step 2 above)
```

### Issue: "Duplicate key value violates unique constraint"
**Cause**: Trying to insert migration version that already exists

**Solution**: Check if migration is already applied
```bash
# Query migration history
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

### Issue: Migration File Created with Wrong Timestamp Format
**Status**: ✅ FIXED - Tool now generates correct format (YYYYMMDDHHmmss)

## Summary

**For Local Development:**
1. Generate migration with tool
2. Apply with direct `psql` command
3. Register in migration history
4. Test in browser

**For Production Deployment:**
1. Test locally first (steps above)
2. Push to remote with `supabase db push`
3. Verify in production environment

This workflow avoids the complexity of `supabase migration up` while still maintaining proper migration tracking.

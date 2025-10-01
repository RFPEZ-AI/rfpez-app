# Local Development to Production Migration Workflow

## Overview
This workflow allows you to:
1. Make database changes locally
2. Test them thoroughly
3. Generate migration files
4. Push changes to production

## Key Commands

### 1. Making Local Database Changes
```bash
# Connect to local database directly
supabase db reset  # Reset to clean state
# OR make changes via Supabase Studio: http://127.0.0.1:54323

# Generate migration from your changes
supabase db diff --file new_feature_name
```

### 2. Testing Changes Locally
```bash
# Run your application against local database
npm start  # Your React app will use local database

# Test Edge Functions locally
supabase functions serve --env-file supabase/functions/.env

# View logs in real-time
supabase logs --level debug
```

### 3. Generating Migrations
```bash
# Generate migration file from local changes
supabase db diff --file descriptive_migration_name

# Apply migration to local database to test
supabase migration up

# Reset and test full migration sequence
supabase db reset
```

### 4. Pushing to Production
```bash
# Push database changes to remote
supabase db push

# Deploy Edge Functions to remote
supabase functions deploy claude-api-v3
supabase functions deploy mcp-server

# Verify changes worked
supabase migration list --remote
```

### 5. Environment Configuration

#### Local Development (.env)
```
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

#### Production (.env.production)
```
REACT_APP_SUPABASE_URL=https://jxlutaztoukwbbgtoulc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Workflow Examples

### Example: Adding a new table
1. `supabase db reset` - Start clean
2. Open Studio: http://127.0.0.1:54323
3. Create your new table with columns, RLS policies, etc.
4. `supabase db diff --file add_new_table` - Generate migration
5. Test your React app works with new table
6. `supabase db push` - Push to production
7. Deploy updated functions if needed

### Example: Modifying Edge Function
1. Edit function in `supabase/functions/claude-api-v3/`
2. `supabase functions serve claude-api-v3` - Test locally
3. Check logs: `supabase logs --level debug`
4. `supabase functions deploy claude-api-v3` - Deploy to production

## Useful Local URLs
- Supabase Studio: http://127.0.0.1:54323
- API Endpoint: http://127.0.0.1:54321
- Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Mailpit (Email testing): http://127.0.0.1:54324

## Key Environment Variables for Local Development
```bash
# Local Supabase Keys (from supabase start output)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```
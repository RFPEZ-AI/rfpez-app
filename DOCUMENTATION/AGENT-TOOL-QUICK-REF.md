# 🚀 Quick Reference: Agent MD to SQL Tool

## Generate Migration
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
```

## Apply to Local Database (Recommended Workflow)

### One-Liner (Complete Workflow)
```bash
# Generate → Apply → Track → Verify
AGENT_FILE="Agent Instructions/RFP Design Agent.md" && \
  node scripts/md-to-sql-migration.js "$AGENT_FILE" && \
  MIGRATION=$(ls -t supabase/migrations/*.sql | head -1) && \
  VERSION=$(basename "$MIGRATION" | cut -d'_' -f1) && \
  cat "$MIGRATION" | docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres && \
  docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
    "INSERT INTO supabase_migrations.schema_migrations (version, name, statements) \
     VALUES ('$VERSION', '$(basename $MIGRATION)', ARRAY['UPDATE agents']) \
     ON CONFLICT (version) DO NOTHING;" && \
  docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
    "SELECT name, role, LENGTH(instructions) as inst_len, updated_at \
     FROM agents WHERE updated_at > NOW() - INTERVAL '1 minute';"
```

### Step-by-Step
```bash
# 1. Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# 2. Apply to local database
cat supabase/migrations/20251014020920_update_rfp_design_agent.sql | \
  docker exec -i supabase_db_rfpez-app-local psql -U postgres -d postgres

# 3. Track in migration history
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "INSERT INTO supabase_migrations.schema_migrations (version, name, statements) \
   VALUES ('20251014020920', '20251014020920_update_rfp_design_agent.sql', ARRAY['UPDATE agents']);"

# 4. Verify
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, LENGTH(instructions), updated_at FROM agents WHERE name = 'RFP Design';"
```

## Deploy to Remote (After Testing)
```bash
# Push all local migrations to remote
supabase db push
```

## List Available Agents
```bash
node scripts/md-to-sql-migration.js
```

## Verify Agent Update
```bash
# Check specific agent
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, role, LENGTH(instructions), updated_at FROM agents WHERE name = 'RFP Design';"

# Check all agents
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT name, LENGTH(instructions) as inst_len, updated_at FROM agents ORDER BY updated_at DESC;"
```

## Check Migration Status
```bash
supabase migration list
```

## Troubleshooting

### Remove Failed Migration
```bash
rm supabase/migrations/20251014*.sql
```

### Repair Remote Migration History
```bash
supabase migration repair --status reverted 20251014020920
```

### Check Migration History
```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

## Available Agent Files
- `Agent Instructions/Audit Agent.md`
- `Agent Instructions/Billing Agent.md`
- `Agent Instructions/Negotiation Agent.md`
- `Agent Instructions/Publishing Agent.md`
- `Agent Instructions/RFP Design Agent.md`
- `Agent Instructions/Signing Agent.md`
- `Agent Instructions/Solutions Agent.md`
- `Agent Instructions/Sourcing Agent.md`
- `Agent Instructions/Support Agent.md`

## Documentation
- `AGENT-TOOL-WORKFLOW.md` - Recommended workflow (read this first!)
- `scripts/README-md-to-sql-migration.md` - Complete documentation
- `AGENT-TOOL-TROUBLESHOOTING.md` - Problem resolution guide
- `AGENT-TOOL-FINAL-STATUS.md` - Implementation status

## Notes
- ⚠️ Don't use `supabase migration up` for local-only development
- ✅ Use direct SQL application for faster local testing
- ✅ Use `supabase db push` for production deployment
- ✅ Always test locally before deploying to remote

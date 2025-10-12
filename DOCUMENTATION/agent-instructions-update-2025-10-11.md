# Agent Instructions Update - October 11, 2025

## Overview
Successfully updated all agent instructions in the local database to match the current Agent Instructions/*.md files.

## What Was Done

### 1. Generated Migration Script
Created `scripts/generate-agent-migration.js` - a Node.js script that:
- Reads all Agent Instructions/*.md files
- Extracts agent metadata (name, description, initial prompt, avatar)
- Generates SQL migration with dollar-quoted strings
- Handles all 9 agents with proper UUIDs

### 2. Created Migration
Generated `supabase/migrations/20251011231137_update_agent_instructions_from_md_files.sql`:
- Updates existing agents (Solutions, RFP Design, Support)
- Inserts new agents (Sourcing, Negotiation, Audit, Publishing, Signing, Billing)
- Preserves agent IDs and metadata
- Uses UPSERT pattern (UPDATE then INSERT IF NOT EXISTS)

### 3. Applied Migration
Ran `supabase migration up` to update local database with current instructions.

## Results

### All 9 Agents Now in Database

| Agent | Role | Characters | Free | Default | Sort Order |
|-------|------|------------|------|---------|------------|
| Solutions | sales | 25,120 | ✅ | ✅ | 0 |
| RFP Design | design | 33,791 | ✅ | ❌ | 1 |
| Support | support | 3,171 | ✅ | ❌ | 2 |
| Sourcing | sourcing | 4,715 | ❌ | ❌ | 3 |
| Negotiation | negotiation | 5,410 | ❌ | ❌ | 4 |
| Audit | audit | 6,123 | ❌ | ❌ | 5 |
| Publishing | publishing | 6,080 | ❌ | ❌ | 6 |
| Signing | signing | 5,465 | ❌ | ❌ | 7 |
| Billing | billing | 4,599 | ❌ | ❌ | 8 |

**Total: 94,474 characters of agent instructions**

### Character Count Comparison

**Before Update:**
- Solutions: 4,815 characters (was 79% outdated)
- RFP Design: 12,420 characters (was 63% outdated)
- Support: 200 characters (was 94% outdated)
- **Total: 17,435 characters**

**After Update:**
- Solutions: 25,120 characters ✅
- RFP Design: 33,791 characters ✅
- Support: 3,171 characters ✅
- Plus 6 new agents: 32,392 characters ✅
- **Total: 94,474 characters**

**Improvement: 441% more instruction content!**

### New Agents Added

#### Premium Agents (Require Billing)
1. **Sourcing** - Supplier discovery and vendor management
2. **Negotiation** - Contract negotiation and terms optimization
3. **Audit** - Compliance checking and audit trail management
4. **Publishing** - RFP publication and distribution
5. **Signing** - Contract execution and digital signatures
6. **Billing** - Invoice processing and payment management

All 6 new agents are marked as `is_free = false`, requiring billing/subscription.

## File Updates

### New Files Created
- `scripts/generate-agent-migration.js` - Reusable migration generator
- `supabase/migrations/20251011231137_update_agent_instructions_from_md_files.sql` - Complete agent update
- `DOCUMENTATION/agent-instructions-update-2025-10-11.md` - This file

### Modified Files
None (migration applied to database only)

## Usage

### To Regenerate Migration (if .md files change)
```bash
node scripts/generate-agent-migration.js
```

### To Apply Migration
```bash
supabase migration up
```

### To Deploy to Remote
```bash
supabase db push
```

## Verification Queries

### Check All Agents
```sql
SELECT 
  name, 
  role, 
  LENGTH(instructions) as instruction_length,
  is_active, 
  is_default, 
  is_free,
  sort_order
FROM agents 
ORDER BY sort_order, name;
```

### Preview Agent Instructions
```sql
SELECT 
  name, 
  LEFT(instructions, 100) as preview,
  LENGTH(instructions) as total_length
FROM agents 
WHERE name = 'Solutions';
```

### Check Agent Metadata
```sql
SELECT 
  name,
  description,
  avatar_url,
  initial_prompt
FROM agents
ORDER BY sort_order;
```

## Notes

### Line Ending Differences
- Files have ~70-160 more characters than database
- This is due to Windows CRLF (\r\n) vs database storage
- Content is identical, just normalized line endings

### Agent UUIDs
Fixed UUIDs assigned to each agent for consistency:
- Solutions: `4fe117af-da1d-410c-bcf4-929012d8a673`
- RFP Design: `8c5f11cb-1395-4d67-821b-89dd58f0c8dc`
- Support: `f47ac10b-58cc-4372-a567-0e02b2c3d479`
- Others: Generated UUIDs in migration script

## Future Maintenance

### When Agent Instructions Change
1. Update the .md file in `Agent Instructions/` directory
2. Run `node scripts/generate-agent-migration.js`
3. Apply with `supabase migration up`
4. Deploy with `supabase db push`

### To Add New Agents
1. Create new .md file in `Agent Instructions/` directory
2. Add metadata entry to `scripts/generate-agent-migration.js`
3. Generate and apply migration

## Related Documentation
- [Agent System Documentation](AGENTS.md)
- [Database Reset Incident](database-reset-incident-2025-10-11.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)

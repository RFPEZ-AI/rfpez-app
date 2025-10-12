# Agent Migration Generator

## Overview
Automatically generates SQL migrations from Agent Instructions/*.md files to keep database agent instructions synchronized with documentation.

## Quick Start

```bash
# Generate migration from current .md files
node scripts/generate-agent-migration.js

# Apply the generated migration
supabase migration up

# Deploy to remote (when ready)
supabase db push
```

## What It Does

1. **Reads** all `Agent Instructions/*.md` files
2. **Extracts** metadata (name, description, initial prompt, avatar URL)
3. **Generates** SQL migration with complete instructions
4. **Creates** UPSERT statements (UPDATE existing, INSERT new)
5. **Preserves** agent UUIDs and configuration

## Files Generated

- `supabase/migrations/[timestamp]_update_agent_instructions_from_md_files.sql`

## Agent Metadata Configuration

Edit `scripts/generate-agent-migration.js` to configure agent properties:

```javascript
const agentMetadata = {
  'Solutions Agent.md': {
    id: '4fe117af-da1d-410c-bcf4-929012d8a673',  // Fixed UUID
    role: 'sales',                               // Agent role
    sort_order: 0,                               // Display order
    is_default: true,                            // Default agent on login
    is_free: true,                               // Free or premium
    is_restricted: false                         // Access restrictions
  },
  // ... more agents
};
```

## Workflow

### When Agent Instructions Change

1. **Edit** the `.md` file in `Agent Instructions/` directory
2. **Generate** new migration:
   ```bash
   node scripts/generate-agent-migration.js
   ```
3. **Apply** to local database:
   ```bash
   supabase migration up
   ```
4. **Test** the agent in the application
5. **Deploy** to remote when ready:
   ```bash
   supabase db push
   ```

### Adding New Agents

1. **Create** new `.md` file in `Agent Instructions/` directory
2. **Add** metadata entry to `scripts/generate-agent-migration.js`
3. **Generate** UUID for the new agent
4. **Run** generator script
5. **Apply** migration

## Generated Migration Structure

```sql
-- Update [Agent Name] agent
UPDATE agents 
SET 
  instructions = $agent_[role]$[full content]$agent_[role]$,
  description = '[description]',
  initial_prompt = $prompt_[role]$[initial prompt]$prompt_[role]$,
  avatar_url = '[avatar url]',
  sort_order = [order],
  is_default = [true/false],
  is_free = [true/false],
  is_restricted = [true/false],
  role = '[role]',
  updated_at = NOW()
WHERE id = '[uuid]';

-- Insert [Agent Name] if it doesn't exist
INSERT INTO agents (id, name, description, instructions, initial_prompt, ...)
SELECT '[uuid]', '[name]', '[description]', $agent_[role]$[content]$agent_[role]$, ...
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE id = '[uuid]');
```

## Dollar Quoting

The script uses PostgreSQL dollar quoting to avoid escaping issues:
- `$agent_[role]$...$agent_[role]$` for instructions
- `$prompt_[role]$...$prompt_[role]$` for initial prompts

This allows any content (including quotes, apostrophes, etc.) without escaping.

## Markdown File Format

Each agent instruction file should include:

```markdown
## Name: [Agent Name]
**Database ID**: `[uuid]`
**Role**: `[role]`
**Avatar URL**: `[url]`

## Description:
[One-line description]

## Initial Prompt:
[Initial greeting/prompt text]

## Instructions:
[Full agent instructions...]
```

## Current Agents

| Agent | Role | Free | Default | File |
|-------|------|------|---------|------|
| Solutions | sales | ✅ | ✅ | Solutions Agent.md |
| RFP Design | design | ✅ | ❌ | RFP Design Agent.md |
| Support | support | ✅ | ❌ | Support Agent.md |
| Sourcing | sourcing | ❌ | ❌ | Sourcing Agent.md |
| Negotiation | negotiation | ❌ | ❌ | Negotiation Agent.md |
| Audit | audit | ❌ | ❌ | Audit Agent.md |
| Publishing | publishing | ❌ | ❌ | Publishing Agent.md |
| Signing | signing | ❌ | ❌ | Signing Agent.md |
| Billing | billing | ❌ | ❌ | Billing Agent.md |

## Verification

After applying migration, verify with:

```sql
-- Check all agents
SELECT name, role, LENGTH(instructions) as chars, 
       is_free, is_default, sort_order
FROM agents 
ORDER BY sort_order;

-- Preview instructions
SELECT name, LEFT(instructions, 100) as preview
FROM agents
WHERE name = 'Solutions';
```

## Troubleshooting

### Migration Already Exists
Delete or rename the existing migration file before regenerating:
```bash
rm supabase/migrations/[timestamp]_update_agent_instructions_from_md_files.sql
supabase migration new update_agent_instructions_from_md_files
node scripts/generate-agent-migration.js
```

### Metadata Missing Warning
If you see `⚠️  No metadata found for [filename]`, add the agent to the `agentMetadata` object in the script.

### Character Count Mismatch
Small differences (~70-160 chars) are normal due to line ending normalization (Windows CRLF vs Unix LF). Content is identical.

## Related Scripts

- `scripts/seed-test-data.sql` - Test data seeding (doesn't include agents)
- `scripts/seed-local-data.sh` - Wrapper for test data seeding

## Documentation

- [Agent Instructions Update Log](../DOCUMENTATION/agent-instructions-update-2025-10-11.md)
- [Agent System Documentation](../DOCUMENTATION/AGENTS.md)

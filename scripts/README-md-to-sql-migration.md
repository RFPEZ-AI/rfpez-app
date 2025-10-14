# Agent Markdown to SQL Migration Tool

## Overview
This CLI tool converts agent instruction markdown files into SQL migration files that can be applied to the Supabase database.

## Features
- ✅ Parses agent markdown files with metadata extraction
- ✅ Generates properly formatted SQL migrations with dollar-quoted strings
- ✅ Handles complex markdown content with code blocks and special characters
- ✅ Creates timestamped migration files following Supabase conventions
- ✅ Includes verification query to confirm updates

## Usage

### Basic Command
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"
```

### List Available Agents
```bash
node scripts/md-to-sql-migration.js
```
This will show all available agent markdown files if no file is specified.

### Apply Migration
```bash
# Generate the migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Apply to local database
supabase migration up

# Verify the update
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT id, name, role, LENGTH(instructions) as instructions_length, updated_at FROM agents WHERE name = 'RFP Design';"
```

## Markdown File Format
The tool expects agent markdown files with the following structure:

```markdown
## Name: Agent Name
**Database ID**: `uuid-here`
**Role**: `role-name`
**Avatar URL**: `/assets/avatars/agent.svg`

## Description:
Short description of the agent's purpose.

## Initial Prompt:
The greeting message shown when the agent is activated.

## Instructions:
Detailed instructions for the agent's behavior...
```

### Required Fields
- **Database ID**: UUID of the agent in the database
- **Name**: Agent display name

### Optional Fields
- **Role**: Agent role identifier
- **Avatar URL**: Path to agent avatar image
- **Description**: Short description (extracted from Description section)
- **Initial Prompt**: Agent greeting (extracted from Initial Prompt section)

## Generated Migration Structure
The tool generates SQL migrations with:

1. **Header Comment**: Timestamp and source file reference
2. **UPDATE Statement**: Updates the agent record with all extracted fields
3. **Verification Query**: SELECT to confirm the update was successful

Example output:
```sql
-- Update RFP Design Agent Instructions
-- Generated on 2025-10-14T01:18:40.221Z
-- Source: Agent Instructions/RFP Design.md

UPDATE agents 
SET 
  instructions = $agent_content$...full markdown content...$agent_content$,
  initial_prompt = $agent_content1$...prompt text...$agent_content1$,
  description = $agent_content2$...description...$agent_content2$,
  role = 'design',
  avatar_url = '/assets/avatars/rfp-designer.svg',
  updated_at = NOW()
WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';

-- Verify update
SELECT id, name, role, LENGTH(instructions), updated_at
FROM agents WHERE id = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';
```

## Testing Workflow

### 1. Local Testing
```bash
# Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# Review the generated SQL file
cat supabase/migrations/20251014_011840_update_rfp_design_agent.sql

# Apply locally
supabase migration up

# Test agent behavior in the app
npm start
```

### 2. Remote Deployment
```bash
# After local testing is successful
supabase db push

# Or apply specific migration
supabase db remote commit
```

## Troubleshooting

### Migration Already Applied
If you see "Local database is up to date", the migration was already applied. To regenerate:
1. Delete the generated migration file
2. Run the tool again (it will create a new timestamp)

### Missing Database ID
Error: `Could not find Database ID in markdown file`

Solution: Ensure the markdown file has this format:
```markdown
**Database ID**: `uuid-here`
```

### Missing Agent Name
Error: `Could not find agent name in markdown file`

Solution: Ensure the markdown file has this format:
```markdown
## Name: Agent Name
```

### Dollar-Quote Delimiter Conflicts
The tool automatically finds a delimiter that doesn't conflict with the content. If you see strange delimiters like `$agent_content42$`, it's because the content contained earlier delimiter options.

## Integration with Deployment Workflow

This tool is part of the complete deployment workflow:

```bash
# 1. Update agent instructions in markdown files
vim "Agent Instructions/RFP Design Agent.md"

# 2. Generate migration
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent.md"

# 3. Test locally
supabase migration up
npm start  # Test in browser

# 4. Deploy to remote
supabase db push

# 5. Verify in production
# Check agent behavior in remote environment
```

## Examples

### Update Single Agent
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/Solutions Agent.md"
```

### Batch Update All Agents
```bash
for agent in "Agent Instructions"/*.md; do
  echo "Processing: $agent"
  node scripts/md-to-sql-migration.js "$agent"
done

# Apply all migrations
supabase migration up
```

### Update and Deploy Pipeline
```bash
# Complete update pipeline
AGENT="Agent Instructions/RFP Design Agent.md"

# Step 1: Generate
node scripts/md-to-sql-migration.js "$AGENT" && \

# Step 2: Apply locally
supabase migration up && \

# Step 3: Test (manual)
echo "Test agent in browser, then press Enter to continue..." && read && \

# Step 4: Deploy
supabase db push
```

## Output Example
```
🔧 Agent Markdown to SQL Migration Generator
==================================================

📖 Reading: Agent Instructions/RFP Design Agent.md

✅ Parsed agent metadata:
   Name: RFP Design
   ID: 8c5f11cb-1395-4d67-821b-89dd58f0c8dc
   Role: design
   Description length: 223 chars
   Initial prompt length: 729 chars
   Instructions length: 36907 chars

🔨 Generating SQL migration...

✅ Migration created: 20251014_011840_update_rfp_design_agent.sql
   Path: C:\Dev\RFPEZ.AI\rfpez-app\supabase\migrations\20251014_011840_update_rfp_design_agent.sql
   Size: 37.64 KB

📝 Next steps:
   1. Review the generated SQL file
   2. Apply to local database: supabase migration up
   3. Test the agent behavior locally
   4. Deploy to remote: supabase db push

✨ Done!
```

## Technical Notes

### Dollar-Quoted Strings
The tool uses PostgreSQL dollar-quoted strings (`$delimiter$content$delimiter$`) to handle:
- Single quotes in content
- Double quotes in content
- Backticks in markdown code blocks
- Special characters without escaping

### Migration Naming Convention
Format: `YYYYMMDDHHmmss_update_agent_name_agent.sql` (14-digit timestamp, no separators)
- Example: `20251014020920_update_rfp_design_agent.sql`
- 14-digit timestamp ensures unique version keys (prevents duplicate key errors)
- Agent name slug for easy identification
- Follows Supabase migration conventions (no underscore in timestamp portion)

### Character Encoding
All files are read and written as UTF-8 to support:
- Emoji in instructions
- International characters
- Special markdown formatting

## Related Documentation
- [Deployment Guide](../DOCUMENTATION/DEPLOYMENT-GUIDE.md)
- [Agent System](../DOCUMENTATION/AGENTS.md)
- [Available Tools](../DOCUMENTATION/AVAILABLE-TOOLS.md)

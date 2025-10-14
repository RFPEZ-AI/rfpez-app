# Agent Instructions Update Guide

## Status Summary

### ✅ Completed
- **Support Agent**: Successfully updated via MCP SQL tool
  - New length: 3,105 characters
  - Updated at: 2025-10-12 23:03:49 UTC

### ⏳ Pending Manual Execution
- **Solutions Agent**: Ready (SQL prepared)
  - Target length: ~25,783 characters
- **RFP Design Agent**: Ready (SQL prepared)
  - Target length: ~36,462 characters

## Quick Update Instructions

### Step 1: Open Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/jxlutaztoukwbbgtoulc
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Copy SQL Content
In your terminal, run:
```bash
cat update-remaining-agents.sql
```

Or open the file directly in VS Code:
```bash
code update-remaining-agents.sql
```

### Step 3: Execute in Dashboard
1. **Copy the entire contents** of `update-remaining-agents.sql`
2. **Paste into the SQL Editor**
3. Click the **"Run"** button (or press Ctrl+Enter)

### Step 4: Verify Results
You should see three result sets:

**Result 1 - Solutions Agent:**
```
name: "Solutions"
new_length: 25783 (approximately)
updated_at: [current timestamp]
```

**Result 2 - RFP Design Agent:**
```
name: "RFP Design"
new_length: 36462 (approximately)
updated_at: [current timestamp]
```

**Result 3 - Verification Query:**
```
name                | instruction_length | updated_at           | status
--------------------|--------------------|----------------------|---------------
RFP Design          | 36462             | [current timestamp]  | ✅ Just Updated
Solutions           | 25783             | [current timestamp]  | ✅ Just Updated
Support             | 3105              | 2025-10-12 23:03:49  | ✅ Just Updated
```

## Files Created

- **`update-remaining-agents.sql`** - Complete SQL to update Solutions and RFP Design agents (99KB, 2,133 lines)
- **`temp-update-solutions.sql`** - Individual Solutions agent update (can be deleted after main update)
- **`update-agent-instructions.sql`** - Original combined update for all three agents (can be deleted)

## Troubleshooting

### If you see an error about dollar quotes:
- Make sure you copied the **entire file contents** including the `$solutions$` and `$rfp_design$` delimiters
- These are PostgreSQL dollar-quoted strings and are required

### If the query times out:
- The file is large (99KB). If it times out, run the individual updates separately:
  1. Run just the Solutions agent section (lines 1-534)
  2. Run just the RFP Design agent section (lines 536-2108)
  3. Run the verification query

### If instruction_length doesn't match expected:
- Check that no content was truncated during copy/paste
- Verify the markdown files haven't been modified since SQL generation

## Expected Results

| Agent       | Before (bytes) | After (bytes) | Change    |
|-------------|----------------|---------------|-----------|
| Solutions   | 4,815          | 25,783        | +20,968   |
| RFP Design  | 18,746         | 36,462        | +17,716   |
| Support     | 3,123          | 3,105         | -18       |

**Total instruction content**: ~65,350 characters across all three agents

## Post-Update Verification

After successful execution, you can verify in the app:
1. Log in to RFPEZ.AI
2. Switch to each agent (Solutions, RFP Design, Support)
3. Check that agent behavior matches the latest instructions
4. Test agent switching and tool usage

## Cleanup (Optional)

After successful update, you can delete temporary files:
```bash
rm temp-update-solutions.sql
rm update-agent-instructions.sql
rm update-agents-remote.js
rm update-agents-simple.js
```

Keep `update-remaining-agents.sql` for reference or future re-runs if needed.

---

**Note**: The Support agent was updated successfully via MCP SQL tool and doesn't need manual execution. Only Solutions and RFP Design agents require the dashboard update.

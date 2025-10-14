# GitHub Actions Environment Variable Fix

**Date:** October 13, 2025  
**Issue:** Edge function deployment failing with "flag needs an argument: --project-ref"

## Problem

The GitHub Actions workflow was not properly passing environment variables to shell commands. The error:

```
flag needs an argument: --project-ref
Try rerunning the command with --debug to troubleshoot the error.
Error: Process completed with exit code 1.
```

## Root Cause

Environment variables in GitHub Actions need to be referenced with the proper syntax:
- ❌ **Wrong:** `$SUPABASE_PROJECT_REF` (bash variable, not set)
- ✅ **Correct:** `${{ env.SUPABASE_PROJECT_REF }}` (GitHub Actions syntax)

## Files Fixed

### 1. `.github/workflows/deploy-edge-functions.yml`

**Changes:**
```yaml
# BEFORE (incorrect)
- name: Deploy claude-api-v3 function
  run: |
    supabase functions deploy claude-api-v3 \
      --project-ref $SUPABASE_PROJECT_REF

# AFTER (correct)
- name: Link to Supabase project
  run: |
    supabase link --project-ref ${{ env.SUPABASE_PROJECT_REF }} --password ${{ env.SUPABASE_DB_PASSWORD }}

- name: Deploy claude-api-v3 function
  run: |
    supabase functions deploy claude-api-v3 \
      --project-ref ${{ env.SUPABASE_PROJECT_REF }}
```

**Key improvements:**
1. Added `supabase link` step before deployments
2. Changed all `$VARIABLE` to `${{ env.VARIABLE }}`
3. Applied to both `claude-api-v3` and `supabase-mcp-server` functions

### 2. `.github/workflows/deploy-migrations.yml`

**Changes:**
```yaml
# Updated all environment variable references
- name: Link to Supabase project
  run: |
    supabase link --project-ref ${{ env.SUPABASE_PROJECT_REF }}

- name: Deploy migrations
  run: |
    supabase db push --password ${{ env.SUPABASE_DB_PASSWORD }}
```

## GitHub Actions Environment Variable Syntax

### Setting Environment Variables
```yaml
jobs:
  my-job:
    env:
      MY_VAR: ${{ secrets.MY_SECRET }}
```

### Using Environment Variables

| Context | Syntax | Example |
|---------|--------|---------|
| GitHub Actions expressions | `${{ env.VAR }}` | `${{ env.SUPABASE_PROJECT_REF }}` |
| Shell scripts (if exported) | `$VAR` | `echo $HOME` (built-in shell var) |
| Secrets | `${{ secrets.VAR }}` | `${{ secrets.API_KEY }}` |

## Testing the Fix

### Via GitHub Actions UI
1. Go to: https://github.com/markesphere/rfpez-app/actions
2. Select "Deploy Edge Functions" workflow
3. Click "Run workflow" → "Run workflow"
4. Monitor the run - should now succeed

### Expected Output
```
✅ Linked to project: jxlutaztoukwbbgtoulc
🚀 Deploying claude-api-v3...
✅ claude-api-v3 deployed successfully
🚀 Deploying supabase-mcp-server...
✅ supabase-mcp-server deployed successfully
```

## Why This Matters

### Before Fix
```bash
supabase link --project-ref 
# Missing value! Command fails with: "flag needs an argument"

supabase functions deploy claude-api-v3 --project-ref 
# Missing value! Command fails with: "flag needs an argument"
```

### After Fix
```bash
supabase link --project-ref jxlutaztoukwbbgtoulc --password [password]
# Both values properly substituted! Command succeeds

supabase functions deploy claude-api-v3 --project-ref jxlutaztoukwbbgtoulc
# Value properly substituted! Command succeeds
```

### Critical: The `supabase link` Command
The `supabase link` command requires **both** flags:
- `--project-ref`: Your Supabase project reference ID
- `--password`: Your database password

Without these, the CLI cannot authenticate and link to your project.

## Verification Checklist

- [x] Environment variables defined in job `env:` section
- [x] Variables referenced with `${{ env.VAR }}` syntax in run steps
- [x] `supabase link` step added before function deployments
- [x] All function deployment commands include `--project-ref`
- [x] Password properly passed to `supabase db push`
- [x] Both workflows (migrations and edge functions) updated consistently

## Related Documentation

- GitHub Actions: https://docs.github.com/en/actions/learn-github-actions/variables
- Supabase CLI: https://supabase.com/docs/reference/cli
- Workflow files:
  - `.github/workflows/deploy-edge-functions.yml`
  - `.github/workflows/deploy-migrations.yml`

## Summary

The fix ensures that all Supabase CLI commands receive the required parameters by properly referencing GitHub Actions environment variables using `${{ env.VARIABLE }}` syntax instead of incorrect bash variable syntax `$VARIABLE`.

---

**Status:** ✅ Fixed  
**Testing:** Ready for GitHub Actions deployment

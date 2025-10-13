# GitHub Actions Setup for Edge Functions

## Overview
This workflow automatically deploys Supabase Edge Functions when code is pushed to the `master` branch.

## Prerequisites
You need to set up the following GitHub repository secrets:

### Required Secrets

1. **SUPABASE_PROJECT_REF**
   - Your Supabase project reference ID
   - Find it in: Supabase Dashboard → Settings → General → Reference ID
   - Example: `jxlutaztoukwbbgtoulc`

2. **SUPABASE_ACCESS_TOKEN**
   - Personal access token for Supabase CLI authentication
   - Generate at: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Give it a descriptive name like "GitHub Actions Deploy"
   - Copy the token (you won't see it again!)
   - **This is REQUIRED** - The CLI needs this to authenticate deployments

### Edge Function Environment Variables

The edge functions are automatically configured by Supabase with these environment variables when deployed:
- `SUPABASE_URL` - Automatically set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set by Supabase
- `SUPABASE_ANON_KEY` - Automatically set by Supabase
- `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` - **You must configure this manually**

#### Setting Edge Function Environment Variables

For the Claude API key (required for claude-api-v3 function):
1. Go to: Supabase Dashboard → Edge Functions → Configuration
2. Add secret: `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY`
3. Value: Your Claude API key from https://console.anthropic.com/

**Note:** Supabase automatically provides `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` to all edge functions. You only need to add the Claude API key manually.

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:
   - **Name**: `SUPABASE_PROJECT_REF`
   - **Value**: `jxlutaztoukwbbgtoulc` (or your project ref)
   
   - **Name**: `SUPABASE_ACCESS_TOKEN`
   - **Value**: (paste your generated token from Supabase dashboard)

**⚠️ CRITICAL**: Without these secrets, the deployment will fail with:
```
Access token not provided. Supply an access token by running supabase login 
or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

The workflow sets `SUPABASE_ACCESS_TOKEN` as an environment variable, which the Supabase CLI automatically uses for authentication.

## Workflow Details

### Trigger Conditions
- **Automatic**: Pushes to `master` branch that modify files in `supabase/functions/`
- **Manual**: Can be triggered manually from GitHub Actions tab

### Deployed Functions
1. `claude-api-v3` - Primary Claude API endpoint (V3)
2. `supabase-mcp-server` - MCP protocol server

### Workflow Steps
1. Checkout code from repository
2. Setup Deno runtime (required for edge functions)
3. Setup Supabase CLI
4. Deploy each function to remote Supabase
5. Display deployment summary

## Usage

### Automatic Deployment
Simply push changes to edge function files:
```bash
git add supabase/functions/claude-api-v3/index.ts
git commit -m "feat: update Claude API endpoint"
git push origin master
```

The workflow will automatically trigger and deploy.

### Manual Deployment
1. Go to GitHub repository → Actions tab
2. Click "Deploy Edge Functions" workflow
3. Click "Run workflow" button
4. Select branch (usually `master`)
5. Click "Run workflow"

## Monitoring Deployments

### Check Status
- Go to: GitHub repository → Actions tab
- Click on the running/completed workflow
- View logs for each step

### Verify Deployment
After successful deployment, verify functions are updated:
```bash
supabase functions list --project-ref jxlutaztoukwbbgtoulc
```

Check version numbers and timestamps to confirm deployment.

## Troubleshooting

### Common Issues

**1. Authentication Failed**
- Check that `SUPABASE_ACCESS_TOKEN` is set correctly
- Regenerate token if expired: https://supabase.com/dashboard/account/tokens

**2. Project Not Found**
- Verify `SUPABASE_PROJECT_REF` matches your project
- Check at: Supabase Dashboard → Settings → General

**3. Deployment Failed**
- Check function code for syntax errors
- Run local tests first: `deno test --allow-all supabase/functions/claude-api-v3/tests/`
- Verify environment variables are set in Supabase Dashboard

**4. Workflow Not Triggering**
- Ensure changes are in `supabase/functions/` directory
- Check that workflow file is on `master` branch
- Verify workflow is enabled in Actions tab

## Security Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Rotate tokens regularly** - Generate new access tokens periodically
3. **Limit token scope** - Only grant necessary permissions
4. **Monitor deployments** - Review deployment logs regularly

## Additional Configuration

### Deploy on Different Branches
Edit `.github/workflows/deploy-edge-functions.yml`:
```yaml
on:
  push:
    branches:
      - master
      - staging  # Add staging branch
      - develop  # Add develop branch
```

### Deploy Additional Functions
Add more deployment steps:
```yaml
- name: Deploy new-function
  run: |
    supabase functions deploy new-function \
      --project-ref ${{ secrets.SUPABASE_PROJECT_REF }} \
      --token ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Environment-Specific Deployments
Use different secrets for staging vs production:
```yaml
- name: Deploy to staging
  if: github.ref == 'refs/heads/staging'
  run: |
    supabase functions deploy claude-api-v3 \
      --project-ref ${{ secrets.STAGING_PROJECT_REF }} \
      --token ${{ secrets.STAGING_ACCESS_TOKEN }}
```

## Testing Before Deployment

Always test edge functions locally before deploying:

```bash
# Run unit tests
deno test --allow-all supabase/functions/claude-api-v3/tests/

# Serve locally for manual testing
supabase functions serve claude-api-v3 --debug

# Test with curl
curl -X POST http://127.0.0.1:54321/functions/v1/claude-api-v3 \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

## References
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

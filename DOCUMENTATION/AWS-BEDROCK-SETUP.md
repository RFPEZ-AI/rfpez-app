# AWS Bedrock Claude 4.5 Setup Guide for RFPEZ.AI

This guide will help you configure RFPEZ.AI to use AWS Bedrock with Claude 4.5 instead of the direct Anthropic API.

## Prerequisites

1. **AWS Account** with Bedrock access
2. **IAM User** with appropriate Bedrock permissions
3. **Access to Claude models** enabled in your AWS region

## Step 1: Get AWS Credentials

### 1.1 Create IAM User (if needed)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/home#/users)
2. Click "Add users"
3. Enter username (e.g., `rfpez-bedrock-user`)
4. Select "Programmatic access"
5. Click "Next: Permissions"

### 1.2 Attach Bedrock Policy

Create a custom policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
            ]
        }
    ]
}
```

Or attach the managed policy: `AmazonBedrockFullAccess` (less secure, use for development only)

### 1.3 Get Access Keys

1. After creating the user, download the CSV with credentials
2. Save your:
   - **Access Key ID**: `AKIAIOSFODNN7EXAMPLE`
   - **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

## Step 2: Enable Claude Models in Bedrock

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Find and enable:
   - **Claude 3.5 Sonnet v2** (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
   - **Claude 3.5 Sonnet v1** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)
   - **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`)
5. Click "Save changes" and wait for access to be granted (usually 1-2 minutes)

## Step 3: Configure Environment Variables

### 3.1 Update `.env.local` (Main Application)

Open `c:\Dev\RFPEZ.AI\rfpez-app\.env.local` and update:

```bash
# Option 2: AWS Bedrock Claude API
# Set USE_AWS_BEDROCK=true to use AWS Bedrock instead of direct Anthropic API
USE_AWS_BEDROCK=true
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Important:** Replace the example credentials with your actual AWS credentials!

### 3.2 Update `supabase/functions/.env` (Edge Functions)

Open `c:\Dev\RFPEZ.AI\rfpez-app\supabase\functions\.env` and update:

```bash
# AWS Bedrock Configuration (for Claude via AWS)
USE_AWS_BEDROCK=true
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Step 4: Available Bedrock Claude Models

Choose from these models for `AWS_BEDROCK_MODEL`:

| Model ID | Description | Context Window |
|----------|-------------|----------------|
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | **Claude 3.5 Sonnet v2** (Recommended) | 200K tokens |
| `anthropic.claude-3-5-sonnet-20240620-v1:0` | Claude 3.5 Sonnet v1 | 200K tokens |
| `anthropic.claude-3-opus-20240229-v1:0` | Claude 3 Opus (Most capable, higher cost) | 200K tokens |

## Step 5: Test the Configuration

### 5.1 Restart Local Services

```bash
# Stop Supabase
supabase stop

# Clean restart
bash ./scripts/startup-workspace.sh

# Or use VS Code Task: "Clean Restart Supabase"
```

### 5.2 Check Logs for Confirmation

When starting the edge functions, you should see:

```
✅ Using AWS Bedrock for Claude API: {
  region: 'us-east-1',
  model: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
}
```

### 5.3 Test in Application

1. Open the app: http://localhost:3100
2. Create a new session
3. Send a message
4. Check the console logs for Bedrock API calls

Expected log output:
```
🚀 Creating AWS Bedrock Claude service
Sending to AWS Bedrock Claude API: { ... }
Making signed request to Bedrock...
Bedrock API response: { ... }
```

## Step 6: Switch Back to Anthropic (If Needed)

To switch back to direct Anthropic API:

1. Set `USE_AWS_BEDROCK=false` in both `.env.local` and `supabase/functions/.env`
2. Restart services

```bash
supabase stop
bash ./scripts/startup-workspace.sh
```

## Troubleshooting

### Error: "Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY"

**Solution:** Ensure credentials are set in both:
- `.env.local`
- `supabase/functions/.env`

### Error: "Access denied to model"

**Solution:** 
1. Check that you've enabled the model in Bedrock Console
2. Verify your IAM policy includes `bedrock:InvokeModel` permission
3. Wait 1-2 minutes after enabling model access

### Error: "The security token included in the request is invalid"

**Solution:** Your AWS credentials are incorrect. Double-check:
- Access Key ID
- Secret Access Key
- They match the user with Bedrock permissions

### Error: "Model not found"

**Solution:** 
- Verify the model ID is correct
- Ensure the model is available in your AWS region
- Try a different region (us-east-1 usually has all models)

### Checking Logs

```bash
# Edge Runtime Logs (includes Bedrock API calls)
docker logs -f supabase_edge_runtime_rfpez-app-local

# Or use VS Code Task: "Edge Runtime Logs"
```

## Cost Considerations

AWS Bedrock pricing (as of 2025):

- **Claude 3.5 Sonnet v2**: ~$3.00 per million input tokens, ~$15.00 per million output tokens
- **Claude 3 Opus**: ~$15.00 per million input tokens, ~$75.00 per million output tokens

Compare to direct Anthropic API for your use case.

## Benefits of AWS Bedrock

1. **Unified Billing**: Consolidated with other AWS services
2. **Enterprise Features**: VPC endpoints, AWS PrivateLink support
3. **Compliance**: Additional AWS compliance certifications
4. **Regional Control**: Keep data in specific AWS regions
5. **IAM Integration**: Use existing AWS IAM policies

## Next Steps

1. Monitor usage in [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
2. Set up CloudWatch alarms for cost monitoring
3. Consider using AWS Budget alerts
4. Test different models for your specific use case

## Support

For issues with:
- **AWS Bedrock setup**: Check AWS Support or Documentation
- **RFPEZ.AI integration**: Check project documentation or contact development team
- **Claude API behavior**: Same across Anthropic and Bedrock

---

**✅ You're now running RFPEZ.AI with AWS Bedrock Claude 4.5!**

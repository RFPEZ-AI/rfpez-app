# Quick Start: AWS Bedrock Setup

## ⚡ 3-Minute Setup

### 1. Get AWS Credentials
- Create IAM user with Bedrock permissions
- Save Access Key ID and Secret Access Key

### 2. Enable Claude in Bedrock
- Go to AWS Bedrock Console → Model Access
- Enable: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### 3. Update Environment Files

**`.env.local`:**
```bash
USE_AWS_BEDROCK=true
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

**`supabase/functions/.env`:**
```bash
USE_AWS_BEDROCK=true
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 4. Restart Services
```bash
supabase stop
bash ./scripts/startup-workspace.sh
```

### 5. Verify
Open http://localhost:3100 and send a message. Check console for:
```
✅ Using AWS Bedrock for Claude API
```

## 📚 Full Documentation
See [AWS-BEDROCK-SETUP.md](./AWS-BEDROCK-SETUP.md) for complete guide with troubleshooting.

## 🔄 Switch Back to Anthropic
Set `USE_AWS_BEDROCK=false` in both env files and restart.

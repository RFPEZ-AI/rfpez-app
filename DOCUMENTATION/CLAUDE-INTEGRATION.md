# Claude API Integration for RFPEZ.AI

## Overview

The RFPEZ.AI application now integrates with Claude API (Anthropic) to provide intelligent AI responses through the multi-agent system. Each agent uses Claude to generate contextual, role-specific responses based on their configured instructions.

## Features

### ✅ Implemented
- **Claude API Integration**: Direct integration with Anthropic's Claude API
- **Agent-Specific Responses**: Each agent uses its configured instructions as system prompts
- **Conversation Context**: Claude receives conversation history for context-aware responses
- **Error Handling**: Graceful fallback when Claude API is unavailable
- **Metadata Storage**: AI response metadata (tokens, response time, model) saved to database
- **Environment Configuration**: Secure API key management through environment variables

### 🔧 Technical Details
- **Model**: Claude 3 Haiku (fast, cost-effective)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Context Window**: Last 10 messages for conversation context
- **Max Tokens**: 1000 per response
- **Fallback**: Error messages when API unavailable

## Setup Instructions

### 1. Get Claude API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up/login to your account
3. Create an API key
4. Copy the API key for configuration

### 2. Local Development Setup
Add to your `.env` file:
```env
REACT_APP_CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Production Deployment
Add the environment variable to your deployment platform:

#### Azure Static Web Apps
```bash
az staticwebapp appsettings set \
  --name your-app-name \
  --setting-names REACT_APP_CLAUDE_API_KEY=your_claude_api_key_here
```

#### GitHub Secrets
Add `REACT_APP_CLAUDE_API_KEY` to your repository secrets.

## Agent Configuration

Each agent in the database uses these fields for Claude integration:

- **`instructions`**: Used as system prompt for Claude
- **`initial_prompt`**: Shown to users when starting conversation
- **`name`**: Agent identity for Claude context

Example agent instructions:
```sql
UPDATE agents SET instructions = 'You are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs.' WHERE name = 'Solutions';
```

## Code Architecture

### ClaudeService (`src/services/claudeService.ts`)
- **`generateResponse()`**: Main method for getting Claude responses
- **`formatConversationHistory()`**: Prepares message history for Claude
- **`testConnection()`**: Validates API connectivity

### Integration Points
- **Home.tsx**: Main integration in `handleSendMessage()`
- **Database**: AI metadata stored in `messages.ai_metadata`
- **Error Handling**: User-friendly fallback messages

## Usage Examples

### Basic Agent Response
```typescript
const response = await ClaudeService.generateResponse(
  userMessage,
  agent,
  conversationHistory
);
```

### Agent Instructions Example
```javascript
{
  "name": "Technical Support",
  "instructions": "You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions. Be concise and provide step-by-step solutions.",
  "initial_prompt": "Hello! I'm here to help with any technical questions."
}
```

## CORS Considerations

⚠️ **Important**: Claude API calls from browsers may face CORS restrictions in production. Consider:

1. **Current Setup**: Uses `dangerouslyAllowBrowser: true` for development
2. **Production Options**:
   - Proxy through your backend API
   - Use serverless functions (Vercel Functions, Netlify Functions)
   - Implement API Gateway proxy

## Error Handling

The integration includes comprehensive error handling:

- **API Key Issues**: Clear error messages about configuration
- **Rate Limiting**: Informative messages about usage limits  
- **Network Errors**: Graceful fallback to error messages
- **CORS Errors**: Specific guidance about browser limitations

## Cost Considerations

- **Model**: Claude 3 Haiku chosen for cost efficiency
- **Token Limits**: 1000 max tokens per response
- **Context**: Limited to 10 previous messages
- **Monitoring**: Response metadata tracked for usage analysis

## Testing

### Test API Connection
```typescript
const isConnected = await ClaudeService.testConnection();
console.log('Claude API Status:', isConnected ? 'Connected' : 'Failed');
```

### Verify Environment
Check browser console for environment variable status:
```
Environment variables: {
  REACT_APP_CLAUDE_API_KEY: 'SET'
}
```

## Troubleshooting

### Common Issues

1. **"Claude API key not configured"**
   - Ensure `REACT_APP_CLAUDE_API_KEY` is set in environment
   - Verify the key is not the placeholder value

2. **CORS Errors**
   - Expected in production - implement backend proxy
   - Works in development with `dangerouslyAllowBrowser`

3. **Rate Limiting**
   - Check your Anthropic account usage limits
   - Consider implementing request queuing

4. **Empty Responses**
   - Check console for API errors
   - Verify agent instructions are properly formatted

## Future Enhancements

- **Streaming Responses**: Real-time response generation
- **Model Selection**: Different models per agent type
- **Cost Optimization**: Dynamic token limits based on context
- **Backend Proxy**: Eliminate CORS issues
- **Response Caching**: Cache similar queries for efficiency

## Database Schema Changes

No database schema changes were required. The existing `ai_metadata` field in the `messages` table stores Claude response metadata:

```sql
-- Example ai_metadata content
{
  "model": "claude-3-haiku-20240307",
  "tokens_used": 245,
  "response_time": 1200,
  "temperature": 0.7
}
```

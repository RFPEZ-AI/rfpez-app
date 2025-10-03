# RFPEZ.AI MCP (Model Context Protocol) Connector

This implementation provides a Supabase-based MCP server that allows AI agents (like Claude) to retrieve and store conversation history and session data.

## Architecture

```
Claude Desktop App
        ↓ (MCP Protocol over stdio)
    mcp-client.js (Node.js)
        ↓ (HTTP/JSON-RPC)
    Supabase Edge Function (supabase-mcp-server)
        ↓ (SQL queries)
    Supabase Database (conversations, sessions, messages)
```

## Features

The MCP server provides the following tools for AI agents:

### Tools Available

1. **`get_conversation_history`** - Retrieve messages from a specific session
   - Parameters: `session_id`, `limit` (optional), `offset` (optional)
   
2. **`get_recent_sessions`** - Get recent chat sessions for the authenticated user
   - Parameters: `limit` (optional)
   
3. **`store_message`** - Store a new message in a conversation session
   - Parameters: `session_id`, `content`, `role`, `metadata` (optional)
   
4. **`create_session`** - Create a new conversation session
   - Parameters: `title`, `description` (optional)
   
5. **`search_messages`** - Search for messages across all sessions
   - Parameters: `query`, `limit` (optional)

### Resources Available

1. **`conversation://recent`** - Access to recent conversation sessions
2. **`conversation://search`** - Search functionality across all messages

## Setup Instructions

### 1. Deploy the Supabase Edge Function

```bash
# Make sure you have Supabase CLI installed and are logged in
supabase login

# Deploy the MCP server function
chmod +x deploy-mcp.sh
./deploy-mcp.sh
```

### 2. Install MCP Client Dependencies

```bash
# Install node-fetch for the MCP client
npm install --save-dev node-fetch@2.6.7
```

### 3. Configure Claude Desktop

1. Copy `claude_desktop_config.json` to your Claude Desktop configuration directory:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Update the environment variables in the config file:
   ```json
   {
     "mcpServers": {
       "rfpez-supabase": {
         "command": "node",
         "args": ["./mcp-client.js"],
         "env": {
           "SUPABASE_URL": "https://your-project.supabase.co",
           "SUPABASE_ANON_KEY": "your-anon-key",
           "ACCESS_TOKEN": "your-access-token"
         }
       }
     }
   }
   ```

3. Make sure `mcp-client.js` is in the same directory as your Claude config or update the path accordingly.

### 4. Get Your Access Token

To get an access token for testing:

1. Sign in to your RFPEZ app
2. Open browser dev tools → Application/Storage → Local Storage
3. Look for the Supabase session data and copy the `access_token`
4. Use this token in your Claude configuration

**Note**: For production use, you'll want to implement a more robust authentication mechanism.

## Testing the MCP Connector

### Using the React Test Component

1. Add the MCP Test Component to your app:
   ```tsx
   import MCPTestComponent from './components/MCPTestComponent';
   
   // Add to your router or render it directly
   <MCPTestComponent />
   ```

2. Sign in to your app and navigate to the MCP test page
3. Test the following features:
   - Create a new session
   - Send messages to the session
   - Retrieve conversation history
   - Search across messages

### Using Claude Desktop

Once configured, you can ask Claude to:

```
Can you retrieve my recent conversation sessions using the RFPEZ MCP connector?
```

```
Please get the conversation history for session ID: [session-id]
```

```
Search for messages containing "deployment" across all my sessions
```

## MCP Protocol Implementation

The edge function implements the MCP 2024-11-05 specification with:

- **JSON-RPC 2.0** message format
- **Tool calling** for database operations
- **Resource reading** for structured data access
- **Authentication** via Supabase auth tokens
- **Row Level Security** enforcement

## Database Schema

The MCP server works with these tables:

- `user_profiles` - User information linked to Supabase auth
- `sessions` - Conversation sessions
- `messages` - Individual messages in sessions
- `artifacts` - Files and documents (optional)

## Security

- All requests require valid Supabase authentication tokens
- Row Level Security (RLS) ensures users can only access their own data
- The edge function validates user identity before database operations
- CORS is configured for secure cross-origin requests

## Error Handling

The MCP server provides detailed error responses:

- **Authentication errors** (code -32001) - Invalid or missing auth token
- **Tool errors** (code -32603) - Database or validation errors
- **Parse errors** (code -32700) - Malformed JSON-RPC requests

## Development

### Running Locally

```bash
# Start Supabase local development
supabase start

# Deploy function locally
supabase functions serve supabase-mcp-server

# Test with curl
curl -X POST http://localhost:54321/functions/v1/supabase-mcp-server \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### File Structure

```
supabase/
├── functions/
│   └── supabase-mcp-server/
│       └── index.ts          # Main MCP server implementation
├── config.toml               # Supabase configuration
src/services/
├── mcpClient.ts              # TypeScript MCP client
components/
├── MCPTestComponent.tsx      # React test interface
mcp-client.js                 # Node.js MCP client for Claude
claude_desktop_config.json    # Claude Desktop configuration
deploy-mcp.sh                 # Deployment script
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check that your access token is valid and not expired
   - Ensure SUPABASE_URL and SUPABASE_ANON_KEY are correct

2. **Function Not Found**
   - Verify the edge function was deployed successfully
   - Check the function URL in Supabase dashboard

3. **Database Errors**
   - Ensure your database schema is up to date
   - Check RLS policies are correctly configured

4. **Claude Connection Issues**
   - Verify node and node-fetch are installed
   - Check file paths in claude_desktop_config.json
   - Restart Claude Desktop after configuration changes

### Logging

Enable debug logging by setting environment variables:
```bash
export DEBUG=1
export NODE_ENV=development
```

## Future Enhancements

Potential improvements to consider:

1. **Streaming responses** for large conversation histories
2. **Webhook integration** for real-time updates
3. **Advanced search** with vector embeddings
4. **Multi-user sessions** and collaboration features
5. **Export/import** functionality for conversations
6. **Rate limiting** and usage analytics

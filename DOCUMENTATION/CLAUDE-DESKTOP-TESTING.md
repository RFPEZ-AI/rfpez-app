# 🧪 Claude Desktop MCP Testing Guide

## 📋 Setup Instructions

### 1. **Update Claude Desktop Config**

Copy your `claude_desktop_config.json` to Claude's configuration directory:

**Windows:**
```bash
copy claude_desktop_config.json "%APPDATA%\Claude\claude_desktop_config.json"
```

**macOS:**
```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. **Restart Claude Desktop**

Close and restart Claude Desktop to load the new MCP server configuration.

## 🗣️ Test Prompts for Claude Desktop

### **Level 1: Basic Discovery**

```
Can you tell me what tools you have available? I'm particularly interested in any tools related to conversations or sessions.
```

### **Level 2: Tool Exploration**

```
I see you have some conversation-related tools. Can you:
1. List my recent conversation sessions
2. Tell me what tools are available for managing conversations
```

### **Level 3: Practical Usage**

```
Using your conversation tools:
1. Get my recent sessions (limit to 5)
2. Create a new session called "MCP Testing Session"
3. Search for messages containing "test"
```

### **Level 4: Data Retrieval**

```
I want to explore my conversation history. Can you:
1. Show me my most recent sessions
2. Pick one session and show me its conversation history
3. Search for any messages that mention "Claude" or "AI"
```

### **Level 5: Complex Operations**

```
Let's do a comprehensive conversation analysis:
1. Get all my recent sessions
2. For the most active session, retrieve its full conversation history
3. Store a new message in that session saying "This is a test message from Claude Desktop MCP integration"
4. Search for messages containing the word "integration"
```

## 🔍 Expected Responses

### **If MCP is Working:**
- Claude will acknowledge having conversation-related tools
- You'll see actual data from your Supabase database
- Claude can create sessions, retrieve messages, and search content

### **If MCP is NOT Working:**
- Claude will say it doesn't have access to conversation tools
- No data retrieval capabilities
- Standard Claude responses without external data access

## 🛠️ Troubleshooting

### **Issue: "I don't have access to conversation tools"**

**Solutions:**
1. Verify Claude Desktop config is in the correct location
2. Restart Claude Desktop
3. Check that `mcp-client.js` is in the same directory as the config
4. Verify access token hasn't expired

### **Issue: "Authentication failed"**

**Solutions:**
1. Get a fresh access token from http://localhost:3000/mcp-test
2. Update the ACCESS_TOKEN in `claude_desktop_config.json`
3. Restart Claude Desktop

### **Issue: Tools listed but calls fail**

**Solutions:**
1. Check Supabase functions are deployed: `supabase functions list`
2. Verify network connectivity
3. Check token permissions

## 📊 Advanced Testing

### **Test Token Refresh**
Your access token expires after some time. Test with:
```
Can you get my recent sessions? If it fails, I might need to refresh my access token.
```

### **Test Error Handling**
```
Try to get conversation history for a non-existent session ID: "00000000-0000-0000-0000-000000000000"
```

### **Test Edge Cases**
```
1. Create a session with a very long title (over 200 characters)
2. Search for messages with special characters: "@#$%^&*()"
3. Try to store a message in a non-existent session
```

## 🎯 Success Criteria

Your MCP integration is working if Claude can:
- ✅ List available conversation tools
- ✅ Retrieve your actual session data
- ✅ Create new sessions
- ✅ Store and retrieve messages
- ✅ Search through your conversation history
- ✅ Handle errors gracefully

## 🔄 Continuous Testing

After successful integration, regularly test with:
```
Quick MCP health check: Can you get my 3 most recent conversation sessions and tell me how many total sessions I have?
```

This confirms your MCP server is operational and data is being properly synchronized.

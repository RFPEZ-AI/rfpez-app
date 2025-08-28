# 🧪 RFPEZ App MCP Testing Guide

## 🚀 **Testing via Web Interface**

Your RFPEZ app is now running at: **http://localhost:3000**

### **Step 1: Access the MCP Test Page** 🌐

Navigate to: **http://localhost:3000/mcp-test**

### **Step 2: Authentication** 🔐

1. **Sign In** (if not already authenticated):
   - Go to http://localhost:3000
   - Click "Login" in the top-right corner
   - Use your Google account or email/password

2. **Verify Access Token**:
   - On the MCP test page, you should see an "Authentication Info" card
   - Your access token should be displayed
   - The token should start with `eyJ...`

### **Step 3: MCP Function Testing** 🔧

#### **Test 1: Get Recent Sessions**
1. In the "Recent Sessions" section, it should automatically load your sessions
2. You should see existing sessions like:
   - "Test Session 2025-08-27..."
   - "1+1"
   - "bla bla bla"
   - etc.

#### **Test 2: Create New Session**
1. In the "Create New Session" section:
   - Enter title: `"RFPEZ MCP Test Session"`
   - Click "Create Session"
   - ✅ Success: You should see "Session created successfully!"
   - ✅ The new session should appear in the Recent Sessions list

#### **Test 3: Send Messages**
1. Select a session from the Recent Sessions list
2. In the "Send Message" section:
   - Enter message: `"Testing MCP functionality from RFPEZ app"`
   - Select role: "user"
   - Click "Send Message"
   - ✅ Success: Message should be added to the conversation
   - ✅ Message should appear in the "Messages" section

#### **Test 4: Search Messages**
1. In the "Search Messages" section:
   - Enter search query: `"test"`
   - Click "Search"
   - ✅ Success: Should return messages containing "test"
   - ✅ Results should show session titles and message content

## 📊 **Expected Test Results**

### **✅ If MCP is Working Correctly:**

1. **Authentication Info Card Shows**:
   - Your email address
   - Your user ID
   - Valid access token (starts with `eyJ`)

2. **Recent Sessions Loads**:
   - List of your conversation sessions
   - Session titles and timestamps
   - "Recent Sessions (X)" where X > 0

3. **Session Creation Works**:
   - New sessions appear immediately in the list
   - Success message displayed
   - No error messages

4. **Message Storage Works**:
   - Messages are stored and retrieved
   - Message history displays correctly
   - Message order is preserved

5. **Search Functionality Works**:
   - Search returns relevant results
   - Results include session information
   - Search is fast and responsive

### **❌ If MCP Has Issues:**

1. **Authentication Problems**:
   - "No active session token" message
   - Empty or invalid access token
   - Login redirect or errors

2. **Connection Issues**:
   - "MCP not initialized" warning persists
   - Error messages about failed requests
   - Network or CORS errors

3. **Data Issues**:
   - Empty session lists
   - Failed session creation
   - Messages not saving/loading

## 🛠️ **Troubleshooting Steps**

### **Issue: "MCP not initialized"**
```
1. Check browser console for errors (F12)
2. Verify you're signed in
3. Check access token is present
4. Refresh the page
```

### **Issue: "Failed to load sessions"**
```
1. Verify Supabase functions are deployed
2. Check access token hasn't expired
3. Test with the test-mcp-functions.js script
4. Check network connectivity
```

### **Issue: Authentication problems**
```
1. Sign out and sign back in
2. Clear browser storage: localStorage and sessionStorage
3. Get fresh access token from Authentication Info card
4. Check token expiration time
```

## 🔄 **Advanced Testing Scenarios**

### **Scenario 1: Full Conversation Flow**
```
1. Create session: "Advanced MCP Test"
2. Send user message: "Hello, this is a test"
3. Send assistant message: "Hello! I'm responding to your test"
4. Send system message: "This is a system notification"
5. Search for: "test"
6. Verify all messages appear in search results
```

### **Scenario 2: Edge Case Testing**
```
1. Create session with long title (200+ characters)
2. Send empty message (should fail gracefully)
3. Search with special characters: "!@#$%"
4. Try to load non-existent session
```

### **Scenario 3: Performance Testing**
```
1. Create 10 sessions rapidly
2. Send 20 messages in one session
3. Search with common words
4. Verify UI remains responsive
```

## 📈 **Success Metrics**

Your MCP integration is fully working if:

- ✅ **Authentication**: Access token displays correctly
- ✅ **Data Retrieval**: Sessions and messages load properly
- ✅ **Data Creation**: New sessions and messages save successfully
- ✅ **Search**: Message search returns accurate results
- ✅ **Error Handling**: Errors display user-friendly messages
- ✅ **Performance**: Operations complete within 2-3 seconds
- ✅ **Persistence**: Data persists across page refreshes

## 🎯 **Quick Test Checklist**

- [ ] Navigate to http://localhost:3000/mcp-test
- [ ] Verify authentication info is displayed
- [ ] Check that recent sessions load automatically
- [ ] Create a new test session
- [ ] Send a test message in the new session
- [ ] Search for messages containing "test"
- [ ] Verify all operations complete successfully
- [ ] Check browser console for any errors

## 🔗 **Next Steps After Successful Testing**

1. **Deploy to Production**: Your MCP functions are ready for production deployment
2. **Claude Desktop Integration**: Use the working MCP client with Claude Desktop
3. **API Integration**: Use the Claude API endpoint for external integrations
4. **Scaling**: Consider rate limiting and caching for production use

Your RFPEZ app now has a **fully functional MCP connector** for conversation management! 🚀

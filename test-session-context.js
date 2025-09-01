// Quick test to verify session ID is included in Claude context
const mockAgent = {
  name: "Test Agent",
  instructions: "You are a helpful test agent."
};

const mockUserProfile = {
  id: "user123",
  email: "test@example.com",
  full_name: "Test User",
  role: "admin"
};

const mockSessionId = "session-abc-123";

// Simulate the context building logic
const userContext = mockUserProfile ? `

CURRENT USER CONTEXT:
- User ID: ${mockUserProfile.id || 'anonymous'}
- Name: ${mockUserProfile.full_name || 'Anonymous User'}
- Email: ${mockUserProfile.email || 'not provided'}
- Role: ${mockUserProfile.role || 'user'}

Please personalize your responses appropriately based on this user information.` : '';

const sessionContext = mockSessionId ? `

CURRENT SESSION CONTEXT:
- Session ID: ${mockSessionId}
- Use this session ID when calling functions that require a session_id parameter (like switch_agent, store_message, etc.)` : '';

const systemPrompt = `${mockAgent.instructions || `You are ${mockAgent.name}, an AI assistant.`}${userContext}${sessionContext}`;

console.log("🔍 SYSTEM PROMPT PREVIEW:");
console.log("═".repeat(50));
console.log(systemPrompt);
console.log("═".repeat(50));

// Verify session ID is included
if (systemPrompt.includes(mockSessionId)) {
  console.log("✅ Session ID successfully included in Claude context");
} else {
  console.log("❌ Session ID NOT found in Claude context");
}

// Verify user context is included
if (systemPrompt.includes(mockUserProfile.full_name)) {
  console.log("✅ User context successfully included");
} else {
  console.log("❌ User context NOT found");
}

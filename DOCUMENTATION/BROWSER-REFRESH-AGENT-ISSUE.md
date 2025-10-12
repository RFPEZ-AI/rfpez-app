# Browser Refresh Agent Selection Issue

**Date**: October 12, 2025  
**Status**: DIAGNOSED - Awaiting Confirmation

## Issue Description

When refreshing the browser, the application loads with RFP Design Agent selected instead of the default Solutions Agent, and appears to be in a "new" session context.

## Root Cause Analysis

### The Problem Flow

1. **Page Refresh** → Session restoration begins
2. **Authentication Check** → User is authenticated, `currentSessionId` is null (initially)
3. **Default Agent Load** → `loadDefaultAgentWithPrompt()` called → Loads Solutions Agent
4. **Session Restoration** → Runs in parallel via separate useEffect
5. **Database Lookup** → `getUserCurrentSession()` returns the **last active session ID**
6. **Session Selection** → `handleSelectSession(lastSessionId)` is called
7. **Agent Restoration** → `loadSessionAgent(lastSessionId)` loads the **session's agent**
8. **Override** → Session agent (RFP Design) **overrides** default agent (Solutions)

### Code Flow Locations

**File**: `src/hooks/useSessionInitialization.ts`

**Lines 96-119**: Authentication check and default agent load
```typescript
if (!supabaseLoading && !currentSessionId && messages.length === 0) {
  console.log('Loading default agent for initial app startup...');
  loadDefaultAgentWithPrompt().then(initialMessage => {
    console.log('✅ Default agent loaded, keeping activation message');
  });
}
```

**Lines 128-180**: Session restoration (runs in parallel)
```typescript
if (isAuthenticated && sessions.length > 0 && !currentSessionId && !isCreatingNewSession) {
  const restoreSession = async () => {
    const dbCurrentSessionId = await DatabaseService.getUserCurrentSession();
    if (dbCurrentSessionId) {
      handleSelectSession(dbCurrentSessionId); // ← Loads session's agent
    }
  };
  restoreSession();
}
```

**File**: `src/hooks/useHomeHandlers.ts`

**Line 238**: Session selection loads session's specific agent
```typescript
await loadSessionAgent(sessionId); // ← Overrides default agent
```

**File**: `src/hooks/useAgentManagement.ts`

**Lines 123-169**: Agent restoration from session
```typescript
const loadSessionAgent = async (sessionId: string) => {
  const agent = await AgentService.getSessionActiveAgent(sessionId);
  if (agent) {
    setCurrentAgent(agent); // ← Overrides default agent
  }
}
```

## Why This Feels Like a "New" Session

The session **is being restored correctly** - it's loading your previous session with:
- Previous messages
- Previous RFP context  
- **Previous agent selection** (RFP Design)

It **feels** like a new session because:
1. You expected Solutions Agent (the default)
2. But got RFP Design Agent (from your last session)
3. The UI correctly restored your last working state

## Expected Behavior vs Actual Behavior

### What SHOULD Happen (Current Behavior - CORRECT)
✅ **Session Persistence**: Restore user's last active session with all context
✅ **Agent Persistence**: Restore the agent that was active in that session
✅ **RFP Context**: Restore the RFP that was active in that session
✅ **Message History**: Restore all previous messages

**Rationale**: Users expect to continue where they left off, with the same agent and context.

### Alternative Behavior (Questionable)
❓ **Always Load Default Agent**: Force Solutions Agent on every refresh
❌ **Problem**: Breaks session continuity, confusing UX
❌ **Example**: User working with RFP Design → Refresh → Suddenly Solutions Agent → User confused

## Verification Steps

To confirm this diagnosis:

1. **Check Browser Console Logs** for session restoration:
   ```
   Loading default agent for initial app startup...
   ✅ Default agent loaded
   Database current session ID: [UUID]
   Restoring session from database: [UUID]
   Session selected: [UUID]
   🔄 loadSessionAgent called with sessionId: [UUID]
   ✅ Agent data received from service: { agent_name: "RFP Design" }
   ```

2. **Check Session ID** in the restored session:
   - Is it the same session you were working in before refresh?
   - Does that session have RFP Design agent active in database?

3. **Database Query** to verify session's agent:
   ```sql
   SELECT s.id, s.title, sa.agent_id, a.name as agent_name
   FROM sessions s
   LEFT JOIN session_agents sa ON s.id = sa.session_id AND sa.is_active = true
   LEFT JOIN agents a ON sa.agent_id = a.id
   WHERE s.id = 'YOUR_SESSION_ID'
   ORDER BY sa.created_at DESC
   LIMIT 1;
   ```

## Potential Solutions (If Behavior is Undesired)

### Option 1: Always Load Default Agent on Refresh (NOT RECOMMENDED)
❌ **Breaks session continuity**
❌ **Confusing UX** - agent keeps changing unexpectedly

### Option 2: Add User Preference Setting
✅ **Let user choose**: "Remember last agent" vs "Always start with default"
✅ **Best of both worlds**

### Option 3: Smart Agent Selection
✅ **If session is recent** (< 1 hour old): Restore session agent
✅ **If session is old** (> 1 hour): Load default agent
✅ **Balances continuity and fresh start**

### Option 4: Keep Current Behavior (RECOMMENDED)
✅ **Session persistence is correct behavior**
✅ **Users expect to continue where they left off**
✅ **No code changes needed**

## Recommendation

**The current behavior is CORRECT and should be KEPT.**

When you refresh the browser:
1. ✅ Your last session is restored
2. ✅ Your last agent (RFP Design) is restored
3. ✅ Your last RFP context is restored
4. ✅ Your message history is restored

**This is proper session persistence.**

If you want to start a "fresh" session with Solutions Agent:
- Click the **"New Session"** button in the sidebar
- This will create a clean session with the default agent

## Testing Confirmation Needed

Please check your browser console and confirm:
1. What session ID is being restored?
2. Is it the same session you were in before refresh?
3. Did that session have RFP Design agent active?

Console logs to look for:
```
Database current session ID: [check this UUID]
Restoring session from database: [check this UUID]
✅ Agent data received from service: { agent_name: "RFP Design" }
```

If the session ID matches your previous working session, **the behavior is correct**.

## Status: AWAITING USER CONFIRMATION

Need to verify:
- [ ] Session ID being restored matches previous session
- [ ] Previous session had RFP Design agent active
- [ ] User understands this is session persistence (not a bug)
- [ ] User confirms if they want different behavior (preference setting)

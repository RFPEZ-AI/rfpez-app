# Agent Context Refactoring - September 19, 2025

## Summary
Removed `current_agent_id` from `user_profiles` table and refactored the system so that agent context is derived through the user's current session only.

## Changes Made

### 1. Database Schema Changes

#### Migration Applied: `migration-remove-user-profile-agent-ref.sql`
- ✅ Removed `current_agent_id` column from `user_profiles` table
- ✅ Dropped associated foreign key constraint and index
- ✅ Updated `set_user_current_context()` function to only handle session context
- ✅ Added `get_user_current_agent()` helper function to get agent via session

### 2. TypeScript Interface Updates

#### `src/types/database.ts`
- ✅ Removed `current_agent_id?: string` from `UserProfile` interface
- ✅ Agent context now only available through session relationship

### 3. Service Layer Updates

#### `src/services/userContextService.ts` - **Complete Rewrite**
**Removed Methods:**
- `setCurrentAgent()` - No longer needed
- `clearCurrentAgent()` - No longer needed  
- `setUserContext()` - No longer needed

**Updated Methods:**
- `getCurrentAgent()` - Now gets agent via session relationship using nested Supabase query
- `getUserProfileWithContext()` - Now gets agent from session instead of direct user profile

**Preserved Methods:**
- `setCurrentSession()` - Still needed for session management
- `getCurrentSession()` - Still needed for session retrieval
- `clearCurrentSession()` - Still needed (also clears agent context automatically)

### 4. Hook Updates

#### `src/hooks/useAgentManagement.ts`
- ✅ Removed `UserContextService.setCurrentAgent()` calls in `loadDefaultAgentWithPrompt()`
- ✅ Removed `UserContextService.setCurrentAgent()` calls in `handleAgentChanged()`
- ✅ Agent persistence now only happens through session context via `DatabaseService.updateSessionContext()`

## Architecture Changes

### Before (User + Session Agent Storage)
```
user_profiles.current_agent_id -> agents.id
sessions.current_agent_id -> agents.id
```

### After (Session-Only Agent Storage)
```
user_profiles.current_session_id -> sessions.id
sessions.current_agent_id -> agents.id
```

## Benefits

1. **Simplified Data Model**: Agent context is now purely session-based
2. **Single Source of Truth**: No risk of user and session agent context getting out of sync
3. **Cleaner Architecture**: Agent switching automatically persists with session context
4. **Better User Experience**: Users get agent context naturally through their active session

## Data Flow

1. User selects/creates a session → `user_profiles.current_session_id` updated
2. Agent is changed in session → `sessions.current_agent_id` updated  
3. User's current agent is retrieved → Query via `user_profiles.current_session_id` → `sessions.current_agent_id` → `agents.*`

## Database Functions

### New Helper Function
```sql
get_user_current_agent(user_uuid UUID) RETURNS UUID
```
- Gets user's current agent ID through their current session
- Returns NULL if no session or no agent set on session
- Used internally by application logic

### Updated Function
```sql
set_user_current_context(user_uuid UUID, session_uuid UUID DEFAULT NULL) RETURNS BOOLEAN
```
- Simplified to only handle session context
- Removed agent parameter since it's session-derived

## Testing Notes

- All agent switching should now work through session context only
- Agent persistence will be tied to the active session
- When switching sessions, the agent context will automatically change to that session's agent
- Clearing session context will also clear agent context automatically

## Migration Status
✅ **Applied Successfully** - Database schema updated, code refactored, no compilation errors
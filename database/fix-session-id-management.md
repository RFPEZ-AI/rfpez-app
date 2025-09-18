# Session ID Management Fix

## Issue
The application was using the literal string "current" instead of actual session IDs in database queries, causing 400 Bad Request errors when trying to fetch artifact submissions:

```
GET .../artifact_submissions?session_id=eq.current 400 (Bad Request)
```

## Root Cause
Multiple places in the codebase were defaulting to the string "current" when session ID was undefined:
- `claudeAPIFunctions.ts`: `session_id || 'current'`
- `database.ts`: `sessionId || 'current'`  
- `useArtifactManagement.ts`: `currentSessionId || 'current'`

## Solution

### 1. Database Schema Enhancement
Added `current_session_id` field to `user_profiles` table to persist the active session:

```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;
```

### 2. Helper Functions
Created database functions to manage current session:
- `set_user_current_session(user_uuid, session_uuid)` - Updates user's current session
- `get_user_current_session(user_uuid)` - Retrieves user's current session

### 3. Code Updates

**claudeAPIFunctions.ts**: Enhanced `getFormSubmission` to get current session from user profile:
```typescript
// Get the current session ID from user profile if not provided
let effectiveSessionId = session_id;
if (!effectiveSessionId) {
  const { data: currentSessionData } = await supabase
    .rpc('get_user_current_session', { user_uuid: userId });
  effectiveSessionId = currentSessionData;
}
```

**database.ts**: Updated to use `null` instead of 'current':
```typescript
session_id: sessionId || null, // Use null instead of 'current'
```

**useArtifactManagement.ts**: Updated to use `undefined`:
```typescript
currentSessionId || undefined // Use undefined instead of 'current'
```

**Session Management**: Updated session creation and selection to persist current session:
```typescript
// In session creation/selection
await DatabaseService.setUserCurrentSession(sessionId);
```

## Files Modified
- `database/migration-add-current-session-id.sql` - Database migration
- `src/services/database.ts` - Helper functions and session management
- `src/services/claudeAPIFunctions.ts` - Form submission handling
- `src/hooks/useArtifactManagement.ts` - Artifact loading
- `src/hooks/useMessageHandling.ts` - Session creation
- `src/pages/Home.tsx` - Session selection

## Testing
The fix resolves the 400 Bad Request errors and ensures:
1. ✅ Current session ID is properly persisted in user profiles
2. ✅ Database queries use actual UUIDs instead of literal strings
3. ✅ Form artifact submission data retrieval works correctly
4. ✅ Session context is properly maintained across page reloads

## Benefits
- **Data Integrity**: Proper foreign key relationships with actual session IDs
- **Performance**: Efficient queries with proper session filtering  
- **User Experience**: Persistent session state across browser sessions
- **Debugging**: Clear session tracking for troubleshooting
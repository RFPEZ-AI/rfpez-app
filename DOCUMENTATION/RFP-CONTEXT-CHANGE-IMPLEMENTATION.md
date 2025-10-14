# RFP Context Change & Artifact Association Implementation

## 📋 Overview
This implementation adds intelligent RFP context switching with automatic agent notifications and proper artifact filtering by RFP.

## ✅ What Was Implemented

### 1. **Agent Notification System** (`src/utils/agentNotifications.ts`)
Created utility functions to generate intelligent auto-prompts when users change RFP context:

- `generateRFPContextChangePrompt()`: Generates context-aware notification messages for agents
- `shouldSendRFPContextChangePrompt()`: Determines when to send notifications based on session state

**Features:**
- Provides RFP details (name, description, due date)
- Suggests workflow options (continue current session, switch to last session, or create new session)
- Adapts message based on session state (active vs empty)
- Helps agents respond appropriately to context changes

### 2. **Enhanced useRFPManagement Hook** (`src/hooks/useRFPManagement.ts`)
Updated the RFP management hook to support agent notifications:

- Added `onRfpContextChanged` callback parameter
- Added `hasMessagesInCurrentSession` parameter to track session state
- Modified `handleSetCurrentRfp` to accept `isUserInitiated` flag
- Integrated notification system to send auto-prompts to agents

**New Signature:**
```typescript
export const useRFPManagement = (
  currentSessionId?: string,
  globalCurrentRfpId?: number | null,
  globalCurrentRfp?: RFP | null,
  setGlobalRFPContext?: (rfpId: number, rfpData?: RFP) => Promise<void>,
  clearGlobalRFPContext?: () => void,
  onRfpContextChanged?: (prompt: string) => void,
  hasMessagesInCurrentSession?: boolean
)
```

### 3. **Home.tsx Integration** (`src/pages/Home.tsx`)
Connected the notification system to the main application:

- Created `handleRfpContextChanged` callback that adds system messages to chat
- Wired callback to `useRFPManagement` hook
- Updated footer's `onRfpChange` handler to mark changes as user-initiated
- System messages are clearly marked with `isSystemNotification` metadata

### 4. **Agent Instruction Updates**
Updated agent markdown files with new RFP context change handling sections:

**RFP Design Agent** (`Agent Instructions/RFP Design Agent.md`):
- Comprehensive guide on handling RFP context changes
- Three-option workflow: continue current session, switch sessions, or create new session
- Examples of good vs bad responses
- Guidelines on when NOT to respond

**Solutions Agent** (`Agent Instructions/Solutions Agent.md`):
- Brief acknowledgment of RFP context changes
- Offer to switch to RFP Design agent for detailed work
- Keeps responses short and focused on agent's role

### 5. **Database Migrations**
Generated and applied SQL migrations for agent instructions:
- `20251014172236_update_rfp_design_agent.sql`
- `20251014172249_update_solutions_agent.sql`

Both migrations successfully applied to local database.

## 🔄 How It Works

### User Flow:
1. User selects a different RFP from the footer dropdown
2. `handleSetCurrentRfp` is called with `isUserInitiated=true`
3. System checks if notification should be sent (considers session state)
4. Auto-prompt is generated with RFP details and suggested actions
5. System message appears in chat thread for the agent
6. Agent responds with appropriate guidance based on instructions

### Agent Receives:
```
[SYSTEM NOTIFICATION: RFP context changed from "LED Bulbs" to "Office Furniture"]

Current RFP Details:
- Name: Office Furniture RFP
- Description: Procurement for desks and chairs
- Due Date: 2025-12-31

Session Status: Active conversation in progress

Please review your agent instructions for how to handle RFP context changes.
You may want to ask the user if they would like to:
1. Continue working with this RFP in the current session
2. Switch to the last session that was working with this RFP
3. Create a new session specifically for this RFP
```

### Agent Response Examples:

**RFP Design Agent (Active Session):**
```
"I see we've switched to the Office Furniture RFP. Would you like to 
continue working on it here, or would you prefer to switch to your 
previous session where we were discussing this procurement?"
```

**Solutions Agent:**
```
"I see we've switched to working on Office Furniture RFP. Since I 
specialize in product questions, would you like me to switch you to 
the RFP Design agent to continue working on this procurement?"
```

## 📊 Artifact Filtering

### Existing Implementation:
The artifact filtering by RFP was already implemented in `useArtifactManagement`:

- **Database Schema**: `rfp_artifacts` junction table links artifacts to RFPs
- **Service Layer**: `DatabaseService.getRFPArtifacts(rfpId)` retrieves RFP-specific artifacts
- **Hook Integration**: `useArtifactManagement` reacts to `currentRfp` changes via `useEffect`
- **RLS Policies**: Properly configured for public read and authenticated write access

### How Artifact Filtering Works:
1. User switches RFP via footer dropdown
2. `useArtifactManagement` detects `currentRfp` change
3. Hook calls `DatabaseService.getRFPArtifacts(rfpId)`
4. Database query joins `rfp_artifacts` with `artifacts` table
5. Artifact window updates to show only RFP-specific artifacts
6. Claude-generated artifacts remain visible alongside RFP artifacts

## 🧪 Testing Checklist

### Manual Testing:
- [ ] Create multiple RFPs with different artifacts
- [ ] Switch between RFPs using footer dropdown
- [ ] Verify artifact window updates to show correct artifacts
- [ ] Confirm agent receives notification message in chat
- [ ] Check agent responds with helpful session management options
- [ ] Test with empty session (no messages)
- [ ] Test with active session (has messages)
- [ ] Verify system message has proper metadata flags

### Edge Cases to Test:
- [ ] Switching to same RFP (should not trigger notification)
- [ ] Anonymous user RFP switching
- [ ] Session restoration with RFP context
- [ ] Agent switching after RFP context change
- [ ] Multiple rapid RFP switches

## 📁 Files Modified

### New Files:
- `src/utils/agentNotifications.ts` - Agent notification utilities

### Modified Files:
- `src/hooks/useRFPManagement.ts` - Added notification system
- `src/pages/Home.tsx` - Integrated callback and wired to UI
- `Agent Instructions/RFP Design Agent.md` - Added RFP context change section
- `Agent Instructions/Solutions Agent.md` - Added RFP context change section

### Generated Migrations:
- `supabase/migrations/20251014172236_update_rfp_design_agent.sql`
- `supabase/migrations/20251014172249_update_solutions_agent.sql`

## 🚀 Deployment Notes

### Local Testing:
1. Migrations already applied to local database
2. Test artifact filtering by creating multiple RFPs
3. Test agent notifications by switching RFPs mid-conversation

### Remote Deployment:
When ready to deploy to production:
```bash
# Deploy database migrations (includes agent instruction updates)
supabase db push

# Or use GitHub Actions (automatic on push to master)
git add supabase/migrations/*.sql
git commit -m "Add RFP context change notifications"
git push origin master
```

## 🎯 Key Benefits

1. **Improved User Experience**: Users get helpful guidance when switching RFP context
2. **Workflow Efficiency**: Agents suggest session management options
3. **Context Awareness**: Agents understand RFP changes and respond appropriately
4. **Proper Artifact Scoping**: Artifacts automatically filter by selected RFP
5. **Smart Notifications**: System only notifies when contextually appropriate

## 🔍 Future Enhancements

Potential improvements for future iterations:
- Query last session with specific RFP and offer direct switch link
- Show artifact count per RFP in footer dropdown
- Add RFP context indicator in artifact window header
- Implement RFP switching confirmation for unsaved work
- Track RFP switch frequency for analytics

## 📝 Notes

- System messages are marked with `isSystemNotification: true` metadata
- Agent instructions emphasize natural, non-technical responses
- Notification logic respects user intent (doesn't interrupt workflow)
- Database schema already supported RFP-artifact relationships
- No breaking changes to existing functionality

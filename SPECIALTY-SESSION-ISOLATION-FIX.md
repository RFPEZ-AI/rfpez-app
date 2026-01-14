# Specialty Site Session Isolation Fix

## Problem
User reported interference between https://rfpez.ai/home and https://rfpez.ai/corporate-tmc-rfp when running in separate tabs. Specifically, the current agent from the corporate-tmc-rfp site was appearing on the home site.

## Root Cause
Both `/home` and `/corporate-tmc-rfp` routes are served by the **same React application** (rfpez-app) with different specialty slugs. While the frontend code was designed to be specialty-aware with namespaced localStorage keys (e.g., `rfpez_last_session_${specialtySlug}`), the **database layer** was not properly isolating sessions by specialty site.

### Key Issues:
1. **Sessions weren't scoped to specialty sites** - The database had a `specialty_site_id` column on the sessions table, but it wasn't being used for session retrieval
2. **RPC functions were broken** - The `get_user_specialty_session()`, `set_user_specialty_session()`, and `clear_user_specialty_session()` functions existed but:
   - Had **no parameters** - Used PostgreSQL session variables instead
   - Didn't accept `user_uuid` and `specialty_slug` parameters as expected by the TypeScript code
   - Couldn't properly track which session belonged to which specialty site

3. **No tracking table** - There was no `user_specialty_sessions` table to maintain the relationship between users, specialty sites, and their current sessions

## Solution
Created migration `20260113000000_fix_specialty_session_isolation.sql` which:

### 1. Created `user_specialty_sessions` table
```sql
CREATE TABLE user_specialty_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  specialty_site_id uuid NOT NULL REFERENCES specialty_sites(id),
  session_id uuid NOT NULL REFERENCES sessions(id),
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(user_id, specialty_site_id)  -- One current session per user per specialty site
);
```

### 2. Fixed RPC Functions
Replaced the parameterless functions with proper implementations:

**get_user_specialty_session(user_uuid, specialty_slug)**
- Looks up specialty site ID from slug
- Returns the user's current session for that specific specialty site

**set_user_specialty_session(user_uuid, specialty_slug, session_uuid)**
- Looks up specialty site ID from slug
- Upserts (INSERT ON CONFLICT UPDATE) the user's current session for that specialty
- This ensures each specialty site has its own independent session tracking

**clear_user_specialty_session(user_uuid, specialty_slug)**
- Clears the user's session for a specific specialty site without affecting other specialty sites

### 3. RLS Policies
Added Row Level Security policies so users can only access their own specialty sessions:
- SELECT: `user_id = auth.uid()`
- INSERT/UPDATE/DELETE: `user_id = auth.uid()`

## How It Works Now

### Frontend (Already Working)
- `useHomeState` hook uses `rfpez_last_session_${specialtySlug}` for localStorage
- `useSpecialtySite` hook determines the current specialty from URL route parameter
- All session operations pass `specialtySlug` to database service methods

### Backend (Now Fixed)
- Each specialty site maintains its own session tracking in `user_specialty_sessions`
- When user switches to `/home`, it loads their home session
- When user switches to `/corporate-tmc-rfp`, it loads their corporate-tmc-rfp session
- Sessions are completely isolated - switching tabs doesn't cause interference

## Testing
After applying the migration:

1. **Clear existing state** (to avoid cached references):
   ```bash
   # In browser console for both tabs:
   localStorage.clear();
   sessionStorage.clear();
   # Then refresh both tabs
   ```

2. **Test session isolation**:
   - Open https://rfpez.ai/home in Tab 1
   - Create a new session, select "Solutions" agent
   - Open https://rfpez.ai/corporate-tmc-rfp in Tab 2
   - Should see "Corporate TMC RFP Welcome" agent (if not logged in) or "TMC Specialist" (if logged in)
   - Switch back to Tab 1 - should still show "Solutions" agent
   - Switch back to Tab 2 - should still show correct TMC agent

3. **Test agent persistence**:
   - Refresh Tab 1 - should restore "Solutions" agent
   - Refresh Tab 2 - should restore TMC agent
   - Close both tabs, reopen them - should restore correct agents for each specialty

## Deployment

### Local (Already Applied)
```bash
supabase migration up
```

### Remote
```bash
git add supabase/migrations/20260113000000_fix_specialty_session_isolation.sql
git commit -m "Fix: Specialty site session isolation to prevent agent interference"
git push origin master
# GitHub Actions will auto-deploy the migration
```

## Benefits
- ✅ Complete session isolation between specialty sites
- ✅ Each specialty site maintains its own current agent
- ✅ No interference when opening multiple specialty sites in separate tabs
- ✅ Proper persistence of specialty-specific sessions across page refreshes
- ✅ Works for both authenticated and anonymous users
- ✅ Follows existing architecture patterns (RPC functions, RLS policies)

## Related Files
- Migration: `supabase/migrations/20260113000000_fix_specialty_session_isolation.sql`
- Frontend Hook: `src/hooks/useHomeState.ts` (already specialty-aware)
- Database Service: `src/services/database.ts` (calls RPC functions)
- Agent Management: `src/hooks/useAgentManagement.ts` (loads agents by specialty)
- Specialty Site Hook: `src/hooks/useSpecialtySite.ts` (determines current specialty)

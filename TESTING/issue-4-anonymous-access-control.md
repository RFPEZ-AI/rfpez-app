# Issue 4: Anonymous Users Can Access RFP Design Agent

**Date**: October 14, 2025  
**Status**: 🔴 **CRITICAL BUG**  
**Priority**: HIGH

## Problem Description

Anonymous users (not logged in) can access the **RFP Design agent**, which should only be available to authenticated users (free tier and above). The Solutions agent is incorrectly switching anonymous users to RFP Design when they request procurement help.

## Root Cause

**TWO PROBLEMS:**

### Problem 1: Incorrect Database Configuration
The RFP Design agent in the database has:
- `is_restricted = FALSE`
- `is_free = TRUE`

This configuration means "available to everyone, including anonymous users."

**File**: `supabase/migrations/20251002030545_populate_agents_local.sql` (Line 274)
```sql
FALSE, -- Not restricted - available to authenticated users  ← WRONG!
TRUE,  -- Free agent - available to authenticated users without billing
```

### Problem 2: Flawed Access Control Logic
The access control check has confusing logic:

**File**: `supabase/functions/claude-api-v3/tools/database.ts` (Lines 1166-1173)
```typescript
// Anonymous users can only access agents that are:
// 1. NOT restricted (is_restricted = false), OR
// 2. Free agents (is_free = true, even if restricted)
if (agentIsRestricted && !agentIsFree) {
  console.log('🚫 ACCESS DENIED');
  throw new Error(`Access denied: The ${agentObj.name} agent requires an account...`);
}
```

**The logic is backwards!** The comment says "free agents even if restricted" but the code blocks "restricted AND not free". This means:
- `is_restricted=FALSE` → **ALLOWED** (regardless of is_free)
- `is_restricted=TRUE, is_free=TRUE` → **ALLOWED** (because `!agentIsFree` is FALSE)
- `is_restricted=TRUE, is_free=FALSE` → **BLOCKED** (premium only)

This logic makes `is_restricted=FALSE` a "public for everyone" flag, which is wrong.

## Expected Behavior

**Agent Access Tiers:**
1. **Anonymous (not logged in)**: Solutions agent ONLY
2. **Authenticated Free**: Solutions + RFP Design + Support (free tier agents)
3. **Authenticated Premium**: All agents including restricted/premium ones

## Correct Configuration

### Agent Settings:
| Agent | is_restricted | is_free | Who Can Access |
|-------|---------------|---------|----------------|
| Solutions | FALSE | FALSE | Everyone (including anonymous) |
| RFP Design | TRUE | TRUE | Authenticated users only (free tier+) |
| Support | FALSE | TRUE | Everyone (including anonymous) |
| Premium Agents | TRUE | FALSE | Authenticated premium billing only |

### Correct Access Logic:
```typescript
// For anonymous users: Only allow non-restricted agents
if (isAnonymousUser) {
  if (agentIsRestricted) {
    // Block ANY restricted agent, regardless of is_free
    throw new Error(`Access denied: The ${agentObj.name} agent requires an account...`);
  }
  // Allow non-restricted agents
}

// For authenticated users:
// - Can access non-restricted agents (is_restricted=FALSE)
// - Can access free restricted agents (is_restricted=TRUE, is_free=TRUE)
// - Premium restricted agents need billing check (is_restricted=TRUE, is_free=FALSE)
```

## Solution Implementation

### Step 1: Fix Database Migration

**File**: `supabase/migrations/20251002030545_populate_agents_local.sql` (Line 274)

**Before:**
```sql
FALSE, -- Not restricted - available to authenticated users
TRUE,  -- Free agent - available to authenticated users without billing
```

**After:**
```sql
TRUE,  -- Restricted - requires authentication
TRUE,  -- Free agent - available to authenticated users without billing
```

### Step 2: Fix Access Control Logic

**File**: `supabase/functions/claude-api-v3/tools/database.ts` (Lines 1154-1173)

**Before:**
```typescript
// 🔐 AUTHENTICATION & AUTHORIZATION CHECK
// Validate agent access for anonymous users
if (isAnonymousUser) {
  const agentObj = agent as unknown as Agent;
  const agentIsRestricted = agentObj.is_restricted;
  const agentIsFree = agentObj.is_free;
  
  console.log('🔐 Anonymous user agent access validation:', {
    agentName: agentObj.name,
    is_restricted: agentIsRestricted,
    is_free: agentIsFree,
    canAccess: !agentIsRestricted || agentIsFree
  });
  
  // Anonymous users can only access agents that are:
  // 1. NOT restricted (is_restricted = false), OR
  // 2. Free agents (is_free = true, even if restricted)
  if (agentIsRestricted && !agentIsFree) {
    console.log('🚫 ACCESS DENIED: Anonymous user trying to access restricted agent:', agentObj.name);
    throw new Error(`Access denied: The ${agentObj.name} agent requires an account to use. Please sign up or log in to access specialized agents and advanced features. Anonymous users can use the Solutions agent and other free agents.`);
  }
  
  console.log('✅ Access granted: Anonymous user can access agent:', agentObj.name);
}
```

**After:**
```typescript
// 🔐 AUTHENTICATION & AUTHORIZATION CHECK
// Validate agent access for anonymous users
if (isAnonymousUser) {
  const agentObj = agent as unknown as Agent;
  const agentIsRestricted = agentObj.is_restricted;
  
  console.log('🔐 Anonymous user agent access validation:', {
    agentName: agentObj.name,
    is_restricted: agentIsRestricted,
    canAccess: !agentIsRestricted
  });
  
  // Anonymous users can ONLY access non-restricted agents
  // Restricted agents require authentication, regardless of is_free setting
  if (agentIsRestricted) {
    console.log('🚫 ACCESS DENIED: Anonymous user trying to access restricted agent:', agentObj.name);
    throw new Error(`Access denied: The ${agentObj.name} agent requires an account to use. Please sign up or log in to access specialized agents and advanced features. Anonymous users can use the Solutions agent for basic assistance.`);
  }
  
  console.log('✅ Access granted: Anonymous user can access non-restricted agent:', agentObj.name);
}
```

### Step 3: Update Solutions Agent Instructions

The Solutions agent needs to be aware that it CANNOT switch anonymous users to RFP Design. It should instead:
1. Explain that RFP Design requires an account
2. Offer to help with basic procurement questions
3. Encourage sign-up/login for full features

**File**: Update Solutions agent instructions to include:
```
## ANONYMOUS USER LIMITATIONS:
- Anonymous users can ONLY access the Solutions agent
- **DO NOT** attempt to switch anonymous users to RFP Design or other agents
- When anonymous users request procurement/RFP help:
  1. Explain: "To create RFPs and access specialized agents, please sign up or log in"
  2. Offer: "I can help answer general procurement questions in the meantime"
  3. Encourage: "Sign up to unlock RFP Design, form creation, and more features"
```

## Testing Plan

### Test Scenario: Anonymous User RFP Request
1. Open app without logging in (anonymous user)
2. Send message: "Create a new RFP for LED bulb procurement"
3. **Expected**: Solutions agent explains sign-up is required
4. **Expected**: NO agent switch attempted
5. **Expected**: Friendly explanation of premium features

### Test Scenario: Authenticated User RFP Request
1. Log in with test account (mskiba@esphere.com)
2. Send message: "Create a new RFP for LED bulb procurement"
3. **Expected**: Agent switches to RFP Design
4. **Expected**: RFP creation proceeds normally

### Test Scenario: Direct Agent Switch
1. As anonymous user, try: "Switch to RFP Design agent"
2. **Expected**: Access denied error
3. **Expected**: Message explaining authentication required

## Deployment Steps

1. ✅ Update database migration file
2. ✅ Update access control logic in database.ts
3. ✅ Update Solutions agent instructions
4. ❌ Apply migration to local database: `supabase migration up`
5. ❌ Test with anonymous user
6. ❌ Test with authenticated user
7. ❌ Deploy to remote: `supabase db push`

## Impact Assessment

**Severity**: HIGH
- Anonymous users getting access to premium features
- Potential revenue loss (users not signing up)
- Confusing UX when anonymous users create RFPs but can't save them properly

**Affected Users**: All anonymous users
**Affected Features**: Agent switching, RFP creation

## Related Issues

- **Issue 3**: Footer not updating (✅ FIXED)
- **Issue 2**: Tool display in wrong message (✅ FIXED)
- **Issue 1**: Missing welcome message (✅ FIXED)
- **Issue 4**: Anonymous access control (🔴 **CURRENT**)

---

**Discovered by**: User during testing  
**Requires**: Database migration + Edge function update + Agent instruction update

# Email Development Mode Implementation

## Overview
Moved email restriction logic from agent instructions into the email tool itself, controlled by environment variable.

## Changes Made

### 1. Environment Variable (.env.local)
Added `EMAIL_DEV_MODE=true` environment variable:
- When `true`: Emails to non-registered users are redirected to sender
- When `false`: All emails sent normally to intended recipients
- Registered users (in user_profiles table) always receive emails normally

### 2. Email Tool (supabase/functions/claude-api-v3/tools/email.ts)
Enhanced `sendEmail` function with automatic development mode handling:

**New Helper Functions:**
- `isRegisteredUser()`: Checks if email exists in user_profiles table
- `getSenderEmail()`: Retrieves sender's email from user_profiles

**Development Mode Logic:**
1. Checks if `EMAIL_DEV_MODE` environment variable is enabled
2. For each recipient, queries user_profiles to check if registered
3. Non-registered recipients are replaced with sender's email
4. Prepends routing notice to email body (both text and HTML)
5. Returns detailed information about routing in response

**Routing Notice:**
```
⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️
This email was originally intended for: [recipient@example.com]

In development mode, all emails to non-registered users are routed back to you for review.
These recipients are not registered users in the RFPEZ.AI system.

To send this email to the actual recipients:
1. Add their email addresses to the system by inviting them as users, or
2. Disable EMAIL_DEV_MODE in the environment configuration

---ORIGINAL EMAIL BELOW---
```

### 3. Agent Instructions (Agent Instructions/Sourcing Agent.md)
**Removed:**
- Detailed Rule 2 about email development mode (22 lines)
- Manual whitelist checking instructions
- Email routing notice template that agents had to add manually

**Simplified:**
- Added brief note about automatic EMAIL_DEV_MODE handling
- Removed sourcing-email-whitelist from knowledge base references
- Changed wording from "development mode routing" to "send emails normally"

**Key Changes:**
- Rule numbering updated (Rule 3 → Rule 2, Rule 4 → Rule 3, etc.)
- Phase 4 workflow simplified: "Send emails to selected vendors (dev mode routing is automatic)"
- Added one-line note: "Note on Email Routing: When EMAIL_DEV_MODE is enabled..."

## Benefits

### For Agents:
- No need to manually check whitelists
- No need to modify recipient addresses
- No need to add routing notices
- Simpler instructions = fewer errors
- Just use `send_email` normally

### For Developers:
- Single configuration point (EMAIL_DEV_MODE)
- Logic centralized in email tool
- Easy to disable for production
- Automatic protection against accidental external emails
- Database-driven (checks actual registered users)

### For Users:
- Consistent behavior across all agents
- Safer development/testing
- Clear routing notices when emails are redirected
- Can invite users to system to enable direct emails

## Testing Checklist

- [ ] Email to registered user (should send normally)
- [ ] Email to non-registered user (should redirect to sender)
- [ ] Email to mixed recipients (some registered, some not)
- [ ] Verify routing notice appears in redirected emails
- [ ] Verify HTML and text body variants both work
- [ ] Test with EMAIL_DEV_MODE=false (production mode)
- [ ] Verify response includes routing information

## Configuration

### Development/Testing:
```bash
EMAIL_DEV_MODE=true
```

### Production:
```bash
EMAIL_DEV_MODE=false
```

## Database Dependencies

Relies on `user_profiles` table:
- `email` column: Used to check if recipient is registered
- `supabase_user_id` column: Links to auth.users for sender lookup

## Future Enhancements

Potential improvements:
1. Add admin UI to manage EMAIL_DEV_MODE setting
2. Per-user email mode override (some users always in dev mode)
3. Email audit log showing routing decisions
4. Whitelist for specific external domains (e.g., @example-partner.com)
5. Notification when emails are redirected (UI badge/alert)

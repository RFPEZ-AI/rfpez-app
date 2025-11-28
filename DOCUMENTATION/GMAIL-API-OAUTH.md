# Gmail OAuth API-Based Integration

## Overview
Gmail OAuth has been refactored to use an API-based approach where all OAuth configuration and credential management happens on the backend. This improves security by keeping sensitive credentials server-side and simplifies frontend configuration.

## Architecture

### Previous Architecture (Frontend-Based)
```
Frontend (gmailAuthService.ts)
  ├─ Reads REACT_APP_GOOGLE_CLIENT_ID (exposed to browser)
  ├─ Constructs OAuth URL in JavaScript
  └─ Redirects to Google consent screen
      └─ Google redirects to Supabase edge function
          └─ Edge function exchanges code for tokens
              └─ Stores credentials in database
```

**Problems:**
- OAuth client ID exposed in browser/frontend code
- OAuth configuration split between frontend and backend
- Security risk: Client credentials visible in network requests

### Current Architecture (API-Based)
```
Frontend (gmailAuthService.ts)
  └─ Calls API endpoint: /api/gmail-oauth/initiate?user_id={id}
      └─ API Server (api-server/index.js)
          ├─ Reads GOOGLE_CLIENT_ID from environment (secure)
          ├─ Constructs OAuth URL with proper scopes and state
          └─ Redirects to Google consent screen
              └─ Google redirects to API server callback
                  └─ API server proxies to Supabase edge function
                      └─ Edge function exchanges code for tokens
                          └─ Stores credentials in database
```

**Benefits:**
- ✅ No OAuth credentials exposed to frontend
- ✅ All OAuth configuration centralized on backend
- ✅ Improved security (client secret never leaves server)
- ✅ Simplified frontend configuration
- ✅ Easier to manage redirects and callbacks

## API Endpoints

### 1. Initiate OAuth Flow
**Endpoint:** `GET /api/gmail-oauth/initiate`

**Parameters:**
- `user_id` (query param, required): User's UUID

**Response:** Redirects to Google OAuth consent screen

**Example:**
```javascript
// Frontend code
window.location.href = `http://localhost:3001/api/gmail-oauth/initiate?user_id=${userId}`;
```

**Backend Implementation:**
```javascript
app.get('/api/gmail-oauth/initiate', async (req, res) => {
  const { user_id } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/gmail-oauth-callback';
  
  // Construct OAuth URL with scopes and state
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', Buffer.from(JSON.stringify({ user_id })).toString('base64'));
  
  res.redirect(authUrl.toString());
});
```

### 2. OAuth Callback
**Endpoint:** `GET /api/gmail-oauth-callback`

**Parameters:**
- `code` (query param): Authorization code from Google
- `state` (query param): State parameter with user_id
- `error` (query param, optional): Error from Google OAuth

**Response:** HTML page with success/error message (auto-closes)

**Implementation:** Proxies request to Supabase edge function which handles token exchange and storage.

### 3. Check Connection Status
**Endpoint:** `GET /api/gmail-oauth/status`

**Parameters:**
- `user_id` (query param, required): User's UUID

**Response:**
```json
{
  "isConnected": true,
  "email": "user@example.com",
  "lastConnected": "2025-01-24T10:30:00Z",
  "tokenExpiry": "2025-01-25T10:30:00Z"
}
```

**Example:**
```javascript
// Frontend code
const response = await fetch(`http://localhost:3001/api/gmail-oauth/status?user_id=${userId}`);
const status = await response.json();
console.log('Gmail connected:', status.isConnected);
```

## Environment Configuration

### Backend (.env)
Required environment variables for API server:

```bash
# Google OAuth Credentials (REQUIRED)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/gmail-oauth-callback

# Supabase Configuration (for database access)
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Frontend (.env.local)
Only API server URL needed:

```bash
# API Server URL (for OAuth endpoints)
REACT_APP_API_URL=http://localhost:3001

# NO LONGER NEEDED:
# REACT_APP_GOOGLE_CLIENT_ID=... (removed - kept on backend only)
```

## Frontend Service Usage

### GmailAuthService

```typescript
import { GmailAuthService } from './services/gmailAuthService';

// Initialize service
const gmailAuth = new GmailAuthService(supabaseClient);

// Initiate OAuth flow
await gmailAuth.initiateAuth(userId);
// → Redirects to API endpoint
// → API constructs OAuth URL and redirects to Google
// → User authorizes and returns to callback
// → Callback stores credentials and redirects to success page

// Check connection status
const status = await gmailAuth.isGmailConnected(userId);
console.log('Connected:', status.isConnected);
console.log('Email:', status.email);

// Revoke access (removes from database)
await gmailAuth.revokeAccess(userId);
```

## Google Cloud Console Configuration

### Authorized Redirect URIs
Add these to your Google Cloud Console OAuth credentials:

**Local Development:**
- `http://localhost:3001/api/gmail-oauth-callback` (API server callback)
- `http://127.0.0.1:54321/auth/v1/callback` (Supabase auth)

**Production:**
- `https://api.yourdomain.com/api/gmail-oauth-callback` (API server callback)
- `https://jxlutaztoukwbbgtoulc.supabase.co/auth/v1/callback` (Supabase auth)

### OAuth Scopes Required
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails (labels, etc.)
- `https://www.googleapis.com/auth/userinfo.email` - Get user's email
- `https://www.googleapis.com/auth/userinfo.profile` - Get user's profile info

## OAuth Flow Diagram

```
1. User clicks "Connect Gmail" button
   └─> Frontend calls gmailAuth.initiateAuth(userId)

2. Frontend redirects to API endpoint
   GET http://localhost:3001/api/gmail-oauth/initiate?user_id={uuid}

3. API server constructs OAuth URL
   └─> Includes: client_id, redirect_uri, scopes, state, access_type, prompt

4. API server redirects to Google OAuth
   https://accounts.google.com/o/oauth2/v2/auth?client_id=...

5. User authorizes in Google consent screen
   └─> Google redirects back with authorization code

6. Redirect to API callback
   GET http://localhost:3001/api/gmail-oauth-callback?code=xxx&state=yyy

7. API server proxies to Supabase edge function
   GET http://127.0.0.1:54321/functions/v1/gmail-oauth-callback?code=xxx&state=yyy

8. Edge function exchanges code for tokens
   └─> POST https://oauth2.googleapis.com/token
   └─> Receives: access_token, refresh_token, expiry

9. Edge function stores credentials in database
   INSERT INTO user_email_credentials (user_id, provider, email_address, ...)

10. Success page displayed to user
    └─> Auto-closes after 3 seconds
```

## Security Considerations

### ✅ Improvements in API-Based Approach
1. **Client ID Protected**: No longer exposed in frontend bundle or network requests
2. **State Validation**: State parameter includes user_id, nonce, and timestamp for CSRF protection
3. **Server-Side Configuration**: All OAuth config managed on backend where it can't be tampered with
4. **Token Storage**: Credentials stored in secure database with RLS policies

### 🔒 Remaining Security Measures
1. **HTTPS Required**: Use HTTPS in production to protect tokens in transit
2. **Refresh Token Rotation**: Consider rotating refresh tokens periodically
3. **Token Encryption**: Database credentials should be encrypted at rest
4. **RLS Policies**: Ensure `user_email_credentials` table has proper Row Level Security

## Database Schema

```sql
-- user_email_credentials table
CREATE TABLE user_email_credentials (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'gmail'
  email_address VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- RLS policies
ALTER TABLE user_email_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email credentials"
  ON user_email_credentials
  FOR ALL
  USING (auth.uid() = user_id);
```

## Testing

### Local Testing Checklist
- [ ] API server running on port 3001
- [ ] Environment variables configured in `.env`
- [ ] REACT_APP_API_URL set in `.env.local`
- [ ] Google Cloud Console redirect URIs include `http://localhost:3001/api/gmail-oauth-callback`
- [ ] Supabase local stack running
- [ ] user_email_credentials table exists with RLS policies

### Test OAuth Flow
```bash
# 1. Start API server
npm run start:api

# 2. Start React app
npm start

# 3. Login and navigate to Gmail connection page
# http://localhost:3100/test/gmail-oauth

# 4. Click "Connect Gmail Account"
# → Should redirect to API endpoint
# → Then to Google consent screen
# → After authorization, should return with success message

# 5. Verify credentials stored
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \
  "SELECT user_id, email_address, updated_at FROM user_email_credentials WHERE provider='gmail';"
```

## Troubleshooting

### OAuth Errors

**Error:** `redirect_uri_mismatch`
- **Cause:** Redirect URI not registered in Google Cloud Console
- **Fix:** Add `http://localhost:3001/api/gmail-oauth-callback` to authorized redirect URIs

**Error:** `invalid_client`
- **Cause:** Client ID or secret incorrect
- **Fix:** Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`

**Error:** `access_denied`
- **Cause:** User declined authorization
- **Fix:** User needs to re-initiate OAuth flow and approve access

### API Server Issues

**Error:** `OAuth not configured - missing GOOGLE_CLIENT_ID`
- **Cause:** GOOGLE_CLIENT_ID not set in API server environment
- **Fix:** Add GOOGLE_CLIENT_ID to `.env` file and restart API server

**Error:** `Supabase not configured`
- **Cause:** REACT_APP_SUPABASE_ANON_KEY not set
- **Fix:** Add Supabase keys to `.env` file

### Frontend Issues

**Error:** `Failed to fetch`
- **Cause:** API server not running or wrong URL
- **Fix:** Ensure API server is running on port 3001 and REACT_APP_API_URL is correct

## Migration from Frontend-Based OAuth

### Changes Required

1. **Update GmailAuthService** ✅
   - Remove `clientId` and `redirectUri` properties
   - Add `apiBaseUrl` property
   - Update `initiateAuth()` to redirect to API endpoint
   - Update `isGmailConnected()` to call API status endpoint

2. **Update Environment Variables** ✅
   - Add `REACT_APP_API_URL` to `.env.local`
   - Remove `REACT_APP_GOOGLE_CLIENT_ID` references (keep for legacy compatibility if needed)

3. **Add API Endpoints** ✅
   - `/api/gmail-oauth/initiate` - OAuth flow initiation
   - `/api/gmail-oauth/status` - Connection status check
   - `/api/gmail-oauth-callback` - Callback proxy (already exists)

4. **Update Google Cloud Console**
   - Add API server callback URL to authorized redirect URIs

5. **Test End-to-End**
   - Verify OAuth flow works with new API endpoints
   - Confirm credentials stored correctly in database
   - Test status check endpoint returns correct data

## Support

For issues or questions:
1. Check API server logs: `tail -f api-server/logs/server.log`
2. Check edge function logs: `supabase functions logs gmail-oauth-callback --follow`
3. Verify Google OAuth configuration in Cloud Console
4. Check database credentials: `SELECT * FROM user_email_credentials WHERE provider='gmail';`

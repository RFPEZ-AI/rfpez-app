// Copyright Mark Skiba, 2025 All rights reserved

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Google OAuth client configuration
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!;

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface UserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

/**
 * Gmail OAuth Callback Handler
 * 
 * This edge function handles the OAuth 2.0 callback from Google after user authorization.
 * It exchanges the authorization code for access and refresh tokens, retrieves user profile,
 * and stores the credentials in the database.
 * 
 * Flow:
 * 1. Extract authorization code and state from query params
 * 2. Validate state parameter for CSRF protection
 * 3. Exchange code for tokens via Google OAuth API
 * 4. Retrieve user profile info to confirm email
 * 5. Store/update credentials in user_email_credentials table
 * 6. Redirect user back to app with success/error status
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle authorization denial
    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${url.origin}/settings?gmail_error=${encodeURIComponent(error)}`,
        },
      });
    }

    // Validate required parameters
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Parse state (contains user_id and nonce for CSRF protection)
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      
      if (!userId) {
        throw new Error('Invalid state: missing user_id');
      }
    } catch (e) {
      throw new Error('Invalid state parameter');
    }

    console.log('Processing OAuth callback for user:', userId);

    // Exchange authorization code for tokens
    console.log('Exchanging authorization code for tokens...');
    const tokenResponse = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens: TokenResponse = await tokenResponse.json();
    
    // Validate we got a refresh token (required for offline access)
    if (!tokens.refresh_token) {
      console.warn('No refresh token received - user may need to re-authorize');
    }

    console.log('Tokens received successfully');

    // Retrieve user profile info
    console.log('Fetching user profile...');
    const userInfoResponse = await fetch(OAUTH_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
    }

    const userInfo: UserInfo = await userInfoResponse.json();
    console.log('User profile retrieved:', userInfo.email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store/update credentials in database
    console.log('Storing credentials in database...');
    const { error: dbError } = await supabase
      .from('user_email_credentials')
      .upsert({
        user_id: userId,
        provider: 'gmail',
        email_address: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: expiresAt.toISOString(),
        scopes: tokens.scope.split(' '),
        profile_data: {
          name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          verified_email: userInfo.verified_email,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,email_address',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store credentials: ${dbError.message}`);
    }

    console.log('Credentials stored successfully');

    // Redirect back to app with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${url.origin}/settings?gmail_connected=true&email=${encodeURIComponent(userInfo.email)}`,
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Redirect back to app with error
    const url = new URL(req.url);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${url.origin}/settings?gmail_error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});

// Copyright Mark Skiba, 2025 All rights reserved

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gmail Authentication Service
 * 
 * Provides frontend methods for managing Gmail OAuth authentication.
 * Handles OAuth flow initiation, callback processing, and connection status checking.
 * 
 * OAuth Flow:
 * 1. User clicks "Connect Gmail" button
 * 2. initiateAuth() redirects to Google OAuth consent screen
 * 3. User authorizes access
 * 4. Google redirects to gmail-oauth-callback edge function
 * 5. Edge function exchanges code for tokens and stores in DB
 * 6. User redirected back to app with success/error status
 * 7. handleCallback() processes query params and shows result to user
 */

interface GmailConnectionStatus {
  isConnected: boolean;
  email?: string;
  lastConnected?: Date;
  hasRefreshToken: boolean;
}

export class GmailAuthService {
  private supabase: SupabaseClient;
  private clientId: string;
  private redirectUri: string;

  // OAuth scopes required for email operations
  private static readonly OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    // Reuse existing Google OAuth credentials from authentication setup
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    // Redirect URI should point to the Supabase Edge Function, not the React app
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
    this.redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;

    if (!this.clientId) {
      console.warn('GOOGLE_CLIENT_ID not configured - Gmail integration requires Google OAuth credentials');
    }
  }

  /**
   * Initiate Gmail OAuth flow
   * 
   * Constructs OAuth URL with required parameters and redirects user to Google consent screen.
   * State parameter includes user_id and random nonce for CSRF protection.
   * 
   * @param userId - Current user's ID
   * @throws Error if user is not authenticated or client_id not configured
   */
  async initiateAuth(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User must be authenticated to connect Gmail');
    }

    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Create state parameter with user_id and nonce for CSRF protection
    const state = btoa(JSON.stringify({
      user_id: userId,
      nonce: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    }));

    // Construct OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GmailAuthService.OAUTH_SCOPES);
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
    authUrl.searchParams.set('state', state);

    console.log('Initiating Gmail OAuth flow for user:', userId);
    
    // Redirect to Google OAuth consent screen
    window.location.href = authUrl.toString();
  }

  /**
   * Handle OAuth callback from Gmail connection
   * 
   * Processes query parameters from redirect after OAuth flow completes.
   * Returns status and any error/success messages for display to user.
   * 
   * @returns Object with success status, message, and connected email if successful
   */
  handleCallback(): { success: boolean; message: string; email?: string } {
    const params = new URLSearchParams(window.location.search);
    
    // Check for success
    if (params.get('gmail_connected') === 'true') {
      const email = params.get('email');
      console.log('Gmail connected successfully:', email);
      
      // Clear query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return {
        success: true,
        message: `Gmail account connected successfully: ${email}`,
        email: email || undefined,
      };
    }

    // Check for error
    const error = params.get('gmail_error');
    if (error) {
      console.error('Gmail connection error:', error);
      
      // Clear query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return {
        success: false,
        message: `Failed to connect Gmail: ${decodeURIComponent(error)}`,
      };
    }

    // No callback params present
    return {
      success: false,
      message: '',
    };
  }

  /**
   * Check if user has Gmail connected
   * 
   * Queries database for user's Gmail credentials.
   * Returns connection status including email, last connected date, and refresh token availability.
   * 
   * @param userId - Current user's ID
   * @returns Connection status object
   */
  async isGmailConnected(userId: string): Promise<GmailConnectionStatus> {
    if (!userId) {
      return {
        isConnected: false,
        hasRefreshToken: false,
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_email_credentials')
        .select('email_address, updated_at, refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'gmail')
        .single();

      if (error || !data) {
        return {
          isConnected: false,
          hasRefreshToken: false,
        };
      }

      return {
        isConnected: true,
        email: data.email_address,
        lastConnected: new Date(data.updated_at),
        hasRefreshToken: !!data.refresh_token,
      };
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      return {
        isConnected: false,
        hasRefreshToken: false,
      };
    }
  }

  /**
   * Revoke Gmail access
   * 
   * Removes stored credentials from database.
   * Note: This does NOT revoke the token with Google - user must do that in Google Account settings.
   * 
   * @param userId - Current user's ID
   * @throws Error if revocation fails
   */
  async revokeAccess(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User must be authenticated to revoke Gmail access');
    }

    console.log('Revoking Gmail access for user:', userId);

    const { error } = await this.supabase
      .from('user_email_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'gmail');

    if (error) {
      console.error('Error revoking Gmail access:', error);
      throw new Error(`Failed to revoke Gmail access: ${error.message}`);
    }

    console.log('Gmail access revoked successfully');
  }

  /**
   * Get connection instructions for user
   * 
   * @returns HTML string with instructions for connecting Gmail
   */
  getConnectionInstructions(): string {
    return `
      <h3>Connect Your Gmail Account</h3>
      <p>To enable email capabilities, you'll need to authorize RFPEZ.AI to access your Gmail account.</p>
      <ul>
        <li>Send emails on your behalf</li>
        <li>Read and search your emails</li>
        <li>Access email metadata (from, to, subject, date)</li>
      </ul>
      <p><strong>Your privacy is important:</strong> We only access emails when you explicitly request it through AI agent tools. Your credentials are encrypted and stored securely.</p>
      <p>Click "Connect Gmail" below to begin the authorization process.</p>
    `;
  }

  /**
   * Get reconnection message when refresh token is missing
   * 
   * @returns HTML string with reconnection instructions
   */
  getReconnectionMessage(): string {
    return `
      <h3>Gmail Reconnection Required</h3>
      <p>Your Gmail connection needs to be refreshed. This happens when:</p>
      <ul>
        <li>It's been more than 7 days since you last connected</li>
        <li>You revoked access in your Google Account settings</li>
        <li>The initial authorization didn't complete properly</li>
      </ul>
      <p>Click "Reconnect Gmail" below to restore email capabilities.</p>
    `;
  }
}

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
  private apiBaseUrl: string;

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
    // API server base URL for OAuth endpoints
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  /**
   * Initiate Gmail OAuth flow
   * 
   * Redirects to API endpoint which constructs OAuth URL and redirects to Google consent screen.
   * This keeps OAuth credentials secure on backend and simplifies frontend configuration.
   * 
   * @param userId - Current user's ID
   * @throws Error if user is not authenticated
   */
  async initiateAuth(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User must be authenticated to connect Gmail');
    }

    console.log('Initiating Gmail OAuth flow for user:', userId);
    
    // Redirect to API endpoint which handles OAuth initiation
    window.location.href = `${this.apiBaseUrl}/api/gmail-oauth/initiate?user_id=${userId}`;
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
   * Calls API endpoint to check if user has Gmail credentials stored.
   * Returns connection status including email and last connected date.
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
      const response = await fetch(`${this.apiBaseUrl}/api/gmail-oauth/status?user_id=${userId}`);
      
      if (!response.ok) {
        console.error('Gmail status check failed:', response.statusText);
        return {
          isConnected: false,
          hasRefreshToken: false,
        };
      }

      const data = await response.json();

      return {
        isConnected: data.isConnected || false,
        email: data.email,
        lastConnected: data.lastConnected ? new Date(data.lastConnected) : undefined,
        hasRefreshToken: data.isConnected, // If connected, assume we have refresh token
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

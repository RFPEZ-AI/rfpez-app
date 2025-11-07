// Copyright Mark Skiba, 2025 All rights reserved
// Gmail API service using native fetch (no googleapis dependency)
// This avoids the google-logging-utils compatibility issue with Deno

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
}

export interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    mimeType: string;
  }>;
}

export interface EmailCredentials {
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  email_address: string;
}

export class GmailFetchService {
  private supabase: SupabaseClient;
  private userId: string;
  private accessToken: string | null = null;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Load user credentials from database
   */
  async loadCredentials(): Promise<EmailCredentials> {
    console.log(`📧 Loading Gmail credentials for user: ${this.userId}`);
    
    const { data: credentials, error } = await this.supabase
      .from('user_email_credentials')
      .select('*')
      .eq('user_id', this.userId)
      .eq('provider', 'gmail')
      .single();

    if (error || !credentials) {
      console.error('❌ Gmail credentials not found:', error);
      throw new Error('Gmail credentials not found. User must authorize Gmail access first.');
    }

    // Check if token needs refresh
    const now = new Date();
    const tokenExpiry = new Date(credentials.token_expiry);

    console.log(`🔍 Token expiry check: ${tokenExpiry.toISOString()} vs now: ${now.toISOString()}`);

    if (now >= tokenExpiry) {
      console.log('🔄 Token expired, refreshing...');
      const newCreds = await this.refreshAccessToken(credentials.refresh_token);
      
      // Update database with new tokens
      await this.supabase
        .from('user_email_credentials')
        .update({
          access_token: newCreds.access_token,
          token_expiry: new Date(Date.now() + newCreds.expires_in * 1000),
          updated_at: new Date()
        })
        .eq('user_id', this.userId)
        .eq('provider', 'gmail');

      this.accessToken = newCreds.access_token;
      return {
        ...credentials,
        access_token: newCreds.access_token,
        token_expiry: new Date(Date.now() + newCreds.expires_in * 1000).toISOString()
      };
    }

    this.accessToken = credentials.access_token;
    return credentials;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const body = new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return await response.json();
  }

  /**
   * Create a MIME message from email parameters
   */
  private createMimeMessage(message: EmailMessage): string {
    const boundary = '----=_Part_' + Date.now();
    let mime = '';

    // Add headers
    mime += `To: ${message.to.join(', ')}\r\n`;
    if (message.cc && message.cc.length > 0) {
      mime += `Cc: ${message.cc.join(', ')}\r\n`;
    }
    if (message.bcc && message.bcc.length > 0) {
      mime += `Bcc: ${message.bcc.join(', ')}\r\n`;
    }
    if (message.from) {
      mime += `From: ${message.from}\r\n`;
    }
    mime += `Subject: ${message.subject}\r\n`;
    mime += `MIME-Version: 1.0\r\n`;

    if (message.attachments && message.attachments.length > 0) {
      // Multipart message with attachments
      mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Message body part
      mime += `--${boundary}\r\n`;
      if (message.bodyHtml) {
        mime += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
        mime += `${message.bodyHtml}\r\n\r\n`;
      } else {
        mime += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
        mime += `${message.bodyText || ''}\r\n\r\n`;
      }

      // Attachments
      for (const attachment of message.attachments) {
        mime += `--${boundary}\r\n`;
        mime += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
        mime += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        mime += `Content-Transfer-Encoding: base64\r\n\r\n`;
        mime += `${attachment.content}\r\n\r\n`;
      }

      mime += `--${boundary}--`;
    } else {
      // Simple message without attachments
      if (message.bodyHtml) {
        mime += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
        mime += message.bodyHtml;
      } else {
        mime += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
        mime += message.bodyText || '';
      }
    }

    return mime;
  }

  /**
   * Send an email using Gmail API
   */
  async sendEmail(message: EmailMessage): Promise<{ id: string; threadId: string }> {
    if (!this.accessToken) {
      await this.loadCredentials();
    }

    console.log(`📧 SEND_EMAIL: Preparing to send email to: ${message.to.join(', ')}`);

    // Always use agent@rfpez.ai as the "from" address
    message.from = 'RFPEZ Agent <agent@rfpez.ai>';
    console.log(`📧 SEND_EMAIL: Using from address: ${message.from}`);

    // Create MIME message
    const mimeMessage = this.createMimeMessage(message);
    
    // Encode as base64url (RFC 4648) with proper UTF-8 support
    // Use TextEncoder for UTF-8 encoding instead of btoa which only handles Latin1
    const encoder = new TextEncoder();
    const data = encoder.encode(mimeMessage);
    const base64 = btoa(String.fromCharCode(...data));
    const encodedMessage = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to send email:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully! Message ID: ${result.id}`);

    return {
      id: result.id,
      threadId: result.threadId
    };
  }

  /**
   * Get a list of messages matching the search criteria
   */
  async listMessages(params: {
    query?: string;
    maxResults?: number;
    labelIds?: string[];
  } = {}): Promise<Array<{ id: string; threadId: string }>> {
    if (!this.accessToken) {
      await this.loadCredentials();
    }

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('q', params.query);
    if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
    if (params.labelIds) {
      params.labelIds.forEach(labelId => queryParams.append('labelIds', labelId));
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list messages: ${error}`);
    }

    const result = await response.json();
    return result.messages || [];
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    if (!this.accessToken) {
      await this.loadCredentials();
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get message: ${error}`);
    }

    return await response.json();
  }

  /**
   * Alias for getMessage - for compatibility
   */
  async getEmail(messageId: string): Promise<GmailMessage> {
    return await this.getMessage(messageId);
  }

  /**
   * Search for emails matching a query
   */
  async searchEmails(params: {
    query?: string;
    maxResults?: number;
    after?: Date;
    before?: Date;
  }): Promise<Array<{ id: string; threadId: string }>> {
    let query = params.query || '';
    
    if (params.after) {
      const afterStr = Math.floor(params.after.getTime() / 1000);
      query += ` after:${afterStr}`;
    }
    
    if (params.before) {
      const beforeStr = Math.floor(params.before.getTime() / 1000);
      query += ` before:${beforeStr}`;
    }

    return await this.listMessages({
      query: query.trim(),
      maxResults: params.maxResults
    });
  }

  /**
   * List emails with optional filters - alias for compatibility
   */
  async listEmails(maxResults?: number, labelIds?: string[]): Promise<Array<{ id: string; threadId: string }>> {
    return await this.listMessages({
      maxResults,
      labelIds
    });
  }
}

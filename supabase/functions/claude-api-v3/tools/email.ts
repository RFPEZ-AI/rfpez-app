// Copyright Mark Skiba, 2025 All rights reserved
// Email tool handlers

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { GmailFetchService } from '../services/gmail-fetch.ts';
import type { ToolResult } from '../types.ts';

/**
 * Gmail message header interface
 */
interface GmailHeader {
  name: string;
  value: string;
}

/**
 * Helper function to check if an email belongs to a registered user
 */
async function isRegisteredUser(supabase: SupabaseClient, email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    return !error && data !== null;
  } catch (error) {
    console.warn(`Failed to check if ${email} is registered:`, error);
    return false;
  }
}

/**
 * Helper function to get the sender's email address
 */
async function getSenderEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('supabase_user_id', userId)
      .single();
    
    if (error || !data?.email) {
      console.warn('Failed to get sender email:', error);
      return null;
    }
    
    return data.email;
  } catch (error) {
    console.warn('Error fetching sender email:', error);
    return null;
  }
}

export async function sendEmail(
  supabase: SupabaseClient,
  userId: string,
  data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body_text: string;
    body_html?: string;
    session_id?: string;
    rfp_id?: number;
    agent_id?: string;
  }
): Promise<ToolResult> {
  try {
    console.log('📧 SEND_EMAIL tool executing');
    
    const emailDevMode = Deno.env.get('EMAIL_DEV_MODE') === 'true';
    
    const originalRecipients = [...data.to];
    let recipientsToUse = [...data.to];
    let devModeActive = false;
    let redirectedRecipients: string[] = [];
    
    // Apply development mode routing if enabled
    if (emailDevMode) {
      console.log('🔒 EMAIL_DEV_MODE is enabled, checking recipients...');
      
      const senderEmail = await getSenderEmail(supabase, userId);
      const registeredChecks = await Promise.all(
        data.to.map(async (email) => ({
          email,
          isRegistered: await isRegisteredUser(supabase, email)
        }))
      );
      
      // Filter out non-registered recipients for redirection
      const nonRegisteredRecipients = registeredChecks
        .filter(r => !r.isRegistered)
        .map(r => r.email);
      
      if (nonRegisteredRecipients.length > 0 && senderEmail) {
        devModeActive = true;
        redirectedRecipients = nonRegisteredRecipients;
        
        // Replace non-registered recipients with sender's email
        recipientsToUse = [
          ...registeredChecks.filter(r => r.isRegistered).map(r => r.email),
          senderEmail
        ];
        
        // Prepend development mode notice to email body
        const devNotice = `
⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️
This email was originally intended for: ${nonRegisteredRecipients.join(', ')}

In development mode, all emails to non-registered users are routed back to you for review.

---ORIGINAL EMAIL BELOW---

`;
        
        data.body_text = devNotice + data.body_text;
        if (data.body_html) {
          data.body_html = `<div style="background-color: #fff3cd; border: 2px solid #856404; padding: 10px; margin-bottom: 15px;">
<p style="margin: 0; color: #856404;"><strong>⚠️ DEVELOPMENT MODE ROUTING NOTICE ⚠️</strong></p>
<p style="margin: 5px 0 0 0; font-size: 14px;">This email was originally intended for: <strong>${nonRegisteredRecipients.join(', ')}</strong><br>
In development mode, all emails to non-registered users are routed back to you for review.</p>
<hr style="margin: 10px 0;">
<p style="margin: 0; font-size: 14px;"><strong>---ORIGINAL EMAIL BELOW---</strong></p>
</div>` + data.body_html;
        }
        
        console.log(`📧 DEV MODE: Redirecting ${nonRegisteredRecipients.length} non-registered recipient(s) to ${senderEmail}`);
      }
    }
    
    const gmailService = new GmailFetchService(supabase, userId);

    const result = await gmailService.sendEmail({
      to: recipientsToUse,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      bodyText: data.body_text,
      bodyHtml: data.body_html
    });

    const senderEmail = devModeActive ? await getSenderEmail(supabase, userId) : null;
    const registeredRecipients = devModeActive 
      ? recipientsToUse.filter(e => !redirectedRecipients.includes(e) && e !== senderEmail)
      : [];
    
    const successMessage = devModeActive
      ? `✅ Email sent with DEVELOPMENT MODE routing:\n` +
        `- Sent to registered users: ${registeredRecipients.join(', ') || 'none'}\n` +
        `- Redirected to you (non-registered): ${redirectedRecipients.join(', ')}\n` +
        `Subject: "${data.subject}"`
      : `✅ Email sent successfully to ${data.to.join(', ')} with subject: "${data.subject}"`;

    return {
      success: true,
      data: {
        message_id: result.id,
        thread_id: result.threadId,
        sent_to: recipientsToUse,
        original_recipients: devModeActive ? originalRecipients : undefined,
        redirected_recipients: devModeActive ? redirectedRecipients : undefined,
        dev_mode_active: devModeActive,
        subject: data.subject,
        sent_at: new Date().toISOString()
      },
      message: successMessage
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('credentials not found') || 
                        errorMessage.includes('authorize');
    
    return {
      success: false,
      error: errorMessage,
      message: isAuthError 
        ? '⚠️ Gmail not connected. User must authorize Gmail access first. Please ask them to connect Gmail in Settings.'
        : `❌ Failed to send email: ${errorMessage}`
    };
  }
}

export async function searchEmails(
  supabase: SupabaseClient,
  userId: string,
  data: {
    query: string;
    max_results?: number;
    after_date?: string;
    before_date?: string;
  }
): Promise<ToolResult> {
  try {
    console.log('🔍 SEARCH_EMAILS tool executing');
    
    const gmailService = new GmailFetchService(supabase, userId);

    const searchParams = {
      query: data.query,
      maxResults: data.max_results || 20,
      after: data.after_date ? new Date(data.after_date) : undefined,
      before: data.before_date ? new Date(data.before_date) : undefined
    };

    const emails = await gmailService.searchEmails(searchParams);

    // Fetch full details for each email (up to limit)
    const emailDetails = [];
    for (const email of emails.slice(0, 10)) { // Limit to 10 full emails
      try {
        const fullEmail = await gmailService.getEmail(email.id);
        emailDetails.push({
          id: fullEmail.id,
          threadId: fullEmail.threadId,
          snippet: fullEmail.snippet,
          subject: fullEmail.payload?.headers?.find((h: GmailHeader) => h.name === 'Subject')?.value,
          from: fullEmail.payload?.headers?.find((h: GmailHeader) => h.name === 'From')?.value,
          date: fullEmail.payload?.headers?.find((h: GmailHeader) => h.name === 'Date')?.value,
          labelIds: fullEmail.labelIds
        });
      } catch (e) {
        console.error(`Failed to fetch email ${email.id}:`, e);
      }
    }

    return {
      success: true,
      data: {
        emails: emailDetails,
        total_found: emails.length,
        showing: emailDetails.length,
        query: data.query
      },
      message: `✅ Found ${emails.length} email(s) matching "${data.query}". Showing details for ${emailDetails.length}.`
    };
  } catch (error) {
    console.error('❌ Email search error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('credentials not found') || 
                        errorMessage.includes('authorize');
    
    return {
      success: false,
      error: errorMessage,
      message: isAuthError 
        ? '⚠️ Gmail not connected. User must authorize Gmail access first.'
        : `❌ Failed to search emails: ${errorMessage}`
    };
  }
}

export async function getEmail(
  supabase: SupabaseClient,
  userId: string,
  data: { message_id: string }
): Promise<ToolResult> {
  try {
    console.log('📥 GET_EMAIL tool executing');
    
    const gmailService = new GmailFetchService(supabase, userId);
    const email = await gmailService.getEmail(data.message_id);

    // Extract relevant email information
    const headers = email.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: GmailHeader) => h.name === name)?.value;

    return {
      success: true,
      data: {
        id: email.id,
        threadId: email.threadId,
        snippet: email.snippet,
        subject: getHeader('Subject'),
        from: getHeader('From'),
        to: getHeader('To'),
        cc: getHeader('Cc'),
        date: getHeader('Date'),
        labelIds: email.labelIds,
        body: email.snippet // TODO: Extract full body from payload
      },
      message: `✅ Retrieved email from ${getHeader('From')}: "${getHeader('Subject')}"`
    };
  } catch (error) {
    console.error('❌ Get email error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      error: errorMessage,
      message: `❌ Failed to retrieve email: ${errorMessage}`
    };
  }
}

export async function listRecentEmails(
  supabase: SupabaseClient,
  userId: string,
  data: { max_results?: number; label_ids?: string[] }
): Promise<ToolResult> {
  try {
    console.log('📬 LIST_RECENT_EMAILS tool executing');
    
    const gmailService = new GmailFetchService(supabase, userId);
    const emails = await gmailService.listEmails(data.max_results || 50, data.label_ids);

    // Fetch details for first 10 emails
    const emailDetails = [];
    for (const email of emails.slice(0, 10)) {
      try {
        const fullEmail = await gmailService.getEmail(email.id);
        const headers = fullEmail.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: GmailHeader) => h.name === name)?.value;
        
        emailDetails.push({
          id: fullEmail.id,
          threadId: fullEmail.threadId,
          snippet: fullEmail.snippet,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          date: getHeader('Date'),
          unread: fullEmail.labelIds?.includes('UNREAD')
        });
      } catch (e) {
        console.error(`Failed to fetch email ${email.id}:`, e);
      }
    }

    return {
      success: true,
      data: {
        emails: emailDetails,
        total: emails.length,
        showing: emailDetails.length
      },
      message: `✅ Retrieved ${emails.length} recent email(s). Showing details for ${emailDetails.length}.`
    };
  } catch (error) {
    console.error('❌ List emails error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = errorMessage.includes('credentials not found') || 
                        errorMessage.includes('authorize');
    
    return {
      success: false,
      error: errorMessage,
      message: isAuthError 
        ? '⚠️ Gmail not connected. User must authorize Gmail access first.'
        : `❌ Failed to list emails: ${errorMessage}`
    };
  }
}

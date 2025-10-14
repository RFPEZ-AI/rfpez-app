// Copyright Mark Skiba, 2025 All rights reserved

import { RFP } from '../types/rfp';

/**
 * Generate an auto-prompt to notify the agent about RFP context change
 * This allows the agent to provide contextually appropriate suggestions
 */
export function generateRFPContextChangePrompt(
  newRfp: RFP,
  previousRfp: RFP | null,
  hasMessagesInCurrentSession: boolean
): string {
  const promptParts: string[] = [];

  // Start with context change notification
  if (previousRfp) {
    promptParts.push(
      `[SYSTEM NOTIFICATION: RFP context changed from "${previousRfp.name}" to "${newRfp.name}"]`
    );
  } else {
    promptParts.push(
      `[SYSTEM NOTIFICATION: RFP context set to "${newRfp.name}"]`
    );
  }

  // Add RFP details
  promptParts.push(`\nCurrent RFP Details:`);
  promptParts.push(`- Name: ${newRfp.name}`);
  if (newRfp.description && newRfp.description !== 'No description provided') {
    promptParts.push(`- Description: ${newRfp.description}`);
  }
  if (newRfp.due_date) {
    promptParts.push(`- Due Date: ${newRfp.due_date}`);
  }

  // Add session context and suggested actions
  promptParts.push(`\nSession Status: ${hasMessagesInCurrentSession ? 'Active conversation in progress' : 'New or empty session'}`);
  
  promptParts.push(
    `\nPlease review your agent instructions for how to handle RFP context changes. ` +
    `You may want to ask the user if they would like to:`
  );
  promptParts.push(`1. Continue working with this RFP in the current session`);
  promptParts.push(`2. Switch to the last session that was working with this RFP`);
  promptParts.push(`3. Create a new session specifically for this RFP`);
  
  promptParts.push(`\nProvide appropriate guidance based on the user's workflow and the current session state.`);

  return promptParts.join('\n');
}

/**
 * Check if an auto-prompt should be sent based on session state
 */
export function shouldSendRFPContextChangePrompt(
  hasMessagesInCurrentSession: boolean,
  isUserInitiatedChange: boolean
): boolean {
  // Always send notification if user explicitly changes RFP via UI
  if (isUserInitiatedChange) {
    return true;
  }

  // For automatic changes (like session restore), only notify if there's an active conversation
  return hasMessagesInCurrentSession;
}

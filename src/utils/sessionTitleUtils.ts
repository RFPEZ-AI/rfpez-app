// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Utility functions for generating meaningful session titles
 */

/**
 * Generate a session title from the first user message
 * @param content The user's message content
 * @returns A meaningful session title
 */
export function generateSessionTitleFromMessage(content: string): string {
  if (!content || content.trim().length === 0) {
    return 'Chat Session';
  }

  // Clean the content - normalize whitespace
  const trimmed = content.trim().replace(/\s+/g, ' ');
  
  // If it's short enough, use as-is
  if (trimmed.length <= 50) {
    return trimmed;
  }
  
  // For longer messages, try to find a good breaking point
  const sentences = trimmed.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence;
  }
  
  // If first sentence is too long, find a good word boundary
  const words = trimmed.split(/\s+/);
  let title = '';
  
  for (const word of words) {
    const potential = title ? `${title} ${word}` : word;
    if (potential.length > 47) { // Leave room for ellipsis
      break;
    }
    title = potential;
  }
  
  return title ? `${title}...` : trimmed.substring(0, 47) + '...';
}

/**
 * Generate a session title based on RFP name
 * @param rfpName The name of the RFP
 * @returns A session title incorporating the RFP name
 */
export function generateSessionTitleFromRfp(rfpName: string): string {
  if (!rfpName || rfpName.trim().length === 0) {
    return 'RFP Session';
  }

  const trimmed = rfpName.trim();
  
  // If RFP name is short enough, use it directly
  if (trimmed.length <= 50) {
    return trimmed;
  }
  
  // For longer RFP names, truncate intelligently
  const words = trimmed.split(/\s+/);
  let title = '';
  
  for (const word of words) {
    const potential = title ? `${title} ${word}` : word;
    if (potential.length > 47) { // Leave room for ellipsis
      break;
    }
    title = potential;
  }
  
  return title ? `${title}...` : trimmed.substring(0, 47) + '...';
}

/**
 * Determine if a session title should be updated based on the current title
 * @param currentTitle Current session title
 * @returns true if the title appears to be a default/generic title that should be updated
 */
export function shouldUpdateSessionTitle(currentTitle: string | null | undefined): boolean {
  if (!currentTitle) return true;
  
  const trimmed = currentTitle.trim().toLowerCase();
  
  const genericPatterns = [
    'new session',
    'chat session', 
    'untitled session',
    'session',
    'new chat',
    'just now chat session',
    ''
  ];
  
  return genericPatterns.includes(trimmed);
}
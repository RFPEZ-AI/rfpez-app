// Copyright Mark Skiba, 2025 All rights reserved

// Utility script to manually add test IDs to specific components
// This complements the automatic decorator by adding permanent test attributes

export const TEST_IDS = {
  // Main navigation and menus
  MAIN_MENU_BUTTON: 'btn-main-menu',
  USER_PROFILE_BUTTON: 'btn-user-profile',
  AGENT_SELECTOR: 'btn-agent-selector',
  RFP_MENU_BUTTON: 'btn-rfp-menu',
  
  // Session management
  NEW_SESSION_BUTTON: 'btn-new-session',
  DELETE_SESSION_BUTTON: 'btn-delete-session',
  SESSION_ITEM: 'item-session',
  
  // RFP management
  NEW_RFP_BUTTON: 'btn-new-rfp',
  EDIT_RFP_BUTTON: 'btn-edit-rfp',
  DELETE_RFP_BUTTON: 'btn-delete-rfp',
  PREVIEW_RFP_BUTTON: 'btn-preview-rfp',
  SHARE_RFP_BUTTON: 'btn-share-rfp',
  
  // Agent management
  SWITCH_AGENT_BUTTON: 'btn-switch-agent',
  NEW_AGENT_BUTTON: 'btn-new-agent',
  EDIT_AGENT_BUTTON: 'btn-edit-agent',
  DELETE_AGENT_BUTTON: 'btn-delete-agent',
  
  // Message and chat
  MESSAGE_INPUT: 'input-message',
  SEND_MESSAGE_BUTTON: 'btn-send-message',
  CLEAR_CHAT_BUTTON: 'btn-clear-chat',
  
  // Forms and modals
  SAVE_BUTTON: 'btn-save',
  CANCEL_BUTTON: 'btn-cancel',
  CLOSE_BUTTON: 'btn-close',
  SUBMIT_BUTTON: 'btn-submit',
  
  // Artifacts and attachments
  VIEW_ARTIFACTS_BUTTON: 'btn-view-artifacts',
  ATTACH_ARTIFACT_BUTTON: 'btn-attach-artifact',
  DOWNLOAD_ARTIFACT_BUTTON: 'btn-download-artifact',
  
  // Debug and development
  DEBUG_TOGGLE: 'debug-toggle',
  REFRESH_DECORATIONS: 'btn-refresh-decorations'
} as const;

// Helper function to add test attributes to an element
export const addTestAttributes = (element: Element, testId: string, type?: string, label?: string) => {
  element.setAttribute('data-test-id', testId);
  if (type) element.setAttribute('data-test-type', type);
  if (label) element.setAttribute('data-test-label', label);
  element.setAttribute('data-test-automated', 'true');
};

// Function to apply test IDs to common selectors
export const applyCommonTestIds = () => {
  console.log('🔧 Applying common test IDs...');
  
  // Menu buttons
  const menuButtons = document.querySelectorAll('ion-menu-button, [role="menubutton"]');
  menuButtons.forEach((btn, index) => {
    if (!btn.getAttribute('data-test-id')) {
      addTestAttributes(btn, index === 0 ? TEST_IDS.MAIN_MENU_BUTTON : `menu-btn-${index}`, 'button', 'Menu');
    }
  });
  
  // User profile buttons (typically in header)
  const userButtons = document.querySelectorAll('ion-button[fill="clear"]:has(ion-avatar), .user-button');
  userButtons.forEach(btn => {
    if (!btn.getAttribute('data-test-id')) {
      addTestAttributes(btn, TEST_IDS.USER_PROFILE_BUTTON, 'button', 'User Profile');
    }
  });
  
  // Session items (typically ion-card or ion-item)
  const sessionItems = document.querySelectorAll('ion-card:has([class*="time"]), ion-item:has([class*="session"])');
  sessionItems.forEach((item, index) => {
    if (!item.getAttribute('data-test-id')) {
      addTestAttributes(item, `${TEST_IDS.SESSION_ITEM}-${index}`, 'session', `Session ${index + 1}`);
    }
  });
  
  // Message input
  const messageInputs = document.querySelectorAll('ion-textarea, textarea[placeholder*="message" i]');
  messageInputs.forEach(input => {
    if (!input.getAttribute('data-test-id')) {
      addTestAttributes(input, TEST_IDS.MESSAGE_INPUT, 'input', 'Message Input');
    }
  });
  
  // Send buttons
  const sendButtons = document.querySelectorAll('ion-button:has(ion-icon[name="send"]), button:has([name="send"])');
  sendButtons.forEach(btn => {
    if (!btn.getAttribute('data-test-id')) {
      addTestAttributes(btn, TEST_IDS.SEND_MESSAGE_BUTTON, 'button', 'Send Message');
    }
  });
  
  console.log('✅ Common test IDs applied');
};

// Function to scan and report all elements with test IDs
export const scanTestElements = () => {
  const elements = document.querySelectorAll('[data-test-id]');
  const report = Array.from(elements).map((el, index) => ({
    index,
    testId: el.getAttribute('data-test-id'),
    type: el.getAttribute('data-test-type') || 'unknown',
    tag: el.tagName.toLowerCase(),
    text: el.textContent?.trim().substring(0, 30) || '',
    automated: el.getAttribute('data-test-automated') === 'true'
  }));
  
  console.table(report);
  return report;
};

// Auto-apply common test IDs when DOM is ready
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const autoApply = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyCommonTestIds);
    } else {
      applyCommonTestIds();
    }
  };
  
  // Apply immediately and on navigation
  autoApply();
  
  // Re-apply when DOM changes significantly
  let applyTimeout: NodeJS.Timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(applyTimeout);
    applyTimeout = setTimeout(applyCommonTestIds, 500);
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Expose functions globally for console access
  (window as any).scanTestElements = scanTestElements;
  (window as any).applyCommonTestIds = applyCommonTestIds;
}

export default { TEST_IDS, addTestAttributes, applyCommonTestIds, scanTestElements };
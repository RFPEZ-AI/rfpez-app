// Copyright Mark Skiba, 2025 All rights reserved

/* eslint-disable @typescript-eslint/no-empty-function */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ionicons for tests
jest.mock('ionicons/icons', () => ({
  warningOutline: 'warning-outline',
  timeOutline: 'time-outline', 
  checkmarkCircleOutline: 'checkmark-circle-outline',
  menuOutline: 'menu-outline',
  personOutline: 'person-outline',
  logOutOutline: 'log-out-outline',
  settingsOutline: 'settings-outline',
  helpCircleOutline: 'help-circle-outline',
  checkmarkOutline: 'checkmark-outline',
  closeOutline: 'close-outline',
  addOutline: 'add-outline',
  documentTextOutline: 'document-text-outline',
  folderOutline: 'folder-outline',
  searchOutline: 'search-outline',
  downloadOutline: 'download-outline',
  shareOutline: 'share-outline',
  heartOutline: 'heart-outline',
  starOutline: 'star-outline',
  thumbsUpOutline: 'thumbs-up-outline',
  chatbubbleOutline: 'chatbubble-outline',
  notificationsOutline: 'notifications-outline',
  mailOutline: 'mail-outline',
  callOutline: 'call-outline',
  locationOutline: 'location-outline',
  calendarOutline: 'calendar-outline',
  cameraOutline: 'camera-outline',
  imageOutline: 'image-outline',
  playOutline: 'play-outline',
  pauseOutline: 'pause-outline',
  stopOutline: 'stop-outline',
  volumeHighOutline: 'volume-high-outline',
  volumeLowOutline: 'volume-low-outline',
  volumeMuteOutline: 'volume-mute-outline',
}));

// Mock matchmedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Also mock it on the global object for Ionic
global.matchMedia = window.matchMedia;

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock getComputedStyle for Ionic components
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue(''),
    width: '1024px',
    height: '768px',
  })),
});

// Mock screen for responsive breakpoints
Object.defineProperty(window, 'screen', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
  },
});

// Configure Jest to be more tolerant of async operations
jest.setTimeout(15000);

// Note: Punycode deprecation warnings from dependencies are expected and can be ignored

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Enhanced console filtering
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args.join(' ');
    
    // Filter out known test-specific errors that are expected
    const filteredMessages = [
      'Warning: An update to',
      'act(...)',
      'Warning: ReactDOM.render is no longer supported',
      'Warning: An invalid form control',
      'Warning: validateDOMNesting',
      'Error fetching active agents: { message: \'Database error\' }',
      'Error fetching default agent: { message: \'No default agent\' }',
      'Error submitting bid: Error: Submission failed',
      'TypeError: Cannot read properties of undefined (reading \'matches\')',
      'matchBreakpoint',
      'ion-col.js',
      'stencil/core',
      'callRender',
      'Element type is invalid',
      'SimpleRateLimitStatus',
      'mixed up default and named imports',
      'RateLimitStatus.tsx'
    ];
    
    if (filteredMessages.some(filter => message.includes(filter))) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(' ');
    
    // Filter out Ionic warnings that we've addressed
    const filteredWarnings = [
      '[Ionic Warning]',
      'ion-textarea now requires',
      'ion-input now requires',
      'ion-toggle now requires',
      '[Ionicons Warning]',
      'Could not load icon with name',
      'Ensure that the icon is registered',
      // RJSF (React JSON Schema Form) library warnings
      'TextareaWidget: Support for defaultProps will be removed',
      'Support for defaultProps will be removed from function components'
    ];
    
    if (filteredWarnings.some(filter => message.includes(filter))) {
      return;
    }
    originalConsoleWarn(...args);
  };

  // Mock console.log for cleaner test output but allow specific logs
  console.log = (...args: unknown[]) => {
    const message = args.join(' ');
    
    // Allow some important logs to show through
    const allowedLogs = [
      '🔧 MCPClient initialized',
      'Production environment variables check',
      'Creating Supabase client'
    ];
    
    if (allowedLogs.some(allowed => message.includes(allowed))) {
      originalConsoleLog(...args);
    }
    // Otherwise suppress the log
  };
});

// Minimal cleanup after each test
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Clean up DOM
  document.body.innerHTML = '';
});

// Global cleanup after all tests
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

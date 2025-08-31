// Copyright Mark Skiba, 2025 All rights reserved

/* eslint-disable @typescript-eslint/no-empty-function */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = jest.fn();

// Configure Jest to be more tolerant of async operations
jest.setTimeout(15000);

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Enhanced console filtering
beforeAll(() => {
  console.error = (...args: any[]) => {
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
      'Error submitting bid: Error: Submission failed'
    ];
    
    if (filteredMessages.some(filter => message.includes(filter))) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filter out Ionic warnings that we've addressed
    const filteredWarnings = [
      '[Ionic Warning]',
      'ion-textarea now requires',
      'ion-input now requires',
      'ion-toggle now requires'
    ];
    
    if (filteredWarnings.some(filter => message.includes(filter))) {
      return;
    }
    originalConsoleWarn(...args);
  };

  // Mock console.log for cleaner test output but allow specific logs
  console.log = (...args: any[]) => {
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

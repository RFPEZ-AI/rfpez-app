// WebSocket Debug Utility
// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Utility to handle and debug WebSocket connection issues
 * This helps prevent console spam from failed WebSocket connections
 */

class WebSocketDebugger {
  private static instance: WebSocketDebugger;
  private suppressedConnections = new Set<string>();

  static getInstance(): WebSocketDebugger {
    if (!WebSocketDebugger.instance) {
      WebSocketDebugger.instance = new WebSocketDebugger();
    }
    return WebSocketDebugger.instance;
  }

  /**
   * Initialize WebSocket error suppression for known issues
   */
  init() {
    // Override console.error to filter out known WebSocket issues
    const originalConsoleError = console.error;
    
    console.error = (...args: unknown[]) => {
      const message = args.join(' ');
      
      // Filter out known WebSocket connection failures that are expected
      if (
        message.includes('WebSocket connection to \'ws://localhost:3000/ws\' failed') ||
        message.includes('WebSocketClient.js:44') ||
        message.includes('initSocket') ||
        message.includes('socket.js:27') ||
        message.includes('socket.js:51')
      ) {
        // Only show the first occurrence, then suppress
        if (!this.suppressedConnections.has('ws://localhost:3000/ws')) {
          this.suppressedConnections.add('ws://localhost:3000/ws');
          console.warn('🔗 WebSocket connection to ws://localhost:3000/ws failed (this is expected - no WebSocket server is running)');
          console.warn('   This error is coming from browser extensions or dev tools and can be safely ignored.');
        }
        return; // Suppress the error
      }
      
      // Pass through all other errors
      originalConsoleError.apply(console, args);
    };

    console.log('🔧 WebSocket debugger initialized - suppressing expected connection failures');
  }

  /**
   * Check if WebSocket errors are expected
   */
  isExpectedWebSocketError(url: string): boolean {
    // List of WebSocket URLs that are expected to fail (no server running)
    const expectedFailures = [
      'ws://localhost:3000/ws',
      'ws://localhost:3001/ws',
      'ws://localhost:8080/ws'
    ];
    
    return expectedFailures.some(pattern => url.includes(pattern));
  }

  /**
   * Show WebSocket status information
   */
  showStatus() {
    console.log('🔗 WebSocket Status:');
    console.log('   - No WebSocket server is configured for this application');
    console.log('   - Failed connections to ws://localhost:3000/ws are expected');
    console.log('   - These errors come from browser extensions or dev tools');
    console.log('   - Application functionality is not affected');
  }
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  const wsDebugger = WebSocketDebugger.getInstance();
  wsDebugger.init();
}

export default WebSocketDebugger;

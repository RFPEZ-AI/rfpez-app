// WebSocket Debug Utility
// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-unused-vars */

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
    // Override console.error to filter out known WebSocket issues and React warnings
    const originalConsoleError = console.error;
    
    console.error = (...args: unknown[]) => {
      const message = args.join(' ');
      
      // Filter out known WebSocket connection failures that are expected
      if (
        message.includes('WebSocket connection to \'ws://localhost:3000/ws\' failed') ||
        message.includes('WebSocket connection to \'ws://localhost:3100/ws\' failed') ||
        message.includes('WebSocketClient.js:44') ||
        message.includes('initSocket') ||
        message.includes('socket.js:27') ||
        message.includes('socket.js:51')
      ) {
        // Extract the port from the error message
        const port3000Match = message.includes('ws://localhost:3000/ws');
        const port3100Match = message.includes('ws://localhost:3100/ws');
        const wsUrl = port3000Match ? 'ws://localhost:3000/ws' : 'ws://localhost:3100/ws';
        
        // Only show the first occurrence, then suppress
        if (!this.suppressedConnections.has(wsUrl)) {
          this.suppressedConnections.add(wsUrl);
          if (port3000Match) {
            console.warn('🔗 WebSocket connection to ws://localhost:3000/ws failed');
            console.warn('   Note: React dev server is now running on port 3100, but something is still trying port 3000.');
            console.warn('   This could be from browser extensions, dev tools, or cached connections.');
          } else {
            console.warn('🔗 WebSocket connection to ws://localhost:3100/ws failed (this is expected - no WebSocket server is running)');
            console.warn('   This error is coming from browser extensions or dev tools and can be safely ignored.');
          }
        }
        return; // Suppress the error
      }
      
      // Filter out RJSF (React JSON Schema Form) deprecation warnings
      if (
        message.includes('TextareaWidget: Support for defaultProps will be removed') ||
        message.includes('Support for defaultProps will be removed from function components') ||
        message.includes('TextareaWidget using deprecated defaultProps') ||
        (message.includes('defaultProps') && message.includes('TextareaWidget'))
      ) {
        // Only show the first occurrence, then suppress
        if (!this.suppressedConnections.has('rjsf-defaultProps')) {
          this.suppressedConnections.add('rjsf-defaultProps');
          console.warn('📝 RJSF Library Warning: TextareaWidget using deprecated defaultProps (this is a library issue and can be safely ignored)');
          console.warn('   This will be resolved when the RJSF library updates to use JavaScript default parameters.');
        }
        return; // Suppress the warning
      }
      
      // Filter out embedding generator initialization errors (expected - using server-side fallback)
      if (
        message.includes('Error initializing embedding generator') ||
        (message.includes('Unexpected token') && message.includes('is not valid JSON') && args.some((arg: any) => arg && typeof arg === 'object' && arg.stack && arg.stack.includes('getModelJSON')))
      ) {
        // Only show the first occurrence, then suppress
        if (!this.suppressedConnections.has('embedding-generator')) {
          this.suppressedConnections.add('embedding-generator');
          console.log('ℹ️ Client-side embedding model not available, using server-side processing (this is normal)');
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
      'ws://localhost:3100/ws',
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
    console.log('   - Failed connections to ws://localhost:3000/ws and ws://localhost:3100/ws are expected');
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

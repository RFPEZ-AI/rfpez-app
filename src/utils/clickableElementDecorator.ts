// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

// Development utility for decorating clickable elements with visual indicators
// and data attributes to assist with browser automation testing and debugging

interface ClickableElementInfo {
  type: string;
  role?: string;
  text?: string;
  id?: string;
  className?: string;
  testId: string; // Always required and non-empty
}

class ClickableElementDecorator {
  private isEnabled = false;
  private observer?: MutationObserver;
  private decoratedElements = new Set<Element>();
  private styleSheet?: CSSStyleSheet;
  private refreshTimeout?: number;
  private isRefreshing = false;

  constructor() {
    // Only enable in development mode
    if (process.env.NODE_ENV === 'development') {
      this.addGlobalStyles();
    }
  }

  private addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Clickable element decorations - only in development */
      .clickable-debug-highlight {
        outline: 2px dashed #007bff !important;
        outline-offset: 2px !important;
        position: relative !important;
        cursor: pointer !important;
      }

      .clickable-debug-highlight:hover {
        outline-color: #28a745 !important;
        outline-width: 3px !important;
      }

      .clickable-debug-highlight::before {
        content: attr(data-test-label);
        position: absolute;
        top: -25px;
        left: 0;
        background: #007bff;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        border-radius: 3px;
        white-space: nowrap;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }

      .clickable-debug-highlight:hover::before {
        opacity: 1;
      }

      /* Special styling for different element types */
      .clickable-debug-highlight[data-test-type="button"] {
        outline-color: #28a745 !important;
      }

      .clickable-debug-highlight[data-test-type="menu"] {
        outline-color: #ffc107 !important;
      }

      .clickable-debug-highlight[data-test-type="session"] {
        outline-color: #17a2b8 !important;
      }

      .clickable-debug-highlight[data-test-type="agent"] {
        outline-color: #6610f2 !important;
      }

      .clickable-debug-highlight[data-test-type="rfp"] {
        outline-color: #e83e8c !important;
      }

      /* Debug panel */
      .clickable-debug-panel {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10001;
        max-width: 300px;
      }

      .clickable-debug-panel h4 {
        margin: 0 0 10px 0;
        color: #007bff;
      }

      .clickable-debug-panel .element-count {
        margin-bottom: 10px;
      }

      .clickable-debug-panel .toggle-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        margin-right: 5px;
      }

      .clickable-debug-panel .toggle-btn:hover {
        background: #0056b3;
      }
    `;
    document.head.appendChild(style);
  }

  private getElementInfo(element: Element): ClickableElementInfo {
    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim().substring(0, 50) || '';
    const id = element.id;
    const className = element.className;
    const role = element.getAttribute('role');

    // Determine element type and generate test ID
    let type = 'clickable';
    let testId = '';

    if (tagName === 'button' || element.getAttribute('role') === 'button') {
      type = 'button';
      testId = this.generateButtonTestId(element, text);
    } else if (tagName === 'ion-button') {
      type = 'ion-button';
      testId = this.generateButtonTestId(element, text);
    } else if (element.closest('ion-menu') || role === 'menu') {
      type = 'menu';
      testId = `menu-${text.toLowerCase().replace(/\s+/g, '-')}`;
    } else if (element.closest('[data-session]') || text.includes('PM') || text.includes('AM')) {
      type = 'session';
      testId = `session-${this.generateSessionId(text)}`;
    } else if (text.includes('Agent') || text.includes('RFP Design') || text.includes('Solutions')) {
      type = 'agent';
      testId = `agent-${text.toLowerCase().replace(/\s+/g, '-')}`;
    } else if (text.includes('RFP') || text.includes('rfp')) {
      type = 'rfp';
      testId = `rfp-${text.toLowerCase().replace(/\s+/g, '-')}`;
    } else if (tagName === 'ion-item') {
      type = 'list-item';
      testId = `item-${text.toLowerCase().replace(/\s+/g, '-')}`;
    }

    // Ensure testId is not empty
    if (!testId) {
      testId = `${type}-${Date.now()}`;
    }

    return {
      type,
      role: role || undefined,
      text,
      id,
      className: typeof className === 'string' ? className : '',
      testId
    };
  }

  private generateButtonTestId(element: Element, text: string): string {
    if (text.includes('New') && text.includes('Session')) return 'btn-new-session';
    if (text.includes('Delete') && text.includes('Session')) return 'btn-delete-session';
    if (text.includes('Agent')) return 'btn-agent-selector';
    if (text.includes('RFP')) return 'btn-rfp-menu';
    if (text.includes('Menu') || element.getAttribute('role') === 'menubutton') return 'btn-main-menu';
    if (element.closest('ion-toolbar')) return 'btn-toolbar';
    if (!text && element.querySelector('ion-icon')) {
      const icon = element.querySelector('ion-icon');
      const iconName = icon?.getAttribute('name') || 'icon';
      return `btn-${iconName}`;
    }
    return `btn-${text.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`;
  }

  private generateSessionId(text: string): string {
    // Extract time or create hash from text
    const timeMatch = text.match(/\d+:\d+:\d+\s*(AM|PM)/i);
    if (timeMatch) {
      return timeMatch[0].replace(/[:\s]/g, '-').toLowerCase();
    }
    // Create simple hash from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 6);
  }

  private decorateElement(element: Element) {
    if (this.decoratedElements.has(element)) return;

    const info = this.getElementInfo(element);
    
    // Add CSS class for styling
    element.classList.add('clickable-debug-highlight');
    
    // Add data attributes for testing
    element.setAttribute('data-test-id', info.testId);
    element.setAttribute('data-test-type', info.type);
    element.setAttribute('data-test-label', `${info.type}: ${info.testId}`);
    
    if (info.text) {
      element.setAttribute('data-test-text', info.text);
    }
    
    // Add click listener for debugging
    element.addEventListener('click', (e) => {
      console.log('🖱️ Clicked element:', {
        testId: info.testId,
        type: info.type,
        text: info.text,
        element: element
      });
    });

    this.decoratedElements.add(element);
  }

  private findClickableElements(): Element[] {
    const selectors = [
      'button',
      'ion-button',
      'ion-item[button]',
      'ion-item[detail]',
      'ion-chip[button]',
      '[role="button"]',
      '[onclick]',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      '[data-testid]',
      '.clickable',
      'ion-menu-button',
      'ion-fab-button'
    ];

    const elements: Element[] = [];
    selectors.forEach(selector => {
      try {
        elements.push(...Array.from(document.querySelectorAll(selector)));
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    return elements.filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private createDebugPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'clickable-debug-panel';
    panel.innerHTML = `
      <h4>🔧 Clickable Elements Debug</h4>
      <div class="element-count">Found: <span id="element-count">0</span> elements</div>
      <button class="toggle-btn" onclick="window.clickableDecorator?.refreshDecorations()">Refresh</button>
      <button class="toggle-btn" onclick="window.clickableDecorator?.disable()">Disable</button>
      <button class="toggle-btn" onclick="window.clickableDecorator?.exportTestIds()">Export IDs</button>
    `;
    return panel;
  }

  public enable() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Clickable element decorator only works in development mode');
      return;
    }

    if (this.isEnabled) return;

    console.log('🔧 Enabling clickable element decorations...');
    this.isEnabled = true;

    // Create debug panel
    const panel = this.createDebugPanel();
    document.body.appendChild(panel);

    // Initial decoration
    this.refreshDecorations();

    // Watch for DOM changes with debouncing to prevent infinite loops
    this.observer = new MutationObserver((mutations) => {
      // Skip if we're currently refreshing to avoid infinite loops
      if (this.isRefreshing) return;
      
      // Filter out mutations caused by our own decorations
      const relevantMutations = mutations.filter(mutation => {
        if (mutation.type === 'attributes') {
          // Skip our own attribute changes
          const attrName = mutation.attributeName;
          return !['data-test-id', 'data-test-type', 'data-test-label', 'data-test-text'].includes(attrName || '');
        }
        return true;
      });
      
      if (relevantMutations.length === 0) return;
      
      // Debounce refresh calls
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      
      this.refreshTimeout = window.setTimeout(() => {
        this.refreshDecorations();
      }, 100);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'data-testid']
    });

    console.log('✅ Clickable element decorations enabled');
  }

  public disable() {
    if (!this.isEnabled) return;

    console.log('🔧 Disabling clickable element decorations...');
    this.isEnabled = false;
    this.isRefreshing = false;

    // Clear any pending refresh
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }

    // Remove decorations
    this.decoratedElements.forEach(element => {
      element.classList.remove('clickable-debug-highlight');
      element.removeAttribute('data-test-id');
      element.removeAttribute('data-test-type');
      element.removeAttribute('data-test-label');
      element.removeAttribute('data-test-text');
    });

    this.decoratedElements.clear();

    // Stop observing
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    // Remove debug panel
    const panel = document.querySelector('.clickable-debug-panel');
    if (panel) panel.remove();

    console.log('✅ Clickable element decorations disabled');
  }

  public refreshDecorations() {
    if (!this.isEnabled || this.isRefreshing) return;

    this.isRefreshing = true;
    
    try {
      const elements = this.findClickableElements();
      elements.forEach(element => this.decorateElement(element));

      // Update count in debug panel
      const countElement = document.getElementById('element-count');
      if (countElement) {
        countElement.textContent = elements.length.toString();
      }

      console.log(`🔄 Refreshed decorations for ${elements.length} clickable elements`);
    } finally {
      this.isRefreshing = false;
    }
  }

  public exportTestIds(): { [key: string]: string } {
    const testIds: { [key: string]: string } = {};
    let index = 0;

    this.decoratedElements.forEach(element => {
      const testId = element.getAttribute('data-test-id');
      const type = element.getAttribute('data-test-type');
      const text = element.getAttribute('data-test-text');
      
      if (testId) {
        testIds[`element_${index}`] = {
          testId,
          type,
          text: text?.substring(0, 50),
          selector: this.generateSelector(element)
        } as any;
        index++;
      }
    });

    console.table(testIds);
    console.log('📋 Test IDs exported to console');
    return testIds;
  }

  private generateSelector(element: Element): string {
    const testId = element.getAttribute('data-test-id');
    return `[data-test-id="${testId}"]`;
  }
}

// Global instance
const decorator = new ClickableElementDecorator();

// Add to window for console access
declare global {
  interface Window {
    clickableDecorator: ClickableElementDecorator;
    enableClickableDecorations: () => void;
    disableClickableDecorations: () => void;
  }
}

if (process.env.NODE_ENV === 'development') {
  window.clickableDecorator = decorator;
  window.enableClickableDecorations = () => decorator.enable();
  window.disableClickableDecorations = () => decorator.disable();
  
  console.log('🔧 Clickable element decorator loaded. Use window.enableClickableDecorations() to start');
}

export default decorator;
---
applyTo: '{**/test-automation/**,**/tests/**,**/*-test.js,**/*-test.ts}'
description: Chrome MCP browser automation for E2E testing in RFPEZ.AI
---

# Chrome MCP Browser Automation Testing

The project uses the official **mcp-chrome** browser automation server for comprehensive end-to-end testing and validation.

**📚 Official Documentation:** https://github.com/hangwin/mcp-chrome/blob/main/docs/TOOLS.md

## Prerequisites for Chrome MCP Testing
```bash
# Ensure the main application is running via VS Code Tasks
# Use: Ctrl+Shift+P → "Tasks: Run Task" → "Start Development Server"
# This starts the React app on http://localhost:3100 via VS Code task
# ⚠️ NEVER use "npm start" directly - always use the VS Code task to avoid port conflicts

# For authentication tests, use test account:
# Email: mskiba@esphere.com
# Password: thisisatest

# Ensure mcp-chrome is configured in .vscode/mcp.json
# Chrome browser must be installed with Playwright support
```

## 🎯 Chrome MCP Tool Categories

### 📊 Browser Management
- `get_windows_and_tabs` - List all open windows and tabs
- `chrome_navigate` - Navigate to URL with viewport control
- `chrome_close_tabs` - Close specific tabs or windows
- `chrome_switch_tab` - Switch to specific tab by ID
- `chrome_go_back_or_forward` - Navigate browser history

### 📸 Screenshots & Visual
- `chrome_screenshot` - Advanced screenshots (full page, element-specific, base64)

### 🌐 Network Monitoring
- `chrome_network_capture_start` - Capture network requests (webRequest API)
- `chrome_network_capture_stop` - Stop capture and return collected data
- `chrome_network_debugger_start` - Capture with response bodies (Debugger API)
- `chrome_network_debugger_stop` - Stop debugger capture
- `chrome_network_request` - Send custom HTTP requests

### 🔍 Content Analysis
- `search_tabs_content` - AI-powered semantic search across tabs
- `chrome_get_web_content` - Extract HTML or text content
- `chrome_get_interactive_elements` - Find clickable/interactive elements

### 🎯 Interaction
- `chrome_click_element` - Click elements using CSS selectors
- `chrome_fill_or_select` - Fill form fields or select options
- `chrome_keyboard` - Simulate keyboard input and shortcuts

### 📚 Data Management
- `chrome_history` - Search browser history with filters
- `chrome_bookmark_search` - Search bookmarks by keywords
- `chrome_bookmark_add` - Add new bookmarks with folder support
- `chrome_bookmark_delete` - Delete bookmarks by ID or URL

## ⚡ Chrome MCP Best Practices

### 🔑 Primary Selection Strategy: Use CSS Selectors
```javascript
// ✅ ALWAYS PREFER: CSS selector targeting (reliable, stable)
chrome_click_element({ 
  selector: '[data-testid="new-session-button"]' 
});

chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP' 
});

// Use data-testid attributes for test reliability
// All critical UI elements in RFPEZ.AI have data-testid attributes
```

### 🎨 Advanced Screenshot Capabilities
```javascript
// Full page screenshot with base64 data
chrome_screenshot({
  fullPage: true,
  storeBase64: true,
  width: 1920,
  height: 1080,
  name: 'full-page-capture'
});

// Element-specific screenshot
chrome_screenshot({
  selector: '.main-content',
  fullPage: false,
  storeBase64: true
});
```

### 🌐 Network Request Monitoring
```javascript
// Start capturing network requests
chrome_network_capture_start({
  url: 'http://localhost:3100',
  maxCaptureTime: 30000,      // 30 seconds max
  inactivityTimeout: 3000,    // Stop after 3s inactivity
  includeStatic: false         // Exclude CSS/images/fonts
});

// Perform actions that trigger API calls...

// Stop and retrieve captured requests
chrome_network_capture_stop();
// Returns: { capturedRequests: [...], summary: { totalRequests, captureTime } }
```

### ⌨️ Keyboard Shortcuts & Input
```javascript
// Simulate keyboard combinations
chrome_keyboard({
  keys: 'Ctrl+A',           // Select all
  selector: '#text-input',
  delay: 100
});

chrome_keyboard({
  keys: 'Enter',            // Submit form
  selector: '[data-testid="message-input"]'
});
```

## 🔧 Chrome MCP for Live Debugging

### When to Use Chrome MCP for Debugging
- Reproducing user-reported issues in controlled environment
- Inspecting network traffic for API call failures
- Capturing visual state at exact moment of error
- Verifying UI behavior after code changes
- Debugging authentication or session management issues
- Analyzing page content and DOM structure

### General Debugging Workflow

**Step 1: Navigate to Problem Area**
```javascript
// Start at the page where issue occurs
chrome_navigate({ 
  url: 'http://localhost:3100/path/to/problem',
  width: 1920,
  height: 1080
});

// Take baseline screenshot
chrome_screenshot({ 
  name: '01-initial-state',
  fullPage: true 
});
```

**Step 2: Start Network Monitoring**
```javascript
// Capture all API calls and network activity
chrome_network_capture_start({
  maxCaptureTime: 60000,      // 60 seconds max
  inactivityTimeout: 5000,    // Stop after 5s inactivity
  includeStatic: false        // Exclude CSS/images/fonts
});
```

**Step 3: Reproduce the Issue**
```javascript
// Perform actions that trigger the bug
chrome_click_element({ selector: '[data-testid="trigger-button"]' });

// Capture state at error point
chrome_screenshot({ 
  name: '02-error-state',
  fullPage: true,
  storeBase64: true  // Get base64 for inline viewing
});

// Extract error messages or content
const errorContent = chrome_get_web_content({ 
  selector: '.error-message',
  format: 'text'
});
```

**Step 4: Analyze Network Activity**
```javascript
// Stop capture and review API calls
const networkData = chrome_network_capture_stop();

// Network data includes:
// - capturedRequests: Array of all HTTP requests
// - Each request has: url, method, statusCode, requestHeaders, responseHeaders
// - Look for failed API calls (statusCode >= 400)
// - Check response times for performance issues
```

**Step 5: Inspect Page State**
```javascript
// Get interactive elements to verify UI structure
const elements = chrome_get_interactive_elements();

// Search for specific content issues
const searchResults = search_tabs_content({
  query: 'error message keywords'
});

// Get full page HTML for detailed inspection
const pageHTML = chrome_get_web_content({ 
  format: 'html' 
});
```

### Common Debugging Scenarios

**Scenario 1: Message Not Submitting**
```javascript
// Navigate and monitor
chrome_navigate({ url: 'http://localhost:3100' });
chrome_network_capture_start({ maxCaptureTime: 30000 });

// Attempt message submission
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Test message' 
});
chrome_keyboard({ keys: 'Enter' });

// Capture state
chrome_screenshot({ name: 'message-submit-issue' });
const networkData = chrome_network_capture_stop();

// Check for API call to /api/messages
// Look for errors in network responses
```

**Scenario 2: Authentication Issues**
```javascript
// Monitor authentication flow
chrome_network_debugger_start();  // Includes response bodies

chrome_navigate({ url: 'http://localhost:3100' });
chrome_click_element({ selector: '[data-testid="login-button"]' });
chrome_fill_or_select({ selector: 'input[type="email"]', value: 'test@example.com' });
chrome_fill_or_select({ selector: 'input[type="password"]', value: 'password' });
chrome_keyboard({ keys: 'Enter' });

// Stop and analyze
const debugData = chrome_network_debugger_stop();
// Review authentication API responses, check for 401/403 errors
```

**Scenario 3: RFP Context Not Updating**
```javascript
// Create RFP and verify context footer
chrome_click_element({ selector: '[data-testid="new-session-button"]' });
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create RFP for testing' 
});
chrome_keyboard({ keys: 'Enter' });

// Wait and check footer
chrome_screenshot({ name: 'after-rfp-creation' });

const footerContent = chrome_get_web_content({ 
  selector: '[data-testid="rfp-context-footer"]',
  format: 'text'
});
// Verify footerContent contains expected RFP name
```

**Scenario 4: Agent Switching Problems**
```javascript
// Monitor agent switching
chrome_network_capture_start({ maxCaptureTime: 20000 });

chrome_click_element({ selector: '[data-testid="agent-selector"]' });
chrome_screenshot({ name: 'agent-menu-open' });

chrome_click_element({ selector: '[data-testid="select-agent-button"]' });
chrome_screenshot({ name: 'after-agent-switch' });

const networkData = chrome_network_capture_stop();
// Check for updates to session_agents table
```

### Performance Debugging

```javascript
// Start performance trace
chrome_navigate({ url: 'http://localhost:3100' });
// Note: Performance tracing requires mcp_chrome-devtoo_performance_start_trace (not yet available)

// For now, use network timing analysis
chrome_network_capture_start({ maxCaptureTime: 30000 });

// Perform slow operation
chrome_click_element({ selector: '[data-testid="slow-operation"]' });

const networkData = chrome_network_capture_stop();
// Analyze request timing in capturedRequests
// Look for slow API calls or excessive requests
```

### Multi-Tab Debugging

```javascript
// Open multiple related pages
chrome_navigate({ url: 'http://localhost:3100/session/1' });
chrome_navigate({ url: 'http://localhost:3100/session/2', newWindow: false });

// List all open tabs
const windows = get_windows_and_tabs();

// Search across all tabs for specific content
const results = search_tabs_content({
  query: 'error or warning message'
});

// Switch to specific tab for inspection
chrome_switch_tab({ tabId: results[0].tabId });
chrome_screenshot({ name: 'tab-with-error' });
```

### Debugging Checklist

Before reporting a bug, capture:
- ✅ Screenshot of initial state
- ✅ Screenshot at moment of error
- ✅ Network capture showing API calls
- ✅ Console logs (if available via browser DevTools)
- ✅ Relevant page content (error messages, unexpected text)
- ✅ Steps to reproduce (documented with Chrome MCP commands)

## 🎯 RFPEZ.AI Testing Workflows

### Standard Login & Authentication Flow
```javascript
// Navigate to app
chrome_navigate({ 
  url: 'http://localhost:3100',
  width: 1920,
  height: 1080
});

// Click login button using data-testid
chrome_click_element({ 
  selector: '[data-testid="login-button"]' 
});

// Fill credentials
chrome_fill_or_select({ 
  selector: 'input[type="email"]', 
  value: 'mskiba@esphere.com' 
});

chrome_fill_or_select({ 
  selector: 'input[type="password"]', 
  value: 'thisisatest' 
});

// Submit login
chrome_keyboard({ 
  keys: 'Enter', 
  selector: 'input[type="password"]' 
});

// Verify login success
chrome_screenshot({ 
  name: 'logged-in-state',
  fullPage: true 
});
```

### Message Sending & RFP Creation Flow
```javascript
// Create new session
chrome_click_element({ 
  selector: '[data-testid="new-session-button"]' 
});

// Fill message using data-testid
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]', 
  value: 'Create a new RFP for LED lighting procurement' 
});

// ⚡ CRITICAL: Submit message with keyboard
chrome_keyboard({ 
  keys: 'Enter', 
  selector: '[data-testid="message-input"]' 
});

// Wait for response and take screenshot
chrome_screenshot({ 
  name: 'rfp-created',
  fullPage: true,
  storeBase64: false
});
```

## 📋 RFPEZ.AI UI Test Identifiers (data-testid)

All critical UI elements have `data-testid` attributes:

**Navigation & Menu Access:**
- `data-testid="new-session-button"` - New session creation
- `data-testid="main-menu-button"` - Main developer/admin menu
- `data-testid="rfp-menu-button"` - RFP management menu
- `data-testid="agents-menu-button"` - Agent management menu

**Core Messaging & Actions:**
- `data-testid="message-input"` - Main message input textarea
- `data-testid="submit-message-button"` - Message submit button
- `data-testid="agent-selector"` - Agent indicator/selector
- `data-testid="select-agent-button"` - Explicit agent selection

**RFP & Context Management:**
- `data-testid="new-rfp-button"` - New RFP creation button
- `data-testid="rfp-context-footer"` - Footer showing current RFP
- `data-testid="current-rfp-display"` - "Current RFP: [name]" text
- `data-testid="set-current-rfp-{id}"` - Set specific RFP as current

**Artifact & Form Interaction:**
- `data-testid="artifact-window-toggle"` - Show/hide artifact panel
- `data-testid="artifact-window"` - Main artifact panel container
- `data-testid="artifact-item-{name}"` - Individual artifact items
- `data-testid="form-submit-button"` - Form submission button
- `data-testid="artifact-toggle"` - Artifact panel expand/collapse

## 🚨 Chrome MCP Critical Testing Rules

1. **✅ ALWAYS USE CSS SELECTORS** - Use `data-testid` attributes for all interactions
2. **⚡ SUBMIT MESSAGES WITH KEYBOARD** - After filling input, MUST press Enter
3. **📸 TAKE SCREENSHOTS FOR VERIFICATION** - Verify state changes visually
4. **🌐 MONITOR NETWORK FOR API DEBUGGING** - Capture API calls when debugging
5. **🔍 USE SEMANTIC SEARCH FOR MULTI-TAB TESTING** - Search content across tabs

## 📚 Chrome MCP vs Legacy Browser MCP

**⚠️ MIGRATION NOTE:** When refactoring tests:

| ❌ Legacy (Old) | ✅ Chrome MCP (New) |
|----------------|---------------------|
| `mcp_browser_navigate()` | `chrome_navigate()` |
| `mcp_browser_click({ index })` | `chrome_click_element({ selector })` |
| `mcp_browser_form_input_fill({ index })` | `chrome_fill_or_select({ selector })` |
| `mcp_browser_screenshot()` | `chrome_screenshot()` |
| `mcp_browser_press_key()` | `chrome_keyboard()` |
| `mcp_browser_get_clickable_elements()` | `chrome_get_interactive_elements()` |
| N/A | `search_tabs_content()` |
| N/A | `chrome_network_capture_*()` |

## Test File Migration Checklist

1. Replace `mcp_browser_navigate` → `chrome_navigate`
2. Replace index-based selection with CSS selectors (`data-testid`)
3. Use `chrome_keyboard` instead of `mcp_browser_press_key`
4. Add network monitoring with `chrome_network_capture_*`
5. Use `chrome_screenshot` with enhanced options
6. Remove activation tool calls (not needed with Chrome MCP)

# Clickable Element Testing Utilities

This directory contains utilities to help with browser automation testing and debugging by decorating clickable elements with visual indicators and test attributes.

## Features

### 1. Clickable Element Decorator (`clickableElementDecorator.ts`)

Automatically detects and decorates clickable elements with:
- **Visual indicators**: Colored outlines that appear on hover
- **Data attributes**: `data-test-id`, `data-test-type`, `data-test-label` for automation
- **Smart naming**: Generates meaningful test IDs based on element content and context
- **Debug panel**: Shows count of decorated elements and control buttons

#### Usage
```javascript
// Enable decorations (development only)
window.enableClickableDecorations();

// Disable decorations
window.disableClickableDecorations();

// Refresh decorations (useful after DOM changes)
window.clickableDecorator.refreshDecorations();

// Export current test IDs to console
window.clickableDecorator.exportTestIds();
```

#### Visual Styling
- **Blue outline**: General clickable elements
- **Green outline**: Buttons (`data-test-type="button"`)
- **Yellow outline**: Menu items (`data-test-type="menu"`)
- **Cyan outline**: Session items (`data-test-type="session"`)
- **Purple outline**: Agent controls (`data-test-type="agent"`)
- **Pink outline**: RFP-related elements (`data-test-type="rfp"`)

### 2. Test ID Manager (`testIdManager.ts`)

Provides permanent test IDs for common UI patterns:
- **Predefined constants**: `TEST_IDS` object with standard test identifiers
- **Auto-application**: Automatically applies test IDs to common selectors
- **Scanning utilities**: Reports all elements with test attributes

#### Usage
```javascript
// Scan and report all test elements
window.scanTestElements();

// Re-apply common test IDs
window.applyCommonTestIds();

// Access predefined test ID constants
import { TEST_IDS } from '../utils/testIdManager';
const newSessionBtn = document.querySelector(`[data-test-id="${TEST_IDS.NEW_SESSION_BUTTON}"]`);
```

### 3. Debug Toggle Component (`ClickableDebugToggle.tsx`)

Visual control for enabling/disabling decorations:
- **Floating toggle**: Fixed position bug icon in bottom-right corner
- **Status indicator**: Shows whether decorations are active and count
- **Development only**: Hidden in production builds

## Integration

The utilities are automatically loaded in the Home component:

```typescript
// Automatically imported and initialized
import '../utils/clickableElementDecorator';
import '../utils/testIdManager';
import ClickableDebugToggle from '../components/ClickableDebugToggle';
```

## Browser Automation Testing

### MCP Browser Tools
These utilities work perfectly with MCP browser tools for automated testing:

```javascript
// Activate MCP browser tools
await activate_mcp_browser_navigation_tools();
await activate_mcp_browser_interaction_tools();

// Navigate to app
await mcp_browser_navigate({ url: 'http://localhost:3001' });

// Enable decorations
await mcp_browser_evaluate({ 
  script: 'window.enableClickableDecorations()' 
});

// Get clickable elements with test IDs
const elements = await mcp_browser_get_clickable_elements();

// Click specific test ID
const newSessionBtn = elements.find(el => 
  el.attributes?.['data-test-id'] === 'btn-new-session'
);
if (newSessionBtn) {
  await mcp_browser_click({ index: newSessionBtn.index });
}
```

### Test ID Patterns

The system generates predictable test IDs:

- **Buttons**: `btn-{action}` (e.g., `btn-new-session`, `btn-save`)
- **Menu items**: `menu-{name}` (e.g., `menu-agents`, `menu-settings`)
- **Sessions**: `session-{identifier}` (e.g., `session-3-45-pm`, `session-abc123`)
- **Agents**: `agent-{name}` (e.g., `agent-rfp-designer`, `agent-solutions`)
- **RFP items**: `rfp-{action}` (e.g., `rfp-edit`, `rfp-preview`)
- **List items**: `item-{content}` (e.g., `item-session`, `item-agent`)

## Development Workflow

1. **Start your app** in development mode
2. **Click the debug toggle** (bug icon) to enable decorations
3. **Inspect elements** - hover to see test IDs and types
4. **Use browser tools** - elements now have consistent data attributes
5. **Export test data** - use `exportTestIds()` to get automation data
6. **Write tests** - use the predictable test IDs in your automation scripts

## Console Commands

All utilities expose global functions for console debugging:

```javascript
// Decorator functions
window.enableClickableDecorations();
window.disableClickableDecorations();
window.clickableDecorator.refreshDecorations();
window.clickableDecorator.exportTestIds();

// Test ID functions
window.scanTestElements();
window.applyCommonTestIds();
```

## Production Safety

- **Development only**: All decorations and debug features are disabled in production
- **No performance impact**: Utilities don't load or run in production builds  
- **Clean output**: No test attributes or debug styles in production

## Browser Compatibility

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support) 
- ✅ Safari (full support)
- ✅ MCP Browser tools (optimized)
- ✅ Playwright/Puppeteer (compatible)

## Troubleshooting

### Elements Not Highlighted
- Ensure you're in development mode (`NODE_ENV=development`)
- Check if decorations are enabled: `window.clickableDecorator.isEnabled`
- Refresh decorations: `window.clickableDecorator.refreshDecorations()`

### Missing Test IDs
- Elements added after page load may need manual refresh
- Dynamic content requires re-application: `window.applyCommonTestIds()`
- Check console for any script errors

### MCP Integration Issues  
- Ensure app is running on correct port (localhost:3001)
- Activate required MCP browser tool categories
- Use `mcp_browser_evaluate` to check if utilities loaded properly

## Examples

### Finding New Session Button
```javascript
// Method 1: Use test ID
const btn = document.querySelector('[data-test-id="btn-new-session"]');

// Method 2: Use MCP browser tools
const elements = await mcp_browser_get_clickable_elements();
const newSessionBtn = elements.find(el => 
  el.text?.toLowerCase().includes('new') && 
  el.text?.toLowerCase().includes('session')
);

// Method 3: Use type filtering
const buttons = document.querySelectorAll('[data-test-type="button"]');
```

### Session Management Testing
```javascript
// Enable decorations
window.enableClickableDecorations();

// Find all sessions
const sessions = document.querySelectorAll('[data-test-type="session"]');
console.log(`Found ${sessions.length} session items`);

// Click first session
if (sessions.length > 0) {
  sessions[0].click();
}
```

This system makes browser automation testing significantly easier by providing consistent, predictable element identification and visual debugging capabilities.
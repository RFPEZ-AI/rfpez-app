# Chrome MCP Configuration Update

## Summary
Updated RFPEZ.AI project documentation and configuration to use the official **mcp-chrome** browser automation tools instead of legacy browser MCP tools.

## Changes Made

### 1. ✅ .vscode/mcp.json Configuration
**File:** `.vscode/mcp.json`

**Updated:**
```jsonc
// OLD: chrome-devtools-mcp (commented out)
/*"chrome-devtools": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest"]
},*/

// NEW: Official mcp-chrome
"chrome": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "mcp-chrome@latest"]
},
```

**Also preserved legacy reference:**
```jsonc
/*"browser-legacy": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@browsermcp/mcp@latest"]
},*/
```

### 2. ✅ .github/copilot-instructions.md Updates
**File:** `.github/copilot-instructions.md`

**Updated sections:**
- **Chrome MCP Browser Access for Log Inspection** (line ~799)
  - Changed from `mcp_browser_navigate()` to `chrome_navigate()`
  - Updated examples to use official Chrome MCP tools
  - Added network monitoring examples with `chrome_network_capture_*`

- **Logging Best Practices** (line ~830)
  - Updated "Client-side Debugging" to reference Chrome MCP tools
  - Updated "Browser Inspection" to use Chrome MCP tools
  - Changed "Network Analysis" to use `chrome_network_capture_*` tools

**Already correct:**
- Chrome MCP Tool Categories section (line ~1141)
- Chrome MCP Best Practices (line ~1176)
- Chrome MCP vs Legacy Browser MCP comparison table (line ~1445)
- Complete Test Examples (line ~1460+)

### 3. ✅ .github/instructions/chrome-mcp-testing.instructions.md
**File:** `.github/instructions/chrome-mcp-testing.instructions.md`

**Status:** Already using official Chrome MCP tools correctly
- All examples use `chrome_*` tool names
- CSS selector-based targeting with data-testid
- Comprehensive documentation of Chrome MCP features
- Migration notes from legacy to Chrome MCP

### 4. ✅ Memory Instructions
**Files:** 
- `vscode-userdata:/*/User/prompts/memory.instructions.md` (Personal memory)
- `.github/instructions/memory.instructions.md` (Workspace memory)

**Status:** Already documented Chrome MCP usage
- Chrome MCP tool names and best practices
- Network debugging patterns
- data-testid selector strategy

## Official Chrome MCP Tools Reference

### Tool Categories Documented
1. **Browser Management:** `chrome_navigate`, `get_windows_and_tabs`, `chrome_switch_tab`
2. **Screenshots:** `chrome_screenshot` (full page, element-specific, base64)
3. **Network Monitoring:** `chrome_network_capture_*`, `chrome_network_debugger_*`
4. **Content Analysis:** `search_tabs_content`, `chrome_get_web_content`
5. **Interaction:** `chrome_click_element`, `chrome_fill_or_select`, `chrome_keyboard`
6. **Data Management:** `chrome_history`, `chrome_bookmark_*`

### Migration Mapping
| Legacy Tool | Chrome MCP Tool |
|------------|-----------------|
| `mcp_browser_navigate()` | `chrome_navigate()` |
| `mcp_browser_click({ index })` | `chrome_click_element({ selector })` |
| `mcp_browser_form_input_fill()` | `chrome_fill_or_select({ selector })` |
| `mcp_browser_press_key()` | `chrome_keyboard()` |
| `mcp_browser_screenshot()` | `chrome_screenshot()` |

## Testing Instructions

### To Use Chrome MCP
1. **VS Code Restart:** Restart VS Code to load new MCP configuration
2. **Start Dev Server:** Use VS Code Task "Start Development Server"
3. **Test Navigation:**
   ```javascript
   chrome_navigate({ 
     url: 'http://localhost:3100',
     width: 1920,
     height: 1080
   });
   ```
4. **Verify Tools:** Chrome MCP tools should now be available in Copilot

### Quick Test Example
```javascript
// Navigate to app
chrome_navigate({ url: 'http://localhost:3100', width: 1920, height: 1080 });

// Click using data-testid
chrome_click_element({ selector: '[data-testid="new-session-button"]' });

// Fill input
chrome_fill_or_select({ 
  selector: '[data-testid="message-input"]',
  value: 'Test message'
});

// Submit with keyboard
chrome_keyboard({ keys: 'Enter', selector: '[data-testid="message-input"]' });

// Take screenshot
chrome_screenshot({ name: 'test-complete', fullPage: true });
```

## Benefits of Update

1. ✅ **Official MCP Server:** Using maintained mcp-chrome package
2. ✅ **Better Features:** Network monitoring, semantic search, enhanced screenshots
3. ✅ **CSS Selectors:** More reliable targeting with data-testid attributes
4. ✅ **Consistent Documentation:** All docs reference same tools
5. ✅ **Future-Proof:** Official API is actively maintained

## References
- **Official Documentation:** https://github.com/hangwin/mcp-chrome/blob/main/docs/TOOLS.md
- **Configuration File:** `.vscode/mcp.json`
- **Testing Instructions:** `.github/instructions/chrome-mcp-testing.instructions.md`
- **Main Instructions:** `.github/copilot-instructions.md`

## Date
October 29, 2025

# MCP Browser Test - Quick Reference Card

**Date:** October 9, 2025  
**Status:** ✅ ENVIRONMENT READY

---

## ✅ Pre-Flight Check - ALL SYSTEMS GO

```
✅ Local Supabase:     http://127.0.0.1:54321 - RUNNING
✅ Dev Server:         http://localhost:3100 - COMPILED
✅ Environment:        LOCAL (not REMOTE)
✅ Memory Migrations:  APPLIED to local DB
✅ Edge Function:      claude-api-v3 v173 ready
```

---

## 🎯 Test Goal

**Verify:** Solutions agent → Memory creation → Agent switch → RFP Design retrieves memory → No user repetition

---

## 🚀 Quick Test Steps

### 1. Activate MCP Browser Tools
```javascript
activate_browser_interaction_tools();
activate_mcp_browser_script_tools();
```

### 2. Navigate & Verify
```javascript
mcp_browser_browser_navigate({ url: 'http://localhost:3100' });
mcp_browser_browser_wait({ time: 3 });
mcp_browser_browser_screenshot();
```

### 3. Send Test Message
```javascript
// Find message input
mcp_browser_form_input_fill({ 
  selector: '[data-testid="message-input"]',
  value: 'I need to source 100 LED bulbs for our warehouse. They need to be energy efficient and last at least 5 years.'
});
mcp_browser_press_key({ key: 'Enter' });
```

### 4. Observe & Capture
```javascript
mcp_browser_browser_wait({ time: 5 });
mcp_browser_browser_screenshot();
mcp_browser_browser_get_console_logs();
```

---

## ✅ Success Looks Like

**Console Logs:**
```
🧠 Creating memory: {...}
✅ Memory created: mem_xxx
🔄 Switching to agent: RFP Design
🔍 Searching memories: {...}
✅ Found 1 memories
```

**User Experience:**
- Solutions responds
- Automatic switch to RFP Design
- RFP Design says: "I see you're looking to source 100 LED bulbs..." (NO REPEAT!)
- RFP creation begins

---

## ❌ Issues to Watch For

```
❌ "Session request timeout" → Supabase connection failed
❌ "Loading..." forever → App not loading
❌ User asked to repeat → Memory retrieval failed
❌ No agent switch → Tool call failed
```

---

## 📋 Quick Verification

**Database Check:**
```sql
SELECT content, memory_type, importance_score 
FROM agent_memories 
ORDER BY created_at DESC LIMIT 5;
```

**Expected:** 1 row with LED bulb intent, memory_type='decision', importance_score=0.9

---

## 🎬 Ready to Test!

**Status:** All systems ready  
**Action:** Execute test steps above  
**Time:** ~10 minutes  
**Documentation:** Update `TESTING/MEMORY-SYSTEM-LOCAL-TEST-REPORT.md`

---

**STOP HERE** - Environment is ready. Waiting for manual test execution.

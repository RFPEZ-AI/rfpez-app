# Suggested Prompts Test Messages

Copy these messages to test the suggested prompts feature in agent conversations.

## Test Message 1: Complete Prompts Only

```markdown
Welcome! I can help you with several options:

[Create a new RFP](prompt:complete)
[Find vendors](prompt:complete)
[Review requirements](prompt:complete)
```

**Expected:** 3 solid buttons, all auto-submit when clicked.

---

## Test Message 2: Open-Ended Prompts Only

```markdown
Tell me what you'd like to do:

[I'd like to source ...](prompt:open)
[Create an RFP for ...](prompt:open)
[Find vendors in ...](prompt:open)
```

**Expected:** 3 outline buttons with "...", all fill input when clicked.

---

## Test Message 3: Mixed Prompts (Recommended)

```markdown
How can I help you today?

[I'd like to source ...](prompt:open)
[Learn about the platform](prompt:complete)
[Talk to a specialist](prompt:complete)
```

**Expected:** First button outline, last two solid. Different behaviors.

---

## Test Message 4: Workflow Progression

```markdown
Your RFP is ready! What would you like to do next?

[Review the requirements](prompt:complete)
[Add more details about ...](prompt:open)
[Proceed to vendor sourcing](prompt:complete)
```

**Expected:** Solid-outline-solid pattern, logical workflow.

---

## Test Message 5: Agent Switching

```markdown
For vendor discovery, I recommend our Sourcing specialist.

[Yes, switch to Sourcing agent](prompt:complete)
[Stay here and modify RFP](prompt:complete)
[I need to ...](prompt:open)
```

**Expected:** Clear action prompts with confirmation.

---

## Test Message 6: Multiple Prompts with Context

```markdown
I found 12 potential vendors for your office chairs. Let's proceed:

[Review all vendors](prompt:complete)
[Select specific vendors](prompt:complete)
[Search for more vendors in ...](prompt:open)
[Send invitations](prompt:complete)
```

**Expected:** 4 buttons, wrapping if needed on narrow screens.

---

## Quick Browser Console Test

Open DevTools Console (F12) and paste:

```javascript
// Test 1: Check if fillPrompt event works
window.addEventListener('fillPrompt', (e) => {
  console.log('✅ fillPrompt event received:', e.detail);
});

// Dispatch test event
const testEvent = new CustomEvent('fillPrompt', {
  detail: { text: 'Test prompt text' }
});
window.dispatchEvent(testEvent);

// Test 2: Check if SuggestedPrompt component is loaded
console.log('Checking for SuggestedPrompt component...');
// Look for prompt buttons in the DOM
const promptButtons = document.querySelectorAll('[data-testid^="suggested-prompt"]');
console.log(`Found ${promptButtons.length} suggested prompt buttons`);
```

---

## Testing Instructions

### Method 1: Manual Testing in Browser

1. **Open app:** http://localhost:3100
2. **Login** (if needed): mskiba@esphere.com / thisisatest
3. **Start new session** (click New Session button)
4. **Type a test message** with suggested prompt syntax
5. **Send message**
6. **Wait for agent response** with rendered prompts
7. **Click prompts** to test behavior

### Method 2: Copy-Paste Test Messages

Since agents need to generate responses with the prompt syntax, you can:

1. Start a conversation with any agent
2. Wait for agent's initial response
3. Check if agent includes suggested prompts
4. Test clicking different prompt types

**Note:** Agents need to be "aware" to use the prompt syntax. The instructions have been updated, but you may need to explicitly ask:

```
"Can you show me some suggested prompts for what I can do next?"
```

### Method 3: Test with Solutions Agent

1. **Start fresh session**
2. **Solutions agent should greet you** with prompts like:
   ```
   [I'd like to source ...](prompt:open)
   [Learn about EZRFP.APP](prompt:complete)
   ```
3. **Click the open-ended prompt** → Should fill input
4. **Complete the sentence** → Type "office furniture"
5. **Press Enter** → Should submit full message

---

## Expected Agent Responses

### Solutions Agent - Initial Welcome

**Should include:**
- Welcome message
- 2-3 suggested prompts
- Mix of complete and open-ended

**Should NOT include:**
- More than 4 prompts
- All open-ended prompts
- Redundant options

### RFP Design Agent - After Switch

**Should include:**
- Acknowledgment of procurement intent
- Workflow starting prompts
- Option to customize

### Sourcing Agent - Vendor Discovery

**Should include:**
- Vendor count/status
- Action prompts (review, select, search)
- Open-ended for custom criteria

---

## Troubleshooting

### Issue: Prompts Don't Render as Buttons

**Possible Causes:**
1. Syntax error in markdown (check brackets and colons)
2. SessionDialog not using custom renderer
3. SuggestedPrompt component not imported

**Fix:**
- Check browser console for errors
- Verify markdown syntax: `[Text](prompt:complete)`
- Refresh page to reload components

### Issue: Click Does Nothing

**Possible Causes:**
1. Event handler not connected
2. JavaScript error blocking execution
3. Component not mounted properly

**Fix:**
- Check console for errors
- Verify onPromptSelect callback is passed
- Check React DevTools for component tree

### Issue: Open-Ended Prompts Don't Fill Input

**Possible Causes:**
1. fillPrompt event not dispatching
2. PromptComponent not listening
3. Event detail structure wrong

**Fix:**
- Check if PromptComponent has event listener
- Verify custom event is dispatching
- Test with console script above

---

## Success Indicators

✅ Buttons render with correct styling  
✅ Complete prompts auto-submit  
✅ Open-ended prompts fill input  
✅ Focus moves to input after fill  
✅ No console errors  
✅ Smooth animations  
✅ Works on mobile viewport  
✅ Keyboard navigation works  

---

## Next Steps

After successful testing:
1. ✅ Document findings
2. ✅ Share with team
3. ✅ Update agent training if needed
4. ✅ Monitor user adoption
5. ✅ Gather feedback
6. ✅ Iterate on designs

---

**Created:** November 2, 2025  
**Status:** Ready for Testing  
**Priority:** High - Core UX Feature

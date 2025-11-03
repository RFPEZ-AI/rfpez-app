# Suggested Prompts - Visual Examples

## How It Works

### User Perspective

**Before (Traditional Chat):**
```
Agent: "I can help you source vendors. What would you like to do?"
User: [types] "find vendors for LED bulbs"
```

**After (With Suggested Prompts):**
```
Agent: "I can help you source vendors. What would you like to do?"

[Find vendors now]  [Set criteria first]  [Search for vendors in ...]

User: [clicks button] "Find vendors now" → Auto-submits immediately
     OR
     [clicks button] "Search for vendors in ..." → Input shows "Search for vendors in " + cursor
```

## Real Agent Examples

### 1. Solutions Agent - Initial Welcome

**Authenticated User:**
```markdown
Welcome back! How can I help you today?

[I'd like to source ...](prompt:open)
[Learn about EZRFP.APP](prompt:complete)
[Talk to RFP Design agent](prompt:complete)
```

**Renders as:**
```
Welcome back! How can I help you today?

[I'd like to source ...]  [Learn about EZRFP.APP]  [Talk to RFP Design agent]
   (outline + ...)           (solid button)            (solid button)
```

### 2. RFP Design Agent - Requirements Gathering

```markdown
Great! I'll help you source LED bulbs. Let's start:

[Create the RFP now](prompt:complete)
[Tell me about requirements first](prompt:complete)
[I have specific needs for ...](prompt:open)
```

**Renders as:**
```
Great! I'll help you source LED bulbs. Let's start:

[Create the RFP now]  [Tell me about requirements first]  [I have specific needs for ...]
   (solid button)              (solid button)                    (outline + ...)
```

### 3. Sourcing Agent - Vendor Discovery

```markdown
I found 12 qualified vendors for your LED bulb RFP:

[Review all vendors](prompt:complete)
[Select vendors to contact](prompt:complete)
[Find more vendors in ...](prompt:open)
```

**Renders as:**
```
I found 12 qualified vendors for your LED bulb RFP:

[Review all vendors]  [Select vendors to contact]  [Find more vendors in ...]
   (solid button)           (solid button)              (outline + ...)
```

### 4. Workflow Progression Example

```markdown
Your RFP questionnaire is ready! Next steps:

[Review the questionnaire](prompt:complete)
[Add more questions about ...](prompt:open)
[Proceed to vendor sourcing](prompt:complete)
```

**Renders as:**
```
Your RFP questionnaire is ready! Next steps:

[Review the questionnaire]  [Add more questions about ...]  [Proceed to vendor sourcing]
      (solid button)                (outline + ...)                  (solid button)
```

## Button Appearance

### Complete Prompts (Solid Fill)
```
┌─────────────────────────┐
│  Generate RFP           │  ← Primary color fill
│                         │  ← White text
│                         │  ← Rounded corners (20px)
└─────────────────────────┘
   ↑ Clickable button
   ↑ Auto-submits on click
```

### Open-Ended Prompts (Outline)
```
┌─────────────────────────┐
│  I'd like to source ... │  ← Primary color border
│                         │  ← Primary color text
│                         │  ← Rounded corners (20px)
└─────────────────────────┘
   ↑ Clickable button
   ↑ Fills input on click
   ↑ Shows "..." to indicate continuation needed
```

## Interaction Flow

### Complete Prompt Flow:
```
1. Agent message displays with prompts
2. User clicks [Generate RFP] button
3. Text "Generate RFP" auto-submits
4. Agent receives message and responds
5. Conversation continues
```

### Open-Ended Prompt Flow:
```
1. Agent message displays with prompts
2. User clicks [I'd like to source ...] button
3. Input field fills with "I'd like to source "
4. Cursor positioned at end
5. User types completion: "LED bulbs"
6. User presses Enter or clicks Send
7. Agent receives "I'd like to source LED bulbs"
```

## Layout Examples

### Horizontal Layout (Default)
```
Agent: Ready to proceed?

[Yes, continue]  [No, wait]  [I need to ...]
```

### Grouped Prompts
```
Agent: What would you like to do?

[Option 1]  [Option 2]  [Option 3]

[Custom request for ...]
```

### Mixed Context
```
Agent: Your requirements are saved. Choose next step:

[Generate questionnaire](prompt:complete) or [Add custom fields for ...](prompt:open)

[Switch to Sourcing agent](prompt:complete)
```

## Mobile Responsive

### Desktop View
```
Agent message here with explanation text.

[Prompt 1]  [Prompt 2]  [Prompt 3]  [Custom option ...]
```

### Mobile View (Wraps)
```
Agent message here with
explanation text.

[Prompt 1]
[Prompt 2]
[Prompt 3]
[Custom option ...]
```

## Accessibility

### Screen Reader Announcement
```
"Button: Generate RFP"
"Button: I'd like to source, ellipsis"
```

### Keyboard Navigation
```
Tab → [Prompt 1] → Tab → [Prompt 2] → Tab → [Prompt 3]
Enter → Activates selected prompt
```

### Focus State
```
┌═════════════════════════┐
║  Generate RFP           ║  ← Visible focus ring
║                         ║  ← Enhanced contrast
└═════════════════════════┘
```

## Style Variants

### Success Action
```markdown
[Yes, send invitations](prompt:complete)
```
Renders as primary solid button.

### Exploratory Action
```markdown
[Show me examples](prompt:complete)
```
Renders as primary solid button.

### Custom Input
```markdown
[Find vendors in ...](prompt:open)
```
Renders as outline button with ellipsis.

## Integration with Existing UI

### With Artifact References
```
Agent: I've created your RFP form.

📋 RFP Requirements Form

[Review the form](prompt:complete)
[Modify requirements for ...](prompt:open)
[Switch to Sourcing](prompt:complete)
```

### With Agent Switching
```
Agent: For vendor sourcing, let me connect you to our specialist.

[Yes, switch to Sourcing agent](prompt:complete)
[Stay with current agent](prompt:complete)
[I need to ...](prompt:open)
```

### In Workflow Steps
```
Agent: Step 2 of 5 - Requirements Definition

Your requirements are complete!

[Continue to Step 3](prompt:complete)
[Review requirements](prompt:complete)
[Add more details about ...](prompt:open)
```

## Performance Notes

- Prompts render instantly (no loading delay)
- Button clicks are immediate
- Open-ended prompts fill input in <100ms
- Complete prompts submit with standard message latency
- No impact on message streaming

## Best Practices Summary

✅ **DO:**
- Offer 2-4 prompts per message
- Mix complete and open-ended types
- Use clear, action-oriented text
- Group related options together
- Provide shortcuts for common paths

❌ **DON'T:**
- Overload with >5 prompts
- Make all prompts open-ended
- Use for trivial responses
- Repeat obvious options
- Create ambiguous button text

---

**Visual Design Goals:**
- Reduce cognitive load
- Guide workflow progression
- Maintain conversation flow
- Support both quick actions and custom input
- Enhance mobile usability

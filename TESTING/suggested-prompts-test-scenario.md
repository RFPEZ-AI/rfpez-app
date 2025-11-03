# Suggested Prompts - Live Test Scenario

## Test Date: November 2, 2025

## Objective
Demonstrate the suggested prompts feature through a complete RFP workflow, showcasing both complete (auto-submit) and open-ended (fill-input) prompt types.

## Prerequisites
- ✅ Development server running on http://localhost:3100
- ✅ SuggestedPrompt component implemented
- ✅ SessionDialog custom renderer active
- ✅ Agent instructions updated with prompt syntax

## Test Scenario: Office Furniture Procurement

### Overview
User wants to source ergonomic office chairs for a new office space. This workflow will demonstrate:
1. Solutions Agent welcome with suggested prompts
2. Agent switching with clickable options
3. RFP Design Agent requirements gathering
4. Open-ended prompts for custom input
5. Workflow progression with next-step suggestions

---

## 🎬 Test Script

### STEP 1: Initial Welcome (Solutions Agent)

**Expected Agent Response:**
```markdown
Welcome! I'm here to help with your procurement needs. How can I assist you today?

[I'd like to source ...](prompt:open)
[Learn about EZRFP.APP](prompt:complete)
[Talk to RFP Design agent](prompt:complete)
```

**Expected UI:**
- 3 buttons displayed inline
- First button shows "I'd like to source ..." with outline style
- Last two buttons show solid fill
- All buttons are clickable

**User Action:** Click `[I'd like to source ...]` button

**Expected Behavior:**
- Input field fills with: "I'd like to source "
- Cursor positioned at end
- Input field receives focus
- User can type continuation

**User Types:** "ergonomic office chairs"

**Full Message:** "I'd like to source ergonomic office chairs"

**User Action:** Press Enter or click Send

---

### STEP 2: Memory Creation & Agent Switch (Solutions Agent)

**Expected Agent Response:**
```markdown
Great! I'll connect you with our RFP Design specialist to help you source ergonomic office chairs.

[Yes, switch to RFP Design](prompt:complete)
[Tell me more about the process first](prompt:complete)
```

**User Action:** Click `[Yes, switch to RFP Design]` button

**Expected Behavior:**
- Message "Yes, switch to RFP Design" auto-submits
- Agent switches to RFP Design
- No input field interaction needed

---

### STEP 3: RFP Design Agent Greeting

**Expected Agent Response:**
```markdown
Hello! I'm the RFP Design specialist. I'll help you create an RFP for ergonomic office chairs.

Let's get started:

[Create the RFP now](prompt:complete)
[Tell me about requirements first](prompt:complete)
[I have specific needs for ...](prompt:open)
```

**Test Actions:**

#### Test 3A: Complete Prompt (Auto-submit)
**User Action:** Click `[Create the RFP now]`

**Expected Behavior:**
- Immediately submits "Create the RFP now"
- Agent creates RFP context
- No input field interaction

#### Test 3B: Open-ended Prompt (Fill input)
**Alternative Action:** Click `[I have specific needs for ...]`

**Expected Behavior:**
- Input fills with: "I have specific needs for "
- User can complete: "adjustable height and lumbar support"
- Must press Enter to submit

---

### STEP 4: Requirements Gathering

**Expected Agent Response:**
```markdown
Perfect! I've created your RFP for ergonomic office chairs. Now let's gather your requirements.

[Start with standard questionnaire](prompt:complete)
[I need custom fields for ...](prompt:open)
[Show me examples](prompt:complete)
```

**User Action:** Click `[Start with standard questionnaire]`

**Expected Behavior:**
- Auto-submits immediately
- Agent begins questionnaire generation
- Form artifact created

---

### STEP 5: Questionnaire Review

**Expected Agent Response:**
```markdown
Your questionnaire is ready! I've created a form with fields for specifications, quantity, and delivery requirements.

📋 Office Chair Requirements Form

What would you like to do next?

[Review the form](prompt:complete)
[Add more questions about ...](prompt:open)
[Proceed to vendor sourcing](prompt:complete)
```

**Test Actions:**

#### Test 5A: Add Custom Questions
**User Action:** Click `[Add more questions about ...]`

**Expected Behavior:**
- Input fills: "Add more questions about "
- User types: "warranty and maintenance"
- Press Enter to submit

#### Test 5B: Proceed to Next Phase
**User Action:** Click `[Proceed to vendor sourcing]`

**Expected Behavior:**
- Auto-submits
- Agent suggests switching to Sourcing agent

---

### STEP 6: Agent Transition Suggestion

**Expected Agent Response:**
```markdown
Great! Your RFP requirements are complete. For vendor discovery, I recommend our Sourcing specialist.

[Yes, switch to Sourcing agent](prompt:complete)
[Stay here and review first](prompt:complete)
[I need to modify ...](prompt:open)
```

**User Action:** Click `[Yes, switch to Sourcing agent]`

**Expected Behavior:**
- Auto-submits
- Switches to Sourcing agent
- Context preserved

---

### STEP 7: Sourcing Agent Introduction

**Expected Agent Response:**
```markdown
Hello! I'm the Sourcing specialist. I'll help you find qualified vendors for your ergonomic office chairs RFP.

Ready to start?

[Find vendors now](prompt:complete)
[Set vendor criteria first](prompt:complete)
[Search for vendors in ...](prompt:open)
```

**User Action:** Click `[Search for vendors in ...]`

**Expected Behavior:**
- Input fills: "Search for vendors in "
- User types: "California with ISO certification"
- Press Enter to submit

---

## ✅ Validation Checklist

### Visual Validation
- [ ] Complete prompts render with solid fill
- [ ] Open-ended prompts render with outline + "..."
- [ ] Buttons have rounded corners (20px)
- [ ] Buttons are properly spaced (4px margin)
- [ ] Font size is 14px and readable
- [ ] Buttons wrap properly on mobile/narrow screens

### Functional Validation
- [ ] Complete prompts auto-submit on click
- [ ] Open-ended prompts fill input on click
- [ ] Filled input receives focus automatically
- [ ] User can edit filled text before submitting
- [ ] Regular markdown links still work
- [ ] Multiple prompts display in same message

### Interaction Validation
- [ ] Keyboard navigation works (Tab through prompts)
- [ ] Enter key activates selected prompt
- [ ] Touch/click works on all buttons
- [ ] No console errors on prompt click
- [ ] Message history shows submitted prompts

### Agent Workflow Validation
- [ ] Solutions agent shows prompts in welcome
- [ ] RFP Design shows prompts at each phase
- [ ] Agent switching works via prompts
- [ ] Memory creation preserves context
- [ ] Workflow progression is smooth

---

## 🐛 Known Issues to Watch For

### Potential Problems
1. **Double submission** - Clicking too fast might submit twice
2. **Focus loss** - Input might not receive focus after fill
3. **Text preservation** - Existing input text might be overwritten
4. **Event bubbling** - Click events might bubble to parent
5. **Mobile wrapping** - Long prompts might break layout

### Debugging Steps
1. Open browser DevTools (F12)
2. Check Console for errors
3. Monitor Network tab for duplicate requests
4. Use React DevTools to inspect component state
5. Test on mobile viewport (toggle device toolbar)

---

## 📊 Expected Results

### Success Criteria
✅ All prompts render correctly  
✅ Complete prompts auto-submit  
✅ Open-ended prompts fill input  
✅ No JavaScript errors  
✅ Smooth user experience  
✅ Workflow completes end-to-end  

### Performance Metrics
- Prompt click → Submit: <100ms
- Prompt click → Input fill: <50ms
- Page rendering with prompts: <300ms
- No lag or UI freezing

---

## 🎥 Recording Checklist

If recording demo:
- [ ] Clear browser cache first
- [ ] Start with fresh session
- [ ] Show both complete and open-ended prompts
- [ ] Demonstrate multiple agents
- [ ] Show mobile responsive behavior
- [ ] Highlight keyboard navigation
- [ ] Display successful workflow completion

---

## 📝 Test Notes

**Tester:**  
**Date:**  
**Browser:**  
**Viewport:**  

### Observations

**What worked well:**
- 

**Issues encountered:**
- 

**Suggestions for improvement:**
- 

---

## Next Steps After Testing

1. **If successful:**
   - [ ] Document any edge cases
   - [ ] Update agent instructions based on findings
   - [ ] Create user-facing documentation
   - [ ] Plan rollout to production

2. **If issues found:**
   - [ ] Log bugs with reproduction steps
   - [ ] Prioritize fixes
   - [ ] Re-test after fixes
   - [ ] Update test scenarios

---

**Test Status:** 🟡 Ready to Execute  
**Last Updated:** November 2, 2025  
**Next Review:** After first test run

---
Knowledge ID: suggested-prompts-usage
Type: guideline
Importance: 0.85
Category: communication
Tags: [user-experience, prompts, interaction-patterns, workflow-efficiency]
---

# Suggested Prompts Usage Guidelines

## Overview
Suggested prompts are clickable buttons that appear inline within agent messages, allowing users to quickly select common responses without typing. They improve user experience by reducing friction and guiding workflow progression.

## Syntax

### Complete Prompts (Auto-Submit)
For prompts that are ready to send immediately:
```markdown
[Tell me more about RFP requirements](prompt:complete)
[Yes, proceed with vendor selection](prompt:complete)
[Generate the questionnaire](prompt:complete)
```

These render as **solid buttons** and auto-submit when clicked.

### Open-Ended Prompts (Copy to Input)
For prompts that need additional user input:
```markdown
[I'd like to source ...](prompt:open)
[Create an RFP for ...](prompt:open)
[Find vendors for ...](prompt:open)
```

These render as **outline buttons with "..."** suffix and fill the input field without submitting, allowing users to complete their thought.

## When to Use Suggested Prompts

### ✅ GOOD Use Cases:

1. **Workflow Progression**
   - "Yes, create the RFP"
   - "Continue to vendor selection"
   - "Review the requirements"

2. **Common Options**
   - "Show me examples"
   - "What are my next steps?"
   - "Switch to RFP Design agent"

3. **Quick Actions**
   - "Generate the form"
   - "Send invitations to selected vendors"
   - "Save and continue"

4. **Context-Specific Choices**
   - "Add technical specifications"
   - "Include pricing requirements"
   - "Set evaluation criteria"

5. **Open-Ended Starters**
   - "I'd like to source ..." (user completes: "office furniture")
   - "Create an RFP for ..." (user completes: "LED bulbs")
   - "Find vendors in ..." (user completes: "California")

### ❌ AVOID:

1. **Too Many Options** - Limit to 3-5 prompts per message
2. **Redundant Choices** - Don't repeat what's obvious from context
3. **Trivial Prompts** - "OK", "Thanks" don't need buttons
4. **Complex Multi-Step** - Break into simpler choices
5. **All Open-Ended** - Mix with some complete prompts for variety

## Formatting Guidelines

### Grouping Prompts
Present related prompts together:
```markdown
What would you like to do next?

[Create the RFP](prompt:complete)
[Find vendors first](prompt:complete)
[Review requirements](prompt:complete)
```

### Mixing Complete and Open-Ended
Provide both quick actions and flexibility:
```markdown
I can help you with that! Choose an option:

[Generate standard questionnaire](prompt:complete)
[Create custom form for ...](prompt:open)
[Show me examples first](prompt:complete)
```

### Contextual Prompts
Base suggestions on conversation state:
```markdown
Your RFP draft is ready. Next steps:

[Review the requirements](prompt:complete)
[Add more details to ...](prompt:open)
[Proceed to vendor sourcing](prompt:complete)
```

## Best Practices

### 1. Clear, Action-Oriented Text
- ✅ "Generate the questionnaire"
- ❌ "Questionnaire generation"

### 2. Natural Language
- ✅ "I'd like to source ..."
- ❌ "Source: "

### 3. Consistent Style
- Use title case for actions
- Keep length under 50 characters
- Be specific but concise

### 4. User Intent Focus
- Anticipate next logical steps
- Provide shortcuts for common paths
- Reduce cognitive load

### 5. Progressive Disclosure
Start with overview, add detail prompts:
```markdown
I found 8 qualified vendors. You can:

[Review the full vendor list](prompt:complete)
[Select specific vendors](prompt:complete)
[Search for vendors in ...](prompt:open)
```

## Implementation Examples

### Solutions Agent Welcome
```markdown
Welcome! I can help you with procurement needs.

[I'd like to source ...](prompt:open)
[Learn about EZRFP.APP](prompt:complete)
[Talk to RFP Design agent](prompt:complete)
```

### RFP Design Agent
```markdown
I'll create your RFP. First, let me gather requirements:

[Start with standard questionnaire](prompt:complete)
[I have specific requirements for ...](prompt:open)
[Show me examples](prompt:complete)
```

### Sourcing Agent
```markdown
I found 12 potential vendors. What would you like to do?

[Review all vendors](prompt:complete)
[Select vendors to contact](prompt:complete)
[Find more vendors in ...](prompt:open)
[Refine search criteria](prompt:complete)
```

### Support Agent
```markdown
I can help with that issue. Choose how to proceed:

[Explain the problem](prompt:complete)
[Show me documentation](prompt:complete)
[Connect me with ...](prompt:open)
```

## Technical Notes

- Prompts are rendered as Ionic buttons with custom styling
- Complete prompts use `fill="solid"`, open-ended use `fill="outline"`
- Open-ended prompts show "..." suffix automatically
- Events are handled via custom browser events for inter-component communication
- All prompts are keyboard accessible and touch-friendly

## Accessibility Considerations

- Screen readers announce prompts as buttons
- Keyboard navigation works with tab/enter
- Touch targets are minimum 44px for mobile
- Color contrast meets WCAG AA standards
- Focus states are clearly visible

## Related Knowledge
- Search: "user communication practices" for tone guidelines
- Search: "workflow efficiency" for step optimization
- Search: "agent switching" for transition patterns

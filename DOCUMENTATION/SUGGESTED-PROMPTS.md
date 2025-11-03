# Suggested Prompts Feature

## Overview
The Suggested Prompts feature allows AI agents to provide clickable button options within their messages, reducing friction and guiding users through workflows efficiently.

## Architecture

### Components

#### `SuggestedPrompt.tsx`
Renders individual prompt buttons with two variants:
- **Complete prompts** - Solid fill, auto-submit on click
- **Open-ended prompts** - Outline style with "..." suffix, fills input without submitting

#### `SessionDialog.tsx`
Extended ReactMarkdown with custom link renderer:
- Detects `prompt:complete` and `prompt:open` link patterns
- Renders `SuggestedPrompt` components instead of regular links
- Handles prompt selection and submission

#### `PromptComponent.tsx`
Enhanced to listen for `fillPrompt` custom events:
- Fills textarea when open-ended prompts are clicked
- Maintains focus after filling
- Preserves existing message handling

## Usage

### Markdown Syntax

**Complete Prompts (Auto-submit):**
```markdown
[Create the RFP](prompt:complete)
[Yes, proceed](prompt:complete)
[Show me examples](prompt:complete)
```

**Open-ended Prompts (Fill input):**
```markdown
[I'd like to source ...](prompt:open)
[Create an RFP for ...](prompt:open)
[Find vendors in ...](prompt:open)
```

### Agent Implementation Examples

**Solutions Agent - Welcome Message:**
```markdown
Welcome! How can I help you today?

[I'd like to source ...](prompt:open)
[Learn about EZRFP.APP](prompt:complete)
[Talk to RFP Design agent](prompt:complete)
```

**RFP Design Agent - Requirements Gathering:**
```markdown
Let's gather your requirements:

[Start with standard questionnaire](prompt:complete)
[I have custom requirements for ...](prompt:open)
[Show me examples](prompt:complete)
```

**Sourcing Agent - Vendor Selection:**
```markdown
I found 12 qualified vendors. What would you like to do?

[Review all vendors](prompt:complete)
[Select vendors to contact](prompt:complete)
[Find more vendors in ...](prompt:open)
```

## Best Practices

### When to Use
✅ Workflow progression points  
✅ Common action shortcuts  
✅ Agent switching suggestions  
✅ Open-ended input starters  
✅ After completing major steps

### When NOT to Use
❌ Too many options (>5 prompts)  
❌ Redundant or obvious actions  
❌ Trivial responses ("OK", "Thanks")  
❌ Complex multi-step workflows  
❌ All open-ended (mix with complete)

### Formatting Guidelines

1. **Limit to 2-4 prompts per message**
2. **Mix complete and open-ended prompts**
3. **Use action-oriented language**
4. **Keep text under 50 characters**
5. **Group related prompts together**

### Progressive Disclosure
Start with overview, add detail options:
```markdown
Your RFP is ready! Next steps:

[Review the requirements](prompt:complete)
[Add more details about ...](prompt:open)
[Proceed to vendor sourcing](prompt:complete)
```

## Technical Implementation

### Custom Event System
Open-ended prompts use browser custom events:
```typescript
// SessionDialog dispatches
const event = new CustomEvent('fillPrompt', { 
  detail: { text: promptText } 
});
window.dispatchEvent(event);

// PromptComponent listens
window.addEventListener('fillPrompt', handleFillPrompt);
```

### ReactMarkdown Custom Renderer
```typescript
components={{
  a: ({ href, children, ...props }) => {
    if (href?.startsWith('prompt:')) {
      const isComplete = href === 'prompt:complete';
      return (
        <SuggestedPrompt
          text={promptText}
          isComplete={isComplete}
          onPromptSelect={handleSuggestedPrompt}
        />
      );
    }
    return <a href={href} {...props}>{children}</a>;
  }
}}
```

## Styling

### Button Variants
- **Complete:** `fill="solid"`, primary color
- **Open-ended:** `fill="outline"`, "..." suffix

### Visual Design
- Rounded corners (20px border-radius)
- Small size for inline flow
- 4px margin for spacing
- Text transform: none (preserves case)
- 14px font size

## Accessibility

- ✅ Screen reader compatible (announces as buttons)
- ✅ Keyboard navigation (tab/enter)
- ✅ Touch-friendly (minimum 44px touch target)
- ✅ WCAG AA color contrast
- ✅ Clear focus states

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=SuggestedPrompt
```

### Test Coverage
- Component rendering (complete/open variants)
- Click event handling
- Custom event system
- Markdown syntax validation
- Agent usage examples

### Integration Testing
Test in browser with real agent conversations:
1. Start development server
2. Open new chat session
3. Agent should display suggested prompts
4. Click complete prompt → auto-submits
5. Click open-ended prompt → fills input

## Agent Documentation

### Agent Instructions Files
Updated with suggested prompts sections:
- `Agent Instructions/Solutions Agent.md`
- `Agent Instructions/RFP Design Agent.md`
- `Agent Instructions/Sourcing Agent.md`

### Knowledge Base
Comprehensive guide in:
- `scripts/suggested-prompts-knowledge-base.md`

Agents can search: `"suggested-prompts-usage"` for complete guidelines.

## Migration Guide

### For Existing Agents
No migration needed - feature is backward compatible:
- Regular markdown links still work
- Add suggested prompts incrementally
- Test in conversations
- Update based on user feedback

### For New Agents
Include suggested prompts from initial prompts:
```markdown
## Initial Prompt:
Hello! I'm your [Agent Name]. I can help with [capability].

[Primary action](prompt:complete)
[Alternative action](prompt:complete)
[Custom request for ...](prompt:open)
```

## Performance Considerations

- Lightweight components (no heavy dependencies)
- Event system uses native browser APIs
- ReactMarkdown custom renderer has minimal overhead
- Button rendering is optimized with Ionic React

## Future Enhancements

### Potential Features
- [ ] Numbered selection (1, 2, 3 keyboard shortcuts)
- [ ] Prompt history/favorites
- [ ] Dynamic prompt generation based on context
- [ ] Analytics on prompt usage patterns
- [ ] Multi-select prompts for batch actions

### Community Feedback
Monitor user behavior:
- Which prompts are most clicked?
- Are users discovering the feature?
- Does it reduce typing burden?
- Does it improve workflow completion?

## Related Documentation

- `DOCUMENTATION/AGENTS.md` - Agent system overview
- `.github/copilot-instructions.md` - Project guidelines
- `src/components/AgentIndicator.tsx` - Agent UI components
- `src/components/SessionDialog.tsx` - Message display

## Support

For questions or issues:
1. Search knowledge base: `"suggested-prompts-usage"`
2. Review agent instruction files
3. Check test files for examples
4. Open GitHub issue with reproduction steps

---

**Created:** 2025-11-02  
**Version:** 1.0.0  
**Status:** Production Ready ✅

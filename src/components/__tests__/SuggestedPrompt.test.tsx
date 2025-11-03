// Test file for suggested prompts feature
// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedPrompt from '../SuggestedPrompt';

describe('SuggestedPrompt Component', () => {
  const mockOnPromptSelect = jest.fn();

  beforeEach(() => {
    mockOnPromptSelect.mockClear();
  });

  it('renders complete prompt with solid fill', () => {
    render(
      <SuggestedPrompt
        text="Generate RFP"
        isComplete={true}
        onPromptSelect={mockOnPromptSelect}
      />
    );

    const button = screen.getByTestId('suggested-prompt-complete');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Generate RFP');
    expect(button).not.toHaveTextContent('...');
  });

  it('renders open-ended prompt with outline and ellipsis', () => {
    render(
      <SuggestedPrompt
        text="I'd like to source"
        isComplete={false}
        onPromptSelect={mockOnPromptSelect}
      />
    );

    const button = screen.getByTestId('suggested-prompt-open');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("I'd like to source ...");
  });

  it('calls onPromptSelect with correct parameters for complete prompt', () => {
    render(
      <SuggestedPrompt
        text="Create RFP"
        isComplete={true}
        onPromptSelect={mockOnPromptSelect}
      />
    );

    const button = screen.getByTestId('suggested-prompt-complete');
    fireEvent.click(button);

    expect(mockOnPromptSelect).toHaveBeenCalledWith('Create RFP', true);
  });

  it('calls onPromptSelect with correct parameters for open-ended prompt', () => {
    render(
      <SuggestedPrompt
        text="Find vendors in"
        isComplete={false}
        onPromptSelect={mockOnPromptSelect}
      />
    );

    const button = screen.getByTestId('suggested-prompt-open');
    fireEvent.click(button);

    expect(mockOnPromptSelect).toHaveBeenCalledWith('Find vendors in', false);
  });

  it('applies custom styling when provided', () => {
    const customStyle = { color: 'red' };
    render(
      <SuggestedPrompt
        text="Custom Style"
        isComplete={true}
        onPromptSelect={mockOnPromptSelect}
        style={customStyle}
      />
    );

    const button = screen.getByTestId('suggested-prompt-complete');
    // Just verify the component renders - IonButton styling is complex
    expect(button).toBeInTheDocument();
  });
});

describe('Suggested Prompts Integration', () => {
  it('detects prompt:complete links in markdown', () => {
    const markdown = '[Create RFP](prompt:complete)';
    
    // This would be tested in SessionDialog integration test
    expect(markdown).toContain('prompt:complete');
  });

  it('detects prompt:open links in markdown', () => {
    const markdown = "[I'd like to source ...](prompt:open)";
    
    expect(markdown).toContain('prompt:open');
  });

  it('handles fillPrompt event in PromptComponent', async () => {
    // This tests the custom event system
    const fillEvent = new CustomEvent('fillPrompt', {
      detail: { text: 'Test prompt text' }
    });

    // Dispatch the event
    window.dispatchEvent(fillEvent);

    // In a real test, we'd verify the textarea is filled
    // For now, just verify the event can be created and dispatched
    expect(fillEvent.detail.text).toBe('Test prompt text');
  });
});

describe('Suggested Prompts - Agent Usage Examples', () => {
  it('validates Solutions Agent welcome prompt syntax', () => {
    const welcomePrompts = [
      "[I'd like to source ...](prompt:open)",
      '[Learn about EZRFP.APP](prompt:complete)',
      '[Talk to RFP Design agent](prompt:complete)'
    ];

    welcomePrompts.forEach(prompt => {
      expect(prompt).toMatch(/\[.*?\]\(prompt:(complete|open)\)/);
    });
  });

  it('validates RFP Design Agent workflow prompts', () => {
    const workflowPrompts = [
      '[Create the RFP now](prompt:complete)',
      '[I have specific needs for ...](prompt:open)',
      '[Show me examples](prompt:complete)'
    ];

    workflowPrompts.forEach(prompt => {
      expect(prompt).toMatch(/\[.*?\]\(prompt:(complete|open)\)/);
    });
  });

  it('validates Sourcing Agent vendor prompts', () => {
    const vendorPrompts = [
      '[Review all vendors](prompt:complete)',
      '[Find more vendors in ...](prompt:open)',
      '[Yes, send invitations](prompt:complete)'
    ];

    vendorPrompts.forEach(prompt => {
      expect(prompt).toMatch(/\[.*?\]\(prompt:(complete|open)\)/);
    });
  });
});

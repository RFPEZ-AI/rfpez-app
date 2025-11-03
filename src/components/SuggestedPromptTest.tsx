// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton } from '@ionic/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SuggestedPrompt from './SuggestedPrompt';

/**
 * Test component to verify suggested prompts render correctly
 * This simulates what agents should generate in their responses
 */
const SuggestedPromptTest: React.FC = () => {
  const [testOutput, setTestOutput] = React.useState<string>('');

  const testMarkdown = `
## Test: Complete Prompts (Auto-Submit)

These should render as solid buttons that auto-submit when clicked:

[Create a new RFP](prompt:complete)
[Find vendors](prompt:complete)
[Review requirements](prompt:complete)

---

## Test: Open-Ended Prompts (Fill Input)

These should render as outline buttons with "..." that fill the input when clicked:

[I'd like to source ...](prompt:open)
[Create an RFP for ...](prompt:open)
[Find vendors in ...](prompt:open)

---

## Test: Mixed Prompts (Recommended)

This is the pattern agents should use:

[I'd like to source ...](prompt:open)
[Learn about the platform](prompt:complete)
[Talk to a specialist](prompt:complete)

---

## Test: Regular Links (Should NOT Convert)

These should render as normal links:

[Regular link](https://example.com)
[Another link](/some-page)
`;

  const handlePromptSelect = (text: string, isComplete: boolean) => {
    const action = isComplete ? 'AUTO-SUBMIT' : 'FILL INPUT';
    const output = `✅ Prompt clicked!\nText: "${text}"\nType: ${action}\n\n`;
    setTestOutput(prev => output + prev);
    console.log('Prompt selected:', { text, isComplete });
  };

  const handleLinkClick = (href: string) => {
    const output = `🔗 Link clicked: ${href}\n\n`;
    setTestOutput(prev => output + prev);
    console.log('Link clicked:', href);
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Suggested Prompts Component Test</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ marginBottom: '1rem' }}>
          <IonButton 
            expand="block" 
            onClick={() => setTestOutput('')}
          >
            Clear Test Output
          </IonButton>
        </div>

        {testOutput && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            background: '#f0f0f0', 
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <strong>Test Output:</strong>
            <br />
            {testOutput}
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children, ...props }) => {
              // Check if this is a suggested prompt link
              if (href?.startsWith('prompt:')) {
                const isComplete = href === 'prompt:complete';
                const text = typeof children === 'string' 
                  ? children 
                  : (Array.isArray(children) ? children.join('') : '');
                
                return (
                  <SuggestedPrompt
                    text={text}
                    isComplete={isComplete}
                    onPromptSelect={handlePromptSelect}
                  />
                );
              }
              
              // Regular link - for testing
              return (
                <a 
                  href={href} 
                  {...props}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(href || '');
                  }}
                  style={{ color: 'blue', textDecoration: 'underline' }}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {testMarkdown}
        </ReactMarkdown>
      </IonCardContent>
    </IonCard>
  );
};

export default SuggestedPromptTest;

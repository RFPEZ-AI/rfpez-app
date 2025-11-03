// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonButton } from '@ionic/react';

interface SuggestedPromptProps {
  /** The prompt text to display */
  text: string;
  /** Whether this is a complete prompt (auto-submit) or open-ended (copy to input) */
  isComplete: boolean;
  /** Callback when prompt is clicked */
  onPromptSelect: (text: string, autoSubmit: boolean) => void;
  /** Optional custom styling */
  style?: React.CSSProperties;
}

/**
 * SuggestedPrompt Component
 * 
 * Renders a clickable prompt button that can either:
 * - Auto-submit (complete prompts) - Filled button style
 * - Copy to input (open-ended prompts) - Outline button style
 * 
 * Used by agents to provide quick response options to users.
 */
const SuggestedPrompt: React.FC<SuggestedPromptProps> = ({ 
  text, 
  isComplete, 
  onPromptSelect,
  style 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 SuggestedPrompt clicked:', { text, isComplete });
    onPromptSelect(text, isComplete);
  };

  return (
    <IonButton
      fill={isComplete ? "solid" : "outline"}
      size="small"
      onClick={handleClick}
      style={{
        margin: '4px',
        textTransform: 'none',
        fontSize: '14px',
        '--border-radius': '20px',
        '--padding-start': '16px',
        '--padding-end': '16px',
        ...style
      }}
      data-testid={`suggested-prompt-${isComplete ? 'complete' : 'open'}`}
    >
      {text}
      {!isComplete && ' ...'}
    </IonButton>
  );
};

export default SuggestedPrompt;

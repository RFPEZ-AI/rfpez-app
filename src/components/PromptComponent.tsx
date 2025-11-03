// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useRef, useEffect } from 'react';
import { IonButton, IonIcon, IonTextarea } from '@ionic/react';
import { sendOutline, attachOutline } from 'ionicons/icons';

interface PromptComponentProps {
  onSendMessage: (message: string) => void;
  onAttachFile?: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const PromptComponent: React.FC<PromptComponentProps> = ({
  onSendMessage,
  onAttachFile,
  isLoading = false,
  placeholder = "Type your message here...",
  autoFocus = true
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLIonTextareaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial focus when component mounts
  useEffect(() => {
    if (autoFocus) {
      // Small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setFocus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Listen for fillPrompt events from suggested prompts
  useEffect(() => {
    const handleFillPrompt = (event: Event) => {
      const customEvent = event as CustomEvent<{ text: string }>;
      console.log('📝 PromptComponent received fillPrompt event:', customEvent.detail);
      if (customEvent.detail?.text) {
        setMessage(customEvent.detail.text);
        console.log('✅ Message set to:', customEvent.detail.text);
        // Focus the textarea after filling
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setFocus();
            console.log('✅ Textarea focused');
          }
        }, 100);
      }
    };

    console.log('👂 PromptComponent: Setting up fillPrompt event listener');
    window.addEventListener('fillPrompt', handleFillPrompt);
    return () => {
      console.log('🔕 PromptComponent: Removing fillPrompt event listener');
      window.removeEventListener('fillPrompt', handleFillPrompt);
    };
  }, []);

  // Auto-scroll when textarea expands to ensure prompt stays fully visible
  useEffect(() => {
    if (containerRef.current) {
      // First, scroll to ensure the prompt is in view
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' // Ensure the bottom of the prompt is visible
      });
      
      // Additional check to ensure full visibility after a brief delay
      setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // If any part of the prompt is below the viewport, scroll to show it fully
          if (rect.bottom > viewportHeight) {
            containerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end'
            });
          }
          // If the prompt is too high up and not fully visible, center it
          else if (rect.top < 0) {
            containerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            });
          }
        }
      }, 100);
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Refocus after sending and ensure prompt stays visible
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setFocus();
        }
        
        // Ensure prompt is still fully visible after sending
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          if (rect.bottom > viewportHeight || rect.top < 0) {
            containerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end'
            });
          }
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault(); // Prevent default line break
      handleSend();
    }
    // If Shift+Enter, allow default behavior (line break)
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        borderTop: '2px solid var(--ion-color-primary)',
        padding: '16px 12px',
        backgroundColor: 'var(--ion-color-light)',
        boxShadow: '0 -4px 12px rgba(var(--ion-color-primary-rgb), 0.15)',
        position: 'relative',
        marginTop: '16px', // Space from last message
        borderRadius: '16px 16px 0 0' // Rounded top corners
      }}>
      {/* Highlight border animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary), var(--ion-color-primary))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s ease-in-out infinite',
        borderRadius: '16px 16px 0 0'
      }} />
      
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            50% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          .prompt-input-container {
            transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
          }
          
          .prompt-input-container:hover {
            border-color: var(--ion-color-medium) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 3px 12px rgba(0, 0, 0, 0.1), 0 1px 6px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--ion-color-primary), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
            transform: translateY(-2px);
          }
          
          .prompt-input-container:focus-within {
            border-color: var(--ion-color-primary) !important;
            box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.2), 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 2px var(--ion-color-primary), inset 0 1px 0 rgba(255, 255, 255, 1) !important;
            transform: translateY(-3px);
          }

          .expandable-textarea {
            min-height: 48px;
            max-height: 200px;
            transition: height 0.2s ease;
          }
          
          .expandable-textarea .native-textarea {
            font-size: 16px !important;
            line-height: 1.4 !important;
          }
          
          /* Improve placeholder visibility - lighter shade */
          .expandable-textarea input::placeholder,
          .expandable-textarea textarea::placeholder {
            color: var(--ion-color-medium) !important;
            opacity: 0.6 !important;
            font-weight: 400 !important;
            font-style: italic !important;
          }
        `}
      </style>

      <div 
        className="prompt-input-container"
        style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '8px',
        width: '100%',
        maxWidth: '100%',
        padding: '10px 12px',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        border: '3px solid var(--ion-color-light-shade)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}>
        {/* File attachment button - HIDDEN: Not yet supported, will be enabled later */}
        {false && onAttachFile && (
          <div>
            <input
              type="file"
              id="file-input"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            <IonButton
              fill="clear"
              size="default"
              onClick={() => {
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                fileInput?.click();
              }}
              disabled={isLoading}
              title="Attach file to session"
            >
              <IonIcon icon={attachOutline} />
            </IonButton>
          </div>
        )}

        {/* Message input */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <IonTextarea
            ref={textareaRef}
            value={message}
            placeholder={placeholder}
            aria-label="Message input"
            data-testid="message-input"
            onIonInput={(e) => setMessage(e.detail.value || '')}
            onKeyDown={handleKeyDown}
            rows={1}
            autoGrow
            className="expandable-textarea"
            style={{
              '--background': 'transparent',
              '--border-radius': '8px',
              '--padding': '12px 14px',
              '--color': 'var(--ion-text-color)',
              '--placeholder-color': 'var(--ion-color-medium)',
              '--placeholder-opacity': '0.6',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '16px',
              fontWeight: '400',
              width: '100%'
            }}
          />
        </div>

        {/* Send button */}
        <div title="Submit">
          <IonButton
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            size="default"
            color="primary"
            data-testid="submit-message-button"
            style={{
              '--border-radius': '12px',
              '--box-shadow': '0 2px 4px rgba(var(--ion-color-primary-rgb), 0.3)',
              minHeight: '44px'
            }}
          >
            <IonIcon icon={sendOutline} />
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default PromptComponent;

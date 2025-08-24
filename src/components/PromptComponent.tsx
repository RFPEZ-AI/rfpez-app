import React, { useState, useRef, useEffect } from 'react';
import { IonButton, IonIcon, IonTextarea } from '@ionic/react';
import { sendOutline, attachOutline } from 'ionicons/icons';

interface PromptComponentProps {
  onSendMessage: (message: string) => void;
  onAttachFile?: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const PromptComponent: React.FC<PromptComponentProps> = ({
  onSendMessage,
  onAttachFile,
  isLoading = false,
  placeholder = "Type your message here..."
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  // Set initial focus when component mounts
  useEffect(() => {
    // Small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setFocus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div style={{ 
      borderTop: '2px solid var(--ion-color-primary)',
      padding: '20px',
      backgroundColor: 'var(--ion-color-light)',
      boxShadow: '0 -4px 12px rgba(var(--ion-color-primary-rgb), 0.15)',
      position: 'relative'
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
        animation: 'shimmer 3s ease-in-out infinite'
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
            border-color: var(--ion-color-primary-shade) !important;
            box-shadow: 0 2px 12px rgba(var(--ion-color-primary-rgb), 0.2), 0 0 0 1px var(--ion-color-primary) !important;
            transform: translateY(-1px);
          }
          
          .prompt-input-container:focus-within {
            border-color: var(--ion-color-primary-shade) !important;
            box-shadow: 0 2px 16px rgba(var(--ion-color-primary-rgb), 0.3), 0 0 0 2px var(--ion-color-primary) !important;
            transform: translateY(-2px);
          }
        `}
      </style>

      <div 
        className="prompt-input-container"
        style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '12px',
        maxWidth: '100%',
        padding: '8px',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--ion-color-primary-tint)',
        border: '2px solid var(--ion-color-primary)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}>
        {/* File attachment button */}
        {onAttachFile && (
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
        <div style={{ flex: 1 }}>
          <IonTextarea
            ref={textareaRef}
            value={message}
            placeholder={placeholder}
            onIonInput={(e) => setMessage(e.detail.value || '')}
            onKeyDown={handleKeyDown}
            rows={1}
            autoGrow
            style={{
              '--background': 'transparent',
              '--border-radius': '8px',
              '--padding': '12px',
              '--color': 'var(--ion-text-color)',
              '--placeholder-color': 'var(--ion-color-medium)',
              border: 'none',
              outline: 'none'
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
            style={{
              '--border-radius': '12px',
              '--box-shadow': '0 2px 4px rgba(var(--ion-color-primary-rgb), 0.3)'
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

import React, { useState } from 'react';
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

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
  };

  return (
    <div style={{ 
      borderTop: '1px solid var(--ion-color-light-shade)',
      padding: '16px',
      backgroundColor: 'var(--ion-color-light)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: '12px',
        maxWidth: '100%'
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
            >
              <IonIcon icon={attachOutline} />
            </IonButton>
          </div>
        )}

        {/* Message input */}
        <div style={{ flex: 1 }}>
          <IonTextarea
            value={message}
            placeholder={placeholder}
            onIonInput={(e) => setMessage(e.detail.value || '')}
            rows={1}
            autoGrow
            style={{
              '--background': 'white',
              '--border-radius': '12px',
              '--padding': '12px'
            }}
          />
        </div>

        {/* Send button */}
        <IonButton
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="default"
        >
          <IonIcon icon={sendOutline} />
        </IonButton>
      </div>
    </div>
  );
};

export default PromptComponent;

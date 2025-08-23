import React, { useEffect, useRef } from 'react';
import { IonCard, IonCardContent } from '@ionic/react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
}

interface SessionDialogProps {
  messages: Message[];
  isLoading?: boolean;
}

const SessionDialog: React.FC<SessionDialogProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px',
      overflow: 'auto'
    }}>
      <div style={{ flex: 1 }}>
        {messages.map((message) => (
            <IonCard 
              key={message.id}
              style={{
                marginLeft: message.isUser ? '20%' : '0',
                marginRight: message.isUser ? '0' : '20%',
                backgroundColor: message.isUser 
                  ? 'var(--ion-color-primary)' 
                  : 'var(--ion-color-light)',
                border: message.isUser 
                  ? '1px solid var(--ion-color-primary-shade)' 
                  : '1px solid var(--ion-color-light-shade)'
              }}
            >
              <IonCardContent style={{
                color: message.isUser ? 'var(--ion-color-primary-contrast)' : 'var(--ion-text-color)'
              }}>
                {!message.isUser && message.agentName && (
                  <div style={{ 
                    fontSize: '0.9em', 
                    fontWeight: 'bold',
                    color: 'var(--ion-color-primary)',
                    marginBottom: '8px'
                  }}>
                    {message.agentName}
                  </div>
                )}
                <div style={{ 
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.content}
                </div>
                <div style={{ 
                  fontSize: '0.8em', 
                  opacity: 0.7, 
                  marginTop: '8px'
                }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
          {isLoading && (
            <IonCard style={{ marginRight: '20%' }}>
              <IonCardContent>
                <div>AI is thinking...</div>
              </IonCardContent>
            </IonCard>
          )}
          <div ref={messagesEndRef} />
        </div>
    </div>
  );
};

export default SessionDialog;

// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useRef } from 'react';
import { IonCard, IonCardContent } from '@ionic/react';
import PromptComponent from './PromptComponent';
import ArtifactReferenceTag from './ArtifactReferenceTag';
import { ArtifactReference } from '../types/home';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
  artifactRefs?: ArtifactReference[]; // References to artifacts mentioned in this message
}

interface SessionDialogProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  onAttachFile?: (file: File) => void;
  promptPlaceholder?: string;
  onArtifactSelect?: (artifactRef: ArtifactReference) => void; // New prop for artifact selection
}

const SessionDialog: React.FC<SessionDialogProps> = ({ 
  messages, 
  isLoading = false,
  onSendMessage,
  onAttachFile,
  promptPlaceholder = "Type your message here...",
  onArtifactSelect
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Try to scroll to prompt first, then to messages end
    if (promptRef.current) {
      promptRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
      overflow: 'hidden'
    }}>
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        marginBottom: '16px'
      }}>
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
                
                {/* Artifact references */}
                {message.artifactRefs && message.artifactRefs.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${message.isUser ? 'rgba(255,255,255,0.2)' : 'var(--ion-color-light-shade)'}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.8em',
                      opacity: 0.8,
                      marginRight: '8px',
                      fontWeight: '500'
                    }}>
                      {message.artifactRefs.some(ref => ref.isCreated) ? '✨ Created:' : '📎 Referenced:'}
                    </span>
                    {/* Deduplicate artifact references by artifactId before rendering */}
                    {Array.from(new Map(message.artifactRefs.map(ref => [ref.artifactId, ref])).values()).map((artifactRef, index) => (
                      <ArtifactReferenceTag
                        key={`${message.id}-${artifactRef.artifactId}-${index}`}
                        artifactRef={artifactRef}
                        onClick={onArtifactSelect}
                        size="small"
                        showTypeIcon={true}
                      />
                    ))}
                  </div>
                )}
                
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
          
          {/* Prompt Component positioned after last message */}
          <div ref={promptRef}>
            <PromptComponent
              onSendMessage={onSendMessage}
              onAttachFile={onAttachFile}
              isLoading={isLoading}
              placeholder={promptPlaceholder}
              autoFocus={messages.length === 0} // Only auto-focus if no messages yet
            />
          </div>
        </div>
    </div>
  );
};

export default SessionDialog;

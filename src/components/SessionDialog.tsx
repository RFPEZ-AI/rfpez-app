// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon, IonChip, IonLabel } from '@ionic/react';
import { chevronDownOutline, checkmarkCircle, documentText } from 'ionicons/icons';
import PromptComponent from './PromptComponent';
import ArtifactReferenceTag from './ArtifactReferenceTag';
import ToolExecutionDisplay from './ToolExecutionDisplay';
import SuggestedPrompt from './SuggestedPrompt';
import { ArtifactReference } from '../types/home';
import { FileAttachment } from '../types/database';
import { ToolInvocationEvent } from '../types/streamingProtocol';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
  artifactRefs?: ArtifactReference[]; // References to artifacts mentioned in this message
  isToolProcessing?: boolean; // True if this is a tool processing indicator message
  metadata?: Record<string, unknown>; // Additional metadata including tool invocations
  hidden?: boolean; // True if this message should not be displayed in the UI
  file_attachments?: FileAttachment[]; // File attachments for this message
}

interface SessionDialogProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string, fileAttachments?: FileAttachment[]) => void;
  onAttachFile?: (file: File) => void;
  promptPlaceholder?: string;
  onArtifactSelect?: (artifactRef: ArtifactReference) => void; // New prop for artifact selection
  currentAgent?: { agent_name: string } | null; // Current agent for dynamic thinking message
  onCancelRequest?: () => void; // Function to cancel the current request
  // Tool execution props
  // toolInvocations?: ToolInvocationEvent[];
  // isToolExecutionActive?: boolean;
  // Session loading props
  forceScrollToBottom?: boolean; // Force scroll to bottom when session is loaded
  isSessionLoading?: boolean; // Force focus on input when session is loading/refreshing
  // File upload context
  accountId?: string;
  userId?: string;
  currentRfpId?: number | null;
}

const SessionDialog: React.FC<SessionDialogProps> = ({ 
  messages, 
  isLoading = false,
  onSendMessage,
  // onAttachFile, // Deprecated - file uploads now handled directly in PromptComponent
  promptPlaceholder = "Type your message here...",
  onArtifactSelect,
  currentAgent,
  onCancelRequest,
  // Tool execution props
  // Session loading props
  forceScrollToBottom = false,
  isSessionLoading = false,
  // File upload context
  accountId,
  userId,
  currentRfpId
}) => {
  // 🔍 DEBUG: Log messages with file attachments
  useEffect(() => {
    const messagesWithFiles = messages.filter(m => m.file_attachments && m.file_attachments.length > 0);
    if (messagesWithFiles.length > 0) {
      console.log('📎 SessionDialog received messages with file attachments:', messagesWithFiles.map(m => ({
        id: m.id,
        content: m.content.substring(0, 40),
        file_count: m.file_attachments?.length,
        files: m.file_attachments?.map(f => f.file_name)
      })));
    }
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handler for suggested prompts
  const handleSuggestedPrompt = useCallback((promptText: string, autoSubmit: boolean) => {
    if (autoSubmit) {
      // Complete prompts auto-submit
      onSendMessage(promptText);
    } else {
      // Open-ended prompts need to be filled into the input
      // We'll use a custom event to communicate with PromptComponent
      const event = new CustomEvent('fillPrompt', { detail: { text: promptText } });
      window.dispatchEvent(event);
    }
  }, [onSendMessage]);

  const scrollToBottom = useCallback(() => {
    // Try to scroll to prompt first, then to messages end
    if (promptRef.current) {
      promptRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Enhanced scroll detection to determine if prompt is visible
  const checkPromptVisibility = useCallback(() => {
    if (!promptRef.current || !scrollContainerRef.current) return;

    const promptRect = promptRef.current.getBoundingClientRect();
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    
    // Check if the prompt is at least partially visible
    const isVisible = promptRect.bottom <= containerRect.bottom + 50; // 50px buffer
    
    setShowScrollButton(!isVisible && messages.length > 2); // Only show if we have messages and prompt is not visible
  }, [messages.length]);

  // Set up intersection observer for better prompt visibility detection
  useEffect(() => {
    if (!promptRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting || entry.intersectionRatio > 0.1;
        setShowScrollButton(!isVisible && messages.length > 2);
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '0px 0px 50px 0px', // 50px buffer at bottom
        threshold: [0, 0.1, 0.5, 1]
      }
    );

    observer.observe(promptRef.current);

    return () => observer.disconnect();
  }, [messages.length]);

  // Auto-scroll when messages change or loading state changes
  useEffect(() => {
    // Add a small delay to ensure DOM updates are complete
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isLoading, scrollToBottom]);

  // Force scroll to bottom when session is loaded/refreshed
  useEffect(() => {
    if (forceScrollToBottom && messages.length > 0) {
      // Longer delay to ensure all content is rendered after session load
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [forceScrollToBottom, messages.length, scrollToBottom]);

  // Additional scroll on window resize
  useEffect(() => {
    const handleResize = () => {
      checkPromptVisibility();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkPromptVisibility]);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div 
        ref={scrollContainerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto',
          marginBottom: '16px',
          scrollBehavior: 'smooth'
        }}
      >
  {messages.filter((message) => !message.hidden && !message.metadata?.isSystemNotification).map((message) => (
            <IonCard 
              key={message.id}
              style={{
                marginLeft: message.isUser ? '20%' : '0',
                marginRight: message.isUser ? '0' : '20%',
                backgroundColor: message.isToolProcessing
                  ? 'var(--ion-color-warning-tint)'
                  : message.isUser 
                    ? 'var(--ion-color-primary)' 
                    : 'var(--ion-color-light)',
                border: message.isToolProcessing
                  ? '1px solid var(--ion-color-warning)'
                  : message.isUser 
                    ? '1px solid var(--ion-color-primary-shade)' 
                    : '1px solid var(--ion-color-light-shade)',
                opacity: message.isToolProcessing ? 0.9 : 1,
                animation: message.isToolProcessing ? 'pulse 2s infinite' : 'none'
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
                  whiteSpace: message.isUser ? 'pre-wrap' : 'normal'
                }}>
                  {message.isUser ? (
                    message.content
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      urlTransform={(url) => {
                        // Allow our custom prompt: protocol
                        if (url.startsWith('prompt:')) {
                          return url;
                        }
                        // Default behavior for other URLs
                        return url;
                      }}
                      components={{
                        // Custom link renderer to handle suggested prompts
                        a: ({ href, children, ...props }) => {
                          // Check if this is a suggested prompt link
                          if (href?.startsWith('prompt:')) {
                            const isComplete = href === 'prompt:complete';
                            const promptText = typeof children === 'string' 
                              ? children 
                              : Array.isArray(children) 
                                ? children.join('') 
                                : String(children);
                            
                            return (
                              <SuggestedPrompt
                                text={promptText}
                                isComplete={isComplete}
                                onPromptSelect={handleSuggestedPrompt}
                              />
                            );
                          }
                          
                          // Regular link - prevent navigation
                          return (
                            <a 
                              href={href} 
                              onClick={(e) => {
                                e.preventDefault();
                              }}
                              style={{
                                color: 'var(--ion-color-primary)',
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }}
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                  {/* Show typing indicator for streaming messages that are still being written */}
                  {!message.isUser && message.content.length > 0 && isLoading && (
                    <span style={{
                      opacity: 0.7,
                      animation: 'blink 1s infinite',
                      marginLeft: '2px'
                    }}>▊</span>
                  )}
                </div>

                {/* Display file attachments if present */}
                {message.file_attachments && message.file_attachments.length > 0 && (
                  <div style={{ 
                    marginTop: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {message.file_attachments.map((attachment) => (
                      <IonChip 
                        key={attachment.memory_id}
                        color={message.isUser ? "light" : "medium"}
                        style={{
                          fontSize: '0.85em',
                          opacity: 0.9
                        }}
                      >
                        <IonIcon icon={message.isUser ? checkmarkCircle : documentText} />
                        <IonLabel>
                          {attachment.file_name}
                          {attachment.file_size && (
                            <span style={{ fontSize: '0.9em', opacity: 0.7 }}>
                              {' '}({(attachment.file_size / 1024).toFixed(1)}KB)
                            </span>
                          )}
                        </IonLabel>
                      </IonChip>
                    ))}
                  </div>
                )}
                
                <style>
                  {`
                    @keyframes blink {
                      0%, 50% { opacity: 1; }
                      51%, 100% { opacity: 0; }
                    }
                    @keyframes pulse {
                      0% { opacity: 0.9; }
                      50% { opacity: 0.6; }
                      100% { opacity: 0.9; }
                    }
                  `}
                </style>
                
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
                
                {/* Tool invocations from message metadata */}
                {(() => {
                  // Check for tool calls in metadata - supports both structures:
                  // 1. toolInvocations (detailed ToolInvocationEvent[])
                  // 2. functions_called (simple string[]) from ai_metadata
                  const toolInvocations = message.metadata?.toolInvocations;
                  const functionsCalled = message.metadata?.functions_called;
                  
                  // Display detailed tool invocations if available
                  if (!message.isUser && toolInvocations && Array.isArray(toolInvocations) && toolInvocations.length > 0) {
                    return (
                      <div style={{ marginTop: '8px' }}>
                        <ToolExecutionDisplay
                          toolInvocations={toolInvocations as ToolInvocationEvent[]}
                          isActive={false}
                        />
                      </div>
                    );
                  }
                  
                  // Display simple function names if available (from ai_metadata)
                  if (!message.isUser && functionsCalled && Array.isArray(functionsCalled) && functionsCalled.length > 0) {
                    return (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                        borderRadius: '6px',
                        fontSize: '0.85em'
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          color: 'var(--ion-color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>🔧</span>
                          <span>Tools Used:</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '4px',
                          marginTop: '6px'
                        }}>
                          {functionsCalled.map((toolName: string, idx: number) => (
                            <span
                              key={`tool-${idx}`}
                              style={{
                                padding: '3px 8px',
                                background: 'var(--ion-color-primary)',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.9em',
                                fontFamily: 'monospace'
                              }}
                            >
                              {toolName}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {/* Check if we have a partial message being streamed */}
                    {messages.length > 0 && !messages[messages.length - 1].isUser && messages[messages.length - 1].content.length > 0
                      ? `${currentAgent?.agent_name || 'AI'} Agent is responding...`
                      : `${currentAgent?.agent_name || 'AI'} Agent is thinking...`
                    }
                  </div>
                  {onCancelRequest && (
                    <button 
                      onClick={onCancelRequest}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}
          
          {/* 🔧 DISABLED: Standalone Tool Execution Display - Tools now shown in individual messages */}
          {/* {(toolInvocations.length > 0 || isToolExecutionActive) && (
            <ToolExecutionDisplay
              toolInvocations={toolInvocations}
              isActive={isToolExecutionActive}
              className="ion-margin-vertical"
            />
          )} */}
          
          <div ref={messagesEndRef} />
          
          {/* Prompt Component positioned after last message */}
          <div ref={promptRef}>
            <PromptComponent
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              placeholder={promptPlaceholder}
              autoFocus={messages.length === 0 || isSessionLoading} // Auto-focus for new sessions OR when session is loading
              accountId={accountId}
              userId={userId}
              currentRfpId={currentRfpId ?? undefined}
            />
          </div>
        </div>

        {/* Floating Scroll-to-Bottom Button */}
        {showScrollButton && (
          <IonButton
            fill="solid"
            color="primary"
            size="small"
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              animation: 'fadeInUp 0.3s ease-out'
            }}
            data-testid="scroll-to-bottom-button"
          >
            <IonIcon icon={chevronDownOutline} />
          </IonButton>
        )}

        <style>
          {`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
    </div>
  );
};

export default SessionDialog;

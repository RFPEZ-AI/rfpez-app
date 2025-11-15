// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useRef, useEffect } from 'react';
import { IonButton, IonIcon, IonTextarea, IonToast, IonSpinner, IonChip, IonLabel } from '@ionic/react';
import { sendOutline, attachOutline, closeCircle, checkmarkCircle, alertCircle } from 'ionicons/icons';
import fileProcessingService, { ACCEPT_STRING } from '../services/fileProcessingService';
import { FileAttachment } from '../types/database';

interface PromptComponentProps {
  onSendMessage: (message: string, fileAttachments?: FileAttachment[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  accountId?: string;
  userId?: string;
  currentRfpId?: number;
}

const PromptComponent: React.FC<PromptComponentProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message here...",
  autoFocus = true,
  accountId,
  userId,
  currentRfpId
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });
  
  const textareaRef = useRef<HTMLIonTextareaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (customEvent.detail?.text) {
        setMessage(customEvent.detail.text);
        // Focus the textarea after filling
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setFocus();
          }
        }, 100);
      }
    };

    window.addEventListener('fillPrompt', handleFillPrompt);
    return () => {
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
      // Pass message and file attachments
      onSendMessage(message.trim(), uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
      setMessage('');
      
      // Clear uploaded attachments and file selection after sending
      setUploadedAttachments([]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = fileProcessingService.validateFile(file);
    if (!validation.valid) {
      setUploadStatus({
        show: true,
        message: validation.error || 'Invalid file',
        type: 'error'
      });
      return;
    }

    // Check if we have account and user IDs
    if (!accountId || !userId) {
      setUploadStatus({
        show: true,
        message: 'Account information not available. Please log in.',
        type: 'error'
      });
      return;
    }

    // Set uploading state
    setSelectedFile(file);
    setIsUploading(true);
    setUploadStatus({ show: false, message: '', type: 'success' });

    try {
      // Upload file to knowledge base
      const result = await fileProcessingService.uploadFile(file, {
        accountId,
        userId,
        rfpId: currentRfpId,
        importanceScore: 0.8
      });

      if (result.success && result.memoryId) {
        // Create file attachment metadata
        const attachment: FileAttachment = {
          memory_id: result.memoryId,
          file_name: file.name,
          file_type: file.type.startsWith('image/') ? 'image' 
                    : file.name.endsWith('.pdf') ? 'pdf'
                    : file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'spreadsheet'
                    : file.name.endsWith('.docx') || file.name.endsWith('.doc') ? 'document'
                    : 'text',
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        };
        
        // Add to uploaded attachments array
        setUploadedAttachments(prev => [...prev, attachment]);
        
        // Clear selected file since it's now in uploaded attachments
        setSelectedFile(null);
        
        setUploadStatus({
          show: true,
          message: `✅ ${file.name} uploaded to knowledge base`,
          type: 'success'
        });
      } else {
        setUploadStatus({
          show: true,
          message: `❌ Upload failed: ${result.error}`,
          type: 'error'
        });
        setSelectedFile(null);
      }
    } catch (error) {
      setUploadStatus({
        show: true,
        message: `❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
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
        {/* File attachment button - Upload files to knowledge base */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            id="file-input"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept={ACCEPT_STRING}
          />
          <IonButton
            fill="clear"
            size="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            title="Upload file to knowledge base (PDF, images, text files, Word, Excel)"
            data-testid="attach-file-button"
          >
            {isUploading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon icon={attachOutline} />
            )}
          </IonButton>
        </div>

        {/* File upload status indicator */}
        {selectedFile && (
          <IonChip 
            color={isUploading ? 'warning' : 'success'}
            style={{ marginBottom: '4px' }}
          >
            <IonLabel style={{ fontSize: '12px' }}>
              {isUploading ? 'Uploading...' : '✓'} {selectedFile.name.substring(0, 20)}
              {selectedFile.name.length > 20 ? '...' : ''}
            </IonLabel>
            {!isUploading && (
              <IonIcon 
                icon={closeCircle} 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              />
            )}
          </IonChip>
        )}

        {/* Display uploaded file attachments */}
        {uploadedAttachments.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '4px',
            marginBottom: '4px' 
          }}>
            {uploadedAttachments.map((attachment, index) => (
              <IonChip 
                key={attachment.memory_id}
                color="success"
              >
                <IonIcon icon={checkmarkCircle} color="success" />
                <IonLabel style={{ fontSize: '12px' }}>
                  {attachment.file_name.substring(0, 20)}
                  {attachment.file_name.length > 20 ? '...' : ''}
                </IonLabel>
                <IonIcon 
                  icon={closeCircle} 
                  onClick={() => {
                    setUploadedAttachments(prev => 
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                />
              </IonChip>
            ))}
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

      {/* Upload status toast */}
      <IonToast
        isOpen={uploadStatus.show}
        onDidDismiss={() => setUploadStatus({ ...uploadStatus, show: false })}
        message={uploadStatus.message}
        duration={uploadStatus.type === 'success' ? 3000 : 5000}
        color={uploadStatus.type === 'success' ? 'success' : 'danger'}
        position="top"
        icon={uploadStatus.type === 'success' ? checkmarkCircle : alertCircle}
      />
    </div>
  );
};

export default PromptComponent;

// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useRef, useEffect } from 'react';
import { IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { downloadOutline, documentTextOutline, chevronBackOutline, chevronForwardOutline, expandOutline, closeOutline, clipboardOutline, imageOutline, chevronUpOutline, reorderTwoOutline } from 'ionicons/icons';
import { useIsMobile } from '../utils/useMediaQuery';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SingletonArtifactWindowProps, Artifact } from '../types/home';
import { RFPService } from '../services/rfpService';

interface BuyerQuestionnaireData {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: Record<string, unknown>;
  title?: string;
  description?: string;
  submitAction?: {
    type: string;
    function_name?: string;
    success_message?: string;
  };
}

interface FormSubmissionData {
  formData?: Record<string, unknown>;
}

const ArtifactWindow: React.FC<SingletonArtifactWindowProps> = ({ 
  artifact,
  onDownload, 
  onFormSubmit,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
  currentRfpId
}) => {
  const isMobile = useIsMobile();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [mobileHeight, setMobileHeight] = useState<number>(40); // Percentage of screen height - more conservative for mobile
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Use external collapsed state if provided, otherwise use internal state
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  // Handle drag to resize on mobile
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !isMobile) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const windowHeight = window.innerHeight;
    const newHeight = Math.max(10, Math.min(50, ((windowHeight - clientY) / windowHeight) * 100)); // Limit to 50vh max
    setMobileHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  // Reset mobile height when collapsed changes
  React.useEffect(() => {
    if (collapsed) {
      setMobileHeight(60); // Reset to better default
    }
  }, [collapsed]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'text':
      case 'pdf':
        return documentTextOutline;
      case 'form':
        return clipboardOutline;
      case 'image':
        return imageOutline;
      default:
        return documentTextOutline;
    }
  };

  // Check if artifact is a buyer questionnaire form (not a document/proposal)
  const isBuyerQuestionnaire = (artifact: Artifact): boolean => {
    console.log('🔍 isBuyerQuestionnaire - Checking artifact:', {
      id: artifact.id,
      name: artifact.name,
      type: artifact.type,
      hasContent: !!artifact.content,
      contentPreview: artifact.content?.substring(0, 100) + '...'
    });
    
    try {
      // First check: if explicitly marked as form type, it should be a form
      if (artifact.type === 'form') {
        console.log('🔍 Artifact type is "form", proceeding with content validation');
        
        // If no content, assume it's a valid but empty form
        if (!artifact.content) {
          console.log('🔍 Form artifact has no content, treating as valid empty form');
          return true;
        }
        
        // Try to parse the content
        const parsed = JSON.parse(artifact.content);
        console.log('🔍 Parsed content keys:', Object.keys(parsed));
        
        // If the parsed content has 'content' and 'content_type' properties, it's a document artifact
        if (parsed.content !== undefined && parsed.content_type !== undefined) {
          console.log('🔍 Document artifact detected (has content/content_type), not a form');
          return false; // This is a document artifact, not a questionnaire
        }
        
        // Check for form structure: must have schema OR be empty (which we'll treat as valid)
        const hasSchema = parsed.schema && typeof parsed.schema === 'object';
        const isEmpty = Object.keys(parsed).length === 0;
        const isValidForm = hasSchema || isEmpty;
        
        console.log('🔍 Form validation result:', {
          hasSchema,
          isEmpty,
          isValidForm,
          schemaType: typeof parsed.schema
        });
        
        return isValidForm;
      }
      
      // Legacy check: if named 'Buyer Questionnaire', it should be a form
      if (artifact.name === 'Buyer Questionnaire') {
        console.log('🔍 Named "Buyer Questionnaire", treating as form');
        return true;
      }
      
      console.log('🔍 Type/name check failed - type:', artifact.type, 'name:', artifact.name);
    } catch (e) {
      console.log('🔍 JSON parse failed or other error:', e);
      // If we can't parse it but it's marked as form type, assume it's a form
      if (artifact.type === 'form') {
        console.log('🔍 Parse failed but type is form, treating as valid form');
        return true;
      }
    }
    return false;
  };

  // Form renderer component
  interface FormRendererProps {
    artifact: Artifact;
    onSubmit: (formData: Record<string, unknown>) => void;
  }

  const FormRenderer: React.FC<FormRendererProps> = ({ artifact, onSubmit }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInModal, setIsInModal] = useState(false);

    // Detect if we're inside a modal
    useEffect(() => {
      const checkModalContext = () => {
        if (containerRef.current) {
          // Check if we're inside an IonContent (which indicates modal context)
          const ionContent = containerRef.current.closest('ion-content');
          const ionModal = containerRef.current.closest('ion-modal');
          setIsInModal(!!(ionContent && ionModal));
        }
      };
      
      checkModalContext();
    }, []);

    try {
      console.log('🎯 FormRenderer: parsing artifact content:', artifact.content);
      const formSpec: BuyerQuestionnaireData = JSON.parse(artifact.content || '{}');
      console.log('🎯 FormRenderer: parsed formSpec:', formSpec);
      console.log('🎯 FormRenderer: formData being used:', formSpec.formData);
      
      const handleSubmit = (data: FormSubmissionData) => {
        console.log('Form submitted:', data.formData);
        if (data.formData) {
          onSubmit(data.formData);
        }
      };

      // Use title from the form spec if available, fallback to artifact name
      const formTitle = formSpec.title || artifact.name;

      return (
        <div 
          ref={containerRef}
          className="form-renderer-container"
          data-testid="form-renderer"
          data-artifact-id={artifact.id}
          data-form-title={formTitle}
          data-is-modal={isInModal}
          data-mobile={isMobile}
          style={{ 
            padding: isMobile ? '8px 8px 8px 8px' : '12px 12px 12px 12px',
            // Add extra top padding when in modal to account for modal header
            paddingTop: isInModal 
              ? (isMobile ? '56px' : '64px') 
              : (isMobile ? '8px' : '12px'),
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
          {/* Custom styles for form inputs with mobile-responsive improvements */}
          <style>{`
            /* Fix ARIA accessibility issue - prevent aria-hidden on router outlet when forms are focused */
            ion-router-outlet[aria-hidden="true"]:has(.form-group input:focus),
            ion-router-outlet[aria-hidden="true"]:has(.form-group textarea:focus),
            ion-router-outlet[aria-hidden="true"]:has(.form-group select:focus),
            ion-router-outlet[aria-hidden="true"]:has(.form-group button:focus),
            ion-router-outlet[aria-hidden="true"]:has(.button-native:focus),
            ion-router-outlet[aria-hidden="true"]:has(ion-button:focus) {
              aria-hidden: false !important;
            }
            
            /* Ensure focused form elements are always accessible */
            .form-group input:focus,
            .form-group textarea:focus,
            .form-group select:focus,
            .form-group button:focus,
            .button-native:focus,
            ion-button:focus {
              outline: 2px solid var(--ion-color-primary);
              outline-offset: 2px;
            }
            
            .form-group input[type="text"],
            .form-group input[type="email"],
            .form-group input[type="number"],
            .form-group input[type="date"],
            .form-group input[type="time"],
            .form-group input[type="password"],
            .form-group input[type="tel"],
            .form-group input[type="url"],
            .form-group textarea,
            .form-group select {
              background-color: #f0f8ff !important;
              border: 1px solid #d0d0d0 !important;
              color: #333333 !important;
              padding: ${isMobile ? '10px 14px' : '8px 12px'} !important;
              border-radius: 4px !important;
              font-size: ${isMobile ? '16px' : '14px'} !important;
              line-height: 1.4 !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            
            .form-group input[type="text"]:focus,
            .form-group input[type="email"]:focus,
            .form-group input[type="number"]:focus,
            .form-group input[type="date"]:focus,
            .form-group input[type="time"]:focus,
            .form-group input[type="password"]:focus,
            .form-group input[type="tel"]:focus,
            .form-group input[type="url"]:focus,
            .form-group textarea:focus,
            .form-group select:focus {
              background-color: #e6f3ff !important;
              border-color: var(--ion-color-primary) !important;
              outline: none !important;
              box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2) !important;
            }
            
            .form-group label {
              color: #333333 !important;
              font-weight: 500 !important;
              margin-bottom: 4px !important;
              display: block !important;
              font-size: ${isMobile ? '14px' : '13px'} !important;
            }
            
            .form-group .help-block {
              color: #666666 !important;
              font-size: ${isMobile ? '12px' : '11px'} !important;
              margin-top: 4px !important;
            }
            
            /* Mobile-specific form improvements */
            @media (max-width: 768px) {
              .form-group {
                margin-bottom: 16px !important;
              }
              
              .form-group textarea {
                min-height: 100px !important;
              }
              
              .form-control {
                min-height: 44px !important; /* iOS recommended touch target */
              }
            }
          `}</style>
          
          <div 
            className="form-content-container"
            data-testid="form-content"
            style={{ 
            flex: 1, 
            overflow: 'auto', 
            marginBottom: isMobile ? '8px' : '12px',
            paddingTop: isMobile ? '8px' : '12px'
          }}>
            <Form
              schema={formSpec.schema}
              uiSchema={(formSpec.uiSchema || {}) as UiSchema<Record<string, unknown>>}
              formData={formSpec.formData || {}}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              validator={validator as any}
              onSubmit={handleSubmit}
              showErrorList={false}
              ref={formRef}
            >
              {/* Hidden submit button for react-jsonschema-form */}
              <button type="submit" style={{ display: 'none' }} />
            </Form>
          </div>
          
          <div 
            className="form-submit-container"
            data-testid="form-submit-area"
            style={{ 
            padding: isMobile ? '8px 0' : '12px 0',
            borderTop: '1px solid var(--ion-color-light)',
            flexShrink: 0
          }}>
            <IonButton
              className="form-submit-button"
              data-testid="form-submit"
              data-form-action="submit"
              expand="block"
              size={isMobile ? 'default' : 'default'}
              style={{
                '--min-height': isMobile ? '48px' : '44px',
                fontSize: isMobile ? '16px' : '14px'
              }}
              onClick={() => {
                console.log('Submit button clicked');
                // Trigger form submission using the ref
                if (formRef.current) {
                  console.log('Form ref available, attempting to submit...');
                  try {
                    // Try to call the submit method if it exists
                    if (formRef.current.submit) {
                      formRef.current.submit();
                    } else {
                      // Fallback: find the form element and submit it
                      const formElement = formRef.current.formElement || 
                                         document.querySelector('form[class*="rjsf"]') ||
                                         document.querySelector('form');
                      if (formElement) {
                        console.log('Found form element, triggering submit...');
                        const submitButton = formElement.querySelector('button[type="submit"]');
                        if (submitButton) {
                          submitButton.click();
                        } else {
                          formElement.requestSubmit();
                        }
                      } else {
                        console.warn('Could not find form element to submit');
                      }
                    }
                  } catch (error) {
                    console.error('Error submitting form:', error);
                  }
                } else {
                  console.warn('Form ref not available');
                }
              }}
            >
              Submit Questionnaire
            </IonButton>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Failed to render form:', error);
      return (
        <div style={{ padding: '16px', color: 'var(--ion-color-danger)' }}>
          <h3>Form Error</h3>
          <p>Unable to render the questionnaire form. Please check the form specification.</p>
          <details style={{ marginTop: '12px' }}>
            <summary>Raw Data</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
              {artifact.content}
            </pre>
          </details>
        </div>
      );
    }
  };

  // Check if artifact is a text artifact
  const isTextArtifact = (artifact: Artifact): boolean => {
    if (!artifact.content) return false;
    
    // Support both 'document' and 'text' types for text artifacts
    if ((artifact.type === 'document' || artifact.type === 'text') && typeof artifact.content === 'string') {
      const content = artifact.content.trim();
      
      // First check if it looks like JSON before attempting to parse
      if (content.startsWith('{') && content.endsWith('}')) {
        try {
          // Try to parse as JSON (structured text artifact)
          const parsed = JSON.parse(artifact.content);
          if (parsed.content_type && typeof parsed.content === 'string') {
            return true;
          }
        } catch (e) {
          // Not valid JSON, fall through to raw content check
        }
      }
      
      // Check for raw markdown/text content
      if (content.length > 0) {
        // Consider it markdown if it contains markdown patterns or if it's plain text
        const hasMarkdownPatterns = /^#{1,6}\s|^\*\*|^\*(?!\*)|^_|^\[.*\]\(.*\)|^>\s|^-\s|^\d+\.\s|```|`[^`]+`/.test(content);
        const hasLineBreaks = content.includes('\n');
        const isPlainText = content.length > 20; // Assume longer text content should be rendered as text
        
        if (hasMarkdownPatterns || hasLineBreaks || isPlainText) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Text renderer component  
  interface TextRendererProps {
    artifact: Artifact;
  }

  const TextRenderer: React.FC<TextRendererProps> = ({ artifact }) => {
    let title: string;
    let description: string;
    let content: string;
    let content_type: string;
    let tags: string[] = [];

    try {
      // Check if content looks like JSON first to avoid parsing errors
      const contentStr = artifact.content || '';
      const trimmedContent = contentStr.trim();
      const looksLikeJSON = trimmedContent.startsWith('{') && trimmedContent.endsWith('}') && trimmedContent.length > 2;
      
      if (looksLikeJSON) {
        try {
          // Try to parse as structured JSON artifact
          const textSpec = JSON.parse(contentStr);
          if (textSpec && typeof textSpec === 'object' && textSpec.content && typeof textSpec.content === 'string') {
            // Structured text artifact
            title = textSpec.title || artifact.name;
            description = textSpec.description || '';
            content = textSpec.content;
            content_type = textSpec.content_type || 'markdown';
            tags = textSpec.tags || [];
          } else {
            throw new Error('Not a structured text artifact');
          }
        } catch (jsonError) {
          // JSON parsing failed, treat as raw content
          console.warn('Failed to parse artifact content as JSON, treating as raw content:', jsonError);
          title = artifact.name;
          description = 'Document content';
          content = contentStr;
          content_type = 'markdown';
          tags = [];
        }
      } else {
        // Raw content - treat as markdown
        title = artifact.name;
        description = 'Document content';
        content = contentStr;
        content_type = 'markdown';
        tags = [];
      }
    } catch (error) {
      // Fallback error handling
      console.error('Error in TextRenderer:', error);
      title = artifact.name || 'Document';
      description = 'Document content';
      content = (artifact.content as string) || 'Unable to display content';
      content_type = 'markdown';
      tags = [];
    }

    const formatContent = (text: string, type: string) => {
      switch (type) {
        case 'markdown':
          return (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for markdown elements
                h1: ({ children }) => (
                  <h1 style={{
                    fontSize: '1.8em',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    marginTop: '24px',
                    color: 'var(--ion-color-primary)',
                    borderBottom: '2px solid var(--ion-color-primary-tint)',
                    paddingBottom: '8px'
                  }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    marginTop: '20px',
                    color: 'var(--ion-color-primary)'
                  }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{
                    fontSize: '1.3em',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    marginTop: '16px',
                    color: 'var(--ion-color-primary)'
                  }}>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 style={{
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    marginTop: '14px',
                    color: 'var(--ion-color-primary)'
                  }}>
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p style={{
                    lineHeight: '1.6',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul style={{
                    marginBottom: '12px',
                    paddingLeft: '20px'
                  }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol style={{
                    marginBottom: '12px',
                    paddingLeft: '20px'
                  }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li style={{
                    marginBottom: '4px',
                    lineHeight: '1.5'
                  }}>
                    {children}
                  </li>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code style={{
                        backgroundColor: 'var(--ion-color-light)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '13px',
                        border: '1px solid var(--ion-color-light-shade)'
                      }}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code style={{
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '13px'
                    }}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre style={{
                    backgroundColor: 'var(--ion-color-light)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--ion-color-light-shade)',
                    overflow: 'auto',
                    marginBottom: '16px',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: '4px solid var(--ion-color-primary)',
                    paddingLeft: '16px',
                    marginLeft: '0',
                    marginBottom: '16px',
                    fontStyle: 'italic',
                    color: 'var(--ion-color-medium)'
                  }}>
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong style={{
                    fontWeight: 'bold',
                    color: 'var(--ion-color-dark)'
                  }}>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em style={{
                    fontStyle: 'italic'
                  }}>
                    {children}
                  </em>
                ),
                hr: () => (
                  <hr style={{
                    border: 'none',
                    borderTop: '1px solid var(--ion-color-light-shade)',
                    margin: '24px 0'
                  }} />
                ),
                table: ({ children }) => (
                  <div style={{ overflow: 'auto', marginBottom: '16px' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1px solid var(--ion-color-light-shade)'
                    }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--ion-color-light)',
                    border: '1px solid var(--ion-color-light-shade)',
                    fontWeight: 'bold',
                    textAlign: 'left'
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{
                    padding: '8px 12px',
                    border: '1px solid var(--ion-color-light-shade)'
                  }}>
                    {children}
                  </td>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--ion-color-primary)',
                      textDecoration: 'underline'
                    }}
                  >
                    {children}
                  </a>
                )
              }}
            >
              {text}
            </ReactMarkdown>
          );
        case 'html':
          return (
            <div
              style={{ fontSize: '14px', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: text }}
            />
          );
        case 'plain':
        default:
          return (
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontSize: '14px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {text}
            </div>
          );
      }
    };

    return (
      <div style={{ 
        padding: '16px', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        {/* Title and description */}
        <div style={{ marginBottom: '16px', flexShrink: 0 }}>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--ion-color-primary)' }}>
            {title || artifact.name}
          </h3>
          {description && description.trim() && (
            <p style={{ 
              margin: '0', 
              color: 'var(--ion-color-medium)', 
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {description}
            </p>
          )}
          {tags.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--ion-color-primary-tint)',
                    color: 'var(--ion-color-primary-contrast)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    marginRight: '6px',
                    marginBottom: '4px'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          backgroundColor: content_type === 'markdown' ? '#ffffff' : 'var(--ion-color-light)',
          padding: content_type === 'markdown' ? (isMobile ? '12px' : '16px') : '12px',
          borderRadius: '8px',
          border: '1px solid var(--ion-color-light-shade)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
        className="markdown-content"
        >
          <style>{`
            .markdown-content {
              /* Override any global styles that might interfere */
              box-sizing: border-box;
            }
            .markdown-content * {
              box-sizing: border-box;
            }
            /* Ensure proper spacing for first and last elements */
            .markdown-content > :first-child {
              margin-top: 0 !important;
            }
            .markdown-content > :last-child {
              margin-bottom: 0 !important;
            }
            /* Improve table styling */
            .markdown-content table {
              font-size: 14px;
              margin: 16px 0;
            }
            /* Code block improvements */
            .markdown-content pre {
              font-size: 13px;
              line-height: 1.4;
              tab-size: 2;
            }
            /* List improvements */
            .markdown-content ul ul,
            .markdown-content ol ol,
            .markdown-content ul ol,
            .markdown-content ol ul {
              margin-top: 4px;
              margin-bottom: 4px;
            }
          `}</style>
          {formatContent(content, content_type)}
        </div>
      </div>
    );
  };

  // Render artifact content
  const renderArtifactContent = (artifact: Artifact) => {
    if (isBuyerQuestionnaire(artifact)) {
      return (
        <FormRenderer 
          artifact={artifact}
          onSubmit={(formData) => handleFormSubmit(artifact, formData)}
        />
      );
    }
    
    if (isTextArtifact(artifact)) {
      return <TextRenderer artifact={artifact} />;
    }
    
    // Default rendering for other artifacts
    return (
      <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
        <h3>{artifact.name}</h3>
        <p>Type: {artifact.type}</p>
        <p>Size: {artifact.size}</p>
        
        {/* Download button for non-form artifacts */}
        {onDownload && (
          <div style={{ marginTop: '16px' }}>
            <IonButton 
              size="small" 
              fill="outline"
              onClick={() => onDownload(artifact)}
            >
              <IonIcon icon={downloadOutline} slot="start" />
              Download
            </IonButton>
          </div>
        )}
        
        {artifact.content && (
          <div style={{ marginTop: '16px' }}>
            <h4>Content:</h4>
            <pre style={{ 
              fontSize: '12px', 
              overflow: 'auto', 
              maxHeight: '300px',
              backgroundColor: 'var(--ion-color-light)',
              padding: '12px',
              borderRadius: '4px'
            }}>
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // Form submission handler
  const handleFormSubmit = async (artifact: Artifact, formData: Record<string, unknown>) => {
    console.log('=== FORM SUBMISSION START ===');
    console.log('Artifact name:', artifact.name);
    console.log('Artifact type:', artifact.type);
    console.log('Form data:', formData);
    console.log('Current RFP ID:', currentRfpId);
    console.log('onFormSubmit prop:', typeof onFormSubmit);
    
    if (onFormSubmit) {
      console.log('Using external onFormSubmit handler');
      onFormSubmit(artifact, formData);
      return;
    }
    
    try {
      // Use currentRfpId from props
      if (!currentRfpId) {
        console.error('❌ No RFP context available');
        alert('No RFP context available. Please select an RFP first.');
        return;
      }

      console.log('📤 Updating RFP questionnaire response using RFPService...');
      
      // Prepare the questionnaire response data
      const questionnaireResponse = {
        default_values: formData,
        supplier_info: {
          name: 'Anonymous User', // Default for anonymous submissions
          email: 'anonymous@example.com'
        },
        submitted_at: new Date().toISOString(),
        form_version: '1.0'
      };

      // Save the questionnaire response using the new RFPService method
      const updatedRfp = await RFPService.updateRfpBuyerQuestionnaireResponse(
        currentRfpId, 
        questionnaireResponse
      );

      if (updatedRfp) {
        console.log('✅ Questionnaire response saved successfully');
        console.log('Updated RFP:', updatedRfp);
        alert('Questionnaire submitted successfully!');
      } else {
        console.error('❌ Failed to save questionnaire response - RFPService returned null');
        alert('Failed to save questionnaire response. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('An error occurred while submitting the questionnaire.');
    }
    
    console.log('=== FORM SUBMISSION END ===');
  };

  return (
    <>
      {/* Main Artifact Panel - Responsive */}
      <div 
        className="artifact-window-container"
        data-testid="artifact-window"
        data-collapsed={collapsed}
        data-mobile={isMobile}
        data-artifact-type={artifact?.type || 'none'}
        style={{ 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: isMobile ? 'none' : '1px solid var(--ion-color-light-shade)',
        borderTop: isMobile ? '1px solid var(--ion-color-light-shade)' : 'none',
        width: collapsed ? (isMobile ? '100%' : '40px') : (isMobile ? '100%' : '400px'),
        minWidth: collapsed ? (isMobile ? '100%' : '40px') : (isMobile ? '100%' : '400px'),
        height: isMobile ? (collapsed ? '60px' : `${mobileHeight}vh`) : '100%',
        maxHeight: isMobile ? '50vh' : '100%', // Limit to 50vh max on mobile
        minHeight: isMobile ? '60px' : '100%',
        backgroundColor: '#ffffff', // Always opaque white background
        transition: isMobile ? 'height 0.3s ease-in-out' : 'width 0.3s ease-in-out',
        overflow: 'hidden',
        boxShadow: isMobile ? '0 -4px 12px rgba(0, 0, 0, 0.15)' : 'none',
        borderRadius: isMobile ? '12px 12px 0 0' : '0',
        zIndex: isMobile ? 10 : 'auto'
      }}>
        {/* Header with collapse, expand buttons, and integrated resize control */}
        <div 
          className="artifact-window-header"
          data-testid="artifact-header"
          data-collapsed={collapsed}
          style={{ 
          padding: '8px 16px',
          borderBottom: collapsed ? 'none' : '1px solid var(--ion-color-light-shade)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backgroundColor: isMobile ? '#ffffff' : 'var(--ion-background-color)',
          minHeight: '40px',
          // Add resize functionality to the entire header on mobile
          cursor: isMobile && !collapsed && artifact ? 'row-resize' : 'default',
          userSelect: 'none'
        }}
        // Add drag events to header on mobile for resize
        onMouseDown={isMobile && !collapsed && artifact ? handleDragStart : undefined}
        onTouchStart={isMobile && !collapsed && artifact ? handleDragStart : undefined}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <h3 style={{ margin: '0', fontSize: '1.1em' }}>
                {artifact ? artifact.type.toUpperCase() : 'Artifact'}
              </h3>
              {/* Mobile drag control indicator */}
              {isMobile && artifact && (
                <div 
                  className="mobile-drag-control"
                  data-testid="mobile-drag-control"
                  data-height-percentage={mobileHeight}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                    border: '1px solid rgba(var(--ion-color-primary-rgb), 0.3)',
                    cursor: 'row-resize',
                    userSelect: 'none',
                    minWidth: '32px',
                    height: '24px'
                  }}
                >
                  <IonIcon 
                    icon={reorderTwoOutline}
                    style={{
                      color: 'var(--ion-color-primary)',
                      fontSize: '16px'
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Full-screen button for mobile */}
            {isMobile && !collapsed && artifact && (
              <IonButton
                className="artifact-fullscreen-button"
                data-testid="artifact-fullscreen"
                data-action="expand-fullscreen"
                fill="clear"
                size="small"
                onClick={() => setIsFullScreen(true)}
                title="Expand to full screen"
                style={{ 
                  '--padding-start': '4px',
                  '--padding-end': '4px',
                  minWidth: '32px',
                  height: '32px'
                }}
              >
                <IonIcon icon={expandOutline} />
              </IonButton>
            )}
            {/* Collapse/Expand button */}
            <IonButton
              className="artifact-toggle-button"
              data-testid="artifact-toggle"
              data-action={collapsed ? 'expand' : 'collapse'}
              fill="clear"
              size="small"
              onClick={toggleCollapse}
              title={isMobile ? (collapsed ? "Show artifact" : "Hide artifact") : "Expand/collapse artifact panel"}
              style={{ 
                '--padding-start': '4px',
                '--padding-end': '4px',
                minWidth: '32px',
                height: '32px'
              }}
            >
              <IonIcon 
                icon={isMobile ? (collapsed ? chevronBackOutline : chevronForwardOutline) : (collapsed ? chevronBackOutline : chevronForwardOutline)} 
                style={{ 
                  transform: isMobile 
                    ? (collapsed ? 'rotate(90deg)' : 'rotate(-90deg)') 
                    : (collapsed ? 'rotate(180deg)' : 'rotate(0deg)'),
                  transition: 'transform 0.3s ease-in-out'
                }}
              />
            </IonButton>
          </div>
        </div>



        {/* Collapsed state content for mobile */}
        {collapsed && isMobile && (
          <div 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              backgroundColor: 'var(--ion-background-color)',
              borderTop: '1px solid var(--ion-color-light-shade)',
              cursor: 'pointer'
            }}
            onClick={toggleCollapse}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              flex: 1 
            }}>
              {artifact ? (
                <>
                  <IonIcon 
                    icon={getTypeIcon(artifact.type)} 
                    style={{ color: 'var(--ion-color-primary)' }} 
                  />
                  <span style={{ 
                    fontSize: '0.9em', 
                    color: 'var(--ion-color-dark)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {artifact.name}
                  </span>
                </>
              ) : (
                <>
                  <IonIcon 
                    icon={documentTextOutline} 
                    style={{ color: 'var(--ion-color-medium)' }} 
                  />
                  <span style={{ 
                    fontSize: '0.9em', 
                    color: 'var(--ion-color-medium)' 
                  }}>
                    No artifact available
                  </span>
                </>
              )}
            </div>
            <div style={{
              fontSize: '0.8em',
              color: 'var(--ion-color-medium)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Tap to expand
              <IonIcon icon={chevronUpOutline} style={{ fontSize: '16px' }} />
            </div>
          </div>
        )}

        {/* Content area */}
        {!collapsed && (
          <div 
            className="artifact-content-area"
            data-testid="artifact-content"
            style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: 'var(--ion-background-color)',
            minHeight: 0
          }}>
            {/* Artifact display area */}
            <div 
              className="artifact-display-area"
              data-testid="artifact-display"
              data-has-artifact={!!artifact}
              style={{ flex: 1, overflow: 'hidden' }}>
              {!artifact ? (
                // No artifact state
                <div 
                  className="artifact-empty-state"
                  data-testid="artifact-empty"
                  style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  flexDirection: 'column',
                  textAlign: 'center',
                  color: 'var(--ion-color-medium)',
                  padding: '16px'
                }}>
                  <IonIcon icon={documentTextOutline} size="large" />
                  <p>No artifact to display</p>
                  <p style={{ fontSize: '0.9em' }}>
                    Artifacts will appear here during your conversation
                  </p>
                </div>
              ) : (
                // Display the artifact
                <div 
                  className="artifact-container"
                  data-testid="artifact-container"
                  data-artifact-id={artifact.id}
                  data-artifact-name={artifact.name}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Artifact header - only show if there's meaningful content */}
                  {(artifact.name || onDownload) && (
                    <div 
                      className="artifact-header-section"
                      data-testid="artifact-header-section"
                      data-has-name={!!artifact.name}
                      data-has-download={!!onDownload}
                      style={{ 
                      padding: '8px 16px',
                      borderBottom: '1px solid var(--ion-color-light-shade)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minHeight: '40px'
                    }}>
                      <IonIcon 
                        icon={getTypeIcon(artifact.type)} 
                        style={{ fontSize: '20px', color: 'var(--ion-color-primary)' }} 
                      />
                      {artifact.name && (
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0', fontSize: '1em' }}>{artifact.name}</h4>
                        </div>
                      )}
                      {onDownload && (
                        <IonButton
                          className="artifact-download-button"
                          data-testid="artifact-download"
                          data-action="download"
                          data-artifact-id={artifact.id}
                          fill="clear"
                          size="small"
                          onClick={() => onDownload(artifact)}
                        >
                          <IonIcon icon={downloadOutline} />
                        </IonButton>
                      )}
                    </div>
                  )}
                  
                  {/* Artifact content */}
                  <div 
                    className="artifact-content-section"
                    data-testid="artifact-content-section"
                    data-artifact-type={artifact.type}
                    style={{ flex: 1, overflow: 'auto' }}>
                    {renderArtifactContent(artifact)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Modal for Mobile */}
      <IonModal 
        className="artifact-fullscreen-modal"
        data-testid="artifact-modal"
        data-artifact-type={artifact?.type || 'none'}
        isOpen={isFullScreen} 
        onDidDismiss={() => setIsFullScreen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{artifact ? artifact.name : 'Artifact'}</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsFullScreen(false)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {artifact && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Full-screen artifact content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {renderArtifactContent(artifact)}
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default ArtifactWindow;

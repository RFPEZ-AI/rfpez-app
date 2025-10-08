// Copyright Mark Skiba, 2025 All rights reserved

import React, { useRef, useEffect, useState } from 'react';
import { IonButton } from '@ionic/react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Artifact } from '../../types/home';

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

interface ArtifactFormRendererProps {
  artifact: Artifact;
  onSubmit: (formData: Record<string, unknown>) => void;
  onSave?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  isPortrait?: boolean;
}

const ArtifactFormRenderer: React.FC<ArtifactFormRendererProps> = ({ 
  artifact, 
  onSubmit, 
  onSave,
  isPortrait = false 
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInModal, setIsInModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<Record<string, unknown>>({});

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
    let formSpec: BuyerQuestionnaireData;

    // Handle database Artifact (has schema/ui_schema properties)
    const dbArtifact = artifact as Artifact & {schema?: object; ui_schema?: object; default_values?: object};
    if (dbArtifact.schema && typeof dbArtifact.schema === 'object') {
      formSpec = {
        schema: dbArtifact.schema,
        uiSchema: dbArtifact.ui_schema || {},
        formData: (dbArtifact.default_values || {}) as Record<string, unknown>
      };
    } else if (artifact.content) {
      // Handle legacy content-based format
      formSpec = JSON.parse(artifact.content);
    } else {
      // Fallback to empty form
      formSpec = { schema: {}, uiSchema: {}, formData: {} };
    }
    
    const handleSubmit = (data: FormSubmissionData) => {
      console.log('Form submitted:', data.formData);
      if (data.formData) {
        onSubmit(data.formData);
      }
    };

    const handleSave = async () => {
      if (!onSave) return;
      
      setIsSaving(true);
      try {
        // Get current form data from the form
        const formData = formRef.current?.state?.formData || currentFormData;
        console.log('Saving form data:', formData);
        await onSave(artifact, formData);
      } catch (error) {
        console.error('Error saving form:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleFormChange = (formData: Record<string, unknown>) => {
      setCurrentFormData(formData);
    };

    const handleError = (errors: Record<string, unknown>[]) => {
      console.error('Form validation failed:', errors);
      errors.forEach((error, index) => {
        console.error(`Validation error ${index + 1}:`, {
          property: error.property,
          message: error.message,
          schemaPath: error.schemaPath,
          data: error.data
        });
      });
      alert(`Form validation failed with ${errors.length} error(s). Please check the console for details.`);
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
        data-portrait={isPortrait}
        style={{ 
          padding: isPortrait ? '8px 8px 8px 8px' : '12px 12px 12px 12px',
          // Add extra top padding when in modal to account for modal header
          paddingTop: isInModal 
            ? (isPortrait ? '56px' : '64px') 
            : (isPortrait ? '8px' : '12px'),
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
            padding: ${isPortrait ? '10px 14px' : '8px 12px'} !important;
            border-radius: 4px !important;
            font-size: ${isPortrait ? '16px' : '14px'} !important;
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
            font-size: ${isPortrait ? '14px' : '13px'} !important;
          }
          
          .form-group .help-block {
            color: #666666 !important;
            font-size: ${isPortrait ? '12px' : '11px'} !important;
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
          marginBottom: isPortrait ? '8px' : '12px',
          paddingTop: isPortrait ? '8px' : '12px'
        }}>
          <Form
            schema={formSpec.schema}
            uiSchema={(formSpec.uiSchema || {}) as UiSchema<Record<string, unknown>>}
            formData={formSpec.formData || {}}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validator={validator as any}
            onSubmit={handleSubmit}
            onError={handleError}
            onChange={(e) => handleFormChange(e.formData || {})}
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
          padding: isPortrait ? '8px 0' : '12px 0',
          borderTop: '1px solid var(--ion-color-light)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          gap: isPortrait ? '8px' : '12px'
        }}>
          {/* Save Button (Draft Mode) */}
          {onSave && (
            <IonButton
              className="form-save-button"
              data-testid="form-save-button"
              data-form-action="save"
              expand="block"
              fill="outline"
              size={isPortrait ? 'default' : 'default'}
              disabled={isSaving}
              style={{
                '--min-height': isPortrait ? '44px' : '40px',
                fontSize: isPortrait ? '14px' : '13px',
                flex: isPortrait ? 'none' : '1'
              }}
              onClick={handleSave}
            >
              <span data-testid="form-save-text">
                {isSaving ? 'Saving...' : '💾 Save Draft'}
              </span>
            </IonButton>
          )}

          {/* Submit Button */}
          <IonButton
            className="form-submit-button"
            data-testid="form-submit"
            data-form-action="submit"
            expand="block"
            size={isPortrait ? 'default' : 'default'}
            style={{
              '--min-height': isPortrait ? '48px' : '44px',
              fontSize: isPortrait ? '16px' : '14px',
              flex: isPortrait ? 'none' : onSave ? '2' : '1'
            }}
            onClick={() => {
              console.log('Submit button clicked');
              // Trigger form submission using the ref - this will trigger validation first
              if (formRef.current) {
                console.log('Form ref available, attempting to submit...');
                try {
                  // First try to use the Form's built-in submit method
                  if (formRef.current.submit && typeof formRef.current.submit === 'function') {
                    console.log('Using Form ref submit method...');
                    formRef.current.submit();
                  } else {
                    // Fallback: find and click the hidden submit button to trigger validation
                    const formElement = formRef.current.formElement || 
                                       document.querySelector('form[class*="rjsf"]') ||
                                       document.querySelector('form');
                    if (formElement) {
                      console.log('Found form element, looking for submit button...');
                      const submitButton = formElement.querySelector('button[type="submit"]');
                      if (submitButton) {
                        console.log('Clicking hidden submit button to trigger validation...');
                        submitButton.click();
                      } else {
                        console.log('No submit button found, trying form.submit()...');
                        // This will bypass validation but better than nothing
                        formElement.submit();
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
            <span data-testid="form-submit-button">Submit Questionnaire</span>
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

export default ArtifactFormRenderer;
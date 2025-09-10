// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { downloadOutline, documentTextOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { SingletonArtifactWindowProps, Artifact } from '../types/home';

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
  isCollapsed = false,
  onToggleCollapse,
  currentRfpId
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(true);

  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return documentTextOutline;
      case 'form':
        return documentTextOutline;
      default:
        return documentTextOutline;
    }
  };

  // Check if artifact is a form
  const isBuyerQuestionnaire = (artifact: Artifact): boolean => {
    try {
      if (artifact.content && (artifact.name === 'Buyer Questionnaire' || artifact.type === 'form')) {
        const parsed = JSON.parse(artifact.content);
        return parsed.schema && typeof parsed.schema === 'object';
      }
    } catch (e) {
      // Not JSON, not a form
    }
    return false;
  };

  // Form renderer component
  interface FormRendererProps {
    artifact: Artifact;
    onSubmit: (formData: Record<string, unknown>) => void;
  }

  const FormRenderer: React.FC<FormRendererProps> = ({ artifact, onSubmit }) => {
    try {
      const formSpec: BuyerQuestionnaireData = JSON.parse(artifact.content || '{}');
      
      const handleSubmit = (data: FormSubmissionData) => {
        console.log('Form submitted:', data.formData);
        if (data.formData) {
          onSubmit(data.formData);
        }
      };

      // Use title and description from the form spec if available, fallback to artifact name
      const formTitle = formSpec.title || artifact.name;
      const formDescription = formSpec.description;

      return (
        <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
          {/* Custom styles for form inputs */}
          <style>{`
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
              padding: 8px 12px !important;
              border-radius: 4px !important;
              font-size: 14px !important;
              line-height: 1.4 !important;
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
            }
            
            .form-group .help-block {
              color: #666666 !important;
              font-size: 12px !important;
              margin-top: 4px !important;
            }
          `}</style>
          
          <h3 style={{ marginBottom: '8px', color: 'var(--ion-color-primary)' }}>
            {formTitle}
          </h3>
          {formDescription && (
            <p style={{ 
              marginBottom: '16px', 
              color: 'var(--ion-color-medium)', 
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {formDescription}
            </p>
          )}
          <Form
            schema={formSpec.schema}
            uiSchema={(formSpec.uiSchema || {}) as UiSchema<Record<string, unknown>>}
            formData={formSpec.formData || {}}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validator={validator as any}
            onSubmit={handleSubmit}
            showErrorList={false}
          >
            <div style={{ 
              marginTop: '20px', 
              padding: '12px 0',
              borderTop: '1px solid var(--ion-color-medium)'
            }}>
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--ion-color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Submit Questionnaire
              </button>
            </div>
          </Form>
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
    console.log('=== FORM SUBMISSION ===');
    console.log('Artifact:', artifact.name);
    console.log('Form data:', formData);
    
    if (onFormSubmit) {
      onFormSubmit(artifact, formData);
      return;
    }
    
    try {
      // Use currentRfpId from props
      if (!currentRfpId) {
        alert('No RFP context available. Please select an RFP first.');
        return;
      }

      // Save the form response to the database
      const response = await fetch('/api/rfps/' + currentRfpId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_questionnaire_response: formData
        })
      });

      if (response.ok) {
        console.log('✅ Form response saved successfully');
        alert('Questionnaire submitted successfully!');
      } else {
        console.error('❌ Failed to save form response');
        alert('Failed to save questionnaire response. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('An error occurred while submitting the questionnaire.');
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderLeft: '1px solid var(--ion-color-light-shade)',
      width: collapsed ? '40px' : '400px',
      minWidth: collapsed ? '40px' : '400px',
      transition: 'width 0.3s ease-in-out',
      overflow: 'hidden'
    }}>
      {/* Header with collapse button */}
      <div style={{ 
        padding: '16px',
        borderBottom: collapsed ? 'none' : '1px solid var(--ion-color-light-shade)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <h3 style={{ margin: '0', fontSize: '1.1em' }}>Artifact</h3>
          </div>
        )}
        <IonButton
          fill="clear"
          size="small"
          onClick={toggleCollapse}
          title="Expand/collapse artifact panel"
          style={{ 
            '--padding-start': '8px',
            '--padding-end': '8px'
          }}
        >
          <IonIcon 
            icon={collapsed ? chevronBackOutline : chevronForwardOutline} 
            style={{ 
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out'
            }}
          />
        </IonButton>
      </div>

      {/* Content area */}
      {!collapsed && (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--ion-background-color)'
        }}>
          {/* Artifact display area */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {!artifact ? (
              // No artifact state
              <div style={{ 
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
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Artifact header */}
                <div style={{ 
                  padding: '16px',
                  borderBottom: '1px solid var(--ion-color-light-shade)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <IonIcon 
                    icon={getTypeIcon(artifact.type)} 
                    style={{ fontSize: '20px', color: 'var(--ion-color-primary)' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0', fontSize: '1em' }}>{artifact.name}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      {artifact.type.toUpperCase()} • {artifact.size}
                    </p>
                  </div>
                  {onDownload && (
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => onDownload(artifact)}
                    >
                      <IonIcon icon={downloadOutline} />
                    </IonButton>
                  )}
                </div>
                
                {/* Artifact content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {renderArtifactContent(artifact)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactWindow;

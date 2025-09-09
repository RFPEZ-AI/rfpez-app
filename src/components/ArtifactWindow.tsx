// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon } from '@ionic/react';
import { downloadOutline, documentTextOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema, UiSchema } from '@rjsf/utils';

interface Artifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'form' | 'other';
  size: string;
  url?: string;
  content?: string;
}

interface ArtifactWindowProps {
  artifacts: Artifact[];
  onDownload?: (artifact: Artifact) => void;
  onView?: (artifact: Artifact) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentRfpId?: number | null; // Add this prop to pass current RFP context
}

interface BuyerQuestionnaireData {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: Record<string, unknown>;
}

interface FormSubmissionData {
  formData?: Record<string, unknown>;
}

const ArtifactWindow: React.FC<ArtifactWindowProps> = ({ 
  artifacts, 
  onDownload, 
  onView,
  isCollapsed = false,
  onToggleCollapse,
  currentRfpId
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(true); // Start collapsed initially

  // Allow manual toggle without auto-collapsing when empty

  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return documentTextOutline;
      case 'form':
        return documentTextOutline; // You could use a different icon like clipboardOutline if preferred
      default:
        return documentTextOutline;
    }
  };

  // Add this helper function to check if artifact is a form
  const isBuyerQuestionnaire = (artifact: Artifact): boolean => {
    try {
      if (artifact.content && artifact.name === 'Buyer Questionnaire') {
        const parsed = JSON.parse(artifact.content);
        return parsed.schema && typeof parsed.schema === 'object';
      }
    } catch (e) {
      // Not JSON, not a form
    }
    return false;
  };

  // Add this component for form rendering
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

      return (
        <div style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--ion-color-primary)' }}>
            {artifact.name}
          </h3>
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

  // Render form if it's a buyer questionnaire
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
      <div style={{ padding: '16px' }}>
        <h3>{artifact.name}</h3>
        <p>Type: {artifact.type}</p>
        <p>Size: {artifact.size}</p>
        {artifact.content && (
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {artifact.content}
          </pre>
        )}
      </div>
    );
  };

  // Add the form submission handler
  const handleFormSubmit = async (artifact: Artifact, formData: Record<string, unknown>) => {
    console.log('=== FORM SUBMISSION ===');
    console.log('Artifact:', artifact.name);
    console.log('Form data:', formData);
    
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
        
        // Show success feedback
        alert('Questionnaire submitted successfully!');
        
        // Optionally trigger next phase (generate bid form)
        // You could emit an event or call a callback here
        
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
      width: collapsed ? '40px' : '300px',
      minWidth: collapsed ? '40px' : '300px',
      transition: 'width 0.3s ease-in-out',
      overflow: 'hidden'
    }}>
      {/* Collapse/Expand Button */}
      <div style={{ 
        padding: '16px',
        borderBottom: collapsed ? 'none' : '1px solid var(--ion-color-light-shade)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
        {!collapsed && <h3 style={{ margin: '0' }}>Documents</h3>}
        <IonButton
          fill="clear"
          size="small"
          onClick={toggleCollapse}
          title="Expand/collapse documents"
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

      {/* Content - only show when not collapsed */}
      {!collapsed && (
        <>
          {artifacts.length === 0 ? (
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
              <p>No documents yet</p>
              <p style={{ fontSize: '0.9em' }}>
                Documents and files will appear here during your conversation
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px 16px' }}>
              {artifacts.map((artifact) => (
                <IonCard key={artifact.id} style={{ margin: '0 0 16px 0' }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ fontSize: '1rem' }}>
                      <IonIcon icon={getTypeIcon(artifact.type)} style={{ marginRight: '8px' }} />
                      {artifact.name}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)' }}>
                      {artifact.type.toUpperCase()} • {artifact.size}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {onView && (
                        <IonButton 
                          size="small" 
                          fill="outline"
                          onClick={() => onView(artifact)}
                        >
                          View
                        </IonButton>
                      )}
                      {onDownload && (
                        <IonButton 
                          size="small" 
                          fill="clear"
                          onClick={() => onDownload(artifact)}
                        >
                          <IonIcon icon={downloadOutline} />
                        </IonButton>
                      )}
                    </div>
                    {/* Render artifact content (e.g., form) */}
                    <div style={{ marginTop: '16px' }}>
                      {renderArtifactContent(artifact)}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArtifactWindow;

// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonTextarea,
  IonItem,
  IonLabel,
  IonSpinner,
  IonAlert,
  IonText,
  IonIcon,
  IonButtons
} from '@ionic/react';
import { 
  documentTextOutline, 
  refreshOutline, 
  downloadOutline,
  clipboardOutline
} from 'ionicons/icons';
import { RFPService, type BuyerQuestionnaireResponse } from '../../services/rfpService';
import type { RFP } from '../../types/rfp';

interface ProposalManagerProps {
  rfp: RFP;
  onProposalUpdate?: (proposal: string) => void;
  readonly?: boolean;
}

export const ProposalManager: React.FC<ProposalManagerProps> = ({
  rfp,
  onProposalUpdate,
  readonly = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [localProposal, setLocalProposal] = useState(rfp.request || '');
  const [questionnaireResponse, setQuestionnaireResponse] = useState<BuyerQuestionnaireResponse | null>(null);

  // Load questionnaire response when component mounts or RFP changes
  useEffect(() => {
    const loadQuestionnaireResponse = async () => {
      try {
        const response = await RFPService.getRfpBuyerQuestionnaireResponse(rfp.id);
        setQuestionnaireResponse(response);
      } catch (error) {
        console.warn('Failed to load questionnaire response:', error);
        // Fallback to legacy approach
        const legacyResponse = rfp.buyer_questionnaire_response as BuyerQuestionnaireResponse | null;
        setQuestionnaireResponse(legacyResponse);
      }
    };

    loadQuestionnaireResponse();
  }, [rfp.id, rfp.buyer_questionnaire_response]);

  const handleGenerateProposal = async () => {
    if (!questionnaireResponse) {
      setAlertMessage('No questionnaire response data available to generate request.');
      setShowAlert(true);
      return;
    }

    setIsGenerating(true);

    try {
      const proposal = await RFPService.generateRequest(
        rfp,
        questionnaireResponse?.default_values || {},
        questionnaireResponse?.supplier_info || { name: 'Unknown', email: 'unknown@example.com' }
      );

      setLocalProposal(proposal);
      
      // Update the RFP record with the new request
      await RFPService.updateRfpRequest(rfp.id, proposal);
      
      onProposalUpdate?.(proposal);
      setAlertMessage('Proposal generated successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error generating proposal:', error);
      setAlertMessage('Error generating proposal. Please try again.');
      setShowAlert(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProposal = async () => {
    try {
      await RFPService.updateRfpRequest(rfp.id, localProposal);
      onProposalUpdate?.(localProposal);
      setAlertMessage('Request saved successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error saving request:', error);
      setAlertMessage('Error saving request. Please try again.');
      setShowAlert(true);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(localProposal);
      setAlertMessage('Proposal copied to clipboard!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setAlertMessage('Error copying to clipboard.');
      setShowAlert(true);
    }
  };

  const handleDownloadProposal = () => {
    const blob = new Blob([localProposal], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rfp.name}-proposal.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Proposal Generator */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={documentTextOutline} style={{ marginRight: '8px' }} />
            Proposal Generator
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>
              Generate a comprehensive proposal based on the submitted bid data and RFP requirements.
              {questionnaireResponse 
                ? ' Proposal will be generated from the collected questionnaire responses.'
                : ' No questionnaire responses available yet.'
              }
            </p>
          </IonText>

          <div style={{ marginTop: '16px' }}>
            <IonButton
              expand="block"
              onClick={handleGenerateProposal}
              disabled={isGenerating || !questionnaireResponse}
              fill="outline"
            >
              {isGenerating && <IonSpinner name="crescent" slot="start" />}
              <IonIcon icon={refreshOutline} slot="start" />
              {isGenerating ? 'Generating...' : 'Generate Proposal'}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Proposal Editor/Viewer */}
      {localProposal && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Generated Proposal
              {!readonly && (
                <IonButtons slot="end">
                  <IonButton fill="clear" onClick={handleCopyToClipboard}>
                    <IonIcon icon={clipboardOutline} slot="icon-only" />
                  </IonButton>
                  <IonButton fill="clear" onClick={handleDownloadProposal}>
                    <IonIcon icon={downloadOutline} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              )}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {readonly ? (
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                {localProposal}
              </div>
            ) : (
              <>
                <IonItem>
                  <IonLabel position="stacked">Proposal Content (Markdown)</IonLabel>
                  <IonTextarea
                    value={localProposal}
                    onIonInput={(e) => setLocalProposal(e.detail.value || '')}
                    rows={20}
                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    placeholder="Generated proposal will appear here..."
                  />
                </IonItem>

                <div style={{ marginTop: '16px' }}>
                  <IonButton
                    expand="block"
                    onClick={handleSaveProposal}
                    disabled={!localProposal.trim()}
                  >
                    Save Proposal
                  </IonButton>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {/* Questionnaire Response Data */}
      {questionnaireResponse && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Questionnaire Response Data</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>Data collected from bid submissions that was used to generate the proposal:</p>
            </IonText>
            
            <div style={{ 
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginTop: '12px'
            }}>
              <pre style={{ 
                fontSize: '0.8rem',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(questionnaireResponse, null, 2)}
              </pre>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Proposal Manager"
        message={alertMessage}
        buttons={['OK']}
      />
    </div>
  );
};

export default ProposalManager;

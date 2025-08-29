import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonItem,
  IonLabel
} from '@ionic/react';
import { close, document, calendar, information } from 'ionicons/icons';
import { RfpFormArtifact } from './forms/RfpForm';
import type { RFP, FormSpec } from '../types/rfp';

interface RFPPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfp: RFP | null;
}

export const RFPPreviewModal: React.FC<RFPPreviewModalProps> = ({
  isOpen,
  onClose,
  rfp
}) => {
  if (!rfp) return null;

  const hasFormSpec = rfp.form_spec && rfp.form_spec.schema;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Preview RFP: {rfp.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* RFP Details */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={information} style={{ marginRight: '8px' }} />
              RFP Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>
                <h3>Name</h3>
                <p>{rfp.name}</p>
              </IonLabel>
            </IonItem>
            
            {rfp.description && (
              <IonItem lines="none">
                <IonLabel>
                  <h3>Description</h3>
                  <p>{rfp.description}</p>
                </IonLabel>
              </IonItem>
            )}

            {rfp.specification && (
              <IonItem lines="none">
                <IonLabel>
                  <h3>Specification</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{rfp.specification}</p>
                </IonLabel>
              </IonItem>
            )}
            
            <IonItem lines="none">
              <IonLabel>
                <h3>Due Date</h3>
                <p>
                  <IonIcon icon={calendar} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {new Date(rfp.due_date).toLocaleDateString()}
                </p>
              </IonLabel>
            </IonItem>
            
            <IonItem lines="none">
              <IonLabel>
                <h3>Status</h3>
                <p>
                  {rfp.is_template ? 'Template' : 'Active RFP'} • 
                  {rfp.is_public ? ' Public' : ' Private'}
                </p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Form Preview */}
        {hasFormSpec ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={document} style={{ marginRight: '8px' }} />
                Bid Response Form Preview
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>This is how the form will appear to bidders when they submit their response:</p>
              </IonText>
              
              <div style={{ marginTop: '16px' }}>
                <RfpFormArtifact
                  formSpec={rfp.form_spec as FormSpec}
                  formData={(rfp.form_spec as FormSpec).defaults || {}}
                  showTitle={false}
                  readonly={true}
                />
              </div>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={document} style={{ marginRight: '8px' }} />
                Form Status
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="warning">
                <p>
                  <strong>No form specification found.</strong>
                </p>
                <p>
                  This RFP doesn&#39;t have a structured form yet. 
                  Edit the RFP to add a form specification using the AI Form Builder.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Note: Document field has been removed */}
      </IonContent>
    </IonModal>
  );
};

export default RFPPreviewModal;

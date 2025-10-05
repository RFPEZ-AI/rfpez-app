// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { Artifact } from '../../types/home';
import ArtifactFormRenderer from './ArtifactFormRenderer';
import ArtifactTextRenderer from './ArtifactTextRenderer';
import ArtifactBidRenderer from './ArtifactBidRenderer';
import ArtifactDefaultRenderer from './ArtifactDefaultRenderer';
import { useArtifactTypeDetection } from '../../hooks/useArtifactTypeDetection';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact | null;
  currentRfpId?: number | null;
  onFormSubmit?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  onDownload?: (artifact: Artifact) => void;
}

const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isOpen,
  onClose,
  artifact,
  currentRfpId,
  onFormSubmit,
  onDownload
}) => {
  const typeDetection = useArtifactTypeDetection(artifact);

  const renderArtifactContent = () => {
    if (!artifact) return null;

    if (typeDetection.isBuyerQuestionnaire && onFormSubmit) {
      return (
        <ArtifactFormRenderer
          artifact={artifact}
          onSubmit={(formData) => onFormSubmit(artifact, formData)}
          isPortrait={false} // Modal is never in portrait mode
        />
      );
    }
    
    if (typeDetection.isBidView) {
      return (
        <ArtifactBidRenderer
          currentRfpId={currentRfpId ?? null}
          rfpName={artifact.content || artifact.name}
        />
      );
    }
    
    if (typeDetection.isTextArtifact) {
      return (
        <ArtifactTextRenderer
          artifact={artifact}
          isPortrait={false} // Modal is never in portrait mode
        />
      );
    }

    return (
      <ArtifactDefaultRenderer
        artifact={artifact}
        onDownload={onDownload}
      />
    );
  };

  return (
    <IonModal 
      className="artifact-fullscreen-modal"
      data-testid="artifact-modal"
      data-artifact-type={artifact?.type || 'none'}
      isOpen={isOpen} 
      onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{artifact ? artifact.name : 'Artifact'}</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={onClose}
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
              {renderArtifactContent()}
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default ArtifactModal;
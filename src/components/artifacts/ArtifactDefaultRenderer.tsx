// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';
import { Artifact } from '../../types/home';

interface ArtifactDefaultRendererProps {
  artifact: Artifact;
  onDownload?: (artifact: Artifact) => void;
}

const ArtifactDefaultRenderer: React.FC<ArtifactDefaultRendererProps> = ({ 
  artifact, 
  onDownload 
}) => {
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

export default ArtifactDefaultRenderer;
// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useRef, useEffect } from 'react';
import { IonIcon, IonButton, IonItem, IonList, IonPopover } from '@ionic/react';
import { 
  chevronDownOutline, 
  chevronUpOutline,
  documentTextOutline,
  clipboardOutline,
  listOutline,
  codeSlashOutline,
  imageOutline
} from 'ionicons/icons';

interface Artifact {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_at: string;
}

interface ArtifactDropdownProps {
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;
  onSelectArtifact: (artifact: Artifact) => void;
  loading?: boolean;
}

const ArtifactDropdown: React.FC<ArtifactDropdownProps> = ({
  artifacts,
  selectedArtifact,
  onSelectArtifact,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return documentTextOutline;
      case 'form':
        return clipboardOutline;
      case 'list':
        return listOutline;
      case 'code':
        return codeSlashOutline;
      case 'image':
        return imageOutline;
      default:
        return documentTextOutline;
    }
  };

  const handleArtifactSelect = (artifact: Artifact) => {
    onSelectArtifact(artifact);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedArtifact && artifacts.length === 0) {
    return (
      <span style={{ 
        fontSize: '14px', 
        fontWeight: '500',
        color: '#666',
        fontStyle: 'italic'
      }}>
        No artifacts available
      </span>
    );
  }

  // Auto-select first artifact if none selected
  useEffect(() => {
    if (!selectedArtifact && artifacts.length > 0) {
      onSelectArtifact(artifacts[0]);
    }
  }, [selectedArtifact, artifacts, onSelectArtifact]);

  return (
    <>
      <IonButton
        fill="clear"
        size="small"
        onClick={() => setIsOpen(true)}
        disabled={loading || artifacts.length === 0}
        style={{
          '--padding-start': '0px',
          '--padding-end': '4px',
          '--color': '#333',
          width: '100%',
          minWidth: 'auto',
          height: 'auto',
          justifyContent: 'flex-start'
        }}
        data-testid="artifact-dropdown-trigger"
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          width: '100%',
          minWidth: '200px'
        }}>
          <IonIcon 
            icon={getTypeIcon(selectedArtifact?.type || 'document')} 
            style={{ fontSize: '16px', color: '#666' }} 
          />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            flex: 1
          }}>
            {loading ? 'Loading...' : (selectedArtifact?.name || 'Select artifact')}
          </span>
          <IonIcon 
            icon={isOpen ? chevronUpOutline : chevronDownOutline} 
            style={{ fontSize: '14px', color: '#666' }} 
          />
        </div>
      </IonButton>

      <IonPopover
        ref={popoverRef}
        isOpen={isOpen}
        onDidDismiss={() => setIsOpen(false)}
        showBackdrop={true}
        side="bottom"
        alignment="start"
        data-testid="artifact-dropdown-popover"
      >
        <IonList style={{ minWidth: '400px', maxWidth: '600px', width: 'max-content' }}>
          {artifacts.filter(a => a.id).map((artifact) => (
            <IonItem
              key={artifact.id}
              button
              onClick={() => handleArtifactSelect(artifact)}
              style={{
                '--background': selectedArtifact?.id === artifact.id ? '#f0f0f0' : 'transparent',
                cursor: 'pointer'
              }}
              data-testid={`artifact-option-${artifact.id}`}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                width: '100%',
                minWidth: '350px'
              }}>
                <IonIcon 
                  icon={getTypeIcon(artifact.type)} 
                  style={{ 
                    fontSize: '18px', 
                    color: '#666',
                    flexShrink: 0
                  }} 
                />
                <div style={{ 
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    marginBottom: '2px',
                    wordBreak: 'break-word',
                    lineHeight: '1.3'
                  }}>
                    {artifact.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      marginRight: '8px'
                    }}>
                      {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1)}
                    </span>
                    <span style={{ 
                      fontSize: '11px',
                      color: '#999',
                      flexShrink: 0
                    }}>
                      {formatDate(artifact.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonPopover>
    </>
  );
};

export default ArtifactDropdown;
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon } from '@ionic/react';
import { downloadOutline, documentTextOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

interface Artifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'other';
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
}

const ArtifactWindow: React.FC<ArtifactWindowProps> = ({ 
  artifacts, 
  onDownload, 
  onView,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(artifacts.length === 0);

  // Auto-collapse when no artifacts, auto-expand when artifacts are added
  useEffect(() => {
    if (artifacts.length === 0) {
      setInternalCollapsed(true);
    } else if (artifacts.length > 0 && internalCollapsed) {
      setInternalCollapsed(false);
    }
  }, [artifacts.length, internalCollapsed]);

  const collapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return documentTextOutline;
      default:
        return documentTextOutline;
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
        {!collapsed && <h3 style={{ margin: '0' }}>Artifacts</h3>}
        <IonButton
          fill="clear"
          size="small"
          onClick={toggleCollapse}
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
              <p>No artifacts yet</p>
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

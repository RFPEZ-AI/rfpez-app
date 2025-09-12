// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { documentTextOutline, imageOutline, clipboardOutline } from 'ionicons/icons';
import { ArtifactReference } from '../types/home';

interface ArtifactReferenceTagProps {
  artifactRef: ArtifactReference;
  onClick?: (artifactRef: ArtifactReference) => void;
  size?: 'small' | 'medium';
  showTypeIcon?: boolean;
}

const ArtifactReferenceTag: React.FC<ArtifactReferenceTagProps> = ({
  artifactRef,
  onClick,
  size = 'small',
  showTypeIcon = true
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
      case 'pdf':
        return documentTextOutline;
      case 'image':
        return imageOutline;
      case 'form':
        return clipboardOutline;
      default:
        return documentTextOutline;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'form':
        return 'var(--ion-color-success)';
      case 'document':
      case 'pdf':
        return 'var(--ion-color-primary)';
      case 'image':
        return 'var(--ion-color-secondary)';
      default:
        return 'var(--ion-color-medium)';
    }
  };

  const isSmall = size === 'small';
  const displayText = artifactRef.displayText || artifactRef.artifactName;

  return (
    <IonButton
      fill="outline"
      size={isSmall ? 'small' : 'default'}
      onClick={() => onClick?.(artifactRef)}
      style={{
        '--border-radius': '16px',
        '--border-color': getTypeColor(artifactRef.artifactType),
        '--color': getTypeColor(artifactRef.artifactType),
        '--background': 'transparent',
        '--background-hover': `${getTypeColor(artifactRef.artifactType)}15`,
        '--background-activated': `${getTypeColor(artifactRef.artifactType)}25`,
        '--padding-start': isSmall ? '8px' : '12px',
        '--padding-end': isSmall ? '8px' : '12px',
        '--padding-top': isSmall ? '4px' : '6px',
        '--padding-bottom': isSmall ? '4px' : '6px',
        margin: '2px 4px 2px 0',
        fontSize: isSmall ? '0.8em' : '0.9em',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: showTypeIcon ? '6px' : '0',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
    >
      {showTypeIcon && (
        <IonIcon
          icon={getTypeIcon(artifactRef.artifactType)}
          style={{
            fontSize: isSmall ? '14px' : '16px',
            color: getTypeColor(artifactRef.artifactType)
          }}
        />
      )}
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {displayText}
      </span>
      {artifactRef.isCreated && (
        <span style={{
          fontSize: '0.7em',
          opacity: 0.7,
          marginLeft: '4px'
        }}>
          ✨
        </span>
      )}
    </IonButton>
  );
};

export default ArtifactReferenceTag;
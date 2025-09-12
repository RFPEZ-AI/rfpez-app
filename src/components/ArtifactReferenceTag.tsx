// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonIcon } from '@ionic/react';
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
    <div
      onClick={() => onClick?.(artifactRef)}
      style={{
        display: 'inline-block',
        borderRadius: '8px',
        border: `1.5px solid ${getTypeColor(artifactRef.artifactType)}`,
        background: 'var(--ion-color-light)',
        padding: '8px 12px',
        margin: '4px 8px 4px 0',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: isSmall ? '120px' : '160px',
        maxWidth: isSmall ? '200px' : '280px',
        aspectRatio: '3/2', // Landscape aspect ratio
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        e.currentTarget.style.background = `${getTypeColor(artifactRef.artifactType)}05`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        e.currentTarget.style.background = 'var(--ion-color-light)';
      }}
    >
      {/* Document icon in background */}
      {showTypeIcon && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '8px',
          transform: 'translateY(-50%)',
          opacity: 0.1,
          fontSize: isSmall ? '24px' : '32px',
          color: getTypeColor(artifactRef.artifactType)
        }}>
          <IonIcon icon={getTypeIcon(artifactRef.artifactType)} />
        </div>
      )}
      
      {/* Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Title */}
        <div style={{
          fontSize: isSmall ? '0.85em' : '0.95em',
          fontWeight: '600',
          color: getTypeColor(artifactRef.artifactType),
          lineHeight: '1.2',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis'
        }}>
          {displayText}
        </div>
        
        {/* Bottom row with type and created indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px'
        }}>
          <div style={{
            fontSize: '0.7em',
            color: 'var(--ion-color-medium)',
            textTransform: 'uppercase',
            fontWeight: '500',
            letterSpacing: '0.5px'
          }}>
            {artifactRef.artifactType}
          </div>
          
          {artifactRef.isCreated && (
            <div style={{
              fontSize: '0.7em',
              color: 'var(--ion-color-success)',
              fontWeight: '500'
            }}>
              ✨ New
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtifactReferenceTag;
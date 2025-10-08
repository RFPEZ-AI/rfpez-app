// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { 
  chevronBackOutline, 
  chevronForwardOutline, 
  expandOutline, 
  chevronUpOutline 
} from 'ionicons/icons';
import { SingletonArtifactWindowProps } from '../types/home';
import { useArtifactTypeDetection } from '../hooks/useArtifactTypeDetection';
import ArtifactFormRenderer from './artifacts/ArtifactFormRenderer';
import ArtifactTextRenderer from './artifacts/ArtifactTextRenderer';
import ArtifactBidRenderer from './artifacts/ArtifactBidRenderer';
import ArtifactDefaultRenderer from './artifacts/ArtifactDefaultRenderer';
import ArtifactModal from './artifacts/ArtifactModal';
import ArtifactDropdown from './ArtifactDropdown';

const ArtifactContainer: React.FC<SingletonArtifactWindowProps> = ({ 
  artifact,
  artifacts = [],
  onDownload, 
  onFormSubmit,
  onFormSave,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse,
  currentRfpId,
  onArtifactSelect
}) => {
  // State management
  const [isPortrait, setIsPortrait] = useState<boolean>(window.innerHeight > window.innerWidth);
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [portraitHeight, setPortraitHeight] = useState<number>(40);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Use external collapsed state if provided, otherwise use internal state
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  // Type detection
  const typeDetection = useArtifactTypeDetection(artifact);

  // Listen for window resize to update aspect ratio detection
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag to resize in portrait mode
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !isPortrait) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const windowHeight = window.innerHeight;
    const newHeight = Math.max(10, Math.min(50, ((windowHeight - clientY) / windowHeight) * 100));
    setPortraitHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  // Reset portrait height when collapsed changes
  React.useEffect(() => {
    if (collapsed) {
      setPortraitHeight(60);
    }
  }, [collapsed]);

  const renderArtifactContent = () => {
    if (!artifact) return null;

    if (typeDetection.isBuyerQuestionnaire && onFormSubmit) {
      return (
        <ArtifactFormRenderer
          artifact={artifact}
          onSubmit={(formData) => onFormSubmit(artifact, formData)}
          onSave={onFormSave}
          isPortrait={isPortrait}
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
          isPortrait={isPortrait}
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

  if (!artifact) {
    return (
      <div 
        className="artifact-window no-artifact"
        data-testid="artifact-panel"
        style={{
          position: isPortrait ? 'fixed' : 'relative',
          bottom: isPortrait ? 0 : 'auto',
          right: isPortrait ? 0 : 'auto',
          left: isPortrait ? 0 : 'auto',
          height: isPortrait ? 'auto' : '100%',
          width: isPortrait ? '100%' : '400px',
          backgroundColor: '#f8f9fa',
          borderTop: isPortrait ? '1px solid #ddd' : 'none',
          borderLeft: !isPortrait ? '1px solid #ddd' : 'none',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#666',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          No artifact selected
        </div>
      </div>
    );
  }

  const windowStyle: React.CSSProperties = {
    position: isPortrait ? 'fixed' : 'relative',
    bottom: isPortrait ? 0 : 'auto',
    right: isPortrait ? 0 : 'auto',
    left: isPortrait ? 0 : 'auto',
    height: isPortrait 
      ? (collapsed ? '60px' : `${portraitHeight}vh`) 
      : '100%',
    width: isPortrait ? '100%' : (collapsed ? '40px' : '400px'),
    backgroundColor: '#f8f9fa',
    borderTop: isPortrait ? '1px solid #ddd' : 'none',
    borderLeft: !isPortrait ? '1px solid #ddd' : 'none',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: isPortrait 
      ? 'height 0.3s ease-in-out' 
      : 'width 0.3s ease-in-out'
  };

  return (
    <>
      <div 
        className="artifact-window"
        data-testid="artifact-window"
        data-artifact-type={artifact.type}
        data-collapsed={collapsed}
        data-portrait={isPortrait}
        style={windowStyle}
      >
        {/* Header */}
        <div 
          className="artifact-header"
          style={{
            padding: '8px',
            borderBottom: !collapsed ? '1px solid #ddd' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            minHeight: '44px',
            cursor: isPortrait && !collapsed ? 'ns-resize' : 'default'
          }}
          onMouseDown={isPortrait && !collapsed ? handleDragStart : undefined}
          onTouchStart={isPortrait && !collapsed ? handleDragStart : undefined}
        >
          <IonButton
            fill="clear"
            size="small"
            onClick={toggleCollapse}
            data-testid="artifact-toggle"
            style={{ 
              marginRight: collapsed ? '0' : '8px',
              flexShrink: 0,
              transform: collapsed 
                ? (isPortrait ? 'rotate(180deg)' : 'rotate(-90deg)') 
                : (isPortrait ? 'rotate(0deg)' : 'rotate(90deg)')
            }}
          >
            <IonIcon 
              icon={isPortrait ? chevronUpOutline : (collapsed ? chevronBackOutline : chevronForwardOutline)} 
              style={{ fontSize: '16px' }} 
            />
          </IonButton>
          
          {!collapsed && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setIsFullScreen(true)}
                  data-testid="fullscreen-button"
                  style={{ flexShrink: 0, backgroundColor: '#e0f7fa', border: '1px solid #00bcd4' }}
                >
                  <IonIcon icon={expandOutline} style={{ fontSize: '16px', color: '#00796b' }} />
                </IonButton>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <ArtifactDropdown
                  artifacts={artifacts.map(a => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    description: a.size || '', // Use size as description fallback
                    created_at: new Date().toISOString() // Fallback for missing created_at
                  }))}
                  selectedArtifact={artifact ? {
                    id: artifact.id,
                    name: artifact.name,
                    type: artifact.type,
                    description: artifact.size || '',
                    created_at: new Date().toISOString()
                  } : null}
                  onSelectArtifact={(dropdownArtifact) => {
                    const fullArtifact = artifacts.find(a => a.id === dropdownArtifact.id);
                    if (fullArtifact && onArtifactSelect) {
                      onArtifactSelect(fullArtifact);
                    }
                  }}
                  loading={false}
                />
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {!collapsed && (
          <div 
            className="artifact-content"
            style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#fff'
            }}
          >
            {renderArtifactContent()}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <ArtifactModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        artifact={artifact}
        currentRfpId={currentRfpId}
        onFormSubmit={onFormSubmit}
        onFormSave={onFormSave}
        onDownload={onDownload}
      />
    </>
  );
};

export default ArtifactContainer;
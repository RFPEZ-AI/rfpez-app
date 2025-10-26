// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { swapVerticalOutline, swapHorizontalOutline } from 'ionicons/icons';
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
  currentRfpId,
  onArtifactSelect
}) => {
  // State management - Use aspect ratio with threshold for reliable orientation detection
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const mediaQuery = window.matchMedia('(orientation: portrait)').matches;
    
    // Use aspect ratio as primary, media query as secondary
    // Aspect ratio < 1 is definitely portrait
    // If aspect ratio is close to 1 (0.9-1.1), use media query
    if (aspectRatio < 0.9) return true;   // Clearly portrait
    if (aspectRatio > 1.1) return false;  // Clearly landscape
    return mediaQuery;  // Use media query for edge cases
  });
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [portraitHeight, setPortraitHeight] = useState<number>(40);
  const [landscapeWidth, setLandscapeWidth] = useState<number>(400);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Type detection
  const typeDetection = useArtifactTypeDetection(artifact);

  // Listen for window resize to update aspect ratio detection
  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      const mediaQuery = window.matchMedia('(orientation: portrait)').matches;
      
      // Use aspect ratio thresholds to avoid false positives from zoom/DevTools
      if (aspectRatio < 0.9) {
        setIsPortrait(true);   // Clearly portrait
      } else if (aspectRatio > 1.1) {
        setIsPortrait(false);  // Clearly landscape
      } else {
        setIsPortrait(mediaQuery);  // Use media query for edge cases
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle drag to resize in portrait mode
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    if (isPortrait) {
      // Portrait mode: resize height
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const windowHeight = window.innerHeight;
      const newHeight = Math.max(10, Math.min(95, ((windowHeight - clientY) / windowHeight) * 100));
      setPortraitHeight(newHeight);
    } else {
      // Landscape mode: resize width
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const windowWidth = window.innerWidth;
      
      // Calculate new width in pixels (drag right increases width)
      const newWidth = Math.max(300, Math.min(windowWidth - 100, windowWidth - clientX));
      setLandscapeWidth(newWidth);
    }
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

  const renderArtifactContent = () => {
    if (!artifact) return null;

    if (typeDetection.isBuyerQuestionnaire && onFormSubmit) {
      return (
        <ArtifactFormRenderer
          key={artifact.id} // Force re-mount when artifact changes
          artifact={artifact}
          onSubmit={(formData) => onFormSubmit(artifact, formData)}
          onSave={onFormSave}
          isPortrait={isPortrait}
        />
      );
    }
    
    if (typeDetection.isBidView) {
      // Use currentRfpId from Home component, fallback to artifact's rfpId
      const effectiveRfpId = currentRfpId ?? artifact.rfpId ?? null;
      
      console.log('🔍 BidView rendering with:', { 
        currentRfpId, 
        artifactRfpId: artifact.rfpId, 
        effectiveRfpId,
        artifactId: artifact.id 
      });
      
      return (
        <ArtifactBidRenderer
          key={`${artifact.id}-${effectiveRfpId}`} // Force re-mount when artifact OR RFP changes
          currentRfpId={effectiveRfpId}
          rfpName={artifact.content || artifact.name}
        />
      );
    }
    
    if (typeDetection.isTextArtifact) {
      return (
        <ArtifactTextRenderer
          key={artifact.id} // Force re-mount when artifact changes
          artifact={artifact}
          isPortrait={isPortrait}
        />
      );
    }

    return (
      <ArtifactDefaultRenderer
        key={artifact.id} // Force re-mount when artifact changes
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
    height: isPortrait ? `${portraitHeight}vh` : '100%',
    width: isPortrait ? '100%' : `${landscapeWidth}px`,
    backgroundColor: '#f8f9fa',
    borderTop: isPortrait ? '1px solid #ddd' : 'none',
    borderLeft: !isPortrait ? '1px solid #ddd' : 'none',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  return (
    <>
      <div 
        className="artifact-window"
        data-testid="artifact-window"
        data-artifact-type={artifact.type}
        data-portrait={isPortrait}
        style={windowStyle}
      >
        {/* Header - Draggable for resizing */}
        <div 
          className="artifact-header"
          style={{
            padding: '8px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDragging ? '#e0f7fa' : '#fff',
            minHeight: '44px',
            cursor: isPortrait ? 'ns-resize' : 'ew-resize',
            userSelect: 'none',
            transition: isDragging ? 'none' : 'background-color 0.2s'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={() => setIsFullScreen(true)}
          title={isPortrait ? "Drag to resize height, double-click for fullscreen" : "Drag to resize width, double-click for fullscreen"}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Drag resize icon */}
            <IonIcon 
              icon={isPortrait ? swapVerticalOutline : swapHorizontalOutline}
              style={{ 
                fontSize: '20px', 
                color: '#666',
                opacity: 0.6,
                pointerEvents: 'none',
                paddingLeft: '4px'
              }}
            />
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
        </div>

        {/* Content - Always visible */}
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
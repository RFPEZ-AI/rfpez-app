// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonIcon, IonChip } from '@ionic/react';
import { bugOutline } from 'ionicons/icons';

interface ClickableDebugToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

const ClickableDebugToggle: React.FC<ClickableDebugToggleProps> = ({ className, style }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [elementCount, setElementCount] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Check if decorator is already enabled
    const checkStatus = () => {
      const decorated = document.querySelectorAll('.clickable-debug-highlight');
      setElementCount(decorated.length);
      setIsEnabled(decorated.length > 0);
    };

    // Initial check
    checkStatus();

    // Watch for changes
    const observer = new MutationObserver(checkStatus);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const toggleDecorations = () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Clickable decorations only available in development mode');
      return;
    }

    if (window.clickableDecorator) {
      if (isEnabled) {
        window.clickableDecorator.disable();
        setIsEnabled(false);
        setElementCount(0);
      } else {
        window.clickableDecorator.enable();
        setIsEnabled(true);
      }
    } else {
      console.error('Clickable decorator not loaded');
    }
  };



  if (process.env.NODE_ENV !== 'development') {
    return null; // Don't show in production
  }

  return (
    <IonChip 
      className={className}
      color={isEnabled ? "success" : "medium"}
      onClick={toggleDecorations}
      style={{ 
        cursor: 'pointer', 
        userSelect: 'none',
        ...style
      }}
      data-test-id="debug-toggle"
      data-test-type="debug"
    >
      <IonIcon icon={bugOutline} />
      <span style={{ fontSize: '10px', marginLeft: '4px' }}>
        {isEnabled ? `${elementCount} highlighted` : 'Debug UI'}
      </span>
    </IonChip>
  );
};

export default ClickableDebugToggle;
// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonToast } from '@ionic/react';

interface UpdatePromptProps {
  onUpdate?: () => void;
}

const PWAUpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate }) => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });

          // Check if there's already an update waiting
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
          }
        }
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdate(false);
      
      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  return (
    <IonToast
      isOpen={showUpdate}
      onDidDismiss={handleDismiss}
      message="A new version of RFPEZ.AI is available!"
      position="bottom"
      duration={0} // Don't auto-dismiss
      buttons={[
        {
          text: 'Update',
          handler: handleUpdate
        },
        {
          text: 'Later',
          role: 'cancel',
          handler: handleDismiss
        }
      ]}
    />
  );
};

export default PWAUpdatePrompt;

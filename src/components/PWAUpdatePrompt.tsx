// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonToast } from '@ionic/react';

interface UpdatePromptProps {
  onUpdate?: () => void;
}

const PWAUpdatePrompt: React.FC<UpdatePromptProps> = ({ onUpdate }) => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            console.log('PWA: Update found, new service worker installing...');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('PWA: New service worker state:', newWorker.state);
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: Update ready, showing prompt to user');
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });

          // Check if there's already an update waiting
          if (registration.waiting) {
            console.log('PWA: Update already waiting, showing prompt');
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
          }

          // Log current registration info for debugging
          console.log('PWA: Service worker registration:', {
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            scope: registration.scope,
            updateViaCache: registration.updateViaCache
          });
        }
      });

        // Force update check on focus/visibility change
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            navigator.serviceWorker.ready.then(registration => {
              const checkTime = new Date();
              setLastCheckTime(checkTime);
              console.log('PWA: Manual update check at:', checkTime.toISOString());
              registration.update().then(() => {
                console.log('PWA: Manual update check completed');
              }).catch(error => {
                console.error('PWA: Manual update check failed:', error);
              });
            });
          }
        };      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
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

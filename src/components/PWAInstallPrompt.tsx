import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonToast } from '@ionic/react';
import { downloadOutline, closeOutline } from 'ionicons/icons';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      // Check for iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowToast(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <>
      <IonButton
        fill="outline"
        size="small"
        onClick={handleInstallClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          '--border-radius': '20px',
        }}
      >
        <IonIcon icon={downloadOutline} slot="start" />
        Install App
      </IonButton>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="RFPEZ.AI has been installed successfully!"
        duration={3000}
        position="bottom"
        buttons={[
          {
            icon: closeOutline,
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default PWAInstallPrompt;

import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonToast, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonText, IonList, IonItem, IonLabel } from '@ionic/react';
import { downloadOutline, closeOutline, shareOutline, addOutline } from 'ionicons/icons';

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
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    const isIOSDevice = detectIOS();

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      // Check for iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    const isAppInstalled = checkIfInstalled();

    // For iOS devices, show install button if not installed and not in standalone mode
    if (isIOSDevice && !isAppInstalled) {
      setShowInstallButton(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // This event doesn't fire on iOS, but we handle it for other platforms
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isIOSDevice) {
        setShowInstallButton(true);
      }
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
    if (isIOS) {
      // For iOS, show instructions modal
      setShowIOSModal(true);
      return;
    }

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
        <IonIcon icon={isIOS ? shareOutline : downloadOutline} slot="start" />
        {isIOS ? 'Install App' : 'Install App'}
      </IonButton>

      {/* iOS Installation Instructions Modal */}
      <IonModal isOpen={showIOSModal} onDidDismiss={() => setShowIOSModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Install RFPEZ.AI</IonTitle>
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={() => setShowIOSModal(false)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <h3>Install RFPEZ.AI on your iPhone</h3>
            <p>To install this app on your iPhone, follow these simple steps:</p>
          </IonText>
          
          <IonList>
            <IonItem>
              <IonIcon icon={shareOutline} slot="start" color="primary" />
              <IonLabel className="ion-text-wrap">
                <h3>1. Tap the Share button</h3>
                <p>Tap the share icon at the bottom of your Safari browser</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonIcon icon={addOutline} slot="start" color="primary" />
              <IonLabel className="ion-text-wrap">
                <h3>2. Select "Add to Home Screen"</h3>
                <p>Scroll down and tap "Add to Home Screen" in the share menu</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel className="ion-text-wrap">
                <h3>3. Confirm the installation</h3>
                <p>Tap "Add" in the top-right corner to install RFPEZ.AI to your home screen</p>
              </IonLabel>
            </IonItem>
          </IonList>

          <IonText color="medium">
            <p><small>
              Once installed, you can launch RFPEZ.AI directly from your home screen, 
              just like any other app. It will run in full-screen mode without the Safari browser bar.
            </small></p>
          </IonText>
        </IonContent>
      </IonModal>

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

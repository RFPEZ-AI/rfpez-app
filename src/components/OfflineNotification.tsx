import React, { useState, useEffect } from 'react';
import { IonToast } from '@ionic/react';

const OfflineNotification: React.FC = () => {
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowOnlineToast(true);
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setShowOfflineToast(true);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <IonToast
        isOpen={showOfflineToast}
        onDidDismiss={() => setShowOfflineToast(false)}
        message="You're offline. Some features may be limited."
        duration={5000}
        position="top"
        color="warning"
      />
      <IonToast
        isOpen={showOnlineToast}
        onDidDismiss={() => setShowOnlineToast(false)}
        message="You're back online!"
        duration={3000}
        position="top"
        color="success"
      />
    </>
  );
};

export default OfflineNotification;

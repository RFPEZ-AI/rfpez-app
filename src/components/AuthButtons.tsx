import React, { useState, useRef } from 'react';
import { IonButton, IonButtons, IonPopover, IonList, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { useAuth0 } from '@auth0/auth0-react';
import { logOutOutline, chevronDownOutline } from 'ionicons/icons';
import { devLog } from '../utils/devLog';

const AuthButtons: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout, isLoading, user, error } = useAuth0();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLIonButtonElement>(null);

  // Debug logging
  React.useEffect(() => {
    devLog.log('Auth0 State:', {
      isLoading,
      isAuthenticated,
      user: user ? { name: user.name, email: user.email } : null,
      error: error?.message
    });
  }, [isLoading, isAuthenticated, user, error]);

  // Set a timeout to show error if loading takes too long
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        devLog.error('Auth0 loading timeout - check your configuration');
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Show error if authentication failed
  if (error) {
    devLog.error('Auth0 Error:', error);
    return <span style={{ color: 'red' }}>Auth Error: {error.message}</span>;
  }

  if (loadingTimeout) {
    return (
      <IonButtons>
        <IonButton color="danger" onClick={() => window.location.reload()}>
          Auth Timeout - Retry
        </IonButton>
        <IonButton color="medium" onClick={() => window.location.reload()}>
          Continue as Guest
        </IonButton>
      </IonButtons>
    );
  }

  if (isLoading) {
    devLog.log('Auth0 is still loading...');
    return <span>Loading...</span>;
  }

  const handleLogin = () => {
    const redirectUri = window.location.origin;
    console.log('Attempting login with redirect URI:', redirectUri);
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: redirectUri
      }
    });
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <IonButtons>
      {!isAuthenticated ? (
        <>
          <IonButton onClick={handleLogin}>Login / Signup</IonButton>
          <IonButton color="medium" onClick={() => window.location.reload()}>Continue as Guest</IonButton>
        </>
      ) : (
        <>
          <IonButton 
            ref={userMenuRef}
            id="user-menu-trigger"
            fill="clear"
            onClick={() => setShowUserMenu(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textTransform: 'none',
              fontSize: '14px'
            }}
          >
            {user?.picture && (
              <img 
                src={user.picture} 
                alt="avatar" 
                style={{ 
                  height: 28, 
                  width: 28,
                  borderRadius: '50%', 
                  marginRight: 8 
                }} 
              />
            )}
            <span style={{ marginRight: 4 }}>
              {user?.name || user?.email}
            </span>
            <IonIcon icon={chevronDownOutline} size="small" />
          </IonButton>
          
          <IonPopover
            trigger="user-menu-trigger"
            isOpen={showUserMenu}
            onDidDismiss={() => setShowUserMenu(false)}
          >
            <IonList>
              <IonItem button onClick={handleLogout}>
                <IonIcon icon={logOutOutline} slot="start" />
                <IonLabel>Logout</IonLabel>
              </IonItem>
            </IonList>
          </IonPopover>
        </>
      )}
    </IonButtons>
  );
};

export default AuthButtons;

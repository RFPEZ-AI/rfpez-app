import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { IonButton, IonButtons } from '@ionic/react';

const AuthButtons: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, logout, isLoading, user } = useAuth0();

  if (isLoading) return <span>Loading...</span>;

  return (
    <IonButtons>
      {!isAuthenticated ? (
        <>
          <IonButton onClick={() => loginWithRedirect()}>Login / Signup</IonButton>
          <IonButton color="medium" onClick={() => window.location.reload()}>Continue as Guest</IonButton>
        </>
      ) : (
        <>
          <span style={{ marginRight: 12 }}>
            {user?.picture && <img src={user.picture} alt="avatar" style={{ height: 28, borderRadius: '50%', verticalAlign: 'middle', marginRight: 6 }} />}
            {user?.name || user?.email}
          </span>
          <IonButton color="danger" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</IonButton>
        </>
      )}
    </IonButtons>
  );
};

export default AuthButtons;

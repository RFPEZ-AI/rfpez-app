// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useRef } from 'react';
import { IonButton, IonButtons, IonPopover, IonList, IonItem, IonLabel, IonIcon, IonInput, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonBadge } from '@ionic/react';
import { useSupabase } from '../context/SupabaseContext';
import { logOutOutline, chevronDownOutline, logoGoogle, logoGithub } from 'ionicons/icons';
import { devLog } from '../utils/devLog';
import { RoleService } from '../services/roleService';

const AuthButtons: React.FC = () => {
  const { session, user, userProfile, loading, signIn, signUp, signOut, signInWithOAuth } = useSupabase();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLIonButtonElement>(null);

  // Debug logging
  React.useEffect(() => {
    devLog.log('Supabase Auth State:', {
      loading,
      isAuthenticated: !!session,
      user: user ? { id: user.id, email: user.email } : null,
    });
  }, [loading, session, user]);

  if (loading) {
    devLog.log('Supabase auth is still loading...');
    return <span>Loading...</span>;
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, {
            data: {
              full_name: email.split('@')[0], // Default name from email
            }
          })
        : await signIn(email, password);

      if (error) {
        setAuthError(error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        if (isSignUp) {
          setAuthError('Please check your email to confirm your account');
        }
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setAuthError(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        console.error('OAuth error:', error);
        if (error.message.includes('provider is not enabled')) {
          setAuthError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is not configured. Please contact support.`);
        } else {
          setAuthError(error.message);
        }
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setAuthError('Authentication failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    
    try {
      console.log('AuthButtons: Starting logout process...');
      const { error } = await signOut();
      
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, the state should be cleared by the signOut function
        // Let's provide user feedback but don't prevent the logout UI from updating
        alert('There was an issue with logout, but you have been signed out locally. Please refresh the page if needed.');
      } else {
        console.log('Logout successful');
      }
    } catch (exception) {
      console.error('Logout exception:', exception);
      // Provide user feedback
      alert('Logout completed. Please refresh the page if you still appear logged in.');
    }
  };

  const openAuthModal = (signUpMode = false) => {
    setIsSignUp(signUpMode);
    setAuthError(null);
    setEmail('');
    setPassword('');
    setShowAuthModal(true);
  };

  return (
    <>
      <IonButtons>
        {!session ? (
          <>
            <IonButton onClick={() => openAuthModal(false)}>Login</IonButton>
            <IonButton fill="outline" onClick={() => openAuthModal(true)}>Sign Up</IonButton>
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
              {user?.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
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
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <IonIcon icon={chevronDownOutline} size="small" />
            </IonButton>
            
            <IonPopover
              trigger="user-menu-trigger"
              isOpen={showUserMenu}
              onDidDismiss={() => setShowUserMenu(false)}
            >
              <IonList>
                {userProfile?.role && RoleService.isValidRole(userProfile.role) ? (
                  <IonItem>
                    <IonLabel>
                      <h3>Role</h3>
                      <p>{RoleService.getRoleDisplayName(userProfile.role)}</p>
                    </IonLabel>
                    <IonBadge color={
                      userProfile.role === 'administrator' ? 'danger' :
                      userProfile.role === 'developer' ? 'warning' : 'medium'
                    }>
                      {userProfile.role}
                    </IonBadge>
                  </IonItem>
                ) : null}
                <IonItem button onClick={handleLogout}>
                  <IonIcon icon={logOutOutline} slot="start" />
                  <IonLabel>Logout</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>
          </>
        )}
      </IonButtons>

      {/* Auth Modal */}
      <IonModal isOpen={showAuthModal} onDidDismiss={() => setShowAuthModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</IonTitle>
            <IonButton 
              slot="end" 
              fill="clear" 
              onClick={() => setShowAuthModal(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {authError && (
            <div style={{ color: 'red', marginBottom: '16px', padding: '8px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
              {authError}
            </div>
          )}
          
          {/* OAuth Buttons at the top */}
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => handleOAuthSignIn('google')}
            style={{ marginBottom: '8px' }}
          >
            <IonIcon icon={logoGoogle} slot="start" />
            Continue with Google
          </IonButton>
          
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => handleOAuthSignIn('github')}
            style={{ marginBottom: '16px' }}
            disabled={true}
          >
            <IonIcon icon={logoGithub} slot="start" />
            GitHub (Coming Soon)
          </IonButton>
          
          <div style={{ textAlign: 'center', margin: '16px 0', color: '#666' }}>
            or continue with email
          </div>
          
          <IonInput
            type="email"
            placeholder="Email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value || '')}
            style={{ marginBottom: '16px' }}
            fill="outline"
          />
          
          <IonInput
            type="password"
            placeholder="Password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value || '')}
            style={{ marginBottom: '16px' }}
            fill="outline"
          />
          
          <IonButton
            expand="block"
            onClick={handleEmailAuth}
            disabled={authLoading}
            style={{ marginBottom: '16px' }}
          >
            {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </IonButton>
          
          <div style={{ textAlign: 'center' }}>
            <IonButton 
              fill="clear" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default AuthButtons;

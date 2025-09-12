// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/react';
import { useSupabase } from '../context/SupabaseContext';

interface AuthDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, session, clearAuthState } = useSupabase();

  const handleClearAuth = async () => {
    try {
      if (clearAuthState) {
        await clearAuthState();
      } else {
        // Fallback manual clearing
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('supabase.')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      console.log('🧹 Auth state cleared');
      
      // Reload the page after clearing
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearURL = () => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    window.history.replaceState({}, document.title, url.toString());
    console.log('🧹 URL parameters cleared');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <IonCard style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <IonCardHeader>
          <IonCardTitle>🔧 Authentication Debug Panel</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ marginBottom: '20px' }}>
            <IonText color="medium">
              <h3>Current Authentication Status</h3>
            </IonText>
            
            <IonItem>
              <IonLabel>
                <h3>Session Status</h3>
                <p><strong>Has Session:</strong> {session ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Has User:</strong> {user ? '✅ Yes' : '❌ No'}</p>
                <p><strong>User ID:</strong> {user?.id || 'None'}</p>
                <p><strong>Email:</strong> {user?.email || 'None'}</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h3>User Profile</h3>
                <p><strong>Has Profile:</strong> {userProfile ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Role:</strong> {userProfile?.role || 'None'}</p>
                <p><strong>Profile ID:</strong> {userProfile?.id || 'None'}</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h3>URL Status</h3>
                <p><strong>Has Auth Code:</strong> {window.location.search.includes('code=') ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Has Hash:</strong> {window.location.hash ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Current URL:</strong> {window.location.href}</p>
              </IonLabel>
            </IonItem>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <IonButton expand="block" color="danger" onClick={handleClearAuth}>
              🧹 Clear Auth State & Reload
            </IonButton>
            
            <IonButton expand="block" color="warning" onClick={handleClearURL}>
              🔗 Clear URL Parameters
            </IonButton>
            
            <IonButton expand="block" color="medium" onClick={handleReload}>
              🔄 Reload Page
            </IonButton>
            
            <IonButton expand="block" fill="outline" onClick={onClose}>
              ❌ Close Panel
            </IonButton>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '13px' 
          }}>
            <IonText color="dark">
              <h4>🛠️ Troubleshooting Guide</h4>
              <p><strong>Stuck in login loop?</strong> Try &quot;Clear Auth State &amp; Reload&quot;</p>
              <p><strong>PKCE errors?</strong> Try &quot;Clear URL Parameters&quot; then reload</p>
              <p><strong>RLS policy errors?</strong> Check Supabase dashboard policies</p>
              <p><strong>Rate limiting?</strong> Wait a few seconds then try again</p>
              <br/>
              <p><strong>Debug Shortcut:</strong> Press Ctrl+Shift+D to open this panel</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default AuthDebugPanel;
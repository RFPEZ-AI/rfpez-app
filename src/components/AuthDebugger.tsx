import React, { useState, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel } from '@ionic/react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../supabaseClient';

const AuthDebugger: React.FC = () => {
  const { session, user, signOut } = useSupabase();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshDebugInfo = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      platform: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isWindows: navigator.userAgent.includes('Windows')
      },
      session: {
        hasSession: !!session,
        sessionId: session?.user?.id,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing',
        expiresAt: session?.expires_at,
        tokenType: session?.token_type
      },
      user: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        metadata: user?.user_metadata
      },
      localStorage: {},
      sessionStorage: {}
    };

    // Check localStorage for Supabase keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase')) {
          info.localStorage[key] = localStorage.getItem(key) ? 'Present' : 'Missing';
        }
      }
    } catch (error) {
      info.localStorage.error = error?.toString();
    }

    // Check sessionStorage for Supabase keys
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('supabase')) {
          info.sessionStorage[key] = sessionStorage.getItem(key) ? 'Present' : 'Missing';
        }
      }
    } catch (error) {
      info.sessionStorage.error = error?.toString();
    }

    // Get current session from Supabase directly
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      info.directSession = {
        hasSession: !!currentSession,
        error: error?.message,
        sessionId: currentSession?.user?.id
      };
    } catch (error) {
      info.directSession = { error: error?.toString() };
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [session, user, refreshKey]);

  const testLogout = async () => {
    console.log('=== AuthDebugger: Testing logout ===');
    
    try {
      const result = await signOut();
      console.log('Logout result:', result);
      
      // Refresh debug info after logout
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Logout test error:', error);
    }
  };

  const clearAllStorage = () => {
    try {
      // Clear all Supabase-related storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

      console.log('Cleared all auth storage');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  if (!session) {
    return null; // Only show when logged in
  }

  return (
    <IonCard style={{ margin: '16px', fontSize: '12px' }}>
      <IonCardHeader>
        <IonCardTitle>Auth Debug Info</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <IonItem>
            <IonLabel>
              <h3>Platform</h3>
              <p>Windows: {debugInfo.platform?.isWindows ? 'Yes' : 'No'}</p>
              <p>Platform: {debugInfo.platform?.platform}</p>
            </IonLabel>
          </IonItem>
          
          <IonItem>
            <IonLabel>
              <h3>Session State</h3>
              <p>Has Session: {debugInfo.session?.hasSession ? 'Yes' : 'No'}</p>
              <p>Access Token: {debugInfo.session?.accessToken}</p>
              <p>Refresh Token: {debugInfo.session?.refreshToken}</p>
              <p>Expires At: {debugInfo.session?.expiresAt ? new Date(debugInfo.session.expiresAt * 1000).toLocaleString() : 'N/A'}</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <h3>Direct Session Check</h3>
              <p>Has Session: {debugInfo.directSession?.hasSession ? 'Yes' : 'No'}</p>
              <p>Error: {debugInfo.directSession?.error || 'None'}</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <h3>Storage Keys</h3>
              <p>LocalStorage: {Object.keys(debugInfo.localStorage || {}).length} keys</p>
              <p>SessionStorage: {Object.keys(debugInfo.sessionStorage || {}).length} keys</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <IonButton size="small" onClick={refreshDebugInfo}>
            Refresh Info
          </IonButton>
          <IonButton size="small" color="warning" onClick={testLogout}>
            Test Logout
          </IonButton>
          <IonButton size="small" color="danger" onClick={clearAllStorage}>
            Clear Storage
          </IonButton>
        </div>

        <details style={{ marginTop: '16px', fontSize: '10px' }}>
          <summary>Raw Debug Data</summary>
          <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </IonCardContent>
    </IonCard>
  );
};

export default AuthDebugger;

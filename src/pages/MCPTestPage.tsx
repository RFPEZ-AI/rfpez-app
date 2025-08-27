import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonTextarea, IonAlert } from '@ionic/react';
import { mcpClient } from '../services/mcpClient';
import { supabase } from '../supabaseClient';

const MCPTestPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      addDebugLog(`Authentication: ${session ? 'Authenticated' : 'Not authenticated'}`);
      
      if (session) {
        addDebugLog(`User: ${session.user?.email || 'Unknown'}`);
        addDebugLog(`Token expires: ${session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'}`);
      }
    } catch (error) {
      addDebugLog(`Auth check error: ${error}`);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      addDebugLog('Starting authentication...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/mcp-test`
        }
      });
      
      if (error) {
        addDebugLog(`Auth error: ${error.message}`);
        setAlertMessage(`Authentication failed: ${error.message}`);
        setShowAlert(true);
      }
    } catch (error) {
      addDebugLog(`Sign in error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMCPInitialize = async () => {
    try {
      setIsLoading(true);
      addDebugLog('Testing MCP initialize...');
      
      const result = await mcpClient.initialize();
      addDebugLog(`Initialize successful: ${JSON.stringify(result, null, 2)}`);
      
      setAlertMessage('MCP Initialize successful!');
      setShowAlert(true);
    } catch (error: any) {
      addDebugLog(`Initialize failed: ${error.message}`);
      setAlertMessage(`Initialize failed: ${error.message}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const testMCPListTools = async () => {
    try {
      setIsLoading(true);
      addDebugLog('Testing MCP list tools...');
      
      const tools = await mcpClient.listTools();
      addDebugLog(`Tools found: ${tools.length}`);
      tools.forEach((tool: any) => {
        addDebugLog(`  - ${tool.name}: ${tool.description}`);
      });
      
      setAlertMessage(`Found ${tools.length} MCP tools!`);
      setShowAlert(true);
    } catch (error: any) {
      addDebugLog(`List tools failed: ${error.message}`);
      setAlertMessage(`List tools failed: ${error.message}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const testMCPGetSessions = async () => {
    try {
      setIsLoading(true);
      addDebugLog('Testing MCP get recent sessions...');
      
      const result = await mcpClient.getRecentSessions(5);
      const sessions = result.sessions;
      addDebugLog(`Sessions found: ${sessions.length}`);
      sessions.forEach((session: any) => {
        addDebugLog(`  - ${session.title} (${session.created_at})`);
      });
      
      setAlertMessage(`Found ${sessions.length} recent sessions!`);
      setShowAlert(true);
    } catch (error: any) {
      addDebugLog(`Get sessions failed: ${error.message}`);
      setAlertMessage(`Get sessions failed: ${error.message}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebugLog = () => {
    setDebugOutput([]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>MCP Test Console</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {/* Authentication Status */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Authentication Status</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>
                  <h3>Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</h3>
                </IonLabel>
              </IonItem>
              {!isAuthenticated && (
                <IonButton 
                  expand="block" 
                  onClick={signIn}
                  disabled={isLoading}
                >
                  Sign In with GitHub
                </IonButton>
              )}
              <IonButton 
                fill="outline" 
                expand="block" 
                onClick={checkAuth}
                disabled={isLoading}
              >
                Refresh Auth Status
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* MCP Tests */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>MCP Connection Tests</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                expand="block" 
                onClick={testMCPInitialize}
                disabled={!isAuthenticated || isLoading}
                style={{ marginBottom: '8px' }}
              >
                Test MCP Initialize
              </IonButton>
              <IonButton 
                expand="block" 
                onClick={testMCPListTools}
                disabled={!isAuthenticated || isLoading}
                style={{ marginBottom: '8px' }}
              >
                Test List Tools
              </IonButton>
              <IonButton 
                expand="block" 
                onClick={testMCPGetSessions}
                disabled={!isAuthenticated || isLoading}
                style={{ marginBottom: '8px' }}
              >
                Test Get Recent Sessions
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Debug Output */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Debug Output</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonTextarea
                value={debugOutput.join('\n')}
                rows={15}
                readonly
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  padding: '8px'
                }}
              />
              <IonButton 
                fill="outline" 
                expand="block" 
                onClick={clearDebugLog}
              >
                Clear Debug Log
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Test Result"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default MCPTestPage;

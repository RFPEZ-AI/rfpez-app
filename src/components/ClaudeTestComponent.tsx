import React, { useState } from 'react';
import { 
  IonButton, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonItem, 
  IonLabel, 
  IonTextarea, 
  IonSpinner,
  IonIcon,
  IonAlert
} from '@ionic/react';
import { 
  checkmarkCircle, 
  closeCircle, 
  warningOutline,
  chatbubbleEllipsesOutline 
} from 'ionicons/icons';
import { ClaudeService } from '../services/claudeService';

const ClaudeTestComponent: React.FC = () => {
  const [testMessage, setTestMessage] = useState('Hello, can you help me create a new session and then retrieve my recent conversations?');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const isConnected = await ClaudeService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      
      if (!isConnected) {
        setAlertMessage('Claude API connection failed. Check your API key configuration.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('failed');
      setAlertMessage(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    }
    setIsLoading(false);
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      // Create a session if we don't have one
      let sessionId = currentSessionId;
      if (!sessionId) {
        console.log('Creating new session...');
        sessionId = await ClaudeService.createSession(
          'Claude API Test Session',
          'Testing Claude API with MCP function calling'
        );
        setCurrentSessionId(sessionId);
        console.log('Created session:', sessionId);
      }

      // Mock agent for testing
      const testAgent = {
        id: 'test-agent',
        name: 'Claude Test Agent',
        instructions: 'You are a helpful AI assistant with access to conversation management functions. Help users manage their conversations and demonstrate your ability to use the available functions.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user',
        is_active: true,
        initial_prompt: '',
        is_default: false,
        is_restricted: false,
        sort_order: 0
      };

      console.log('Sending message to Claude with MCP integration...');
      const claudeResponse = await ClaudeService.generateResponse(
        testMessage, 
        testAgent,
        [], // No previous conversation history for this test
        sessionId
      );
      
      setResponse(claudeResponse.content);
      
      // Show metadata about the response
      if (claudeResponse.metadata.functions_called && claudeResponse.metadata.functions_called.length > 0) {
        console.log('Functions called:', claudeResponse.metadata.functions_called);
        setAlertMessage(`✅ MCP Functions called: ${claudeResponse.metadata.functions_called.join(', ')}`);
        setShowAlert(true);
      }

      // Refresh recent sessions to show the updated data
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionsData = await ClaudeService.getRecentSessions(5) as any;
        setRecentSessions(sessionsData.sessions || []);
      } catch (error) {
        console.warn('Failed to refresh sessions:', error);
      }

    } catch (error) {
      console.error('Message send error:', error);
      setAlertMessage(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    }
    
    setIsLoading(false);
  };

  const loadRecentSessions = async () => {
    try {
      setIsLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionsData = await ClaudeService.getRecentSessions(10) as any;
      setRecentSessions(sessionsData.sessions || []);
      setAlertMessage(`✅ Loaded ${sessionsData.sessions?.length || 0} recent sessions`);
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setAlertMessage(`Failed to load sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    try {
      setIsLoading(true);
      const sessionId = await ClaudeService.createSession(
        `Test Session ${new Date().toLocaleTimeString()}`,
        'Created via Claude Test Component'
      );
      setCurrentSessionId(sessionId);
      setAlertMessage(`✅ Created new session: ${sessionId}`);
      setShowAlert(true);
      
      // Refresh sessions list
      await loadRecentSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
      setAlertMessage(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };
    
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return checkmarkCircle;
      case 'failed':
        return closeCircle;
      default:
        return warningOutline;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'failed':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={chatbubbleEllipsesOutline} /> Claude API with MCP Test
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {/* Connection Status */}
          <IonItem>
            <IonIcon 
              icon={getStatusIcon()} 
              color={getStatusColor()}
              style={{ marginRight: '8px' }}
            />
            <IonLabel>
              <h3>Connection Status</h3>
              <p>
                {connectionStatus === 'unknown' && 'Not tested'}
                {connectionStatus === 'connected' && 'Connected successfully'}
                {connectionStatus === 'failed' && 'Connection failed'}
              </p>
            </IonLabel>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={testConnection}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Test Connection'}
            </IonButton>
          </IonItem>

          {/* Current Session */}
          <IonItem>
            <IonLabel>
              <h3>Current Session</h3>
              <p>{currentSessionId || 'No session created'}</p>
            </IonLabel>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={createNewSession}
              disabled={isLoading}
            >
              New Session
            </IonButton>
          </IonItem>

          {/* Recent Sessions */}
          <IonItem>
            <IonLabel>
              <h3>Recent Sessions ({recentSessions.length})</h3>
              <p>Click to load your recent conversations</p>
            </IonLabel>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={loadRecentSessions}
              disabled={isLoading}
            >
              Load Sessions
            </IonButton>
          </IonItem>

          {/* Test Message Input */}
          <IonItem>
            <IonLabel position="stacked">Test Message (Try asking about sessions or conversations)</IonLabel>
            <IonTextarea
              value={testMessage}
              onIonInput={(e) => setTestMessage(e.detail.value || '')}
              placeholder="Try: 'Can you create a new session and show me my recent conversations?'"
              rows={3}
            />
          </IonItem>

          {/* Send Test Button */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <IonButton 
              expand="block" 
              onClick={sendTestMessage}
              disabled={isLoading || !testMessage.trim()}
            >
              {isLoading ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  Sending...
                </>
              ) : (
                'Send Test Message with MCP'
              )}
            </IonButton>
          </div>

          {/* Response Display */}
          {response && (
            <IonItem style={{ marginTop: '16px' }}>
              <IonLabel>
                <h3>Claude Response:</h3>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  backgroundColor: 'var(--ion-color-light)', 
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {response}
                </div>
              </IonLabel>
            </IonItem>
          )}

          {/* Environment Check */}
          <IonItem style={{ marginTop: '16px' }}>
            <IonLabel>
              <h3>Environment Check</h3>
              <p>
                Claude API Key: {process.env.REACT_APP_CLAUDE_API_KEY ? 
                  (process.env.REACT_APP_CLAUDE_API_KEY === 'your_claude_api_key_here' ? 
                    '⚠️ Placeholder key detected' : 
                    '✅ Configured') : 
                  '❌ Not set'}
              </p>
            </IonLabel>
          </IonItem>
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Claude API MCP Test"
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default ClaudeTestComponent;

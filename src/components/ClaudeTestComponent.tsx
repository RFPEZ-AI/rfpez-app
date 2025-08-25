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
  const [testMessage, setTestMessage] = useState('Hello, can you help me with RFP management?');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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
      // Create a test agent
      const testAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        instructions: 'You are a helpful AI assistant for RFPEZ.AI. Provide clear, concise responses about RFP and procurement processes.',
        initial_prompt: 'Hello! How can I help you today?',
        description: 'Test agent for Claude API',
        avatar_url: '',
        is_active: true,
        is_default: false,
        is_restricted: false,
        sort_order: 0,
        created_at: '',
        updated_at: '',
        metadata: {}
      };
      
      const claudeResponse = await ClaudeService.generateResponse(
        testMessage,
        testAgent,
        []
      );
      
      setResponse(claudeResponse.content);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Test message error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Failed to get response'}`);
      setConnectionStatus('failed');
      setAlertMessage(`Failed to send test message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    }
    
    setIsLoading(false);
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
            <IonIcon icon={chatbubbleEllipsesOutline} /> Claude API Test
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

          {/* Test Message Input */}
          <IonItem>
            <IonLabel position="stacked">Test Message</IonLabel>
            <IonTextarea
              value={testMessage}
              onIonInput={(e) => setTestMessage(e.detail.value || '')}
              placeholder="Enter a test message..."
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
                'Send Test Message'
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
        header="Claude API Test"
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default ClaudeTestComponent;

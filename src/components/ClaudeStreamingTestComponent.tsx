// Copyright Mark Skiba, 2025 All rights reserved

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
  IonAlert,
  IonToggle
} from '@ionic/react';
import { 
  chatbubbleEllipsesOutline 
} from 'ionicons/icons';
import { ClaudeService } from '../services/claudeService';
import { useSupabase } from '../context/SupabaseContext';

const ClaudeStreamingTestComponent: React.FC = () => {
  const { userProfile } = useSupabase();
  const [testMessage, setTestMessage] = useState('Tell me a long story about a brave knight on a quest to save a kingdom. Make it at least 5 paragraphs long.');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [streamingChunks, setStreamingChunks] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sendStreamingTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    setStreamingChunks([]);
    
    try {
      // Create abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Mock agent for testing
      const testAgent = {
        id: 'streaming-test-agent',
        name: 'Streaming Test Agent',
        instructions: 'You are a helpful AI assistant. When users ask for stories or long responses, provide detailed, engaging content.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user',
        is_active: true,
        initial_prompt: '',
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 0,
        description: 'Test agent for streaming functionality',
        avatar_url: '',
        metadata: {}
      };

      let fullResponse = '';
      const chunks: string[] = [];

      // Streaming callback to collect chunks
      const onStreamingChunk = (chunk: string, isComplete: boolean) => {
        if (chunk) {
          fullResponse += chunk;
          chunks.push(chunk);
          setResponse(fullResponse);
          setStreamingChunks([...chunks]);
        }
        
        if (isComplete) {
          console.log('✅ Streaming completed. Total chunks:', chunks.length);
        }
      };

      const claudeResponse = await ClaudeService.generateResponse(
        testMessage,
        testAgent,
        [], // No conversation history
        undefined, // No session ID for test
        userProfile ? {
          id: userProfile.id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          role: userProfile.role
        } : undefined,
        undefined, // No RFP context
        undefined, // No artifact context
        controller.signal, // Pass abort signal
        enableStreaming, // Enable/disable streaming based on toggle
        enableStreaming ? onStreamingChunk : undefined // Only pass callback if streaming enabled
      );

      if (!enableStreaming) {
        // For non-streaming, set the response directly
        setResponse(claudeResponse.content);
      }

      setAlertMessage(`✅ ${enableStreaming ? 'Streaming' : 'Non-streaming'} test completed successfully! 
        Response length: ${claudeResponse.content.length} characters
        ${enableStreaming ? `Stream chunks: ${chunks.length}` : ''}
        Model: ${claudeResponse.metadata.model}
        Response time: ${claudeResponse.metadata.response_time}ms`);
      setShowAlert(true);

    } catch (error) {
      console.error('Streaming test error:', error);
      
      // Check if it was a cancellation
      if (error instanceof Error && error.message === 'Request was cancelled') {
        setAlertMessage('✅ Request was cancelled successfully. Abort handling is working correctly!');
        setResponse('Request was cancelled by user.');
      } else {
        setAlertMessage(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      setShowAlert(true);
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={chatbubbleEllipsesOutline} style={{ marginRight: '8px' }} />
          Claude Streaming Response Test
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '16px' }}>
            This component tests the new streaming functionality for Claude API responses. 
            When streaming is enabled, you&apos;ll see the response appear progressively as it&apos;s generated.
          </p>

          {/* Streaming Toggle */}
          <IonItem>
            <IonLabel>
              <h3>Enable Streaming</h3>
              <p>Toggle between streaming and traditional response modes</p>
            </IonLabel>
            <IonToggle
              checked={enableStreaming}
              onIonChange={e => setEnableStreaming(e.detail.checked)}
              disabled={isLoading}
            />
          </IonItem>

          {/* Test Message Input */}
          <IonItem>
            <IonTextarea
              label="Test Message"
              value={testMessage}
              onIonInput={(e) => setTestMessage(e.detail.value || '')}
              placeholder="Enter a message that will generate a long response..."
              rows={3}
            />
          </IonItem>

          {/* Send Test Button */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <IonButton 
              expand="block" 
              onClick={sendStreamingTestMessage}
              disabled={isLoading || !testMessage.trim()}
              color={enableStreaming ? 'primary' : 'secondary'}
            >
              {isLoading ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  {enableStreaming ? 'Streaming...' : 'Generating...'}
                </>
              ) : (
                `Test ${enableStreaming ? 'Streaming' : 'Traditional'} Response`
              )}
            </IonButton>
            
            {/* Cancel Button */}
            {isLoading && (
              <IonButton 
                expand="block" 
                fill="outline"
                color="danger"
                onClick={() => {
                  if (abortController) {
                    console.log('Manually aborting request...');
                    abortController.abort();
                    setAbortController(null);
                  }
                }}
                style={{ marginTop: '8px' }}
              >
                Cancel Request
              </IonButton>
            )}
          </div>

          {/* Streaming Stats */}
          {enableStreaming && streamingChunks.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '8px', 
              backgroundColor: 'var(--ion-color-light)', 
              borderRadius: '4px',
              fontSize: '0.8em' 
            }}>
              <strong>Streaming Stats:</strong> {streamingChunks.length} chunks received
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div style={{ marginTop: '16px' }}>
              <h4>Response:</h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'var(--ion-color-light)', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {response}
                {/* Show typing indicator for streaming */}
                {enableStreaming && isLoading && (
                  <span style={{
                    opacity: 0.7,
                    animation: 'blink 1s infinite',
                    marginLeft: '2px'
                  }}>▊</span>
                )}
              </div>
            </div>
          )}

          <style>
            {`
              @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
            `}
          </style>
        </div>

        {/* Alert for results */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Test Result"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default ClaudeStreamingTestComponent;
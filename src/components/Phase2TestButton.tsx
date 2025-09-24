// Copyright Mark Skiba, 2025 All rights reserved
// Phase 2 Test Button Component - Streaming Integration Test

import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonSpinner, IonTextarea } from '@ionic/react';
import { ClaudeService } from '../services/claudeServiceV2';

interface StreamingTestResult {
  success: boolean;
  content?: string;
  totalChunks?: number;
  responseTime?: number;
  tokensUsed?: number;
  error?: string;
  chunks?: string[];
}

const Phase2TestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StreamingTestResult | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [chunkCount, setChunkCount] = useState(0);

  const runPhase2Test = async () => {
    setIsLoading(true);
    setResult(null);
    setStreamingContent('');
    setChunkCount(0);
    
    try {
      console.log('🌊 Starting Phase 2 Test: Streaming Claude API via Edge Function');
      
      const startTime = Date.now();
      const chunks: string[] = [];
      
      // Create a mock agent for testing
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for streaming functionality',
        role: 'test',
        instructions: 'You are a helpful AI assistant for testing streaming functionality.',
        initial_prompt: 'Hello! I am here to help test streaming functionality.',
        avatar_url: undefined,
        is_active: true,
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Test message that should generate a decent response
      const testMessage = 'Please write a short story about a robot learning to paint. Make it about 3-4 paragraphs long so we can test the streaming functionality properly.';

      console.log('📝 Test message:', testMessage);

      // Call Claude API with streaming enabled
      const response = await ClaudeService.generateResponse(
        testMessage,
        mockAgent,
        [], // Empty conversation history
        'test-session-streaming',
        undefined, // No user profile
        undefined, // No current RFP
        undefined, // No current artifact
        undefined, // No abort signal
        true, // Enable streaming
        (chunk: string, isComplete: boolean, metadata?: any) => {
          console.log('🔍 Streaming callback called:', { chunk, isComplete, metadata });
          
          if (!isComplete && chunk) {
            chunks.push(chunk);
            setChunkCount(prev => prev + 1);
            setStreamingContent(prev => prev + chunk);
            console.log(`📦 Chunk ${chunks.length}:`, chunk);
          } else if (isComplete) {
            console.log('🏁 Streaming complete', { metadata });
          }
        }
      );

      const responseTime = Date.now() - startTime;

      console.log('✅ Streaming test completed:', {
        content: response.content,
        chunks: chunks.length,
        responseTime,
        metadata: response.metadata
      });

      setResult({
        success: true,
        content: response.content,
        totalChunks: chunks.length,
        responseTime,
        tokensUsed: response.metadata.tokens_used,
        chunks,
      });

    } catch (error) {
      console.error('❌ Phase 2 streaming test failed:', error);
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>🌊 Phase 2 Test: Streaming Edge Function Integration</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Test the new streaming Claude API functionality through the edge function proxy.</p>
        
        <IonButton 
          expand="block" 
          onClick={runPhase2Test} 
          disabled={isLoading}
          color="secondary"
        >
          {isLoading ? (
            <>
              <IonSpinner slot="start" />
              Testing Streaming...
            </>
          ) : (
            'Run Phase 2 Streaming Test'
          )}
        </IonButton>

        {/* Real-time streaming content display */}
        {streamingContent && (
          <div style={{ marginTop: '16px' }}>
            <IonItem>
              <IonLabel>
                <h3>📡 Live Streaming Content (Chunks: {chunkCount})</h3>
              </IonLabel>
            </IonItem>
            <IonTextarea
              value={streamingContent}
              readonly
              autoGrow
              style={{ 
                border: '1px solid var(--ion-color-medium)',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px',
                minHeight: '100px',
                fontSize: '14px',
              }}
            />
          </div>
        )}

        {result && (
          <div style={{ marginTop: '16px' }}>
            {result.success ? (
              <div>
                <IonItem color="success">
                  <IonLabel>
                    <h3>✅ Streaming Test Successful!</h3>
                    <p>Edge function streaming is working correctly</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem>
                  <IonLabel>
                    <h3>📊 Streaming Statistics:</h3>
                    <p><strong>Total Chunks:</strong> {result.totalChunks}</p>
                    <p><strong>Response Time:</strong> {result.responseTime}ms</p>
                    <p><strong>Tokens Used:</strong> {result.tokensUsed}</p>
                    <p><strong>Content Length:</strong> {result.content?.length} characters</p>
                  </IonLabel>
                </IonItem>

                {result.content && (
                  <IonItem>
                    <IonLabel>
                      <h3>📝 Final Content:</h3>
                      <IonTextarea
                        value={result.content}
                        readonly
                        autoGrow
                        style={{ 
                          border: '1px solid var(--ion-color-light)',
                          borderRadius: '4px',
                          padding: '8px',
                          marginTop: '8px',
                          fontSize: '14px',
                        }}
                      />
                    </IonLabel>
                  </IonItem>
                )}
              </div>
            ) : (
              <IonItem color="danger">
                <IonLabel>
                  <h3>❌ Streaming Test Failed</h3>
                  <p>{result.error}</p>
                </IonLabel>
              </IonItem>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default Phase2TestButton;
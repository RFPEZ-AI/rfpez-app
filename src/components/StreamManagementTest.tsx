// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonText,
  IonProgressBar,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
} from '@ionic/react';
import { ClaudeService as ClaudeServiceV2 } from '../services/claudeServiceV2';
import { streamManager } from '../services/claudeAPIProxy';
import type { Agent } from '../types/database';

interface StreamTestResult {
  success: boolean;
  content?: string;
  totalChunks?: number;
  responseTime?: number;
  tokensUsed?: number;
  error?: string;
  aborted?: boolean;
  streamId?: string;
}

const StreamManagementTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StreamTestResult | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [chunkCount, setChunkCount] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Update active stream count periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStreams(streamManager.getActiveStreamCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const runStreamTest = async () => {
    setIsLoading(true);
    setResult(null);
    setStreamingContent('');
    setChunkCount(0);

    // Create abort controller for this test
    const controller = new AbortController();
    setAbortController(controller);

    try {
      console.log('🔄 Starting stream management test');
      
      const startTime = Date.now();
      const chunks: string[] = [];

      // Create a mock agent for testing
      const mockAgent: Agent = {
        id: 'test-stream-mgmt',
        name: 'Stream Management Test Agent',
        description: 'Agent for testing stream management features',
        role: 'test',
        instructions: 'You are a helpful AI assistant for testing streaming management functionality.',
        initial_prompt: 'Hello! I am here to help test streaming management.',
        avatar_url: undefined,
        is_active: true,
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Test message that should generate a longer response
      const testMessage = 'Please write a detailed explanation of how streaming works in web applications. Include technical details about Server-Sent Events, WebSockets, and real-time data transfer. Make it comprehensive so we can test the streaming and abort functionality.';

      console.log('📝 Stream management test message:', testMessage);

      // Call Claude API with streaming enabled and abort controller
      const response = await ClaudeServiceV2.generateResponse(
        testMessage,
        mockAgent,
        [], // Empty conversation history
        'test-session-stream-mgmt',
        undefined, // No user profile
        undefined, // No current RFP
        undefined, // No current artifact
        controller.signal, // Pass abort signal
        true, // Enable streaming
        (chunk: string, isComplete: boolean, metadata?: any) => {
          console.log('🔍 Stream management callback:', { chunk, isComplete, metadata });
          
          if (!isComplete && chunk) {
            chunks.push(chunk);
            setChunkCount(prev => prev + 1);
            setStreamingContent(prev => prev + chunk);
            console.log(`📦 Chunk ${chunks.length}:`, chunk);
          } else if (isComplete) {
            console.log('🏁 Stream management test complete', { metadata });
            if (metadata?.aborted) {
              console.log('🛑 Stream was aborted');
            }
          }
        }
      );

      const responseTime = Date.now() - startTime;

      console.log('✅ Stream management test completed:', {
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
        streamId: response.metadata.streamId ? String(response.metadata.streamId) : undefined,
      });

    } catch (error) {
      console.error('❌ Stream management test failed:', error);
      
      const isAborted = error instanceof Error && error.message.includes('aborted');
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        aborted: isAborted,
      });
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const abortStream = () => {
    if (abortController) {
      console.log('🛑 Manually aborting stream');
      abortController.abort();
      setAbortController(null);
    }
  };

  const abortAllStreams = () => {
    console.log('🛑 Aborting all active streams');
    streamManager.abortAllStreams();
    setActiveStreams(0);
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>🔄 Stream Management Test</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Test advanced streaming features including abort functionality, connection management, and retry logic.</p>
        
        <IonList>
          <IonItem>
            <IonLabel>Active Streams</IonLabel>
            <IonBadge color={activeStreams > 0 ? 'warning' : 'success'}>{activeStreams}</IonBadge>
          </IonItem>
          <IonItem>
            <IonLabel>Streaming Chunks Received</IonLabel>
            <IonBadge color="primary">{chunkCount}</IonBadge>
          </IonItem>
        </IonList>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <IonButton 
            onClick={runStreamTest}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? <IonSpinner name="crescent" /> : '🚀'} Run Stream Test
          </IonButton>
          
          <IonButton 
            onClick={abortStream}
            disabled={!isLoading || !abortController}
            color="warning"
          >
            🛑 Abort Current Stream
          </IonButton>
          
          <IonButton 
            onClick={abortAllStreams}
            disabled={activeStreams === 0}
            color="danger"
          >
            ⚠️ Abort All Streams ({activeStreams})
          </IonButton>
        </div>

        {isLoading && (
          <div style={{ marginTop: '16px' }}>
            <IonText color="medium">
              <p>🌊 Streaming in progress... (Chunks: {chunkCount})</p>
            </IonText>
            <IonProgressBar type="indeterminate" />
            
            {streamingContent && (
              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '8px',
                maxHeight: '200px',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                <strong>Live Streaming Content:</strong>
                <div style={{ marginTop: '8px' }}>{streamingContent}</div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '16px' }}>
            <IonText color={result.success ? 'success' : 'danger'}>
              <h3>{result.success ? '✅ Stream Management Test Successful!' : '❌ Stream Management Test Failed'}</h3>
            </IonText>
            
            {result.success ? (
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>📊 Streaming Statistics:</h3>
                    <p><strong>Total Chunks:</strong> {result.totalChunks}</p>
                    <p><strong>Response Time:</strong> {result.responseTime}ms</p>
                    <p><strong>Tokens Used:</strong> {result.tokensUsed}</p>
                    <p><strong>Content Length:</strong> {result.content?.length} characters</p>
                    {result.streamId && <p><strong>Stream ID:</strong> {result.streamId}</p>}
                  </IonLabel>
                </IonItem>
              </IonList>
            ) : (
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>❌ Error Details:</h3>
                    <p>{result.error}</p>
                    {result.aborted && (
                      <p><strong>🛑 Stream was aborted as expected</strong></p>
                    )}
                  </IonLabel>
                </IonItem>
              </IonList>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default StreamManagementTest;
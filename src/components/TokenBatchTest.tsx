// Copyright Mark Skiba, 2025 All rights reserved
import React, { useState, useRef } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonTextarea,
  IonItem,
  IonLabel,
  IonBadge,
  IonList,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonToggle,
} from '@ionic/react';
import { ClaudeService } from '../services/claudeServiceV2';
import { streamManager } from '../services/claudeAPIProxy';

interface BatchStatistics {
  updateCount: number;
  totalTokens: number;
  batchCount: number;
  averageBatchSize: number;
  averageUpdateInterval: number;
  priorityFlushCount: number;
  timerFlushCount: number;
  maxBatchFlushCount: number;
  lastUpdateTime: number;
  startTime: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TokenBatchTestProps {
  // Add props as needed
}

const TokenBatchTest: React.FC<TokenBatchTestProps> = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('Write a detailed explanation of machine learning, including examples and applications. Use priority keywords like SUCCESS, ERROR, and COMPLETE appropriately.');
  const [stats, setStats] = useState<BatchStatistics>({
    updateCount: 0,
    totalTokens: 0,
    batchCount: 0,
    averageBatchSize: 0,
    averageUpdateInterval: 0,
    priorityFlushCount: 0,
    timerFlushCount: 0,
    maxBatchFlushCount: 0,
    lastUpdateTime: 0,
    startTime: 0,
  });
  const [batchConfig, setBatchConfig] = useState({
    maxBatchSize: 50,
    flushIntervalMs: 100,
    minFlushSize: 5,
    adaptiveThreshold: 200,
  });
  const [enableBatching, setEnableBatching] = useState(true);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const updateStats = (newTokens: string, metadata: any) => {
    const now = Date.now();
    setStats(prevStats => {
      const newStats = { ...prevStats };
      newStats.updateCount += 1;
      newStats.totalTokens += newTokens.length;
      newStats.batchCount = metadata.batchCount || newStats.batchCount;
      
      if (newStats.totalTokens > 0) {
        newStats.averageBatchSize = newStats.totalTokens / Math.max(newStats.updateCount, 1);
      }
      
      if (newStats.lastUpdateTime > 0) {
        const interval = now - newStats.lastUpdateTime;
        newStats.averageUpdateInterval = (newStats.averageUpdateInterval * (newStats.updateCount - 1) + interval) / newStats.updateCount;
      }
      
      newStats.lastUpdateTime = now;
      
      // Track flush reasons
      if (metadata.flushReason === 'priority') {
        newStats.priorityFlushCount += 1;
      } else if (metadata.flushReason === 'timer') {
        newStats.timerFlushCount += 1;
      } else if (metadata.flushReason === 'maxSize') {
        newStats.maxBatchFlushCount += 1;
      }
      
      return newStats;
    });
    
    // Add to update log
    const logEntry = `${new Date().toLocaleTimeString()}: +${newTokens.length} chars (${metadata.flushReason || 'normal'})`;
    setUpdateLog(prev => [...prev.slice(-20), logEntry]); // Keep last 20 entries
  };

  const handleStartStreaming = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsStreaming(true);
    setContent('');
    setStats({
      updateCount: 0,
      totalTokens: 0,
      batchCount: 0,
      averageBatchSize: 0,
      averageUpdateInterval: 0,
      priorityFlushCount: 0,
      timerFlushCount: 0,
      maxBatchFlushCount: 0,
      lastUpdateTime: 0,
      startTime: Date.now(),
    });
    setUpdateLog([]);

    // Update batch configuration
    if (enableBatching) {
      streamManager.updateBatchConfig(batchConfig);
    }

    try {
      abortControllerRef.current = new AbortController();
      
      // Create a mock agent for testing
      const testAgent = {
        id: 'test-agent',
        name: 'Token Batch Test Agent',
        description: 'Agent for testing token batching functionality',
        role: 'testing',
        instructions: 'You are a test agent for token batching. Provide detailed responses to test the batching system.',
        initial_prompt: 'Hello! I\'m here to help test token batching functionality.',
        avatar_url: undefined,
        is_active: true,
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { purpose: 'token-batching-test' }
      };

      const response = await ClaudeService.generateStreamingResponse(
        prompt,
        testAgent,
        [], // conversation history
        'test-session-id',
        undefined, // user profile
        undefined, // current RFP
        undefined, // current artifact
        abortControllerRef.current.signal,
        (chunk: string, isComplete: boolean, metadata: any) => {
          if (isComplete) {
            setIsStreaming(false);
            updateStats(chunk, { ...metadata, flushReason: 'complete' });
            
            // Final batch statistics from stream manager
            const finalBatchStats = streamManager.getBatchStatistics();
            console.log('📊 Final batch statistics:', finalBatchStats);
            
            return;
          }

          if (chunk) {
            setContent(prev => prev + chunk);
            updateStats(chunk, metadata);
          }
        }
      );

      console.log('✅ Token batch streaming test completed:', response);
    } catch (error) {
      console.error('❌ Token batch streaming test failed:', error);
      setIsStreaming(false);
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const currentBatchStats = streamManager.getBatchStatistics();
  const healthMetrics = streamManager.getStreamingHealthMetrics();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>🚀 Token Batching Performance Test</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Configuration</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">Prompt</IonLabel>
                    <IonTextarea
                      value={prompt}
                      onIonInput={(e) => setPrompt(e.detail.value!)}
                      placeholder="Enter streaming prompt..."
                      rows={3}
                      disabled={isStreaming}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel>Enable Token Batching</IonLabel>
                    <IonToggle 
                      checked={enableBatching} 
                      onIonChange={e => setEnableBatching(e.detail.checked)}
                      disabled={isStreaming}
                    />
                  </IonItem>
                  
                  {enableBatching && (
                    <>
                      <IonItem>
                        <IonLabel position="stacked">Max Batch Size</IonLabel>
                        <IonInput
                          type="number"
                          value={batchConfig.maxBatchSize}
                          onIonInput={e => setBatchConfig(prev => ({ ...prev, maxBatchSize: parseInt(e.detail.value!) || 50 }))}
                          disabled={isStreaming}
                        />
                      </IonItem>
                      
                      <IonItem>
                        <IonLabel position="stacked">Flush Interval (ms)</IonLabel>
                        <IonInput
                          type="number"
                          value={batchConfig.flushIntervalMs}
                          onIonInput={e => setBatchConfig(prev => ({ ...prev, flushIntervalMs: parseInt(e.detail.value!) || 100 }))}
                          disabled={isStreaming}
                        />
                      </IonItem>
                      
                      <IonItem>
                        <IonLabel position="stacked">Min Flush Size</IonLabel>
                        <IonInput
                          type="number"
                          value={batchConfig.minFlushSize}
                          onIonInput={e => setBatchConfig(prev => ({ ...prev, minFlushSize: parseInt(e.detail.value!) || 5 }))}
                          disabled={isStreaming}
                        />
                      </IonItem>
                    </>
                  )}
                  
                  <div style={{ marginTop: '16px' }}>
                    <IonButton 
                      expand="block" 
                      onClick={handleStartStreaming}
                      disabled={isStreaming || !prompt.trim()}
                      color="primary"
                    >
                      {isStreaming ? 'Streaming...' : 'Start Token Batch Test'}
                    </IonButton>
                    
                    {isStreaming && (
                      <IonButton 
                        expand="block" 
                        onClick={handleAbort}
                        color="danger"
                        style={{ marginTop: '8px' }}
                      >
                        Abort Stream
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Performance Metrics</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>
                      <IonLabel>
                        <h3>UI Updates</h3>
                        <p>Total: {stats.updateCount}</p>
                      </IonLabel>
                      <IonBadge color={stats.updateCount < 50 ? 'success' : stats.updateCount < 100 ? 'warning' : 'danger'}>
                        {stats.updateCount}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Average Batch Size</h3>
                        <p>{stats.averageBatchSize.toFixed(1)} chars</p>
                      </IonLabel>
                      <IonBadge color="primary">
                        {stats.averageBatchSize.toFixed(1)}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Average Update Interval</h3>
                        <p>{stats.averageUpdateInterval.toFixed(0)}ms</p>
                      </IonLabel>
                      <IonBadge color={stats.averageUpdateInterval > 80 ? 'success' : 'warning'}>
                        {stats.averageUpdateInterval.toFixed(0)}ms
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Flush Reasons</h3>
                        <p>Priority: {stats.priorityFlushCount}, Timer: {stats.timerFlushCount}, Max: {stats.maxBatchFlushCount}</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Active Streams</h3>
                        <p>{healthMetrics.activeStreams} / {healthMetrics.maxConcurrentStreams}</p>
                      </IonLabel>
                      <IonBadge color={healthMetrics.healthStatus === 'healthy' ? 'success' : 'warning'}>
                        {healthMetrics.healthStatus}
                      </IonBadge>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
              
              {Object.keys(currentBatchStats).length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Current Batches</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      {Object.entries(currentBatchStats).map(([streamId, batchInfo]) => (
                        <IonItem key={streamId}>
                          <IonLabel>
                            <h3>{streamId.substring(0, 20)}...</h3>
                            <p>{batchInfo.tokenCount} tokens, {batchInfo.length} chars, {batchInfo.age}ms old</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Streaming Output</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ 
                    height: '300px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--ion-color-medium)', 
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    backgroundColor: 'var(--ion-color-light)',
                  }}>
                    {content || 'Streaming output will appear here...'}
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <IonText color="medium">
                      <p>
                        <strong>Total Characters:</strong> {content.length} | 
                        <strong> UI Updates:</strong> {stats.updateCount} | 
                        <strong> Efficiency:</strong> {stats.updateCount > 0 ? (content.length / stats.updateCount).toFixed(1) : 0} chars/update |
                        <strong> Duration:</strong> {stats.startTime > 0 ? ((Date.now() - stats.startTime) / 1000).toFixed(1) : 0}s
                      </p>
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Update Log</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ 
                    height: '300px', 
                    overflowY: 'auto', 
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}>
                    {updateLog.length > 0 ? (
                      updateLog.map((entry, index) => (
                        <div key={index} style={{ marginBottom: '2px' }}>
                          {entry}
                        </div>
                      ))
                    ) : (
                      <IonText color="medium">Update log will appear here...</IonText>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default TokenBatchTest;
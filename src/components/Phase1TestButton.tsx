// Copyright Mark Skiba, 2025 All rights reserved
// Phase 1 Test Button Component
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonSpinner } from '@ionic/react';
import { ClaudeService } from '../services/claudeServiceV2';
import { claudeAPIProxy } from '../services/claudeAPIProxy';

interface TestResult {
  success: boolean;
  connectionTest?: any;
  claudeResponse?: any;
  error?: string;
}

const Phase1TestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runPhase1Test = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting Phase 1 Test: Non-streaming Claude API via Edge Function');
      
      // Test 1: Edge function connection test
      console.log('📡 Testing edge function connection...');
      const connectionTest = await claudeAPIProxy.testConnection();
      console.log('✅ Connection test result:', connectionTest);
      
      // Test 2: Simple Claude message (non-streaming)
      console.log('💬 Testing non-streaming Claude message...');
      
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        instructions: 'You are a helpful test assistant. Respond briefly and clearly.',
        initial_prompt: 'Hello! I am ready to help.',
        access_level: 'free' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'test-user',
        is_active: true,
        is_default: false,
        is_restricted: false,
        is_free: true,
        sort_order: 1,
        prompt_engineering: null,
        version: '1.0'
      };
      
      const response = await ClaudeService.generateResponse(
        'Hello! This is a test message from Phase 1. Please respond briefly.',
        mockAgent,
        [], // empty conversation history
        'test-session-123',
        {
          id: 'test-user',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user'
        },
        null, // no current RFP
        null, // no current artifact
        undefined, // no abort signal
        false // non-streaming mode
      );
      
      console.log('✅ Claude response received:', response);
      
      setResult({
        success: true,
        connectionTest,
        claudeResponse: response
      });
      
    } catch (error) {
      console.error('❌ Phase 1 test failed:', error);
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
        <IonCardTitle>🧪 Phase 1 Test: Edge Function Integration</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Test the new Claude API edge function with non-streaming mode.</p>
        
        <IonButton 
          expand="block" 
          onClick={runPhase1Test} 
          disabled={isLoading}
          color="primary"
        >
          {isLoading ? (
            <>
              <IonSpinner slot="start" />
              Testing...
            </>
          ) : (
            'Run Phase 1 Test'
          )}
        </IonButton>

        {result && (
          <div style={{ marginTop: '16px' }}>
            {result.success ? (
              <div>
                <IonItem color="success">
                  <IonLabel>
                    <h3>✅ Test Successful!</h3>
                    <p>Edge function is working correctly</p>
                  </IonLabel>
                </IonItem>
                
                {result.claudeResponse && (
                  <IonItem>
                    <IonLabel>
                      <h3>Claude Response:</h3>
                      <p>{result.claudeResponse.content}</p>
                      <p><small>Model: {result.claudeResponse.metadata?.model} | Tokens: {result.claudeResponse.metadata?.tokens_used} | Time: {result.claudeResponse.metadata?.response_time}ms</small></p>
                    </IonLabel>
                  </IonItem>
                )}
              </div>
            ) : (
              <IonItem color="danger">
                <IonLabel>
                  <h3>❌ Test Failed</h3>
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

export default Phase1TestButton;
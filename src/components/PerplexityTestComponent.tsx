// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonSpinner, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { checkmarkCircle, closeCircle, warningOutline, timeOutline, searchOutline } from 'ionicons/icons';

interface PerplexityTestResult {
  available: boolean;
  status: string;
  responseTime: number;
  resultCount?: number;
  error?: string;
}

const PerplexityTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<PerplexityTestResult | null>(null);

  const handleTestAPI = async () => {
    setIsLoading(true);
    setTestResult(null);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/test-perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What is the capital of France?'
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          available: true,
          status: 'API Available',
          responseTime,
          resultCount: data.results?.length || 0
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        setTestResult({
          available: false,
          status: 'API Error',
          responseTime,
          error: errorData.error || `HTTP ${response.status}`
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setTestResult({
        available: false,
        status: 'Connection Failed',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!testResult) return null;
    
    if (testResult.available) {
      return <IonIcon icon={checkmarkCircle} color="success" />;
    } else if (testResult.status === 'API Error') {
      return <IonIcon icon={warningOutline} color="warning" />;
    } else {
      return <IonIcon icon={closeCircle} color="danger" />;
    }
  };

  const getStatusColor = () => {
    if (!testResult) return undefined;
    
    if (testResult.available) {
      return 'success';
    } else if (testResult.status === 'API Error') {
      return 'warning';
    } else {
      return 'danger';
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={searchOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Perplexity API Health Check
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Test the Perplexity AI search API connectivity and response time.</p>
        
        <IonButton 
          expand="block" 
          onClick={handleTestAPI} 
          disabled={isLoading}
          style={{ marginBottom: '16px' }}
        >
          {isLoading ? (
            <>
              <IonSpinner name="dots" style={{ marginRight: '8px' }} />
              Testing Perplexity API...
            </>
          ) : (
            'Test Perplexity API'
          )}
        </IonButton>

        {testResult && (
          <div style={{ marginTop: '16px' }}>
            <IonItem lines="none">
              {getStatusIcon()}
              <IonLabel>
                <h3>
                  <IonText color={getStatusColor()}>
                    {testResult.status}
                  </IonText>
                </h3>
              </IonLabel>
            </IonItem>
            
            <IonItem lines="none">
              <IonIcon icon={timeOutline} slot="start" />
              <IonLabel>
                <h3>Response Time</h3>
                <p>{testResult.responseTime}ms</p>
              </IonLabel>
            </IonItem>

            {testResult.resultCount !== undefined && (
              <IonItem lines="none">
                <IonIcon icon={searchOutline} slot="start" />
                <IonLabel>
                  <h3>Search Results</h3>
                  <p>{testResult.resultCount} results returned</p>
                </IonLabel>
              </IonItem>
            )}

            {testResult.error && (
              <IonItem lines="none">
                <IonLabel>
                  <h3 style={{ color: 'var(--ion-color-danger)' }}>Error Details</h3>
                  <p style={{ color: 'var(--ion-color-danger)' }}>{testResult.error}</p>
                </IonLabel>
              </IonItem>
            )}

            <IonItem lines="none">
              <IonLabel>
                <h3>Test Query</h3>
                <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  &quot;What is the capital of France?&quot;
                </p>
              </IonLabel>
            </IonItem>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default PerplexityTestComponent;

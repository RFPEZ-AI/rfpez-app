// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonSpinner, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { checkmarkCircle, closeCircle, warningOutline, timeOutline, planet } from 'ionicons/icons';

interface VoyageTestResult {
  available: boolean;
  status: string;
  responseTime: number;
  embeddingDimension?: number;
  error?: string;
}

const VoyageTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<VoyageTestResult | null>(null);

  const handleTestAPI = async () => {
    setIsLoading(true);
    setTestResult(null);
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/test-voyage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Test embedding generation for Voyage AI API'
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          available: true,
          status: 'API Available',
          responseTime,
          embeddingDimension: data.embedding?.length || 0
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
          <IonIcon icon={planet} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Voyage AI Embeddings Health Check
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Test the Voyage AI embeddings API connectivity and response time.</p>
        
        <IonButton 
          expand="block" 
          onClick={handleTestAPI} 
          disabled={isLoading}
          style={{ marginBottom: '16px' }}
        >
          {isLoading ? (
            <>
              <IonSpinner name="dots" style={{ marginRight: '8px' }} />
              Testing Voyage API...
            </>
          ) : (
            'Test Voyage API'
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

            {testResult.embeddingDimension !== undefined && (
              <IonItem lines="none">
                <IonIcon icon={planet} slot="start" />
                <IonLabel>
                  <h3>Embedding Dimensions</h3>
                  <p>{testResult.embeddingDimension} dimensions (expected: 1024)</p>
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
                <h3>Test Input</h3>
                <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  &quot;Test embedding generation for Voyage AI API&quot;
                </p>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonLabel>
                <h3>Model</h3>
                <p>voyage-2 (multilingual, 1024 dimensions)</p>
              </IonLabel>
            </IonItem>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default VoyageTestComponent;

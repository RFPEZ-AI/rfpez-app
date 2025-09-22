// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonSpinner, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle, warningOutline, timeOutline } from 'ionicons/icons';
import { testClaudeAPIAvailability } from '../utils/claudeAPITest';

interface APITestResult {
  available: boolean;
  status: string;
  responseTime: number;
  error?: string;
}

const ClaudeAPITestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<APITestResult | null>(null);

  const handleTestAPI = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testClaudeAPIAvailability();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        available: false,
        status: 'Test Failed',
        responseTime: 0,
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
    } else if (testResult.status === 'Overloaded') {
      return <IonIcon icon={warningOutline} color="warning" />;
    } else {
      return <IonIcon icon={closeCircle} color="danger" />;
    }
  };

  const getStatusColor = () => {
    if (!testResult) return undefined;
    
    if (testResult.available) {
      return 'success';
    } else if (testResult.status === 'Overloaded') {
      return 'warning';
    } else {
      return 'danger';
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Claude API Health Check</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonButton 
          expand="block" 
          onClick={handleTestAPI} 
          disabled={isLoading}
          style={{ marginBottom: '16px' }}
        >
          {isLoading ? (
            <>
              <IonSpinner name="dots" style={{ marginRight: '8px' }} />
              Testing API...
            </>
          ) : (
            'Test Claude API'
          )}
        </IonButton>

        {testResult && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              {getStatusIcon()}
              <IonText color={getStatusColor()} style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {testResult.status}
              </IonText>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <IonIcon icon={timeOutline} />
              <IonText style={{ marginLeft: '8px' }}>
                Response Time: {testResult.responseTime}ms
              </IonText>
            </div>

            {testResult.error && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--ion-color-danger-tint)', borderRadius: '4px' }}>
                <IonText color="danger">
                  <strong>Error:</strong> {testResult.error}
                </IonText>
              </div>
            )}

            {testResult.available && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--ion-color-success-tint)', borderRadius: '4px' }}>
                <IonText color="success">
                  ✅ Claude API is available and responding normally
                </IonText>
              </div>
            )}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ClaudeAPITestComponent;
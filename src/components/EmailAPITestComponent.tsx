// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge
} from '@ionic/react';
import { mailOutline, checkmarkCircle, closeCircle, refresh } from 'ionicons/icons';
import { useSupabase } from '../context/SupabaseContext';

interface EmailStatus {
  isConnected: boolean;
  email?: string;
  lastConnected?: string;
  tokenExpiry?: string;
}

interface TestResult {
  status: 'success' | 'error' | 'idle';
  message: string;
  responseTime?: number;
  timestamp?: string;
  details?: EmailStatus;
}

const EmailAPITestComponent: React.FC = () => {
  const { userProfile } = useSupabase();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>({
    status: 'idle',
    message: 'Click "Check Gmail Status" to test email API connection'
  });

  const checkGmailStatus = async () => {
    if (!userProfile) {
      setResult({
        status: 'error',
        message: 'User not authenticated. Please log in first.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setTesting(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:3001/api/gmail-oauth/status?user_id=${userProfile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        setResult({
          status: 'success',
          message: data.isConnected 
            ? `Gmail connected: ${data.email}` 
            : 'Gmail not connected. Please connect your Gmail account.',
          responseTime,
          timestamp: new Date().toISOString(),
          details: data
        });
      } else {
        setResult({
          status: 'error',
          message: `Error: ${data.error || response.statusText}`,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setResult({
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const connectGmail = () => {
    if (!userProfile) {
      alert('Please log in first');
      return;
    }
    // Redirect to Gmail OAuth flow
    window.location.href = `http://localhost:3001/api/gmail-oauth/initiate?user_id=${userProfile.id}`;
  };

  const clearResults = () => {
    setResult({
      status: 'idle',
      message: 'Click "Check Gmail Status" to test email API connection'
    });
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={mailOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Email API Test
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p style={{ marginBottom: '16px' }}>
          Test Gmail OAuth integration and email API status.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <IonButton 
            onClick={checkGmailStatus}
            disabled={testing || !userProfile}
            color="primary"
            size="small"
          >
            {testing ? <IonSpinner name="crescent" /> : 'Check Gmail Status'}
          </IonButton>
          
          <IonButton 
            onClick={connectGmail}
            disabled={!userProfile || (result.details?.isConnected === true)}
            fill="outline"
            color="secondary"
            size="small"
          >
            Connect Gmail
          </IonButton>

          {result.status !== 'idle' && (
            <IonButton 
              onClick={clearResults}
              fill="outline"
              color="medium"
              size="small"
            >
              <IonIcon icon={refresh} slot="start" />
              Clear
            </IonButton>
          )}
        </div>

        {!userProfile && (
          <IonItem color="warning" lines="none">
            <IonLabel className="ion-text-wrap">
              <strong>⚠️ Authentication Required</strong>
              <p>Please log in to test email API</p>
            </IonLabel>
          </IonItem>
        )}

        {result.status !== 'idle' && (
          <IonCard style={{ margin: '0', marginTop: '16px' }}>
            <IonCardContent>
              <div style={{ marginBottom: '12px' }}>
                <IonBadge 
                  color={result.status === 'success' ? 'success' : 'danger'}
                  style={{ marginBottom: '8px' }}
                >
                  {result.status === 'success' ? (
                    <>
                      <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px' }} />
                      SUCCESS
                    </>
                  ) : (
                    <>
                      <IonIcon icon={closeCircle} style={{ marginRight: '4px' }} />
                      ERROR
                    </>
                  )}
                </IonBadge>
              </div>

              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <h3>{result.message}</h3>
                  {result.responseTime && (
                    <p>Response Time: {result.responseTime}ms</p>
                  )}
                  {result.timestamp && (
                    <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  )}
                  
                  {result.details && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--ion-color-light)' }}>
                      <h4>Connection Details:</h4>
                      <p><strong>Status:</strong> {result.details.isConnected ? '🟢 Connected' : '🔴 Not Connected'}</p>
                      {result.details.email && (
                        <p><strong>Email:</strong> {result.details.email}</p>
                      )}
                      {result.details.lastConnected && (
                        <p><strong>Last Connected:</strong> {new Date(result.details.lastConnected).toLocaleString()}</p>
                      )}
                      {result.details.tokenExpiry && (
                        <p><strong>Token Expiry:</strong> {new Date(result.details.tokenExpiry).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: 'var(--ion-color-light)', 
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <strong>API Endpoint:</strong>
          <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
            GET http://localhost:3001/api/gmail-oauth/status
          </div>
          <div style={{ marginTop: '8px' }}>
            <strong>Expected Response:</strong>
            <pre style={{ 
              fontSize: '11px', 
              overflow: 'auto',
              backgroundColor: 'white',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '4px'
            }}>
{`{
  "isConnected": true,
  "email": "user@example.com",
  "lastConnected": "2025-02-13T...",
  "tokenExpiry": "2025-02-13T..."
}`}
            </pre>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default EmailAPITestComponent;

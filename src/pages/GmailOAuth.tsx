// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonInput, IonText, IonSpinner } from '@ionic/react';
import { useSupabase } from '../context/SupabaseContext';
import { initiateGmailOAuth } from '../services/gmailAuthService';

const GmailOAuth: React.FC = () => {
  const { user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('mskiba@esphere.com');
  const [testSubject, setTestSubject] = useState('Test from RFPEZ.AI');
  const [testBody, setTestBody] = useState('This is a test email from RFPEZ.AI Gmail integration.');

  useEffect(() => {
    checkExistingCredentials();
  }, [user]);

  const checkExistingCredentials = async () => {
    if (!user) return;
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase
        .from('user_email_credentials')
        .select('*')
        .eq('provider', 'gmail')
        .single();

      if (data && !error) {
        setCredentials(data);
        setMessage('✅ Gmail credentials found and active');
      }
    } catch (err) {
      console.log('No existing credentials found');
    }
  };

  const handleConnectGmail = async () => {
    if (!user) {
      setMessage('❌ Please log in first');
      return;
    }

    setLoading(true);
    setMessage('Initiating OAuth flow...');

    try {
      await initiateGmailOAuth(user.id);
      setMessage('Redirecting to Google...');
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!credentials) {
      setMessage('❌ Please connect Gmail first');
      return;
    }

    setLoading(true);
    setMessage('Sending test email...');

    try {
      // Call your edge function to send email
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/claude-api-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Send an email to ${testEmail} with subject "${testSubject}" and message "${testBody}"`
          }],
          sessionId: 'test-session',
          userId: user?.id
        })
      });

      if (response.ok) {
        setMessage('✅ Test email sent successfully!');
      } else {
        const error = await response.text();
        setMessage(`❌ Failed to send: ${error}`);
      }
    } catch (error) {
      console.error('Test email failed:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Gmail OAuth Integration</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {!user ? (
              <IonText color="warning">
                <p>Please log in to connect your Gmail account.</p>
              </IonText>
            ) : (
              <>
                <IonText>
                  <p><strong>User:</strong> {user.email}</p>
                  <p><strong>Status:</strong> {credentials ? '✅ Connected' : '❌ Not connected'}</p>
                </IonText>

                {!credentials && (
                  <IonButton 
                    expand="block" 
                    onClick={handleConnectGmail}
                    disabled={loading}
                  >
                    {loading ? <IonSpinner /> : 'Connect Gmail Account'}
                  </IonButton>
                )}

                {credentials && (
                  <>
                    <IonText color="success">
                      <h3>Gmail Connected Successfully!</h3>
                      <p>Email: {credentials.email_address}</p>
                      <p>Token expires: {new Date(credentials.token_expiry).toLocaleString()}</p>
                    </IonText>

                    <h3>Test Email Sending</h3>
                    <IonItem>
                      <IonLabel position="stacked">To:</IonLabel>
                      <IonInput 
                        value={testEmail} 
                        onIonChange={e => setTestEmail(e.detail.value || '')}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Subject:</IonLabel>
                      <IonInput 
                        value={testSubject} 
                        onIonChange={e => setTestSubject(e.detail.value || '')}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Message:</IonLabel>
                      <IonInput 
                        value={testBody} 
                        onIonChange={e => setTestBody(e.detail.value || '')}
                      />
                    </IonItem>
                    <IonButton 
                      expand="block" 
                      onClick={handleTestEmail}
                      disabled={loading}
                      style={{ marginTop: '20px' }}
                    >
                      {loading ? <IonSpinner /> : 'Send Test Email'}
                    </IonButton>
                  </>
                )}

                {message && (
                  <IonText color={message.includes('❌') ? 'danger' : 'success'}>
                    <p style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                      {message}
                    </p>
                  </IonText>
                )}
              </>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default GmailOAuth;

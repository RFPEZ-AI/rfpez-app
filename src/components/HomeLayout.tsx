// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useHome } from '../components/HomeProvider';

/**
 * Simple layout component demonstrating the refactored architecture
 * Uses the HomeProvider context for all state management
 */
export const HomeLayout: React.FC = () => {
  const {
    // State
    sessionId,
    currentRfp,
    sessionActiveAgent,
    messages,
    isLoading,
    error,
    
    // Handlers
    handleCreateSession,
    addSystemMessage
  } = useHome();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '1rem',
          borderBottom: '1px solid var(--ion-color-light-shade)',
          marginBottom: '1rem'
        }}>
          <h1>RFPEZ.AI - Refactored Architecture</h1>
          {sessionActiveAgent && (
            <div style={{ marginLeft: 'auto' }}>
              Current Agent: {sessionActiveAgent.agent_name}
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div style={{ 
            color: 'var(--ion-color-danger)', 
            padding: '1rem',
            marginBottom: '1rem',
            background: 'var(--ion-color-danger-tint)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}
        
        {/* Main Content */}
        {sessionId ? (
          <div>
            <h2>Session: {sessionId}</h2>
            {currentRfp && (
              <div style={{ 
                padding: '1rem',
                background: 'var(--ion-color-primary-tint)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <strong>Current RFP:</strong> {currentRfp.name}
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Messages:</strong> {messages.length}
              {isLoading && <span> (Loading...)</span>}
            </div>
            
            {/* TODO: Replace with actual SessionDialog component */}
            <div style={{ 
              border: '1px solid var(--ion-color-light-shade)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <p>SessionDialog component would be rendered here</p>
              <IonButton onClick={() => addSystemMessage('Test message from refactored architecture!')}>
                Test System Message
              </IonButton>
            </div>
          </div>
        ) : (
          /* Welcome Screen */
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem'
          }}>
            <h2>Welcome to RFPEZ.AI (Refactored)</h2>
            <p>This demonstrates the new component architecture with extracted services.</p>
            <p>The original 1,826-line Home.tsx has been broken down into:</p>
            <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <li>HomeProvider (Context & State Management)</li>
              <li>ArtifactService (Business Logic)</li>
              <li>HomeMessageService (Message Handling)</li>
              <li>HomeSessionService (Session Management)</li>
              <li>DebugContext (Debug Utilities)</li>
            </ul>
            <br />
            <IonButton 
              expand="block" 
              size="large"
              onClick={() => handleCreateSession('Demo Session')}
            >
              Create Demo Session
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};
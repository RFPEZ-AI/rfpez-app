// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonSpinner } from '@ionic/react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-screen loading indicator displayed during app initialization
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--ion-background-color, #ffffff)',
      zIndex: 10000
    }}>
      <IonSpinner 
        name="crescent" 
        style={{ 
          width: '48px', 
          height: '48px',
          color: 'var(--ion-color-primary, #3880ff)'
        }} 
      />
      <div style={{
        marginTop: '16px',
        fontSize: '16px',
        color: 'var(--ion-color-medium, #666)',
        fontWeight: 500
      }}>
        {message}
      </div>
    </div>
  );
};

export default LoadingScreen;

// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { RFP } from '../types/rfp';

interface HomeFooterProps {
  currentRfp: RFP | null;
}

const HomeFooter: React.FC<HomeFooterProps> = ({ currentRfp }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '8px 16px',
      backgroundColor: 'var(--ion-color-light)',
      borderTop: '1px solid var(--ion-color-medium)',
      fontSize: '14px',
      color: 'var(--ion-color-dark)',
      textAlign: 'left',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      <span>
        Current RFP: {currentRfp ? currentRfp.name : 'none'}
      </span>
    </div>
  );
};

export default HomeFooter;

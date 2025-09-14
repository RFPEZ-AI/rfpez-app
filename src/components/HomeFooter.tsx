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
      backgroundColor: '#f8f9fa', // Fallback color instead of CSS variable
      borderTop: '1px solid #d4d4d8', // Fallback color instead of CSS variable
      fontSize: '14px',
      color: '#374151', // Fallback color instead of CSS variable
      textAlign: 'left',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      zIndex: 9999, // Higher z-index to ensure it's visible
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)' // Add shadow for better visibility
    }}>
      <span>
        Current RFP: {currentRfp ? currentRfp.name : 'none'}
      </span>
    </div>
  );
};

export default HomeFooter;

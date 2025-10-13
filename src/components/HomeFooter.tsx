// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonSelect, IonSelectOption } from '@ionic/react';
import { RFP } from '../types/rfp';
import { RFPService } from '../services/rfpService';

interface HomeFooterProps {
  currentRfp: RFP | null;
  onViewBids?: () => void;
  onRfpChange?: (rfpId: number) => void; // Prop for handling RFP selection
  bidCount?: number; // Number of bids for current RFP
  debugUI?: React.ReactNode; // Debug UI component to render
}

const HomeFooter: React.FC<HomeFooterProps> = ({ 
  currentRfp, 
  onViewBids, 
  onRfpChange,
  bidCount = 0,
  debugUI
}) => {
  // Add styles to constrain the IonSelect height
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .footer-select {
        --height: 28px !important;
        height: 28px !important;
        max-height: 28px !important;
        min-height: 28px !important;
      }
      .footer-select .select-text {
        padding: 4px 8px !important;
        line-height: 20px !important;
        font-size: 14px !important;
      }
      .footer-select .select-icon {
        height: 20px !important;
        width: 20px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [allRfps, setAllRfps] = useState<RFP[]>([]);
  const [isLoadingRfps, setIsLoadingRfps] = useState(false);

  // Load all RFPs for the account
  useEffect(() => {
    const loadAllRfps = async () => {
      try {
        setIsLoadingRfps(true);
        const rfps = await RFPService.getAll();
        setAllRfps(rfps || []);
      } catch (error) {
        console.error('Failed to load RFPs for dropdown:', error);
        setAllRfps([]);
      } finally {
        setIsLoadingRfps(false);
      }
    };

    loadAllRfps();
  }, []);

  const handleRfpSelection = (selectedRfpId: string) => {
    if (selectedRfpId && onRfpChange) {
      onRfpChange(parseInt(selectedRfpId));
    }
  };
  return (
    <div
      data-testid="rfp-context-footer"
      style={{
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
      justifyContent: 'space-between', // Changed to space-between to accommodate the button
      zIndex: 9999, // Higher z-index to ensure it's visible
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)' // Add shadow for better visibility
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        height: '100%' // Ensure container takes full height
      }}>
        <span style={{ 
          lineHeight: '28px', 
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          height: '28px'
        }}>RFP:</span>
        <div style={{ 
          height: '28px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <IonSelect
            value={currentRfp?.id || ''}
            placeholder="Select RFP..."
            onIonChange={(e) => handleRfpSelection(e.detail.value)}
            disabled={isLoadingRfps}
            interface="popover"
            className="footer-select"
            style={{
              '--min-width': '200px',
              '--max-width': '300px',
              fontSize: '14px',
              height: '28px',
              maxHeight: '28px',
              overflow: 'hidden'
            }}
            data-testid="current-rfp-dropdown"
          >
            {allRfps.map((rfp) => (
              <IonSelectOption key={rfp.id} value={rfp.id}>
                {rfp.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </div>
      </div>
      
      {/* Right side buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Debug UI - positioned left of Bids button */}
        {debugUI}
        
        {/* Show bids button when RFP is selected */}
        {currentRfp && onViewBids && (
          <div style={{ position: 'relative' }}>
            <IonButton 
              size="small" 
              fill="outline" 
              color="success"
              onClick={onViewBids}
              style={{ 
                '--height': '28px',
                '--padding-start': '8px',
                '--padding-end': '8px',
                fontSize: '12px'
              }}
            >
              Bids
            </IonButton>
            
            {/* Badge showing bid count - similar to artifact count */}
            {bidCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#2dd36f', // Green color for bids
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {bidCount > 99 ? '99+' : bidCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeFooter;

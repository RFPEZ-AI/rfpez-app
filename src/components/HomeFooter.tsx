// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonSelect, IonSelectOption } from '@ionic/react';
import { RFP } from '../types/rfp';
import { RFPService } from '../services/rfpService';

interface HomeFooterProps {
  currentRfp: RFP | null;
  onViewBids?: () => void;
  onClearRfpContext?: () => void;
  onRfpChange?: (rfpId: number) => void; // Prop for handling RFP selection
}

const HomeFooter: React.FC<HomeFooterProps> = ({ 
  currentRfp, 
  onViewBids, 
  onClearRfpContext, 
  onRfpChange
}) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Current RFP:</span>
        <IonSelect
          value={currentRfp?.id || ''}
          placeholder="Select RFP..."
          onIonChange={(e) => handleRfpSelection(e.detail.value)}
          disabled={isLoadingRfps}
          interface="popover"
          style={{
            '--min-width': '200px',
            '--max-width': '300px',
            fontSize: '14px',
            border: '1px solid #d4d4d8',
            borderRadius: '4px',
            backgroundColor: 'white'
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
      
      {/* Right side buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Show clear button when RFP is selected */}
        {currentRfp && onClearRfpContext && (
          <IonButton 
            size="small" 
            fill="clear" 
            color="medium"
            onClick={onClearRfpContext}
            style={{ 
              '--height': '28px',
              '--padding-start': '4px',
              '--padding-end': '4px',
              fontSize: '12px'
            }}
            title="Clear current RFP (new sessions will have no RFP context)"
          >
            Clear
          </IonButton>
        )}
        
        {/* Show bids button when RFP is selected */}
        {currentRfp && onViewBids && (
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
        )}
      </div>
    </div>
  );
};

export default HomeFooter;

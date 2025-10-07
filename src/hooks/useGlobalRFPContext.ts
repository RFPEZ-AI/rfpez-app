// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect, useCallback } from 'react';
import { RFP } from '../types/rfp';
import { RFPService } from '../services/rfpService';

/**
 * Global RFP context hook that manages the current RFP across the entire application.
 * This RFP context is inherited by new sessions and persists across browser sessions.
 */
export const useGlobalRFPContext = () => {
  const [currentRfpId, setCurrentRfpId] = useState<number | null>(null);
  const [currentRfp, setCurrentRfp] = useState<RFP | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Persist RFP context to localStorage
  const persistRFPContext = useCallback((rfpId: number | null, rfp: RFP | null) => {
    try {
      if (rfpId && rfp) {
        localStorage.setItem('rfpez-global-rfp-context', JSON.stringify({
          rfpId,
          rfp,
          timestamp: new Date().toISOString()
        }));
        console.log('🌐 Global RFP context persisted:', rfp.name, rfpId);
      } else {
        localStorage.removeItem('rfpez-global-rfp-context');
        console.log('🌐 Global RFP context cleared from storage');
      }
    } catch (error) {
      console.warn('⚠️ Failed to persist global RFP context:', error);
    }
  }, []);

  // Load persisted RFP context on mount
  useEffect(() => {
    const loadPersistedContext = async () => {
      try {
        const stored = localStorage.getItem('rfpez-global-rfp-context');
        if (stored) {
          const parsed = JSON.parse(stored);
          const { rfpId, rfp, timestamp } = parsed;
          
          // Check if stored context is recent (within 30 days)
          const storedDate = new Date(timestamp);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (storedDate > thirtyDaysAgo && rfpId && rfp) {
            console.log('🌐 Restoring global RFP context:', rfp.name, rfpId);
            setCurrentRfpId(rfpId);
            setCurrentRfp(rfp);
            
            // Validate that the RFP still exists in the database
            try {
              const validatedRfp = await RFPService.getById(rfpId);
              if (!validatedRfp) {
                console.warn('⚠️ Stored RFP no longer exists, clearing context');
                clearGlobalRFPContext();
              } else if (validatedRfp.updated_at !== rfp.updated_at) {
                console.log('🔄 RFP updated, refreshing global context');
                setCurrentRfp(validatedRfp);
                persistRFPContext(rfpId, validatedRfp);
              }
            } catch (error) {
              console.warn('⚠️ Failed to validate stored RFP, clearing context:', error);
              clearGlobalRFPContext();
            }
          } else {
            console.log('🌐 Stored RFP context is stale, clearing');
            localStorage.removeItem('rfpez-global-rfp-context');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load persisted RFP context:', error);
        localStorage.removeItem('rfpez-global-rfp-context');
      }
    };

    loadPersistedContext();
  }, [persistRFPContext]);

  // Set global RFP context
  const setGlobalRFPContext = useCallback(async (rfpId: number, rfpData?: RFP) => {
    console.log('🌐 Setting global RFP context:', rfpId, rfpData?.name);
    setIsLoading(true);
    
    try {
      let rfp: RFP | null = null;
      
      if (rfpData) {
        // Use provided RFP data directly
        rfp = rfpData;
      } else {
        // Fetch RFP data from service
        rfp = await RFPService.getById(rfpId);
      }
      
      if (rfp) {
        setCurrentRfpId(rfpId);
        setCurrentRfp(rfp);
        persistRFPContext(rfpId, rfp);
        console.log('✅ Global RFP context set:', rfp.name, rfpId);
      } else {
        console.error('❌ Failed to set global RFP context - RFP not found:', rfpId);
      }
    } catch (error) {
      console.error('❌ Error setting global RFP context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [persistRFPContext]);

  // Clear global RFP context
  const clearGlobalRFPContext = useCallback(() => {
    console.log('🌐 Clearing global RFP context');
    setCurrentRfpId(null);
    setCurrentRfp(null);
    persistRFPContext(null, null);
  }, [persistRFPContext]);

  // Get global RFP context for new sessions
  const getGlobalRFPContext = useCallback(() => {
    return {
      rfpId: currentRfpId,
      rfp: currentRfp
    };
  }, [currentRfpId, currentRfp]);

  // Update global RFP context when RFP is modified externally
  const refreshGlobalRFPContext = useCallback(async () => {
    if (currentRfpId) {
      console.log('🔄 Refreshing global RFP context for ID:', currentRfpId);
      await setGlobalRFPContext(currentRfpId);
    }
  }, [currentRfpId, setGlobalRFPContext]);

  return {
    currentRfpId,
    currentRfp,
    isLoading,
    setGlobalRFPContext,
    clearGlobalRFPContext,
    getGlobalRFPContext,
    refreshGlobalRFPContext
  };
};
// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useCallback } from 'react';
import { RFP } from '../types/rfp';
import { RFPService } from '../services/rfpService';

/**
 * Session-scoped RFP context hook.
 * 
 * RFP context is tied to the active session:
 * - Loaded from session's current_rfp_id when selecting a session
 * - Cleared when starting a new session
 * - NOT persisted to localStorage (sessions are the source of truth)
 * 
 * This ensures each specialty site has isolated RFP context based on
 * which session is active, with no bleed-through between specialties.
 */
export const useGlobalRFPContext = () => {
  const [currentRfpId, setCurrentRfpId] = useState<number | null>(null);
  const [currentRfp, setCurrentRfp] = useState<RFP | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set RFP context (called when loading a session with an RFP)
  const setGlobalRFPContext = useCallback(async (rfpId: number, rfpData?: RFP) => {
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
        console.log('✅ RFP context set from session:', rfp.name, 'ID:', rfpId);
      } else {
        console.error('❌ Failed to set RFP context - RFP not found:', rfpId);
      }
    } catch (error) {
      console.error('❌ Error setting RFP context:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear RFP context (called when starting a new session)
  const clearGlobalRFPContext = useCallback(() => {
    setCurrentRfpId(null);
    setCurrentRfp(null);
    console.log('🧹 RFP context cleared for new session');
  }, []);

  // Get current RFP context (used for inheriting RFP in new sessions)
  const getGlobalRFPContext = useCallback(() => {
    return {
      rfpId: currentRfpId,
      rfp: currentRfp
    };
  }, [currentRfpId, currentRfp]);

  // Refresh RFP context (reload current RFP from database)
  const refreshGlobalRFPContext = useCallback(async () => {
    if (currentRfpId) {
      console.log('🔄 Refreshing RFP context for ID:', currentRfpId);
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
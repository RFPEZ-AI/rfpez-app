// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { RFP } from '../types/rfp';
import { RFPFormValues } from '../components/RFPEditModal';
import { RFPService } from '../services/rfpService';
import DatabaseService from '../services/database';

export interface RFPManagementOptions {
  currentSessionId?: string;
  globalCurrentRfpId?: number | null;
  globalCurrentRfp?: RFP | null;
  setGlobalRFPContext?: (rfpId: number, rfpData?: RFP) => Promise<void>;
  clearGlobalRFPContext?: () => void;
}

export const useRFPManagement = (
  currentSessionId?: string,
  globalCurrentRfpId?: number | null,
  globalCurrentRfp?: RFP | null,
  setGlobalRFPContext?: (rfpId: number, rfpData?: RFP) => Promise<void>,
  clearGlobalRFPContext?: () => void
) => {
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [showRFPMenu, setShowRFPMenu] = useState(false);
  const [showRFPModal, setShowRFPModal] = useState(false);
  const [showRFPPreviewModal, setShowRFPPreviewModal] = useState(false);
  const [editingRFP, setEditingRFP] = useState<RFP | null>(null);
  const [previewingRFP, setPreviewingRFP] = useState<RFP | null>(null);
  
  // Session-specific RFP context (can override global context for individual sessions)
  const [sessionRfpId, setSessionRfpId] = useState<number | null>(null);
  const [sessionRfp, setSessionRfp] = useState<RFP | null>(null);
  
  // Computed current RFP: session-specific overrides global
  const currentRfpId = sessionRfpId || globalCurrentRfpId;
  const currentRfp = sessionRfp || globalCurrentRfp;

  // Load data for menus
  useEffect(() => { 
    RFPService.getAll().then(setRFPs); 
  }, []);

  // Note: RFP context clearing removed - session restoration in handleSelectSession 
  // now properly handles setting the correct RFP context for each session.
  // The previous automatic clearing was interfering with session RFP restoration.

  const handleNewRFP = () => { 
    setEditingRFP(null); 
    setShowRFPModal(true); 
  };

  const handleEditRFP = (rfp: RFP) => { 
    setEditingRFP(rfp); 
    setShowRFPModal(true); 
  };

  const handlePreviewRFP = (rfp: RFP) => { 
    setPreviewingRFP(rfp); 
    setShowRFPPreviewModal(true); 
  };

  const handleShareRFP = async (rfp: RFP) => {
    const formUrl = `${window.location.origin}/rfp/${rfp.id}/bid`;
    try {
      await navigator.clipboard.writeText(formUrl);
      console.log('RFP bid form URL copied to clipboard:', formUrl);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert(`RFP Bid Form URL: ${formUrl}`);
    }
  };

  const handleDeleteRFP = async (rfp: RFP) => { 
    await RFPService.delete(rfp.id); 
    setRFPs(await RFPService.getAll()); 
  };

  const handleSaveRFP = async (formData: Partial<RFPFormValues>) => {
    try {
      console.log('💾 Saving RFP with form data:', formData);
      
      // Convert form field names to database field names
      const rfpData: Partial<RFP> = {
        name: formData.name,
        due_date: formData.due_date,
        description: formData.description || 'No description provided',
        specification: formData.specification || 'No specification provided',
        bid_form_questionaire: formData.form_spec, // Convert form_spec to bid_form_questionaire
        is_template: formData.is_template,
        is_public: formData.is_public,
        suppliers: formData.suppliers
      };
      
      console.log('💾 Converted RFP data for database:', rfpData);
      
      let result: RFP | null = null;
      if (editingRFP && editingRFP.id) {
        result = await RFPService.update(editingRFP.id, rfpData);
      } else {
        result = await RFPService.create(rfpData);
      }
      
      if (result) {
        console.log('✅ RFP saved successfully');
        setRFPs(await RFPService.getAll());
        setShowRFPModal(false);
      } else {
        console.error('❌ Failed to save RFP - service returned null');
        alert('Failed to save RFP. Please check the console for details and ensure all required fields are filled.');
      }
    } catch (error) {
      console.error('❌ Error saving RFP:', error);
      alert('An error occurred while saving the RFP. Please try again.');
    }
  };

  const handleCancelRFP = () => setShowRFPModal(false);
  const handleClosePreview = () => setShowRFPPreviewModal(false);
  
  const handleSetCurrentRfp = async (rfpId: number, rfpData?: RFP, setAsGlobal = false, isUserInitiated = false) => {
    console.log('🎯 DEBUG: handleSetCurrentRfp called with rfpId:', rfpId, 'rfpData provided:', !!rfpData, 'setAsGlobal:', setAsGlobal, 'isUserInitiated:', isUserInitiated);
    console.log('🎯 Current state before change:', {
      currentRfpId,
      currentRfpName: currentRfp?.name,
      sessionRfpId,
      globalRfpId: globalCurrentRfpId
    });
    
    try {
      let rfp: RFP | null = null;
      
      if (rfpData) {
        // Use provided RFP data directly to avoid database timing issues
        console.log('📦 DEBUG: Using provided RFP data directly:', rfpData.name);
        rfp = rfpData;
      } else {
        // Fallback to database query
        console.log('🔍 DEBUG: Calling RFPService.getById with id:', rfpId);
        rfp = await RFPService.getById(rfpId);
        console.log('📦 DEBUG: RFPService.getById returned:', rfp);
      }
      
      if (rfp) {
        console.log('✅ DEBUG: RFP found, setting context - rfp.name:', rfp.name, 'rfp.id:', rfp.id);
        
        if (setAsGlobal && setGlobalRFPContext) {
          // Set as global RFP context
          await setGlobalRFPContext(rfpId, rfp);
          console.log('🌐 Global RFP context set:', rfp.name, rfpId);
          console.log('🌐 New global state should be:', {
            globalCurrentRfpId: rfpId,
            globalCurrentRfpName: rfp.name
          });
        } else {
          // Set as session-specific RFP context
          setSessionRfpId(rfpId);
          setSessionRfp(rfp);
          console.log('📍 Session RFP context set:', rfp.name, rfpId);
          console.log('📍 New session state should be:', {
            sessionRfpId: rfpId,
            sessionRfpName: rfp.name
          });
        }

        // Update session context if we have an active session
        if (currentSessionId) {
          try {
            await DatabaseService.updateSessionContext(currentSessionId, { 
              current_rfp_id: rfpId 
            });
            console.log('✅ RFP context saved to session:', currentSessionId, rfpId);

            // Update session title with RFP name
            if (rfp.name) {
              try {
                const { generateSessionTitleFromRfp } = await import('../utils/sessionTitleUtils');
                const newTitle = generateSessionTitleFromRfp(rfp.name);
                await DatabaseService.updateSession(currentSessionId, { title: newTitle });
                console.log('🏷️ Updated session title from RFP name:', newTitle);
              } catch (titleError) {
                console.warn('⚠️ Failed to update session title from RFP name:', titleError);
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to save RFP context to session:', error);
          }
        }

        // Notify agent about RFP context change - DISABLED
        // System notification messages appearing as user messages have been removed
        // if (onRfpContextChanged && shouldSendRFPContextChangePrompt(hasMessagesInCurrentSession || false, isUserInitiated)) {
        //   const notificationPrompt = generateRFPContextChangePrompt(rfp, previousRfp || null, hasMessagesInCurrentSession || false);
        //   console.log('📢 Sending RFP context change notification to agent');
        //   onRfpContextChanged(notificationPrompt);
        // }
      } else {
        console.log('❌ DEBUG: RFP not found for id:', rfpId, '- RFPService.getById returned null/undefined');
      }
    } catch (error) {
      console.error('❌ DEBUG: handleSetCurrentRfp failed for rfpId:', rfpId, 'error:', error);
      console.error('Failed to load RFP for context:', error);
    }
  };
  
  const handleClearCurrentRfp = async (clearGlobal = false) => {
    if (clearGlobal && clearGlobalRFPContext) {
      // Clear global RFP context
      clearGlobalRFPContext();
      console.log('🌐 Global RFP context cleared');
    } else {
      // Clear session-specific RFP context
      setSessionRfpId(null);
      setSessionRfp(null);
      console.log('📍 Session RFP context cleared');
    }

    // Clear RFP context from session if we have an active session
    if (currentSessionId) {
      try {
        await DatabaseService.updateSessionContext(currentSessionId, { 
          current_rfp_id: null 
        });
        console.log('✅ RFP context cleared from session:', currentSessionId);
      } catch (error) {
        console.warn('⚠️ Failed to clear RFP context from session:', error);
      }
    }
  };

  return {
    rfps,
    setRFPs,
    showRFPMenu,
    setShowRFPMenu,
    showRFPModal,
    setShowRFPModal,
    showRFPPreviewModal,
    setShowRFPPreviewModal,
    editingRFP,
    setEditingRFP,
    previewingRFP,
    setPreviewingRFP,
    currentRfpId,
    currentRfp,
    sessionRfpId,
    sessionRfp,
    handleNewRFP,
    handleEditRFP,
    handlePreviewRFP,
    handleShareRFP,
    handleDeleteRFP,
    handleSaveRFP,
    handleCancelRFP,
    handleClosePreview,
    handleSetCurrentRfp,
    handleClearCurrentRfp
  };
};

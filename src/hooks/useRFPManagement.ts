// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { RFP } from '../types/rfp';
import { RFPFormValues } from '../components/RFPEditModal';
import { RFPService } from '../services/rfpService';
import DatabaseService from '../services/database';

export const useRFPManagement = (currentSessionId?: string) => {
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [showRFPMenu, setShowRFPMenu] = useState(false);
  const [showRFPModal, setShowRFPModal] = useState(false);
  const [showRFPPreviewModal, setShowRFPPreviewModal] = useState(false);
  const [editingRFP, setEditingRFP] = useState<RFP | null>(null);
  const [previewingRFP, setPreviewingRFP] = useState<RFP | null>(null);
  const [currentRfpId, setCurrentRfpId] = useState<number | null>(null);
  const [currentRfp, setCurrentRfp] = useState<RFP | null>(null);

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
  
  const handleSetCurrentRfp = async (rfpId: number, rfpData?: RFP) => {
    console.log('🎯 DEBUG: handleSetCurrentRfp called with rfpId:', rfpId, 'rfpData provided:', !!rfpData);
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
        console.log('✅ DEBUG: RFP found, setting state - rfp.name:', rfp.name, 'rfp.id:', rfp.id);
        setCurrentRfpId(rfpId);
        setCurrentRfp(rfp);
        console.log('Current RFP context set:', rfp.name, rfpId);

        // Update session context if we have an active session
        if (currentSessionId) {
          try {
            await DatabaseService.updateSessionContext(currentSessionId, { 
              current_rfp_id: rfpId 
            });
            console.log('✅ RFP context saved to session:', currentSessionId, rfpId);
          } catch (error) {
            console.warn('⚠️ Failed to save RFP context to session:', error);
          }
        }
      } else {
        console.log('❌ DEBUG: RFP not found for id:', rfpId, '- RFPService.getById returned null/undefined');
      }
    } catch (error) {
      console.error('❌ DEBUG: handleSetCurrentRfp failed for rfpId:', rfpId, 'error:', error);
      console.error('Failed to load RFP for context:', error);
    }
  };
  
  const handleClearCurrentRfp = async () => {
    setCurrentRfpId(null);
    setCurrentRfp(null);
    console.log('Current RFP context cleared');

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
    setCurrentRfpId,
    currentRfp,
    setCurrentRfp,
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

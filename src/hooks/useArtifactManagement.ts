// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Artifact } from '../types/home';
import { RFP } from '../types/rfp';
import DatabaseService from '../services/database';

export const useArtifactManagement = (currentRfp: RFP | null, currentSessionId?: string, isAuthenticated?: boolean, user?: User | null) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Load RFP-related artifacts when RFP context changes
  useEffect(() => {
    console.log('=== RFP CONTEXT CHANGED - LOADING ARTIFACTS ===');
    
    if (currentRfp) {
      console.log('Current RFP data:', currentRfp);
      
      // Get existing artifacts that are NOT from database (preserve Claude-generated ones)
      const existingClaudeArtifacts = artifacts.filter(artifact => 
        !artifact.id.startsWith('buyer-form-') && 
        !artifact.id.startsWith('bid-form-') &&
        !artifact.id.startsWith('proposal-')
      );
      console.log('Preserving existing Claude artifacts:', existingClaudeArtifacts);
      
      const newArtifacts: Artifact[] = [...existingClaudeArtifacts];
    
      // Load buyer questionnaire if exists
      if (currentRfp.buyer_questionnaire) {
        console.log('🟢 Loading buyer questionnaire from RFP database');
        try {
          const formData = typeof currentRfp.buyer_questionnaire === 'string' 
            ? JSON.parse(currentRfp.buyer_questionnaire)
            : currentRfp.buyer_questionnaire;
            
          const buyerFormArtifact: Artifact = {
            id: `buyer-form-${currentRfp.id}`,
            name: 'Buyer Questionnaire',
            type: 'form',
            size: 'Interactive Form',
            content: JSON.stringify(formData)
          };
          
          newArtifacts.push(buyerFormArtifact);
          console.log('✅ Added buyer questionnaire artifact:', buyerFormArtifact);
        } catch (e) {
          console.error('❌ Failed to parse buyer questionnaire JSON:', e);
        }
      }
      
      // Load bid form questionnaire if exists
      if (currentRfp.bid_form_questionaire) {
        console.log('🟢 Loading bid form questionnaire from RFP database');
        try {
          const formData = typeof currentRfp.bid_form_questionaire === 'string'
            ? JSON.parse(currentRfp.bid_form_questionaire)
            : currentRfp.bid_form_questionaire;
            
          const bidFormArtifact: Artifact = {
            id: `bid-form-${currentRfp.id}`,
            name: 'Supplier Bid Form',
            type: 'form', 
            size: 'Interactive Form',
            content: JSON.stringify(formData)
          };
          
          newArtifacts.push(bidFormArtifact);
          console.log('✅ Added bid form questionnaire artifact:', bidFormArtifact);
        } catch (e) {
          console.error('❌ Failed to parse bid form questionnaire JSON:', e);
        }
      }
      
      // Load proposal content if exists
      if (currentRfp.proposal) {
        console.log('🟢 Loading proposal content from RFP database');
        const proposalArtifact: Artifact = {
          id: `proposal-${currentRfp.id}`,
          name: 'RFP Proposal',
          type: 'document',
          size: 'Generated Content',
          content: currentRfp.proposal
        };
        
        newArtifacts.push(proposalArtifact);
        console.log('✅ Added proposal artifact:', proposalArtifact);
      }
    
      setArtifacts(newArtifacts);
      console.log(`🎉 Total artifacts after RFP load: ${newArtifacts.length}`);
      
    } else {
      // No current RFP, only keep Claude-generated artifacts
      const claudeArtifacts = artifacts.filter(artifact => 
        artifact.id.includes('claude-artifact')
      );
      setArtifacts(claudeArtifacts);
      console.log('🧹 Cleared database artifacts - kept Claude artifacts');
    }
  }, [currentRfp]);

  // Load session artifacts when session changes
  const loadSessionArtifacts = async (sessionId: string) => {
    try {
      const artifactsData = await DatabaseService.getSessionArtifacts(sessionId);
      const formattedArtifacts: Artifact[] = artifactsData.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.file_type as 'document' | 'image' | 'pdf' | 'other',
        size: artifact.file_size ? `${(artifact.file_size / 1024).toFixed(1)} KB` : 'Unknown'
      }));
      
      // Merge with existing artifacts, avoiding duplicates
      setArtifacts(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const newArtifacts = formattedArtifacts.filter(a => !existingIds.has(a.id));
        return [...prev, ...newArtifacts];
      });
    } catch (error) {
      console.error('Failed to load session artifacts:', error);
    }
  };

  const handleAttachFile = async (file: File) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : 'document',
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
    setArtifacts(prev => [...prev, newArtifact]);

    // Save to Supabase if authenticated and session exists
    if (isAuthenticated && user && currentSessionId) {
      try {
        const storagePath = await DatabaseService.uploadFile(file, currentSessionId);
        if (storagePath) {
          await DatabaseService.addArtifact(
            currentSessionId,
            null,
            file.name,
            file.type.includes('pdf') ? 'pdf' : 'document',
            file.size,
            storagePath,
            file.type
          );
        }
      } catch (error) {
        console.error('Failed to save artifact:', error);
      }
    }
  };

  const addClaudeArtifacts = (claudeMetadata: Record<string, unknown>) => {
    console.log('=== CLAUDE RESPONSE DEBUG ===');
    console.log('Response has metadata:', !!claudeMetadata);
    console.log('Metadata keys:', Object.keys(claudeMetadata || {}));
    console.log('Has buyer_questionnaire in metadata:', !!claudeMetadata?.buyer_questionnaire);
    
    const metadata = claudeMetadata as Record<string, unknown>;
    
    // Handle buyer questionnaire form
    if (metadata.buyer_questionnaire) {
      console.log('Buyer questionnaire detected:', metadata.buyer_questionnaire);
      
      const formArtifact: Artifact = {
        id: `buyer-form-${Date.now()}`,
        name: 'Buyer Questionnaire',
        type: 'form',
        size: 'Interactive Form',
        content: JSON.stringify(metadata.buyer_questionnaire)
      };
      
      setArtifacts(prev => [...prev, formArtifact]);
      console.log('Added buyer questionnaire to artifacts:', formArtifact);
    }

    // Handle any other artifacts from Claude response
    if (metadata.artifacts && Array.isArray(metadata.artifacts)) {
      console.log('Additional artifacts detected:', metadata.artifacts);
      
      interface ArtifactData {
        name?: string;
        type?: string;
        size?: string;
        content?: string;
        url?: string;
      }
      
      const newArtifacts: Artifact[] = (metadata.artifacts as ArtifactData[]).map((artifact, index) => ({
        id: `claude-artifact-${Date.now()}-${index}`,
        name: artifact.name || `Generated Artifact ${index + 1}`,
        type: artifact.type as 'document' | 'image' | 'pdf' | 'other' || 'document',
        size: artifact.size || 'Generated',
        content: artifact.content,
        url: artifact.url
      }));
      
      setArtifacts(prev => [...prev, ...newArtifacts]);
      console.log('Added Claude artifacts:', newArtifacts);
    }
  };

  const clearArtifacts = () => {
    setArtifacts([]);
  };

  return {
    artifacts,
    setArtifacts,
    loadSessionArtifacts,
    handleAttachFile,
    addClaudeArtifacts,
    clearArtifacts
  };
};

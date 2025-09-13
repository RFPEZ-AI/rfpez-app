// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Artifact, Message, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import DatabaseService from '../services/database';

export const useArtifactManagement = (
  currentRfp: RFP | null, 
  currentSessionId?: string, 
  isAuthenticated?: boolean, 
  user?: User | null,
  messages?: Message[],
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  // Get currently selected artifact
  const selectedArtifact = artifacts.find(artifact => artifact.id === selectedArtifactId) || null;

  // Function to select an artifact
  const selectArtifact = (artifactId: string) => {
    setSelectedArtifactId(artifactId);
  };

  // Function to add artifacts with message association
  const addArtifactWithMessage = (artifact: Artifact, messageId?: string) => {
    const artifactWithMessage: Artifact = {
      ...artifact,
      sessionId: currentSessionId,
      messageId,
      isReferencedInSession: true
    };
    
    setArtifacts(prev => [...prev, artifactWithMessage]);
    
    // Auto-select the newly created artifact
    setSelectedArtifactId(artifactWithMessage.id);
    
    return artifactWithMessage;
  };

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
        console.log('🔍 buyer_questionnaire type:', typeof currentRfp.buyer_questionnaire);
        console.log('🔍 buyer_questionnaire value:', currentRfp.buyer_questionnaire);
        
        try {
          let formData;
          
          // Check if it's already an object
          if (typeof currentRfp.buyer_questionnaire === 'object' && currentRfp.buyer_questionnaire !== null) {
            formData = currentRfp.buyer_questionnaire;
          } 
          // Check if it's a string that looks like JSON
          else if (typeof currentRfp.buyer_questionnaire === 'string') {
            const questionnaireStr = currentRfp.buyer_questionnaire as string;
            // Check if it looks like a form artifact ID (starts with 'form_')
            if (questionnaireStr.startsWith('form_')) {
              console.log('⚠️ buyer_questionnaire contains artifact ID instead of form data:', questionnaireStr);
              console.log('⚠️ Skipping buyer questionnaire loading - need to fetch from form_artifacts table');
              // Skip this for now, we need to fetch the actual form data from the form_artifacts table
              return;
            } else {
              // Try to parse as JSON
              formData = JSON.parse(questionnaireStr);
            }
          } else {
            console.log('⚠️ Unexpected buyer_questionnaire format:', typeof currentRfp.buyer_questionnaire);
            return;
          }
            
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
          console.error('❌ Raw buyer_questionnaire value:', currentRfp.buyer_questionnaire);
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

  // Load form artifacts from database when user or authentication changes
  useEffect(() => {
    console.log('=== USER CONTEXT CHANGED - LOADING FORM ARTIFACTS ===');
    console.log('isAuthenticated:', isAuthenticated, 'user:', user?.id);
    
    // Skip form artifacts loading if not authenticated or no user
    if (!isAuthenticated || !user?.id) {
      console.log('👤 User not authenticated - skipping form artifacts load');
      return;
    }
    
    const loadFormArtifacts = async () => {
      try {
        console.log('🔄 Attempting to load form artifacts...');
        const formArtifactsData = await DatabaseService.getFormArtifacts(user?.id);
        
        if (formArtifactsData.length > 0) {
          console.log(`📦 Converting ${formArtifactsData.length} form artifacts to UI format`);
          
          const formattedFormArtifacts: Artifact[] = formArtifactsData.map(formArtifact => {
            // Type guard for formArtifact
            if (typeof formArtifact !== 'object' || formArtifact === null) {
              throw new Error('Invalid form artifact data');
            }
            
            const artifact = formArtifact as {
              id: string;
              title: string;
              schema: unknown;
              ui_schema?: unknown;
              data?: unknown;
              submit_action?: unknown;
              description?: string;
            };
            
            return {
              id: artifact.id,
              name: artifact.title,
              type: 'form' as const,
              size: 'Interactive Form',
              content: JSON.stringify({
                schema: artifact.schema,
                ui_schema: artifact.ui_schema || {},
                form_data: artifact.data || {},
                submit_action: artifact.submit_action || { type: 'save_session' },
                description: artifact.description
              })
            };
          });
          
          // Merge with existing artifacts, avoiding duplicates
          setArtifacts(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newFormArtifacts = formattedFormArtifacts.filter(artifact => !existingIds.has(artifact.id));
            
            console.log(`➕ Adding ${newFormArtifacts.length} new form artifacts to existing ${prev.length} artifacts`);
            return [...prev, ...newFormArtifacts];
          });
        } else {
          console.log('📭 No form artifacts found in database');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Failed to load form artifacts:', errorMessage);
        console.log('💡 This is normal if the form_artifacts table has not been created yet.');
        console.log('💡 To fix this, run the migration: database/migration-add-form-artifacts-table.sql');
        // Don't throw - just continue without form artifacts
      }
    };

    loadFormArtifacts();
  }, [isAuthenticated, user?.id]);

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

      // Auto-select the most recent artifact for the session
      if (formattedArtifacts.length > 0) {
        // Find the most recent artifact by ID (assuming higher ID = more recent)
        const mostRecentArtifact = formattedArtifacts.reduce((latest, current) => {
          return parseInt(current.id) > parseInt(latest.id) ? current : latest;
        });
        
        selectArtifact(mostRecentArtifact.id);
      }
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

  // Claude artifacts handler
  const addClaudeArtifacts = (claudeMetadata: Record<string, unknown>, messageId?: string) => {
    console.log('=== CLAUDE RESPONSE DEBUG ===');
    console.log('Response has metadata:', !!claudeMetadata);
    console.log('Metadata keys:', Object.keys(claudeMetadata || {}));
    console.log('Has buyer_questionnaire in metadata:', !!claudeMetadata?.buyer_questionnaire);
    console.log('Has function_results in metadata:', !!claudeMetadata?.function_results);
    console.log('Message ID:', messageId);
    console.log('Current artifacts count before processing:', artifacts.length);
    
    const metadata = claudeMetadata as Record<string, unknown>;
    const newArtifactRefs: ArtifactReference[] = [];
    const processedArtifactIds = new Set<string>(); // Track processed artifacts to prevent duplicates
    
    // Handle function results from Claude API calls
    if (metadata.function_results && Array.isArray(metadata.function_results)) {
      console.log('Processing function results:', metadata.function_results);
      
      interface FunctionResult {
        function: string;
        result: {
          success?: boolean;
          artifact_id?: string;
          title?: string;
          description?: string;
          form_schema?: Record<string, unknown>;
          ui_schema?: Record<string, unknown>;
          form_data?: Record<string, unknown>;
          submit_action?: Record<string, unknown>;
          template_id?: string;
          template_name?: string;
          template_type?: string;
          template_schema?: Record<string, unknown>;
          template_ui?: Record<string, unknown>;
          tags?: string[];
          [key: string]: unknown; // Allow additional properties
        };
      }
      
      (metadata.function_results as FunctionResult[]).forEach((functionResult, index) => {
        console.log(`Function result ${index}:`, functionResult.function, functionResult.result);
        
        // Handle create_form_artifact results
        if (functionResult.function === 'create_form_artifact' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.form_schema) {
            console.log('Form artifact detected from function result:', result);
            
            const artifactId = result.artifact_id || `form-${Date.now()}-${index}`;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
              console.log('⚠️ Skipping duplicate form artifact:', artifactId);
              return;
            }
            
            processedArtifactIds.add(artifactId);
            console.log('📝 Processing new form artifact:', artifactId);
            const formArtifact: Artifact = {
              id: artifactId,
              name: result.title || 'Generated Form',
              type: 'form',
              size: 'Interactive Form',
              content: JSON.stringify({
                title: result.title,
                description: result.description,
                schema: result.form_schema,
                uiSchema: result.ui_schema || {},
                formData: result.form_data || {},
                submitAction: result.submit_action || { type: 'save_session' }
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            setArtifacts(prev => [...prev, formArtifact]);
            setSelectedArtifactId(formArtifact.id); // Auto-select new artifact
            console.log('✅ Added form artifact from function result:', formArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: artifactId,
              artifactName: result.title || 'Generated Form',
              artifactType: 'form'
            };
            newArtifactRefs.push(artifactRef);
          }
        }
        
        // Handle create_text_artifact results
        if (functionResult.function === 'create_text_artifact' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.content) {
            console.log('Text artifact detected from function result:', result);
            
            const artifactId = result.artifact_id || `text-${Date.now()}-${index}`;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
              console.log('⚠️ Skipping duplicate text artifact:', artifactId);
              return;
            }
            
            processedArtifactIds.add(artifactId);
            console.log('📝 Processing new text artifact:', artifactId);
            
            const textArtifact: Artifact = {
              id: artifactId,
              name: result.title || 'Generated Text',
              type: 'document', // Use 'document' type for text artifacts
              size: `${(result.content as string)?.length || 0} characters`,
              content: JSON.stringify({
                title: result.title,
                description: result.description,
                content: result.content,
                content_type: result.content_type || 'markdown',
                tags: result.tags || []
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            setArtifacts(prev => [...prev, textArtifact]);
            setSelectedArtifactId(textArtifact.id); // Auto-select new artifact
            console.log('✅ Added text artifact from function result:', textArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: artifactId,
              artifactName: result.title || 'Generated Text',
              artifactType: 'document'
            };
            newArtifactRefs.push(artifactRef);
          }
        }
        
        // Handle generate_proposal_artifact results
        if (functionResult.function === 'generate_proposal_artifact' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.content) {
            console.log('Proposal artifact detected from function result:', result);
            
            const artifactId = result.artifact_id || `proposal-${Date.now()}-${index}`;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
              console.log('⚠️ Skipping duplicate proposal artifact:', artifactId);
              return;
            }
            
            processedArtifactIds.add(artifactId);
            console.log('📝 Processing new proposal artifact:', artifactId);
            
            const proposalArtifact: Artifact = {
              id: artifactId,
              name: result.title || 'Generated Proposal',
              type: 'document', // Use 'document' type for proposal artifacts
              size: `${(result.content as string)?.length || 0} characters`,
              content: JSON.stringify({
                title: result.title,
                description: result.description,
                content: result.content,
                content_type: result.content_type || 'markdown',
                tags: result.tags || ['proposal'],
                rfp_id: result.rfp_id
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            setArtifacts(prev => [...prev, proposalArtifact]);
            setSelectedArtifactId(proposalArtifact.id); // Auto-select new artifact
            console.log('✅ Added proposal artifact from function result:', proposalArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: artifactId,
              artifactName: result.title || 'Generated Proposal',
              artifactType: 'document'
            };
            newArtifactRefs.push(artifactRef);
          }
        }
        
        // Handle other artifact creation functions
        if (functionResult.function === 'create_artifact_template' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.template_schema) {
            console.log('Template artifact detected from function result:', result);
            
            const templateArtifactId = result.template_id || `template-${Date.now()}-${index}`;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(templateArtifactId) || artifacts.some(a => a.id === templateArtifactId)) {
              console.log('⚠️ Skipping duplicate template artifact:', templateArtifactId);
              return;
            }
            
            processedArtifactIds.add(templateArtifactId);
            console.log('📝 Processing new template artifact:', templateArtifactId);
            
            const templateArtifact: Artifact = {
              id: templateArtifactId,
              name: result.template_name || 'Generated Template',
              type: result.template_type as 'document' | 'image' | 'pdf' | 'other' | 'form' || 'document',
              size: 'Template',
              content: JSON.stringify({
                name: result.template_name,
                description: result.description,
                schema: result.template_schema,
                uiConfig: result.template_ui || {},
                tags: result.tags || []
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            setArtifacts(prev => [...prev, templateArtifact]);
            setSelectedArtifactId(templateArtifact.id); // Auto-select new artifact
            console.log('✅ Added template artifact from function result:', templateArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: templateArtifactId,
              artifactName: result.template_name || 'Generated Template',
              artifactType: templateArtifact.type
            };
            newArtifactRefs.push(artifactRef);
          }
        }
      });
    }
    
    // Handle buyer questionnaire form (legacy support)
    if (metadata.buyer_questionnaire) {
      console.log('Buyer questionnaire detected:', metadata.buyer_questionnaire);
      
      const artifactId = `buyer-form-${Date.now()}`;
      
      // Check if we already processed a form artifact from function_results that might be the same
      const existingFormArtifacts = artifacts.filter(a => a.type === 'form' && a.sessionId === currentSessionId);
      const hasRecentFormArtifact = existingFormArtifacts.some(a => 
        a.messageId === messageId || 
        processedArtifactIds.has(a.id) ||
        (Date.now() - parseInt(a.id.split('-').pop() || '0')) < 5000 // Created within last 5 seconds
      );
      
      if (hasRecentFormArtifact) {
        console.log('⚠️ Skipping buyer questionnaire artifact - recent form artifact already processed');
        return;
      }
      
      processedArtifactIds.add(artifactId);
      console.log('📝 Processing buyer questionnaire artifact:', artifactId);
      
      const formArtifact: Artifact = {
        id: artifactId,
        name: 'Buyer Questionnaire',
        type: 'form',
        size: 'Interactive Form',
        content: JSON.stringify(metadata.buyer_questionnaire),
        sessionId: currentSessionId,
        messageId,
        isReferencedInSession: true
      };
      
      setArtifacts(prev => [...prev, formArtifact]);
      setSelectedArtifactId(formArtifact.id); // Auto-select new artifact
      console.log('Added buyer questionnaire to artifacts:', formArtifact);
      
      // Create artifact reference for the message
      const artifactRef: ArtifactReference = {
        artifactId: artifactId,
        artifactName: 'Buyer Questionnaire',
        artifactType: 'form'
      };
      newArtifactRefs.push(artifactRef);
    }

    // Handle any other artifacts from Claude response (legacy support)
    if (metadata.artifacts && Array.isArray(metadata.artifacts)) {
      console.log('Additional artifacts detected:', metadata.artifacts);
      
      interface ArtifactData {
        name?: string;
        type?: string;
        size?: string;
        content?: string;
        url?: string;
      }
      
      const newArtifacts: Artifact[] = (metadata.artifacts as ArtifactData[]).map((artifact, index) => {
        const artifactId = `claude-artifact-${Date.now()}-${index}`;
        const artifactName = artifact.name || `Generated Artifact ${index + 1}`;
        const artifactType = artifact.type as 'document' | 'text' | 'image' | 'pdf' | 'other' || 'document';
        
        // Check if this artifact already exists or has been processed
        if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
          console.log('⚠️ Skipping duplicate generic artifact:', artifactId);
          return null;
        }
        
        processedArtifactIds.add(artifactId);
        console.log('📝 Processing new generic artifact:', artifactId);
        
        // Create artifact reference for the message
        const artifactRef: ArtifactReference = {
          artifactId: artifactId,
          artifactName: artifactName,
          artifactType: artifactType
        };
        newArtifactRefs.push(artifactRef);
        
        return {
          id: artifactId,
          name: artifactName,
          type: artifactType,
          size: artifact.size || 'Generated',
          content: artifact.content,
          url: artifact.url,
          sessionId: currentSessionId,
          messageId,
          isReferencedInSession: true
        };
      }).filter(artifact => artifact !== null) as Artifact[]; // Filter out nulls from duplicates
      
      setArtifacts(prev => [...prev, ...newArtifacts]);
      
      // Auto-select the first new artifact
      if (newArtifacts.length > 0) {
        setSelectedArtifactId(newArtifacts[0].id);
      }
      
      console.log('Added Claude artifacts:', newArtifacts);
    }
    
    // Update message with artifact references if we have any new artifacts
    if (newArtifactRefs.length > 0 && messageId && messages && setMessages) {
      console.log('Adding artifact references to message:', messageId, newArtifactRefs);
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id === messageId) {
            const existingArtifactIds = new Set(msg.artifactRefs?.map(ref => ref.artifactId) || []);
            const uniqueNewRefs = newArtifactRefs.filter(ref => !existingArtifactIds.has(ref.artifactId));
            
            if (uniqueNewRefs.length === 0) {
              console.log('⚠️ No new unique artifact references to add to message:', messageId);
              return msg;
            }
            
            const updatedArtifactRefs = [...(msg.artifactRefs || []), ...uniqueNewRefs];
            const updatedMessage = { ...msg, artifactRefs: updatedArtifactRefs };
            
            console.log('✅ Adding', uniqueNewRefs.length, 'unique artifact references to message:', messageId);
            
            // Update database with new artifact references
            if (currentSessionId && isAuthenticated && user) {
              DatabaseService.updateMessage(currentSessionId, messageId, {
                metadata: {
                  ...msg.metadata,
                  artifactRefs: updatedArtifactRefs
                }
              }).catch((error: unknown) => {
                console.error('Failed to update message with artifact references:', error);
              });
            }
            
            return updatedMessage;
          }
          return msg;
        })
      );
    }
    
    console.log('=== END CLAUDE RESPONSE DEBUG ===');
    console.log('Total new artifact references created:', newArtifactRefs.length);
    console.log('New artifact reference IDs:', newArtifactRefs.map(ref => ref.artifactId));
    console.log('Processed artifact IDs:', Array.from(processedArtifactIds));
    console.log('Current artifacts count after processing:', artifacts.length);
    
    // Check for duplicate artifact IDs in newArtifactRefs
    const refIds = newArtifactRefs.map(ref => ref.artifactId);
    const duplicateRefIds = refIds.filter((id, index) => refIds.indexOf(id) !== index);
    if (duplicateRefIds.length > 0) {
      console.error('⚠️ DUPLICATE ARTIFACT REFERENCES DETECTED:', duplicateRefIds);
    }
  };

  const clearArtifacts = () => {
    setArtifacts([]);
    setSelectedArtifactId(null);
  };

  // Auto-select most recent artifact when session changes
  useEffect(() => {
    if (currentSessionId && artifacts.length > 0) {
      // Find the most recent artifact in this session
      const sessionArtifacts = artifacts.filter(artifact => 
        artifact.sessionId === currentSessionId || 
        !artifact.sessionId // Include legacy artifacts without session ID
      );
      
      if (sessionArtifacts.length > 0) {
        // Select the most recently created artifact
        const mostRecent = sessionArtifacts[sessionArtifacts.length - 1];
        setSelectedArtifactId(mostRecent.id);
      }
    }
  }, [currentSessionId, artifacts]);

  return {
    artifacts,
    selectedArtifact,
    selectedArtifactId,
    setArtifacts,
    selectArtifact,
    addArtifactWithMessage,
    loadSessionArtifacts,
    handleAttachFile,
    addClaudeArtifacts,
    clearArtifacts
  };
};

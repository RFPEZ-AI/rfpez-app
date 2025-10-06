// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Artifact as DatabaseArtifact } from '../types/database';
import { Artifact, ArtifactReference, Message } from '../types/home';
import { RFP } from '../types/rfp';
import DatabaseService from '../services/database';
import { supabase } from '../supabaseClient';

export const useArtifactManagement = (
  currentRfp: RFP | null, 
  currentSessionId?: string, 
  isAuthenticated?: boolean, 
  user?: User | null,
  messages?: Message[],
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
  onArtifactAdded?: (artifactId: string) => void, // New callback for when artifacts are added
  onArtifactSelected?: (sessionId: string, artifactId: string | null) => void, // New callback for artifact selection
  currentRfpId?: number | null, // Add current RFP ID
  handleSetCurrentRfp?: (rfpId: number, rfpData?: RFP) => Promise<void> // Add RFP setter function
) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [selectedArtifactWithSubmission, setSelectedArtifactWithSubmission] = useState<Artifact | null>(null);

  // Get currently selected artifact from the list
  const selectedArtifact = selectedArtifactWithSubmission || artifacts.find(artifact => artifact.id === selectedArtifactId) || null;

  // Effect to load submission data when artifact is selected
  useEffect(() => {
    const loadArtifactWithSubmission = async () => {
      if (!selectedArtifactId) {
        setSelectedArtifactWithSubmission(null);
        return;
      }

      const baseArtifact = artifacts.find(artifact => artifact.id === selectedArtifactId);
      if (!baseArtifact) {
        setSelectedArtifactWithSubmission(null);
        return;
      }

      // For form artifacts, try to load submission data
      // Check for various form indicators: type, name patterns, or content structure
      const isFormArtifact = (
        baseArtifact.type === 'form' || 
        baseArtifact.name === 'Buyer Questionnaire' ||
        baseArtifact.name?.toLowerCase().includes('form') ||
        baseArtifact.name?.toLowerCase().includes('questionnaire') ||
        (baseArtifact.content && baseArtifact.content.includes('"schema"') && baseArtifact.content.includes('"uiSchema"'))
      );
      
      if (isFormArtifact) {
        console.log('📋 Loading form artifact:', selectedArtifactId, 'name:', baseArtifact.name, 'type:', baseArtifact.type);
        
        // First check if the artifact content already has form data
        let hasFormData = false;
        try {
          const formSpec = JSON.parse(baseArtifact.content || '{}');
          hasFormData = formSpec.formData && Object.keys(formSpec.formData).length > 0;
          console.log('📋 Artifact already has form data:', hasFormData);
        } catch (parseError) {
          console.log('📋 Could not parse artifact content, assuming no form data');
        }

        if (hasFormData) {
          // Use the artifact as-is since it already has form data
          console.log('✅ Using artifact with existing form data');
          setSelectedArtifactWithSubmission(baseArtifact);
        } else {
          // Only try to load from submissions table if no form data exists
          console.log('📋 No form data in artifact, checking submission table');
          try {
            const submissionData = await DatabaseService.getLatestSubmission(
              selectedArtifactId, 
              currentSessionId || 'current'
            );

            if (submissionData) {
              // Parse the existing form content and merge with submission data
              let enhancedContent = baseArtifact.content || '{}';
              try {
                const formSpec = JSON.parse(enhancedContent);
                // Merge submission data as formData
                formSpec.formData = submissionData;
                enhancedContent = JSON.stringify(formSpec);
                
                console.log('✅ Enhanced form artifact with submission data:', submissionData);
                console.log('📋 Final enhanced content preview:', enhancedContent.substring(0, 200) + '...');
                setSelectedArtifactWithSubmission({
                  ...baseArtifact,
                  content: enhancedContent
                });
              } catch (parseError) {
                console.warn('Failed to parse form content for artifact:', baseArtifact.name, parseError);
                console.log('📋 Original content was:', enhancedContent);
                setSelectedArtifactWithSubmission(baseArtifact);
              }
            } else {
              console.log('📋 No submission data found for:', baseArtifact.name, '- using base artifact');
              setSelectedArtifactWithSubmission(baseArtifact);
            }
          } catch (error) {
            console.warn('Error loading submission data:', error);
            setSelectedArtifactWithSubmission(baseArtifact);
          }
        }
      } else {
        // For non-form artifacts, use as-is
        setSelectedArtifactWithSubmission(baseArtifact);
      }
    };

    loadArtifactWithSubmission();
  }, [selectedArtifactId, artifacts, currentSessionId]);

  // Function to select an artifact
  const selectArtifact = async (artifactId: string) => {
    setSelectedArtifactId(artifactId);
    
    // Save selection for current session if we have a callback and session
    if (currentSessionId && onArtifactSelected) {
      onArtifactSelected(currentSessionId, artifactId);
    }

    // Update session context in database
    if (currentSessionId) {
      try {
        await DatabaseService.updateSessionContext(currentSessionId, { 
          current_artifact_id: artifactId 
        });
        console.log('✅ Artifact context saved to session:', currentSessionId, artifactId);
      } catch (error) {
        console.warn('⚠️ Failed to save artifact context to session:', error);
      }
    }
  };

  // Function to set selected artifact without persisting (for restoration)
  const setSelectedArtifactFromState = (artifactId: string | null) => {
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
    
    // Add artifact to state and ensure immediate availability
    setArtifacts(prev => {
      const updated = [...prev, artifactWithMessage];
      console.log('📝 Artifact with message added to state immediately:', artifactWithMessage.id, 'Total:', updated.length);
      return updated;
    });
    
    // Auto-select the newly created artifact
    setSelectedArtifactId(artifactWithMessage.id);
    
    // Notify parent that an artifact was added (triggers auto-open)
    onArtifactAdded?.(artifactWithMessage.id);
    
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
        !artifact.id.startsWith('request-')
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
              console.log('⚠️ Skipping buyer questionnaire loading - need to fetch from artifacts table');
              // Skip this for now, we need to fetch the actual form data from the artifacts table
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
      
      // Load request content if exists
      if (currentRfp.request) {
        console.log('🟢 Loading request content from RFP database');
        const requestArtifact: Artifact = {
          id: `request-${currentRfp.id}`,
          name: 'RFP Request',
          type: 'document',
          size: 'Generated Content',
          content: currentRfp.request
        };
        
        newArtifacts.push(requestArtifact);
        console.log('✅ Added request artifact:', requestArtifact);
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
  // DISABLED for session isolation - artifacts should only be session-specific
  useEffect(() => {
    console.log('=== USER CONTEXT CHANGED - FORM ARTIFACTS LOADING DISABLED FOR SESSION ISOLATION ===');
    console.log('isAuthenticated:', isAuthenticated, 'user:', user?.id);
    
    // Skip global form artifacts loading to ensure session isolation
    // Each session should only show artifacts created within that session
    if (!isAuthenticated || !user?.id) {
      console.log('👤 User not authenticated - skipping form artifacts load');
      return;
    }
    
    console.log('🚫 Global form artifacts loading disabled for session isolation');
    return; // Exit early to disable global form loading
    
    const loadFormArtifacts = async () => {
      try {
        // Skip global form artifacts loading to maintain session isolation
        console.log('⏭️ Skipping global form artifacts loading for session isolation');
        return;
        
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
                default_values: artifact.data || {},
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
        console.log('💡 This is normal if the artifacts table has not been properly set up.');
        console.log('💡 To fix this, ensure the schema consolidation migration has been run.');
        // Don't throw - just continue without form artifacts
      }
    };

    loadFormArtifacts();
  }, [isAuthenticated, user?.id]);

  // Load session artifacts when session changes
  const loadSessionArtifacts = async (sessionId: string) => {
    try {
      const artifactsData: DatabaseArtifact[] = await DatabaseService.getSessionArtifacts(sessionId);
      const formattedArtifacts: Artifact[] = artifactsData.map(artifact => {
        let content: string | undefined;
        
        // For form artifacts, we need to handle two storage methods:
        // 1. New method: separate fields (schema, ui_schema, default_values, submit_action)
        // 2. Legacy method: everything in processed_content
        if (artifact.type === 'form') {
          console.log('📋 Processing form artifact:', {
            id: artifact.id,
            name: artifact.name,
            hasSchema: !!artifact.schema,
            hasProcessedContent: !!artifact.processed_content,
            schemaKeys: artifact.schema ? Object.keys(artifact.schema) : [],
            processedContentPreview: artifact.processed_content?.substring(0, 100)
          });
          
          // Try to use separate fields first (new method)
          if (artifact.schema || artifact.default_values) {
            const formSpec = {
              schema: artifact.schema || {},
              uiSchema: artifact.ui_schema || {},
              formData: artifact.default_values || {},
              submitAction: artifact.submit_action || { type: 'save_session' }
            };
            content = JSON.stringify(formSpec);
            console.log('📋 Using separate fields for form content');
          }
          // Fall back to processed_content (legacy method)
          else if (artifact.processed_content) {
            content = artifact.processed_content;
            console.log('📋 Using processed_content for form content');
          }
          // Default fallback
          else {
            console.warn('⚠️ Form artifact has no schema or processed_content, creating minimal form');
            const formSpec = {
              schema: { type: 'object', properties: {}, required: [] },
              uiSchema: {},
              formData: {},
              submitAction: { type: 'save_session' }
            };
            content = JSON.stringify(formSpec);
          }
        }
        // For non-form artifacts, use processed_content
        else {
          content = artifact.processed_content;
        }
        
        // Map database type to frontend type
        let frontendType: 'document' | 'text' | 'image' | 'pdf' | 'form' | 'other' = 'other';
        if (artifact.type === 'form') frontendType = 'form';
        else if (artifact.type === 'document') frontendType = 'document';
        else if (artifact.type === 'text') frontendType = 'text';
        else if (artifact.type === 'image') frontendType = 'image';
        else if (artifact.type === 'pdf') frontendType = 'pdf';
        
        console.log('📋 Formatted artifact:', {
          id: artifact.id,
          name: artifact.name,
          type: frontendType,
          hasContent: !!content,
          contentLength: content?.length || 0
        });
        
        return {
          id: artifact.id,
          name: artifact.name,
          type: frontendType,
          size: artifact.file_size ? `${(artifact.file_size / 1024).toFixed(1)} KB` : 'Unknown',
          content: content,
          sessionId: artifact.session_id,
          messageId: artifact.message_id
        };
      });
      
      // Replace ALL artifacts with only session-specific artifacts
      // This ensures that switching sessions shows ONLY artifacts for that session
      console.log(`📋 Loading ${formattedArtifacts.length} artifacts for session:`, sessionId);
      console.log(`📋 Previous artifact count: ${artifacts.length}`);
      setArtifacts(formattedArtifacts);

      // Return the artifacts so the caller can handle selection
      return formattedArtifacts;
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
    // Add artifact to state and ensure immediate availability
    setArtifacts(prev => {
      const updated = [...prev, newArtifact];
      console.log('📝 Attached file artifact added to state immediately:', newArtifact.id, 'Total:', updated.length);
      return updated;
    });
    
    // Auto-select and trigger auto-open for attached files
    setSelectedArtifactId(newArtifact.id);
    onArtifactAdded?.(newArtifact.id);

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
    console.log('🔍 addClaudeArtifacts called with:', { claudeMetadata, messageId, currentRfpId });
    console.log('=== CLAUDE RESPONSE DEBUG ===');
    console.log('Response has metadata:', !!claudeMetadata);
    console.log('Metadata keys:', Object.keys(claudeMetadata || {}));
    console.log('Has buyer_questionnaire in metadata:', !!claudeMetadata?.buyer_questionnaire);
    console.log('Has function_results in metadata:', !!claudeMetadata?.function_results);
    console.log('Message ID:', messageId);
    console.log('Current artifacts count before processing:', artifacts.length);
    
    // Utility function to check if a string is a valid UUID
    const isValidUUID = (str: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    // Only include message_id if it's a valid UUID
    const validMessageId = messageId && isValidUUID(messageId) ? messageId : undefined;
    
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
          default_values?: Record<string, unknown>;
          submit_action?: Record<string, unknown>;
          template_id?: string;
          template_name?: string;
          template_type?: string;
          template_schema?: Record<string, unknown>;
          template_ui?: Record<string, unknown>;
          tags?: string[];
          content?: string; // Add content property for update_form_artifact results
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
              name: (result.artifact_name as string) || (result.title as string) || 'Generated Form',
              type: 'form',
              size: 'Interactive Form',
              content: JSON.stringify({
                title: result.title,
                description: result.description,
                schema: result.form_schema,
                uiSchema: result.ui_schema || {},
                formData: result.default_values || {},
                submitAction: result.submit_action || { type: 'save_session' }
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            // Add artifact to state and ensure immediate availability
            setArtifacts(prev => {
              const updated = [...prev, formArtifact];
              console.log('📝 Artifact added to state immediately:', formArtifact.id, 'Total:', updated.length);
              
              // Defer selection and callback to next tick to ensure state is updated
              setTimeout(() => {
                selectArtifact(formArtifact.id);
                if (onArtifactAdded) {
                  onArtifactAdded(formArtifact.id);
                }
              }, 0);
              
              return updated;
            });
            
            // Auto-create placeholder RFP for the form if no RFP context exists
            (async () => {
              try {
                console.log('🔍 Placeholder RFP check - currentRfpId:', currentRfpId, 'type:', typeof currentRfpId, 'falsy:', !currentRfpId);
                if (!currentRfpId) {
                  console.log('🏗️ Auto-creating placeholder RFP for form artifact:', formArtifact.name);
                  
                  const { RFPService } = await import('../services/rfpService');
                  const placeholderRfp = await RFPService.create({
                    name: `RFP for ${formArtifact.name}`,
                    description: result.description || `Auto-generated RFP for ${formArtifact.name}`,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                    specification: 'Please complete the attached form. Responses will be evaluated based on completeness and relevance.',
                    is_template: false,
                    is_public: false
                  });
                  
                  if (placeholderRfp && handleSetCurrentRfp) {
                    console.log('✅ Created placeholder RFP:', placeholderRfp.name, 'ID:', placeholderRfp.id);
                    await handleSetCurrentRfp(placeholderRfp.id);
                    
                    // Now create the bid form artifact in the database with the correct role
                    console.log('🔗 Creating bid form artifact in database for RFP:', placeholderRfp.id);
                    const artifactData: Omit<DatabaseArtifact, 'created_at' | 'updated_at'> = {
                      id: formArtifact.id, // Use the same ID as the memory artifact
                      session_id: currentSessionId,
                      name: formArtifact.name,
                      description: result.description,
                      type: 'form',
                      artifact_role: 'bid_form', // This is the key field!
                      schema: result.form_schema,
                      ui_schema: result.ui_schema || {},
                      default_values: result.default_values || {},
                      submit_action: result.submit_action || { type: 'save_session' },
                      metadata: {
                        rfp_id: placeholderRfp.id,
                        auto_created: true,
                        created_for_rfp: placeholderRfp.name
                      },
                      processing_status: 'completed'
                    };
                    
                    // Only include message_id if it's a valid UUID
                    if (validMessageId) {
                      artifactData.message_id = validMessageId;
                    }
                    
                    const { data, error } = await supabase
                      .from('artifacts')
                      .upsert(artifactData, {
                        onConflict: 'id',
                        ignoreDuplicates: false
                      })
                      .select()
                      .single();
                    
                    if (error) {
                      console.warn('⚠️ Could not save bid form artifact to database:', error);
                    } else {
                      console.log('✅ Bid form artifact saved to database with role:', data.artifact_role);
                      
                      // Now link the artifact to the RFP in the junction table
                      const { DatabaseService } = await import('../services/database');
                      const linkSuccess = await DatabaseService.linkArtifactToRFP(
                        placeholderRfp.id, 
                        formArtifact.id, 
                        'bid_form'
                      );
                      
                      if (linkSuccess) {
                        console.log('✅ Bid form artifact linked to RFP in junction table');
                      } else {
                        console.warn('⚠️ Failed to link bid form artifact to RFP in junction table');
                      }
                    }
                  }
                } else {
                  console.log('ℹ️ RFP context already exists, saving bid form artifact to database for existing RFP:', currentRfpId);
                  
                  // Save bid form artifact to database for existing RFP
                  const artifactDataExisting: Omit<DatabaseArtifact, 'created_at' | 'updated_at'> = {
                    id: formArtifact.id,
                    session_id: currentSessionId,
                    name: formArtifact.name,
                    description: result.description,
                    type: 'form',
                    artifact_role: 'bid_form', // Critical field for RFP system lookup
                    schema: result.form_schema,
                    ui_schema: result.ui_schema || {},
                    default_values: result.default_values || {},
                    submit_action: result.submit_action || { type: 'save_session' },
                    metadata: {
                      rfp_id: currentRfpId,
                      created_for_existing_rfp: true
                    },
                    processing_status: 'completed'
                  };
                  
                  // Only include message_id if it's a valid UUID
                  if (validMessageId) {
                    artifactDataExisting.message_id = validMessageId;
                  }
                  
                  const { data, error } = await supabase
                    .from('artifacts')
                    .upsert(artifactDataExisting, {
                      onConflict: 'id',
                      ignoreDuplicates: false
                    })
                    .select()
                    .single();
                  
                  if (error) {
                    console.warn('⚠️ Could not save bid form artifact to database:', error);
                  } else {
                    console.log('✅ Bid form artifact saved to database with role for existing RFP:', data.artifact_role);
                    
                    // Now link the artifact to the existing RFP in the junction table
                    const { DatabaseService } = await import('../services/database');
                    const linkSuccess = await DatabaseService.linkArtifactToRFP(
                      currentRfpId, 
                      formArtifact.id, 
                      'bid_form'
                    );
                    
                    if (linkSuccess) {
                      console.log('✅ Bid form artifact linked to existing RFP in junction table');
                    } else {
                      console.warn('⚠️ Failed to link bid form artifact to existing RFP in junction table');
                    }
                  }
                }
              } catch (error) {
                console.warn('⚠️ Failed to create placeholder RFP:', error);
                // This is not critical - forms can still work without RFP context
              }
            })();
            
            // Notify parent that an artifact was added (triggers auto-open)
            onArtifactAdded?.(formArtifact.id);
            
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
        
        // Handle update_form_artifact results
        if (functionResult.function === 'update_form_artifact' && functionResult.result) {
          const result = functionResult.result; // Now properly typed through FunctionResult interface
          
          if (result.success && result.artifact_id) {
            console.log('Form artifact update detected from function result:', result);
            
            const artifactId = result.artifact_id;
            
            // Find the existing artifact
            const existingArtifactIndex = artifacts.findIndex(a => a.id === artifactId);
            
            if (existingArtifactIndex !== -1) {
              console.log('📝 Updating existing form artifact:', artifactId);
              
              // The updateFormArtifact function returns the complete content with populated formData
              // Use the returned content directly instead of trying to reconstruct it
              const updatedArtifact: Artifact = {
                ...artifacts[existingArtifactIndex],
                name: result.title || artifacts[existingArtifactIndex].name,
                content: result.content || artifacts[existingArtifactIndex].content // This contains the complete artifact content with populated formData
              };
              
              console.log('🎯 ARTIFACT UPDATE DEBUG:', {
                artifactId,
                resultContent: result.content,
                contentLength: result.content?.length || 0,
                updatedArtifact
              });
              
              // Update the artifacts array
              setArtifacts(prev => {
                const newArtifacts = [...prev];
                newArtifacts[existingArtifactIndex] = updatedArtifact;
                return newArtifacts;
              });
              
              // Auto-select the updated artifact to show the changes
              setSelectedArtifactId(artifactId);
              console.log('✅ Updated form artifact from function result:', updatedArtifact);
            } else {
              console.log('⚠️ Could not find existing form artifact to update:', artifactId);
              // Optionally, try to fetch the artifact from the database
              console.log('ℹ️ Available artifacts:', artifacts.map(a => a.id));
            }
          }
        }
        
        // Handle create_document_artifact results
        if (functionResult.function === 'create_document_artifact' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.artifact_id) {
            console.log('Document artifact detected from function result:', result);
            
            const artifactId = result.artifact_id;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
              console.log('⚠️ Skipping duplicate document artifact:', artifactId);
              return;
            }
            
            processedArtifactIds.add(artifactId);
            console.log('📝 Processing new document artifact:', artifactId);
            
            const documentArtifact: Artifact = {
              id: artifactId,
              name: (result as any).artifact_name || 'Generated Document',
              type: 'document',
              size: `${(result as any).content?.length || 0} characters`,
              content: JSON.stringify({
                name: (result as any).artifact_name,
                description: (result as any).description || null,
                content: (result as any).content || '',
                content_type: (result as any).content_type || 'markdown',
                tags: (result as any).tags || []
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            // Add artifact to state and ensure immediate availability
            setArtifacts(prev => {
              const updated = [...prev, documentArtifact];
              console.log('📝 Document artifact added to state immediately:', documentArtifact.id, 'Total:', updated.length);
              
              // Defer selection and callback to next tick to ensure state is updated
              setTimeout(() => {
                selectArtifact(documentArtifact.id);
                onArtifactAdded?.(documentArtifact.id);
              }, 0);
              
              return updated;
            });
            
            console.log('✅ Added document artifact from function result:', documentArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: artifactId,
              artifactName: result.title || 'Generated Text',
              artifactType: 'document'
            };
            newArtifactRefs.push(artifactRef);
          }
        }
        
        // Handle generate_request_artifact results
        if (functionResult.function === 'generate_request_artifact' && functionResult.result) {
          const result = functionResult.result;
          
          if (result.success && result.content) {
            console.log('Request artifact detected from function result:', result);
            
            const artifactId = result.artifact_id || `request-${Date.now()}-${index}`;
            
            // Check if this artifact already exists or has been processed
            if (processedArtifactIds.has(artifactId) || artifacts.some(a => a.id === artifactId)) {
              console.log('⚠️ Skipping duplicate request artifact:', artifactId);
              return;
            }
            
            processedArtifactIds.add(artifactId);
            console.log('📝 Processing new request artifact:', artifactId);
            
            const requestArtifact: Artifact = {
              id: artifactId,
              name: result.title || 'Generated Request',
              type: 'document', // Use 'document' type for request artifacts
              size: `${(result.content as string)?.length || 0} characters`,
              content: JSON.stringify({
                title: result.title,
                description: result.description,
                content: result.content,
                content_type: result.content_type || 'markdown',
                tags: result.tags || ['request'],
                rfp_id: result.rfp_id
              }),
              sessionId: currentSessionId,
              messageId,
              isReferencedInSession: true
            };
            
            // Add artifact to state and ensure immediate availability
            setArtifacts(prev => {
              const updated = [...prev, requestArtifact];
              console.log('📝 Request artifact added to state immediately:', requestArtifact.id, 'Total:', updated.length);
              
              // Defer selection and callback to next tick to ensure state is updated
              setTimeout(() => {
                selectArtifact(requestArtifact.id);
                onArtifactAdded?.(requestArtifact.id);
              }, 0);
              
              return updated;
            });
            
            console.log('✅ Added request artifact from function result:', requestArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: artifactId,
              artifactName: result.title || 'Generated Request',
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
              name: (result.artifact_name as string) || (result.template_name as string) || 'Generated Template',
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
            
            // Add artifact to state and ensure immediate availability
            setArtifacts(prev => {
              const updated = [...prev, templateArtifact];
              console.log('📝 Template artifact added to state immediately:', templateArtifact.id, 'Total:', updated.length);
              
              // Defer selection and callback to next tick to ensure state is updated
              setTimeout(() => {
                selectArtifact(templateArtifact.id);
                onArtifactAdded?.(templateArtifact.id);
              }, 0);
              
              return updated;
            });
            
            console.log('✅ Added template artifact from function result:', templateArtifact);
            
            // Create artifact reference for the message
            const artifactRef: ArtifactReference = {
              artifactId: templateArtifactId,
              artifactName: (result.artifact_name as string) || (result.template_name as string) || 'Generated Template',
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
      
      // Add artifact to state and ensure immediate availability
      setArtifacts(prev => {
        const updated = [...prev, formArtifact];
        console.log('📝 Buyer questionnaire artifact added to state immediately:', formArtifact.id, 'Total:', updated.length);
        
        // Defer selection to next tick to ensure state is updated
        setTimeout(() => {
          setSelectedArtifactId(formArtifact.id);
        }, 0);
        
        return updated;
      });
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

  // Auto-select most recent artifact when session changes, but not if already selected
  useEffect(() => {
    if (currentSessionId && artifacts.length > 0 && !selectedArtifactId) {
      // Only auto-select if no artifact is currently selected
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
  }, [currentSessionId, artifacts, selectedArtifactId]);

  return {
    artifacts,
    selectedArtifact,
    selectedArtifactId,
    setArtifacts,
    selectArtifact,
    setSelectedArtifactFromState,
    addArtifactWithMessage,
    loadSessionArtifacts,
    handleAttachFile,
    addClaudeArtifacts,
    clearArtifacts
  };
};

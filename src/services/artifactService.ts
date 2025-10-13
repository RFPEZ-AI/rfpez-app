// Copyright Mark Skiba, 2025 All rights reserved

import { Artifact, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import DatabaseService from './database';
import { DocxExporter } from '../utils/docxExporter';
import type { FormSpec } from '../types/rfp';

export class ArtifactService {
  /**
   * Download an artifact with appropriate conversion based on type
   */
  static async downloadArtifact(
    artifact: Artifact, 
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    console.log('Download artifact:', artifact);
    console.log('Artifact type:', artifact.type);
    console.log('Artifact content (first 200 chars):', typeof artifact.content === 'string' ? artifact.content.substring(0, 200) : artifact.content);
    
    try {
      // Check if it's a form artifact or document with form-like content
      if ((artifact.type === 'form' || artifact.type === 'document') && artifact.content) {
        console.log('Processing potential form/document artifact...');
        
        try {
          const formData = JSON.parse(artifact.content);
          console.log('Form data structure:', {
            hasSchema: !!formData.schema,
            hasUiSchema: !!formData.uiSchema,
            hasFormData: !!formData.formData,
            title: formData.title,
            keys: Object.keys(formData)
          });
          
          // Check if it's a buyer questionnaire with schema (structured form)
          if (formData.schema && typeof formData.schema === 'object') {
            console.log('Valid form schema found, proceeding with document generation...');
            
            await this.downloadFormArtifact(artifact, formData, currentRfp, addSystemMessage);
            return;
          } 
          // Check if it's a document artifact with structured content
          else if (artifact.type === 'document' && formData.content && formData.content_type) {
            console.log('Document artifact with structured content found, converting to DOCX...');
            
            await this.downloadDocumentArtifact(artifact, formData, currentRfp, addSystemMessage);
            return;
          }
          else if (artifact.type === 'form') {
            // Only show this error for actual form artifacts without schema
            console.warn('⚠️ Form artifact does not have valid schema structure');
            console.log('Form data keys:', Object.keys(formData));
            console.log('Schema type:', typeof formData.schema);
            
            addSystemMessage(
              'This form artifact does not contain a valid form schema. ' +
              'The artifact appears to contain metadata or raw form data instead of a structured form definition. ' +
              'Please check that this is a properly formatted form artifact.', 'warning'
            );
            return;
          }
        } catch (jsonError) {
          // If JSON parsing fails and it's a form, show error
          if (artifact.type === 'form') {
            console.warn('⚠️ Form artifact has invalid JSON content');
            addSystemMessage('This form artifact appears to be empty or contains invalid data.', 'warning');
            return;
          }
          // If it's a document that's not JSON, check if it's markdown/text content
          if (artifact.type === 'document' && typeof artifact.content === 'string') {
            console.log('Document artifact contains text/markdown content, converting to DOCX...');
            
            await this.downloadTextDocumentArtifact(artifact, currentRfp, addSystemMessage);
            return;
          } else {
            console.log('Document artifact is not text content, treating as regular document for download');
          }
        }
      }
      
      // For other artifact types, fall back to basic download
      await this.downloadBasicArtifact(artifact, addSystemMessage);
      
    } catch (error) {
      console.error('❌ Error downloading artifact:', error);
      addSystemMessage('An error occurred while downloading the artifact. Please try again.', 'error');
    }
  }

  /**
   * Download a form artifact with schema
   */
  private static async downloadFormArtifact(
    artifact: Artifact,
    formData: any,
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    // Convert to FormSpec format expected by DocxExporter
    const formSpec: FormSpec = {
      version: 'rfpez-form@1',
      schema: formData.schema,
      uiSchema: formData.uiSchema || {},
      defaults: formData.formData || {}
    };
    
    // Get actual submitted response data from the current RFP
    let responseData: Record<string, unknown> = {};
    
    if (currentRfp) {
      // Check which type of form this is and get the appropriate response data
      if (artifact.name.toLowerCase().includes('buyer') || 
          artifact.name.toLowerCase().includes('questionnaire') ||
          artifact.id.startsWith('buyer-form-')) {
        // This is a buyer questionnaire - get response using new method
        try {
          const { RFPService } = await import('./rfpService');
          const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
          responseData = questionnaireResponse?.default_values || {};
          console.log('Using buyer questionnaire response data from new method:', responseData);
        } catch (error) {
          console.warn('Failed to load questionnaire response, falling back to legacy:', error);
          responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || {};
        }
      } else if (artifact.name.toLowerCase().includes('bid') || 
                artifact.name.toLowerCase().includes('supplier') ||
                artifact.id.startsWith('bid-form-')) {
        // This is a bid form - check if we have bid responses (this would be in a separate table)
        // For now, use the form defaults as bid responses aren't stored in the RFP record
        responseData = formData.formData || {};
        console.log('Using form defaults for bid form (no submitted responses available)');
      } else {
        // Unknown form type, try new method first, then legacy, then defaults
        try {
          const { RFPService } = await import('./rfpService');
          const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
          responseData = questionnaireResponse?.default_values || (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
        } catch (error) {
          responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
        }
        console.log('Unknown form type, using available response data:', responseData);
      }
    } else {
      // No RFP context, use form defaults
      responseData = formData.formData || {};
      console.log('No RFP context, using form defaults');
    }
    
    // If response data is empty, show a warning but still proceed with empty fields
    if (Object.keys(responseData).length === 0) {
      addSystemMessage('No response data available for this form, will create document with empty fields', 'warning');
      const proceed = confirm(
        'This form has not been submitted yet or has no response data. ' +
        'The downloaded document will contain empty fields for you to fill out. Do you want to continue?'
      );
      if (!proceed) {
        return;
      }
      // Use form defaults or empty object to create fillable form
      responseData = formData.formData || {};
    }
    
    // Set up export options
    const exportOptions = {
      title: formData.title || artifact.name || 'Form Response',
      filename: `${artifact.name || 'form-response'}.docx`,
      companyName: (responseData.companyName as string) || 'Your Company',
      rfpName: currentRfp?.name || 'RFP Response',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    // Download as DOCX
    await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
    addSystemMessage('Form artifact downloaded successfully as DOCX', 'success');
  }

  /**
   * Download a document artifact with structured content
   */
  private static async downloadDocumentArtifact(
    artifact: Artifact,
    formData: any,
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    // Extract the actual document content from the JSON structure
    const documentContent = formData.content;
    const contentType = formData.content_type || 'markdown';
    
    console.log('Document content type:', contentType);
    console.log('Document content (first 200 chars):', documentContent.substring(0, 200));
    
    // Handle document conversion based on content type
    const exportOptions = {
      title: formData.title || artifact.name || 'Document',
      filename: `${artifact.name || 'document'}.docx`,
      rfpName: currentRfp?.name || '',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    try {
      if (contentType === 'markdown' || contentType === 'text') {
        await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
        console.log('✅ Structured document downloaded as DOCX');
        return;
      } else {
        // For other content types, try markdown conversion as fallback
        console.log('⚠️ Unknown content type, attempting markdown conversion as fallback');
        await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
        console.log('✅ Document downloaded as DOCX (fallback)');
        return;
      }
    } catch (docxError) {
      console.error('❌ Error converting structured document to DOCX:', docxError);
      addSystemMessage('Error converting document to Word format. The document will be downloaded as a text file instead.', 'warning');
      // Continue to fallback download with the extracted content
      const blob = new Blob([documentContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artifact.name || 'document'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Document content downloaded as text file (fallback)');
    }
  }

  /**
   * Download a text/markdown document artifact
   */
  private static async downloadTextDocumentArtifact(
    artifact: Artifact,
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    // Handle markdown/text documents
    const exportOptions = {
      title: artifact.name || 'Document',
      filename: `${artifact.name || 'document'}.docx`,
      rfpName: currentRfp?.name || '',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    try {
      await DocxExporter.downloadMarkdownDocx(artifact.content as string, exportOptions);
      console.log('✅ Markdown document downloaded as DOCX');
    } catch (docxError) {
      console.error('❌ Error converting markdown to DOCX:', docxError);
      addSystemMessage('Error converting document to Word format. The document will be downloaded as a text file instead.', 'warning');
      // Fall through to basic download
      await this.downloadBasicArtifact(artifact, addSystemMessage);
    }
  }

  /**
   * Download an artifact using basic methods (URL or content blob)
   */
  private static async downloadBasicArtifact(
    artifact: Artifact,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    if (artifact.url) {
      const link = document.createElement('a');
      link.href = artifact.url as string;
      link.download = artifact.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Artifact downloaded via URL');
    } else if (artifact.content && typeof artifact.content === 'string') {
      // Create a blob from content and download
      const blob = new Blob([artifact.content as string], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artifact.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Artifact content downloaded as text file');
    } else {
      console.warn('⚠️ No downloadable content found in artifact');
      addSystemMessage('This artifact does not have downloadable content.', 'info');
    }
  }

  /**
   * Submit a form with auto-prompt functionality
   */
  static async submitFormWithAutoPrompt(
    artifact: Artifact,
    formData: Record<string, unknown>,
    currentSessionId: string | undefined,
    currentRfpId: string | undefined,
    user: { id: string } | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    console.log('=== FORM SUBMISSION WITH AUTO-PROMPT ===');
    console.log('Artifact name:', artifact.name);
    console.log('Form data:', formData);
    
    try {
      // Save to artifact_submissions table (always available)
      console.log('💾 Saving form submission to artifact_submissions table...');
      try {
        await DatabaseService.saveArtifactSubmission(
          artifact.id,
          formData,
          currentSessionId,
          user?.id
        );
        console.log('✅ Form submission saved to artifact_submissions table');
      } catch (submissionError) {
        console.warn('⚠️ Could not save to artifact_submissions table:', submissionError);
        // Continue - try other methods
      }

      // If we have RFP context, also save there
      if (currentRfpId) {
        console.log('📤 Updating RFP questionnaire response using RFPService...');
        
        // Prepare the questionnaire response data
        const questionnaireResponse = {
          default_values: formData,
          supplier_info: {
            name: 'Anonymous User', // Default for anonymous submissions
            email: 'anonymous@example.com'
          },
          submitted_at: new Date().toISOString(),
          form_version: '1.0'
        };

        // Save the questionnaire response using the new RFPService method
        const { RFPService } = await import('./rfpService');
        const updatedRfp = await RFPService.updateRfpBuyerQuestionnaireResponse(
          parseInt(currentRfpId, 10), 
          questionnaireResponse
        );

        if (updatedRfp) {
          console.log('✅ Form response saved to RFP successfully');
        }
      } else {
        console.log('ℹ️ No RFP context - form saved to artifact submissions only');
      }
        
      addSystemMessage('Form submitted successfully!', 'success');
        
      // Send auto-prompt after successful submission
      const formName = artifact.name || 'Form';
      console.log('📤 Sending auto-prompt for form:', formName);
      
      // Note: sendAutoPrompt call would need to be handled by the calling component
      // as it requires many dependencies that would create circular imports
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      addSystemMessage('An error occurred while submitting the questionnaire.', 'error');
    }
  }

  /**
   * Create a bid view artifact for viewing bids for an RFP
   * Note: Uses deterministic ID based on RFP ID only to ensure one view per RFP
   */
  static createBidViewArtifact(currentRfp: RFP): Artifact {
    const bidViewArtifact: Artifact = {
      id: `bid-view-${currentRfp.id}`, // Deterministic ID without timestamp for reusability
      name: `Bids for ${currentRfp.name}`,
      type: 'bid_view',
      size: '0 KB',
      content: currentRfp.name, // Pass RFP name as content
      rfpId: currentRfp.id,
      role: 'buyer'
    };

    console.log('Creating bid view artifact:', bidViewArtifact.id);
    return bidViewArtifact;
  }

  /**
   * Select an artifact with retry logic for loading
   */
  static async selectArtifactWithRetry(
    artifactRef: ArtifactReference,
    artifacts: Artifact[],
    selectArtifact: (id: string) => void,
    artifactWindowState: any, // TODO: Type this properly
    currentSessionId: string | undefined,
    loadSessionArtifacts: (sessionId: string) => Promise<any>,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    console.log('Artifact selected:', artifactRef);
    console.log('Available artifacts:', artifacts.map(a => ({ id: a.id, name: a.name, type: a.type })));
    
    // Function to attempt artifact selection with retry logic
    const attemptArtifactSelection = async (retryCount = 0): Promise<boolean> => {
      const artifact = artifacts.find(a => a.id === artifactRef.artifactId);
      
      if (artifact) {
        selectArtifact(artifact.id);
        artifactWindowState.selectArtifact(artifact.id);
        artifactWindowState.openWindow();
        console.log('✅ Selected artifact for display:', artifact.name);
        return true;
      }
      
      // If artifact not found and we haven't exhausted retries, try again
      if (retryCount < 3) {
        console.log(`⏳ Artifact not immediately available, retrying in ${100 * (retryCount + 1)}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return attemptArtifactSelection(retryCount + 1);
      }
      
      return false;
    };
    
    // Try to select the artifact with retry logic
    const success = await attemptArtifactSelection();
    
    if (!success) {
      console.warn('❌ Artifact not found after retries:', artifactRef.artifactId);
      console.log('🔍 This suggests a sync issue between artifact creation and UI state updates');
      
      // Try to reload artifacts from database before showing error
      if (currentSessionId) {
        console.log('🔄 Attempting to reload session artifacts from database...');
        try {
          await loadSessionArtifacts(currentSessionId);
          // Try one more time after reload
          const artifactAfterReload = artifacts.find(a => a.id === artifactRef.artifactId);
          if (artifactAfterReload) {
            selectArtifact(artifactAfterReload.id);
            artifactWindowState.selectArtifact(artifactAfterReload.id);
            artifactWindowState.openWindow();
            console.log('✅ Found artifact after database reload:', artifactAfterReload.name);
            return;
          }
        } catch (error) {
          console.error('Failed to reload session artifacts:', error);
        }
      }
      
      // Create a system message instead of showing an alert popup
      addSystemMessage(`⚠️ Artifact "${artifactRef.artifactName}" could not be loaded. Please try refreshing the page.`, 'warning');
    }
  }

  /**
   * Save form data without validation (draft mode)
   */
  static async saveFormData(
    artifact: Artifact,
    formData: Record<string, unknown>,
    user: { id: string } | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<boolean> {
    console.log('=== FORM SAVE (DRAFT MODE) ===');
    console.log('Artifact name:', artifact.name);
    console.log('Form data:', formData);
    
    try {
      // Save to database using draft mode
      const result = await DatabaseService.saveFormData(
        artifact.id,
        formData,
        user?.id
      );

      if (result.success) {
        console.log('✅ Form data saved successfully');
        addSystemMessage(
          `💾 Form saved${result.saveCount ? ` (save #${result.saveCount})` : ''}`,
          'success'
        );
        return true;
      } else {
        console.error('❌ Failed to save form data');
        addSystemMessage('❌ Failed to save form data', 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ Exception during form save:', error);
      addSystemMessage('❌ An error occurred while saving the form', 'error');
      return false;
    }
  }

  /**
   * Get saved form data for an artifact
   */
  static async getSavedFormData(artifactId: string): Promise<Record<string, unknown> | null> {
    try {
      return await DatabaseService.getFormData(artifactId);
    } catch (error) {
      console.error('❌ Error loading saved form data:', error);
      return null;
    }
  }

  /**
   * Get form save statistics
   */
  static async getFormSaveStats(artifactId: string): Promise<{
    saveCount: number;
    lastSavedAt: string | null;
    dataStatus: 'has_draft' | 'has_data' | 'empty';
  } | null> {
    try {
      return await DatabaseService.getFormSaveStats(artifactId);
    } catch (error) {
      console.error('❌ Error getting form save stats:', error);
      return null;
    }
  }
}
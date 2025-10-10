// Copyright Mark Skiba, 2025 All rights reserved

import { DocxExporter } from '../utils/docxExporter';
import type { Artifact } from '../types/home';
import type { FormSpec, RFP } from '../types/rfp';

/**
 * Service for handling artifact downloads with format conversion
 * Supports forms, documents, and structured content
 */
export class ArtifactDownloadService {
  /**
   * Download an artifact with appropriate format handling
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
            await this.handleFormDownload(artifact, formData, currentRfp, addSystemMessage);
            return;
          } 
          // Check if it's a document artifact with structured content
          else if (artifact.type === 'document' && formData.content && formData.content_type) {
            await this.handleStructuredDocumentDownload(artifact, formData, currentRfp, addSystemMessage);
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
            await this.handleMarkdownDownload(artifact, currentRfp, addSystemMessage);
            return;
          } else {
            console.log('Document artifact is not text content, treating as regular document for download');
          }
        }
      }
      
      // For other artifact types, fall back to basic download
      await this.handleBasicDownload(artifact, addSystemMessage);
      
    } catch (error) {
      console.error('❌ Error downloading artifact:', error);
      addSystemMessage('An error occurred while downloading the artifact. Please try again.', 'error');
    }
  }

  /**
   * Handle form artifact download with DOCX conversion
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  private static async handleFormDownload(
    artifact: Artifact,
    formData: Record<string, unknown>,
    currentRfp: RFP | null,
    _addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    console.log('Valid form schema found, proceeding with document generation...');
    
    // Convert to FormSpec format expected by DocxExporter
    const formSpec: FormSpec = {
      version: 'rfpez-form@1',
      schema: formData.schema as Record<string, unknown>,
      uiSchema: (formData.uiSchema as Record<string, unknown>) || {},
      defaults: (formData.formData as Record<string, unknown>) || {}
    };
    
    // Get actual submitted response data from the current RFP
    let responseData: Record<string, unknown> = {};
    
    if (currentRfp) {
      responseData = await this.getFormResponseData(artifact, formData, currentRfp);
    } else {
      // No RFP context, use form defaults
      responseData = (formData.formData as Record<string, unknown>) || {};
      console.log('No RFP context, using form defaults');
    }
    
    // If response data is empty, show a warning but still proceed with empty fields
    if (Object.keys(responseData).length === 0) {
      console.warn('⚠️ No response data available for this form, will create document with empty fields');
      const proceed = confirm(
        'This form has not been submitted yet or has no response data. ' +
        'The downloaded document will contain empty fields for you to fill out. Do you want to continue?'
      );
      if (!proceed) {
        return;
      }
      // Use form defaults or empty object to create fillable form
      responseData = (formData.formData as Record<string, unknown>) || {};
    }
    
    // Set up export options
    const exportOptions = {
      title: (formData.title as string) || artifact.name || 'Form Response',
      filename: `${artifact.name || 'form-response'}.docx`,
      companyName: (responseData.companyName as string) || 'Your Company',
      rfpName: currentRfp?.name || 'RFP Response',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    // Download as DOCX
    await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
    console.log('✅ Form artifact downloaded as DOCX');
  }

  /**
   * Get form response data based on form type
   */
  private static async getFormResponseData(
    artifact: Artifact,
    formData: Record<string, unknown>,
    currentRfp: RFP
  ): Promise<Record<string, unknown>> {
    // Check which type of form this is and get the appropriate response data
    if (artifact.name.toLowerCase().includes('buyer') || 
        artifact.name.toLowerCase().includes('questionnaire') ||
        artifact.id.startsWith('buyer-form-')) {
      // This is a buyer questionnaire - get response using new method
      try {
        const { RFPService } = await import('../services/rfpService');
        const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
        const responseData = questionnaireResponse?.default_values || {};
        console.log('Using buyer questionnaire response data from new method:', responseData);
        return responseData;
      } catch (error) {
        console.warn('Failed to load questionnaire response, falling back to legacy:', error);
        return (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || {};
      }
    } else if (artifact.name.toLowerCase().includes('bid') || 
              artifact.name.toLowerCase().includes('supplier') ||
              artifact.id.startsWith('bid-form-')) {
      // This is a bid form - check if we have bid responses (this would be in a separate table)
      // For now, use the form defaults as bid responses aren't stored in the RFP record
      const responseData = (formData.formData as Record<string, unknown>) || {};
      console.log('Using form defaults for bid form (no submitted responses available)');
      return responseData;
    } else {
      // Unknown form type, try new method first, then legacy, then defaults
      try {
        const { RFPService } = await import('../services/rfpService');
        const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
        const responseData = questionnaireResponse?.default_values || (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || (formData.formData as Record<string, unknown>) || {};
        console.log('Unknown form type, using available response data:', responseData);
        return responseData;
      } catch (error) {
        return (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || (formData.formData as Record<string, unknown>) || {};
      }
    }
  }

  /**
   * Handle structured document download with DOCX conversion
   */
  private static async handleStructuredDocumentDownload(
    artifact: Artifact,
    formData: Record<string, unknown>,
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    console.log('Document artifact with structured content found, converting to DOCX...');
    
    // Extract the actual document content from the JSON structure
    const documentContent = formData.content as string;
    const contentType = (formData.content_type as string) || 'markdown';
    
    console.log('Document content type:', contentType);
    console.log('Document content (first 200 chars):', documentContent.substring(0, 200));
    
    // Handle document conversion based on content type
    const exportOptions = {
      title: (formData.title as string) || artifact.name || 'Document',
      filename: `${artifact.name || 'document'}.docx`,
      rfpName: currentRfp?.name || '',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    try {
      if (contentType === 'markdown' || contentType === 'text') {
        await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
        console.log('✅ Structured document downloaded as DOCX');
      } else {
        // For other content types, try markdown conversion as fallback
        console.log('⚠️ Unknown content type, attempting markdown conversion as fallback');
        await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
        console.log('✅ Document downloaded as DOCX (fallback)');
      }
    } catch (docxError) {
      console.error('❌ Error converting structured document to DOCX:', docxError);
      addSystemMessage('Error converting document to Word format. The document will be downloaded as a text file instead.', 'warning');
      
      // Fallback download with the extracted content
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
   * Handle markdown document download
   */
  private static async handleMarkdownDownload(
    artifact: Artifact,
    currentRfp: RFP | null,
    addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ): Promise<void> {
    console.log('Document artifact contains text/markdown content, converting to DOCX...');
    
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
      await this.handleBasicDownload(artifact, addSystemMessage);
    }
  }

  /**
   * Handle basic artifact download (URL or content)
   */
  private static async handleBasicDownload(
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
}

// Copyright Mark Skiba, 2025 All rights reserved

import { useMemo } from 'react';
import { Artifact } from '../types/home';

export interface ArtifactTypeDetection {
  isBuyerQuestionnaire: boolean;
  isTextArtifact: boolean;
  isBidView: boolean;
  isVendorSelection: boolean;
  isDefaultArtifact: boolean;
}

/**
 * Custom hook to detect artifact types and handle validation logic
 * Extracted from ArtifactWindow to separate concerns
 */
export const useArtifactTypeDetection = (artifact: Artifact | null): ArtifactTypeDetection => {
  return useMemo(() => {
    if (!artifact) {
      return {
        isBuyerQuestionnaire: false,
        isTextArtifact: false,
        isBidView: false,
        isVendorSelection: false,
        isDefaultArtifact: false
      };
    }

    // Check if artifact is a buyer questionnaire form (not a document/proposal)
    const isBuyerQuestionnaire = (): boolean => {
      try {
        // First check: if explicitly marked as form type, it should be a form
        if (artifact.type === 'form') {
          // Check for database artifact format (has schema/ui_schema properties)
          const dbArtifact = artifact as Artifact & {schema?: object};
          if (dbArtifact.schema && typeof dbArtifact.schema === 'object') {
            return true;
          }
          
          // Check legacy content format
          if (!artifact.content) {
            return true;
          }
          
          // Try to parse the content
          const parsed = JSON.parse(artifact.content);
          
          // If the parsed content has 'content' and 'content_type' properties, it's a document artifact
          if (parsed.content !== undefined && parsed.content_type !== undefined) {
            return false; // This is a document artifact, not a questionnaire
          }
          
          // Check for form structure: must have schema OR be empty (which we'll treat as valid)
          const hasSchema = parsed.schema && typeof parsed.schema === 'object';
          const isEmpty = Object.keys(parsed).length === 0;
          const isValidForm = hasSchema || isEmpty;
          
          return isValidForm;
        }
        
        // Legacy check: if named 'Buyer Questionnaire', it should be a form
        if (artifact.name === 'Buyer Questionnaire') {
          return true;
        }
        
      } catch (e) {
        console.error('Error parsing artifact content:', e);
        // If we can't parse it but it's marked as form type, assume it's a form
        if (artifact.type === 'form') {
          return true;
        }
      }
      return false;
    };

    // Check if artifact is a text artifact
    const isTextArtifact = (): boolean => {
      // Support both 'document' and 'text' types for text artifacts
      if (artifact.type === 'document' || artifact.type === 'text') {
        // If type is document/text, treat as text artifact even if content is empty
        // The renderer will handle empty/loading states
        if (!artifact.content || typeof artifact.content !== 'string') {
          return true; // Still a text artifact, just empty
        }
        
        const content = artifact.content.trim();
        
        // Empty content is still a valid text artifact
        if (content.length === 0) {
          return true;
        }
        
        // First check if it looks like JSON before attempting to parse
        if (content.startsWith('{') && content.endsWith('}')) {
          try {
            // Try to parse as JSON (structured text artifact)
            const parsed = JSON.parse(artifact.content);
            if (parsed.content_type) {
              return true; // Structured text artifact format
            }
          } catch (e) {
            // Not valid JSON, fall through to raw content check
          }
        }
        
        // Check for raw markdown/text content
        if (content.length > 0) {
          // Consider it markdown if it contains markdown patterns or if it's plain text
          const hasMarkdownPatterns = /^#{1,6}\s|^\*\*|^\*(?!\*)|^_|^\[.*\]\(.*\)|^>\s|^-\s|^\d+\.\s|```|`[^`]+`/.test(content);
          const hasLineBreaks = content.includes('\n');
          const isPlainText = content.length > 20; // Assume longer text content should be rendered as text
          
          if (hasMarkdownPatterns || hasLineBreaks || isPlainText) {
            return true;
          }
        }
        
        return true; // Default to text artifact for document/text types
      }
      
      return false;
    };

    // Check if artifact is a bid view
    const isBidView = (): boolean => {
      return artifact.type === 'bid_view';
    };

    // Check if artifact is a vendor selection
    const isVendorSelection = (): boolean => {
      return artifact.type === 'vendor_selection';
    };

    const isBuyerQuestionnaireResult = isBuyerQuestionnaire();
    const isTextArtifactResult = isTextArtifact();
    const isBidViewResult = isBidView();
    const isVendorSelectionResult = isVendorSelection();

    return {
      isBuyerQuestionnaire: isBuyerQuestionnaireResult,
      isTextArtifact: isTextArtifactResult,
      isBidView: isBidViewResult,
      isVendorSelection: isVendorSelectionResult,
      isDefaultArtifact: !isBuyerQuestionnaireResult && !isTextArtifactResult && !isBidViewResult && !isVendorSelectionResult
    };
  }, [artifact]);
};

/**
 * Get the appropriate icon for an artifact type
 */
export const getArtifactTypeIcon = (type: string): string => {
  switch (type) {
    case 'document':
    case 'text':
    case 'pdf':
      return 'document-text-outline';
    case 'form':
      return 'clipboard-outline';
    case 'image':
      return 'image-outline';
    case 'bid_view':
      return 'reorder-two-outline';
    case 'vendor_selection':
      return 'people-outline';
    default:
      return 'document-text-outline';
  }
};
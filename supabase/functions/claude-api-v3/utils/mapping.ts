// Copyright Mark Skiba, 2025 All rights reserved
// Data mapping utilities for Claude API v3
// Import types from the main types file to avoid duplication
// Map artifact roles to valid database constraint values
export function mapArtifactRole(role) {
  const roleMapping = {
    // Vendor/supplier response forms -> bid_form
    'vendor_response_form': 'bid_form',
    'supplier_response_form': 'bid_form',
    'vendor_form': 'bid_form',
    'supplier_form': 'bid_form',
    'response_form': 'bid_form',
    // Buyer forms -> buyer_questionnaire  
    'buyer_form': 'buyer_questionnaire',
    'requirements_form': 'buyer_questionnaire',
    // Valid roles pass through (including new document types)
    'buyer_questionnaire': 'buyer_questionnaire',
    'bid_form': 'bid_form',
    'rfp_request_email': 'rfp_request_email',
    'request_document': 'request_document',
    'specification_document': 'specification_document',
    'analysis_document': 'analysis_document',
    'report_document': 'report_document',
    'template': 'template'
  };
  return roleMapping[role] || null;
}
// Map frontend message format to Claude API format
export function mapMessageToClaudeFormat(message) {
  if (typeof message.content === 'string') {
    return {
      role: message.role,
      content: [
        {
          type: 'text',
          text: message.content
        }
      ]
    };
  }
  // Already in new format
  return message;
}
// Extract text content from Claude API response
export function extractTextFromClaudeResponse(content) {
  let textResponse = '';
  if (content && content.length > 0) {
    for (const contentBlock of content){
      if (contentBlock.type === 'text') {
        textResponse += contentBlock.text;
      }
    }
  }
  return textResponse;
}
// Extract tool calls from Claude API response
export function extractToolCallsFromClaudeResponse(content) {
  const toolCalls = [];
  if (content && content.length > 0) {
    for (const contentBlock of content){
      if (contentBlock.type === 'tool_use' && contentBlock.id && contentBlock.name && contentBlock.input) {
        toolCalls.push({
          type: 'tool_use',
          id: contentBlock.id,
          name: contentBlock.name,
          input: contentBlock.input
        });
      }
    }
  }
  return toolCalls;
}

// Copyright Mark Skiba, 2025 All rights reserved
// Data mapping utilities for Claude API v3

// Import types from the main types file to avoid duplication
import { ClaudeMessage } from '../types.ts';

interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  is_error?: boolean;
}

interface ToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// Map artifact roles to valid database constraint values
export function mapArtifactRole(role: string): string | null {
  const roleMapping: Record<string, string> = {
    // Vendor/supplier response forms -> bid_form
    'vendor_response_form': 'bid_form',
    'supplier_response_form': 'bid_form',
    'vendor_form': 'bid_form',
    'supplier_form': 'bid_form',
    'response_form': 'bid_form',
    // Buyer forms -> buyer_questionnaire  
    'buyer_form': 'buyer_questionnaire',
    'requirements_form': 'buyer_questionnaire',
    // Valid roles pass through
    'buyer_questionnaire': 'buyer_questionnaire',
    'bid_form': 'bid_form',
    'request_document': 'request_document',
    'template': 'template'
  };
  
  return roleMapping[role] || null;
}

// Map frontend message format to Claude API format
export function mapMessageToClaudeFormat(message: ClaudeMessage): ClaudeMessage {
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
export function extractTextFromClaudeResponse(content: ClaudeContentBlock[]): string {
  let textResponse = '';
  if (content && content.length > 0) {
    for (const contentBlock of content) {
      if (contentBlock.type === 'text') {
        textResponse += contentBlock.text;
      }
    }
  }
  return textResponse;
}

// Extract tool calls from Claude API response
export function extractToolCallsFromClaudeResponse(content: ClaudeContentBlock[]): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  if (content && content.length > 0) {
    for (const contentBlock of content) {
      if (contentBlock.type === 'tool_use' && contentBlock.id && contentBlock.name && contentBlock.input) {
        toolCalls.push({
          type: 'tool_use' as const,
          id: contentBlock.id,
          name: contentBlock.name,
          input: contentBlock.input
        });
      }
    }
  }
  return toolCalls;
}
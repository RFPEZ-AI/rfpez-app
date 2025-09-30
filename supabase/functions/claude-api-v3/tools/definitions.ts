// Copyright Mark Skiba, 2025 All rights reserved
// Tool definitions for Claude API integration

export const TOOL_DEFINITIONS = [
  {
    name: 'create_form_artifact',
    description: 'Create a form artifact (questionnaire, bid form, etc.) and store it in the database',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the form artifact'
        },
        description: {
          type: 'string',
          description: 'Description of the form artifact'
        },
        content: {
          type: 'object',
          description: 'Form content including fields, structure, and validation rules'
        },
        artifactRole: {
          type: 'string',
          description: 'Role/type of the artifact',
          enum: [
            'buyer_questionnaire',
            'bid_form', 
            'vendor_response_form',
            'supplier_response_form',
            'vendor_form',
            'supplier_form',
            'response_form',
            'buyer_form',
            'requirements_form',
            'request_document',
            'template'
          ]
        }
      },
      required: ['name', 'description', 'content', 'artifactRole']
    }
  },
  {
    name: 'get_conversation_history',
    description: 'Retrieve conversation history for the current session',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID to get history for (optional, uses current session if not provided)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to retrieve',
          default: 50
        }
      }
    }
  },
  {
    name: 'store_message',
    description: 'Store a message in the conversation history',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID (optional, uses current session if not provided)'
        },
        agentId: {
          type: 'string',
          description: 'Agent ID for the message'
        },
        sender: {
          type: 'string',
          description: 'Message sender',
          enum: ['user', 'assistant']
        },
        content: {
          type: 'string',
          description: 'Message content'
        }
      },
      required: ['sender', 'content']
    }
  },
  {
    name: 'create_session',
    description: 'Create a new conversation session',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Session title'
        },
        agentId: {
          type: 'string',
          description: 'Agent ID to associate with the session'
        }
      }
    }
  },
  {
    name: 'search_messages',
    description: 'Search messages across all user conversations',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find in message content'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 20
        }
      },
      required: ['query']
    }
  }
];

// Get tool definitions for Claude API
export function getToolDefinitions(): any[] {
  return TOOL_DEFINITIONS;
}

// Validate tool call input against schema
export function validateToolInput(toolName: string, input: any): boolean {
  const toolDef = TOOL_DEFINITIONS.find(tool => tool.name === toolName);
  if (!toolDef) {
    return false;
  }
  
  // Basic validation - check required fields
  const required = toolDef.input_schema.required || [];
  for (const field of required) {
    if (!(field in input)) {
      console.error(`Missing required field '${field}' for tool '${toolName}'`);
      return false;
    }
  }
  
  return true;
}
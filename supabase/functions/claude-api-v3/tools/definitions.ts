// Copyright Mark Skiba, 2025 All rights reserved
// Tool definitions for Claude API integration

import { ClaudeToolDefinition } from '../types.ts';

export const TOOL_DEFINITIONS: ClaudeToolDefinition[] = [
  {
    name: 'create_and_set_rfp',
    description: 'Create a new RFP and set it as the current active RFP for the session. CRITICAL: You MUST extract the procurement subject from the user message and create a descriptive name. For "industrial use alcohol" create "Industrial Use Alcohol RFP". For "floor tiles" create "Floor Tiles RFP". NEVER use generic names like "New RFP".',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'REQUIRED: Descriptive RFP name based on what is being procured. Extract from user message: "industrial use alcohol" → "Industrial Use Alcohol RFP", "LED bulbs" → "LED Bulbs RFP", "office supplies" → "Office Supplies RFP". Must include the procurement subject + "RFP".'
        },
        description: {
          type: 'string',
          description: 'Detailed description of what is being procured and why'
        },
        specification: {
          type: 'string',
          description: 'Technical specifications or requirements if known'
        },
        due_date: {
          type: 'string',
          description: 'Optional due date in YYYY-MM-DD format'
        }
      },
      required: ['name']
    }
  },
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
          description: 'Form schema object containing fields, structure, and validation rules'
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
  },
  {
    name: 'get_available_agents',
    description: 'Get all available agents with their IDs and details. Call this when users ask about agents, agent lists, available agents, or similar questions. CRITICAL: Always display the \'formatted_agent_list\' field from the response to show users the agent IDs they need for switching.',
    input_schema: {
      type: 'object',
      properties: {
        include_restricted: {
          type: 'boolean',
          description: 'Whether to include restricted/premium agents (default: false)',
          default: false
        }
      }
    }
  },
  {
    name: 'get_current_agent',
    description: 'Get the currently active agent for a specific session',
    input_schema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The UUID of the session to get the current agent for'
        }
      },
      required: ['session_id']
    }
  },
  {
    name: 'switch_agent',
    description: 'Switch to a different AI agent. Extract agent name from user request: "switch to the rfp designer" → agent_name: "RFP Designer", "switch to solutions" → agent_name: "Solutions", "switch to support" → agent_name: "Support". Include user context to help the new agent understand the request.',
    input_schema: {
      type: 'object',
      properties: {
        agent_name: {
          type: 'string',
          description: 'REQUIRED: Extract exact agent name. Map user input to exact enum value: "rfp designer/design" → "RFP Designer", "solutions/sales" → "Solutions", "support/help" → "Support"',
          enum: ['RFP Designer', 'Solutions', 'Support', 'Technical Support', 'RFP Assistant']
        },
        user_input: {
          type: 'string',
          description: 'The original user request that prompted the agent switch (e.g., "I need to source floor tile", "create an RFP for office supplies")'
        },
        reason: {
          type: 'string',
          description: 'Brief reason for switching agents (e.g., "User needs RFP creation assistance", "User requires technical support")'
        }
      },
      required: ['agent_name']
    }
  },
  {
    name: 'debug_agent_switch',
    description: 'Test tool: When user asks to switch agents but you cannot determine which agent they want, use this to debug parameter extraction',
    input_schema: {
      type: 'object',
      properties: {
        user_input: {
          type: 'string',
          description: 'The exact user input about switching agents'
        },
        extracted_keywords: {
          type: 'string',
          description: 'What keywords you found in the input (e.g., "rfp", "designer", "support")'
        },
        confusion_reason: {
          type: 'string',
          description: 'Why you cannot determine the target agent'
        }
      },
      required: ['user_input', 'extracted_keywords', 'confusion_reason']
    }
  },
  {
    name: 'recommend_agent',
    description: 'Recommend the best agent for handling a specific topic or user request',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic or user request to find the best agent for'
        },
        conversation_context: {
          type: 'string',
          description: 'Optional context from the current conversation'
        }
      },
      required: ['topic']
    }
  }
];

// Define role-based tool restrictions
const ROLE_TOOL_RESTRICTIONS: Record<string, { allowed?: string[]; blocked?: string[] }> = {
  'sales': {
    // Solutions agent (sales role) should NOT create RFPs directly - must switch to RFP Designer
    blocked: ['create_and_set_rfp', 'create_form_artifact']
  },
  'design': {
    // RFP Designer has access to all RFP creation tools
    allowed: ['create_and_set_rfp', 'create_form_artifact', 'switch_agent', 'get_available_agents', 'get_conversation_history', 'store_message', 'create_session', 'search_messages', 'get_current_agent', 'debug_agent_switch', 'recommend_agent']
  },
  'support': {
    // Support agents don't need RFP creation tools
    blocked: ['create_and_set_rfp', 'create_form_artifact']
  }
};

// Get tool definitions for Claude API, filtered by agent role
export function getToolDefinitions(agentRole?: string): ClaudeToolDefinition[] {
  console.log(`🔍 getToolDefinitions called with agentRole: '${agentRole}'`);
  console.log(`🔍 Type of agentRole: ${typeof agentRole}`);
  
  if (!agentRole) {
    console.log(`⚠️ No agent role provided, returning ALL ${TOOL_DEFINITIONS.length} tools`);
    return TOOL_DEFINITIONS; // Return all tools if no role specified
  }

  const restrictions = ROLE_TOOL_RESTRICTIONS[agentRole];
  if (!restrictions) {
    console.log(`⚠️ No restrictions found for role '${agentRole}', returning ALL ${TOOL_DEFINITIONS.length} tools`);
    return TOOL_DEFINITIONS; // Return all tools if role not found
  }

  console.log(`🔒 Found restrictions for role '${agentRole}':`, restrictions);

  const filteredTools = TOOL_DEFINITIONS.filter(tool => {
    // If there's an allowed list, only include tools in that list
    if (restrictions.allowed) {
      const allowed = restrictions.allowed.includes(tool.name);
      console.log(`✓ Tool '${tool.name}' allowed: ${allowed}`);
      return allowed;
    }
    
    // If there's a blocked list, exclude tools in that list
    if (restrictions.blocked) {
      const blocked = restrictions.blocked.includes(tool.name);
      console.log(`❌ Tool '${tool.name}' blocked: ${blocked}`);
      return !blocked;
    }
    
    console.log(`✓ Tool '${tool.name}' included (no restrictions)`);
    return true; // Include tool if no restrictions apply
  });

  console.log(`🔧 Filtered tools for role '${agentRole}': [${filteredTools.map(t => t.name).join(', ')}]`);
  console.log(`📊 Tool count: ${filteredTools.length} out of ${TOOL_DEFINITIONS.length} total tools`);
  return filteredTools;
}

// Validate tool call input against schema
export function validateToolInput(toolName: string, input: Record<string, unknown>): boolean {
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
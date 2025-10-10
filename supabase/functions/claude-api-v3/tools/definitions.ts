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
    name: 'create_document_artifact',
    description: 'Create a document artifact (text document, RFP document, etc.) and store it in the database',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name/title of the document artifact'
        },
        description: {
          type: 'string',
          description: 'Description of the document artifact'
        },
        content: {
          type: 'string',
          description: 'The text content of the document (markdown, plain text, etc.)'
        },
        content_type: {
          type: 'string',
          description: 'Content type of the document',
          enum: ['markdown', 'plain', 'html'],
          default: 'markdown'
        },
        artifactRole: {
          type: 'string',
          description: 'Role/type of the document artifact',
          enum: [
            'request_document',
            'rfp_document',
            'proposal_document',
            'specification_document',
            'contract_document',
            'report_document',
            'template',
            'other_document'
          ]
        },
        tags: {
          type: 'array',
          description: 'Optional tags for categorizing the document'
        }
      },
      required: ['name', 'content', 'artifactRole']
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
    description: 'Store a message in the conversation history with optional metadata for tool execution tracking',
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
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata for tool execution tracking (functions_called, agent_id, model, etc.)'
        }
      },
      required: ['sender', 'content']
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
    description: 'Switch to a different AI agent. CRITICAL: You MUST provide agent_name parameter. WORKFLOW: When user needs procurement/sourcing/RFP creation (keywords: source, buy, purchase, procure, RFP, equipment, supplies, computers, etc.), use agent_name: "RFP Design". For sales questions about our platform, use agent_name: "Solutions". For technical help, use agent_name: "Technical Support".',
    input_schema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'The UUID of the session to switch agents in'
        },
        agent_name: {
          type: 'string',
          description: 'The name of the agent to switch to. Use "RFP Design" for RFP creation, "Solutions" for sales questions, "Support" for help.',
          enum: ['RFP Design', 'Solutions', 'Support', 'Technical Support', 'RFP Assistant']
        },
        agent_id: {
          type: 'string',
          description: 'Alternative: The UUID of the agent to switch to (use either agent_name or agent_id)'
        },
        user_input: {
          type: 'string',
          description: 'The original user request that triggered the agent switch. This context will be passed to the new agent to continue assisting with the request.'
        },
        reason: {
          type: 'string',
          description: 'Optional reason for switching agents'
        }
      },
      required: ['session_id', 'agent_name']
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
  },
  {
    name: 'list_artifacts',
    description: 'List artifacts with optional scope filtering. Use all_artifacts=true to get all artifacts for the account, or leave false (default) to get only session artifacts.',
    input_schema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Session ID to get artifacts for (optional, uses current session if not provided)'
        },
        all_artifacts: {
          type: 'boolean',
          description: 'If true, lists all artifacts for the account. If false (default), lists only artifacts for the specified session.',
          default: false
        },
        artifact_type: {
          type: 'string',
          description: 'Optional filter by artifact type (form, document, text, etc.)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of artifacts to return',
          default: 50
        }
      }
    }
  },
  {
    name: 'get_current_artifact_id',
    description: 'Get the ID of the currently selected artifact in the artifact window',
    input_schema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Session ID to get current artifact for (optional, uses current session if not provided)'
        }
      }
    }
  },
  {
    name: 'select_active_artifact',
    description: 'Select an artifact to be displayed in the artifact window. This will change what artifact is currently shown to the user.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_id: {
          type: 'string',
          description: 'The ID of the artifact to select and display'
        },
        session_id: {
          type: 'string',
          description: 'Session ID to set the artifact for (optional, uses current session if not provided)'
        }
      },
      required: ['artifact_id']
    }
  },
  {
    name: 'update_form_data',
    description: 'Update the form data (default_values) for an existing form artifact. This populates the form with sample or real data while keeping the schema intact. Use this to fill forms with test data or update existing form values. Can accept either a UUID or form name.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_id: {
          type: 'string',
          description: 'ID or name of the form artifact to update. Can be a UUID (preferred) or a form name like "LED Lighting Requirements". The function will intelligently resolve names to IDs.'
        },
        session_id: {
          type: 'string',
          description: 'Current session ID for context'
        },
        form_data: {
          type: 'object',
          description: 'Complete form data object with field names matching the form schema. This will replace the current default_values completely.'
        }
      },
      required: ['artifact_id', 'session_id', 'form_data']
    }
  },
  {
    name: 'update_form_artifact',
    description: 'Update an existing form artifact with new data or schema. CRITICAL: When updating default_values, you MUST use the exact field names from the existing form schema.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_id: {
          type: 'string',
          description: 'ID of the artifact to update'
        },
        updates: {
          type: 'object',
          description: 'Updates to apply to the artifact. For default_values, field names must EXACTLY match the schema properties. This is a nested object containing form updates.'
        }
      },
      required: ['artifact_id', 'updates']
    }
  },
  {
    name: 'submit_bid',
    description: 'Submit a bid to create a permanent bid record. Can be used in two ways: (1) With artifact_id to submit from a form artifact, or (2) Directly with supplier_name, bid_price, and delivery_days for quick bid submission without a form.',
    input_schema: {
      type: 'object',
      properties: {
        rfp_id: {
          type: 'number',
          description: 'ID of the RFP this bid is for'
        },
        artifact_id: {
          type: 'string',
          description: 'Optional: ID of the form artifact containing the bid data (for form-based submission)'
        },
        supplier_id: {
          type: 'number',
          description: 'Optional: ID of the supplier submitting the bid'
        },
        form_data: {
          type: 'object',
          description: 'Optional: Form data to save before submission (used with artifact_id)'
        },
        supplier_name: {
          type: 'string',
          description: 'Optional: Company/supplier name for direct bid submission (when no artifact_id)'
        },
        bid_price: {
          type: 'number',
          description: 'Optional: Bid amount in dollars for direct submission (when no artifact_id)'
        },
        delivery_days: {
          type: 'number',
          description: 'Optional: Number of days for delivery for direct submission (when no artifact_id)'
        }
      },
      required: ['rfp_id']
    }
  },
  {
    name: 'get_rfp_bids',
    description: 'Get all bids for a specific RFP with their current status and details',
    input_schema: {
      type: 'object',
      properties: {
        rfp_id: {
          type: 'number',
          description: 'ID of the RFP to get bids for'
        }
      },
      required: ['rfp_id']
    }
  },
  {
    name: 'update_bid_status',
    description: 'Update the status of a bid (draft, submitted, under_review, accepted, rejected)',
    input_schema: {
      type: 'object',
      properties: {
        bid_id: {
          type: 'number',
          description: 'ID of the bid to update'
        },
        status: {
          type: 'string',
          description: 'New status: draft, submitted, under_review, accepted, rejected'
        },
        status_reason: {
          type: 'string',
          description: 'Optional: Reason for the status change'
        },
        reviewer_id: {
          type: 'string',
          description: 'Optional: ID of the person making the status change'
        },
        score: {
          type: 'number',
          description: 'Optional: Score for the bid (0-100)'
        }
      },
      required: ['bid_id', 'status']
    }
  },
  {
    name: 'create_memory',
    description: 'Store important information about user preferences, decisions, facts, or context that should be remembered for future interactions. Use this when users explicitly state preferences, make important decisions, or share information that will be relevant later. ALWAYS create memories when users say "prefer", "always", "never", "for all future", "remember this", etc.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The memory content to store (clear, concise description of what to remember)'
        },
        memory_type: {
          type: 'string',
          description: 'Type of memory: "preference"=user likes/dislikes/requirements, "fact"=important info about user/organization, "decision"=choices made during conversation, "context"=RFP/bid details, "conversation"=notable conversation snippets'
        },
        importance_score: {
          type: 'number',
          description: 'Importance score 0.0-1.0. Use 0.9 for explicit preferences ("I always prefer..."), 0.7 for decisions, 0.5 for context, 0.3 for conversation notes'
        },
        reference_type: {
          type: 'string',
          description: 'Optional: What this memory relates to: "rfp", "bid", "artifact", "message", "user_profile"'
        },
        reference_id: {
          type: 'string',
          description: 'Optional: UUID of the related entity (RFP ID, bid ID, etc.)'
        }
      },
      required: ['content', 'memory_type', 'importance_score']
    }
  },
  {
    name: 'search_memories',
    description: 'Search for relevant memories from past conversations to provide personalized, context-aware responses. Use when starting new sessions, when user refers to past preferences, or when needing to recall user context. Returns semantically similar memories.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query describing what to look for (e.g., "vendor preferences", "budget constraints", "LED lighting requirements")'
        },
        memory_types: {
          type: 'string',
          description: 'Optional: Comma-separated memory types to filter by: "preference,fact" or "decision" or "context,conversation"'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of memories to return (default 10, max 20)'
        }
      },
      required: ['query']
    }
  }
];

// Define role-based tool restrictions
const ROLE_TOOL_RESTRICTIONS: Record<string, { allowed?: string[]; blocked?: string[] }> = {
  'sales': {
    // Solutions agent (sales role) can now create forms and documents but should NOT create RFPs directly - must switch to RFP Design for RFP creation
    blocked: ['create_and_set_rfp']
  },
  'design': {
    // RFP Design has access to all RFP creation tools and memory tools - REMOVED switch_agent to prevent self-switching loops
    allowed: ['create_and_set_rfp', 'create_form_artifact', 'create_document_artifact', 'update_form_data', 'update_form_artifact', 'get_available_agents', 'get_conversation_history', 'store_message', 'search_messages', 'get_current_agent', 'debug_agent_switch', 'recommend_agent', 'create_memory', 'search_memories']
  },
  'support': {
    // Support agents don't need RFP creation tools but can create documents
    blocked: ['create_and_set_rfp', 'create_form_artifact']
  }
};

// Get tool definitions for Claude API, filtered by agent role
export function getToolDefinitions(agentRole?: string): ClaudeToolDefinition[] {
  console.log(`🔍 getToolDefinitions called with agentRole: '${agentRole}'`);
  console.log(`🔍 Type of agentRole: ${typeof agentRole}`);
  console.log(`🔍 ROLE_TOOL_RESTRICTIONS keys:`, Object.keys(ROLE_TOOL_RESTRICTIONS));
  console.log(`🔍 Looking for restrictions for role '${agentRole}':`, ROLE_TOOL_RESTRICTIONS[agentRole || '']);
  
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
    console.log(`🧪 FILTERING TOOL: ${tool.name} for role ${agentRole}`);
    
    // 🚨 ABSOLUTE BLOCK: Never allow switch_agent for design role - THIS IS THE MAIN FIX
    if (agentRole === 'design' && tool.name === 'switch_agent') {
      console.log(`🚨 ABSOLUTE BLOCK: Preventing switch_agent for design role - this should work!`);
      return false;
    }
    
    // If there's an allowed list, only include tools in that list
    if (restrictions.allowed) {
      const allowed = restrictions.allowed.includes(tool.name);
      console.log(`✓ Tool '${tool.name}' allowed: ${allowed} (in allowed list)`);
      return allowed;
    }
    
    // If there's a blocked list, exclude tools in that list
    if (restrictions.blocked) {
      const blocked = restrictions.blocked.includes(tool.name);
      console.log(`❌ Tool '${tool.name}' blocked: ${blocked} (in blocked list)`);
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
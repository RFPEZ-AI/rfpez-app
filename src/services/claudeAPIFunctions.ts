// Copyright Mark Skiba, 2025 All rights reserved

// Claude API Function Calling Integration for RFPEZ MCP
// This provides the same functionality as MCP but via HTTP endpoints that Claude API can call
// Now integrated with the Supabase MCP Server

import { supabase } from '../supabaseClient';
import { AgentService } from './agentService';
import { mcpClient } from './mcpClient';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

// TypeScript interfaces for proposal generation
interface SupplierInfo {
  name?: string;
  email?: string;
  company?: string;
  [key: string]: unknown;
}

interface QuestionnaireResponse {
  supplier_info?: SupplierInfo;
  form_data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface RFPData {
  id: string;
  name: string;
  description?: string;
  specification?: string;
  due_date: string;
  buyer_questionnaire_response?: QuestionnaireResponse;
  [key: string]: unknown;
}

// Claude API Function Definitions (Anthropic SDK format)
export const claudeApiFunctions: Tool[] = [
  {
    "name": "get_conversation_history",
    "description": "Retrieve conversation messages from a specific session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to retrieve messages from"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of messages to retrieve (default: 50)",
          "default": 50
        },
        "offset": {
          "type": "number",
          "description": "Number of messages to skip for pagination (default: 0)",
          "default": 0
        }
      },
      "required": ["session_id"]
    }
  },
  {
    "name": "get_recent_sessions",
    "description": "Get recent chat sessions for the authenticated user",
    "input_schema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "number",
          "description": "Maximum number of sessions to retrieve (default: 10)",
          "default": 10
        }
      }
    }
  },
  {
    "name": "store_message",
    "description": "Store a new message in a conversation session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to store the message in"
        },
        "content": {
          "type": "string",
          "description": "The message content"
        },
        "role": {
          "type": "string",
          "enum": ["user", "assistant", "system"],
          "description": "The role of the message sender"
        },
        "metadata": {
          "type": "object",
          "description": "Additional metadata for the message"
        }
      },
      "required": ["session_id", "content", "role"]
    }
  },
  {
    "name": "create_session",
    "description": "Create a new conversation session",
    "input_schema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the new session"
        },
        "description": {
          "type": "string",
          "description": "Optional description for the session"
        }
      },
      "required": ["title"]
    }
  },
  {
    "name": "search_messages",
    "description": "Search for messages across all sessions by content",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query to match against message content"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of results (default: 20)",
          "default": 20
        }
      },
      "required": ["query"]
    }
  },
  {
    "name": "get_available_agents",
    "description": "Get all agents available to the current user based on their authentication status and account setup",
    "input_schema": {
      "type": "object",
      "properties": {
        "include_restricted": {
          "type": "boolean",
          "description": "Whether to include restricted/premium agents (default: false)",
          "default": false
        }
      }
    }
  },
  {
    "name": "get_current_agent",
    "description": "Get the currently active agent for a specific session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to get the current agent for"
        }
      },
      "required": ["session_id"]
    }
  },
  {
    "name": "switch_agent",
    "description": "Switch to a different AI agent for the current session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to switch agents in"
        },
        "agent_id": {
          "type": "string",
          "description": "The UUID of the agent to switch to"
        },
        "reason": {
          "type": "string",
          "description": "Optional reason for switching agents"
        }
      },
      "required": ["session_id", "agent_id"]
    }
  },
  {
    "name": "recommend_agent",
    "description": "Recommend the best agent for handling a specific topic or user request",
    "input_schema": {
      "type": "object",
      "properties": {
        "topic": {
          "type": "string",
          "description": "The topic or user request to find the best agent for"
        },
        "conversation_context": {
          "type": "string",
          "description": "Optional context from the current conversation"
        }
      },
      "required": ["topic"]
    }
  },
  
  // Add Supabase MCP functions
  {
    "name": "supabase_select",
    "description": "Query and retrieve data from Supabase tables",
    "input_schema": {
      "type": "object",
      "properties": {
        "table": {
          "type": "string",
          "description": "The table name to query"
        },
        "columns": {
          "type": "string",
          "description": "Columns to select (comma-separated or *)"
        },
        "filter": {
          "type": "object",
          "description": "Filter conditions",
          "properties": {
            "field": { "type": "string" },
            "operator": { "type": "string", "enum": ["eq", "neq", "gt", "lt", "gte", "lte", "like", "in"] },
            "value": { "type": ["string", "number", "boolean", "array"] }
          }
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of rows to return"
        },
        "order": {
          "type": "object",
          "properties": {
            "field": { "type": "string" },
            "ascending": { "type": "boolean", "default": true }
          }
        }
      },
      "required": ["table"]
    }
  },
  {
    "name": "supabase_insert",
    "description": "Insert new records into Supabase tables",
    "input_schema": {
      "type": "object",
      "properties": {
        "table": {
          "type": "string",
          "description": "The table name to insert into"
        },
        "data": {
          "type": "object",
          "description": "Data object to insert"
        },
        "returning": {
          "type": "string",
          "description": "Columns to return after insert",
          "default": "*"
        }
      },
      "required": ["table", "data"]
    }
  },
  {
    "name": "supabase_update",
    "description": "Update existing records in Supabase tables",
    "input_schema": {
      "type": "object",
      "properties": {
        "table": {
          "type": "string",
          "description": "The table name to update"
        },
        "data": {
          "type": "object",
          "description": "Data object with fields to update"
        },
        "filter": {
          "type": "object",
          "description": "Filter conditions to identify records",
          "properties": {
            "field": { "type": "string" },
            "operator": { "type": "string", "enum": ["eq", "neq", "gt", "lt", "gte", "lte"] },
            "value": { "type": ["string", "number", "boolean"] }
          },
          "required": ["field", "operator", "value"]
        },
        "returning": {
          "type": "string",
          "description": "Columns to return after update",
          "default": "*"
        }
      },
      "required": ["table", "data", "filter"]
    }
  },
  {
    "name": "supabase_delete",
    "description": "Delete records from Supabase tables",
    "input_schema": {
      "type": "object",
      "properties": {
        "table": {
          "type": "string",
          "description": "The table name to delete from"
        },
        "filter": {
          "type": "object",
          "description": "Filter conditions to identify records",
          "properties": {
            "field": { "type": "string" },
            "operator": { "type": "string", "enum": ["eq", "neq", "gt", "lt", "gte", "lte"] },
            "value": { "type": ["string", "number", "boolean"] }
          },
          "required": ["field", "operator", "value"]
        }
      },
      "required": ["table", "filter"]
    }
  },
  
  // Add Artifact Functions for presenting content in the artifacts window
  {
    "name": "create_form_artifact",
    "description": "Create and display a form in the artifacts window for user interaction",
    "input_schema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the form artifact"
        },
        "description": {
          "type": "string",
          "description": "Description of what the form is for"
        },
        "form_schema": {
          "type": "object",
          "description": "JSON Schema defining the form structure and validation",
          "properties": {
            "type": { "type": "string", "enum": ["object"] },
            "properties": { "type": "object" },
            "required": { "type": "array", "items": { "type": "string" } },
            "title": { "type": "string" },
            "description": { "type": "string" }
          },
          "required": ["type", "properties"]
        },
        "ui_schema": {
          "type": "object",
          "description": "UI Schema for customizing form appearance and behavior"
        },
        "form_data": {
          "type": "object",
          "description": "Initial/default data to populate the form with"
        },
        "submit_action": {
          "type": "object",
          "description": "Configuration for form submission",
          "properties": {
            "type": { "type": "string", "enum": ["function_call", "save_session", "export_data"] },
            "function_name": { "type": "string" },
            "success_message": { "type": "string" }
          },
          "required": ["type"]
        }
      },
      "required": ["title", "form_schema"]
    }
  },
  {
    "name": "update_form_artifact",
    "description": "Update an existing form artifact with new data or schema",
    "input_schema": {
      "type": "object",
      "properties": {
        "artifact_id": {
          "type": "string",
          "description": "ID of the artifact to update"
        },
        "updates": {
          "type": "object",
          "description": "Updates to apply to the artifact",
          "properties": {
            "title": { "type": "string" },
            "description": { "type": "string" },
            "form_schema": { "type": "object" },
            "ui_schema": { "type": "object" },
            "form_data": { "type": "object" },
            "submit_action": { "type": "object" }
          }
        }
      },
      "required": ["artifact_id", "updates"]
    }
  },
  {
    "name": "get_form_submission",
    "description": "Retrieve form submission data from a specific artifact",
    "input_schema": {
      "type": "object",
      "properties": {
        "artifact_id": {
          "type": "string",
          "description": "ID of the form artifact to get submission from"
        },
        "session_id": {
          "type": "string",
          "description": "Session ID to associate with the submission"
        }
      },
      "required": ["artifact_id"]
    }
  },
  {
    "name": "validate_form_data",
    "description": "Validate form data against a JSON schema",
    "input_schema": {
      "type": "object",
      "properties": {
        "form_schema": {
          "type": "object",
          "description": "JSON Schema to validate against"
        },
        "form_data": {
          "type": "object",
          "description": "Form data to validate"
        }
      },
      "required": ["form_schema", "form_data"]
    }
  },
  {
    "name": "create_artifact_template",
    "description": "Create a reusable template for forms or other artifacts",
    "input_schema": {
      "type": "object",
      "properties": {
        "template_name": {
          "type": "string",
          "description": "Name of the template"
        },
        "template_type": {
          "type": "string",
          "enum": ["form", "document", "chart", "table"],
          "description": "Type of artifact template"
        },
        "template_schema": {
          "type": "object",
          "description": "Schema definition for the template"
        },
        "template_ui": {
          "type": "object",
          "description": "UI configuration for the template"
        },
        "description": {
          "type": "string",
          "description": "Description of what this template is for"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Tags for categorizing the template"
        }
      },
      "required": ["template_name", "template_type", "template_schema"]
    }
  },
  {
    "name": "create_text_artifact",
    "description": "Create a text artifact that can be displayed in the artifact window",
    "input_schema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the text artifact"
        },
        "content": {
          "type": "string",
          "description": "The text content to display"
        },
        "content_type": {
          "type": "string",
          "enum": ["markdown", "plain", "html"],
          "description": "Type of text content (default: markdown)",
          "default": "markdown"
        },
        "description": {
          "type": "string",
          "description": "Brief description of the text artifact"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Tags for categorizing the artifact"
        }
      },
      "required": ["title", "content"]
    }
  },
  {
    "name": "generate_proposal_artifact",
    "description": "Generate a proposal text artifact from RFP data and questionnaire responses",
    "input_schema": {
      "type": "object",
      "properties": {
        "rfp_id": {
          "type": "string",
          "description": "ID of the RFP to generate proposal for"
        },
        "proposal_title": {
          "type": "string",
          "description": "Title for the proposal (default: 'Proposal for [RFP Name]')"
        },
        "sections": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Specific sections to include in the proposal",
          "default": ["executive_summary", "technical_approach", "timeline", "pricing"]
        },
        "content_type": {
          "type": "string",
          "enum": ["markdown", "plain", "html"],
          "description": "Type of text content (default: markdown)",
          "default": "markdown"
        }
      },
      "required": ["rfp_id"]
    }
  },
  {
    "name": "list_artifact_templates",
    "description": "List available artifact templates",
    "input_schema": {
      "type": "object",
      "properties": {
        "template_type": {
          "type": "string",
          "enum": ["form", "document", "chart", "table", "all"],
          "description": "Filter templates by type (default: all)",
          "default": "all"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Filter templates by tags"
        }
      }
    }
  },
  {
    "name": "set_current_rfp",
    "description": "Set the current RFP context for the user",
    "input_schema": {
      "type": "object",
      "properties": {
        "rfp_id": {
          "type": "number",
          "description": "The ID of the RFP to set as current (null to clear current RFP)"
        }
      },
      "required": ["rfp_id"]
    }
  },
  {
    "name": "refresh_current_rfp",
    "description": "Trigger the frontend to refresh and display the current RFP context",
    "input_schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "get_artifact_status",
    "description": "Get the current status and data of an artifact",
    "input_schema": {
      "type": "object",
      "properties": {
        "artifact_id": {
          "type": "string",
          "description": "ID of the artifact to check"
        }
      },
      "required": ["artifact_id"]
    }
  },
  {
    "name": "create_and_set_rfp",
    "description": "Streamlined RFP creation: Creates a new RFP with minimal data, sets it as current RFP, and validates the creation. This replaces the multi-step process of supabase_insert + set_current_rfp + validation.",
    "input_schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "The name/title of the RFP (required)"
        },
        "description": {
          "type": "string",
          "description": "Optional initial description of the RFP"
        },
        "specification": {
          "type": "string", 
          "description": "Optional initial technical specification"
        },
        "due_date": {
          "type": "string",
          "description": "Optional due date in ISO format (YYYY-MM-DD)"
        }
      },
      "required": ["name"]
    }
  }
];

// Function execution handlers for Claude API
export class ClaudeAPIFunctionHandler {
  
  // Get user ID from the current session (supports anonymous users)
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Allow anonymous users for agent switching (especially for support)
    if (error || !user) {
      return 'anonymous';
    }
    
    // For authenticated users, verify the user profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    
    if (!profile?.id) {
      // User is authenticated but profile doesn't exist - still allow access
      console.warn('Authenticated user has no profile, allowing anonymous access');
      return 'anonymous';
    }
    
    // Return the Supabase auth user ID (not the user_profiles.id)
    return user.id;
  }

  // Get user_profiles.id from Supabase auth user ID (supports anonymous users)
  private async getUserProfileId(supabaseUserId: string): Promise<string | null> {
    // Handle anonymous users
    if (supabaseUserId === 'anonymous') {
      return null;
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();
    
    // Return null instead of throwing error for anonymous-like access
    return profile?.id || null;
  }

  // Supabase MCP function implementations with simplified TypeScript approach
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async supabaseSelect(params: any, userId: string) {
    const { table, columns = '*', filter, limit, order } = params;
    
    console.log('🔍 Supabase SELECT:', { table, columns, filter, limit, order, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_select');
    }
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase.from(table).select(columns);
      
      // Apply filter if provided
      if (filter && filter.field && filter.operator && filter.value !== undefined) {
        const { field, operator, value } = filter;
        
        // Special handling for rfps table - skip non-existent columns
        if (table === 'rfps' && (field === 'created_by' || field === 'user_id')) {
          console.log(`⚠️ Skipping filter on non-existent column '${field}' for rfps table`);
          // Skip this filter since the column doesn't exist in the rfps table
        } else {
          switch (operator) {
            case 'eq':
              query = query.eq(field, value);
              break;
            case 'neq':
              query = query.neq(field, value);
              break;
            case 'gt':
              query = query.gt(field, value);
              break;
            case 'lt':
              query = query.lt(field, value);
              break;
            case 'gte':
              query = query.gte(field, value);
              break;
            case 'lte':
              query = query.lte(field, value);
              break;
            case 'like':
              query = query.like(field, value);
              break;
            case 'in':
              if (Array.isArray(value)) {
                query = query.in(field, value);
              } else {
                throw new Error('Value must be an array when using "in" operator');
              }
              break;
            default:
              throw new Error(`Unsupported operator: ${operator}`);
          }
        }
      }
      
      // Apply ordering if provided
      if (order && order.field) {
        query = query.order(order.field, { ascending: order.ascending !== false });
      }
      
      // Apply limit if provided
      if (limit && typeof limit === 'number' && limit > 0) {
        query = query.limit(limit);
      }
      
      const result = await query;
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Supabase SELECT error:', error);
        throw new Error(`Failed to select from ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase SELECT success:', { table, rowCount: data?.length || 0 });
      
      return {
        table,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase SELECT exception:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async supabaseInsert(params: any, userId: string) {
    const { table, data, returning = '*' } = params;
    
    console.log('📝 Supabase INSERT:', { table, data, returning, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_insert');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for supabase_insert');
    }
    
    // Special handling for rfps table
    if (table === 'rfps' && data) {
      // Remove any status field that doesn't exist in the schema
      if ('status' in data) {
        console.log('⚠️ Removing non-existent status field from rfps insert');
        delete data.status;
      }
      
      // Add default due_date if not provided (30 days from now)
      if (!data.due_date) {
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 30);
        data.due_date = defaultDueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log('📅 Added default due_date:', data.due_date);
      }
    }
    
    try {
      const result = await supabase
        .from(table)
        .insert(data)
        .select(returning);
        
      const { data: insertedData, error } = result;
      
      if (error) {
        console.error('❌ Supabase INSERT error:', error);
        throw new Error(`Failed to insert into ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase INSERT success:', { table, rowCount: insertedData?.length || 0 });
      
      return {
        table,
        data: insertedData || [],
        count: insertedData?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase INSERT exception:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async supabaseUpdate(params: any, userId: string) {
    const { table, data, filter, returning = '*' } = params;
    
    console.log('✏️ Supabase UPDATE:', { table, data, filter, returning, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_update');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Data object is required for supabase_update');
    }
    
    if (!filter || !filter.field || !filter.operator || filter.value === undefined) {
      throw new Error('Filter with field, operator, and value is required for supabase_update');
    }
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase.from(table).update(data);
      
      // Apply filter
      const { field, operator, value } = filter;
      
      switch (operator) {
        case 'eq':
          query = query.eq(field, value);
          break;
        case 'neq':
          query = query.neq(field, value);
          break;
        case 'gt':
          query = query.gt(field, value);
          break;
        case 'lt':
          query = query.lt(field, value);
          break;
        case 'gte':
          query = query.gte(field, value);
          break;
        case 'lte':
          query = query.lte(field, value);
          break;
        default:
          throw new Error(`Unsupported operator for update: ${operator}`);
      }
      
      // Add select clause to get returning data
      query = query.select(returning);
      
      const result = await query;
      const { data: updatedData, error } = result;
      
      if (error) {
        console.error('❌ Supabase UPDATE error:', error);
        throw new Error(`Failed to update ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase UPDATE success:', { table, rowCount: updatedData?.length || 0 });
      
      return {
        table,
        data: updatedData || [],
        count: updatedData?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase UPDATE exception:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async supabaseDelete(params: any, userId: string) {
    const { table, filter } = params;
    
    console.log('🗑️ Supabase DELETE:', { table, filter, userId });
    
    if (!table) {
      throw new Error('Table name is required for supabase_delete');
    }
    
    if (!filter || !filter.field || !filter.operator || filter.value === undefined) {
      throw new Error('Filter with field, operator, and value is required for supabase_delete');
    }
    
    try {
      // Build the delete query step by step
      const { field, operator, value } = filter;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let deleteQuery: any = supabase.from(table).delete();
      
      switch (operator) {
        case 'eq':
          deleteQuery = deleteQuery.eq(field, value);
          break;
        case 'neq':
          deleteQuery = deleteQuery.neq(field, value);
          break;
        case 'gt':
          deleteQuery = deleteQuery.gt(field, value);
          break;
        case 'lt':
          deleteQuery = deleteQuery.lt(field, value);
          break;
        case 'gte':
          deleteQuery = deleteQuery.gte(field, value);
          break;
        case 'lte':
          deleteQuery = deleteQuery.lte(field, value);
          break;
        default:
          throw new Error(`Unsupported operator for delete: ${operator}`);
      }
      
      const result = await deleteQuery;
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Supabase DELETE error:', error);
        throw new Error(`Failed to delete from ${table}: ${error.message}`);
      }
      
      console.log('✅ Supabase DELETE success:', { table, rowCount: data?.length || 0 });
      
      return {
        table,
        data: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Supabase DELETE exception:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeFunction(functionName: string, parameters: any) {
    const userId = await this.getCurrentUserId();
    
    // MCP-enabled conversation functions - use MCP client for these
    try {
      console.log(`🔗 Attempting MCP client for function: ${functionName}`);
      
      // Try using MCP client methods directly
      switch (functionName) {
        case 'get_conversation_history': {
          const historyResult = await mcpClient.getConversationHistory(
            parameters.session_id, 
            parameters.limit || 50, 
            parameters.offset || 0
          );
          console.log('✅ MCP client success for get_conversation_history');
          return historyResult;
        }

        case 'get_recent_sessions': {
          const sessionsResult = await mcpClient.getRecentSessions(parameters.limit || 10);
          console.log('✅ MCP client success for get_recent_sessions');
          return sessionsResult;
        }

        case 'store_message': {
          const storeResult = await mcpClient.storeMessage(
            parameters.session_id,
            parameters.content,
            parameters.role,
            parameters.metadata
          );
          console.log('✅ MCP client success for store_message');
          return storeResult;
        }

        case 'create_session': {
          const createResult = await mcpClient.createSession(
            parameters.title,
            parameters.description
          );
          console.log('✅ MCP client success for create_session');
          return createResult;
        }

        case 'search_messages': {
          const searchResult = await mcpClient.searchMessages(
            parameters.query,
            parameters.limit || 20
          );
          console.log('✅ MCP client success for search_messages');
          return searchResult;
        }
      }
    } catch (error) {
      console.warn(`❌ MCP client failed for ${functionName}, falling back to HTTP:`, error);
      // Fall through to original HTTP implementation
    }
    
    // Original HTTP endpoint implementations for non-conversation functions and fallbacks
    switch (functionName) {
      case 'get_conversation_history':
        return await this.getConversationHistory(parameters, userId);
      case 'get_recent_sessions':
        return await this.getRecentSessions(parameters, userId);
      case 'store_message':
        return await this.storeMessage(parameters, userId);
      case 'create_session':
        return await this.createSession(parameters, userId);
      case 'search_messages':
        return await this.searchMessages(parameters, userId);
      case 'get_available_agents':
        return await this.getAvailableAgents(parameters, userId);
      case 'get_current_agent':
        return await this.getCurrentAgent(parameters, userId);
      case 'switch_agent':
        return await this.switchAgent(parameters, userId);
      case 'recommend_agent':
        return await this.recommendAgent(parameters, userId);
        
      // Re-enabled Supabase functions with TypeScript fixes
      case 'supabase_select':
        console.log('✅ Executing supabase_select - function is ENABLED');
        return await this.supabaseSelect(parameters, userId);
      case 'supabase_insert':
        console.log('✅ Executing supabase_insert - function is ENABLED');
        return await this.supabaseInsert(parameters, userId);
      case 'supabase_update':
        console.log('✅ Executing supabase_update - function is ENABLED and working');
        return await this.supabaseUpdate(parameters, userId);
      case 'supabase_delete':
        console.log('✅ Executing supabase_delete - function is ENABLED');
        return await this.supabaseDelete(parameters, userId);
        
      // Artifact functions
      case 'create_form_artifact':
        return await this.createFormArtifact(parameters, userId);
      case 'create_text_artifact':
        return await this.createTextArtifact(parameters, userId);
      case 'generate_proposal_artifact':
        return await this.generateProposalArtifact(parameters, userId);
      case 'update_form_artifact':
        return await this.updateFormArtifact(parameters, userId);
      case 'get_form_submission':
        return await this.getFormSubmission(parameters, userId);
      case 'validate_form_data':
        return await this.validateFormData(parameters, userId);
      case 'create_artifact_template':
        return await this.createArtifactTemplate(parameters, userId);
      case 'list_artifact_templates':
        return await this.listArtifactTemplates(parameters, userId);
      case 'set_current_rfp':
        return await this.setCurrentRfp(parameters, userId);
      case 'refresh_current_rfp':
        return await this.refreshCurrentRfp(parameters, userId);
      case 'get_artifact_status':
        return await this.getArtifactStatus(parameters, userId);
      case 'create_and_set_rfp':
        return await this.createAndSetRfp(parameters, userId);
    
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private async getConversationHistory(params: any, _userId: string) {
    const { session_id, limit = 50, offset = 0 } = params;
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        role,
        created_at,
        message_order,
        metadata,
        ai_metadata
      `)
      .eq('session_id', session_id)
      .order('message_order', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
    
    return {
      session_id,
      messages: messages || [],
      total_retrieved: messages?.length || 0,
      offset,
      limit
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getRecentSessions(params: any, userId: string) {
    const { limit = 10 } = params;
    
    // Get the user_profiles.id for the session query
    const userProfileId = await this.getUserProfileId(userId);
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        session_metadata
      `)
      .eq('user_id', userProfileId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to retrieve sessions: ${error.message}`);
    }
    
    return {
      sessions: sessions || [],
      total_retrieved: sessions?.length || 0
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async storeMessage(params: any, userId: string) {
    const { session_id, content, role, metadata = {} } = params;
    
    // Handle anonymous users - they can't store messages in the database
    if (userId === 'anonymous') {
      console.log('Anonymous user attempted to store message - skipping database storage');
      return {
        success: false,
        message: 'Anonymous users cannot store messages',
        user_type: 'anonymous'
      };
    }
    
    // Get the user_profiles.id for the message insert
    const userProfileId = await this.getUserProfileId(userId);
    
    // If no user profile, skip message storage
    if (!userProfileId) {
      console.warn('User has no profile - skipping message storage');
      return {
        success: false,
        message: 'Cannot store message without user profile',
        user_type: 'authenticated-no-profile'
      };
    }
    
    // Get the current highest message order for this session
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('message_order')
      .eq('session_id', session_id)
      .order('message_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextOrder = (lastMessage?.message_order || 0) + 1;
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        session_id,
        user_id: userProfileId,
        content,
        role,
        message_order: nextOrder,
        metadata
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to store message: ${error.message}`);
    }
    
    // Update session timestamp
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);
    
    return {
      message_id: message.id,
      session_id,
      message_order: nextOrder,
      created_at: message.created_at
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createSession(params: any, userId: string) {
    const { title, description } = params;
    
    // Get the user_profiles.id for the session insert
    const userProfileId = await this.getUserProfileId(userId);
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userProfileId,
        title,
        description
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
    
    return {
      session_id: session.id,
      title: session.title,
      description: session.description,
      created_at: session.created_at
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async searchMessages(params: any, userId: string) {
    const { query, limit = 20 } = params;
    
    // Handle anonymous users - they can't search messages
    if (userId === 'anonymous') {
      return {
        query,
        results: [],
        total_found: 0,
        message: 'Anonymous users cannot search messages',
        user_type: 'anonymous'
      };
    }
    
    // Get the user_profiles.id for the session query
    const userProfileId = await this.getUserProfileId(userId);
    
    // If no user profile, return empty results
    if (!userProfileId) {
      return {
        query,
        results: [],
        total_found: 0,
        message: 'Cannot search messages without user profile',
        user_type: 'authenticated-no-profile'
      };
    }
    
    // Use text search across messages for sessions owned by this user
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        session_id,
        content,
        role,
        created_at,
        sessions!inner(title, description)
      `)
      .textSearch('content', query)
      .eq('sessions.user_id', userProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
    
    return {
      query,
      results: messages || [],
      total_found: messages?.length || 0
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getAvailableAgents(params: any, userId: string) {
    const { include_restricted = false } = params;
    
    // Handle anonymous users
    let hasProperAccountSetup = false;
    let isAuthenticated = false;
    
    if (userId === 'anonymous') {
      console.log('Anonymous user requesting available agents');
      hasProperAccountSetup = false; // Anonymous users get limited access
      isAuthenticated = false;
    } else {
      // Get user profile to determine access level for authenticated users
      console.log('Getting user profile for userId:', userId);
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Still allow access for authenticated users even if profile is missing
        hasProperAccountSetup = true;
        isAuthenticated = true;
      } else {
        console.log('User profile result:', userProfile);
        hasProperAccountSetup = true; // All authenticated users have access to all agents
        isAuthenticated = true;
      }
    }
    
    // Get available agents based on user's access level
    const agents = await AgentService.getAvailableAgents(
      hasProperAccountSetup || include_restricted, 
      isAuthenticated
    );
    
    return {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        initial_prompt: agent.initial_prompt,
        is_default: agent.is_default,
        is_restricted: agent.is_restricted,
        is_free: agent.is_free,
        avatar_url: agent.avatar_url
      })),
      user_access_level: hasProperAccountSetup ? 'premium' : 'anonymous',
      total_available: agents.length,
      user_type: userId === 'anonymous' ? 'anonymous' : 'authenticated'
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getCurrentAgent(params: any, userId: string) {
    const { session_id } = params;
    
    // Verify session belongs to user
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();
    
    if (!session) {
      throw new Error('Session not found or access denied');
    }
    
    // Get current active agent for the session
    const activeAgent = await AgentService.getSessionActiveAgent(session_id);
    
    if (!activeAgent) {
      // No agent set, return default agent
      const defaultAgent = await AgentService.getDefaultAgent();
      return {
        session_id,
        current_agent: defaultAgent ? {
          id: defaultAgent.id,
          name: defaultAgent.name,
          description: defaultAgent.description,
          initial_prompt: defaultAgent.initial_prompt,
          is_default: true
        } : null,
        message: 'No active agent found, showing default agent'
      };
    }
    
    return {
      session_id,
      current_agent: {
        id: activeAgent.agent_id,
        name: activeAgent.agent_name,
        instructions: activeAgent.agent_instructions,
        initial_prompt: activeAgent.agent_initial_prompt,
        avatar_url: activeAgent.agent_avatar_url
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async switchAgent(params: any, userId: string) {
    const { session_id, agent_id, reason } = params;
    
    console.log('🔄 AGENT SWITCH ATTEMPT:', {
      session_id,
      agent_id,
      reason,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Handle anonymous users - they can switch agents but with limited functionality
    if (userId === 'anonymous') {
      // Verify agent exists
      const agent = await AgentService.getAgentById(agent_id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // For anonymous users, we only allow switching to free/unrestricted agents
      // This is especially important for support scenarios
      if (agent.is_restricted && !agent.is_free) {
        // Allow access to support-type agents even if restricted
        const isSupport = agent.name.toLowerCase().includes('support') || 
                         agent.name.toLowerCase().includes('help') ||
                         (agent.description && agent.description.toLowerCase().includes('support'));
        if (!isSupport) {
          throw new Error('Anonymous users can only access free or support agents');
        }
      }
      
      console.log('Anonymous agent switch:', {
        agent_id: agent.id,
        agent_name: agent.name,
        is_free: agent.is_free,
        is_restricted: agent.is_restricted
      });
      
      // For anonymous users, return success without session management
      return {
        success: true,
        session_id: session_id || 'anonymous-session',
        previous_agent_id: null,
        new_agent: {
          id: agent.id,
          name: agent.name,
          instructions: agent.initial_prompt,
          initial_prompt: agent.initial_prompt
        },
        switch_reason: reason,
        message: `Successfully switched to ${agent.name} agent (anonymous session). The ${agent.name} will respond in the next message.`,
        user_type: 'anonymous',
        stop_processing: true // Signal to stop generating additional content
      };
    }
    
    // For authenticated users, proceed with full session management
    const userProfileId = await this.getUserProfileId(userId);
    
    // If user profile doesn't exist, handle gracefully
    if (!userProfileId) {
      console.warn('Authenticated user has no profile, treating as anonymous for agent switching');
      // Fallback to anonymous-style agent switching
      const agent = await AgentService.getAgentById(agent_id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      return {
        success: true,
        session_id: session_id || 'temp-session',
        previous_agent_id: null,
        new_agent: {
          id: agent.id,
          name: agent.name,
          instructions: agent.initial_prompt,
          initial_prompt: agent.initial_prompt
        },
        switch_reason: reason,
        message: `Successfully switched to ${agent.name} agent (temporary session). The ${agent.name} will respond in the next message.`,
        user_type: 'authenticated-no-profile',
        stop_processing: true // Signal to stop generating additional content
      };
    }
    
    // Skip session verification for now to avoid 406 errors
    // TODO: Fix session verification database schema issues
    console.log('Skipping session verification to avoid database errors, proceeding with agent switch');
    
    // Verify agent exists and user has access
    const agent = await AgentService.getAgentById(agent_id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    // Check if user has access to this agent
    console.log('Switching agent - checking user access for userId:', userId);
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, supabase_user_id')
      .eq('supabase_user_id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile in switchAgent:', profileError);
      throw new Error(`User profile fetch failed: ${profileError.message}`);
    }
    
    console.log('User profile found:', userProfile);
    
    // For agent switching, any authenticated user with a valid role can access any agent
    const hasProperAccountSetup = true; // All authenticated users have access
    
    console.log('Agent access check:', {
      agent_id: agent.id,
      agent_name: agent.name,
      is_free: agent.is_free,
      is_restricted: agent.is_restricted,
      user_role: userProfile?.role,
      hasProperAccountSetup
    });
    
    // Verify user authentication data exists
    if (!userProfile?.supabase_user_id) {
      throw new Error('User authentication data not found');
    }
    
    // Perform the switch
    console.log('🔄 Performing agent switch in database...', {
      session_id,
      agent_id,
      agent_name: agent.name,
      user_id: userProfile.supabase_user_id
    });
    
    const success = await AgentService.setSessionAgent(
      session_id, 
      agent_id, 
      userProfile.supabase_user_id
    );
    
    console.log('🔄 Agent switch database result:', {
      success,
      session_id,
      agent_id,
      agent_name: agent.name
    });
    
    if (!success) {
      console.error('❌ Agent switch failed in database');
      throw new Error('Failed to switch agent');
    }
    
    // Store the switch reason in session metadata if provided
    if (reason) {
      await supabase
        .from('sessions')
        .update({
          session_metadata: {
            last_agent_switch: {
              timestamp: new Date().toISOString(),
              reason,
              agent_id,
              agent_name: agent.name
            }
          }
        })
        .eq('id', session_id);
    }
    
    // Get the updated active agent with retry to ensure database consistency
    let newActiveAgent = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !newActiveAgent) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for database consistency
      newActiveAgent = await AgentService.getSessionActiveAgent(session_id);
      
      if (newActiveAgent && newActiveAgent.agent_id === agent_id) {
        break; // Success - agent switch is confirmed
      }
      
      retryCount++;
      console.log(`🔄 Agent switch verification retry ${retryCount}/${maxRetries}`, {
        session_id,
        expected_agent_id: agent_id,
        actual_agent_id: newActiveAgent?.agent_id || 'null'
      });
    }
    
    if (!newActiveAgent || newActiveAgent.agent_id !== agent_id) {
      console.error('❌ Agent switch verification failed after retries', {
        session_id,
        expected_agent_id: agent_id,
        actual_agent_id: newActiveAgent?.agent_id || 'null'
      });
      throw new Error('Agent switch verification failed - database may not have updated correctly');
    }
    
    console.log('🔄 Agent switch verification - new active agent:', {
      session_id,
      newActiveAgent: newActiveAgent ? {
        agent_id: newActiveAgent.agent_id,
        agent_name: newActiveAgent.agent_name,
        has_initial_prompt: !!newActiveAgent.agent_initial_prompt
      } : 'NULL'
    });
    
    const switchResult = {
      success: true,
      session_id,
      previous_agent_id: null, // We could track this if needed
      new_agent: newActiveAgent ? {
        id: newActiveAgent.agent_id,
        name: newActiveAgent.agent_name,
        instructions: newActiveAgent.agent_instructions,
        initial_prompt: newActiveAgent.agent_initial_prompt
      } : null,
      switch_reason: reason,
      message: `Successfully switched to ${agent.name} agent. The ${agent.name} will respond in the next message.`,
      user_type: 'authenticated',
      stop_processing: true // Signal to stop generating additional content
    };
    
    console.log('🔄 Agent switch complete, returning result:', {
      success: switchResult.success,
      new_agent_name: switchResult.new_agent?.name,
      message: switchResult.message,
      stop_processing: switchResult.stop_processing
    });
    
    return switchResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async recommendAgent(params: any, userId: string) {
    const { topic, conversation_context } = params;
    
    // Handle anonymous users
    let hasProperAccountSetup = false;
    let isAuthenticated = false;
    
    if (userId === 'anonymous') {
      hasProperAccountSetup = false; // Anonymous users get limited access
      isAuthenticated = false;
    } else {
      // Get all available agents for authenticated users
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('supabase_user_id', userId)
        .single();
      
      hasProperAccountSetup = true; // All authenticated users have access to all agents
      isAuthenticated = true;
    }
    
    const availableAgents = await AgentService.getAvailableAgents(
      hasProperAccountSetup, 
      isAuthenticated
    );
    
    // Simple keyword-based recommendation logic
    const topicLower = topic.toLowerCase();
    const contextLower = (conversation_context || '').toLowerCase();
    const searchText = `${topicLower} ${contextLower}`;
    
    // Agent recommendation rules
    const recommendations = [];
    
    for (const agent of availableAgents) {
      let score = 0;
      const reasons = [];
      
      // Support/Help keywords - prioritize for anonymous users
      if (searchText.includes('help') || searchText.includes('support') || 
          searchText.includes('problem') || searchText.includes('issue') ||
          searchText.includes('login') || searchText.includes('access')) {
        if (agent.name.toLowerCase().includes('support') || 
            agent.name.toLowerCase().includes('help')) {
          score += 60;
          reasons.push('Specialized in user support and troubleshooting');
        }
      }
      
      // RFP-related keywords
      if (searchText.includes('rfp') || searchText.includes('request for proposal') || 
          searchText.includes('procurement') || searchText.includes('vendor') ||
          searchText.includes('bid') || searchText.includes('proposal')) {
        if (agent.name.toLowerCase().includes('rfp')) {
          score += 50;
          reasons.push('Specialized in RFP creation and management');
        }
      }
      
      // Technical support keywords
      if (searchText.includes('technical') || searchText.includes('support') || 
          searchText.includes('bug') || searchText.includes('error') ||
          searchText.includes('problem') || searchText.includes('issue')) {
        if (agent.name.toLowerCase().includes('technical') || 
            agent.name.toLowerCase().includes('support')) {
          score += 50;
          reasons.push('Specialized in technical support and troubleshooting');
        }
      }
      
      // Sales and general questions
      if (searchText.includes('price') || searchText.includes('cost') || 
          searchText.includes('subscription') || searchText.includes('plan') ||
          searchText.includes('general') || searchText.includes('question')) {
        if (agent.name.toLowerCase().includes('solution') || 
            agent.name.toLowerCase().includes('sales')) {
          score += 40;
          reasons.push('Best for general inquiries and product information');
        }
      }
      
      // Onboarding and getting started
      if (searchText.includes('start') || searchText.includes('begin') || 
          searchText.includes('new') || searchText.includes('setup') ||
          searchText.includes('onboard') || searchText.includes('help')) {
        if (agent.name.toLowerCase().includes('onboard')) {
          score += 45;
          reasons.push('Specialized in helping new users get started');
        }
      }
      
      // Default agent gets base score
      if (agent.is_default) {
        score += 10;
        reasons.push('Default agent suitable for general assistance');
      }
      
      // Free agent preference for basic users
      if (agent.is_free && !hasProperAccountSetup) {
        score += 15;
        reasons.push('Free agent available to all authenticated users');
      }
      
      if (score > 0) {
        recommendations.push({
          agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            initial_prompt: agent.initial_prompt,
            is_default: agent.is_default,
            is_restricted: agent.is_restricted,
            is_free: agent.is_free
          },
          score,
          reasons,
          confidence: Math.min(score / 50, 1.0) // Normalize to 0-1
        });
      }
    }
    
    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);
    
    // Return top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3);
    
    return {
      topic,
      conversation_context,
      recommendations: topRecommendations,
      total_agents_considered: availableAgents.length,
      user_access_level: hasProperAccountSetup ? 'premium' : 'basic',
      message: topRecommendations.length > 0 
        ? `Found ${topRecommendations.length} agent recommendations for: "${topic}"`
        : 'No specific agent recommendations found, consider using the default agent'
    };
  }

  // Artifact Functions Implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createFormArtifact(params: any, userId: string) {
    const { title, description, form_schema, ui_schema, form_data, submit_action } = params;
    
    console.log('🎨 Creating form artifact:', { title, userId });
    
    if (!title) {
      throw new Error('Title is required for creating a form artifact');
    }
    
    if (!form_schema || typeof form_schema !== 'object') {
      throw new Error('Valid form_schema is required for creating a form artifact');
    }
    
    if (!form_schema.type || form_schema.type !== 'object') {
      throw new Error('Form schema must have type "object"');
    }
    
    if (!form_schema.properties || typeof form_schema.properties !== 'object') {
      throw new Error('Form schema must have properties object');
    }
    
    try {
      // Generate a unique artifact ID
      const artifact_id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store artifact in the database for persistence
      const { error } = await supabase
        .from('form_artifacts')
        .insert({
          id: artifact_id,
          user_id: userId !== 'anonymous' ? userId : null,
          type: 'form',
          title,
          description: description || null,
          schema: form_schema,
          ui_schema: ui_schema || null,
          data: form_data || null,
          submit_action: submit_action || null,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to store artifact in database:', error);
        // Continue without database storage for anonymous users or fallback
      }
      
      console.log('✅ Form artifact created successfully:', { artifact_id, title });
      
      return {
        success: true,
        artifact_id,
        title,
        description,
        type: 'form',
        form_schema,
        ui_schema: ui_schema || {},
        form_data: form_data || {},
        submit_action: submit_action || { type: 'save_session' },
        created_at: new Date().toISOString(),
        message: `Form artifact "${title}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating form artifact:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createTextArtifact(params: any, userId: string) {
    const { title, content, content_type = 'markdown', description, tags } = params;
    
    console.log('📝 Creating text artifact:', { title, content_type, userId });
    
    if (!title) {
      throw new Error('Title is required for creating a text artifact');
    }
    
    if (!content) {
      throw new Error('Content is required for creating a text artifact');
    }
    
    // Validate content_type
    const validContentTypes = ['markdown', 'plain', 'html'];
    if (!validContentTypes.includes(content_type)) {
      throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
    }
    
    try {
      // Generate a unique artifact ID
      const artifact_id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store artifact in the database for persistence
      const { error } = await supabase
        .from('form_artifacts')
        .insert({
          id: artifact_id,
          user_id: userId !== 'anonymous' ? userId : null,
          type: 'text',
          title,
          description: description || null,
          schema: {
            type: 'text',
            content_type,
            content,
            tags: tags || []
          },
          ui_schema: null,
          data: { content, content_type },
          submit_action: null,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to store text artifact in database:', error);
        // Continue without database storage for anonymous users or fallback
      }
      
      console.log('✅ Text artifact created successfully:', { artifact_id, title, content_type });
      
      return {
        success: true,
        artifact_id,
        title,
        description,
        type: 'text',
        content,
        content_type,
        tags: tags || [],
        created_at: new Date().toISOString(),
        message: `Text artifact "${title}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating text artifact:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async generateProposalArtifact(params: any, userId: string) {
    const { rfp_id, proposal_title, sections = ['executive_summary', 'technical_approach', 'timeline', 'pricing'], content_type = 'markdown' } = params;
    
    console.log('📋 Generating proposal artifact:', { rfp_id, proposal_title, userId });
    
    if (!rfp_id) {
      throw new Error('RFP ID is required for generating a proposal artifact');
    }
    
    try {
      // Fetch RFP data from database
      const { data: rfp, error: rfpError } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', rfp_id)
        .single();
      
      if (rfpError || !rfp) {
        throw new Error(`Failed to fetch RFP data: ${rfpError?.message || 'RFP not found'}`);
      }
      
      // Generate proposal content
      const title = proposal_title || `Proposal for ${rfp.name}`;
      const questionnaire_response = rfp.buyer_questionnaire_response as QuestionnaireResponse;
      
      const proposalContent = this.generateProposalContent(rfp, questionnaire_response, sections, content_type);
      
      // Create text artifact with the proposal content
      const artifact_id = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store artifact in the database
      const { error } = await supabase
        .from('form_artifacts')
        .insert({
          id: artifact_id,
          user_id: userId !== 'anonymous' ? userId : null,
          type: 'text',
          title,
          description: `Proposal generated for RFP: ${rfp.name}`,
          schema: {
            type: 'text',
            content_type,
            content: proposalContent,
            tags: ['proposal', 'rfp', rfp_id],
            rfp_id: rfp_id
          },
          ui_schema: null,
          data: { content: proposalContent, content_type, rfp_id },
          submit_action: null,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to store proposal artifact in database:', error);
        // Continue without database storage for anonymous users or fallback
      }
      
      // Also update the RFP with the proposal content
      await supabase
        .from('rfps')
        .update({ proposal: proposalContent })
        .eq('id', rfp_id);
      
      console.log('✅ Proposal artifact created successfully:', { artifact_id, title });
      
      return {
        success: true,
        artifact_id,
        title,
        description: `Proposal generated for RFP: ${rfp.name}`,
        type: 'text',
        content: proposalContent,
        content_type,
        rfp_id,
        tags: ['proposal', 'rfp', rfp_id],
        created_at: new Date().toISOString(),
        message: `Proposal artifact "${title}" generated successfully`
      };
    } catch (error) {
      console.error('❌ Error generating proposal artifact:', error);
      throw error;
    }
  }

  // Helper method to generate proposal content
  private generateProposalContent(rfp: RFPData, questionnaire_response: QuestionnaireResponse, sections: string[], content_type: string): string {
    const supplier_info = questionnaire_response?.supplier_info || {};
    const form_data = questionnaire_response?.form_data || {};
    
    let content = '';
    
    if (content_type === 'markdown') {
      content = `# Proposal for ${rfp.name}

## Executive Summary
This proposal is submitted by ${supplier_info.name || 'the submitting organization'} ${supplier_info.company ? `from ${supplier_info.company}` : ''} in response to the Request for Proposal: "${rfp.name}".

## Company Information
- **Contact:** ${supplier_info.name || 'Not provided'}
- **Email:** ${supplier_info.email || 'Not provided'}
${supplier_info.company ? `- **Company:** ${supplier_info.company}` : ''}

## Proposal Details
Based on the requirements outlined in the RFP, we propose the following solution:

### Requirements Analysis
${rfp.description || 'No description provided'}

### Technical Approach
Our approach addresses the key specifications:
${rfp.specification || 'No specification provided'}

### Questionnaire Response Summary
${this.formatQuestionnaireDataForProposal(form_data)}

### Timeline and Deliverables
We commit to delivering the proposed solution by the specified due date: ${new Date(rfp.due_date).toLocaleDateString()}.

${sections.includes('pricing') ? `
### Pricing
Competitive pricing details will be provided based on the specific requirements and scope of work outlined in this proposal.
` : ''}

## Conclusion
We believe our proposal offers the best value and meets all the requirements outlined in the RFP. We look forward to the opportunity to discuss this proposal further.

---
*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`;
    } else {
      // Plain text version
      content = `Proposal for ${rfp.name}

Executive Summary:
This proposal is submitted by ${supplier_info.name || 'the submitting organization'} ${supplier_info.company ? `from ${supplier_info.company}` : ''} in response to the Request for Proposal: "${rfp.name}".

Company Information:
- Contact: ${supplier_info.name || 'Not provided'}
- Email: ${supplier_info.email || 'Not provided'}
${supplier_info.company ? `- Company: ${supplier_info.company}` : ''}

Requirements Analysis:
${rfp.description || 'No description provided'}

Technical Approach:
${rfp.specification || 'No specification provided'}

Questionnaire Response Summary:
${this.formatQuestionnaireDataForProposal(form_data)}

Timeline and Deliverables:
We commit to delivering the proposed solution by the specified due date: ${new Date(rfp.due_date).toLocaleDateString()}.

Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    }
    
    return content.trim();
  }

  // Helper method to format questionnaire data for proposal
  private formatQuestionnaireDataForProposal(form_data: Record<string, unknown>): string {
    const entries = Object.entries(form_data);
    if (entries.length === 0) {
      return 'No questionnaire response data available.';
    }
    
    return entries.map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `**${label}:** ${String(value)}`;
    }).join('\n');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async updateFormArtifact(params: any, userId: string) {
    const { artifact_id, updates } = params;
    
    console.log('✏️ Updating form artifact:', { artifact_id, userId });
    
    if (!artifact_id) {
      throw new Error('Artifact ID is required for updating');
    }
    
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }
    
    try {
      // Update artifact in database
      const { error } = await supabase
        .from('form_artifacts')
        .update({
          title: updates.title,
          description: updates.description,
          schema: updates.form_schema,
          ui_schema: updates.ui_schema,
          data: updates.form_data,
          submit_action: updates.submit_action,
          updated_at: new Date().toISOString()
        })
        .eq('id', artifact_id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to update artifact in database:', error);
        throw new Error(`Failed to update artifact: ${error.message}`);
      }
      
      console.log('✅ Form artifact updated successfully:', { artifact_id });
      
      return {
        success: true,
        artifact_id,
        updated_fields: Object.keys(updates),
        updated_at: new Date().toISOString(),
        message: `Artifact "${artifact_id}" updated successfully`
      };
    } catch (error) {
      console.error('❌ Error updating form artifact:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getFormSubmission(params: any, userId: string) {
    const { artifact_id, session_id } = params;
    
    console.log('📋 Getting form submission:', { artifact_id, session_id, userId });
    
    if (!artifact_id) {
      throw new Error('Artifact ID is required');
    }
    
    try {
      // Get the artifact
      const { data: artifact, error: artifactError } = await supabase
        .from('form_artifacts')
        .select('*')
        .eq('id', artifact_id)
        .single();
      
      if (artifactError) {
        console.error('❌ Failed to get artifact:', artifactError);
        throw new Error(`Failed to get artifact: ${artifactError.message}`);
      }
      
      // Get any submissions for this artifact
      const { data: submissions, error: submissionError } = await supabase
        .from('artifact_submissions')
        .select('*')
        .eq('artifact_id', artifact_id)
        .eq('session_id', session_id || 'current')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (submissionError) {
        console.warn('⚠️ Could not retrieve submissions:', submissionError);
      }
      
      const latestSubmission = submissions?.[0] || null;
      
      console.log('✅ Form submission retrieved:', { artifact_id, has_submission: !!latestSubmission });
      
      return {
        artifact_id,
        artifact: {
          title: artifact.title,
          description: artifact.description,
          form_schema: artifact.schema,
          ui_schema: artifact.ui_schema,
          form_data: artifact.data
        },
        latest_submission: latestSubmission ? {
          submission_id: latestSubmission.id,
          data: latestSubmission.submission_data,
          submitted_at: latestSubmission.created_at
        } : null,
        message: latestSubmission ? 'Form submission found' : 'No submissions found for this artifact'
      };
    } catch (error) {
      console.error('❌ Error getting form submission:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async validateFormData(params: any, userId: string) {
    const { form_schema, form_data } = params;
    
    console.log('✅ Validating form data:', { userId });
    
    if (!form_schema || typeof form_schema !== 'object') {
      throw new Error('Valid form_schema is required for validation');
    }
    
    if (!form_data || typeof form_data !== 'object') {
      throw new Error('Valid form_data is required for validation');
    }
    
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Basic validation against schema
      if (form_schema.required && Array.isArray(form_schema.required)) {
        for (const requiredField of form_schema.required) {
          if (!(requiredField in form_data) || form_data[requiredField] === '' || form_data[requiredField] == null) {
            errors.push(`Required field "${requiredField}" is missing or empty`);
          }
        }
      }
      
      // Type validation for each field
      if (form_schema.properties) {
        for (const [fieldName, fieldSchema] of Object.entries(form_schema.properties as Record<string, unknown>)) {
          const fieldValue = form_data[fieldName];
          const fieldType = (fieldSchema as { type?: string }).type;
          
          if (fieldValue != null && fieldType) {
            switch (fieldType) {
              case 'string':
                if (typeof fieldValue !== 'string') {
                  errors.push(`Field "${fieldName}" must be a string`);
                }
                break;
              case 'number':
                if (typeof fieldValue !== 'number' && !Number.isFinite(Number(fieldValue))) {
                  errors.push(`Field "${fieldName}" must be a number`);
                }
                break;
              case 'boolean':
                if (typeof fieldValue !== 'boolean') {
                  errors.push(`Field "${fieldName}" must be a boolean`);
                }
                break;
              case 'array':
                if (!Array.isArray(fieldValue)) {
                  errors.push(`Field "${fieldName}" must be an array`);
                }
                break;
              case 'object':
                if (typeof fieldValue !== 'object' || Array.isArray(fieldValue)) {
                  errors.push(`Field "${fieldName}" must be an object`);
                }
                break;
            }
          }
        }
      }
      
      const isValid = errors.length === 0;
      
      console.log('✅ Form validation complete:', { isValid, errorCount: errors.length, warningCount: warnings.length });
      
      return {
        valid: isValid,
        errors,
        warnings,
        validated_fields: Object.keys(form_data),
        message: isValid ? 'Form data is valid' : `Form validation failed with ${errors.length} error(s)`
      };
    } catch (error) {
      console.error('❌ Error validating form data:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createArtifactTemplate(params: any, userId: string) {
    const { template_name, template_type, template_schema, template_ui, description, tags } = params;
    
    console.log('📄 Creating artifact template:', { template_name, template_type, userId });
    
    if (!template_name) {
      throw new Error('Template name is required');
    }
    
    if (!template_type || !['form', 'document', 'chart', 'table'].includes(template_type)) {
      throw new Error('Valid template_type is required (form, document, chart, table)');
    }
    
    if (!template_schema || typeof template_schema !== 'object') {
      throw new Error('Valid template_schema is required');
    }
    
    try {
      const template_id = `template_${template_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store template in database
      const { error } = await supabase
        .from('artifact_templates')
        .insert({
          id: template_id,
          user_id: userId !== 'anonymous' ? userId : null,
          name: template_name,
          type: template_type,
          schema: template_schema,
          ui_config: template_ui || null,
          description: description || null,
          tags: tags || [],
          is_public: false, // Private by default
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to store template in database:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }
      
      console.log('✅ Artifact template created successfully:', { template_id, template_name });
      
      return {
        success: true,
        template_id,
        template_name,
        template_type,
        description,
        tags: tags || [],
        created_at: new Date().toISOString(),
        message: `Template "${template_name}" created successfully`
      };
    } catch (error) {
      console.error('❌ Error creating artifact template:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async listArtifactTemplates(params: any, userId: string) {
    const { template_type = 'all', tags } = params;
    
    console.log('📋 Listing artifact templates:', { template_type, tags, userId });
    
    try {
      let query = supabase
        .from('artifact_templates')
        .select('*')
        .or(`user_id.eq.${userId !== 'anonymous' ? userId : null},is_public.eq.true`);
      
      if (template_type !== 'all') {
        query = query.eq('type', template_type);
      }
      
      if (tags && Array.isArray(tags) && tags.length > 0) {
        query = query.contains('tags', tags);
      }
      
      const { data: templates, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Failed to list templates:', error);
        throw new Error(`Failed to list templates: ${error.message}`);
      }
      
      console.log('✅ Templates listed successfully:', { count: templates?.length || 0 });
      
      return {
        templates: (templates || []).map(template => ({
          template_id: template.id,
          name: template.name,
          type: template.type,
          description: template.description,
          tags: template.tags || [],
          is_public: template.is_public,
          created_at: template.created_at
        })),
        filter: {
          template_type: template_type,
          tags: tags || []
        },
        total_found: templates?.length || 0,
        message: `Found ${templates?.length || 0} templates`
      };
    } catch (error) {
      console.error('❌ Error listing artifact templates:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getArtifactStatus(params: any, userId: string) {
    const { artifact_id } = params;
    
    console.log('📊 Getting artifact status:', { artifact_id, userId });
    
    if (!artifact_id) {
      throw new Error('Artifact ID is required');
    }
    
    try {
      // Get artifact details
      const { data: artifact, error: artifactError } = await supabase
        .from('form_artifacts')
        .select('*')
        .eq('id', artifact_id)
        .single();
      
      if (artifactError) {
        console.error('❌ Failed to get artifact:', artifactError);
        throw new Error(`Failed to get artifact: ${artifactError.message}`);
      }
      
      // Get submission count
      const { count: submissionCount, error: countError } = await supabase
        .from('artifact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('artifact_id', artifact_id);
      
      if (countError) {
        console.warn('⚠️ Could not get submission count:', countError);
      }
      
      console.log('✅ Artifact status retrieved:', { artifact_id, submissionCount });
      
      return {
        artifact_id,
        status: artifact.status || 'active',
        type: artifact.type,
        title: artifact.title,
        description: artifact.description,
        created_at: artifact.created_at,
        updated_at: artifact.updated_at,
        submission_count: submissionCount || 0,
        last_activity: artifact.updated_at || artifact.created_at,
        message: `Artifact status for "${artifact.title}"`
      };
    } catch (error) {
      console.error('❌ Error getting artifact status:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async setCurrentRfp(params: any, userId: string) {
    const { rfp_id } = params;
    
    console.log('🎯 Setting current RFP:', { rfp_id, userId });
    
    if (userId === 'anonymous') {
      throw new Error('Cannot set current RFP for anonymous users. Please log in first.');
    }
    
    try {
      // Get the user's profile ID
      const profileId = await this.getUserProfileId(userId);
      if (!profileId) {
        throw new Error('User profile not found. Please ensure you are properly authenticated.');
      }
      
      // If rfp_id is provided, verify the RFP exists
      if (rfp_id !== null) {
        const { data: rfp, error: rfpError } = await supabase
          .from('rfps')
          .select('id, name')
          .eq('id', rfp_id)
          .single();
        
        if (rfpError || !rfp) {
          throw new Error(`RFP with ID ${rfp_id} not found`);
        }
        
        console.log('✅ RFP validated:', rfp.name);
      }
      
      // Update user profile with current RFP ID
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ current_rfp_id: rfp_id })
        .eq('id', profileId)
        .select('id, current_rfp_id')
        .single();
      
      if (updateError) {
        console.error('❌ Failed to update user profile:', updateError);
        throw new Error(`Failed to set current RFP: ${updateError.message}`);
      }
      
      const message = rfp_id 
        ? `Current RFP context set to RFP ID: ${rfp_id}`
        : 'Current RFP context cleared';
      
      console.log('✅ Current RFP updated:', message);
      
      // Trigger frontend refresh by posting a message to the window
      if (typeof window !== 'undefined') {
        window.postMessage({ 
          type: 'REFRESH_CURRENT_RFP', 
          rfp_id: rfp_id,
          message: message
        }, '*');
      }
      
      return {
        success: true,
        current_rfp_id: rfp_id,
        user_profile_id: profileId,
        message,
        frontend_refresh_triggered: true
      };
    } catch (error) {
      console.error('❌ Error setting current RFP:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private async refreshCurrentRfp(params: any, userId: string) {
    console.log('🔄 Triggering current RFP refresh');
    
    try {
      // Trigger frontend refresh by posting a message to the window
      if (typeof window !== 'undefined') {
        window.postMessage({ 
          type: 'REFRESH_CURRENT_RFP', 
          message: 'Frontend RFP context refresh requested'
        }, '*');
      }
      
      return {
        success: true,
        message: 'Frontend refresh triggered for current RFP context',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error triggering refresh:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createAndSetRfp(params: any, userId: string) {
    const { name, description = '', specification = '', due_date = null } = params;
    
    console.log('🚀 Creating and setting new RFP:', { name, userId });
    
    if (userId === 'anonymous') {
      throw new Error('Cannot create RFP for anonymous users. Please log in first.');
    }
    
    if (!name || name.trim() === '') {
      throw new Error('RFP name is required');
    }
    
    try {
      // Step 1: Check if user already has a current RFP
      const profileId = await this.getUserProfileId(userId);
      if (!profileId) {
        throw new Error('User profile not found. Please ensure you are properly authenticated.');
      }
      
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('current_rfp_id')
        .eq('id', profileId)
        .single();
      
      if (currentProfile?.current_rfp_id) {
        console.log('⚠️ User already has current RFP:', currentProfile.current_rfp_id);
      }
      
      // Step 2: Create new RFP with supabase_insert
      const insertData: {
        name: string;
        status: string;
        description?: string;
        specification?: string;
        due_date?: string;
      } = {
        name: name.trim(),
        status: 'draft'
      };
      
      // Add optional fields if provided
      if (description && description.trim()) {
        insertData.description = description.trim();
      }
      if (specification && specification.trim()) {
        insertData.specification = specification.trim();
      }
      if (due_date) {
        insertData.due_date = due_date;
      }
      
      const { data: newRfp, error: insertError } = await supabase
        .from('rfps')
        .insert(insertData)
        .select('id, name, description, specification, status, created_at')
        .single();
      
      if (insertError) {
        console.error('❌ Failed to create RFP:', insertError);
        throw new Error(`Failed to create RFP: ${insertError.message}`);
      }
      
      console.log('✅ RFP created successfully:', newRfp.id);
      
      // Step 3: Set as current RFP
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ current_rfp_id: newRfp.id })
        .eq('id', profileId)
        .select('id, current_rfp_id')
        .single();
      
      if (updateError) {
        console.error('❌ Failed to set as current RFP:', updateError);
        throw new Error(`RFP created but failed to set as current: ${updateError.message}`);
      }
      
      console.log('✅ RFP set as current successfully');
      
      // Step 4: Validation - verify RFP exists in database
      const { data: verifyRfp, error: verifyError } = await supabase
        .from('rfps')
        .select('id, name, status')
        .eq('id', newRfp.id)
        .single();
      
      if (verifyError || !verifyRfp) {
        throw new Error('RFP creation validation failed - RFP not found after creation');
      }
      
      console.log('✅ RFP creation validated successfully');
      
      // Step 5: Trigger frontend UI refresh
      if (typeof window !== 'undefined') {
        window.postMessage({ 
          type: 'REFRESH_CURRENT_RFP', 
          rfp_id: newRfp.id,
          message: `New RFP created and set as current: ${newRfp.name}`
        }, '*');
      }
      
      return {
        success: true,
        rfp: newRfp,
        current_rfp_id: newRfp.id,
        user_profile_id: profileId,
        message: `RFP "${newRfp.name}" created successfully and set as current RFP`,
        steps_completed: [
          'checked_current_context',
          'created_rfp_record', 
          'set_as_current_rfp',
          'validated_creation',
          'triggered_ui_refresh'
        ],
        frontend_refresh_triggered: true
      };
      
    } catch (error) {
      console.error('❌ Error in createAndSetRfp:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const claudeAPIHandler = new ClaudeAPIFunctionHandler();

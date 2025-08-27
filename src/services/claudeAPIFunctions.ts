// Claude API Function Calling Integration for RFPEZ MCP
// This provides the same functionality as MCP but via HTTP endpoints that Claude API can call

import { supabase } from '../supabaseClient';

// Claude API Function Definitions
export const claudeApiFunctions = [
  {
    "name": "get_conversation_history",
    "description": "Retrieve conversation messages from a specific session",
    "parameters": {
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
    "parameters": {
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
    "parameters": {
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
    "parameters": {
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
    "parameters": {
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
  }
];

// Function execution handlers for Claude API
export class ClaudeAPIFunctionHandler {
  
  // Get user ID from the current session
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    
    if (!profile?.id) {
      throw new Error('User profile not found');
    }
    
    return profile.id;
  }

  async executeFunction(functionName: string, parameters: any) {
    const userId = await this.getCurrentUserId();
    
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
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async getConversationHistory(params: any, userId: string) {
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

  private async getRecentSessions(params: any, userId: string) {
    const { limit = 10 } = params;
    
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
      .eq('user_id', userId)
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

  private async storeMessage(params: any, userId: string) {
    const { session_id, content, role, metadata = {} } = params;
    
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
        user_id: userId,
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

  private async createSession(params: any, userId: string) {
    const { title, description } = params;
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
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

  private async searchMessages(params: any, userId: string) {
    const { query, limit = 20 } = params;
    
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
      .eq('sessions.user_id', userId)
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
}

// Export singleton instance
export const claudeAPIHandler = new ClaudeAPIFunctionHandler();

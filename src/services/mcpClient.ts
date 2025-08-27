// MCP Client for RFPEZ.AI Supabase Integration
import { supabase } from '../supabaseClient';

// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  message_order: number;
  metadata?: Record<string, any>;
  ai_metadata?: Record<string, any>;
}

export interface ConversationSession {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  session_metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  session_id: string;
  content: string;
  role: string;
  created_at: string;
  sessions: {
    title: string;
    description?: string;
  };
}

export class MCPClient {
  private baseUrl: string;
  private requestId = 1;

  constructor(baseUrl?: string) {
    // Use the Supabase edge function URL
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    this.baseUrl = baseUrl || `${supabaseUrl}/functions/v1/mcp-server`;
  }

  private async makeRequest(method: string, params?: Record<string, unknown>): Promise<MCPResponse> {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    const request: MCPRequest = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method,
      params
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const mcpResponse: MCPResponse = await response.json();
    
    if (mcpResponse.error) {
      throw new Error(`MCP Error: ${mcpResponse.error.message}`);
    }

    return mcpResponse;
  }

  // Initialize the MCP connection
  async initialize(): Promise<Record<string, unknown>> {
    const response = await this.makeRequest('initialize', {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {}
      },
      clientInfo: {
        name: "RFPEZ Web Client",
        version: "1.0.0"
      }
    });
    return response.result as Record<string, unknown> || {};
  }

  // Get list of available tools
  async listTools(): Promise<unknown[]> {
    const response = await this.makeRequest('tools/list');
    const result = response.result as { tools?: unknown[] };
    return result?.tools || [];
  }

  // Get conversation history for a session
  async getConversationHistory(
    sessionId: string, 
    limit = 50, 
    offset = 0
  ): Promise<{
    session_id: string;
    messages: ConversationMessage[];
    total_retrieved: number;
    offset: number;
    limit: number;
  }> {
    const response = await this.makeRequest('tools/call', {
      name: 'get_conversation_history',
      arguments: { session_id: sessionId, limit, offset }
    });
    
    const result = response.result as { content?: { text?: string }[] };
    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    throw new Error('Invalid response format');
  }

  // Get recent conversation sessions
  async getRecentSessions(limit = 10): Promise<{
    sessions: ConversationSession[];
    total_retrieved: number;
  }> {
    const response = await this.makeRequest('tools/call', {
      name: 'get_recent_sessions',
      arguments: { limit }
    });
    
    const result = response.result as { content?: { text?: string }[] };
    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    throw new Error('Invalid response format');
  }

  // Store a new message in a conversation
  async storeMessage(
    sessionId: string,
    content: string,
    role: 'user' | 'assistant' | 'system',
    metadata?: Record<string, unknown>
  ): Promise<{
    message_id: string;
    session_id: string;
    message_order: number;
    created_at: string;
  }> {
    const response = await this.makeRequest('tools/call', {
      name: 'store_message',
      arguments: { session_id: sessionId, content, role, metadata }
    });
    
    const result = response.result as { content?: { text?: string }[] };
    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    throw new Error('Invalid response format');
  }

  // Create a new conversation session
  async createSession(
    title: string,
    description?: string
  ): Promise<{
    session_id: string;
    title: string;
    description?: string;
    created_at: string;
  }> {
    const response = await this.makeRequest('tools/call', {
      name: 'create_session',
      arguments: { title, description }
    });
    
    const result = response.result as { content?: { text?: string }[] };
    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    throw new Error('Invalid response format');
  }

  // Search messages across all sessions
  async searchMessages(
    query: string,
    limit = 20
  ): Promise<{
    query: string;
    results: SearchResult[];
    total_found: number;
  }> {
    const response = await this.makeRequest('tools/call', {
      name: 'search_messages',
      arguments: { query, limit }
    });
    
    const result = response.result as { content?: { text?: string }[] };
    if (result?.content?.[0]?.text) {
      return JSON.parse(result.content[0].text);
    }
    throw new Error('Invalid response format');
  }

  // Get list of available resources
  async listResources(): Promise<unknown[]> {
    const response = await this.makeRequest('resources/list');
    const result = response.result as { resources?: unknown[] };
    return result?.resources || [];
  }

  // Read a specific resource
  async readResource(uri: string): Promise<unknown> {
    const response = await this.makeRequest('resources/read', { uri });
    const result = response.result as { contents?: { mimeType?: string; text?: string }[] };
    const content = result?.contents?.[0];
    
    if (content?.mimeType === 'application/json' && content.text) {
      return JSON.parse(content.text);
    }
    
    return content;
  }
}

// Export a singleton instance
export const mcpClient = new MCPClient();

// Copyright Mark Skiba, 2025 All rights reserved
// Type definitions for Claude API v3 Edge Function

// Claude API Types
export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
    content?: string;
    is_error?: boolean;
  }>;
}

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }>;
    required?: string[];
  };
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  stop_sequence?: string | null;
  usage: ClaudeUsage;
}

// RFP Related Types
export interface RFPFormData {
  name?: string;
  title?: string;
  description?: string;
  specification?: string;
  due_date?: string;
  requirements?: string[];
  timeline?: string;
  budget?: number;
  categories?: string[];
  evaluation_criteria?: string[];
  submission_deadline?: string;
  contact_info?: string;
  additional_info?: string;
}

export interface RFPRecord {
  id?: number;
  title: string;
  description: string;
  requirements: string[];
  timeline: string;
  budget?: number;
  categories?: string[];
  evaluation_criteria?: string[];
  submission_deadline?: string;
  contact_info?: string;
  additional_info?: string;
  user_id: string;
  session_id: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  prompts?: Record<string, string>;
  tools?: string[];
  access_tier?: 'public' | 'free' | 'premium';
  is_active?: boolean;
}

// Artifact Types
export interface ArtifactRecord {
  id: string;
  name: string;
  description?: string;
  type: string;
  schema?: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
  default_values?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  message_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Tool Event Types
export interface ToolInvocationEvent {
  type: 'tool_start' | 'tool_progress' | 'tool_complete' | 'tool_error';
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: ToolResult;
  error?: string;
  timestamp: string;
  duration?: number;
}

export interface StreamingResponse {
  type: 'text' | 'tool_invocation' | 'completion' | 'error';
  content?: string;
  toolEvent?: ToolInvocationEvent;
  metadata?: {
    tokenCount?: number;
    model?: string;
    usage?: ClaudeUsage;
    toolsUsed?: string[];
    executionTime?: number;
    toolInvocations?: number;
    clientCallbacks?: ClientCallback[];
  };
}

export interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification';
  target: string;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export interface EdgeFunctionResponse {
  success: boolean;
  data?: Record<string, unknown> | string | number;
  streamingEvents?: StreamingResponse[];
  clientCallbacks?: ClientCallback[];
  toolInvocations?: ToolInvocationEvent[];
  error?: string;
  metadata?: {
    executionTime: number;
    toolsUsed: string[];
    model: string;
    tokenUsage: ClaudeUsage;
  };
}

// Session and User Types
export interface SessionContext {
  sessionId: string;
  agent?: Agent;
  currentRfp?: RFPRecord;
  currentArtifact?: ArtifactRecord;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  supabase_user_id: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthResult {
  user: AuthUser;
  profile: UserProfile | null;
}

export interface MessageHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface FrontendRequest {
  userMessage?: string;
  agent?: Agent;
  conversationHistory?: MessageHistoryItem[];
  sessionId?: string;
  currentRfp?: RFPRecord;
  currentArtifact?: ArtifactRecord;
  userProfile?: UserProfile;
  loginEvidence?: {
    hasPreviousLogin: boolean;
    loginCount?: number;
    lastLoginTime?: string;
  };
  stream?: boolean;
  functionName?: string;
  parameters?: Record<string, unknown>;
}

export interface ToolParameters {
  [key: string]: string | number | boolean | Record<string, unknown> | unknown[];
}

export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown> | string | number | boolean | unknown[] | null;
  error?: string;
  message?: string;
  clientCallbacks?: ClientCallback[];
  current_rfp_id?: number;
  rfp?: RFPRecord;
  recovery_action?: {
    tool: string;
    instruction: string;
  };
}
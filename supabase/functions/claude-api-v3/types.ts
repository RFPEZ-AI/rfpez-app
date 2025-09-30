// Copyright Mark Skiba, 2025 All rights reserved
// Type definitions for Claude API v3 Edge Function

export interface ToolInvocationEvent {
  type: 'tool_start' | 'tool_progress' | 'tool_complete' | 'tool_error';
  toolName: string;
  parameters?: any;
  result?: any;
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
    usage?: any;
    toolsUsed?: string[];
    executionTime?: number;
    toolInvocations?: number;
    clientCallbacks?: ClientCallback[];
  };
}

export interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification';
  target: string;
  payload: any;
  priority?: 'low' | 'normal' | 'high';
}

export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  streamingEvents?: StreamingResponse[];
  clientCallbacks?: ClientCallback[];
  toolInvocations?: ToolInvocationEvent[];
  error?: string;
  metadata?: {
    executionTime: number;
    toolsUsed: string[];
    model: string;
    tokenUsage: any;
  };
}

export interface SessionContext {
  sessionId: string;
  agent?: any;
  currentRfp?: any;
  currentArtifact?: any;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  supabase_user_id: string;
}

export interface AuthResult {
  user: any;
  profile: UserProfile | null;
}

export interface FrontendRequest {
  userMessage?: string;
  agent?: any;
  conversationHistory?: any[];
  sessionId?: string;
  currentRfp?: any;
  currentArtifact?: any;
  userProfile?: UserProfile;
  loginEvidence?: {
    hasPreviousLogin: boolean;
    loginCount?: number;
    lastLoginTime?: string;
  };
  stream?: boolean;
  functionName?: string;
  parameters?: any;
}

export interface ToolParameters {
  [key: string]: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  clientCallbacks?: ClientCallback[];
}
// Enhanced Streaming Protocol Design for Tool Transparency
// This defines the streaming events that will be sent to the client

export interface ToolInvocationEvent {
  type: 'tool_start' | 'tool_progress' | 'tool_complete' | 'tool_error';
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  duration?: number;
  agentId?: string; // 🎯 CRITICAL: Track which agent executed this tool
}

export interface ProgressEvent {
  type: 'progress';
  message: string;
  recursionDepth?: number;
  toolCount?: number;
  toolName?: string;
  toolIndex?: number;
  totalTools?: number;
  action?: 'agent_switch' | 'tool_execution' | 'loading_agent';
  agentName?: string;
  timestamp: string;
}

export interface StreamingResponse {
  type: 'text' | 'tool_invocation' | 'completion' | 'error' | 'progress';
  content?: string;
  toolEvent?: ToolInvocationEvent;
  progressEvent?: ProgressEvent;
  metadata?: {
    tokenCount?: number;
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
}

// Example streaming flow:
/*
1. User: "I need to source asphalt for a construction project"

2. Stream events sent to client:
   { type: 'tool_invocation', toolEvent: { type: 'tool_start', toolName: 'create_and_set_rfp', parameters: {...}, timestamp: '...' }}
   { type: 'tool_invocation', toolEvent: { type: 'tool_complete', toolName: 'create_and_set_rfp', result: {...}, duration: 1200 }}
   { type: 'text', content: 'I\'ve created the Asphalt Procurement RFP...' }
   { type: 'completion', metadata: { tokenCount: 150, model: 'claude-sonnet-4-20250514' }}

3. Client displays:
   - Real-time tool execution: "🔄 Creating RFP..." → "✅ RFP Created"
   - Streaming text response
   - Final completion status
*/

// Client-side callback system for UI updates
export interface ClientCallback {
  type: 'ui_refresh' | 'state_update' | 'notification' | 'rfp_created';
  target: string; // Component or state to update
  payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high';
}

// Edge function tool execution with streaming
export interface EdgeToolExecution {
  toolName: string;
  parameters: Record<string, unknown>;
  sessionContext: {
    sessionId: string;
    userId: string;
    agentId: string;
  };
  streamingEnabled: boolean;
  callbacks?: ClientCallback[];
}

// Enhanced edge function response
export interface EdgeFunctionResponse {
  success: boolean;
  data?: Record<string, unknown>;
  streamingEvents?: StreamingResponse[];
  clientCallbacks?: ClientCallback[];
  toolInvocations?: ToolInvocationEvent[];
  error?: string;
  metadata?: {
    executionTime: number;
    toolsUsed: string[];
    model: string;
    tokenUsage: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
}
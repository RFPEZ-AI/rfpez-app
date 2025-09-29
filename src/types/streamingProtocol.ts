// Enhanced Streaming Protocol Design for Tool Transparency
// This defines the streaming events that will be sent to the client

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
  payload: any;
  priority: 'low' | 'normal' | 'high';
}

// Edge function tool execution with streaming
export interface EdgeToolExecution {
  toolName: string;
  parameters: any;
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
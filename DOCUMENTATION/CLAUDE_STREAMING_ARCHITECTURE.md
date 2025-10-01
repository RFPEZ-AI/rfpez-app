# Claude Streaming Architecture Documentation

## Overview

RFPEZ.AI implements a sophisticated real-time streaming system for Claude API interactions that provides multi-level chunk processing, tool execution handling, and seamless user experience. The architecture spans three main layers:

1. **Edge Function Layer** - Claude API integration and server-side streaming
2. **Client Service Layer** - Response processing and data transformation  
3. **UI Component Layer** - Real-time display and user interaction

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude API    │───▶│  Edge Function   │───▶│  Client Service │
│                 │    │  (claude-api-v3) │    │  (ClaudeService)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │ Server-Side Event│    │ Client-Side SSE │
                        │ Stream (SSE)     │    │ Processing      │
                        └──────────────────┘    └─────────────────┘
                                │                        │
                                └────────────────────────┘
                                           │
                                           ▼
                                 ┌─────────────────┐
                                 │ UI Components   │
                                 │ Real-time       │
                                 │ Display         │
                                 └─────────────────┘
```

## Layer 1: Edge Function Streaming (claude-api-v3)

### Location
- File: `supabase/functions/claude-api-v3/handlers/http.ts`
- Function: `handleStreamingResponse()`

### Streaming Process

The edge function creates a `ReadableStream` that handles Claude's streaming response and transforms it into Server-Sent Events (SSE) for the client:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    // 1. Initialize Claude streaming response
    const response = await claudeService.streamMessage(messages, tools, (chunk) => {
      // 2. Process each chunk from Claude
      if (chunk.type === 'text' && chunk.content) {
        // Send text content immediately
        const textEvent = {
          type: 'content_delta',
          delta: chunk.content,
          full_content: fullContent
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(textEvent)}\n\n`));
      } else if (chunk.type === 'tool_use') {
        // Handle tool execution
        const toolEvent = {
          type: 'tool_invocation',
          toolEvent: {
            type: 'tool_start',
            toolName: chunk.name,
            parameters: chunk.input,
            timestamp: new Date().toISOString()
          }
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(toolEvent)}\n\n`));
      }
    });
  }
});
```

### Event Types Sent to Client

1. **content_delta** - Text content chunks
   ```json
   {
     "type": "content_delta",
     "delta": "chunk of text",
     "full_content": "accumulated text"
   }
   ```

2. **tool_invocation** - Tool execution events
   ```json
   {
     "type": "tool_invocation",
     "toolEvent": {
       "type": "tool_start|tool_complete",
       "toolName": "function_name",
       "parameters": {...},
       "result": {...},
       "timestamp": "2025-01-01T00:00:00.000Z"
     }
   }
   ```

3. **complete** - Stream completion with metadata
   ```json
   {
     "type": "complete",
     "full_content": "complete response",
     "token_count": 1234,
     "tool_results": [...],
     "metadata": {
       "agent_switch_occurred": false,
       "functions_called": ["function1", "function2"],
       "function_results": [...]
     }
   }
   ```

### Tool Execution Flow

The edge function handles tool execution with a multi-phase approach:

1. **Initial Response** - Claude provides text + tool calls
2. **Tool Execution** - Execute all tool calls in parallel
3. **Final Response** - Send tool results back to Claude for final response
4. **Additional Tools** - Handle any additional tool calls recursively

```typescript
// Execute all tool calls
for (const toolCall of pendingToolCalls) {
  const result = await toolService.executeTool(toolCall, sessionId);
  
  // Send completion event immediately
  const toolCompleteEvent = {
    type: 'tool_invocation',
    toolEvent: {
      type: 'tool_complete',
      toolName: toolCall.name,
      result: result,
      timestamp: new Date().toISOString()
    }
  };
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(toolCompleteEvent)}\n\n`));
}
```

## Layer 2: Client Service Processing (ClaudeService)

### Location
- File: `src/services/claudeService.ts`
- Method: `sendMessage()` with `stream: true`

### SSE Processing Loop

The client processes Server-Sent Events using a fetch-based streaming approach:

```typescript
const response = await fetch(edgeFunction, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify(payload)
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = ''; // Buffer for incomplete lines

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const eventData = JSON.parse(line.slice(6));
      // Process eventData based on type
    }
  }
}
```

### Chunk Processing Logic

```typescript
if (eventData.type === 'content_delta' && eventData.delta) {
  fullContent += eventData.delta;
  onChunk(eventData.delta, false); // Call streaming callback
} else if (eventData.type === 'tool_invocation') {
  if (eventData.toolEvent?.type === 'tool_start') {
    onChunk('', false, true); // Indicate tool processing
  } else if (eventData.toolEvent?.type === 'tool_complete') {
    // Store tool result for metadata
  }
} else if (eventData.type === 'complete') {
  onChunk('', true); // Indicate completion
}
```

### Data Transformation

The client service aggregates streaming data and creates a structured response:

```typescript
return {
  content: fullContent,
  metadata: {
    model: 'claude-sonnet-4-20250514',
    response_time: 0,
    temperature: 0.7,
    functions_called: toolsUsed,
    function_results: functionResults,
    is_streaming: true,
    stream_complete: true,
    agent_switch_occurred: streamingCompletionMetadata?.agent_switch_occurred || false
  }
};
```

## Layer 3: UI Component Processing

### Location
- Hook: `src/hooks/useMessageHandling.ts`
- Component: `src/components/SessionDialog.tsx`

### Real-Time Message Updates

The UI layer implements sophisticated buffering and state management for smooth streaming:

```typescript
const onStreamingChunk = (chunk: string, isComplete: boolean, toolProcessing?: boolean) => {
  if (chunk.length > 0) {
    streamingBuffer += chunk;
    
    // Update message in real-time
    setMessages(prev => 
      prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: msg.content + chunk }
          : msg
      )
    );
  }
  
  if (toolProcessing) {
    // Create tool processing indicator
    const toolProcessingMessage = {
      id: uuidv4(),
      content: '🔧 Processing tools...',
      isUser: false,
      timestamp: new Date(),
      agentName: agent?.agent_name || 'AI Assistant',
      isToolProcessing: true
    };
    
    setMessages(prev => [...prev, toolProcessingMessage]);
  }
};
```

### Tool Processing States

The UI manages three distinct tool processing states:

1. **Tool Processing Start** - Show processing indicator
2. **Tool Execution** - Maintain processing indicator with timeout
3. **Tool Completion** - Remove processing indicator, show final content

```typescript
// UI-LEVEL TIMEOUT: Force cleanup after timeout
uiTimeoutId = setTimeout(() => {
  if (toolProcessingMessageId && isWaitingForToolCompletion) {
    // Remove tool processing message
    setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
    
    // Create timeout error message
    const timeoutMessage = {
      id: uuidv4(),
      content: 'Tool processing exceeded time limit. Please try again.',
      isUser: false,
      timestamp: new Date(),
      agentName: agent?.agent_name || 'AI Assistant'
    };
    
    setMessages(prev => [...prev, timeoutMessage]);
  }
}, 180000); // 3 minute timeout
```

## Text vs Tool Chunk Handling

### Text Chunks

**Edge Function Processing:**
- Received as `chunk.type === 'text'` from Claude
- Immediately sent as `content_delta` SSE events
- No buffering or processing delay

**Client Processing:**
- Processed immediately when received
- Added to streaming buffer for smooth display
- Real-time UI updates character by character

**UI Display:**
- Instant character-by-character display
- Smooth typing animation effect
- Buffer management prevents UI blocking

### Tool Execution Chunks

**Edge Function Processing:**
- Tool calls detected as `chunk.type === 'tool_use'`
- `tool_start` event sent immediately
- Tools executed server-side with database access
- `tool_complete` event sent with results
- Claude re-queried with tool results for final response

**Client Processing:**
- `tool_start` triggers UI processing indicator
- Tool completion updates stored in metadata
- Final response continues normal text streaming

**UI Display:**
- Processing indicator with animated styling
- Timeout handling for stuck tool execution
- Clean state management and error recovery

## Stream Management and Connection Pooling

### StreamManager Class

The `StreamManager` (in `claudeAPIProxy.ts`) provides advanced connection management:

```typescript
class StreamManager {
  private connectionPool = new Map<string, ConnectionPool>();
  private tokenBatches = new Map<string, TokenBatch>();
  private memoryPool = new Map<string, MemoryBuffer>();
  
  createManagedStream(streamId: string): AbortController {
    // Connection pooling and reuse logic
    // Memory management and garbage collection
    // Performance metrics tracking
  }
  
  addTokenToBatch(streamId: string, token: string, metadata: any) {
    // Intelligent token batching for high-velocity streams
    // Adaptive thresholds based on stream characteristics
  }
}
```

### Memory Management

Advanced memory management prevents memory leaks in long streaming sessions:

- **Buffer Pooling** - Reuse ArrayBuffers for stream processing
- **Garbage Collection** - Automated cleanup of unused connections
- **Memory Pressure Monitoring** - Adaptive behavior under memory constraints
- **Connection Lifecycle** - Automatic timeout and cleanup

## Error Handling and Recovery

### Edge Function Level
- Graceful handling of Claude API errors
- Tool execution error recovery
- Stream corruption detection and cleanup

### Client Level
- Network interruption recovery
- Malformed SSE data handling
- Timeout and retry logic

### UI Level
- Stream timeout handling (3-minute limit)
- Tool processing stuck state recovery
- User-friendly error messages
- State cleanup and reset

## Performance Optimizations

### Chunking Strategy
- **Immediate Text Streaming** - No buffering delays for text content
- **Batched Tool Events** - Tool start/complete events sent as discrete messages
- **Completion Metadata** - Rich metadata sent only on completion

### Memory Efficiency
- **Buffer Reuse** - Streaming buffers reused across connections
- **Connection Pooling** - HTTP connections reused when possible
- **Garbage Collection** - Automated cleanup of unused resources

### UI Performance
- **Incremental Updates** - Character-by-character display prevents blocking
- **State Batching** - Multiple state updates batched when possible
- **Timeout Management** - Prevents memory leaks from stuck streams

## Debugging and Monitoring

### Logging Strategy
```typescript
// Edge function logging
console.log('🌊 Starting streaming response...');
console.log('📡 Streaming chunk received:', chunk.type);
console.log('🔧 Tool use detected:', chunk.name);

// Client-side logging  
console.log('🚨 SSE EVENT DEBUG:', { eventType, hasContent, contentLength });
console.log('📝 CALLING onChunk with content:', content.substring(0, 50));

// UI logging
console.log('📡 STREAMING CHUNK RECEIVED:', { chunkLength, isComplete, toolProcessing });
```

### Performance Metrics
- Stream connection count and health
- Token processing rates and batch efficiency
- Memory utilization and garbage collection stats
- Tool execution timing and success rates

## Integration Points

### Agent System Integration
- Agent context passed through all streaming layers
- Agent switching detected and handled during streaming
- Agent-specific tool execution and permissions

### Database Integration
- Real-time message storage during streaming
- Tool execution results stored with session context
- Conversation history maintained across streams

### MCP Integration
- Model Context Protocol tools integrated with streaming
- Browser automation capabilities with real-time feedback
- Memory management for long-running automation tasks

This architecture provides a robust, scalable, and user-friendly streaming experience that handles both simple text responses and complex multi-tool execution workflows seamlessly.
// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ClaudeAPIService, ToolExecutionService } from '../services/claude.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import { buildSystemPrompt, loadAgentContext, loadUserProfile } from '../utils/system-prompt.ts';
import { ClaudeMessage, ClaudeToolDefinition } from '../types.ts';

// Supabase client interface
interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => SupabaseQuery;
    insert: (data: Record<string, unknown>) => SupabaseQuery;
    update: (data: Record<string, unknown>) => SupabaseQuery;
    delete: () => SupabaseQuery;
    eq: (column: string, value: unknown) => SupabaseQuery;
    in: (column: string, values: unknown[]) => SupabaseQuery;
    order: (column: string, options?: Record<string, unknown>) => SupabaseQuery;
    limit: (count: number) => SupabaseQuery;
    single: () => SupabaseQuery;
  };
  auth: {
    getUser: () => Promise<{ data: { user: Record<string, unknown> } | null; error: unknown }>;
  };
}

interface SupabaseQuery {
  select: (columns?: string) => SupabaseQuery;
  insert: (data: Record<string, unknown>) => SupabaseQuery;
  update: (data: Record<string, unknown>) => SupabaseQuery;
  delete: () => SupabaseQuery;
  eq: (column: string, value: unknown) => SupabaseQuery;
  in: (column: string, values: unknown[]) => SupabaseQuery;
  order: (column: string, options?: Record<string, unknown>) => SupabaseQuery;
  limit: (count: number) => SupabaseQuery;
  single: () => SupabaseQuery;
  textSearch: (column: string, query: string) => SupabaseQuery;
  ilike: (column: string, pattern: string) => SupabaseQuery;
  then: <T>(onfulfilled?: (value: { data: T; error: unknown }) => T | PromiseLike<T>) => Promise<T>;
}

// Interface for tool calls (matching Claude service)
interface ClaudeToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// Type guards for runtime type checking
function isClaudeToolCall(obj: unknown): obj is ClaudeToolCall {
  return typeof obj === 'object' && obj !== null &&
         'id' in obj && 'name' in obj && 'input' in obj &&
         typeof (obj as Record<string, unknown>).id === 'string' &&
         typeof (obj as Record<string, unknown>).name === 'string';
}

function isToolExecutionResult(obj: unknown): obj is { function_name: string; result?: { success?: boolean; artifact?: { id?: string; title?: string } }; output?: unknown } {
  return typeof obj === 'object' && obj !== null &&
         'function_name' in obj &&
         typeof (obj as Record<string, unknown>).function_name === 'string';
}
// Recursive streaming helper to handle unlimited tool call chains
async function streamWithRecursiveTools(
  messages: ClaudeMessage[],
  tools: ClaudeToolDefinition[],
  systemPrompt: string,
  claudeService: ClaudeAPIService,
  toolService: ToolExecutionService,
  controller: ReadableStreamDefaultController<Uint8Array>,
  sessionId?: string,
  agentId?: string,
  recursionDepth: number = 0
): Promise<{ fullContent: string; toolsUsed: string[]; executedToolResults: unknown[] }> {
  const MAX_RECURSION_DEPTH = 5;
  let fullContent = '';
  const toolsUsed: string[] = [];
  const executedToolResults: unknown[] = [];
  
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    console.warn(`🔄 Max recursion depth (${MAX_RECURSION_DEPTH}) reached, stopping recursive calls`);
    return { fullContent, toolsUsed, executedToolResults };
  }
  
  const pendingToolCalls: unknown[] = [];
  
  // Stream from Claude API
  const response = await claudeService.streamMessage(messages, tools, (chunk: unknown) => {
    try {
      const chunkData = chunk as Record<string, unknown>;
      if (chunkData.type === 'text' && chunkData.content) {
        const textContent = chunkData.content as string;
        
        // MINIMAL TEXT CLEANING: Only remove obvious tool metadata, preserve all actual content
        let cleanTextContent = textContent;
        
        // Only clean if text contains clear tool metadata markers (very conservative)
        if (textContent.includes('"tool_use_id"') || textContent.includes('"type":"tool_use"')) {
          cleanTextContent = textContent
            .replace(/\{"tool_use_id":"[^"]+"[^}]*\}/g, '') // Remove complete tool_use_id objects only
            .replace(/\{"id":"[^"]+","type":"tool_use"[^}]*\}/g, '') // Remove tool_use JSON objects only
            .trim();
        }
        
        console.log('🧹 Text cleaning:', {
          original_length: textContent.length,
          cleaned_length: cleanTextContent.length,
          had_tool_metadata: textContent !== cleanTextContent
        });
        

        
        // Only add to fullContent and stream if we have actual text content
        if (cleanTextContent) {
          fullContent += cleanTextContent;
          
          const textEvent = {
            type: 'content_delta',
            delta: cleanTextContent,
            full_content: fullContent
          };
          const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
          controller.enqueue(new TextEncoder().encode(sseData));
        }
        
      } else if (chunkData.type === 'tool_use' && chunkData.name) {
        console.log(`🔧 Tool use detected at depth ${recursionDepth}:`, chunkData.name);
        if (!toolsUsed.includes(chunkData.name as string)) {
          toolsUsed.push(chunkData.name as string);
        }
        
        pendingToolCalls.push(chunkData);
        
        // Send tool invocation start event
        const toolEvent = {
          type: 'tool_invocation',
          toolEvent: {
            type: 'tool_start',
            toolName: chunkData.name,
            parameters: chunkData.input,
            timestamp: new Date().toISOString()
          }
        };
        const sseData = `data: ${JSON.stringify(toolEvent)}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseData));
      }
    } catch (error) {
      console.error('Error in recursive chunk handler:', error);
    }
  }, systemPrompt);
  
  // If there are tool calls, execute them and recurse
  if (pendingToolCalls.length > 0) {
    console.log(`🔧 Executing ${pendingToolCalls.length} tools at depth ${recursionDepth}`);
    
    const toolResults = [];
    for (const toolCall of pendingToolCalls) {
      if (!isClaudeToolCall(toolCall)) continue;
      
      try {
        const result = await toolService.executeTool(toolCall, sessionId, agentId);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        });
        
        executedToolResults.push({
          function_name: toolCall.name,
          result: result
        });
        
        // Send tool completion event
        const toolCompleteEvent = {
          type: 'tool_invocation',
          toolEvent: {
            type: 'tool_complete',
            toolName: toolCall.name,
            result: result,
            timestamp: new Date().toISOString()
          }
        };
        const completeSseData = `data: ${JSON.stringify(toolCompleteEvent)}\n\n`;
        controller.enqueue(new TextEncoder().encode(completeSseData));
        
      } catch (error) {
        console.error(`Tool execution error for ${toolCall.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
        const errorResult = { success: false, error: errorMessage };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(errorResult)
        });
        executedToolResults.push({
          function_name: toolCall.name,
          result: errorResult
        });
      }
    }
    
    // 🔄 CHECK FOR AGENT SWITCHING WITH CONTINUATION
    const agentSwitchResult = executedToolResults.find(result => {
      const resultData = result as Record<string, unknown>;
      return resultData.function_name === 'switch_agent' && 
             (resultData.result as Record<string, unknown>)?.success === true && 
             (resultData.result as Record<string, unknown>)?.trigger_continuation === true;
    }) as Record<string, unknown> | undefined;
    
    if (agentSwitchResult && recursionDepth < MAX_RECURSION_DEPTH - 1) {
      console.log('🚀 AGENT SWITCH WITH CONTINUATION DETECTED');
      
      try {
        const switchResult = agentSwitchResult.result as Record<string, unknown>;
        const newAgentData = switchResult.new_agent as Record<string, unknown>;
        const contextMessage = switchResult.context_message;
        
        console.log('🤖 Triggering new agent automatic response:', {
          agent_name: newAgentData?.name,
          agent_role: newAgentData?.role,
          context_preview: (contextMessage as string)?.substring(0, 100)
        });
        
        // Get new agent context and tools - need to import necessary functions
        const { loadAgentContext } = await import('../utils/system-prompt.ts');
        const { buildSystemPrompt } = await import('../utils/system-prompt.ts');
        const { getToolDefinitions } = await import('../tools/definitions.ts');
        
        const newAgentContext = await loadAgentContext(
          undefined, // supabase client will be handled internally
          sessionId,
          newAgentData?.id as string
        );
        
        if (!newAgentContext) {
          throw new Error('Failed to load new agent context');
        }
        
        // Build system prompt for new agent that SKIPS welcome and focuses on context processing
        const baseSystemPrompt = buildSystemPrompt({
          agent: newAgentContext,
          sessionId: sessionId
        });
        
        // Override system prompt to focus on context processing, not welcome
        const contextProcessingPrompt = baseSystemPrompt + 
          `\n\n🤖 CONTEXT HANDOFF MODE: You are receiving a handoff from another agent. ` +
          `DO NOT provide a welcome message or introduction. ` +
          `Instead, IMMEDIATELY process the context and take appropriate actions based on your role. ` +
          `The user has already been greeted by the previous agent.`;
        
        const newTools = getToolDefinitions(newAgentData?.role as string);
        
        // Create continuation messages with context
        const continuationMessages = [
          {
            role: 'user' as const,
            content: (contextMessage as string) || 'Continue with the previous context.'
          }
        ];
        
        // **RECURSIVE CALL FOR NEW AGENT** - Process context without welcome
        const continuationResult = await streamWithRecursiveTools(
          continuationMessages,
          newTools,
          contextProcessingPrompt,
          claudeService,
          toolService,
          controller,
          sessionId,
          agentId,
          recursionDepth + 1
        );
        
        // Merge continuation results with proper transition handling
        // AGENT SWITCH TRANSITION FIX: If original content ends abruptly, add transition text
        let transitionContent = '';
        if (fullContent.length > 0 && !fullContent.endsWith('.') && !fullContent.endsWith('!') && !fullContent.endsWith('?')) {
          // Original content was truncated mid-sentence, provide smooth transition
          transitionContent = '...\n\n*Connecting you with our RFP Design specialist for detailed technical assistance...*\n\n';
          console.log('🔄 Adding transition text for truncated agent switch');
        } else if (fullContent.length > 0) {
          // Original content was complete, add normal separator
          transitionContent = '\n\n';
        }
        
        fullContent += transitionContent + continuationResult.fullContent;
        toolsUsed.push(...continuationResult.toolsUsed.filter(tool => !toolsUsed.includes(tool)));
        executedToolResults.push(...continuationResult.executedToolResults);
        
        console.log('✅ Agent continuation completed', {
          new_agent: newAgentData?.name,
          continuation_content_length: continuationResult.fullContent.length,
          tools_used: continuationResult.toolsUsed
        });
        
        // Return early - no need for standard recursion since we handled the agent switch
        return { fullContent, toolsUsed, executedToolResults };
        
      } catch (continuationError) {
        console.error('❌ Agent continuation failed:', continuationError);
        // Fall through to standard recursion behavior
      }
    }
    
    // Build messages with tool results
    const messagesWithToolResults = [
      ...messages,
      {
        role: 'assistant' as const,
        content: response.toolCalls.map((tc: unknown) => ({
          type: 'tool_use' as const,
          id: (tc as Record<string, unknown>).id as string,
          name: (tc as Record<string, unknown>).name as string,
          input: (tc as Record<string, unknown>).input as Record<string, unknown>
        }))
      },
      {
        role: 'user' as const,
        content: toolResults.map((result: unknown, index: number) => ({
          type: 'tool_result' as const,
          tool_use_id: response.toolCalls[index]?.id || `tool_${index}`,
          content: typeof result === 'string' ? result : JSON.stringify(result)
        }))
      }
    ];
    
    // Recurse to handle potential additional tool calls
    const recursiveResult = await streamWithRecursiveTools(
      messagesWithToolResults,
      tools,
      systemPrompt,
      claudeService,
      toolService,
      controller,
      sessionId,
      agentId,
      recursionDepth + 1
    );
    
    // Combine results
    fullContent += recursiveResult.fullContent;
    toolsUsed.push(...recursiveResult.toolsUsed.filter(tool => !toolsUsed.includes(tool)));
    executedToolResults.push(...recursiveResult.executedToolResults);
  }
  
  return { fullContent, toolsUsed, executedToolResults };
}

// Handle streaming response with proper SSE format and tool execution
function handleStreamingResponse(
  messages: unknown[], 
  supabase: unknown, 
  userId: string, 
  sessionId?: string, 
  agentId?: string,
  userMessage?: string,
  agent?: { role?: string },
  newSessionData?: { success: boolean; session_id: string; message: string } | null
): Promise<Response> {
  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeService = new ClaudeAPIService();
        const toolService = new ToolExecutionService(supabase, userId, userMessage);
        
        console.log(`🧩 STREAMING: Agent object received:`, agent);
        console.log(`🧩 STREAMING: Agent role:`, agent?.role);
        console.log(`🧩 STREAMING: Agent type:`, typeof agent);
        
        // Load agent context and user profile, then build system prompt
        const agentContext = await loadAgentContext(supabase, sessionId, agentId);
        const userProfile = await loadUserProfile(supabase);
        
        // Extract user message for agent switch context detection
        const lastUserMessage = messages && messages.length > 0 ? 
          messages[messages.length - 1] : null;
        const userMessageText = lastUserMessage && 
          typeof lastUserMessage === 'object' && 
          'content' in lastUserMessage ? 
          String((lastUserMessage as Record<string, unknown>).content) : undefined;
        
        const systemPrompt = buildSystemPrompt({ 
          agent: agentContext || undefined,
          userProfile: userProfile || undefined,
          sessionId: sessionId,
          isAnonymous: !userProfile
        }, userMessageText);
        console.log('🎯 STREAMING: System prompt built:', systemPrompt ? 'Yes' : 'No');
        console.log('🔄 STREAMING: Agent switch context detection:', userMessageText?.includes('User context from previous agent:') || false);
        
        // 🔍 DEBUG: Log agent role before getting tools - USE agentContext not agent from request
        console.log('🔧 DEBUG: Request agent role:', agent?.role, typeof agent?.role);
        console.log('🔧 DEBUG: AgentContext role:', agentContext?.role, typeof agentContext?.role);
        console.log('🔧 DEBUG: AgentContext object:', { id: agentContext?.id, name: agentContext?.name, role: agentContext?.role });
        
        const tools = getToolDefinitions(agentContext?.role);
        
        // Use recursive streaming to handle unlimited tool call chains
        const result = await streamWithRecursiveTools(
          messages as ClaudeMessage[],
          tools,
          systemPrompt,
          claudeService,
          toolService,
          controller,
          sessionId,
          agentId
        );
        
        const { fullContent, toolsUsed, executedToolResults } = result;

        console.log('� Recursive streaming completed:', {
          fullContentLength: fullContent.length,
          toolsUsedCount: toolsUsed.length,
          executedToolResultsCount: executedToolResults.length,
          toolsUsed: toolsUsed
        });
        
        // Detect if an agent switch occurred during streaming
        const agentSwitchOccurred = executedToolResults.some((result: unknown) => {
          return isToolExecutionResult(result) && result.function_name === 'switch_agent' && result.result?.success === true;
        });

        // Send completion event with metadata including agent switch detection
        const completeEvent: Record<string, unknown> = {
          type: 'complete',
          full_content: fullContent,
          token_count: fullContent.length, // Approximate token count
          tool_results: toolsUsed.map(name => ({ name, success: true })),
          metadata: {
            agent_switch_occurred: agentSwitchOccurred,
            functions_called: toolsUsed,
            function_results: executedToolResults
          }
        };
        
        // Add session creation info if a new session was auto-created
        if (newSessionData) {
          completeEvent.session_created = true;
          completeEvent.new_session = {
            id: newSessionData.session_id,
            message: newSessionData.message
          };
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
        controller.close();
        
      } catch (error) {
        console.error('Streaming error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
        const errorEvent = JSON.stringify({ type: 'error', error: errorMessage });
        controller.enqueue(new TextEncoder().encode(`data: ${errorEvent}\n\n`));
        controller.close();
      }
    }
  });

  return Promise.resolve(new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  }));
}

// Handle OPTIONS request for CORS
export function handleOptionsRequest(): Response {
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}

// Handle POST request - main Claude API integration
export async function handlePostRequest(request: Request): Promise<Response> {
  try {
    // Validate authentication
    const _token = validateAuthHeader(request);
    
    // Get authenticated Supabase client
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase, request);
    
    // Parse request body
    const body = await request.json();
    const { 
      userMessage, 
      agent, 
      conversationHistory = [], 
      sessionId, 
      agentId, 
      userProfile: _userProfile,
      currentRfp: _currentRfp,
      currentArtifact: _currentArtifact,
      loginEvidence: _loginEvidence,
      memoryContext = '', // Memory context from client-side embedding generation
      stream = false, 
      clientCallback,
      // Legacy support for direct messages format
      messages
    } = body;
    
    // Load agent context and user profile, then build system prompt
    const agentContext = await loadAgentContext(supabase, sessionId, agentId);
    const loadedUserProfile = await loadUserProfile(supabase);
    
    // 🔍 LOADED AGENT CONTEXT DEBUG
    console.log('🗄️🗄️🗄️ DATABASE AGENT CONTEXT 🗄️🗄️🗄️');
    console.log('Loaded agentContext.name:', agentContext?.name);
    console.log('Loaded agentContext.role:', agentContext?.role);
    console.log('Loaded agentContext.instructions preview:', agentContext?.instructions?.substring(0, 100) + '...');
    console.log('🗄️🗄️🗄️ END DATABASE AGENT CONTEXT 🗄️🗄️🗄️');
    
    const systemPrompt = buildSystemPrompt({ 
      agent: agentContext || undefined,
      userProfile: loadedUserProfile || undefined,
      sessionId: sessionId,
      isAnonymous: !loadedUserProfile,
      memoryContext: memoryContext || undefined
    });
    console.log('🎯 POST REQUEST: System prompt built:', systemPrompt ? 'Yes' : 'No');
    
    // Convert ClaudeService format to messages format
    let processedMessages: unknown[] = [];
    
    if (messages && Array.isArray(messages)) {
      // Direct messages format (legacy)
      processedMessages = messages;
    } else if (userMessage) {
      // ClaudeService format - convert to messages
      processedMessages = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];
    } else {
      return new Response(
        JSON.stringify({ error: 'Either messages array or userMessage is required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate message format
    if (processedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array cannot be empty' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate message roles
    for (const message of processedMessages) {
      const messageObj = message as Record<string, unknown>;
      if (!messageObj.role || !['user', 'assistant', 'system'].includes(messageObj.role as string)) {
        return new Response(
          JSON.stringify({ error: `Invalid message role: ${messageObj.role}. Must be 'user', 'assistant', or 'system'` }),
          { status: 400, headers: corsHeaders }
        );
      }
      if (!messageObj.content) {
        return new Response(
          JSON.stringify({ error: 'Message content is required' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    // Use agentId from payload, or extract from agent object
    const effectiveAgentId = agentId || agent?.id;
    
    // 🔍 BROWSER vs API DEBUG: Compare agent sources
    console.log('🔍🔍🔍 AGENT CONTEXT DEBUG 🔍🔍🔍');
    console.log('AgentId from payload:', agentId);
    console.log('Agent.id from payload:', agent?.id);
    console.log('Agent.name from payload:', agent?.name);
    console.log('Agent.instructions preview:', agent?.instructions?.substring(0, 100) + '...');
    console.log('Effective agentId being used:', effectiveAgentId);
    console.log('🔍🔍🔍 END AGENT CONTEXT DEBUG 🔍🔍🔍');
    
    console.log('Request received:', { 
      userId, 
      sessionId, 
      agentId: effectiveAgentId,
      messageCount: processedMessages?.length,
      hasUserMessage: !!userMessage,
      hasAgent: !!agent,
      hasConversationHistory: conversationHistory.length > 0,
      stream,
      hasClientCallback: !!clientCallback 
    });

    // Auto-create session if none provided (for first message)
    let actualSessionId = sessionId;
    let newSessionData: { success: boolean; session_id: string; message: string } | null = null;
    
    if (!sessionId) {
      console.log('🆕 No session ID provided - creating new session automatically');
      
      // Import createSession function
      const { createSession } = await import('../tools/database.ts');
      
      try {
        const sessionResult = await createSession(supabase as unknown as SupabaseClient, {
          userId: userId,
          title: userMessage?.substring(0, 50) || 'New Conversation',
          agentId: effectiveAgentId
        });
        
        if (sessionResult.success) {
          actualSessionId = sessionResult.session_id;
          newSessionData = sessionResult; // Store the full result
          console.log('✅ Auto-created session:', actualSessionId);
        } else {
          console.error('❌ Failed to auto-create session');
        }
      } catch (error) {
        console.error('❌ Error auto-creating session:', error);
      }
    }

    // If streaming is requested, handle it separately
    if (stream) {
      console.log('🌊 Streaming requested - using streaming handler');
      return handleStreamingResponse(processedMessages, supabase, userId, actualSessionId, effectiveAgentId, userMessage, agent, newSessionData);
    }

    // Initialize services
    const claudeService = new ClaudeAPIService();
    const toolService = new ToolExecutionService(supabase, userId, userMessage);
    
    // Get tool definitions filtered by agent role - USE agentContext not agent from request
    console.log(`🧩 NON-STREAMING: Request agent object:`, agent);
    console.log(`🧩 NON-STREAMING: Request agent role:`, agent?.role);
    console.log(`🧩 NON-STREAMING: AgentContext role:`, agentContext?.role);
    console.log(`🧩 NON-STREAMING: AgentContext object:`, { id: agentContext?.id, name: agentContext?.name, role: agentContext?.role });
    
    const tools = getToolDefinitions(agentContext?.role);
    
    // Send request to Claude API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claudeResponse = await claudeService.sendMessage(processedMessages as ClaudeMessage[], tools);
    
    // Execute any tool calls
    let toolResults: unknown[] = [];
    if (claudeResponse.toolCalls && claudeResponse.toolCalls.length > 0) {
      console.log('Executing tool calls:', claudeResponse.toolCalls.length);
      toolResults = await toolService.executeToolCalls(claudeResponse.toolCalls, sessionId);
      
      // If there were tool calls, send follow-up message to Claude with results
      if (toolResults.length > 0) {
        const followUpMessages = [
          ...processedMessages,
          {
            role: 'assistant',
            content: claudeResponse.toolCalls.map((call: unknown) => ({
              type: 'tool_use',
              id: isClaudeToolCall(call) ? call.id : String((call as Record<string, unknown>).id || ''),
              name: isClaudeToolCall(call) ? call.name : String((call as Record<string, unknown>).name || ''),
              input: isClaudeToolCall(call) ? call.input : (call as Record<string, unknown>).input || {}
            }))
          },
          {
            role: 'user',
            content: toolResults.map((result: unknown, index: number) => ({
              type: 'tool_result',
              tool_use_id: claudeResponse.toolCalls[index].id, // Use the original tool call ID
              content: JSON.stringify(result) // The result itself is the output
            }))
          }
        ];
        
        // Get final response from Claude
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalResponse = await claudeService.sendMessage(followUpMessages as ClaudeMessage[], tools);
        claudeResponse.textResponse = finalResponse.textResponse;
      }
    }

    // Detect if an agent switch occurred successfully
    // In non-streaming mode, we need to check both the tool calls and the results
    const agentSwitchOccurred = claudeResponse.toolCalls?.some((call: unknown, index: number) => {
      const toolCall = call as Record<string, unknown>;
      const result = toolResults[index] as Record<string, unknown>;
      console.log('🔍 Checking tool call for agent switch:', {
        tool_name: toolCall.name,
        result_success: result?.success,
        result_keys: Object.keys(result || {}),
        is_switch_agent: toolCall.name === 'switch_agent',
        success_check: result?.success === true
      });
      return toolCall.name === 'switch_agent' && result?.success === true;
    }) || false;
    
    console.log('🔍 Agent switch detection result:', {
      agentSwitchOccurred,
      total_tool_calls: claudeResponse.toolCalls?.length || 0,
      tool_names: claudeResponse.toolCalls?.map((call: unknown) => (call as Record<string, unknown>).name)
    });

    // AGENT CONTEXT TRANSFER: Check if we need to trigger continuation after agent switch
    if (agentSwitchOccurred) {
      console.log('🔄 Agent switch detected - checking for continuation requirement');
      
      // Find the switch_agent result that has trigger_continuation
      const switchAgentResult = toolResults.find((result: unknown, index: number) => {
        const toolCall = claudeResponse.toolCalls?.[index] as unknown as Record<string, unknown>;
        const resultData = result as Record<string, unknown>;
        return toolCall?.name === 'switch_agent' && resultData?.success === true && resultData?.trigger_continuation === true;
      }) as Record<string, unknown>;
      
      if (switchAgentResult?.trigger_continuation) {
        const newAgentData = switchAgentResult.new_agent as Record<string, unknown>;
        console.log('🤖 Triggering agent continuation with conversation history:', {
          new_agent_id: newAgentData?.id,
          new_agent_name: newAgentData?.name,
          session_id: sessionId
        });

        try {
          // Fetch full conversation history for the new agent
          const { fetchConversationHistory } = await import('../tools/database.ts');
          const conversationHistory = await fetchConversationHistory(supabase as SupabaseClient, sessionId);
          
          console.log('📚 Retrieved conversation history:', {
            message_count: conversationHistory.length,
            first_message_preview: conversationHistory[0]?.message?.substring(0, 100),
            last_message_preview: conversationHistory[conversationHistory.length - 1]?.message?.substring(0, 100)
          });
          
          // **TRIGGER AUTOMATIC CONTINUATION** - Make new agent respond immediately
          try {
            console.log('🚀 TRIGGERING AUTOMATIC AGENT CONTINUATION WITH CONVERSATION HISTORY');
            
            // Build continuation messages from conversation history instead of passed context
            const continuationMessages = conversationHistory.map(msg => ({
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.message
            }));
            
            // Add current assistant response to conversation
            continuationMessages.push({
              role: 'assistant' as const,
              content: claudeResponse.textResponse || ''
            });
            
            // Add system message prompting new agent to continue
            continuationMessages.push({
              role: 'system' as const,
              content: `You are now the active agent for this conversation. Please review the conversation history above and continue assisting the user based on your role as ${newAgentData?.name}. Respond naturally and appropriately to the user's needs based on the full context.`
            });
            
            // Get new agent context and tools
            const newAgentContext = await loadAgentContext(
              supabase as SupabaseClient,
              sessionId,
              newAgentData?.id as string
            );
            
            if (!newAgentContext) {
              throw new Error('Failed to load new agent context');
            }
            
            const newSystemPrompt = buildSystemPrompt({
              agent: newAgentContext,
              sessionId: sessionId
            });
            
            const newTools = getToolDefinitions(newAgentData?.role as string);
            
            console.log('🤖 Triggering new agent response:', {
              agent_name: newAgentData?.name,
              agent_role: newAgentData?.role,
              tools_count: newTools.length,
              system_prompt_length: newSystemPrompt.length
            });
            
            // **NON-STREAMING AGENT CONTINUATION** - Get response from new agent
            const continuationResponse = await claudeService.sendMessage(continuationMessages as ClaudeMessage[], newTools);
            
            // Update the main response with continuation
            if (continuationResponse.textResponse) {
              claudeResponse.textResponse = continuationResponse.textResponse;
            }
            
            console.log('✅ Agent continuation completed successfully', {
              continuation_content_length: continuationResponse.textResponse?.length || 0,
              has_tool_calls: continuationResponse.toolCalls?.length > 0
            });
            
          } catch (continuationError) {
            console.error('❌ Automatic agent continuation failed:', continuationError);
            // Fallback to original behavior - just notify about the switch
            claudeResponse.textResponse = `*Connected to ${newAgentData?.name} agent. Please continue your conversation.*`;
          }
          
        } catch (continuationError) {
          console.error('❌ Agent continuation setup failed:', continuationError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Prepare metadata in format expected by client
    const metadata: Record<string, unknown> = {
      model: 'claude-sonnet-4-5-20250929',
      response_time: 0,
      temperature: 0.3,
      tokens_used: claudeResponse.usage?.output_tokens || 0,
      functions_called: claudeResponse.toolCalls?.map((call: unknown) => (call as Record<string, unknown>).name) || [],
      function_results: toolResults,
      is_streaming: false,
      stream_complete: true,
      agent_switch_occurred: agentSwitchOccurred
    };

    // Add tool_use information for artifact reference generation
    if (claudeResponse.toolCalls && claudeResponse.toolCalls.length > 0) {
      // Use the first tool call for tool_use (client expects single tool_use object)
      const firstToolCall = claudeResponse.toolCalls[0];
      metadata.tool_use = {
        name: firstToolCall.name,
        input: firstToolCall.input
      };
    }

    // Create artifacts array from form creation results
    const artifacts: unknown[] = [];
    toolResults.forEach((result: unknown) => {
      if (isToolExecutionResult(result) && result.function_name === 'create_form_artifact' && result.result?.success) {
        artifacts.push({
          name: result.result.artifact?.title || 'Form Artifact',
          type: 'form',
          id: result.result.artifact?.id,
          created: true
        });
      }
    });

    if (artifacts.length > 0) {
      metadata.artifacts = artifacts;
    }

    // Prepare response
    const responseData: Record<string, unknown> = {
      success: true,
      content: claudeResponse.textResponse, // Changed from 'response' to 'content' for client compatibility
      metadata: metadata, // Add metadata object with artifact info
      toolCalls: claudeResponse.toolCalls,
      toolResults: toolResults,
      usage: claudeResponse.usage,
      sessionId: actualSessionId, // Use actualSessionId which contains the auto-created session ID if needed
      agentId: effectiveAgentId
    };

    // Add session creation info if a new session was auto-created
    if (newSessionData) {
      responseData.sessionCreated = true;
      responseData.newSession = {
        id: newSessionData.session_id,
        message: newSessionData.message
      };
    }

    // Handle client callback if provided
    if (clientCallback) {
      console.log('Executing client callback:', clientCallback);
      try {
        // Add callback execution results to response
        responseData.clientCallback = {
          executed: true,
          type: clientCallback.type,
          data: clientCallback.data
        };
      } catch (callbackError) {
        console.error('Client callback execution failed:', callbackError);
        responseData.clientCallback = {
          executed: false,
          error: callbackError instanceof Error ? callbackError.message : 'Unknown error'
        };
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error('Error in handlePostRequest:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
}

// Handle streaming request (for future implementation)
export async function handleStreamingRequest(request: Request): Promise<Response> {
  try {
    // Validate authentication
    const _token = validateAuthHeader(request);
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase, request);
    
    // Parse request body
    const body = await request.json();
    const { messages, sessionId, agentId } = body;
    
    // Load agent context and build system prompt
    const agentContext = await loadAgentContext(supabase, sessionId, agentId);
    const systemPrompt = buildSystemPrompt({ 
      agent: agentContext || undefined,
      sessionId: sessionId
    });
    console.log('🎯 STREAMING REQUEST: System prompt built:', systemPrompt ? 'Yes' : 'No');
    
    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeService = new ClaudeAPIService();
          const _toolService = new ToolExecutionService(supabase, userId, undefined);
          
          // 🔍 DEBUG: Log agent role for this streaming handler too
          console.log('🔧 DEBUG: STREAMING REQUEST - AgentContext role:', agentContext?.role);
          const tools = getToolDefinitions(agentContext?.role);
          
          // Stream response from Claude
          await claudeService.streamMessage(messages, tools, (chunk) => {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }, systemPrompt);
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in handleStreamingRequest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
}
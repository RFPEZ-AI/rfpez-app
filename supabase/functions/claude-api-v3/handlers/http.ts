// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ClaudeAPIService, ToolExecutionService } from '../services/claude.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import { buildSystemPrompt, loadAgentContext, loadUserProfile } from '../utils/system-prompt.ts';
import { ClaudeMessage } from '../types.ts';

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
// Handle streaming response with proper SSE format and tool execution
function handleStreamingResponse(
  messages: unknown[], 
  supabase: unknown, 
  userId: string, 
  sessionId?: string, 
  agentId?: string,
  userMessage?: string,
  agent?: { role?: string }
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
        const agentContext = await loadAgentContext(supabase, agentId);
        const userProfile = await loadUserProfile(supabase);
        const systemPrompt = buildSystemPrompt({ 
          agent: agentContext || undefined,
          userProfile: userProfile || undefined,
          sessionId: sessionId,
          isAnonymous: !userProfile
        });
        console.log('🎯 STREAMING: System prompt built:', systemPrompt ? 'Yes' : 'No');
        
        const tools = getToolDefinitions(agent?.role);
        
        console.log('🌊 Starting streaming response...');
        
        let fullContent = '';
        const toolsUsed: string[] = [];
        const pendingToolCalls: unknown[] = [];
        const executedToolResults: unknown[] = []; // Track actual tool execution results

        // First, get response from Claude (might include tool calls)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await claudeService.streamMessage(messages as ClaudeMessage[], tools, (chunk) => {
          try {
            console.log('📡 Streaming chunk received:', chunk.type, chunk);
            
            // Handle text content
            if (chunk.type === 'text' && chunk.content) {
              fullContent += chunk.content;
              
              // Send content_delta event in expected format for client
              const textEvent = {
                type: 'content_delta',
                delta: chunk.content,
                full_content: fullContent
              };
              const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
              console.log('📤 Sending to client:', JSON.stringify(textEvent));
              controller.enqueue(new TextEncoder().encode(sseData));
              
            } else if (chunk.type === 'tool_use' && chunk.name) {
              console.log('🔧 Tool use detected:', chunk.name);
              console.log('📡 Streaming chunk received:', chunk.type, JSON.stringify(chunk, null, 2));
              if (!toolsUsed.includes(chunk.name)) {
                toolsUsed.push(chunk.name);
              }
              
              // Store tool call for execution
              pendingToolCalls.push(chunk);
              
              // Send tool invocation start event
              const toolEvent = {
                type: 'tool_invocation',
                toolEvent: {
                  type: 'tool_start',
                  toolName: chunk.name,
                  parameters: chunk.input,
                  timestamp: new Date().toISOString()
                }
              };
              const sseData = `data: ${JSON.stringify(toolEvent)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
            }
          } catch (error) {
            console.error('Error encoding chunk:', error);
          }
        }, systemPrompt);

        // If there are tool calls, execute them and get final response from Claude
        if (pendingToolCalls.length > 0) {
          console.log(`🔧 Executing ${pendingToolCalls.length} tool calls...`);
          
          // Execute all tool calls
          const toolResults = [];
          for (const toolCall of pendingToolCalls) {
            if (!isClaudeToolCall(toolCall)) {
              console.error('Invalid tool call format:', toolCall);
              continue;
            }
            
            try {
              const result = await toolService.executeTool(toolCall, sessionId);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: JSON.stringify(result)
              });
              
              // Store tool execution result for metadata
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
              
              // Store failed tool execution result for metadata
              executedToolResults.push({
                function_name: toolCall.name,
                result: errorResult
              });
            }
          }

          // Create new message with tool results and get final response
          const messagesWithToolResults = [
            ...messages,
            {
              role: 'assistant',
              content: response.toolCalls.map(tc => ({
                type: 'tool_use',
                id: tc.id,
                name: tc.name,
                input: tc.input
              }))
            },
            {
              role: 'user',
              content: toolResults
            }
          ];

          console.log('🔄 Getting final response from Claude with tool results...');
          
          // Reset for potential additional tool calls
          const additionalToolCalls: unknown[] = [];
          
          // Get final response from Claude
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await claudeService.streamMessage(messagesWithToolResults as ClaudeMessage[], tools, (chunk) => {
            try {
              if (chunk.type === 'text' && chunk.content) {
                fullContent += chunk.content;
                
                const textEvent = {
                  type: 'content_delta',
                  delta: chunk.content,
                  full_content: fullContent
                };
                const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
                console.log('📤 Final response to client:', JSON.stringify(textEvent));
                controller.enqueue(new TextEncoder().encode(sseData));
                
              } else if (chunk.type === 'tool_use' && chunk.name) {
                console.log('🔧 Additional tool use detected:', chunk.name);
                if (!toolsUsed.includes(chunk.name)) {
                  toolsUsed.push(chunk.name);
                }
                
                // Store additional tool call for execution
                additionalToolCalls.push(chunk);
                
                // Send tool invocation start event
                const toolEvent = {
                  type: 'tool_invocation',
                  toolEvent: {
                    type: 'tool_start',
                    toolName: chunk.name,
                    parameters: chunk.input,
                    timestamp: new Date().toISOString()
                  }
                };
                const sseData = `data: ${JSON.stringify(toolEvent)}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseData));
              }
            } catch (error) {
              console.error('Error encoding final chunk:', error);
            }
          }, systemPrompt);
          
          // Handle additional tool calls if any
          if (additionalToolCalls.length > 0) {
            console.log(`🔧 Executing ${additionalToolCalls.length} additional tool calls...`);
            
            // Execute additional tool calls
            const additionalToolResults = [];
            for (const toolCall of additionalToolCalls) {
              if (!isClaudeToolCall(toolCall)) {
                console.error('Invalid additional tool call format:', toolCall);
                continue;
              }
              
              try {
                const result = await toolService.executeTool(toolCall, sessionId);
                additionalToolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: JSON.stringify(result)
                });
                
                // Store additional tool execution result for metadata
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
                console.error(`Additional tool execution error for ${toolCall.name}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
                additionalToolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: JSON.stringify({ success: false, error: errorMessage })
                });
              }
            }
            
            // Get final response with additional tool results
            const finalMessages = [
              ...messagesWithToolResults,
              {
                role: 'assistant',
                content: additionalToolCalls.map(tc => ({
                  type: 'tool_use',
                  id: isClaudeToolCall(tc) ? tc.id : String((tc as Record<string, unknown>).id || ''),
                  name: isClaudeToolCall(tc) ? tc.name : String((tc as Record<string, unknown>).name || ''),
                  input: isClaudeToolCall(tc) ? tc.input : (tc as Record<string, unknown>).input || {}
                }))
              },
              {
                role: 'user',
                content: additionalToolResults
              }
            ];
            
            console.log('🔄 Getting final response after additional tools...');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await claudeService.streamMessage(finalMessages as ClaudeMessage[], tools, (chunk) => {
              try {
                if (chunk.type === 'text' && chunk.content) {
                  fullContent += chunk.content;
                  
                  const textEvent = {
                    type: 'content_delta',
                    delta: chunk.content,
                    full_content: fullContent
                  };
                  const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
                  console.log('📤 Final response to client:', JSON.stringify(textEvent));
                  controller.enqueue(new TextEncoder().encode(sseData));
                }
              } catch (error) {
                console.error('Error encoding additional final chunk:', error);
              }
            }, systemPrompt);
          }
        }
        
        // Detect if an agent switch occurred during streaming
        const agentSwitchOccurred = executedToolResults.some((result: unknown) => {
          return isToolExecutionResult(result) && result.function_name === 'switch_agent' && result.result?.success === true;
        });

        // DEBUG: Log completion event details
        console.log('🏁 COMPLETION EVENT DEBUG:', {
          toolsUsedCount: toolsUsed.length,
          executedToolResultsCount: executedToolResults.length,
          executedToolResults: executedToolResults,
          agentSwitchOccurred: agentSwitchOccurred,
          pendingToolCallsCount: pendingToolCalls.length
        });

        // Send completion event with metadata including agent switch detection
        const completeEvent = {
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
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
        
        console.log('✅ Streaming completed successfully');
        console.log('📊 Streaming summary:', {
          textLength: fullContent.length,
          toolCallCount: pendingToolCalls.length
        });
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
      stream = false, 
      clientCallback,
      // Legacy support for direct messages format
      messages
    } = body;
    
    // Load agent context and user profile, then build system prompt
    const agentContext = await loadAgentContext(supabase, agentId);
    const loadedUserProfile = await loadUserProfile(supabase);
    const systemPrompt = buildSystemPrompt({ 
      agent: agentContext || undefined,
      userProfile: loadedUserProfile || undefined,
      sessionId: sessionId,
      isAnonymous: !loadedUserProfile
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

    // If streaming is requested, handle it separately
    if (stream) {
      console.log('🌊 Streaming requested - using streaming handler');
      return handleStreamingResponse(processedMessages, supabase, userId, sessionId, effectiveAgentId, userMessage, agent);
    }

    // Initialize services
    const claudeService = new ClaudeAPIService();
    const toolService = new ToolExecutionService(supabase, userId, userMessage);
    
    // Get tool definitions filtered by agent role
    console.log(`🧩 NON-STREAMING: Agent object received:`, agent);
    console.log(`🧩 NON-STREAMING: Agent role:`, agent?.role);
    console.log(`🧩 NON-STREAMING: Agent type:`, typeof agent);
    
    const tools = getToolDefinitions(agent?.role);
    
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
            content: toolResults.map((result: unknown) => ({
              type: 'tool_result',
              tool_use_id: (result as Record<string, unknown>).tool_call_id as string,
              content: JSON.stringify((result as Record<string, unknown>).output)
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
    const agentSwitchOccurred = toolResults.some((result: unknown) => {
      return isToolExecutionResult(result) && result.function_name === 'switch_agent' && result.result?.success === true;
    });

    // Prepare metadata in format expected by client
    const metadata: Record<string, unknown> = {
      model: 'claude-sonnet-4-20250514',
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
      sessionId: sessionId,
      agentId: effectiveAgentId
    };

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
    const agentContext = await loadAgentContext(supabase, agentId);
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
          const tools = getToolDefinitions();
          
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
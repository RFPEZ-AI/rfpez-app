// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3

import { config, corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ClaudeAPIService, ToolExecutionService } from '../services/claude.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import type { ToolInvocationEvent, StreamingResponse, ClientCallback } from '../types.ts';

// Handle streaming response with proper SSE format and tool execution
async function handleStreamingResponse(
  messages: any[], 
  supabase: any, 
  userId: string, 
  sessionId?: string, 
  agentId?: string,
  userMessage?: string
): Promise<Response> {
  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeService = new ClaudeAPIService();
        const toolService = new ToolExecutionService(supabase, userId, userMessage);
        const tools = getToolDefinitions();
        
        console.log('🌊 Starting streaming response...');
        
        let fullContent = '';
        let toolsUsed: string[] = [];
        let pendingToolCalls: any[] = [];
        let executedToolResults: any[] = []; // Track actual tool execution results

        // First, get response from Claude (might include tool calls)
        const response = await claudeService.streamMessage(messages, tools, (chunk) => {
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
              
            } else if (chunk.type === 'tool_use') {
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
        });

        // If there are tool calls, execute them and get final response from Claude
        if (pendingToolCalls.length > 0) {
          console.log(`🔧 Executing ${pendingToolCalls.length} tool calls...`);
          
          // Execute all tool calls
          const toolResults = [];
          for (const toolCall of pendingToolCalls) {
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
          const additionalToolCalls: any[] = [];
          
          // Get final response from Claude
          await claudeService.streamMessage(messagesWithToolResults, tools, (chunk) => {
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
                
              } else if (chunk.type === 'tool_use') {
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
          });
          
          // Handle additional tool calls if any
          if (additionalToolCalls.length > 0) {
            console.log(`🔧 Executing ${additionalToolCalls.length} additional tool calls...`);
            
            // Execute additional tool calls
            const additionalToolResults = [];
            for (const toolCall of additionalToolCalls) {
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
                  id: tc.id,
                  name: tc.name,
                  input: tc.input
                }))
              },
              {
                role: 'user',
                content: additionalToolResults
              }
            ];
            
            console.log('🔄 Getting final response after additional tools...');
            await claudeService.streamMessage(finalMessages, tools, (chunk) => {
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
            });
          }
        }
        
        // Detect if an agent switch occurred during streaming
        const agentSwitchOccurred = executedToolResults.some((result: any) => {
          return result.function_name === 'switch_agent' && result.result?.success === true;
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

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
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
    const token = validateAuthHeader(request);
    
    // Get authenticated Supabase client
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase);
    
    // Parse request body
    const body = await request.json();
    const { 
      userMessage, 
      agent, 
      conversationHistory = [], 
      sessionId, 
      agentId, 
      userProfile,
      currentRfp,
      currentArtifact,
      loginEvidence,
      stream = false, 
      clientCallback,
      // Legacy support for direct messages format
      messages
    } = body;
    
    // Convert ClaudeService format to messages format
    let processedMessages: any[] = [];
    
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
      if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
        return new Response(
          JSON.stringify({ error: `Invalid message role: ${message.role}. Must be 'user', 'assistant', or 'system'` }),
          { status: 400, headers: corsHeaders }
        );
      }
      if (!message.content) {
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
      return handleStreamingResponse(processedMessages, supabase, userId, sessionId, effectiveAgentId, userMessage);
    }

    // Initialize services
    const claudeService = new ClaudeAPIService();
    const toolService = new ToolExecutionService(supabase, userId, userMessage);
    
    // Get tool definitions
    const tools = getToolDefinitions();
    
    // Send request to Claude API
    const claudeResponse = await claudeService.sendMessage(processedMessages, tools);
    
    // Execute any tool calls
    let toolResults: any[] = [];
    if (claudeResponse.toolCalls && claudeResponse.toolCalls.length > 0) {
      console.log('Executing tool calls:', claudeResponse.toolCalls.length);
      toolResults = await toolService.executeToolCalls(claudeResponse.toolCalls, sessionId);
      
      // If there were tool calls, send follow-up message to Claude with results
      if (toolResults.length > 0) {
        const followUpMessages = [
          ...processedMessages,
          {
            role: 'assistant',
            content: claudeResponse.toolCalls.map((call: any) => ({
              type: 'tool_use',
              id: call.id,
              name: call.name,
              input: call.input
            }))
          },
          {
            role: 'user',
            content: toolResults.map((result: any) => ({
              type: 'tool_result',
              tool_use_id: result.tool_call_id,
              content: JSON.stringify(result.output)
            }))
          }
        ];
        
        // Get final response from Claude
        const finalResponse = await claudeService.sendMessage(followUpMessages, tools);
        claudeResponse.textResponse = finalResponse.textResponse;
      }
    }

    // Detect if an agent switch occurred successfully
    const agentSwitchOccurred = toolResults.some((result: any) => {
      return result.function_name === 'switch_agent' && result.result?.success === true;
    });

    // Prepare metadata in format expected by client
    const metadata: any = {
      model: 'claude-sonnet-4-20250514',
      response_time: 0,
      temperature: 0.3,
      tokens_used: claudeResponse.usage?.output_tokens || 0,
      functions_called: claudeResponse.toolCalls?.map((call: any) => call.name) || [],
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
    const artifacts: any[] = [];
    toolResults.forEach((result: any) => {
      if (result.function_name === 'create_form_artifact' && result.result?.success) {
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
    const responseData: any = {
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
    const token = validateAuthHeader(request);
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase);
    
    // Parse request body
    const body = await request.json();
    const { messages, sessionId, agentId } = body;
    
    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeService = new ClaudeAPIService();
          const toolService = new ToolExecutionService(supabase, userId, undefined);
          const tools = getToolDefinitions();
          
          // Stream response from Claude
          await claudeService.streamMessage(messages, tools, (chunk) => {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          });
          
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
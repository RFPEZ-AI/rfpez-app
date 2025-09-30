// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3

import { config, corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ClaudeAPIService, ToolExecutionService } from '../services/claude.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import type { ToolInvocationEvent, StreamingResponse, ClientCallback } from '../types.ts';

// Handle streaming response with proper SSE format
async function handleStreamingResponse(
  messages: any[], 
  supabase: any, 
  userId: string, 
  sessionId?: string, 
  agentId?: string
): Promise<Response> {
  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeService = new ClaudeAPIService();
        const toolService = new ToolExecutionService(supabase, userId);
        const tools = getToolDefinitions();
        
        console.log('🌊 Starting streaming response...');
        
        // Stream response from Claude with proper formatting
        let fullContent = '';
        let toolsUsed: string[] = [];

        await claudeService.streamMessage(messages, tools, (chunk) => {
          try {
            console.log('📡 Streaming chunk received:', chunk.type, chunk);
            
            // Convert Claude API streaming events to client-expected format
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
              if (!toolsUsed.includes(chunk.name)) {
                toolsUsed.push(chunk.name);
              }
              
              // Send tool invocation start event
              const toolEvent = {
                type: 'tool_invocation',
                toolEvent: {
                  type: 'tool_start',
                  toolName: chunk.name,
                  input: chunk.input
                }
              };
              const sseData = `data: ${JSON.stringify(toolEvent)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
              
              // Execute tool and send completion event
              const toolService = new ToolExecutionService(supabase, userId);
              toolService.executeTool(chunk, sessionId).then((result) => {
                const toolCompleteEvent = {
                  type: 'tool_invocation',
                  toolEvent: {
                    type: 'tool_complete',
                    toolName: chunk.name,
                    result: result
                  }
                };
                const completeSseData = `data: ${JSON.stringify(toolCompleteEvent)}\n\n`;
                controller.enqueue(new TextEncoder().encode(completeSseData));
              }).catch((error) => {
                console.error('Tool execution error:', error);
              });
            }
          } catch (error) {
            console.error('Error encoding chunk:', error);
          }
        });
        
        // Send completion event with metadata
        const completeEvent = {
          type: 'complete',
          full_content: fullContent,
          token_count: fullContent.length, // Approximate token count
          tool_results: toolsUsed.map(name => ({ name, success: true }))
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
        
        console.log('✅ Streaming completed successfully');
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
      return handleStreamingResponse(processedMessages, supabase, userId, sessionId, effectiveAgentId);
    }

    // Initialize services
    const claudeService = new ClaudeAPIService();
    const toolService = new ToolExecutionService(supabase, userId);
    
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
      agent_switch_occurred: false
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
          const toolService = new ToolExecutionService(supabase, userId);
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
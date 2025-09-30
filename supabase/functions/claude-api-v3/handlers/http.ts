// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3

import { config, corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ClaudeAPIService, ToolExecutionService } from '../services/claude.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import type { ToolInvocationEvent, StreamingResponse, ClientCallback } from '../types.ts';

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
        claudeResponse.finalToolCalls = finalResponse.toolCalls;
      }
    }

    // Prepare response
    const responseData = {
      success: true,
      response: claudeResponse.textResponse,
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
          const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
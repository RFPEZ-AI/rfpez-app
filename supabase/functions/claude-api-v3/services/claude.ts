// Copyright Mark Skiba, 2025 All rights reserved
// Claude API service integration for Edge Function

import { mapMessageToClaudeFormat, extractTextFromClaudeResponse, extractToolCallsFromClaudeResponse } from '../utils/mapping.ts';
import { config } from '../config.ts';
import type { ClaudeMessage, ClaudeToolDefinition, ClaudeResponse, ToolResult } from '../types.ts';

interface ClaudeToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface StreamChunk {
  type: string;
  content?: string;
  delta?: { text?: string };
  content_block?: { type: string; text?: string };
  message?: { content: ClaudeToolCall[] };
  // Tool use properties (spread from content_block when type is 'tool_use')
  name?: string;
  input?: Record<string, unknown>;
  id?: string;
}

interface ClaudeServiceResponse {
  textResponse: string;
  toolCalls: ClaudeToolCall[];
  usage: ClaudeResponse['usage'];
  rawResponse: ClaudeResponse | null;
}

// Claude API integration
export class ClaudeAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = config.anthropicApiKey!;
  }

  // Send message to Claude API with tool definitions
  async sendMessage(messages: ClaudeMessage[], tools: ClaudeToolDefinition[], maxTokens = 4000, systemPrompt?: string): Promise<ClaudeServiceResponse> {
    console.log('Sending to Claude API:', { 
      messageCount: messages.length, 
      toolCount: tools.length,
      maxTokens,
      hasSystemPrompt: !!systemPrompt
    });

    // Convert messages to Claude format
    const formattedMessages = messages.map(mapMessageToClaudeFormat);

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: formattedMessages,
      tools: tools,
      ...(systemPrompt && { system: systemPrompt })
    };

    // Log system prompt if provided
    if (systemPrompt) {
      console.log('🎯 Including system prompt:', systemPrompt.substring(0, 200) + '...');
    }

    console.log('Claude API request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data, null, 2));

    return {
      textResponse: extractTextFromClaudeResponse(data.content),
      toolCalls: extractToolCallsFromClaudeResponse(data.content),
      usage: data.usage,
      rawResponse: data
    };
  }

  // Stream message to Claude API with real streaming support
  async streamMessage(messages: ClaudeMessage[], tools: ClaudeToolDefinition[], onChunk: (chunk: StreamChunk) => void, systemPrompt?: string): Promise<ClaudeServiceResponse> {
    console.log('🌊 Starting real streaming to Claude API:', { 
      messageCount: messages.length, 
      toolCount: tools.length,
      hasSystemPrompt: !!systemPrompt
    });

    // Convert messages to Claude format
    const formattedMessages = messages.map(mapMessageToClaudeFormat);

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: formattedMessages,
      tools: tools,
      stream: true,  // Enable streaming
      ...(systemPrompt && { system: systemPrompt })
    };

    // Log system prompt if provided
    if (systemPrompt) {
      console.log('🎯 Including system prompt:', systemPrompt.substring(0, 200) + '...');
    }

    console.log('Claude API streaming request initiated');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API streaming error:', response.status, errorText);
      throw new Error(`Claude API streaming error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body available for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullTextResponse = '';
    const toolCalls: ClaudeToolCall[] = [];
    const activeToolCall: Record<string, unknown> = {}; // Track current tool call being built

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Claude streaming completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines (SSE format)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = line.slice(6).trim();
            
            if (eventData === '[DONE]') {
              console.log('🏁 Received streaming end marker');
              break;
            }

            try {
              const parsed = JSON.parse(eventData);
              console.log('📡 Streaming event:', parsed.type);

              if (parsed.type === 'content_block_delta') {
                console.log('🔧 Delta event type:', parsed.delta?.type, 'activeToolCall.id:', activeToolCall.id);
                
                if (parsed.delta?.type === 'text_delta') {
                  const textChunk = parsed.delta.text;
                  fullTextResponse += textChunk;
                  
                  // Send text chunk to client
                  onChunk({ 
                    type: 'text', 
                    content: textChunk,
                    delta: { text: textChunk } 
                  });
                } else if (parsed.delta?.type === 'input_json_delta' && activeToolCall.id) {
                  // Accumulate input parameters for the active tool call
                  const partialJson = parsed.delta.partial_json || '';
                  console.log('🔧 Tool input delta received:', partialJson);
                  
                  try {
                    // Try to parse the accumulated JSON
                    const inputStr = (activeToolCall.inputJson || '') + partialJson;
                    activeToolCall.inputJson = inputStr;
                    console.log('🔧 Accumulated JSON so far:', inputStr);
                    
                    // Try to parse complete JSON
                    try {
                      activeToolCall.input = JSON.parse(inputStr);
                      console.log('🔧 Tool input successfully parsed:', JSON.stringify(activeToolCall.input, null, 2));
                    } catch {
                      // JSON not complete yet, continue accumulating
                      console.log('🔧 JSON not complete yet, continuing accumulation...');
                    }
                  } catch (error) {
                    console.error('Error processing input_json_delta:', error);
                  }
                } else {
                  console.log('🔧 Other delta type:', parsed.delta?.type);
                }
              } else if (parsed.type === 'content_block_start') {
                if (parsed.content_block?.type === 'tool_use') {
                  console.log('🔧 Tool use detected:', parsed.content_block.name);
                  // Store the initial tool call metadata
                  activeToolCall.id = parsed.content_block.id;
                  activeToolCall.name = parsed.content_block.name;
                  activeToolCall.type = parsed.content_block.type;
                  activeToolCall.input = {}; // Initialize empty input object
                  activeToolCall.inputJson = ''; // Initialize input JSON accumulator
                  
                  console.log('🔧 Started tool call:', JSON.stringify(activeToolCall, null, 2));
                }
              } else if (parsed.type === 'content_block_stop') {
                if (activeToolCall.id) {
                  // Finalize the tool call and add to array
                  const finalToolCall = {
                    id: activeToolCall.id,
                    name: activeToolCall.name,
                    type: activeToolCall.type,
                    input: activeToolCall.input || {}
                  } as ClaudeToolCall;
                  
                  toolCalls.push(finalToolCall);
                  console.log('🔧 Completed tool call:', JSON.stringify(finalToolCall, null, 2));
                  
                  // Send tool use event to client with complete data
                  onChunk({ 
                    ...finalToolCall,
                    type: 'tool_use'
                  });
                  
                  // Reset for next tool call
                  Object.keys(activeToolCall).forEach(key => delete activeToolCall[key]);
                }
              } else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                console.log('🛑 Message stopped:', parsed.delta.stop_reason);
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError, 'Data:', eventData);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('📊 Streaming summary:', {
      textLength: fullTextResponse.length,
      toolCallCount: toolCalls.length
    });

    return {
      textResponse: fullTextResponse,
      toolCalls: toolCalls,
      usage: { input_tokens: 0, output_tokens: 0 }, // Usage not available in streaming
      rawResponse: null
    };
  }
}

// Tool execution service
export class ToolExecutionService {
  // @ts-ignore - Supabase client type compatibility
  private supabase: unknown;
  private userId: string;
  private userMessage?: string;

  // @ts-ignore - Supabase client type compatibility
  constructor(supabase: unknown, userId: string, userMessage?: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.userMessage = userMessage;
  }

  // Execute a tool call and return the result
  async executeTool(toolCall: ClaudeToolCall, sessionId?: string): Promise<ToolResult> {
    const { name, input } = toolCall;
    
    console.log(`Executing tool: ${name}`, input);

    try {
      switch (name) {
        case 'create_form_artifact': {
          const { createFormArtifact } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await createFormArtifact(this.supabase, sessionId!, this.userId, input);
        }

        case 'get_conversation_history': {
          const { getConversationHistory } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await getConversationHistory(this.supabase, input.sessionId || sessionId!);
        }

        case 'store_message': {
          const { storeMessage } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await storeMessage(this.supabase, {
            ...input,
            userId: this.userId,
            sessionId: sessionId || ''
          });
        }

        case 'create_session': {
          const { createSession } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await createSession(this.supabase, {
            ...input,
            userId: this.userId
          });
        }

        case 'search_messages': {
          const { searchMessages } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await searchMessages(this.supabase, {
            ...input,
            userId: this.userId
          });
        }

        case 'get_available_agents': {
          const { getAvailableAgents } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await getAvailableAgents(this.supabase, input);
        }

        case 'get_current_agent': {
          const { getCurrentAgent } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await getCurrentAgent(this.supabase, {
            ...input,
            session_id: sessionId || ''
          });
        }

        case 'debug_agent_switch': {
          const { debugAgentSwitch } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await debugAgentSwitch(this.supabase, this.userId, input);
        }

        case 'switch_agent': {
          console.log('🔍 SWITCH_AGENT INPUT DEBUG:', {
            raw_input: input,
            input_type: typeof input,
            input_keys: Object.keys(input || {}),
            session_id: sessionId,
            user_message: this.userMessage?.substring(0, 100)
          });
          const { switchAgent } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await switchAgent(this.supabase, this.userId, {
            ...input,
            session_id: sessionId || ''
          }, this.userMessage);
        }

        case 'recommend_agent': {
          const { recommendAgent } = await import('../tools/database.ts');
          // @ts-ignore - Database function type compatibility
          return await recommendAgent(this.supabase, input);
        }

        case 'create_and_set_rfp': {
          const { createAndSetRfpWithClient } = await import('../tools/rfp.ts');
          // @ts-ignore - RFP function type compatibility
          const toolResult = await createAndSetRfpWithClient(this.supabase, input, { 
            sessionId: sessionId || ''
          });
          console.log('🎯 create_and_set_rfp tool result:', JSON.stringify(toolResult, null, 2));
          return toolResult;
        }

        default:
          console.log(`Unknown tool: ${name}`);
          return {
            success: false,
            error: `Unknown tool: ${name}`
          };
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  // Execute multiple tool calls in sequence
  async executeToolCalls(toolCalls: ClaudeToolCall[], sessionId?: string): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall, sessionId);
      results.push(result);
    }
    
    return results;
  }
}
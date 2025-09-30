// Copyright Mark Skiba, 2025 All rights reserved
// Claude API service integration for Edge Function

import { config } from '../config.ts';
import { mapMessageToClaudeFormat, extractTextFromClaudeResponse, extractToolCallsFromClaudeResponse } from '../utils/mapping.ts';
import type { ToolInvocationEvent } from '../types.ts';

// Claude API integration
export class ClaudeAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = config.anthropicApiKey!;
  }

  // Send message to Claude API with tool definitions
  async sendMessage(messages: any[], tools: any[], maxTokens = 4000) {
    console.log('Sending to Claude API:', { 
      messageCount: messages.length, 
      toolCount: tools.length,
      maxTokens 
    });

    // Convert messages to Claude format
    const formattedMessages = messages.map(mapMessageToClaudeFormat);

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: formattedMessages,
      tools: tools
    };

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

  // Stream message to Claude API (for future streaming implementation)
  async streamMessage(messages: any[], tools: any[], onChunk: (chunk: any) => void) {
    // For now, use regular message and simulate streaming
    const result = await this.sendMessage(messages, tools);
    
    // Simulate streaming by sending chunks
    const textChunks = result.textResponse.split(' ');
    for (const chunk of textChunks) {
      onChunk({ type: 'text_delta', text: chunk + ' ' });
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
    }
    
    // Send tool calls as chunks
    for (const toolCall of result.toolCalls) {
      onChunk({ type: 'tool_use', ...toolCall });
    }

    return result;
  }
}

// Tool execution service
export class ToolExecutionService {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  // Execute a tool call and return the result
  async executeTool(toolCall: any, sessionId?: string): Promise<any> {
    const { name, input } = toolCall;
    
    console.log(`Executing tool: ${name}`, input);

    try {
      switch (name) {
        case 'create_form_artifact':
          const { createFormArtifact } = await import('../tools/database.ts');
          return await createFormArtifact(this.supabase, sessionId!, this.userId, input);

        case 'get_conversation_history':
          const { getConversationHistory } = await import('../tools/database.ts');
          return await getConversationHistory(this.supabase, input.sessionId || sessionId!);

        case 'store_message':
          const { storeMessage } = await import('../tools/database.ts');
          return await storeMessage(this.supabase, {
            ...input,
            userId: this.userId,
            sessionId: sessionId
          });

        case 'create_session':
          const { createSession } = await import('../tools/database.ts');
          return await createSession(this.supabase, {
            ...input,
            userId: this.userId
          });

        case 'search_messages':
          const { searchMessages } = await import('../tools/database.ts');
          return await searchMessages(this.supabase, {
            ...input,
            userId: this.userId
          });

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
        error: error.message || 'Tool execution failed'
      };
    }
  }

  // Execute multiple tool calls in sequence
  async executeToolCalls(toolCalls: any[], sessionId?: string): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall, sessionId);
      results.push({
        tool_call_id: toolCall.id,
        output: result
      });
    }
    
    return results;
  }
}
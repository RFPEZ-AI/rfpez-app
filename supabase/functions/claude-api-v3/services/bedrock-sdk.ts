// Copyright Mark Skiba, 2025 All rights reserved
// AWS Bedrock Claude API Integration using Official AWS SDK

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { ClaudeMessage, ClaudeToolDefinition } from '../types.ts';
import type { ClaudeServiceResponse } from './factory.ts';

interface BedrockToolCall {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface BedrockServiceResponse {
  textResponse: string;
  toolCalls: BedrockToolCall[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  rawResponse: any | null;
}

// AWS Bedrock Claude API integration using official SDK
export class BedrockClaudeAPIService {
  private client: BedrockRuntimeClient;
  private model: string;

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    model: string
  ) {
    this.model = model;
    
    // Initialize AWS SDK client with explicit credentials
    // Disable automatic credential chain that tries to read from filesystem
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Use standard defaults mode to prevent filesystem access attempts
      defaultsMode: 'standard',
    });
  }

  // Map Claude message format to Bedrock format
  private mapMessageToBedrockFormat(message: ClaudeMessage): any {
    if (message.role === 'system') {
      return null; // System messages handled separately in Bedrock
    }

    return {
      role: message.role,
      content: Array.isArray(message.content) 
        ? message.content 
        : [{ type: 'text', text: message.content }]
    };
  }

  // Send message without streaming (used for non-streaming calls)
  async sendMessage(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens = 4000,
    systemPrompt?: string
  ): Promise<BedrockServiceResponse> {
    console.log('Sending request to AWS Bedrock Claude API (SDK)');

    // Map messages to Bedrock format
    const formattedMessages = messages
      .map(m => this.mapMessageToBedrockFormat(m))
      .filter(m => m !== null);

    const requestBody: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: formattedMessages,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
      console.log('🎯 Including system prompt:', systemPrompt.substring(0, 200) + '...');
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    const command = new InvokeModelCommand({
      modelId: this.model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    console.log('Making request with AWS SDK...');
    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock API response:', JSON.stringify(responseBody).substring(0, 500));

    // Extract text and tool calls
    let textResponse = '';
    const toolCalls: BedrockToolCall[] = [];

    if (responseBody.content && Array.isArray(responseBody.content)) {
      for (const block of responseBody.content) {
        if (block.type === 'text') {
          textResponse += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      }
    }

    return {
      textResponse,
      toolCalls,
      usage: {
        input_tokens: responseBody.usage?.input_tokens || 0,
        output_tokens: responseBody.usage?.output_tokens || 0
      },
      rawResponse: responseBody
    };
  }

  // Send message with streaming (returns raw stream)
  async sendMessageStream(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens = 4000,
    systemPrompt?: string
  ): Promise<ReadableStream> {
    console.log('Sending streaming request to AWS Bedrock Claude API (SDK)');

    // Map messages to Bedrock format
    const formattedMessages = messages
      .map(m => this.mapMessageToBedrockFormat(m))
      .filter(m => m !== null);

    const requestBody: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: formattedMessages,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.model,
      contentType: 'application/json',
      accept: 'application/vnd.amazon.eventstream',
      body: JSON.stringify(requestBody),
    });

    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock streaming');
    }

    // Return the AWS SDK stream directly
    // It needs to be converted to a web-compatible ReadableStream
    return this.convertAwsStreamToWebStream(response.body);
  }

  // Convert AWS SDK AsyncIterable stream to Web ReadableStream
  private convertAwsStreamToWebStream(awsStream: any): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of awsStream) {
            if (event.chunk) {
              controller.enqueue(event.chunk.bytes);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  // Streaming with callback (matches ClaudeAPIService interface)
  async streamMessage(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    onChunk: (chunk: any) => void,
    systemPrompt?: string
  ): Promise<ClaudeServiceResponse> {
    console.log('🌊 Starting Bedrock streaming with callback (SDK)');

    // Map messages to Bedrock format
    const formattedMessages = messages
      .map(m => this.mapMessageToBedrockFormat(m))
      .filter(m => m !== null);

    const requestBody: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8000,
      temperature: 0.3,
      messages: formattedMessages,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.model,
      contentType: 'application/json',
      accept: 'application/vnd.amazon.eventstream',
      body: JSON.stringify(requestBody),
    });

    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock streaming');
    }

    // Process the stream
    let fullTextResponse = '';
    const toolCalls: Array<{
      type: 'tool_use';
      id: string;
      name: string;
      input: Record<string, unknown>;
    }> = [];
    const usage = { input_tokens: 0, output_tokens: 0 };

    try {
      const decoder = new TextDecoder();
      
      for await (const event of response.body) {
        if (event.chunk && event.chunk.bytes) {
          // Decode the chunk
          const chunkText = decoder.decode(event.chunk.bytes);
          
          try {
            const chunkData = JSON.parse(chunkText);
            
            // Handle different event types
            if (chunkData.type === 'content_block_delta') {
              if (chunkData.delta?.type === 'text_delta' && chunkData.delta.text) {
                fullTextResponse += chunkData.delta.text;
                onChunk({
                  type: 'text',
                  content: chunkData.delta.text
                });
              }
            } else if (chunkData.type === 'content_block_start') {
              if (chunkData.content_block?.type === 'tool_use') {
                const toolUse = chunkData.content_block;
                toolCalls.push({
                  type: 'tool_use',
                  id: toolUse.id,
                  name: toolUse.name,
                  input: toolUse.input || {}
                });
                onChunk({
                  type: 'tool_use',
                  id: toolUse.id,
                  name: toolUse.name,
                  input: toolUse.input || {}
                });
              }
            } else if (chunkData.type === 'message_delta') {
              if (chunkData.usage) {
                usage.output_tokens = chunkData.usage.output_tokens || 0;
              }
            } else if (chunkData.type === 'message_start') {
              if (chunkData.message?.usage) {
                usage.input_tokens = chunkData.message.usage.input_tokens || 0;
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk as JSON:', chunkText.substring(0, 100));
          }
        }
      }
    } catch (error) {
      console.error('Error processing Bedrock stream:', error);
      throw error;
    }

    return {
      textResponse: fullTextResponse,
      toolCalls,
      usage,
      rawResponse: null
    };
  }
}

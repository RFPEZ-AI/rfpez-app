// Copyright Mark Skiba, 2025 All rights reserved
// AWS Bedrock Claude API Integration for Edge Function

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

// AWS Signature Version 4 signing utility
class AWS4Signer {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private service = 'bedrock';

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  // Create canonical request - FIXED: Now accepts encodedPath parameter for AWS Signature V4
  private async createCanonicalRequest(
    method: string,
    url: URL,
    headers: Record<string, string>,
    payload: string,
    encodedPath?: string // CRITICAL: Must pass encoded path with %3A for colons
  ): Promise<string> {
    // AWS Signature V4 expects URL-encoded colons (%3A) in the canonical string
    // Use provided encodedPath if available, otherwise use url.pathname
    const canonicalUri = encodedPath || url.pathname;
    const canonicalQueryString = url.search.slice(1);
    
    console.log('🔐 DEBUG: encodedPath parameter:', encodedPath);
    console.log('🔐 DEBUG: url.pathname:', url.pathname);
    console.log('🔐 DEBUG: Using canonicalUri:', canonicalUri);
    
    // Sort headers
    const sortedHeaders = Object.keys(headers).sort().map(key => 
      `${key.toLowerCase()}:${headers[key].trim()}`
    ).join('\n');
    
    const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');
    
    const payloadHash = await this.sha256(payload);
    console.log('🔐 Payload length:', payload.length);
    console.log('🔐 Payload hash:', payloadHash);
    console.log('🔐 Canonical URI:', canonicalUri);
    console.log('🔐 Sorted headers:', sortedHeaders);
    
    return [
      method,
      canonicalUri,
      canonicalQueryString,
      sortedHeaders,
      '',
      signedHeaders,
      payloadHash
    ].join('\n');
  }

  // Create string to sign
  private async createStringToSign(
    timestamp: string,
    canonicalRequest: string
  ): Promise<string> {
    const credentialScope = `${timestamp.slice(0, 8)}/${this.region}/${this.service}/aws4_request`;
    const hashedCanonicalRequest = await this.sha256(canonicalRequest);
    
    return [
      'AWS4-HMAC-SHA256',
      timestamp,
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');
  }

  // Calculate signature
  private async calculateSignature(
    stringToSign: string,
    timestamp: string
  ): Promise<string> {
    const dateKey = await this.hmac(`AWS4${this.secretAccessKey}`, timestamp.slice(0, 8));
    const dateRegionKey = await this.hmac(dateKey, this.region);
    const dateRegionServiceKey = await this.hmac(dateRegionKey, this.service);
    const signingKey = await this.hmac(dateRegionServiceKey, 'aws4_request');
    
    return await this.hmac(signingKey, stringToSign, 'hex');
  }

  // Sign request - wrapper for backward compatibility
  async signRequest(
    method: string,
    url: URL,
    headers: Record<string, string>,
    payload: string,
    encodedPath?: string
  ): Promise<Record<string, string>> {
    return this.signRequestWithPath(method, url, headers, payload, encodedPath);
  }

  // New method name to bypass Deno cache - explicit encodedPath parameter
  async signRequestWithPath(
    method: string,
    url: URL,
    headers: Record<string, string>,
    payload: string,
    encodedPath?: string
  ): Promise<Record<string, string>> {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.slice(0, 8);
    
    // Add required headers
    const signedHeaders: Record<string, string> = {
      ...headers,
      'host': url.host,
      'x-amz-date': timestamp,
    };
    
    const canonicalRequest = await this.createCanonicalRequest(method, url, signedHeaders, payload, encodedPath);
    const stringToSign = await this.createStringToSign(timestamp, canonicalRequest);
    const signature = await this.calculateSignature(stringToSign, timestamp);
    
    const credentialScope = `${dateStamp}/${this.region}/${this.service}/aws4_request`;
    const signedHeaderNames = Object.keys(signedHeaders).sort().map(k => k.toLowerCase()).join(';');
    
    signedHeaders['Authorization'] = [
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaderNames}`,
      `Signature=${signature}`
    ].join(', ');
    
    return signedHeaders;
  }

  // SHA256 hash (public for inline signature logic)
  async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // HMAC (public for inline signature logic)
  async hmac(key: string | Uint8Array, data: string, format: 'hex' | 'buffer' = 'buffer'): Promise<any> {
    const encoder = new TextEncoder();
    const keyData = typeof key === 'string' ? encoder.encode(key) : key;
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    const signatureArray = new Uint8Array(signature);
    
    if (format === 'hex') {
      return Array.from(signatureArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    return signatureArray;
  }
}

// AWS Bedrock Claude API integration
export class BedrockClaudeAPIService {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private model: string;
  private signer: AWS4Signer;

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    model: string
  ) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
    this.model = model;
    this.signer = new AWS4Signer(accessKeyId, secretAccessKey, region);
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

  // Send message to AWS Bedrock Claude API
  async sendMessage(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens = 4000,
    systemPrompt?: string
  ): Promise<BedrockServiceResponse> {
    console.log('Sending to AWS Bedrock Claude API:', {
      messageCount: messages.length,
      toolCount: tools.length,
      maxTokens,
      hasSystemPrompt: !!systemPrompt,
      model: this.model
    });

    // Filter out system messages and map to Bedrock format
    const formattedMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => this.mapMessageToBedrockFormat(m))
      .filter(m => m !== null);

    const requestBody: any = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: formattedMessages,
    };

    // Add system prompt if provided
    if (systemPrompt) {
      requestBody.system = systemPrompt;
      console.log('🎯 Including system prompt:', systemPrompt.substring(0, 200) + '...');
    }

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    const payload = JSON.stringify(requestBody);
    console.log('Bedrock API request body:', payload);

    // AWS Signature V4 requires colons in model IDs to be URL-encoded (%3A) in the canonical string
    // URL constructor normalizes paths and decodes %3A back to :, so we keep encoded path separate
    const encodedPath = `/model/${this.model.replace(/:/g, '%3A')}/invoke`;
    const host = `bedrock-runtime.${this.region}.amazonaws.com`;
    // Use unencoded model for URL construction (URL will be used for fetch)
    const url = new URL(`https://${host}/model/${this.model}/invoke`);

    // Sign the request with encoded path for canonical string
    const headers = await this.signer.signRequest(
      'POST',
      url,
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      payload,
      encodedPath  // Pass encoded path for signature calculation
    );

    console.log('Making signed request to Bedrock...');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bedrock API error:', response.status, errorText);
      throw new Error(`Bedrock API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Bedrock API response:', JSON.stringify(data, null, 2));

    // Extract text response
    let textResponse = '';
    const toolCalls: BedrockToolCall[] = [];

    if (data.content) {
      for (const block of data.content) {
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
      usage: data.usage || { input_tokens: 0, output_tokens: 0 },
      rawResponse: data
    };
  }

  // Send message with streaming
  async sendMessageStream(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens = 4000,
    systemPrompt?: string
  ): Promise<ReadableStream> {
    console.log('Sending streaming request to AWS Bedrock Claude API');

    // Filter out system messages and map to Bedrock format
    const formattedMessages = messages
      .filter(m => m.role !== 'system')
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

    const payload = JSON.stringify(requestBody);

    // Construct Bedrock streaming endpoint URL
    // AWS Signature V4 requires colons in model IDs to be URL-encoded (%3A) in the canonical string
    // URL constructor normalizes paths and decodes %3A back to :, so we keep encoded path separate
    // CRITICAL FIX: Inline signature logic to bypass Deno method call cache
    const encodedPath = `/model/${this.model.replace(/:/g, '%3A')}/invoke-with-response-stream`;
    const host = `bedrock-runtime.${this.region}.amazonaws.com`;
    const url = new URL(`https://${host}/model/${this.model}/invoke-with-response-stream`);

    // === INLINED SIGNATURE LOGIC (bypasses Deno cache) ===
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.slice(0, 8);
    
    // Add required headers
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.amazon.eventstream',
      'host': url.host,
      'x-amz-date': timestamp,
    };
    
    // Create canonical request WITH ENCODED PATH
    const canonicalUri = encodedPath; // USE ENCODED PATH with %3A
    const sortedHeaders = Object.keys(reqHeaders).sort().map(key => 
      `${key.toLowerCase()}:${reqHeaders[key].trim()}`
    ).join('\n');
    const signedHeaderNames = Object.keys(reqHeaders).sort().map(k => k.toLowerCase()).join(';');
    const payloadHash = await this.signer.sha256(payload);
    
    console.log('🔐 INLINE DEBUG: encodedPath:', encodedPath);
    console.log('🔐 INLINE DEBUG: canonicalUri:', canonicalUri);
    
    const canonicalRequest = [
      'POST',
      canonicalUri,  // ✅ THIS HAS %3A ENCODING
      '',  // no query string
      sortedHeaders,
      '',
      signedHeaderNames,
      payloadHash
    ].join('\n');
    
    // Create string to sign
    const credentialScope = `${dateStamp}/${this.signer['region']}/bedrock/aws4_request`;
    const hashedCanonicalRequest = await this.signer.sha256(canonicalRequest);
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');
    
    console.log('🔐 INLINE: canonicalRequest length:', canonicalRequest.length);
    console.log('🔐 INLINE: hashedCanonicalRequest:', hashedCanonicalRequest);
    console.log('🔐 INLINE: stringToSign:', stringToSign);
    
    // Calculate signature
    const secretAccessKey = this.signer['secretAccessKey'];
    const region = this.signer['region'];
    const dateKey = await this.signer.hmac(`AWS4${secretAccessKey}`, dateStamp);
    const dateRegionKey = await this.signer.hmac(dateKey, region);
    const dateRegionServiceKey = await this.signer.hmac(dateRegionKey, 'bedrock');
    const signingKey = await this.signer.hmac(dateRegionServiceKey, 'aws4_request');
    const signature = await this.signer.hmac(signingKey, stringToSign, 'hex');
    
    console.log('🔐 INLINE: calculated signature:', signature);
    
    reqHeaders['Authorization'] = [
      `AWS4-HMAC-SHA256 Credential=${this.signer['accessKeyId']}/${credentialScope}`,
      `SignedHeaders=${signedHeaderNames}`,
      `Signature=${signature}`
    ].join(', ');
    
    const headers = reqHeaders;
    // === END INLINED SIGNATURE LOGIC ===

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bedrock streaming API error: ${response.status} ${errorText}`);
    }

    return response.body!;
  }

  // Stream message with callback (matches ClaudeAPIService interface)
  async streamMessage(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    onChunk: (chunk: any) => void,
    systemPrompt?: string
  ): Promise<ClaudeServiceResponse> {
    console.log('🌊 Starting Bedrock streaming with callback');

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

    const payload = JSON.stringify(requestBody);

    // Construct Bedrock streaming endpoint URL
    const url = new URL(
      `https://bedrock-runtime.${this.region}.amazonaws.com/model/${this.model}/invoke-with-response-stream`
    );

    // Sign the request - use lowercase headers for AWS signature
    const headers = await this.signer.signRequest(
      'POST',
      url,
      {
        'content-type': 'application/json',
        'accept': 'application/vnd.amazon.eventstream'
      },
      payload
    );

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bedrock streaming API error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body available for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullTextResponse = '';
    const toolCalls: Array<{
      type: 'tool_use';
      id: string;
      name: string;
      input: Record<string, unknown>;
    }> = [];
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.includes(':')) continue;

          try {
            const jsonStr = line.substring(line.indexOf(':') + 1).trim();
            const event = JSON.parse(jsonStr);

            // Handle different event types
            if (event.chunk) {
              const chunkData = event.chunk;
              
              // Text delta
              if (chunkData.type === 'content_block_delta' && chunkData.delta?.type === 'text_delta') {
                const text = chunkData.delta.text;
                fullTextResponse += text;
                onChunk({
                  type: 'text',
                  content: text
                });
              }

              // Tool use
              if (chunkData.type === 'content_block_start' && chunkData.content_block?.type === 'tool_use') {
                const toolUse = chunkData.content_block;
                onChunk({
                  type: 'tool_use',
                  id: toolUse.id,
                  name: toolUse.name,
                  input: toolUse.input || {}
                });
                toolCalls.push({
                  type: 'tool_use',
                  id: toolUse.id,
                  name: toolUse.name,
                  input: toolUse.input || {}
                });
              }

              // Usage stats
              if (chunkData.type === 'message_delta' && chunkData.usage) {
                inputTokens = chunkData.usage.input_tokens || 0;
                outputTokens = chunkData.usage.output_tokens || 0;
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse event stream line:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      textResponse: fullTextResponse,
      toolCalls,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens
      },
      rawResponse: null
    };
  }
}

// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Factory - Selects between Anthropic and AWS Bedrock

import { ClaudeAPIService } from './claude.ts';
import { BedrockClaudeAPIService } from './bedrock-sdk.ts';
import { config } from '../config.ts';
import type { ClaudeMessage, ClaudeToolDefinition } from '../types.ts';

interface ClaudeServiceResponse {
  textResponse: string;
  toolCalls: Array<{
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  rawResponse: any | null;
}

// Factory to create the appropriate Claude service
export function createClaudeService() {
  if (config.useAwsBedrock) {
    console.log('🚀 Creating AWS Bedrock Claude service (Official SDK)');
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error('AWS credentials required when USE_AWS_BEDROCK=true');
    }
    return new BedrockClaudeAPIService(
      config.awsAccessKeyId,
      config.awsSecretAccessKey,
      config.awsRegion,
      config.awsBedrockModel
    );
  } else {
    console.log('🚀 Creating direct Anthropic Claude service');
    return new ClaudeAPIService();
  }
}

// Unified interface for both services
export interface UnifiedClaudeService {
  sendMessage(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens?: number,
    systemPrompt?: string
  ): Promise<ClaudeServiceResponse>;

  sendMessageStream?(
    messages: ClaudeMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens?: number,
    systemPrompt?: string
  ): Promise<ReadableStream>;
}

export { ClaudeServiceResponse };

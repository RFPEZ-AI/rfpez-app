// Copyright Mark Skiba, 2025 All rights reserved
// LLM Factory - Selects between Anthropic, AWS Bedrock, and OpenAI
import { ClaudeAPIService } from './claude.ts';
import { BedrockClaudeAPIService } from './bedrock.ts'; // Use fetch-based implementation (Deno-compatible)
import { OpenAIAPIService } from './openai.ts';
import { config } from '../config.ts';

export type LLMProvider = 'anthropic' | 'bedrock' | 'openai';

export interface LLMOverrides {
  provider?: LLMProvider;
  model?: string;
}

function resolveProvider(overrides?: LLMOverrides): LLMProvider {
  const overrideProvider = overrides?.provider;
  if (overrideProvider) return overrideProvider;

  const envProvider = (config.llmProvider || '').toLowerCase();
  if (envProvider === 'openai') return 'openai';
  if (envProvider === 'bedrock') return 'bedrock';
  if (envProvider === 'anthropic') return 'anthropic';

  return config.useAwsBedrock ? 'bedrock' : 'anthropic';
}

// Factory to create the appropriate LLM service
export function createClaudeService(overrides?: LLMOverrides) {
  const provider = resolveProvider(overrides);
  const modelOverride = overrides?.model;

  if (provider === 'openai') {
    console.log('🚀 Creating OpenAI LLM service');
    return new OpenAIAPIService(modelOverride);
  }

  if (provider === 'bedrock') {
    console.log('🚀 Creating AWS Bedrock Claude service (Custom Fetch/AWS4)');
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error('AWS credentials required when USE_AWS_BEDROCK=true');
    }
    return new BedrockClaudeAPIService(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsRegion, modelOverride || config.awsBedrockModel);
  } else {
    console.log('🚀 Creating direct Anthropic Claude service');
    return new ClaudeAPIService(modelOverride);
  }
}

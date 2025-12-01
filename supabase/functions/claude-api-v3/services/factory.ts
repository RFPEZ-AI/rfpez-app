// Copyright Mark Skiba, 2025 All rights reserved
// Claude API Factory - Selects between Anthropic and AWS Bedrock
import { ClaudeAPIService } from './claude.ts';
import { BedrockClaudeAPIService } from './bedrock.ts'; // Use fetch-based implementation (Deno-compatible)
import { config } from '../config.ts';
// Factory to create the appropriate Claude service
export function createClaudeService() {
  if (config.useAwsBedrock) {
    console.log('🚀 Creating AWS Bedrock Claude service (Custom Fetch/AWS4)');
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error('AWS credentials required when USE_AWS_BEDROCK=true');
    }
    return new BedrockClaudeAPIService(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsRegion, config.awsBedrockModel);
  } else {
    console.log('🚀 Creating direct Anthropic Claude service');
    return new ClaudeAPIService();
  }
}

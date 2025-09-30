// Test Claude function calling with minimal example
/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from '@anthropic-ai/sdk';
import { claudeApiFunctions } from './services/claudeAPIFunctions';

const client = new Anthropic({
  apiKey: process.env.REACT_APP_CLAUDE_API_KEY || 'sk-test',
  dangerouslyAllowBrowser: true
});

// Minimal test function with proper typing
const testFunction = {
  name: "test_function",
  description: "A simple test function that returns a greeting",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string" as const,
        description: "The name to greet"
      }
    },
    required: ["name"]
  }
};

async function testToolsStructure() {
  console.log('🔍 Analyzing claudeApiFunctions structure...');
  console.log('📊 Total functions:', claudeApiFunctions.length);
  console.log('📝 Function names:', claudeApiFunctions.map(f => f.name));
  
  // Check for create_and_set_rfp specifically
  const createRfpFunction = claudeApiFunctions.find(f => f.name === 'create_and_set_rfp');
  if (createRfpFunction) {
    console.log('✅ Found create_and_set_rfp function');
    console.log('🔧 Function structure:', JSON.stringify(createRfpFunction, null, 2));
  } else {
    console.log('❌ create_and_set_rfp function not found!');
  }
  
  return claudeApiFunctions;
}

async function testClaudeFunctionCalling() {
  console.log('🧪 Testing Claude function calling...');
  
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      temperature: 0.7,
      system: 'You are a helpful assistant. When the user asks you to greet someone, you MUST use the test_function to create the greeting.',
      messages: [
        {
          role: 'user',
          content: 'Please greet John using the available function'
        }
      ],
      tools: [testFunction],
      tool_choice: { type: 'auto' }
    });
    
    console.log('📤 Claude Response:', JSON.stringify(response, null, 2));
    console.log('🔧 Has tool_use blocks:', response.content.some(block => block.type === 'tool_use'));
    console.log('🔧 Content types:', response.content.map(block => block.type));
    
    return response;
  } catch (error) {
    console.error('❌ Function calling test failed:', error);
    throw error;
  }
}

// Make functions available globally for testing
(window as any).testClaudeFunctionCalling = testClaudeFunctionCalling;
(window as any).testToolsStructure = testToolsStructure;

export { testClaudeFunctionCalling, testToolsStructure };
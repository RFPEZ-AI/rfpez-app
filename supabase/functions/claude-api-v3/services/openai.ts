// Copyright Mark Skiba, 2025 All rights reserved
// OpenAI API service integration for Edge Function (Chat Completions)

import { config, defaultOpenAIParams } from '../config.ts';

type InternalMessage = {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<{
        type: string;
        id?: string;
        name?: string;
        input?: unknown;
        tool_use_id?: string;
        // For tool_result blocks we store JSON as string in `content`
        content?: string;
      }>;
};

type ClaudeToolDefinition = {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
};

type ToolCall = {
  id: string;
  name: string;
  type: 'tool_use';
  input: Record<string, unknown>;
};

type OpenAIChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string | null; tool_calls?: never }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    }
  | { role: 'tool'; tool_call_id: string; content: string };

function mapToolsToOpenAI(tools: ClaudeToolDefinition[]) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

function mapInternalMessagesToOpenAI(messages: InternalMessage[], systemPrompt?: string): OpenAIChatMessage[] {
  const mapped: OpenAIChatMessage[] = [];

  if (systemPrompt && systemPrompt.trim().length > 0) {
    mapped.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      // Keep normal user/assistant messages as-is.
      if (msg.role === 'system') {
        mapped.push({ role: 'system', content: msg.content });
      } else {
        mapped.push({ role: msg.role, content: msg.content });
      }
      continue;
    }

    // Array content indicates Anthropic-style tool blocks (tool_use / tool_result)
    if (msg.role === 'assistant') {
      const toolUses = msg.content.filter((c) => c.type === 'tool_use');
      if (toolUses.length > 0) {
        mapped.push({
          role: 'assistant',
          content: null,
          tool_calls: toolUses.map((tu) => ({
            id: String(tu.id || crypto.randomUUID()),
            type: 'function',
            function: {
              name: String(tu.name || ''),
              arguments: JSON.stringify(tu.input ?? {}),
            },
          })),
        });
      }
      continue;
    }

    if (msg.role === 'user') {
      const toolResults = msg.content.filter((c) => c.type === 'tool_result');
      for (const tr of toolResults) {
        const toolCallId = String(tr.tool_use_id || tr.id || '');
        if (!toolCallId) continue;
        mapped.push({
          role: 'tool',
          tool_call_id: toolCallId,
          content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content ?? {}),
        });
      }
      continue;
    }
  }

  return mapped;
}

function extractAssistantText(choice: any): string {
  // Chat Completions: choice.message.content is string | null
  const text = choice?.message?.content;
  return typeof text === 'string' ? text : '';
}

function extractToolCalls(choice: any): ToolCall[] {
  const toolCalls = choice?.message?.tool_calls;
  if (!Array.isArray(toolCalls)) return [];

  const parsed: ToolCall[] = [];
  for (const tc of toolCalls) {
    const id = typeof tc?.id === 'string' ? tc.id : crypto.randomUUID();
    const name = tc?.function?.name;
    const args = tc?.function?.arguments;

    if (typeof name !== 'string') continue;

    let input: Record<string, unknown> = {};
    if (typeof args === 'string' && args.trim().length > 0) {
      try {
        input = JSON.parse(args);
      } catch {
        input = { __raw_arguments: args };
      }
    }

    parsed.push({ id, name, type: 'tool_use', input });
  }
  return parsed;
}

export class OpenAIAPIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(modelOverride?: string) {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.apiKey = config.openaiApiKey;
    this.baseUrl = config.openaiBaseUrl;
    this.model = modelOverride || config.openaiModel || defaultOpenAIParams.model;
  }

  async sendMessage(
    messages: InternalMessage[],
    tools: ClaudeToolDefinition[],
    maxTokens = defaultOpenAIParams.maxTokens,
    systemPrompt?: string,
    modelOverride?: string
  ) {
    const modelToUse = modelOverride || this.model;

    const openaiMessages = mapInternalMessagesToOpenAI(messages, systemPrompt);
    const openaiTools = mapToolsToOpenAI(tools);

    const requestBody: Record<string, unknown> = {
      model: modelToUse,
      messages: openaiMessages,
      tools: openaiTools,
      tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
      temperature: defaultOpenAIParams.temperature,
      // Prefer newer param name; OpenAI will reject unknown params on some endpoints/models.
      max_completion_tokens: maxTokens,
    };

    // Remove undefined fields
    Object.keys(requestBody).forEach((k) => requestBody[k] === undefined && delete requestBody[k]);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0];

    return {
      textResponse: extractAssistantText(choice),
      toolCalls: extractToolCalls(choice),
      usage: data?.usage,
      rawResponse: data,
      model: data?.model || modelToUse,
    };
  }

  // Minimal streaming adapter: calls non-streaming API, then emits tool_use + text chunks.
  async streamMessage(
    messages: InternalMessage[],
    tools: ClaudeToolDefinition[],
    onChunk: (chunk: any) => void,
    systemPrompt?: string,
    modelOverride?: string
  ) {
    const response = await this.sendMessage(messages, tools, defaultOpenAIParams.maxTokens, systemPrompt, modelOverride);

    if (Array.isArray(response.toolCalls)) {
      for (const tc of response.toolCalls) {
        onChunk({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      }
    }

    if (response.textResponse) {
      onChunk({
        type: 'text',
        content: response.textResponse,
        delta: { text: response.textResponse },
      });
    }

    return response;
  }
}

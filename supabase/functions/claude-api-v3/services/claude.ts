// Copyright Mark Skiba, 2025 All rights reserved
// Claude API service integration for Edge Function

import { mapMessageToClaudeFormat, extractTextFromClaudeResponse, extractToolCallsFromClaudeResponse } from '../utils/mapping.ts';
import { config } from '../config.ts';
import type { ClaudeMessage, ClaudeToolDefinition, ClaudeResponse, ToolResult } from '../types.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Global Deno environment access
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

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
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.apiKey = config.anthropicApiKey;
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
      model: 'claude-sonnet-4-5-20250929',
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
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,  // Increased from 4000 to prevent truncation
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
      // eslint-disable-next-line no-constant-condition
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
              
              // DEBUG: Log all streaming events to understand what Claude is actually sending
              if (parsed.type === 'content_block_start' || parsed.type === 'content_block_stop' || parsed.type.includes('tool')) {
                console.log('🔍 DETAILED EVENT DEBUG:', JSON.stringify(parsed, null, 2));
              }

              if (parsed.type === 'content_block_delta') {
                console.log('🔧 Delta event type:', parsed.delta?.type, 'activeToolCall.id:', activeToolCall.id);
                
                if (parsed.delta?.type === 'text_delta') {
                  const textChunk = parsed.delta.text;
                  if (textChunk && textChunk.trim()) { // Only process non-empty chunks
                    fullTextResponse += textChunk;
                    console.log('💬 Text chunk received:', textChunk.length, 'characters');
                    
                    // Send text chunk to client
                    onChunk({ 
                      type: 'text', 
                      content: textChunk,
                      delta: { text: textChunk } 
                    });
                  }
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
              console.error('Error parsing streaming data:', parseError, 'Data:', eventData.substring(0, 200));
              // Don't break the stream for parse errors, continue processing
              continue;
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
  private supabase: SupabaseClient<any, "public", any>;
  private userId: string;
  private userMessage?: string;
  private toolInvocations: Array<{
    type: 'tool_start' | 'tool_complete';
    toolName: string;
    parameters?: Record<string, unknown>;
    result?: unknown;
    agentId?: string;
    timestamp: string;
  }> = [];

  constructor(supabase: SupabaseClient<any, "public", any>, userId: string, userMessage?: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.userMessage = userMessage;
  }

  // Add tool invocation to tracking
  addToolInvocation(type: 'tool_start' | 'tool_complete', toolName: string, agentId?: string, parameters?: Record<string, unknown>, result?: unknown) {
    this.toolInvocations.push({
      type,
      toolName,
      parameters,
      result,
      agentId,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Tracked ${type} for ${toolName}. Total tracked: ${this.toolInvocations.length}`);
  }

  // Get all tracked tool invocations
  getToolInvocations() {
    return this.toolInvocations;
  }

  // Clear tool invocations (useful for new message contexts)
  clearToolInvocations() {
    console.log(`🧹 Clearing ${this.toolInvocations.length} tracked tool invocations`);
    this.toolInvocations = [];
  }

  // Execute a tool call and return the result
  async executeTool(toolCall: ClaudeToolCall, sessionId?: string, agentId?: string): Promise<ToolResult> {
    const { name, input } = toolCall;
    
    console.log(`Executing tool: ${name}`, input);
    
    // Track tool start
    this.addToolInvocation('tool_start', name, agentId, input as Record<string, unknown>);

    try {
      switch (name) {
        case 'create_form_artifact': {
          // Validate session_id for form artifact creation
          if (!sessionId || sessionId.trim() === '') {
            console.error('❌ CREATE_FORM_ARTIFACT ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for form artifact creation',
              message: 'Cannot create form artifacts without a valid session. Please start a new session.'
            };
          }
          
          // 🎯 VALIDATE ARTIFACT_ROLE: Ensure artifactRole is provided and valid
          // Tool definitions use camelCase "artifactRole" - accept that as the primary parameter
          // MUST match database CHECK constraint in artifacts_new_artifact_role_check
          const validFormRoles = [
            'buyer_questionnaire',      // Initial requirements gathering form
            'bid_form',                 // Supplier bid submission form
            'vendor_selection_form',    // Vendor evaluation/selection form
            'template'                  // Form templates
          ];
          const providedRole = (input as { artifactRole?: string }).artifactRole;
          
          if (!providedRole) {
            console.error('❌ CREATE_FORM_ARTIFACT ERROR: artifactRole is required');
            return {
              success: false,
              error: 'Missing artifactRole parameter',
              message: `Form artifacts require an artifactRole parameter (camelCase). Common roles: "buyer_questionnaire" (requirements), "bid_form" (supplier bids), "vendor_selection_form" (vendor evaluation). Full list: ${validFormRoles.join(', ')}. Example: create_form_artifact({ ..., artifactRole: "bid_form" })`
            };
          }
          
          if (!validFormRoles.includes(providedRole)) {
            console.error(`❌ CREATE_FORM_ARTIFACT ERROR: Invalid artifactRole "${providedRole}"`);
            return {
              success: false,
              error: `Invalid artifactRole: "${providedRole}"`,
              message: `Form artifactRole must be one of: ${validFormRoles.join(', ')}. You provided: "${providedRole}". Common roles: "buyer_questionnaire", "bid_form", "vendor_selection_form".`
            };
          }
          
          console.log(`✅ Form artifact role validated: "${providedRole}"`)
          
          // 🎯 AUTO-INJECT CURRENT RFP: Fetch current_rfp_id from session
          const sessionQuery = await this.supabase
            .from('sessions')
            .select('current_rfp_id')
            .eq('id', sessionId)
            .single();
          
          const { data: sessionData, error: sessionError } = sessionQuery as { 
            data: { current_rfp_id?: number } | null; 
            error: Error | null 
          };
          
          if (sessionError) {
            console.error('❌ Failed to fetch session data:', sessionError);
            return {
              success: false,
              error: 'Failed to retrieve session information',
              message: 'Could not fetch session data to determine current RFP.'
            };
          }
          
          // Auto-create RFP if missing
          let currentRfpId = sessionData?.current_rfp_id;
          
          if (!currentRfpId) {
            console.log('⚠️ No current RFP set - attempting auto-create from session context...');
            
            // Try to auto-create RFP from session title
            const sessionInfoQuery = await this.supabase
              .from('sessions')
              .select('title')
              .eq('id', sessionId)
              .single();
            
            const { data: sessionInfo } = sessionInfoQuery as { 
              data: { title?: string } | null 
            };
            
            const sessionTitle = sessionInfo?.title || 'New RFP';
            const autoRfpName = sessionTitle.includes('RFP') ? sessionTitle : `RFP for ${sessionTitle}`;
            
            console.log(`🤖 Auto-creating RFP: "${autoRfpName}" for session "${sessionTitle}"`);
            
            // Import and call createAndSetRfpWithClient
            const { createAndSetRfpWithClient } = await import('../tools/rfp.ts');
            const createResult = await createAndSetRfpWithClient(this.supabase, {
              name: autoRfpName,
              description: `Automatically created RFP for ${sessionTitle}`
            }, { 
              sessionId: sessionId
            });
            
            const createdRfpId = (createResult as { current_rfp_id?: number }).current_rfp_id;
            
            if (!createResult.success || !createdRfpId) {
              console.error('❌ Failed to auto-create RFP:', createResult.error);
              return {
                success: false,
                error: 'No current RFP set and auto-creation failed',
                message: 'No RFP is currently active for this session. Attempted to auto-create RFP but failed. Please create an RFP manually using create_and_set_rfp with a descriptive name.',
                recovery_action: {
                  tool: 'create_and_set_rfp',
                  instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
                }
              };
            }
            
            console.log(`✅ Auto-created RFP successfully: ID ${createdRfpId}, Name: "${autoRfpName}"`);
            currentRfpId = createdRfpId;
          }
          
          console.log('✅ Auto-injecting current RFP ID:', currentRfpId);
          
          const { createFormArtifact } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await createFormArtifact(this.supabase, sessionId, this.userId, {
            ...input,
            rfp_id: currentRfpId  // 🎯 INJECT RFP ID FROM SESSION OR AUTO-CREATED
          });
        }

        case 'create_document_artifact': {
          console.log('🚀 EXECUTING CREATE_DOCUMENT_ARTIFACT TOOL!', {
            sessionId,
            userId: this.userId,
            input: JSON.stringify(input, null, 2)
          });
          
          // Validate session_id for document artifact creation
          if (!sessionId || sessionId.trim() === '') {
            console.error('❌ CREATE_DOCUMENT_ARTIFACT ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for document artifact creation',
              message: 'Cannot create document artifacts without a valid session. Please start a new session.'
            };
          }
          
          // 🎯 VALIDATE ARTIFACT_ROLE: Ensure artifactRole is provided and valid
          // Tool definitions use camelCase "artifactRole" - accept that as the primary parameter
          const validDocumentRoles = [
            'rfp_request_email',         // Primary: RFP vendor request emails (enables upsert)
            'request_document',          // General request documents
            'specification_document',    // Technical specifications
            'analysis_document',         // Analysis reports
            'report_document',           // General reports
            'template'                   // Document templates
          ];
          const providedRole = (input as { artifactRole?: string }).artifactRole;
          
          if (!providedRole) {
            console.error('❌ CREATE_DOCUMENT_ARTIFACT ERROR: artifactRole is required');
            return {
              success: false,
              error: 'Missing artifactRole parameter',
              message: `Document artifacts require an artifactRole parameter (camelCase). Common roles: "rfp_request_email" (for vendor requests), "request_document", "specification_document". Full list: ${validDocumentRoles.join(', ')}. Example: create_document_artifact({ ..., artifactRole: "rfp_request_email" })`
            };
          }
          
          if (!validDocumentRoles.includes(providedRole)) {
            console.error(`❌ CREATE_DOCUMENT_ARTIFACT ERROR: Invalid artifactRole "${providedRole}"`);
            return {
              success: false,
              error: `Invalid artifactRole: "${providedRole}"`,
              message: `Document artifactRole must be one of: ${validDocumentRoles.join(', ')}. You provided: "${providedRole}". Note: Use "rfp_request_email" for RFP vendor request emails (enables intelligent upsert).`
            };
          }
          
          console.log(`✅ Document artifact role validated: "${providedRole}"`);
          
          // 🎯 AUTO-INJECT CURRENT RFP: Fetch current_rfp_id from session
          const sessionQuery = await this.supabase
            .from('sessions')
            .select('current_rfp_id')
            .eq('id', sessionId)
            .single();
          
          const { data: sessionData, error: sessionError } = sessionQuery as { 
            data: { current_rfp_id?: number } | null; 
            error: Error | null 
          };
          
          if (sessionError) {
            console.error('❌ Failed to fetch session data:', sessionError);
            return {
              success: false,
              error: 'Failed to retrieve session information',
              message: 'Could not fetch session data to determine current RFP.'
            };
          }
          
          // Auto-create RFP if missing (same logic as create_form_artifact)
          let currentRfpId = sessionData?.current_rfp_id;
          
          if (!currentRfpId) {
            console.log('⚠️ No current RFP set for document - attempting auto-create from session context...');
            
            // Try to auto-create RFP from session title
            const sessionInfoQuery = await this.supabase
              .from('sessions')
              .select('title')
              .eq('id', sessionId)
              .single();
            
            const { data: sessionInfo } = sessionInfoQuery as { 
              data: { title?: string } | null 
            };
            
            const sessionTitle = sessionInfo?.title || 'New RFP';
            const autoRfpName = sessionTitle.includes('RFP') ? sessionTitle : `RFP for ${sessionTitle}`;
            
            console.log(`🤖 Auto-creating RFP: "${autoRfpName}" for session "${sessionTitle}"`);
            
            // Import and call createAndSetRfpWithClient
            const { createAndSetRfpWithClient } = await import('../tools/rfp.ts');
            const createResult = await createAndSetRfpWithClient(this.supabase, {
              name: autoRfpName,
              description: `Automatically created RFP for ${sessionTitle}`
            }, { 
              sessionId: sessionId
            });
            
            const createdRfpId = (createResult as { current_rfp_id?: number }).current_rfp_id;
            
            if (!createResult.success || !createdRfpId) {
              console.error('❌ Failed to auto-create RFP for document:', createResult.error);
              return {
                success: false,
                error: 'No current RFP set and auto-creation failed',
                message: 'No RFP is currently active for this session. Attempted to auto-create RFP but failed. Please create an RFP manually using create_and_set_rfp with a descriptive name.',
                recovery_action: {
                  tool: 'create_and_set_rfp',
                  instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
                }
              };
            }
            
            console.log(`✅ Auto-created RFP successfully: ID ${createdRfpId}, Name: "${autoRfpName}"`);
            currentRfpId = createdRfpId;
          }
          
          console.log('✅ Auto-injecting current RFP ID:', currentRfpId);
          
          const { createDocumentArtifact } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          const result = await createDocumentArtifact(this.supabase, sessionId, this.userId, {
            ...input,
            rfp_id: currentRfpId  // 🎯 INJECT RFP ID FROM SESSION OR AUTO-CREATED
          });
          console.log('🎯 CREATE_DOCUMENT_ARTIFACT RESULT:', JSON.stringify(result, null, 2));
          return result;
        }

        case 'manage_vendor_selection': {
          console.log('🚀 EXECUTING MANAGE_VENDOR_SELECTION TOOL!', {
            sessionId,
            userId: this.userId,
            operation: input.operation,
            rfp_id: input.rfp_id
          });
          
          // Validate session_id for vendor selection management
          if (!sessionId || sessionId.trim() === '') {
            console.error('❌ MANAGE_VENDOR_SELECTION ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for vendor selection management',
              message: 'Cannot manage vendor selections without a valid session. Please start a new session.'
            };
          }
          
          // 🎯 AUTO-INJECT CURRENT RFP if rfp_id not provided: Fetch current_rfp_id from session
          let effectiveRfpId = input.rfp_id as number;
          
          if (!effectiveRfpId) {
            const sessionQuery = await this.supabase
              .from('sessions')
              .select('current_rfp_id')
              .eq('id', sessionId)
              .single();
            
            const { data: sessionData, error: sessionError } = sessionQuery as { 
              data: { current_rfp_id?: number } | null; 
              error: Error | null 
            };
            
            if (sessionError) {
              console.error('❌ Failed to fetch session data:', sessionError);
              return {
                success: false,
                error: 'Failed to retrieve session information',
                message: 'Could not fetch session data to determine current RFP.'
              };
            }
            
            if (!sessionData?.current_rfp_id) {
              console.error('❌ No current RFP set for this session and no rfp_id provided');
              return {
                success: false,
                error: 'No current RFP set',
                message: 'No RFP is currently active for this session. To manage vendor selection, you must first create an RFP using the create_and_set_rfp tool. Call it now with a descriptive name based on what the user is procuring (e.g., "LED Bulbs RFP" or "Industrial Alcohol RFP"), then retry managing vendor selection.',
                recovery_action: {
                  tool: 'create_and_set_rfp',
                  instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
                }
              };
            }
            
            effectiveRfpId = sessionData.current_rfp_id;
            console.log('✅ Auto-injected current RFP ID:', effectiveRfpId);
          }
          
          const { handleManageVendorSelection } = await import('../tools/vendorSelection.ts');
          // @ts-expect-error - VendorSelection function type compatibility
          const result = await handleManageVendorSelection(this.supabase, {
            ...input,
            rfp_id: effectiveRfpId,  // 🎯 USE EFFECTIVE RFP ID (provided or auto-injected)
            session_id: sessionId,
            user_id: this.userId
          });
          console.log('🎯 MANAGE_VENDOR_SELECTION RESULT:', JSON.stringify(result, null, 2));
          // @ts-expect-error - Return type compatibility
          return result;
        }

        case 'get_conversation_history': {
          // Use sessionId from input or parameter, but validate it's not empty
          const targetSessionId = (input.sessionId as string) || (input.session_id as string) || sessionId;
          if (!targetSessionId || (typeof targetSessionId === 'string' && targetSessionId.trim() === '')) {
            console.error('❌ GET_CONVERSATION_HISTORY ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for conversation history',
              message: 'Cannot retrieve conversation history without a valid session. Please start a new session.'
            };
          }
          
          const { getConversationHistory } = await import('../tools/database.ts');
          return await getConversationHistory(this.supabase, targetSessionId);
        }

        case 'create_session': {
          const { createSession } = await import('../tools/database.ts');
          return await createSession(this.supabase, {
            ...input,
            userId: this.userId
          });
        }

        case 'store_message': {
          // Use sessionId from input or parameter
          const targetSessionId = (input.sessionId as string) || (input.session_id as string) || sessionId;
          if (!targetSessionId || (typeof targetSessionId === 'string' && targetSessionId.trim() === '')) {
            console.error('❌ STORE_MESSAGE ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for storing messages',
              message: 'Cannot store messages without a valid session. Please start a new session.'
            };
          }
          
          // 🎯 INJECT TOOL INVOCATIONS into metadata for AI assistant messages
          const inputData = input as Record<string, unknown>;
          const existingMetadata = (inputData.metadata as Record<string, unknown>) || {};
          
          // Only inject tool invocations for assistant messages
          if (inputData.sender === 'assistant' && this.toolInvocations.length > 0) {
            console.log(`📊 Injecting ${this.toolInvocations.length} tool invocations into message metadata`);
            existingMetadata.toolInvocations = this.toolInvocations;
            inputData.metadata = existingMetadata;
          }
          
          const { storeMessage } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          const result = await storeMessage(this.supabase, {
            ...inputData,
            userId: this.userId,
            sessionId: targetSessionId
          });
          
          // Clear tool invocations after storing to prepare for next message
          if (inputData.sender === 'assistant') {
            this.clearToolInvocations();
          }
          
          return result;
        }

        case 'search_messages': {
          const { searchMessages } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await searchMessages(this.supabase, {
            ...input,
            userId: this.userId
          });
        }

        case 'get_available_agents': {
          const { getAvailableAgents } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await getAvailableAgents(this.supabase, input);
        }

        case 'get_current_agent': {
          const { getCurrentAgent } = await import('../tools/database.ts');
          return await getCurrentAgent(this.supabase, {
            ...input,
            session_id: sessionId || ''
          });
        }

        case 'debug_agent_switch': {
          const { debugAgentSwitch } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
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
          
          // Validate session_id - must be valid UUID, not empty string
          if (!sessionId || sessionId.trim() === '') {
            console.error('❌ SWITCH_AGENT ERROR: session_id is required and cannot be empty');
            const errorResult = {
              success: false,
              error: 'Session ID is required for agent switching',
              message: 'Cannot switch agents without a valid session. Please start a new session.'
            };
            this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, errorResult);
            return errorResult;
          }
          
          const { switchAgent } = await import('../tools/database.ts');
          const switchResult = await switchAgent(this.supabase, this.userId, {
            ...input,
            session_id: sessionId
          }, this.userMessage);
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, switchResult);
          return switchResult;
        }

        case 'recommend_agent': {
          const { recommendAgent } = await import('../tools/database.ts');
          return await recommendAgent(this.supabase, input);
        }

        case 'create_and_set_rfp': {
          // Validate session_id for RFP creation
          if (!sessionId || sessionId.trim() === '') {
            console.error('❌ CREATE_AND_SET_RFP ERROR: session_id is required and cannot be empty');
            return {
              success: false,
              error: 'Session ID is required for RFP creation',
              message: 'Cannot create RFP without a valid session. Please start a new session.'
            };
          }
          
          const { createAndSetRfpWithClient } = await import('../tools/rfp.ts');
          const toolResult = await createAndSetRfpWithClient(this.supabase, input, { 
            sessionId: sessionId
          });
          console.log('🎯 create_and_set_rfp tool result:', JSON.stringify(toolResult, null, 2));
          return toolResult;
        }

        case 'list_artifacts': {
          const { listArtifacts } = await import('../tools/database.ts');
          return await listArtifacts(this.supabase, {
            sessionId: (input.session_id as string | undefined) || sessionId,
            allArtifacts: input.all_artifacts as boolean | undefined,
            artifactType: input.artifact_type as string | undefined,
            limit: input.limit as number | undefined,
            filterByCurrentRfp: input.filter_by_current_rfp as boolean | undefined,
            userId: this.userId
          });
        }

        case 'get_current_artifact_id': {
          const { getCurrentArtifactId } = await import('../tools/database.ts');
          return await getCurrentArtifactId(this.supabase, {
            ...input,
            sessionId: sessionId || ''
          });
        }

        case 'select_active_artifact': {
          const { selectActiveArtifact } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await selectActiveArtifact(this.supabase, {
            ...input,
            sessionId: sessionId || ''
          });
        }

        case 'get_current_rfp': {
          const { getCurrentRfp } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await getCurrentRfp(this.supabase, input.session_id || sessionId || '');
        }

        case 'set_current_rfp': {
          if (!sessionId) {
            return { 
              success: false, 
              error: 'Session ID is required',
              message: 'Cannot set current RFP without a valid session.'
            };
          }
          const { setCurrentRfp } = await import('../tools/database.ts');
          return await setCurrentRfp(
            this.supabase, 
            sessionId, 
            input.rfp_id as number | undefined, 
            input.rfp_name as string | undefined
          );
        }

        case 'get_form_schema': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          const { getFormSchema } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await getFormSchema(this.supabase, sessionId, this.userId, input);
        }

        case 'update_form_data': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          const { updateFormData } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await updateFormData(this.supabase, sessionId, this.userId, input);
        }

        case 'update_form_artifact': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          const { updateFormArtifact } = await import('../tools/database.ts');
          // @ts-expect-error - Database function type compatibility
          return await updateFormArtifact(this.supabase, sessionId, this.userId, input);
        }

        case 'submit_bid': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          
          // 🎯 AUTO-INJECT CURRENT RFP: Fetch current_rfp_id from session
          const sessionQuery = await this.supabase
            .from('sessions')
            .select('current_rfp_id')
            .eq('id', sessionId)
            .single();
          
          const { data: sessionData, error: sessionError } = sessionQuery as { 
            data: { current_rfp_id?: number } | null; 
            error: Error | null 
          };
          
          if (sessionError) {
            console.error('❌ Failed to fetch session data:', sessionError);
            return {
              success: false,
              error: 'Failed to retrieve session information',
              message: 'Could not fetch session data to determine current RFP.'
            };
          }
          
          if (!sessionData?.current_rfp_id) {
            console.error('❌ No current RFP set for this session');
            return {
              success: false,
              error: 'No current RFP set',
              message: 'No RFP is currently active for this session. To submit a bid, you must first create an RFP using the create_and_set_rfp tool. Call it now with a descriptive name based on what the user is procuring (e.g., "LED Bulbs RFP" or "Industrial Alcohol RFP"), then retry submitting the bid.',
              recovery_action: {
                tool: 'create_and_set_rfp',
                instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
              }
            };
          }
          
          console.log('✅ Auto-injecting current RFP ID for bid submission:', sessionData.current_rfp_id);
          
          const { submitBid } = await import('../tools/database.ts');
          return await submitBid(this.supabase, sessionId, this.userId, {
            ...input,
            rfp_id: sessionData.current_rfp_id  // 🎯 INJECT RFP ID FROM SESSION
          });
        }

        case 'get_rfp_bids': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          
          // 🎯 AUTO-INJECT CURRENT RFP: Fetch current_rfp_id from session
          const sessionQuery = await this.supabase
            .from('sessions')
            .select('current_rfp_id')
            .eq('id', sessionId)
            .single();
          
          const { data: sessionData, error: sessionError } = sessionQuery as { 
            data: { current_rfp_id?: number } | null; 
            error: Error | null 
          };
          
          if (sessionError) {
            console.error('❌ Failed to fetch session data:', sessionError);
            return {
              success: false,
              error: 'Failed to retrieve session information',
              message: 'Could not fetch session data to determine current RFP.'
            };
          }
          
          if (!sessionData?.current_rfp_id) {
            console.error('❌ No current RFP set for this session');
            return {
              success: false,
              error: 'No current RFP set',
              message: 'No RFP is currently active for this session. To retrieve bids, you must first create an RFP using the create_and_set_rfp tool. Call it now with a descriptive name based on what the user is procuring (e.g., "LED Bulbs RFP" or "Industrial Alcohol RFP"), then retry getting the bids.',
              recovery_action: {
                tool: 'create_and_set_rfp',
                instruction: 'Call create_and_set_rfp with a descriptive name based on the user\'s procurement needs, then retry this operation.'
              }
            };
          }
          
          console.log('✅ Auto-injecting current RFP ID for getting bids:', sessionData.current_rfp_id);
          
          const { getRfpBids } = await import('../tools/database.ts');
          return await getRfpBids(this.supabase, {
            rfp_id: sessionData.current_rfp_id  // 🎯 INJECT RFP ID FROM SESSION
          });
        }

        case 'update_bid_status': {
          const { updateBidStatus } = await import('../tools/database.ts');
          return await updateBidStatus(this.supabase, input as {
            bid_id: number;
            status: string;
            status_reason?: string;
            reviewer_id?: string;
            score?: number;
          });
        }

        case 'generate_rfp_bid_url': {
          if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
          }
          
          // Get RFP ID from input or session context
          let rfpId = input.rfp_id;
          
          if (!rfpId) {
            // 🎯 AUTO-INJECT CURRENT RFP: Fetch current_rfp_id from session
            const sessionQuery = await this.supabase
              .from('sessions')
              .select('current_rfp_id')
              .eq('id', sessionId)
              .single();
            
            const { data: sessionData, error: sessionError } = sessionQuery as { 
              data: { current_rfp_id?: number } | null; 
              error: Error | null 
            };
            
            if (sessionError) {
              console.error('❌ Failed to fetch session data:', sessionError);
              return {
                success: false,
                error: 'Failed to retrieve session information',
                message: 'Could not fetch session data to determine current RFP.'
              };
            }
            
            if (!sessionData?.current_rfp_id) {
              console.error('❌ No current RFP set for this session');
              return {
                success: false,
                error: 'No current RFP set',
                message: 'No RFP is currently active for this session. To generate a bid URL, you must first create an RFP using the create_and_set_rfp tool.'
              };
            }
            
            rfpId = sessionData.current_rfp_id;
            console.log('✅ Auto-injecting current RFP ID for bid URL generation:', rfpId);
          }
          
          // Generate the bid submission URL
          const includeDomain = input.include_domain !== false; // Default to true
          
          // Determine the base URL based on environment
          let baseUrl = '';
          if (includeDomain) {
            // Use APP_URL environment variable if set, otherwise fallback to detection
            const appUrl = Deno.env.get('APP_URL');
            
            if (appUrl) {
              baseUrl = appUrl;
              console.log('📍 Using APP_URL from environment:', baseUrl);
            } else {
              // Fallback: detect from SUPABASE_URL
              const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
              console.log('🔍 Environment detection - SUPABASE_URL:', supabaseUrl);
              
              // Use APP_URL environment variable if available, otherwise auto-detect
              const appUrl = Deno.env.get('APP_URL');
              if (appUrl) {
                baseUrl = appUrl;
                console.log('📍 Using APP_URL from config:', appUrl);
              } else {
                // Fallback: Check if running locally (127.0.0.1, localhost, or internal kong URL)
                if (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost') || supabaseUrl.includes('kong:')) {
                  baseUrl = 'http://localhost:3100';
                  console.log('📍 Detected LOCAL environment');
                } else {
                  // Production/remote environment - using browser history routing (no hash)
                  baseUrl = 'https://dev.rfpez.ai';
                  console.log('📍 Detected REMOTE environment');
                }
              }
            }
          }
          
          const bidUrl = `${baseUrl}/bid/submit?rfp_id=${rfpId}`;
          
          console.log('✅ Generated bid URL:', bidUrl);
          console.log('   - Base URL:', baseUrl);
          console.log('   - RFP ID:', rfpId);
          console.log('   - Include domain:', includeDomain);
          
          return {
            success: true,
            data: {
              bid_url: bidUrl,
              rfp_id: rfpId
            },
            message: `Bid submission URL generated successfully: ${bidUrl}`
          };
        }

        case 'create_memory': {
          // Validate required parameters
          if (!sessionId || !agentId) {
            console.error('❌ CREATE_MEMORY ERROR: sessionId and agentId are required');
            const errorResult = {
              success: false,
              error: 'Session ID and Agent ID are required for memory creation',
              message: 'Cannot create memories without valid session and agent context.'
            };
            this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, errorResult);
            return errorResult;
          }

          const { createMemory } = await import('../tools/database.ts');
          const memoryResult = await createMemory(
            this.supabase,
            input as {
              content: string;
              memory_type: 'preference' | 'fact' | 'decision' | 'context' | 'conversation';
              importance_score: number;
              reference_type?: 'rfp' | 'bid' | 'artifact' | 'message' | 'user_profile';
              reference_id?: string;
            },
            this.userId,
            agentId,
            sessionId
          );
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, memoryResult);
          return memoryResult;
        }

        case 'search_memories': {
          // Validate required parameters
          if (!agentId) {
            console.error('❌ SEARCH_MEMORIES ERROR: agentId is required');
            return {
              success: false,
              error: 'Agent ID is required for memory search',
              message: 'Cannot search memories without valid agent context.'
            };
          }

          const { searchMemories } = await import('../tools/database.ts');
          return await searchMemories(
            this.supabase,
            input as {
              query: string;
              memory_types?: string;
              limit?: number;
            },
            this.userId,
            agentId
          );
        }

        case 'perplexity_search': {
          const { executePerplexitySearch } = await import('../tools/perplexity.ts');
          const searchResult = await executePerplexitySearch(input as {
            query: string;
            recency_filter?: 'day' | 'week' | 'month' | 'year';
            return_images?: boolean;
            return_related_questions?: boolean;
          });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, searchResult);
          return searchResult as ToolResult;
        }

        case 'perplexity_ask': {
          const { executePerplexityAsk } = await import('../tools/perplexity.ts');
          const askResult = await executePerplexityAsk(input as {
            query: string;
            search_recency_filter?: 'day' | 'week' | 'month' | 'year';
          });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, askResult);
          return askResult as ToolResult;
        }

        case 'perplexity_research': {
          const { executePerplexityResearch } = await import('../tools/perplexity.ts');
          const researchResult = await executePerplexityResearch(input as {
            query: string;
            search_recency_filter?: 'day' | 'week' | 'month' | 'year';
          });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, researchResult);
          return researchResult as ToolResult;
        }

        case 'perplexity_reason': {
          const { executePerplexityReason } = await import('../tools/perplexity.ts');
          const reasonResult = await executePerplexityReason(input as {
            query: string;
          });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, reasonResult);
          return reasonResult as ToolResult;
        }

        case 'send_email': {
          const { sendEmail } = await import('../tools/email.ts');
          this.addToolInvocation('tool_start', name, agentId, input as Record<string, unknown>);
          const emailResult = await sendEmail(
            this.supabase,
            this.userId,
            {
              ...(input as {
                to: string[];
                cc?: string[];
                bcc?: string[];
                subject: string;
                body_text: string;
                body_html?: string;
              }),
              session_id: sessionId,
              agent_id: agentId
            }
          );
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, emailResult);
          return emailResult;
        }

        case 'search_emails': {
          const { searchEmails } = await import('../tools/email.ts');
          this.addToolInvocation('tool_start', name, agentId, input as Record<string, unknown>);
          const searchResult = await searchEmails(this.supabase, this.userId, input as { 
            query: string; 
            max_results?: number; 
            after_date?: string; 
            before_date?: string; 
          });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, searchResult);
          return searchResult;
        }

        case 'get_email': {
          const { getEmail } = await import('../tools/email.ts');
          this.addToolInvocation('tool_start', name, agentId, input as Record<string, unknown>);
          const getResult = await getEmail(this.supabase, this.userId, input as { message_id: string });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, getResult);
          return getResult;
        }

        case 'list_recent_emails': {
          const { listRecentEmails } = await import('../tools/email.ts');
          this.addToolInvocation('tool_start', name, agentId, input as Record<string, unknown>);
          const listResult = await listRecentEmails(this.supabase, this.userId, input as { max_results?: number });
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, listResult);
          return listResult;
        }

        default: {
          console.log(`Unknown tool: ${name}`);
          const unknownResult = {
            success: false,
            error: `Unknown tool: ${name}`
          };
          this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, unknownResult);
          return unknownResult;
        }
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
      this.addToolInvocation('tool_complete', name, agentId, input as Record<string, unknown>, errorResult);
      return errorResult;
    }
  }

  // Execute multiple tool calls in sequence
  async executeToolCalls(toolCalls: ClaudeToolCall[], sessionId?: string, agentId?: string): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall, sessionId, agentId);
      results.push(result);
    }
    
    return results;
  }
}
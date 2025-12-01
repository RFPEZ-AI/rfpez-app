// Copyright Mark Skiba, 2025 All rights reserved
// HTTP request handlers for Claude API v3
/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-unused-vars */ import { corsHeaders } from '../config.ts';
import { getAuthenticatedSupabaseClient, getUserId, validateAuthHeader } from '../auth/auth.ts';
import { ToolExecutionService } from '../services/claude.ts';
import { createClaudeService } from '../services/factory.ts';
import { getToolDefinitions } from '../tools/definitions.ts';
import { buildSystemPrompt, loadAgentContext, loadUserProfile } from '../utils/system-prompt.ts';
// Type guards for runtime type checking
function isClaudeToolCall(obj) {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj && 'input' in obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}
function isToolExecutionResult(obj) {
  return typeof obj === 'object' && obj !== null && 'function_name' in obj && typeof obj.function_name === 'string';
}
// Recursive streaming helper to handle unlimited tool call chains
async function streamWithRecursiveTools(messages, tools, systemPrompt, claudeService, toolService, controller, supabase, sessionId, agentId, userId, recursionDepth = 0) {
  const MAX_RECURSION_DEPTH = 10;
  let fullContent = '';
  const toolsUsed = [];
  const executedToolResults = [];
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    console.warn(`🔄 Max recursion depth (${MAX_RECURSION_DEPTH}) reached, stopping recursive calls`);
    return {
      fullContent,
      toolsUsed,
      executedToolResults
    };
  }
  // 📊 Send progress update for recursion depth with tool context
  if (recursionDepth > 0) {
    const progressEvent = {
      type: 'progress',
      message: `Processing recursive tools (depth ${recursionDepth}/${MAX_RECURSION_DEPTH})...`,
      recursionDepth,
      toolsExecutedSoFar: toolsUsed.length,
      timestamp: new Date().toISOString()
    };
    const sseData = `data: ${JSON.stringify(progressEvent)}\n\n`;
    controller.enqueue(new TextEncoder().encode(sseData));
  }
  const pendingToolCalls = [];
  // Stream from Claude API
  const response = await claudeService.streamMessage(messages, tools, (chunk)=>{
    try {
      const chunkData = chunk;
      if (chunkData.type === 'text' && chunkData.content) {
        const textContent = chunkData.content;
        // MINIMAL TEXT CLEANING: Only remove obvious tool metadata, preserve all actual content
        let cleanTextContent = textContent;
        // Only clean if text contains clear tool metadata markers (very conservative)
        if (textContent.includes('"tool_use_id"') || textContent.includes('"type":"tool_use"')) {
          cleanTextContent = textContent.replace(/\{"tool_use_id":"[^"]+"[^}]*\}/g, '') // Remove complete tool_use_id objects only
          .replace(/\{"id":"[^"]+","type":"tool_use"[^}]*\}/g, '') // Remove tool_use JSON objects only
          .trim();
        }
        console.log('🧹 Text cleaning:', {
          original_length: textContent.length,
          cleaned_length: cleanTextContent.length,
          had_tool_metadata: textContent !== cleanTextContent
        });
        // Only add to fullContent and stream if we have actual text content
        if (cleanTextContent) {
          fullContent += cleanTextContent;
          const textEvent = {
            type: 'content_delta',
            delta: cleanTextContent,
            full_content: fullContent
          };
          const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
          controller.enqueue(new TextEncoder().encode(sseData));
        }
      } else if (chunkData.type === 'tool_use' && chunkData.name) {
        console.log(`🔧 Tool use detected at depth ${recursionDepth}:`, chunkData.name, 'for agent:', agentId);
        if (!toolsUsed.includes(chunkData.name)) {
          toolsUsed.push(chunkData.name);
        }
        pendingToolCalls.push(chunkData);
        // 📊 Track tool invocation start
        toolService.addToolInvocation('tool_start', chunkData.name, agentId, chunkData.input);
        // Send tool invocation start event WITH AGENT ID
        const toolEvent = {
          type: 'tool_invocation',
          toolEvent: {
            type: 'tool_start',
            toolName: chunkData.name,
            parameters: chunkData.input,
            agentId: agentId,
            timestamp: new Date().toISOString()
          }
        };
        const sseData = `data: ${JSON.stringify(toolEvent)}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseData));
      }
    } catch (error) {
      console.error('Error in recursive chunk handler:', error);
    }
  }, systemPrompt);
  // If there are tool calls, execute them and recurse
  if (pendingToolCalls.length > 0) {
    console.log(`🔧 Executing ${pendingToolCalls.length} tools at depth ${recursionDepth}`);
    // 📊 Send progress update for tool execution
    const toolProgressEvent = {
      type: 'progress',
      message: `Executing ${pendingToolCalls.length} tool${pendingToolCalls.length > 1 ? 's' : ''} at depth ${recursionDepth}...`,
      toolCount: pendingToolCalls.length,
      toolNames: pendingToolCalls.map((tc)=>isClaudeToolCall(tc) ? tc.name : 'unknown').filter(Boolean),
      recursionDepth,
      timestamp: new Date().toISOString()
    };
    const toolProgressSse = `data: ${JSON.stringify(toolProgressEvent)}\n\n`;
    controller.enqueue(new TextEncoder().encode(toolProgressSse));
    const toolResults = [];
    let toolIndex = 0;
    for (const toolCall of pendingToolCalls){
      toolIndex++;
      if (!isClaudeToolCall(toolCall)) continue;
      // 📊 Send progress for individual tool
      const toolStartProgress = {
        type: 'progress',
        message: `Executing tool ${toolIndex}/${pendingToolCalls.length}: ${toolCall.name}...`,
        toolName: toolCall.name,
        toolIndex,
        totalTools: pendingToolCalls.length,
        recursionDepth,
        timestamp: new Date().toISOString()
      };
      const toolStartSse = `data: ${JSON.stringify(toolStartProgress)}\n\n`;
      controller.enqueue(new TextEncoder().encode(toolStartSse));
      try {
        const result = await toolService.executeTool(toolCall, sessionId, agentId);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        });
        executedToolResults.push({
          function_name: toolCall.name,
          result: result
        });
        // 📊 Track tool invocation completion
        toolService.addToolInvocation('tool_complete', toolCall.name, agentId, undefined, result);
        // Send tool completion event WITH AGENT ID
        const toolCompleteEvent = {
          type: 'tool_invocation',
          toolEvent: {
            type: 'tool_complete',
            toolName: toolCall.name,
            result: result,
            agentId: agentId,
            timestamp: new Date().toISOString()
          }
        };
        const completeSseData = `data: ${JSON.stringify(toolCompleteEvent)}\n\n`;
        controller.enqueue(new TextEncoder().encode(completeSseData));
      } catch (error) {
        console.error(`Tool execution error for ${toolCall.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
        const errorResult = {
          success: false,
          error: errorMessage
        };
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(errorResult)
        });
        executedToolResults.push({
          function_name: toolCall.name,
          result: errorResult
        });
      }
    }
    // 🔄 CHECK FOR AGENT SWITCHING WITH CONTINUATION
    const agentSwitchResult = executedToolResults.find((result)=>{
      const resultData = result;
      return resultData.function_name === 'switch_agent' && resultData.result?.success === true && resultData.result?.trigger_continuation === true;
    });
    if (agentSwitchResult && recursionDepth < MAX_RECURSION_DEPTH - 1) {
      console.log('🚀 AGENT SWITCH WITH CONTINUATION DETECTED');
      // 📊 Send progress update for agent switching
      const agentSwitchProgress = {
        type: 'progress',
        message: 'Switching agents...',
        action: 'agent_switch',
        timestamp: new Date().toISOString()
      };
      const agentSwitchSse = `data: ${JSON.stringify(agentSwitchProgress)}\n\n`;
      controller.enqueue(new TextEncoder().encode(agentSwitchSse));
      try {
        const switchResult = agentSwitchResult.result;
        const newAgentData = switchResult.new_agent;
        const contextMessage = switchResult.context_message;
        console.log('🤖 Triggering new agent automatic response:', {
          agent_name: newAgentData?.name,
          agent_role: newAgentData?.role,
          context_preview: contextMessage?.substring(0, 100)
        });
        // 🎯 SAVE ORIGINAL AGENT'S MESSAGE WITH TOOL INVOCATIONS
        // Before switching agents, save the original agent's message with tool invocations
        // This ensures the Solutions agent's work (create_memory, switch_agent) is recorded
        console.log('💾 Saving original agent message with tool invocations before agent switch');
        const originalAgentToolInvocations = toolService.getToolInvocations();
        console.log(`📊 Original agent has ${originalAgentToolInvocations.length} tool invocations to save`);
        if (originalAgentToolInvocations.length > 0 && userId && sessionId) {
          const { storeMessage } = await import('../tools/database.ts');
          const originalAgentMessageResult = await storeMessage(supabase, {
            sessionId: sessionId,
            userId: userId,
            sender: 'assistant',
            content: fullContent || '✓ Agent handoff initiated',
            agentId: agentId,
            metadata: {
              toolInvocations: originalAgentToolInvocations,
              agent_switch: true,
              switched_to: newAgentData?.name
            }
          });
          if (originalAgentMessageResult.success) {
            console.log('✅ Original agent message saved with tool invocations:', originalAgentMessageResult.message_id);
          } else {
            console.error('❌ Failed to save original agent message');
          }
        }
        // 🎯 CRITICAL FIX: Send completion event for first agent's message before starting new agent
        console.log('✅ Completing first agent message before agent switch');
        const messageCompleteEvent = {
          type: 'message_complete',
          agent_id: agentId,
          content: fullContent || '✓ Agent handoff initiated',
          timestamp: new Date().toISOString()
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(messageCompleteEvent)}\n\n`));
        // 📊 Send progress update for loading new agent
        const loadAgentProgress = {
          type: 'progress',
          message: `Loading ${newAgentData?.name || 'new agent'}...`,
          agentName: newAgentData?.name,
          timestamp: new Date().toISOString()
        };
        const loadAgentSse = `data: ${JSON.stringify(loadAgentProgress)}\n\n`;
        controller.enqueue(new TextEncoder().encode(loadAgentSse));
        // Get new agent context and tools - need to import necessary functions
        const { loadAgentContext } = await import('../utils/system-prompt.ts');
        const { buildSystemPrompt } = await import('../utils/system-prompt.ts');
        const { getToolDefinitions } = await import('../tools/definitions.ts');
        const newAgentContext = await loadAgentContext(supabase, sessionId, newAgentData?.id);
        if (!newAgentContext) {
          throw new Error('Failed to load new agent context');
        }
        // Build system prompt for new agent that SKIPS welcome and focuses on context processing
        const baseSystemPrompt = buildSystemPrompt({
          agent: newAgentContext,
          sessionId: sessionId
        });
        // Override system prompt to focus on context processing, not welcome
        const contextProcessingPrompt = baseSystemPrompt + `\n\n🤖 CONTEXT HANDOFF MODE: You are receiving a handoff from another agent. ` + `DO NOT provide a welcome message or introduction. ` + `Instead, IMMEDIATELY process the context and take appropriate actions based on your role. ` + `The user has already been greeted by the previous agent.`;
        const newTools = getToolDefinitions(newAgentContext.role, newAgentContext.access);
        // 🎯 CRITICAL FIX: Send new message start event for the new agent
        console.log('🆕 Starting new message for new agent');
        const newMessageStartEvent = {
          type: 'message_start',
          agent_id: newAgentData?.id,
          agent_name: newAgentData?.name,
          timestamp: new Date().toISOString()
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(newMessageStartEvent)}\n\n`));
        // Create continuation messages with context
        const continuationMessages = [
          {
            role: 'user',
            content: contextMessage || 'Continue with the previous context.'
          }
        ];
        // **RECURSIVE CALL FOR NEW AGENT** - Process context without welcome
        // 🎯 CRITICAL: Pass the NEW agent's ID, not the old one
        const continuationResult = await streamWithRecursiveTools(continuationMessages, newTools, contextProcessingPrompt, claudeService, toolService, controller, supabase, sessionId, newAgentData?.id, userId, recursionDepth + 1);
        // 🎯 CRITICAL FIX: Do NOT merge continuation content with original message
        // Return results separately so they can be stored as different messages
        console.log('✅ Agent continuation completed - returning separate message content', {
          original_agent_id: agentId,
          new_agent_id: newAgentData?.id,
          new_agent: newAgentData?.name,
          original_content_length: fullContent.length,
          continuation_content_length: continuationResult.fullContent.length,
          tools_used: continuationResult.toolsUsed
        });
        // Return original content only - new agent's content is handled separately via streaming
        toolsUsed.push(...continuationResult.toolsUsed.filter((tool)=>!toolsUsed.includes(tool)));
        executedToolResults.push(...continuationResult.executedToolResults);
        return {
          fullContent,
          toolsUsed,
          executedToolResults
        };
      } catch (continuationError) {
        console.error('❌ Agent continuation failed:', continuationError);
      // Fall through to standard recursion behavior
      }
    }
    // Build messages with tool results
    // 🎯 CRITICAL FIX: Use pendingToolCalls (the actual tool_use blocks) instead of response.toolCalls
    // toolResults array was already built correctly with matching tool_use_id values
    const messagesWithToolResults = [
      ...messages,
      {
        role: 'assistant',
        content: pendingToolCalls.map((tc)=>({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.input
          }))
      },
      {
        role: 'user',
        content: toolResults // Use the already-built toolResults array with correct tool_use_id
      }
    ];
    // Recurse to handle potential additional tool calls
    const recursiveResult = await streamWithRecursiveTools(messagesWithToolResults, tools, systemPrompt, claudeService, toolService, controller, supabase, sessionId, agentId, userId, recursionDepth + 1);
    // Combine results
    fullContent += recursiveResult.fullContent;
    toolsUsed.push(...recursiveResult.toolsUsed.filter((tool)=>!toolsUsed.includes(tool)));
    executedToolResults.push(...recursiveResult.executedToolResults);
  }
  return {
    fullContent,
    toolsUsed,
    executedToolResults
  };
}
// Handle streaming response with proper SSE format and tool execution
function handleStreamingResponse(messages, supabase, userId, sessionId, agentId, userMessage, agent, newSessionData, processInitialPrompt = false) {
  // 🔍 AUTOMATIC KNOWLEDGE RETRIEVAL: Search account_memories for relevant context
  // This runs BEFORE streaming to inject uploaded file content and other knowledge
  const augmentMessagesWithKnowledge = async (msgs)=>{
    try {
      // Get the last user message to use as search query
      const lastUserMessage = [
        ...msgs
      ].reverse().find((msg)=>msg.role === 'user');
      if (!lastUserMessage || !userId) {
        return msgs; // No user message or userId, return original messages
      }
      const userContent = lastUserMessage.content;
      console.log('🔍 [STREAMING] Automatic knowledge retrieval - searching for context related to:', userContent.substring(0, 100));
      // Import searchMemories function
      const { searchMemories } = await import('../tools/database.ts');
      // Search for relevant knowledge (documents, facts, preferences)
      const searchResult = await searchMemories(supabase, {
        query: userContent,
        memory_types: 'document,knowledge,fact,preference',
        limit: 5
      }, userId, agentId || '');
      if (searchResult.success && searchResult.memories && searchResult.memories.length > 0) {
        console.log(`✅ [STREAMING] Found ${searchResult.memories.length} relevant knowledge items`);
        // Build knowledge context string
        const knowledgeItems = searchResult.memories.map((mem, idx)=>{
          const typeLabel = mem.memory_type === 'document' ? '📄 Uploaded File' : '💡 Knowledge';
          return `${typeLabel} ${idx + 1}:\n${mem.content}\n(Relevance: ${(mem.similarity * 100).toFixed(1)}%)`;
        }).join('\n\n---\n\n');
        const knowledgeContext = `\n\n<knowledge_context>\nThe following information from the user's knowledge base may be relevant to this request:\n\n${knowledgeItems}\n</knowledge_context>`;
        console.log('📚 [STREAMING] Knowledge context prepared:', knowledgeContext.substring(0, 200) + '...');
        // Find last user message index and append knowledge
        const lastUserMsgIndex = [
          ...msgs
        ].map((msg, idx)=>({
            msg,
            idx
          })).reverse().find(({ msg })=>msg.role === 'user')?.idx;
        if (lastUserMsgIndex !== undefined) {
          const augmentedMessages = [
            ...msgs
          ];
          const lastMsg = augmentedMessages[lastUserMsgIndex];
          const originalContent = lastMsg.content;
          augmentedMessages[lastUserMsgIndex] = {
            ...lastMsg,
            content: originalContent + knowledgeContext
          };
          console.log('✅ [STREAMING] Knowledge context injected into user message');
          return augmentedMessages;
        }
      } else {
        console.log('ℹ️ [STREAMING] No relevant knowledge found in account_memories');
      }
    } catch (error) {
      console.error('⚠️ [STREAMING] Error during automatic knowledge retrieval:', error);
    // Don't fail the request if knowledge retrieval fails
    }
    return msgs; // Return original messages if no knowledge found or error occurred
  };
  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start (controller) {
      try {
        // Augment messages with knowledge context BEFORE streaming starts
        const augmentedMessages = await augmentMessagesWithKnowledge(messages);
        const claudeService = createClaudeService();
        const toolService = new ToolExecutionService(supabase, userId, userMessage);
        console.log(`🧩 STREAMING: Agent object received:`, agent);
        console.log(`🧩 STREAMING: Agent role:`, agent?.role);
        console.log(`🧩 STREAMING: Agent type:`, typeof agent);
        // Load agent context and user profile, then build system prompt
        const agentContext = await loadAgentContext(supabase, sessionId, agentId);
        const userProfile = await loadUserProfile(supabase);
        // 🎭 Send activation notice if processing initial_prompt (agent activation/welcome)
        if (processInitialPrompt && agentContext) {
          const activationNotice = {
            type: 'agent_activation',
            agent_name: agentContext.name,
            agent_role: agentContext.role,
            message: `Activating ${agentContext.name} agent...`,
            timestamp: new Date().toISOString()
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(activationNotice)}\n\n`));
          console.log('📣 Sent activation notice for initial_prompt:', activationNotice.message);
        }
        // Extract user message for agent switch context detection
        const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
        const userMessageText = lastUserMessage && typeof lastUserMessage === 'object' && 'content' in lastUserMessage ? String(lastUserMessage.content) : undefined;
        const systemPrompt = buildSystemPrompt({
          agent: agentContext || undefined,
          userProfile: userProfile || undefined,
          sessionId: sessionId,
          isAnonymous: !userProfile
        }, userMessageText);
        console.log('🎯 STREAMING: System prompt built:', systemPrompt ? 'Yes' : 'No');
        console.log('🎭 STREAMING: Using initial_prompt as system:', processInitialPrompt);
        console.log('🔄 STREAMING: Agent switch context detection:', userMessageText?.includes('User context from previous agent:') || false);
        // 🔍 DEBUG: Log agent role before getting tools - USE agentContext not agent from request
        console.log('🔧 DEBUG: Request agent role:', agent?.role, typeof agent?.role);
        console.log('🔧 DEBUG: AgentContext role:', agentContext?.role, typeof agentContext?.role);
        console.log('🔧 DEBUG: AgentContext object:', {
          id: agentContext?.id,
          name: agentContext?.name,
          role: agentContext?.role,
          access: agentContext?.access
        });
        // � IMPROVED: Allow read-only tools during initial_prompt processing
        // Initial prompts can search memories and get context, but cannot create sessions/artifacts
        let tools = getToolDefinitions(agentContext?.role, agentContext?.access);
        if (processInitialPrompt) {
          // Filter to only read-only tools that are safe during welcome message generation
          const safeTools = [
            'search_memories',
            'get_conversation_history',
            'search_messages',
            'get_current_rfp',
            'get_current_agent'
          ];
          tools = tools.filter((tool)=>safeTools.includes(tool.name));
          console.log('� Initial prompt processing - tools filtered to read-only:', tools.map((t)=>t.name));
        }
        // Use recursive streaming to handle unlimited tool call chains
        const result = await streamWithRecursiveTools(augmentedMessages, tools, systemPrompt, claudeService, toolService, controller, supabase, sessionId, agentId, userId // Pass userId for message saving
        );
        const { fullContent, toolsUsed, executedToolResults } = result;
        console.log('� Recursive streaming completed:', {
          fullContentLength: fullContent.length,
          toolsUsedCount: toolsUsed.length,
          executedToolResultsCount: executedToolResults.length,
          toolsUsed: toolsUsed
        });
        // Detect if an agent switch occurred during streaming
        const agentSwitchOccurred = executedToolResults.some((result)=>{
          return isToolExecutionResult(result) && result.function_name === 'switch_agent' && result.result?.success === true;
        });
        // 🚨 AUTOMATIC READINESS CHECK for streaming: Check if RFP Design package is complete
        let readinessCheckMessage = '';
        const RFP_DESIGN_AGENT_ID = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';
        // Check if any artifact creation tools were executed
        const artifactCreated = executedToolResults.some((result)=>{
          return isToolExecutionResult(result) && (result.function_name === 'create_form_artifact' || result.function_name === 'create_document_artifact') && result.result?.success === true;
        });
        // Only check readiness if current agent is RFP Design and an artifact was just created
        if (agentId === RFP_DESIGN_AGENT_ID && artifactCreated) {
          try {
            console.log('🔍 [STREAMING] Checking RFP Design package readiness after artifact creation...');
            // Import list_artifacts function
            const { listArtifacts } = await import('../tools/database.ts');
            const artifactList = await listArtifacts(supabase, {
              sessionId: sessionId || '',
              userId: userId || ''
            });
            console.log('📦 [STREAMING] Artifacts in session:', JSON.stringify(artifactList, null, 2));
            // Check for required artifacts
            const hasBidForm = artifactList?.artifacts?.some((a)=>a.artifact_role === 'bid_form');
            const hasRequestEmail = artifactList?.artifacts?.some((a)=>a.artifact_role === 'rfp_request_email');
            console.log('✅ [STREAMING] Readiness check:', {
              hasBidForm,
              hasRequestEmail
            });
            // If both required artifacts exist, inject readiness message
            if (hasBidForm && hasRequestEmail) {
              readinessCheckMessage = `\n\n🎉 **Your RFP package is complete!** You now have:\n✅ Supplier Bid Form\n✅ RFP Request Email\n\nReady to find qualified suppliers and send invitations?\n\n💡 **Suggested next step:** Switch to the **Sourcing agent** to identify and invite suppliers.\n\nType "complete" to proceed or ask me to make any changes.`;
              console.log('🎉 [STREAMING] RFP Design package complete - readiness message will be injected');
              // Stream the readiness message as content
              const readinessEvent = {
                type: 'content_block_delta',
                delta: {
                  type: 'text_delta',
                  text: readinessCheckMessage
                }
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(readinessEvent)}\n\n`));
            } else {
              console.log('⏳ [STREAMING] RFP Design package incomplete - continuing...');
            }
          } catch (error) {
            console.error('❌ [STREAMING] Error during automatic readiness check:', error);
          // Don't fail the entire request if readiness check fails
          }
        }
        // Extract clientCallbacks from tool results
        const clientCallbacks = [];
        executedToolResults.forEach((toolResult)=>{
          if (toolResult && typeof toolResult === 'object' && 'result' in toolResult) {
            const result = toolResult.result;
            if (result && typeof result === 'object' && 'clientCallbacks' in result) {
              const callbacks = result.clientCallbacks;
              if (Array.isArray(callbacks)) {
                clientCallbacks.push(...callbacks);
                console.log(`🔔 Extracted ${callbacks.length} clientCallbacks from tool result`);
              }
            }
          }
        });
        // Send completion event with metadata including agent switch detection
        const completeEvent = {
          type: 'complete',
          full_content: fullContent + readinessCheckMessage,
          token_count: (fullContent + readinessCheckMessage).length,
          tool_results: toolsUsed.map((name)=>({
              name,
              success: true
            })),
          metadata: {
            agent_switch_occurred: agentSwitchOccurred,
            functions_called: toolsUsed,
            function_results: executedToolResults,
            clientCallbacks: clientCallbacks.length > 0 ? clientCallbacks : undefined
          }
        };
        console.log(`📤 Complete event includes ${clientCallbacks.length} clientCallbacks`);
        // Add session creation info if a new session was auto-created
        if (newSessionData) {
          completeEvent.session_created = true;
          completeEvent.new_session = {
            id: newSessionData.session_id,
            message: newSessionData.message
          };
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
        const errorEvent = JSON.stringify({
          type: 'error',
          error: errorMessage
        });
        controller.enqueue(new TextEncoder().encode(`data: ${errorEvent}\n\n`));
        controller.close();
      }
    }
  });
  return Promise.resolve(new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  }));
}
// Handle OPTIONS request for CORS
export function handleOptionsRequest() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
// Handle POST request - main Claude API integration
export async function handlePostRequest(request) {
  try {
    // Validate authentication
    const _token = validateAuthHeader(request);
    // Get authenticated Supabase client
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase, request);
    // Parse request body
    const body = await request.json();
    // 🚨 VERY EARLY DEBUG: Log the raw processInitialPrompt value from request
    console.log('🚨🚨🚨 RAW BODY processInitialPrompt:', body.processInitialPrompt, 'Type:', typeof body.processInitialPrompt);
    const { userMessage, agent, conversationHistory = [], sessionId, agentId, userProfile: _userProfile, currentRfp: _currentRfp, currentArtifact: _currentArtifact, loginEvidence: _loginEvidence, memoryContext = '', stream = false, clientCallback, processInitialPrompt = false, // Legacy support for direct messages format
    messages } = body;
    // 🚨 AFTER DESTRUCTURE: Log the processInitialPrompt variable value
    console.log('🚨🚨🚨 AFTER DESTRUCTURE processInitialPrompt:', processInitialPrompt, 'Type:', typeof processInitialPrompt);
    // Load agent context and user profile, then build system prompt
    // Use agent.id from the agent object if agentId is not explicitly provided
    const agentIdForContext = agentId || agent?.id;
    const agentContext = await loadAgentContext(supabase, sessionId, agentIdForContext);
    const loadedUserProfile = await loadUserProfile(supabase);
    // 🎯 CRITICAL: Load session metadata to check for bid_id
    let sessionBidId = null;
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase.from('sessions').select('session_metadata').eq('id', sessionId).single();
      if (!sessionError && session?.session_metadata?.bid_id) {
        sessionBidId = session.session_metadata.bid_id;
        console.log('🎯 Loaded bid_id from session_metadata:', sessionBidId);
      }
    }
    // Define effectiveAgentId early for use in automatic knowledge retrieval
    const effectiveAgentId = agentId || agent?.id;
    // 🎯 INITIAL PROMPT PROCESSING: If processInitialPrompt flag is set, use initial_prompt instructions to generate welcome
    let effectiveUserMessage = userMessage;
    let effectiveConversationHistory = conversationHistory;
    console.log('🔍 INITIAL PROMPT CHECK:', {
      processInitialPrompt,
      hasAgentContext: !!agentContext,
      hasInitialPrompt: !!agentContext?.initial_prompt,
      agentName: agentContext?.name,
      initialPromptLength: agentContext?.initial_prompt?.length || 0,
      willProcess: !!(processInitialPrompt && agentContext?.initial_prompt)
    });
    if (processInitialPrompt) {
      if (!agentContext || !agentContext.initial_prompt) {
        // 🚨 CRITICAL: Never return raw instructions to client. Return a clear error instead.
        return new Response(JSON.stringify({
          error: 'Agent context or initial_prompt missing. Cannot generate welcome message.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      console.log('🎭 Processing initial_prompt through Claude for agent:', agentContext.name);
      console.log('🎭 Initial prompt preview:', agentContext.initial_prompt.substring(0, 100) + '...');
      // Build authentication context for the welcome message
      let authContext = '';
      let authStatus = '';
      if (loadedUserProfile) {
        const userName = loadedUserProfile.full_name || loadedUserProfile.email?.split('@')[0] || 'there';
        authContext = `The current user IS AUTHENTICATED (logged in).\nUser name: ${userName}`;
        if (loadedUserProfile.email) {
          authContext += `\nUser email: ${loadedUserProfile.email}`;
        }
        authStatus = 'authenticated';
      } else {
        authContext = `The current user IS ANONYMOUS (not logged in).`;
        authStatus = 'anonymous';
      }
      // 🎯 CRITICAL FIX: Preserve URL Context from incoming userMessage
      // Extract URL Context if present at the start of userMessage
      let urlContext = '';
      const urlContextMatch = userMessage?.match(/^\[URL Context: ([^\]]+)\]\n\n/);
      if (urlContextMatch) {
        urlContext = `\n\n[URL Context: ${urlContextMatch[1]}]\n`;
        console.log('🔗 PRESERVED URL CONTEXT for initial prompt:', urlContextMatch[1]);
        console.log('🔗 Full URL Context string:', urlContext);
      } else {
        console.log('⚠️ NO URL CONTEXT FOUND in userMessage');
        console.log('⚠️ userMessage first 200 chars:', userMessage?.substring(0, 200));
      }
      // Create a clear, directive meta-prompt with explicit auth information
      // 🔥 CRITICAL: Do NOT include initial_prompt in user message - it's already in system prompt
      // 🎯 CRITICAL: Preserve URL Context so Claude can act on it
      effectiveUserMessage = `You must generate a welcome message right now. Do not ask for more information.

${authContext}${urlContext}

Based on your role as ${agentContext?.name || 'the active agent'}, generate an appropriate ${authStatus} user welcome message now. Use your instructions to guide the welcome message content.`;
      // Clear conversation history for welcome prompts
      effectiveConversationHistory = [];
      console.log('🎭 Effective user message set to initial_prompt generation request with auth context:', authStatus);
    }
    // 🔍 LOADED AGENT CONTEXT DEBUG
    console.log('🗄️🗄️🗄️ DATABASE AGENT CONTEXT 🗄️🗄️🗄️');
    console.log('Loaded agentContext.name:', agentContext?.name);
    console.log('Loaded agentContext.role:', agentContext?.role);
    console.log('Loaded agentContext.instructions preview:', agentContext?.instructions?.substring(0, 100) + '...');
    console.log('🗄️🗄️🗄️ END DATABASE AGENT CONTEXT 🗄️🗄️🗄️');
    const systemPrompt = buildSystemPrompt({
      agent: agentContext || undefined,
      userProfile: loadedUserProfile || undefined,
      sessionId: sessionId,
      isAnonymous: !loadedUserProfile,
      memoryContext: memoryContext || undefined
    }, undefined); // Always use normal instructions as system prompt
    console.log('🎯 POST REQUEST: System prompt built:', systemPrompt ? 'Yes' : 'No');
    console.log('🎭 POST REQUEST: Processing initial prompt:', processInitialPrompt);
    // Convert ClaudeService format to messages format
    let processedMessages = [];
    // 🎯 CRITICAL: Inject URL Context from session_metadata if available
    // This ensures bid_id persists across page refreshes
    let urlContextInjection = '';
    if (sessionBidId && !processInitialPrompt) {
      urlContextInjection = `\n\n[URL Context: bid_id=${sessionBidId}]\n\n`;
      console.log('🎯 Injecting URL Context from session_metadata:', urlContextInjection);
    }
    // 🚨 CRITICAL: When processInitialPrompt is true, ALWAYS use effectiveUserMessage (never raw prompt)
    if (processInitialPrompt) {
      processedMessages = [
        ...effectiveConversationHistory,
        {
          role: 'user',
          content: effectiveUserMessage
        }
      ];
    } else if (messages && Array.isArray(messages)) {
      // Direct messages format (legacy) - inject URL Context into last user message
      if (urlContextInjection && messages.length > 0) {
        const lastMessageIndex = messages.length - 1;
        const lastMessage = messages[lastMessageIndex];
        if (lastMessage.role === 'user') {
          messages[lastMessageIndex] = {
            ...lastMessage,
            content: urlContextInjection + lastMessage.content
          };
          console.log('🎯 URL Context injected into last user message (legacy format)');
        }
      }
      processedMessages = messages;
    } else if (effectiveUserMessage) {
      // ClaudeService format - inject URL Context and convert to messages
      const messageContent = urlContextInjection + effectiveUserMessage;
      processedMessages = [
        ...effectiveConversationHistory,
        {
          role: 'user',
          content: messageContent
        }
      ];
      console.log('🎯 URL Context injected into effectiveUserMessage');
    } else {
      return new Response(JSON.stringify({
        error: 'Either messages array or userMessage is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Validate message format
    if (processedMessages.length === 0) {
      return new Response(JSON.stringify({
        error: 'Messages array cannot be empty'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Validate message roles
    for (const message of processedMessages){
      const messageObj = message;
      if (!messageObj.role || ![
        'user',
        'assistant',
        'system'
      ].includes(messageObj.role)) {
        return new Response(JSON.stringify({
          error: `Invalid message role: ${messageObj.role}. Must be 'user', 'assistant', or 'system'`
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      if (!messageObj.content) {
        return new Response(JSON.stringify({
          error: 'Message content is required'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }
    // 🔍 AUTOMATIC KNOWLEDGE RETRIEVAL: Search account_memories for relevant context
    // This runs BEFORE sending to Claude to inject uploaded file content and other knowledge
    let knowledgeContext = '';
    try {
      // Get the last user message to use as search query
      const lastUserMessage = [
        ...processedMessages
      ].reverse().find((msg)=>msg.role === 'user');
      if (lastUserMessage && userId) {
        const userContent = lastUserMessage.content;
        console.log('🔍 Automatic knowledge retrieval - searching for context related to:', userContent.substring(0, 100));
        // Import searchMemories function
        const { searchMemories } = await import('../tools/database.ts');
        // Search for relevant knowledge (documents, facts, preferences)
        const searchResult = await searchMemories(supabase, {
          query: userContent,
          memory_types: 'document,knowledge,fact,preference',
          limit: 5
        }, userId, effectiveAgentId || '');
        if (searchResult.success && searchResult.memories && searchResult.memories.length > 0) {
          console.log(`✅ Found ${searchResult.memories.length} relevant knowledge items`);
          // Build knowledge context string
          const knowledgeItems = searchResult.memories.map((mem, idx)=>{
            const typeLabel = mem.memory_type === 'document' ? '📄 Uploaded File' : '💡 Knowledge';
            return `${typeLabel} ${idx + 1}:\n${mem.content}\n(Relevance: ${(mem.similarity * 100).toFixed(1)}%)`;
          }).join('\n\n---\n\n');
          knowledgeContext = `\n\n<knowledge_context>\nThe following information from the user's knowledge base may be relevant to this request:\n\n${knowledgeItems}\n</knowledge_context>`;
          console.log('📚 Knowledge context prepared:', knowledgeContext.substring(0, 200) + '...');
        } else {
          console.log('ℹ️ No relevant knowledge found in account_memories');
        }
      }
    } catch (error) {
      console.error('⚠️ Error during automatic knowledge retrieval:', error);
    // Don't fail the request if knowledge retrieval fails
    }
    // If knowledge context was found, append it to the last user message
    if (knowledgeContext) {
      const lastUserMsgIndex = [
        ...processedMessages
      ].map((msg, idx)=>({
          msg,
          idx
        })).reverse().find(({ msg })=>msg.role === 'user')?.idx;
      if (lastUserMsgIndex !== undefined) {
        const lastMsg = processedMessages[lastUserMsgIndex];
        const originalContent = lastMsg.content;
        processedMessages[lastUserMsgIndex] = {
          ...lastMsg,
          content: originalContent + knowledgeContext
        };
        console.log('✅ Knowledge context injected into user message');
      }
    }
    // 🔍 BROWSER vs API DEBUG: Compare agent sources
    console.log('🔍🔍🔍 AGENT CONTEXT DEBUG 🔍🔍🔍');
    console.log('AgentId from payload:', agentId);
    console.log('Agent.id from payload:', agent?.id);
    console.log('Agent.name from payload:', agent?.name);
    console.log('Agent.instructions preview:', agent?.instructions?.substring(0, 100) + '...');
    console.log('Effective agentId being used:', effectiveAgentId);
    console.log('🔍🔍🔍 END AGENT CONTEXT DEBUG 🔍🔍🔍');
    console.log('Request received:', {
      userId,
      sessionId,
      agentId: effectiveAgentId,
      messageCount: processedMessages?.length,
      hasUserMessage: !!userMessage,
      hasAgent: !!agent,
      hasConversationHistory: conversationHistory.length > 0,
      stream,
      hasClientCallback: !!clientCallback,
      processInitialPrompt,
      usingInitialPrompt: processInitialPrompt && !!agentContext?.initial_prompt
    });
    // Auto-create session if none provided (for first message)
    let actualSessionId = sessionId;
    let newSessionData = null;
    if (!sessionId) {
      console.log('🆕 No session ID provided - creating new session automatically');
      // Import createSession function
      const { createSession } = await import('../tools/database.ts');
      try {
        const sessionResult = await createSession(supabase, {
          userId: userId,
          title: userMessage?.substring(0, 50) || 'New Conversation',
          agentId: effectiveAgentId
        });
        if (sessionResult.success) {
          actualSessionId = sessionResult.session_id;
          newSessionData = sessionResult; // Store the full result
          console.log('✅ Auto-created session:', actualSessionId);
        } else {
          console.error('❌ Failed to auto-create session');
        }
      } catch (error) {
        console.error('❌ Error auto-creating session:', error);
      }
    }
    // If streaming is requested OR processInitialPrompt is true, handle with streaming
    // Initial prompt processing ALWAYS uses streaming for better UX and memory search
    if (stream || processInitialPrompt) {
      if (processInitialPrompt) {
        console.log('🌊 Initial prompt processing - forcing streaming for activation notice and memory search');
      } else {
        console.log('🌊 Streaming requested - using streaming handler');
      }
      return handleStreamingResponse(processedMessages, supabase, userId, actualSessionId, effectiveAgentId, effectiveUserMessage, agent, newSessionData, processInitialPrompt);
    }
    // Initialize services
    const claudeService = createClaudeService();
    const toolService = new ToolExecutionService(supabase, userId, userMessage);
    // Get tool definitions filtered by agent role - USE agentContext not agent from request
    console.log(`🧩 NON-STREAMING: Request agent object:`, agent);
    console.log(`🧩 NON-STREAMING: Request agent role:`, agent?.role);
    console.log(`🧩 NON-STREAMING: AgentContext role:`, agentContext?.role);
    console.log(`🧩 NON-STREAMING: AgentContext object:`, {
      id: agentContext?.id,
      name: agentContext?.name,
      role: agentContext?.role,
      access: agentContext?.access
    });
    const tools = getToolDefinitions(agentContext?.role, agentContext?.access);
    // Send request to Claude API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let claudeResponse = await claudeService.sendMessage(processedMessages, tools);
    // Execute any tool calls with recursive support (up to 5 rounds)
    const MAX_TOOL_ROUNDS = 5;
    let toolResults = [];
    let currentMessages = processedMessages;
    let currentResponse = claudeResponse;
    let toolRound = 0;
    while(currentResponse.toolCalls && currentResponse.toolCalls.length > 0 && toolRound < MAX_TOOL_ROUNDS){
      toolRound++;
      console.log(`🔧 Tool execution round ${toolRound}/${MAX_TOOL_ROUNDS}, executing ${currentResponse.toolCalls.length} tools`);
      toolResults = await toolService.executeToolCalls(currentResponse.toolCalls, sessionId, effectiveAgentId);
      // If there were tool calls, send follow-up message to Claude with results
      if (toolResults.length > 0) {
        console.log(`🔧 Tool round ${toolRound}: Sending results back to Claude`);
        const followUpMessages = [
          ...currentMessages,
          {
            role: 'assistant',
            content: currentResponse.toolCalls.map((call)=>({
                type: 'tool_use',
                id: isClaudeToolCall(call) ? call.id : String(call.id || ''),
                name: isClaudeToolCall(call) ? call.name : String(call.name || ''),
                input: isClaudeToolCall(call) ? call.input : call.input || {}
              }))
          },
          {
            role: 'user',
            content: toolResults.map((result, index)=>({
                type: 'tool_result',
                tool_use_id: currentResponse.toolCalls[index].id,
                content: JSON.stringify(result) // The result itself is the output
              }))
          }
        ];
        // Get next response from Claude (may have more tool calls)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentResponse = await claudeService.sendMessage(followUpMessages, tools);
        currentMessages = followUpMessages;
        console.log(`✅ Tool round ${toolRound} completed, has_more_tools: ${!!currentResponse.toolCalls?.length}`);
      } else {
        break; // No results, stop
      }
    }
    if (toolRound >= MAX_TOOL_ROUNDS && currentResponse.toolCalls?.length > 0) {
      console.warn(`⚠️ Reached max tool rounds (${MAX_TOOL_ROUNDS}), stopping with ${currentResponse.toolCalls.length} pending tools`);
    }
    // Update claudeResponse with the final response
    claudeResponse = currentResponse;
    console.log(`✅ Tool execution completed after ${toolRound} rounds`);
    // Detect if an agent switch occurred successfully
    // In non-streaming mode, we need to check both the tool calls and the results
    const agentSwitchOccurred = claudeResponse.toolCalls?.some((call, index)=>{
      const toolCall = call;
      const result = toolResults[index];
      console.log('🔍 Checking tool call for agent switch:', {
        tool_name: toolCall.name,
        result_success: result?.success,
        result_keys: Object.keys(result || {}),
        is_switch_agent: toolCall.name === 'switch_agent',
        success_check: result?.success === true
      });
      return toolCall.name === 'switch_agent' && result?.success === true;
    }) || false;
    console.log('🔍 Agent switch detection result:', {
      agentSwitchOccurred,
      total_tool_calls: claudeResponse.toolCalls?.length || 0,
      tool_names: claudeResponse.toolCalls?.map((call)=>call.name)
    });
    // AGENT CONTEXT TRANSFER: Check if we need to trigger continuation after agent switch
    if (agentSwitchOccurred) {
      console.log('🔄 Agent switch detected - checking for continuation requirement');
      // Find the switch_agent result that has trigger_continuation
      const switchAgentResult = toolResults.find((result, index)=>{
        const toolCall = claudeResponse.toolCalls?.[index];
        const resultData = result;
        return toolCall?.name === 'switch_agent' && resultData?.success === true && resultData?.trigger_continuation === true;
      });
      if (switchAgentResult?.trigger_continuation) {
        const newAgentData = switchAgentResult.new_agent;
        console.log('🤖 Triggering agent continuation with conversation history:', {
          new_agent_id: newAgentData?.id,
          new_agent_name: newAgentData?.name,
          session_id: sessionId
        });
        try {
          // Fetch full conversation history for the new agent
          const { fetchConversationHistory } = await import('../tools/database.ts');
          const conversationHistory = await fetchConversationHistory(supabase, sessionId);
          console.log('📚 Retrieved conversation history:', {
            message_count: conversationHistory.length,
            first_message_preview: conversationHistory[0]?.message?.substring(0, 100),
            last_message_preview: conversationHistory[conversationHistory.length - 1]?.message?.substring(0, 100)
          });
          // **TRIGGER AUTOMATIC CONTINUATION** - Make new agent respond immediately
          try {
            console.log('🚀 TRIGGERING AUTOMATIC AGENT CONTINUATION WITH CONVERSATION HISTORY');
            // Build continuation messages from conversation history instead of passed context
            const continuationMessages = conversationHistory.map((msg)=>({
                role: msg.role,
                content: msg.message
              }));
            // Add current assistant response to conversation
            continuationMessages.push({
              role: 'assistant',
              content: claudeResponse.textResponse || ''
            });
            // 🎯 USE NEW AGENT'S INITIAL_PROMPT if available (for memory-aware welcomes)
            const hasInitialPrompt = !!newAgentData?.initial_prompt;
            const initialPromptPreview = newAgentData?.initial_prompt ? String(newAgentData.initial_prompt).substring(0, 150) + '...' : 'none';
            console.log('🎭 Agent continuation initial_prompt check:', {
              agent_name: newAgentData?.name,
              has_initial_prompt: hasInitialPrompt,
              initial_prompt_preview: initialPromptPreview
            });
            // NOTE: We DO NOT add system messages to continuationMessages anymore
            // Instead, we pass the system prompt separately via the sendMessage() systemPrompt parameter
            // This is the correct way per Claude API specifications
            // Get new agent context and tools
            const newAgentContext = await loadAgentContext(supabase, sessionId, newAgentData?.id);
            if (!newAgentContext) {
              throw new Error('Failed to load new agent context');
            }
            const newSystemPrompt = buildSystemPrompt({
              agent: newAgentContext,
              sessionId: sessionId
            });
            const newTools = getToolDefinitions(newAgentContext.role, newAgentContext.access);
            // 🎯 Use system prompt with agent's instructions (initial_prompt already in system)
            // 🔥 CRITICAL: Do NOT expose initial_prompt in messages - it contains internal instructions
            const enhancedSystemPrompt = `${newSystemPrompt}\n\n---\n\n🎯 AGENT ACTIVATION:\nYou are now the active agent for this conversation. The user has been handed off to you from another agent. 

CRITICAL: You must respond immediately with a welcome message to the user. The conversation above shows the context, but you should now introduce yourself as the new agent and offer assistance based on your role as ${newAgentData?.name}.

Follow your instructions to determine what actions to take (search memory, create RFP, etc.) and then generate your personalized welcome message.

Do NOT wait for a new user message - generate your introduction and welcome message right now based on the conversation context above.`;
            console.log('🤖 Triggering new agent response:', {
              agent_name: newAgentData?.name,
              agent_role: newAgentData?.role,
              tools_count: newTools.length,
              system_prompt_length: newSystemPrompt.length,
              enhanced_system_prompt_length: enhancedSystemPrompt.length,
              has_activation_instructions: hasInitialPrompt
            });
            // **STREAMING AGENT CONTINUATION** - Return streaming response with activation notice
            console.log('🌊 STREAMING: Continuing with new agent, using initial_prompt in enhanced system prompt');
            // Filter out system messages from continuation (passed separately)
            // The enhanced system prompt instructs Claude to generate a welcome message
            // without requiring a new user message
            const currentMessages = continuationMessages.filter((m)=>m.role !== 'system');
            console.log('📝 Continuation messages prepared:', {
              message_count: currentMessages.length,
              last_message_role: currentMessages[currentMessages.length - 1]?.role,
              last_message_preview: String(currentMessages[currentMessages.length - 1]?.content).substring(0, 100),
              will_use_enhanced_system_prompt: hasInitialPrompt
            });
            // Create streaming response with activation notice
            const stream = new ReadableStream({
              async start (controller) {
                try {
                  // 1. Send activation notice immediately
                  const activationNotice = {
                    type: 'agent_activation',
                    agent_name: newAgentData?.name,
                    agent_role: newAgentData?.role,
                    message: `Activating ${newAgentData?.name} agent...`,
                    timestamp: new Date().toISOString()
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(activationNotice)}\n\n`));
                  console.log('📣 Sent activation notice:', activationNotice.message);
                  // 2. Use streamWithRecursiveTools for streaming with recursive tool execution
                  console.log('🔄 Starting recursive tool execution with streaming...');
                  await streamWithRecursiveTools(currentMessages, newTools, enhancedSystemPrompt, claudeService, toolService, controller, supabase, actualSessionId, newAgentData?.id, userId // Pass userId for message saving
                  );
                  // 3. Send completion event
                  const completeEvent = {
                    type: 'complete',
                    timestamp: new Date().toISOString()
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
                  controller.close();
                  console.log('✅ Agent continuation streaming completed successfully');
                } catch (error) {
                  console.error('❌ Agent continuation streaming failed:', error);
                  const errorEvent = {
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
                  controller.close();
                }
              }
            });
            // Return streaming response immediately (bypassing normal response flow)
            return new Response(stream, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            });
          } catch (continuationError) {
            console.error('❌ Agent continuation streaming failed:', continuationError);
            // Return error response
            return new Response(JSON.stringify({
              error: 'Agent continuation failed',
              details: continuationError instanceof Error ? continuationError.message : 'Unknown error'
            }), {
              status: 500,
              headers: corsHeaders
            });
          }
        } catch (historyError) {
          console.error('❌ Failed to fetch conversation history for agent continuation:', historyError);
        // Continue with original response if history fetch fails
        }
      // � Handle multiple rounds of tool calls (up to MAX_TOOL_ROUNDS)
      }
    }
    // Prepare metadata in format expected by client
    const metadata = {
      model: 'claude-sonnet-4-5-20250929',
      response_time: 0,
      temperature: 0.3,
      tokens_used: claudeResponse.usage?.output_tokens || 0,
      functions_called: claudeResponse.toolCalls?.map((call)=>call.name) || [],
      function_results: toolResults,
      is_streaming: false,
      stream_complete: true,
      agent_switch_occurred: agentSwitchOccurred
    };
    // Add tool_use information for artifact reference generation
    if (claudeResponse.toolCalls && claudeResponse.toolCalls.length > 0) {
      // Use the first tool call for tool_use (client expects single tool_use object)
      const firstToolCall = claudeResponse.toolCalls[0];
      metadata.tool_use = {
        name: firstToolCall.name,
        input: firstToolCall.input
      };
    }
    // Create artifacts array from form creation results
    const artifacts = [];
    toolResults.forEach((result)=>{
      if (isToolExecutionResult(result) && result.function_name === 'create_form_artifact' && result.result?.success) {
        artifacts.push({
          name: result.result.artifact?.title || 'Form Artifact',
          type: 'form',
          id: result.result.artifact?.id,
          created: true
        });
      }
    });
    if (artifacts.length > 0) {
      metadata.artifacts = artifacts;
    }
    // 🚨 AUTOMATIC READINESS CHECK: After artifact creation, check if RFP Design agent package is complete
    let readinessCheckMessage = '';
    const RFP_DESIGN_AGENT_ID = '8c5f11cb-1395-4d67-821b-89dd58f0c8dc';
    // Only check readiness if current agent is RFP Design and an artifact was just created
    if (effectiveAgentId === RFP_DESIGN_AGENT_ID && artifacts.length > 0) {
      try {
        console.log('🔍 Checking RFP Design package readiness after artifact creation...');
        // Import list_artifacts function
        const { listArtifacts } = await import('../tools/database.ts');
        // Get all artifacts for this session
        const artifactList = await listArtifacts(supabase, {
          sessionId: actualSessionId,
          userId: String(metadata.userId || '')
        });
        console.log('📦 Artifacts in session:', JSON.stringify(artifactList, null, 2));
        // Check for required artifacts
        const hasBidForm = artifactList?.artifacts?.some((a)=>a.artifact_role === 'bid_form');
        const hasRequestEmail = artifactList?.artifacts?.some((a)=>a.artifact_role === 'rfp_request_email');
        console.log('✅ Readiness check:', {
          hasBidForm,
          hasRequestEmail
        });
        // If both required artifacts exist, inject readiness message
        if (hasBidForm && hasRequestEmail) {
          readinessCheckMessage = `\n\n🎉 **Your RFP package is complete!** You now have:\n✅ Supplier Bid Form\n✅ RFP Request Email\n\nReady to find qualified suppliers and send invitations?\n\n💡 **Suggested next step:** Switch to the **Sourcing agent** to identify and invite suppliers.\n\nType "complete" to proceed or ask me to make any changes.`;
          console.log('🎉 RFP Design package complete - readiness message injected');
        } else {
          console.log('⏳ RFP Design package incomplete - continuing...');
        }
      } catch (error) {
        console.error('❌ Error during automatic readiness check:', error);
      // Don't fail the entire request if readiness check fails
      }
    }
    // Prepare response with automatic readiness message if applicable
    const responseData = {
      success: true,
      content: claudeResponse.textResponse + readinessCheckMessage,
      metadata: metadata,
      toolCalls: claudeResponse.toolCalls,
      toolResults: toolResults,
      usage: claudeResponse.usage,
      sessionId: actualSessionId,
      agentId: effectiveAgentId
    };
    // Add session creation info if a new session was auto-created
    if (newSessionData) {
      responseData.sessionCreated = true;
      responseData.newSession = {
        id: newSessionData.session_id,
        message: newSessionData.message
      };
    }
    // Handle client callback if provided
    if (clientCallback) {
      console.log('Executing client callback:', clientCallback);
      try {
        // Add callback execution results to response
        responseData.clientCallback = {
          executed: true,
          type: clientCallback.type,
          data: clientCallback.data
        };
      } catch (callbackError) {
        console.error('Client callback execution failed:', callbackError);
        responseData.clientCallback = {
          executed: false,
          error: callbackError instanceof Error ? callbackError.message : 'Unknown error'
        };
      }
    }
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in handlePostRequest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: corsHeaders
    });
  }
}
// Handle streaming request (for future implementation)
export async function handleStreamingRequest(request) {
  try {
    // Validate authentication
    const _token = validateAuthHeader(request);
    const supabase = await getAuthenticatedSupabaseClient(request);
    const userId = await getUserId(supabase, request);
    // Parse request body
    const body = await request.json();
    const { messages, sessionId, agentId } = body;
    // Load agent context and build system prompt
    const agentContext = await loadAgentContext(supabase, sessionId, agentId);
    const systemPrompt = buildSystemPrompt({
      agent: agentContext || undefined,
      sessionId: sessionId
    });
    console.log('🎯 STREAMING REQUEST: System prompt built:', systemPrompt ? 'Yes' : 'No');
    // Create readable stream
    const stream = new ReadableStream({
      async start (controller) {
        try {
          const claudeService = createClaudeService();
          const _toolService = new ToolExecutionService(supabase, userId, undefined);
          // 🔍 DEBUG: Log agent role and access for this streaming handler too
          console.log('🔧 DEBUG: STREAMING REQUEST - AgentContext role:', agentContext?.role, 'access:', agentContext?.access);
          const tools = getToolDefinitions(agentContext?.role, agentContext?.access);
          // Stream response from Claude
          await claudeService.streamMessage(messages, tools, (chunk)=>{
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }, systemPrompt);
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          const errorData = `data: ${JSON.stringify({
            error: errorMessage
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in handleStreamingRequest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

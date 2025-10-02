// Copyright Mark Skiba, 2025 All rights reserved

import { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import { SessionActiveAgent, UserProfile } from '../types/database';
import { ToolInvocationEvent } from '../types/streamingProtocol';
import DatabaseService from '../services/database';
import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import { SmartAutoPromptManager } from '../utils/smartAutoPromptManager';
import { categorizeError } from '../components/APIErrorHandler';

// Client update interfaces for edge function communication
interface ClientAction {
  action: 'UPDATE_CURRENT_RFP' | 'SHOW_SUCCESS_MESSAGE' | 'REFRESH_UI_STATE';
  data: Record<string, unknown>;
  delay?: number; // Optional delay in milliseconds for spacing UI updates
}

interface ClientUpdates {
  type: string;
  immediate_actions: ClientAction[];
}

interface EnhancedFunctionResult {
  success?: boolean;
  current_rfp_id?: string | number;
  rfp?: Record<string, unknown>;
  client_updates?: ClientUpdates;
  [key: string]: unknown;
}

export const useMessageHandling = () => {
  console.log('🚨🚨🚨 MESSAGE HANDLING HOOK LOADED 🚨🚨🚨');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false); // Add processing guard
  
  // Tool invocations state for real-time tool execution tracking with session persistence
  const [toolInvocations, setToolInvocations] = useState<ToolInvocationEvent[]>([]);
  
  // Helper function to get session-specific storage key
  const getToolInvocationsStorageKey = (sessionId?: string) => {
    return sessionId ? `rfpez-tool-invocations-${sessionId}` : 'rfpez-tool-invocations-default';
  };
  
  // Track current session ID for tool invocations persistence
  const currentSessionIdForTools = useRef<string | undefined>(undefined);
  
  // Load tool invocations for a specific session
  const loadToolInvocationsForSession = useCallback((sessionId?: string) => {
    try {
      const storageKey = getToolInvocationsStorageKey(sessionId);
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out invocations older than 1 hour to prevent stale data
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const filtered = parsed.filter((inv: ToolInvocationEvent) => inv.timestamp > oneHourAgo);
        setToolInvocations(filtered);
        
        // Update current session tracking
        currentSessionIdForTools.current = sessionId;
        console.log('📋 Loaded tool invocations for session:', sessionId, 'count:', filtered.length);
        return;
      }
      setToolInvocations([]);
      currentSessionIdForTools.current = sessionId;
      console.log('📋 No stored tool invocations for session:', sessionId);
    } catch (error) {
      console.warn('Failed to load tool invocations from session storage:', error);
      setToolInvocations([]);
    }
  }, []);

  // Persist tool invocations to session-specific sessionStorage whenever they change
  useEffect(() => {
    // Only persist if we have a session to associate with
    if (currentSessionIdForTools.current !== undefined) {
      try {
        const storageKey = getToolInvocationsStorageKey(currentSessionIdForTools.current);
        sessionStorage.setItem(storageKey, JSON.stringify(toolInvocations));
        console.log('📋 Persisted tool invocations for session:', currentSessionIdForTools.current, 'count:', toolInvocations.length);
      } catch (error) {
        console.warn('Failed to save tool invocations to session storage:', error);
      }
    }
  }, [toolInvocations]);

  // Clear tool invocations manually (for session changes, etc.)
  const clearToolInvocations = useCallback((sessionId?: string) => {
    setToolInvocations([]);
    try {
      // Clear the specific session's tool invocations from storage
      const storageKey = getToolInvocationsStorageKey(sessionId || currentSessionIdForTools.current);
      sessionStorage.removeItem(storageKey);
      console.log('📋 Cleared tool invocations for session:', sessionId || currentSessionIdForTools.current);
      
      // Reset current session tracking if clearing current session
      if (!sessionId || sessionId === currentSessionIdForTools.current) {
        currentSessionIdForTools.current = undefined;
      }
    } catch (error) {
      console.warn('Failed to clear tool invocations from session storage:', error);
    }
  }, []);
  
  // Cleanup effect to abort any ongoing requests when component unmountss
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.error('🚨 ABORT REASON: Component unmounted', {
          stackTrace: new Error().stack
        });
        abortControllerRef.current.abort('Component unmounted');
        abortControllerRef.current = null;
      }
      isProcessingRef.current = false; // Reset processing state on cleanup
    };
  }, []);
  
  // Helper function to generate artifact references from Claude metadata
  const generateArtifactReferences = (metadata: Record<string, unknown>): ArtifactReference[] => {
    const refs: ArtifactReference[] = [];
    
    // DEBUG: Log all metadata to understand the structure
    console.log('🐛 DEBUG: generateArtifactReferences called with metadata:', JSON.stringify(metadata, null, 2));
    
    // Handle function results that contain forms/templates
    if (metadata.function_results && Array.isArray(metadata.function_results)) {
      console.log('� DEBUG: function_results found, length:', metadata.function_results.length);
            metadata.function_results.forEach((funcResult: Record<string, unknown>) => {
        console.log('🔍 DEBUG: Processing function result:', funcResult);
        if (typeof funcResult === 'object' && funcResult !== null) {
          const funcObj = funcResult as Record<string, unknown>;
          const result = funcObj.result as Record<string, unknown>;
          
          console.log('🔍 DEBUG: Function object:', {
            functionName: funcObj.function,
            hasResult: !!result,
            resultSuccess: result?.success
          });
          
          // Handle different types of function results
          if (result && result.success) {
            if (funcObj.function === 'create_form_artifact' && (result.artifact_id || result.template_schema)) {
              // Form artifacts - use artifact_name from result
              const functionArgs = funcObj.arguments as Record<string, unknown>;
              const artifactName = (result.artifact_name as string) || (functionArgs?.name as string) || (result.template_name as string) || (result.title as string) || 'Generated Template';
              
              refs.push({
                artifactId: result.artifact_id as string || `template-${Date.now()}`,
                artifactName: artifactName,
                artifactType: 'form',
                isCreated: true,
                displayText: artifactName
              });
            } else if ((funcObj.function === 'create_text_artifact' || funcObj.function === 'generate_proposal_artifact') && result.artifact_id) {
              // Document artifacts
              refs.push({
                artifactId: result.artifact_id as string,
                artifactName: result.title as string || 'Generated Document',
                artifactType: 'document',
                isCreated: true,
                displayText: result.title as string
              });
            } else if (funcObj.function === 'create_and_set_rfp') {
              // RFP creation - trigger UI refresh
              console.log('🎯 create_and_set_rfp detected - checking result format:', {
                hasCurrentRfpId: !!result.current_rfp_id,
                resultKeys: Object.keys(result),
                fullResult: result,
                resultType: typeof result
              });
              
              if (result.current_rfp_id) {
                const enhancedResult = result as EnhancedFunctionResult;
                const rfpData = enhancedResult.rfp as Record<string, unknown>;
                console.log('🐛 DEBUG: create_and_set_rfp detected in function_results - triggering context refresh', {
                  rfpId: enhancedResult.current_rfp_id,
                  rfpName: rfpData?.name,
                  fullResult: enhancedResult
                });
                
                // ENHANCED: Process client_updates if present
                if (enhancedResult.client_updates && enhancedResult.client_updates.immediate_actions) {
                  console.log('🎯 DEBUG: Processing client_updates from edge function', {
                    updateType: enhancedResult.client_updates.type,
                    actionCount: enhancedResult.client_updates.immediate_actions.length
                  });
                  
                  // Process each immediate action
                  enhancedResult.client_updates.immediate_actions.forEach((action: ClientAction, index: number) => {
                    console.log(`🔄 DEBUG: Processing client action ${index + 1}:`, action);
                    
                    setTimeout(() => {
                      switch (action.action) {
                        case 'UPDATE_CURRENT_RFP':
                          window.postMessage({ 
                            type: 'UPDATE_CURRENT_RFP_DIRECT', 
                            rfp_data: action.data,
                            source: 'edge_function_direct_update'
                          }, '*');
                          break;
                        case 'SHOW_SUCCESS_MESSAGE':
                          window.postMessage({ 
                            type: 'SHOW_SUCCESS_MESSAGE', 
                            message: action.data.message,
                            duration: action.data.duration
                          }, '*');
                          break;
                        case 'REFRESH_UI_STATE':
                          window.postMessage({ 
                            type: 'REFRESH_UI_STATE', 
                            component: action.data.component,
                            force_refresh: action.data.force_refresh
                          }, '*');
                          break;
                        default:
                          console.log('🔄 Unknown client action:', action.action);
                      }
                    }, action.delay || 100);
                  });
                }
                
                // ENHANCED: Send context refresh message
                if (enhancedResult.current_rfp_id) {
                  console.log('🔄 DEBUG: Sending context refresh message for RFP:', enhancedResult.current_rfp_id);
                  
                  window.postMessage({ 
                    type: 'RFP_CREATED_SUCCESS',
                    rfp_id: enhancedResult.current_rfp_id,
                    rfp_name: rfpData?.name,
                    message: `New RFP created: ${rfpData?.name || 'Unknown'}`
                  }, '*');
                  
                  // Also trigger context refresh in useSessionState
                  window.postMessage({ 
                    type: 'REFRESH_SESSION_CONTEXT',
                    trigger: 'rfp_creation_success',
                    data: {
                      current_rfp_id: enhancedResult.current_rfp_id,
                      rfp_name: rfpData?.name
                    }
                  }, '*');
                }
              } else {
                console.error('❌ create_and_set_rfp result missing current_rfp_id field!', result);
              }
            }
          }
        }
      });
    } else {
      console.log('🐛 DEBUG: function_results array is empty or missing');
    }
    
    // NEW: Also check tool_use for create_and_set_rfp calls (handles case where function_results is empty)
    if (metadata.tool_use && typeof metadata.tool_use === 'object') {
      const toolUse = metadata.tool_use as Record<string, unknown>;
      console.log('🐛 DEBUG: tool_use found:', {
        name: toolUse.name,
        hasInput: !!toolUse.input
      });
      
      if (toolUse.name === 'create_and_set_rfp' && toolUse.input) {
        const input = toolUse.input as Record<string, unknown>;
        console.log('🐛 DEBUG: create_and_set_rfp detected in tool_use - triggering context refresh', {
          toolInput: input,
          rfpName: input.name
        });
        
        // Trigger RFP context refresh even without waiting for function results
        // This handles cases where the function was called but results aren't populated yet
        setTimeout(async () => {
          // Try to find the newly created RFP by name after giving it time to be created
          const rfpName = input.name;
          // RFP ID lookup would go here if needed
          
          if (rfpName) {
            try {
              console.log('🐛 DEBUG: Attempting to find newly created RFP by name:', rfpName);
              // Use DatabaseService to search for RFP by name (we'll need to add this method)
              // For now, post the message without rfp_id and let the session context handle it
              console.log('🐛 DEBUG: RFP name available for lookup:', rfpName);
            } catch (error) {
              console.log('🐛 DEBUG: Could not find RFP by name yet:', error);
            }
          }
          
          window.postMessage({ 
            type: 'REFRESH_CURRENT_RFP', 
            message: `RFP creation initiated: ${rfpName || 'Unknown'}`,
            rfp_name: rfpName // Include RFP name for potential lookup
          }, '*');
          console.log('🐛 DEBUG: Posting REFRESH_CURRENT_RFP message from tool_use with RFP name:', rfpName);
        }, 1000); // Longer delay to allow function to complete and commit to database
      }
    } else {
      console.log('🐛 DEBUG: tool_use not found or invalid');
    }
    
    // Handle buyer questionnaire form (legacy support)
    if (metadata.buyer_questionnaire) {
      refs.push({
        artifactId: `buyer-form-${Date.now()}`,
        artifactName: 'Buyer Questionnaire',
        artifactType: 'form',
        isCreated: true
      });
    }

    // Handle any other artifacts from Claude response (legacy support)
    if (metadata.artifacts && Array.isArray(metadata.artifacts)) {
      (metadata.artifacts as Array<Record<string, unknown>>).forEach((artifact, index) => {
        refs.push({
          artifactId: `claude-artifact-${Date.now()}-${index}`,
          artifactName: artifact.name as string || `Generated Artifact ${index + 1}`,
          artifactType: artifact.type as 'document' | 'text' | 'image' | 'pdf' | 'form' | 'other' || 'document',
          isCreated: true
        });
      });
    }
    
    return refs;
  };
  
  const handleSendMessage = async (
    content: string,
    messages: Message[],
    setMessages: (updater: (prev: Message[]) => Message[]) => void,
    setIsLoading: (loading: boolean) => void,
    currentSessionId: string | undefined,
    setCurrentSessionId: (id: string) => void,
    setSelectedSessionId: (id: string) => void,
    createNewSession: (agent: SessionActiveAgent | null, currentRfpId?: number) => Promise<string | null>,
    loadUserSessions: () => Promise<void>,
    isAuthenticated: boolean,
    userId: string | undefined,
    currentAgent: SessionActiveAgent | null,
    userProfile: UserProfile | null,
    currentRfp: RFP | null,
    addClaudeArtifacts: (metadata: Record<string, unknown>, messageId?: string) => void,
    loadSessionAgent: (sessionId: string) => Promise<void>,
    handleAgentChanged: (agent: SessionActiveAgent) => Message | null,
    currentArtifact?: {
      id: string;
      name: string;
      type: string;
      content?: string;
    } | null
  ) => {
    // GUARD: Prevent overlapping calls
    if (isProcessingRef.current) {
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    // Load tool invocations for current session if session changed  
    if (currentSessionId && currentSessionIdForTools.current !== currentSessionId) {
      console.log('📋 Session changed from', currentSessionIdForTools.current, 'to', currentSessionId, '- loading tool invocations');
      loadToolInvocationsForSession(currentSessionId);
    }
    
    // Check if there's already an active request and abort it safely
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      console.error('🚨 ABORTING PREVIOUS REQUEST due to new request starting', {
        stackTrace: new Error().stack
      });
      abortControllerRef.current.abort('New request started');
    }
    
    // Create new abort controller for this request
    const timestamp = Date.now();
    abortControllerRef.current = new AbortController();
    
    // Store a reference to this specific controller to prevent race conditions
    const thisRequestController = abortControllerRef.current;
    const requestId = `req_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add abort signal monitoring with detailed logging
    const currentSignal = thisRequestController.signal;
    
    // Enhanced abort handler with stack trace
    let abortDetected = false;
    const abortHandler = () => {
      if (abortDetected) return;
      abortDetected = true;
      
      console.error('🚨🚨🚨 ABORT SIGNAL TRIGGERED:', {
        requestId: requestId,
        reason: currentSignal.reason,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack
      });
    };
    
    currentSignal.addEventListener('abort', abortHandler);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Verify our controller is still valid before starting the request
    if (!thisRequestController || thisRequestController.signal.aborted) {
      console.log('🚨 AbortController invalid or already aborted before request start');
      return;
    }
    
    setIsLoading(true);

    let activeSessionId = currentSessionId;

    try {
      // For authenticated users, save to Supabase
      if (isAuthenticated && userId) {
        console.log('Authenticated user sending message, currentSessionId:', activeSessionId);
        
        // Create session if none exists
        if (!activeSessionId) {
          console.log('No current session, creating new one with RFP context:', currentRfp?.id);
          const newSessionId = await createNewSession(currentAgent, currentRfp?.id);
          if (newSessionId) {
            activeSessionId = newSessionId; // Use immediately for this request
            setCurrentSessionId(newSessionId);
            setSelectedSessionId(newSessionId);
            console.log('New session created with ID:', newSessionId, 'and RFP:', currentRfp?.id);
            
            // Update user profile with current session ID for database persistence
            try {
              await DatabaseService.setUserCurrentSession(newSessionId);
              console.log('✅ Current session saved to user profile:', newSessionId);
            } catch (error) {
              console.warn('⚠️ Failed to save current session to user profile:', error);
            }
            
            // Update tool invocation session tracking to use the new session
            loadToolInvocationsForSession(newSessionId);
          } else {
            console.error('❌ Failed to create new session - proceeding with null sessionId');
          }
        }

        // Save user message to database
        if (activeSessionId && userId) {
          console.log('Saving user message to session:', activeSessionId);
          const savedMessage = await DatabaseService.addMessage(
            activeSessionId, 
            userId, 
            content, 
            'user',
            currentAgent?.agent_id,
            currentAgent?.agent_name
          );
          console.log('User message saved:', savedMessage);
          
          // Check if this is the first message in the session and update title
          const sessionMessages = await DatabaseService.getSessionMessages(activeSessionId);
          if (sessionMessages.length === 1) {
            const sessionTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
            await DatabaseService.updateSession(activeSessionId, { title: sessionTitle });
            console.log('Updated session title to:', sessionTitle);
            await loadUserSessions();
          }
        } else {
          console.log('No session ID or user ID available, message not saved');
        }
      } else {
        console.log('User not authenticated, messages not saved to Supabase');
      }

      // Generate AI response using Claude API
      try {
        console.log('Generating AI response with Claude API...');
        
        // Get conversation history for context
        const conversationHistory = messages
          .filter(msg => msg.id !== 'initial-prompt')
          .filter(msg => msg.content && msg.content.trim() !== '') // Filter out empty messages
          .map(msg => ({
            role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.content.trim()
          }))
          .slice(-10);
        
        // Use current agent or get default agent if none selected
        let agentForResponse = currentAgent;
        if (!agentForResponse) {
          const defaultAgent = await AgentService.getDefaultAgent();
          if (defaultAgent) {
            agentForResponse = {
              agent_id: defaultAgent.id,
              agent_name: defaultAgent.name,
              agent_initial_prompt: defaultAgent.initial_prompt,
              agent_instructions: defaultAgent.instructions
            };
          }
        }

        if (!agentForResponse) {
          throw new Error('No agent available for response generation');
        }

        // Convert SessionActiveAgent to Agent type for Claude service
        const agentForClaude = {
          id: agentForResponse.agent_id,
          name: agentForResponse.agent_name,
          instructions: agentForResponse.agent_instructions,
          initial_prompt: agentForResponse.agent_initial_prompt,
          description: '',
          avatar_url: '',
          is_active: true,
          is_default: false,
          is_restricted: false,
          is_free: false,
          sort_order: 0,
          created_at: '',
          updated_at: '',
          metadata: {}
        };

        // Clear any previous tool invocations when starting a new AI response
        setToolInvocations([]);
        
        // Create a temporary AI message for streaming updates
        let aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          content: '',
          isUser: false,
          timestamp: new Date(),
          agentName: agentForResponse.agent_name
        };
        
        // Add the empty AI message to the UI immediately
        setMessages(prev => [...prev, aiMessage]);

        // Create streaming callback with proper UTF-8 handling and buffering
        let streamingBuffer = '';
        let lastUpdateTime = 0;
        const updateInterval = 50; // Update UI every 50ms to reduce re-render frequency
        let streamingCompleted = false;
        
        let toolProcessingMessageId: string | null = null;
        let isWaitingForToolCompletion = false;
        let uiTimeoutId: NodeJS.Timeout | null = null;
        
        const onStreamingChunk = (chunk: string, isComplete: boolean, toolProcessing?: boolean, toolEvent?: ToolInvocationEvent, forceToolCompletion?: boolean) => {
          console.log('🚨 STREAMING CHUNK HANDLER CALLED - This should appear if streaming works!');
          
          console.log('📡 STREAMING CHUNK RECEIVED:', {
            chunkLength: chunk.length,
            chunkPreview: chunk.length > 0 ? chunk.substring(0, 50) + '...' : '[empty]',
            isComplete,
            toolProcessing,
            toolEvent: toolEvent ? { type: toolEvent.type, toolName: toolEvent.toolName } : undefined,
            forceToolCompletion,
            streamingCompleted,
            isWaitingForToolCompletion,
            currentMessageId: aiMessageId,
            toolProcessingMessageId,
            bufferLength: streamingBuffer.length,
            timestamp: new Date().toISOString()
          });
          
          // Handle tool invocation events
          if (toolEvent) {
            console.log('🔧 Tool invocation event received:', toolEvent);
            
            setToolInvocations(prev => {
              const existing = prev.find(t => t.toolName === toolEvent.toolName && t.type === 'tool_start');
              
              if (toolEvent.type === 'tool_start') {
                // Add new tool start event
                return [...prev, toolEvent];
              } else if (toolEvent.type === 'tool_complete' && existing) {
                // Update existing tool to completed status
                return prev.map(t => 
                  t.toolName === toolEvent.toolName && t.type === 'tool_start'
                    ? { ...toolEvent } // Replace with completion event
                    : t
                );
              } else if (toolEvent.type === 'tool_complete') {
                // Add completion event if no start event found
                return [...prev, toolEvent];
              }
              
              return prev;
            });
          }
          
          // Handle forced tool completion (e.g., from timeout)
          if (forceToolCompletion && isWaitingForToolCompletion && toolProcessingMessageId) {
            console.log('🔧 FORCED TOOL COMPLETION - cleaning up processing message:', toolProcessingMessageId);
            
            // Remove tool processing message
            setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
            
            // Clear any active UI timeout since we're handling forced completion
            if (uiTimeoutId) {
              clearTimeout(uiTimeoutId);
              uiTimeoutId = null;
              console.log('⏰ UI timeout cleared - forced completion active');
            }
            
            // Create new error/timeout message
            const errorMessageId = uuidv4();
            const errorMessage: Message = {
              id: errorMessageId,
              content: chunk,
              isUser: false,
              timestamp: new Date(),
              agentName: agentForResponse?.agent_name || 'AI Assistant'
            };
            
            setMessages(prev => [...prev, errorMessage]);
            
            // Reset state
            toolProcessingMessageId = null;
            isWaitingForToolCompletion = false;
            streamingCompleted = true;
            streamingBuffer = '';
            
            console.log('🔧 Tool processing state reset due to forced completion');
            return;
          }
          
          // Prevent processing after completion (unless we're handling tool processing)
          if (streamingCompleted && !toolProcessing && !isWaitingForToolCompletion) {
            console.log('⚠️ Ignoring chunk - streaming completed');
            return;
          }
          
          if (isComplete) {
            if (toolProcessing) {
              console.log('🔧 Message segment complete - tools processing for message:', aiMessageId, {
                streamingBuffer: streamingBuffer.length,
                currentMessageId: aiMessageId
              });
              
              // Final update with any remaining buffer before tool processing
              if (streamingBuffer.length > 0) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + streamingBuffer }
                      : msg
                  )
                );
                streamingBuffer = '';
              }
              
              // Create a tool processing indicator message
              const toolProcessingMessage: Message = {
                id: uuidv4(),
                content: '🔧 Processing tools...',
                isUser: false,
                timestamp: new Date(),
                agentName: agentForResponse?.agent_name || 'AI Assistant',
                isToolProcessing: true
              };
              
              toolProcessingMessageId = toolProcessingMessage.id;
              console.log('🔧 Created tool processing message:', toolProcessingMessageId);
              
              // Add tool processing message
              setMessages(prev => [...prev, toolProcessingMessage]);
              
              // Set up for continuation after tools
              isWaitingForToolCompletion = true;
              streamingCompleted = false;
              console.log('🔧 Set isWaitingForToolCompletion = true');
              
              // UI-LEVEL TIMEOUT: Force cleanup after 30 seconds regardless of API state
              uiTimeoutId = setTimeout(() => {
                console.log('⏰ UI TIMEOUT TRIGGERED - forcing tool processing cleanup after 30 seconds');
                console.log('🔧 Timeout cleanup for processing message:', toolProcessingMessageId);
                
                if (toolProcessingMessageId && isWaitingForToolCompletion) {
                  // Remove tool processing message
                  setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
                  
                  // Create timeout error message
                  const timeoutMessageId = uuidv4();
                  const timeoutMessage: Message = {
                    id: timeoutMessageId,
                    content: 'Tool processing exceeded time limit. Please try again.',
                    isUser: false,
                    timestamp: new Date(),
                    agentName: agentForResponse?.agent_name || 'AI Assistant'
                  };
                  
                  setMessages(prev => [...prev, timeoutMessage]);
                  
                  // Reset state
                  toolProcessingMessageId = null;
                  isWaitingForToolCompletion = false;
                  streamingCompleted = true;
                  streamingBuffer = '';
                  
                  console.log('⏰ UI timeout cleanup completed');
                }
              }, 180000); // 3 minute timeout - debugging slow database operations
              
            } else {
              // Only mark streaming complete if we're not waiting for tool completion
              // When tools are executed, Claude sends a continuation response, so we must not mark complete yet
              if (!isWaitingForToolCompletion) {
                streamingCompleted = true;
                console.log('✅ Streaming phase complete for message:', aiMessageId);
              } else {
                console.log('🔧 Streaming segment complete, but waiting for tool completion continuation');
              }
              
              // CRITICAL FIX: Always clear timeout and tool processing state on completion
              // This handles the case where tools were executed but completion event doesn't indicate toolProcessing
              if (isWaitingForToolCompletion) {
                console.log('🔧 Tool completion detected - cleaning up tool processing state');
                
                // Remove tool processing message if it exists
                if (toolProcessingMessageId) {
                  setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
                  toolProcessingMessageId = null;
                }
                
                // Clear the UI timeout since tool processing completed successfully
                if (uiTimeoutId) {
                  clearTimeout(uiTimeoutId);
                  uiTimeoutId = null;
                  console.log('⏰ UI timeout cleared - tool processing completed successfully');
                }
                
                // Reset tool processing state
                isWaitingForToolCompletion = false;
              }
              
              // Final update with any remaining buffer
              if (streamingBuffer.length > 0) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + streamingBuffer }
                      : msg
                  )
                );
                streamingBuffer = '';
              }
              
              isWaitingForToolCompletion = false;
            }
            
            // CRITICAL: DO NOT clean up AbortController here - function calls may still be running
            // The cleanup will happen after ClaudeService.generateResponse() fully completes
            return;
          }
          
          // If we get new content after tool processing started, create a new message
          if (isWaitingForToolCompletion && chunk.trim()) {
            console.log('📝 Creating new message for content after tool processing:', {
              chunk: chunk.substring(0, 50) + '...',
              chunkLength: chunk.length,
              isWaitingForToolCompletion,
              toolProcessingMessageId,
              currentAiMessageId: aiMessageId
            });
            
            // Remove tool processing message
            if (toolProcessingMessageId) {
              console.log('🗑️ Removing tool processing message:', toolProcessingMessageId);
              setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
              toolProcessingMessageId = null;
            }
            
            // Clear the UI timeout since we're transitioning to a new message
            if (uiTimeoutId) {
              clearTimeout(uiTimeoutId);
              uiTimeoutId = null;
              console.log('⏰ UI timeout cleared - transitioning to continuation message');
            }
            
            // Create new message for continuation
            const continuationMessageId = uuidv4();
            const continuationMessage: Message = {
              id: continuationMessageId,
              content: chunk,
              isUser: false,
              timestamp: new Date(),
              agentName: agentForResponse?.agent_name || 'AI Assistant'
            };
            
            console.log('✨ Created continuation message:', {
              id: continuationMessageId,
              contentLength: chunk.length,
              contentPreview: chunk.substring(0, 100) + '...',
              agentName: continuationMessage.agentName
            });
            
            setMessages(prev => {
              const newMessages = [...prev, continuationMessage];
              console.log('📋 Updated messages array - new length:', newMessages.length);
              return newMessages;
            });
            
            // Switch to new message for further streaming
            aiMessageId = continuationMessageId;
            isWaitingForToolCompletion = false;
            streamingBuffer = '';
            lastUpdateTime = Date.now();
            
            console.log('🔄 Switched to continuation message ID:', aiMessageId);
            return;
          }
          
          // Handle partial UTF-8 chunks properly - accumulate in buffer
          streamingBuffer += chunk;
          const now = Date.now();
          
          // Update UI periodically or when buffer gets large
          if (now - lastUpdateTime >= updateInterval || streamingBuffer.length > 150) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: msg.content + streamingBuffer }
                  : msg
              )
            );
            streamingBuffer = '';
            lastUpdateTime = now;
          }
        };

        console.log('🚀 About to call Claude API...');
        console.log('� Request ID:', requestId);
        console.log('⏰ Time since controller creation:', Date.now() - timestamp + 'ms');
        console.log('�🔍 AbortController status:', {
          exists: !!thisRequestController,
          signalAborted: thisRequestController.signal.aborted,
          signalReason: thisRequestController.signal.reason,
          refMatches: abortControllerRef.current === thisRequestController,
          requestId: requestId
        });
        
        // Pre-flight abort check
        if (thisRequestController.signal.aborted) {
          console.error('🚨 ABORT BEFORE CLAUDE CALL! Request already aborted before API call');
          console.log('📋 Failed request ID:', requestId);
          throw new Error('Request was aborted before Claude API call');
        }

        // DISABLED: Debug logging causes memory pressure
        // console.error('🔥 ABOUT TO CALL CLAUDE API - This should appear!');

        // Always enable streaming - let Claude handle all queries naturally
        const shouldUseStreaming = true;
        
        console.log('🔧 STREAMING ENABLED:', {
          content: content.substring(0, 50) + '...',
          streaming: shouldUseStreaming
        });
        
        console.log('🚨 CRITICAL DEBUG: About to call ClaudeService.generateResponse');
        console.log('🚨 onStreamingChunk callback provided:', typeof onStreamingChunk);

        const claudeResponse = await ClaudeService.generateResponse(
          content,
          agentForClaude,
          conversationHistory,
          activeSessionId,
          userProfile ? {
            id: userProfile.id,
            email: userProfile.email,
            full_name: userProfile.full_name,
            role: userProfile.role
          } : undefined,
          currentRfp ? {
            id: currentRfp.id,
            name: currentRfp.name,
            description: currentRfp.description,
            specification: currentRfp.specification
          } : null,
          currentArtifact || null,
          undefined, // DISABLE ABORT SIGNAL - bypass AbortController issues
          shouldUseStreaming, // Use streaming based on query type
          shouldUseStreaming ? onStreamingChunk : undefined // Only provide callback if streaming
        );
        
        console.log('=== CLAUDE RESPONSE DEBUG ===');
        console.log('1. Raw response content:', claudeResponse.content.substring(0, 200) + '...');
        console.log('2. Response has metadata:', !!claudeResponse.metadata);
        console.log('3. Was streaming:', claudeResponse.metadata.is_streaming);
        console.log('4. Stream complete:', claudeResponse.metadata.stream_complete);
        console.log('5. Functions executed:', claudeResponse.metadata.functions_called);
        
        // 🚨 BROWSER vs API COMPARISON DEBUG
        console.log('🔍🔍🔍 BROWSER INTERFACE FUNCTION CALLS 🔍🔍🔍');
        console.log('Functions called by Claude:', JSON.stringify(claudeResponse.metadata.functions_called));
        console.log('Agent name:', agentForResponse?.agent_name);
        console.log('User message:', content.substring(0, 100) + '...');
        console.log('🔍🔍🔍 END BROWSER INTERFACE DEBUG 🔍🔍🔍');
        
        console.log('✅ COMPLETE CLAUDE RESPONSE FINISHED (including all function calls and streaming)');
        
        // CRITICAL FIX: Get the current message content that was built up during streaming
        // to avoid overriding streamed content with final response
        let finalContent = claudeResponse.content || '';
        
        // Generate artifact references for the AI message (outside callback for database save)
        const artifactRefs = generateArtifactReferences(claudeResponse.metadata);
        
        // Update the message in state with final content and artifact references, preserving streamed content
        setMessages(prev => {
          const currentMessage = prev.find(msg => msg.id === aiMessageId);
          const currentContent = currentMessage?.content || '';
          
          // If streaming was used, use the streamed content; otherwise use Claude's final response
          const wasStreaming = claudeResponse.metadata?.is_streaming;
          if (wasStreaming && currentContent) {
            // Use the streamed content that was built up during streaming
            finalContent = currentContent;
          } else {
            // Use Claude's final response (non-streaming case)
            finalContent = claudeResponse.content || '';
          }
          
          console.log('🔧 FINAL CONTENT ASSEMBLY:');
          console.log('- Was streaming:', wasStreaming);
          console.log('- Current streamed content length:', currentContent.length);
          console.log('- Claude response content length:', (claudeResponse.content || '').length);
          console.log('- Final content length:', finalContent.length);
          console.log('- Final content preview:', finalContent.substring(0, 100) + '...');
          
          // Create the final message with preserved streaming content
          const finalAiMessage: Message = {
            id: aiMessageId,
            content: finalContent,
            isUser: false,
            timestamp: new Date(),
            agentName: agentForResponse?.agent_name || 'AI Assistant'
          };
          
          // Add artifact references if any
          if (artifactRefs.length > 0) {
            finalAiMessage.artifactRefs = artifactRefs;
          }
          
          return prev.map(msg => 
            msg.id === aiMessageId 
              ? finalAiMessage
              : msg
          );
        });

        // Process Claude response metadata for artifacts with message ID
        console.log('🔍 useMessageHandling: About to call addClaudeArtifacts with metadata:', claudeResponse.metadata);
        addClaudeArtifacts(claudeResponse.metadata, aiMessageId);

        setIsLoading(false);
        
        // Clean up abort controller ONLY after complete response (streaming + function calls)
        console.log('🧹 Cleaning up AbortController after complete Claude response processing');
        if (abortControllerRef.current === thisRequestController) {
          console.log('✅ AbortController cleanup after successful completion');
          abortControllerRef.current = null;
        }
        
        // Reset processing flag after successful completion
        isProcessingRef.current = false;

        // Check if an agent switch occurred during the Claude response
        if (claudeResponse.metadata.agent_switch_occurred) {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          if (activeSessionId) {
            try {
              console.log('🔄 Agent switch detected, fetching new agent...');
              const newAgent = await AgentService.getSessionActiveAgent(activeSessionId);
              
              if (newAgent) {
                console.log('✅ UI refresh after agent switch - loaded agent:', newAgent.agent_name);
                
                // Check if this is a contextual switch (agent responds immediately) 
                // vs a manual switch (agent should introduce itself)
                const isContextualSwitch = claudeResponse.content && claudeResponse.content.trim().length > 0;
                
                // Always call handleAgentChanged to update agent state
                const agentMessage = handleAgentChanged(newAgent);
                
                // Only add the welcome message if it's NOT a contextual switch
                if (!isContextualSwitch && agentMessage) {
                  console.log('🔄 Manual agent switch - adding welcome message');
                  setMessages(prev => [...prev, agentMessage]);
                } else {
                  console.log('🔄 Contextual agent switch - agent state updated, no welcome message needed');
                }
              } else {
                console.warn('⚠️ No agent found after switch, retrying with delay...');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const retryAgent = await AgentService.getSessionActiveAgent(activeSessionId);
                if (retryAgent) {
                  console.log('✅ Retry successful - loaded agent:', retryAgent.agent_name);
                  const agentMessage = handleAgentChanged(retryAgent);
                  if (agentMessage) {
                    setMessages(prev => [...prev, agentMessage]);
                  }
                } else {
                  // Fallback: Use agent info from Claude response if available
                  console.warn('⚠️ Retry failed, attempting fallback...');
                  const switchResult = claudeResponse.metadata.agent_switch_result;
                  if (switchResult?.new_agent) {
                    console.log('📋 Using agent info from Claude response as fallback');
                    const fallbackAgent = {
                      agent_id: switchResult.new_agent.id,
                      agent_name: switchResult.new_agent.name,
                      agent_instructions: switchResult.new_agent.instructions,
                      agent_initial_prompt: switchResult.new_agent.initial_prompt,
                      agent_avatar_url: undefined
                    };
                    const agentMessage = handleAgentChanged(fallbackAgent);
                    if (agentMessage) {
                      setMessages(prev => [...prev, agentMessage]);
                    }
                  } else {
                    console.error('❌ No fallback agent data available');
                  }
                }
              }
            } catch (error) {
              console.error('Failed to refresh agent after Claude switch:', error);
            }
          }
        }

        // Save AI response to database if authenticated
        if (isAuthenticated && userId && activeSessionId) {
          try {
            console.log('Saving AI response to session:', activeSessionId);
            const savedAiMessage = await DatabaseService.addMessage(
              activeSessionId, 
              userId, 
              claudeResponse.content, 
              'assistant',
              agentForResponse?.agent_id || 'unknown',
              agentForResponse?.agent_name || 'AI Assistant',
              {},
              claudeResponse.metadata,
              artifactRefs // Pass the artifact references
            );
            console.log('AI message saved:', savedAiMessage);
            await loadUserSessions();
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        } else {
          console.log('AI response not saved - auth:', isAuthenticated, 'user:', !!userId, 'sessionId:', activeSessionId);
        }
      } catch (claudeError) {
        // Handle special Claude SDK cleanup success indicator
        if (claudeError instanceof Error && claudeError.message === 'CLAUDE_SDK_CLEANUP_SUCCESS') {
          console.log('✅ Claude SDK cleanup completed - streaming was successful');
          setIsLoading(false);
          
          // Reset processing flag after streaming success
          isProcessingRef.current = false;

          // Clean up abort controller normally
          if (abortControllerRef.current === thisRequestController) {
            console.log('✅ Cleaning up AbortController after successful streaming (SDK cleanup)');
            abortControllerRef.current = null;
          }
          
          // IMPORTANT: Still save the AI message for streaming success case
          if (isAuthenticated && userId && activeSessionId) {
            try {
              console.log('Saving AI response to session after streaming cleanup success:', activeSessionId);
              
              // Get the most recent AI message from the UI state
              const currentMessages = messages;
              const lastAiMessage = currentMessages
                .filter(msg => !msg.isUser)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
              
              if (lastAiMessage && lastAiMessage.content.trim()) {
                const savedAiMessage = await DatabaseService.addMessage(
                  activeSessionId, 
                  userId, 
                  lastAiMessage.content, 
                  'assistant',
                  undefined, // agent_id not available in this scope
                  lastAiMessage.agentName,
                  {},
                  { is_streaming: true, stream_complete: true }, // Metadata indicating this was a streaming response
                  lastAiMessage.artifactRefs // Pass any artifact references
                );
                console.log('AI message saved after streaming cleanup:', savedAiMessage);
                await loadUserSessions();
              } else {
                console.warn('No AI message content found to save after streaming cleanup');
              }
            } catch (error) {
              console.error('Failed to save AI message after streaming cleanup:', error);
            }
          }
          
          // Don't show error to user - streaming was actually successful
          return;
        }
        
        console.error('Claude API Error:', claudeError);
        setIsLoading(false);
        
        // Clean up abort controller only if it's the same one we created
        
        if (abortControllerRef.current === thisRequestController) {
          abortControllerRef.current = null;
        }
        
        // Check for empty error from function processing (usually not critical)
        if (claudeError instanceof Error && 
            (claudeError.message.includes('Function processing completed with empty error') ||
             claudeError.message.includes('Function processing completed with generic error'))) {
          // Don't show error message for function processing errors
          return;
        }
        
        // Special handling for Claude SDK cleanup success
        if (claudeError instanceof Error && claudeError.message === 'CLAUDE_SDK_CLEANUP_SUCCESS') {
          // This indicates streaming was successful, just cleanup happening
          return;
        }
        
        // Check if this was a cancellation
        if (claudeError instanceof Error && 
            (claudeError.message === 'Request was cancelled' ||
             claudeError.message.includes('aborted') ||
             claudeError.message.includes('cancelled'))) {
          
          // Remove the incomplete AI message if streaming was cancelled
          setMessages(prev => {
            // Remove the last message if it's an AI message with no content (streaming was interrupted)
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser && lastMessage.content.trim() === '') {
              return prev.slice(0, -1);
            }
            return prev;
          });
          
          return; // Don't show error message for cancelled requests
        }
        
        // Categorize the error for better user messaging
        console.log('🏷️ CATEGORIZING ERROR: About to call categorizeError()');
        const categorizedError = categorizeError(claudeError);
        console.log('🏷️ ERROR CATEGORIZED:', {
          type: categorizedError.type,
          message: categorizedError.message,
          suggestion: categorizedError.suggestion
        });
        
        let errorMessage: string;
        switch (categorizedError.type) {
          case 'rate_limit':
            errorMessage = `⏰ The AI service is temporarily busy due to high demand. Your message has been saved and you can try again in a moment. ${categorizedError.suggestion || ''}`;
            break;
          case 'network':
            errorMessage = `🌐 There seems to be a connection issue. Please check your internet connection and try again. Your message has been saved. ${categorizedError.suggestion || ''}`;
            break;
          case 'auth':
            errorMessage = `🔐 There's an authentication issue with the AI service. Please contact support if this persists. ${categorizedError.suggestion || ''}`;
            break;
          case 'quota':
            errorMessage = `📊 The AI service usage limit has been reached. Please try again later or contact support. ${categorizedError.suggestion || ''}`;
            break;
          case 'server':
            errorMessage = `⚠️ The AI service is temporarily unavailable. Your message has been saved and you can try again in a few moments. ${categorizedError.suggestion || ''}`;
            break;
          default:
            errorMessage = `❌ I'm having trouble connecting to the AI service right now. ${categorizedError.message || 'Please try again later.'} Your message has been saved.`;
        }

        const aiErrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: errorMessage,
          isUser: false,
          timestamp: new Date(),
          agentName: currentAgent?.agent_name || 'System'
        };
        
        setMessages(prev => [...prev, aiErrorMessage]);

        // Save error message to database if authenticated
        if (isAuthenticated && userId && activeSessionId) {
          try {
            await DatabaseService.addMessage(
              activeSessionId, 
              userId, 
              aiErrorMessage.content, 
              'assistant',
              currentAgent?.agent_id,
              currentAgent?.agent_name
            );
          } catch (error) {
            console.error('Failed to save error message:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      
      // Reset processing flag on error
      isProcessingRef.current = false;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      console.error('🚨 ABORT REASON: User cancelled request', {
        stackTrace: new Error().stack
      });
      console.log('🚫 MANUAL CANCELLATION: Cancelling Claude request...');
      console.trace('📍 Manual cancellation stack trace');
      abortControllerRef.current.abort('User cancelled request');
      abortControllerRef.current = null;
      
      // Reset processing flag on cancellation
      isProcessingRef.current = false;
    } else {
      console.log('🚫 MANUAL CANCELLATION: No active request to cancel');
    }
  };

  // Helper function to send auto-prompt messages after form submissions
  const sendAutoPrompt = async (
    formName: string,
    formData: Record<string, unknown>,
    messages: Message[],
    setMessages: (updater: (prev: Message[]) => Message[]) => void,
    setIsLoading: (loading: boolean) => void,
    currentSessionId: string | undefined,
    setCurrentSessionId: (id: string) => void,
    setSelectedSessionId: (id: string) => void,
    createNewSession: (agent: SessionActiveAgent | null, currentRfpId?: number) => Promise<string | null>,
    loadUserSessions: () => Promise<void>,
    isAuthenticated: boolean,
    userId: string | undefined,
    currentAgent: SessionActiveAgent | null,
    userProfile: UserProfile | null,
    currentRfp: RFP | null,
    addClaudeArtifacts: (metadata: Record<string, unknown>, messageId?: string) => void,
    loadSessionAgent: (sessionId: string) => Promise<void>,
    handleAgentChanged: (agent: SessionActiveAgent) => Message | null
  ) => {
    
    // Use smart auto-prompt manager to decide if we should send
    const decision = SmartAutoPromptManager.shouldSendAutoPrompt(
      formName,
      formData, // Pass the actual form data
      currentRfp ? { status: 'unknown', phase: 'unknown' } : undefined,
      messages
    );

    if (!decision.shouldSend) {
      console.log(`⏭️ Skipping auto-prompt: ${decision.reason}`);
      return;
    }

    const autoPromptMessage = decision.prompt || `I submitted form "${formName}"`;
    console.log('🤖 Sending smart auto-prompt:', autoPromptMessage);

    // Use the existing handleSendMessage function to send the auto-prompt
    await handleSendMessage(
      autoPromptMessage,
      messages,
      setMessages,
      setIsLoading,
      currentSessionId,
      setCurrentSessionId,
      setSelectedSessionId,
      createNewSession,
      loadUserSessions,
      isAuthenticated,
      userId,
      currentAgent,
      userProfile,
      currentRfp,
      addClaudeArtifacts,
      loadSessionAgent,
      handleAgentChanged,
      null // currentArtifact - not available in auto-prompt context
    );
  };
  
  return {
    handleSendMessage,
    sendAutoPrompt,
    cancelRequest,
    toolInvocations,
    setToolInvocations,
    clearToolInvocations,
    loadToolInvocationsForSession
  };
};

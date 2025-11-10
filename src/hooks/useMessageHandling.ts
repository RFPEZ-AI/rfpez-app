// Copyright Mark Skiba, 2025 All rights reserved

import { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ArtifactReference, Artifact } from '../types/home';
import { RFP, FormSpec } from '../types/rfp';
import { SessionActiveAgent, UserProfile } from '../types/database';
import { ToolInvocationEvent } from '../types/streamingProtocol';
import DatabaseService from '../services/database';
import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import { SmartAutoPromptManager } from '../utils/smartAutoPromptManager';
import { categorizeError } from '../components/APIErrorHandler';
import { generateSessionTitleFromMessage } from '../utils/sessionTitleUtils';

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

export const useMessageHandling = (
  setGlobalRFPContext?: (rfpId: number, rfpData?: RFP) => Promise<void>
) => {
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
    

    
    // Handle function results that contain forms/templates
    if (metadata.function_results && Array.isArray(metadata.function_results)) {
      metadata.function_results.forEach((funcResult: Record<string, unknown>) => {
        if (typeof funcResult === 'object' && funcResult !== null) {
          const funcObj = funcResult as Record<string, unknown>;
          const result = funcObj.result as Record<string, unknown>;
          
          // Handle different types of function results
          if (result && result.success) {
            // 🔄 AGENT SWITCH DETECTION
            if (funcObj.function === 'switch_agent') {
              // Type-safe access to agent switch result properties
              const agentSwitchResult = result as {
                trigger_continuation?: boolean;
                new_agent?: { name: string };
                context_message?: string;
                success?: boolean;
              };
              
              console.log('🔄 AGENT SWITCH DETECTED in function results:', {
                function_name: funcObj.function,
                result: result,
                trigger_continuation: agentSwitchResult.trigger_continuation,
                new_agent_name: agentSwitchResult.new_agent?.name,
                context_message: agentSwitchResult.context_message
              });
              
              // Store agent switch flag for later UI update
              // Will be handled after message processing completes
              (refs as any).agentSwitchDetected = true; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            
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
            } else if (funcObj.function === 'create_document_artifact' || funcObj.function === 'generate_proposal_artifact') {
              // Document artifacts - check for success first, then artifact_id
              
              if (result && (result.success || result.artifact_id)) {
                const artifactRef = {
                  artifactId: result.artifact_id as string || `doc-${Date.now()}`,
                  artifactName: result.artifact_name as string || result.title as string || 'Generated Document',
                  artifactType: 'document' as const,
                  isCreated: true,
                  displayText: result.artifact_name as string || result.title as string || 'Generated Document'
                };
                
                refs.push(artifactRef);
              }
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
                
                // ENHANCED: Update global RFP context when agents create new RFPs
                if (enhancedResult.current_rfp_id && setGlobalRFPContext) {
                  console.log('🌐 Agent created new RFP - updating global context:', enhancedResult.current_rfp_id);
                  
                  try {
                    // Convert current_rfp_id to number if it's a string
                    const rfpId = typeof enhancedResult.current_rfp_id === 'string' 
                      ? parseInt(enhancedResult.current_rfp_id, 10) 
                      : enhancedResult.current_rfp_id;
                    
                    // If we have RFP data from the function result, use it directly
                    if (rfpData && rfpData.name) {
                      const rfpForContext: RFP = {
                        id: rfpId,
                        name: rfpData.name as string,
                        description: rfpData.description as string || '',
                        specification: rfpData.specification as string || '',
                        due_date: rfpData.due_date as string || '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        bid_form_questionaire: rfpData.bid_form_questionaire as FormSpec || undefined,
                        is_template: rfpData.is_template as boolean || false,
                        is_public: rfpData.is_public as boolean || false,
                        suppliers: rfpData.suppliers as number[] || undefined
                      };
                      
                      // Use setTimeout to make this async without blocking
                      setTimeout(async () => {
                        try {
                          await setGlobalRFPContext(rfpId, rfpForContext);
                          console.log('✅ Global RFP context updated with agent-created RFP:', rfpForContext.name);
                        } catch (error) {
                          console.error('❌ Failed to update global RFP context with RFP data:', error);
                        }
                      }, 100);
                    } else {
                      // Fallback to setting just the ID (will trigger database fetch)
                      setTimeout(async () => {
                        try {
                          await setGlobalRFPContext(rfpId);
                          console.log('✅ Global RFP context updated with agent-created RFP ID:', rfpId);
                        } catch (error) {
                          console.error('❌ Failed to update global RFP context with RFP ID:', error);
                        }
                      }, 100);
                    }
                  } catch (error) {
                    console.error('❌ Failed to update global RFP context from agent creation:', error);
                  }
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
    loadSessionArtifacts: (sessionId: string) => Promise<Artifact[] | undefined>,
    currentArtifact?: {
      id: string;
      name: string;
      type: string;
      content?: string;
    } | null,
    messageMetadata?: Record<string, unknown>
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
      timestamp: new Date(),
      ...(messageMetadata && { metadata: messageMetadata })
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Verify our controller is still valid before starting the request
    if (!thisRequestController || thisRequestController.signal.aborted) {
      return;
    }
    
    setIsLoading(true);

    let activeSessionId = currentSessionId;

    try {
      // For authenticated users, save to Supabase
      if (isAuthenticated && userId) {
        console.log('Authenticated user sending message, currentSessionId:', activeSessionId);
        
        // CRITICAL FIX: Validate existing session and ensure current_session_id is set
        if (activeSessionId) {
          console.log('🔍 Validating existing session ID:', activeSessionId);
          
          // Verify the session exists and belongs to the user
          try {
            const sessionMessages = await DatabaseService.getSessionMessages(activeSessionId);
            console.log('✅ Session validation successful - found', sessionMessages.length, 'existing messages');
            
            // Ensure this session is set as the user's current session for persistence
            await DatabaseService.setUserCurrentSession(activeSessionId);
            console.log('✅ Confirmed session as current in user profile:', activeSessionId);
            
            // Update tool invocation session tracking to use the existing session
            loadToolInvocationsForSession(activeSessionId);
          } catch (sessionError) {
            console.warn('⚠️ Session validation failed for ID:', activeSessionId, sessionError);
            // Clear invalid session ID and create a new one
            activeSessionId = undefined;
          }
        }
        
        // CRITICAL FIX: Don't auto-create session if we're in the middle of restoring one
        // 🔍 CRITICAL FIX: Verify session exists in database before using it
        // Sessions can exist in client state but not in database (e.g., after page reload with localStorage)
        if (activeSessionId) {
          console.log('🔍 Verifying session exists in database:', activeSessionId);
          try {
            const sessionExists = await DatabaseService.getSession(activeSessionId);
            if (!sessionExists) {
              console.warn('⚠️ Session', activeSessionId, 'exists in client state but NOT in database - will create new session');
              activeSessionId = undefined; // Force creation of new session
              setCurrentSessionId('');
              setSelectedSessionId('');
            } else {
              console.log('✅ Session verified in database:', activeSessionId);
            }
          } catch (error) {
            console.warn('⚠️ Failed to verify session in database - will create new session:', error);
            activeSessionId = undefined;
            setCurrentSessionId('');
            setSelectedSessionId('');
          }
        }
        
        // Check if session restoration is in progress by looking for database current session
        if (!activeSessionId) {
          console.log('❓ No current session - checking if restoration is in progress...');
          
          // Try to get the user's current session from database
          try {
            const dbCurrentSession = await DatabaseService.getUserCurrentSession();
            if (dbCurrentSession) {
              console.log('⏳ Session restoration detected - using database session:', dbCurrentSession);
              // getUserCurrentSession now returns just the ID string
              activeSessionId = dbCurrentSession;
              // Update state to reflect the restored session
              setCurrentSessionId(dbCurrentSession);
              setSelectedSessionId(dbCurrentSession);
              console.log('✅ Session restored from database during message send');
            }
          } catch (error) {
            console.warn('⚠️ Failed to check for database current session:', error);
          }
        }
        
        // Create session ONLY if none exists AND no database session found
        if (!activeSessionId) {
          console.log('No current session or validation failed, creating new one with RFP context:', currentRfp?.id);
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
            currentAgent?.agent_name,
            messageMetadata // Pass metadata to database
          );
          console.log('User message saved:', savedMessage);
          
          // Check if this is the first user message in the session and update title
          const sessionMessages = await DatabaseService.getSessionMessages(activeSessionId);
          const userMessages = sessionMessages.filter(msg => msg.role === 'user');
          
          if (userMessages.length === 1) {
            // Generate a meaningful title from the first user message
            const sessionTitle = generateSessionTitleFromMessage(content);
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
        let accumulatedContent = ''; // STREAMING FIX: Track total accumulated content
        let lastUpdateTime = 0;
        const updateInterval = 50; // Update UI every 50ms to reduce re-render frequency
        let streamingCompleted = false;
        
        let toolProcessingMessageId: string | null = null;
        let isWaitingForToolCompletion = false;
        let uiTimeoutId: NodeJS.Timeout | null = null;
        
        const onStreamingChunk = (chunk: string, isComplete: boolean, toolProcessing?: boolean, toolEvent?: ToolInvocationEvent, forceToolCompletion?: boolean, metadata?: any) => {
          console.log('🌊 STREAMING CHUNK RECEIVED:', {
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
            metadata: metadata ? Object.keys(metadata) : undefined,
            metadataFull: metadata, // 🔍 DEBUG: Log full metadata to see structure
            timestamp: new Date().toISOString()
          });
          
          // 🎯 CRITICAL FIX: Handle message_complete event for agent switches
          if (metadata?.message_complete && !isComplete) {
            console.log('✅✅✅ MESSAGE_COMPLETE EVENT RECEIVED ✅✅✅');
            console.log('📋 Message completion details:', {
              agent_id: metadata.agent_id,
              messageId: aiMessageId,
              accumulatedLength: accumulatedContent.length,
              accumulatedPreview: accumulatedContent.substring(0, 100) + '...',
              bufferLength: streamingBuffer.length,
              bufferPreview: streamingBuffer.substring(0, 100) + '...'
            });
            
            // Flush any remaining buffer
            if (streamingBuffer.length > 0) {
              console.log('🔧 Flushing remaining buffer to message before completion');
              accumulatedContent += streamingBuffer;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
              streamingBuffer = '';
              console.log('✅ Buffer flushed, final content length:', accumulatedContent.length);
            }
            
            console.log('⏸️ Message complete - waiting for message_start event');
            // Don't actually complete - wait for message_start
            return;
          }
          
          // 🎯 CRITICAL FIX: Handle message_start event for new agent
          if (metadata?.message_start) {
            console.log('🆕🆕🆕 MESSAGE_START EVENT RECEIVED 🆕🆕🆕');
            console.log('📋 New agent message details:', {
              agent_id: metadata.agent_id,
              agent_name: metadata.agent_name,
              previousMessageId: aiMessageId,
              previousAgentName: agentForResponse?.agent_name,
              currentChunkLength: chunk.length,
              currentChunkPreview: chunk.substring(0, 100) + '...',
              accumulatedContentLength: accumulatedContent.length,
              bufferLength: streamingBuffer.length
            });
            
            // 🚨 CRITICAL CHECK: Verify no content is in the chunk with message_start
            if (chunk.length > 0) {
              console.warn('⚠️⚠️⚠️ WARNING: Content received with message_start event! This should be empty!');
              console.warn('Content that came with message_start:', chunk.substring(0, 200));
            }
            
            // Create new message for the new agent
            const newAgentMessageId = uuidv4();
            const newAgentMessage: Message = {
              id: newAgentMessageId,
              content: '',
              isUser: false,
              timestamp: new Date(),
              agentName: metadata.agent_name || 'AI Assistant',
              hidden: true // ✅ FIX: Hide empty agent switch messages (will unhide when content arrives)
            };
            
            console.log('📝 Creating new message:', {
              id: newAgentMessageId,
              agentName: newAgentMessage.agentName,
              contentLength: 0,
              hidden: true
            });
            
            setMessages(prev => [...prev, newAgentMessage]);
            
            // Switch to new message for further streaming
            const oldMessageId = aiMessageId;
            aiMessageId = newAgentMessageId;
            accumulatedContent = '';
            streamingBuffer = '';
            lastUpdateTime = Date.now();
            
            // Update agent context
            if (metadata.agent_id) {
              agentForResponse = {
                agent_id: metadata.agent_id,
                agent_name: metadata.agent_name,
                agent_instructions: '',
                agent_initial_prompt: '',
                agent_avatar_url: undefined
              };
            }
            
            console.log('🔄 Agent context switched:', {
              oldMessageId,
              newMessageId: aiMessageId,
              oldAgent: agentForResponse?.agent_name,
              newAgent: metadata.agent_name,
              accumulatedReset: accumulatedContent.length === 0,
              bufferReset: streamingBuffer.length === 0
            });
            
            console.log('✅ message_start handling complete - ready for new agent content');
            return;
          }
          
          // 🔍 DEBUG: Log toolEvent parameter status BEFORE the if check
          console.log('🔍 TOOL EVENT CHECK:', {
            hasToolEvent: !!toolEvent,
            toolEventValue: toolEvent,
            toolEventType: typeof toolEvent,
            isComplete,
            toolProcessing
          });
          
          // Handle tool invocation events
          if (toolEvent) {
            console.log('🔧 Tool invocation event received:', toolEvent.type, toolEvent.toolName);
            console.log('🔧 Current agent for tool attribution:', agentForResponse?.agent_id, agentForResponse?.agent_name);
            
            // 🎯 CRITICAL FIX: Add agentId to tool events for proper attribution
            const toolEventWithAgent = {
              ...toolEvent,
              agentId: agentForResponse?.agent_id
            };
            
            setToolInvocations(prev => {
              const existing = prev.find(t => t.toolName === toolEvent.toolName && t.type === 'tool_start');
              
              if (toolEvent.type === 'tool_start') {
                console.log('➕ Adding tool_start to buffer:', toolEvent.toolName, 'with agentId:', agentForResponse?.agent_id, '| Buffer size:', prev.length, '→', prev.length + 1);
                // Add new tool start event WITH agent ID
                return [...prev, toolEventWithAgent];
              } else if (toolEvent.type === 'tool_complete' && existing) {
                console.log('✅ Updating tool to completed:', toolEvent.toolName, '| Buffer size stays:', prev.length);
                // Update existing tool to completed status WITH agent ID
                return prev.map(t => 
                  t.toolName === toolEvent.toolName && t.type === 'tool_start'
                    ? { ...toolEventWithAgent } // Replace with completion event WITH agent ID
                    : t
                );
              } else if (toolEvent.type === 'tool_complete') {
                console.log('➕ Adding tool_complete (no start found):', toolEvent.toolName, 'with agentId:', agentForResponse?.agent_id, '| Buffer size:', prev.length, '→', prev.length + 1);
                // Add completion event if no start event found WITH agent ID
                return [...prev, toolEventWithAgent];
              }
              
              console.log('⚠️ Tool event not handled:', toolEvent.type, toolEvent.toolName);
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
          
          // CRITICAL FIX: Flush buffer immediately when toolProcessing starts, not just when complete
          if (toolProcessing && streamingBuffer.length > 0) {
            console.log('🔧 IMMEDIATE BUFFER FLUSH - Tool processing detected, flushing buffer:', streamingBuffer.length, 'chars');
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: msg.content + streamingBuffer }
                  : msg
              )
            );
            streamingBuffer = '';
          }

          if (isComplete) {
            if (toolProcessing) {
              console.log('🔧 Message segment complete - tools processing for message:', aiMessageId, {
                streamingBuffer: streamingBuffer.length,
                currentMessageId: aiMessageId
              });
              
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
              
              // UI-LEVEL TIMEOUT: Force cleanup after 45 seconds to allow for recursive continuation
              uiTimeoutId = setTimeout(() => {
                console.log('⏰ UI TIMEOUT TRIGGERED - forcing tool processing cleanup after 45 seconds');
                console.log('🔧 Timeout cleanup for processing message:', toolProcessingMessageId);
                
                if (toolProcessingMessageId && isWaitingForToolCompletion) {
                  // Remove tool processing message
                  setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
                  
                  // Create timeout error message
                  const timeoutMessageId = uuidv4();
                  const timeoutMessage: Message = {
                    id: timeoutMessageId,
                    content: 'Tool processing exceeded time limit. If artifacts were created, they should still be available. Please check the artifact panel or try again.',
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
                console.log('✅✅✅ STREAMING PHASE COMPLETE ✅✅✅');
                console.log('📊 Final streaming state:', {
                  messageId: aiMessageId,
                  agentName: agentForResponse?.agent_name,
                  accumulatedLength: accumulatedContent.length,
                  bufferLength: streamingBuffer.length,
                  finalContentPreview: accumulatedContent.substring(0, 150) + '...'
                });
              } else {
                console.log('⏸️ Streaming segment complete, but waiting for tool completion continuation');
              }
              
              // CRITICAL FIX: Always clear timeout and tool processing state on completion
              // This handles the case where tools were executed but completion event doesn't indicate toolProcessing
              if (isWaitingForToolCompletion) {
                console.log('🔧 Tool completion detected - cleaning up tool processing state');
                
                // STREAMING COMPLETION FIX: Flush any remaining buffer before cleanup
                if (streamingBuffer.length > 0) {
                  console.log('🔧 FLUSHING BUFFER during tool completion cleanup:', {
                    bufferLength: streamingBuffer.length,
                    bufferContent: streamingBuffer.substring(0, 100) + '...',
                    messageId: aiMessageId
                  });
                  
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: msg.content + streamingBuffer }
                        : msg
                    )
                  );
                  streamingBuffer = '';
                }
                
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
                console.log('🔧 FINAL BUFFER FLUSH on completion:', {
                  bufferLength: streamingBuffer.length,
                  bufferContent: streamingBuffer.substring(0, 100) + '...',
                  messageId: aiMessageId
                });
                
                // STREAMING FIX: Add final buffer to accumulated content
                accumulatedContent += streamingBuffer;
                
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: accumulatedContent } // Use accumulated content
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
          // Also handle recursive continuation content
          // STREAMING ACCUMULATION FIX: Only create continuation if we have a tool processing message
          // This prevents message ID switching during normal streaming of text content
          if (isWaitingForToolCompletion && chunk.trim() && toolProcessingMessageId) {
            console.log('📝 Creating new message for content after tool processing (may be recursive continuation):', {
              chunk: chunk.substring(0, 50) + '...',
              chunkLength: chunk.length,
              isWaitingForToolCompletion,
              toolProcessingMessageId,
              currentAiMessageId: aiMessageId,
              currentStreamingBuffer: streamingBuffer.length
            });
            
            // STREAMING CONTINUATION FIX: Flush any remaining buffer to the current message before transitioning
            if (streamingBuffer.length > 0) {
              console.log('🔧 FLUSHING REMAINING BUFFER before continuation:', {
                bufferLength: streamingBuffer.length,
                bufferContent: streamingBuffer.substring(0, 100) + '...',
                currentMessageId: aiMessageId
              });
              
              // STREAMING FIX: Add buffer to accumulated content before transitioning
              accumulatedContent += streamingBuffer;
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: accumulatedContent } // Use accumulated content
                    : msg
                )
              );
            }
            
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
            
            // Check if agent switched - use new agent's info for continuation message
            let continuationAgentName = agentForResponse?.agent_name || 'AI Assistant';
            if (claudeResponse?.metadata?.agent_switch_result?.new_agent) {
              continuationAgentName = claudeResponse.metadata.agent_switch_result.new_agent.name;
              const newAgentId = claudeResponse.metadata.agent_switch_result.new_agent.id;
              console.log('🔄 Agent switch detected - Old:', agentForResponse?.agent_id, 'New:', newAgentId);
              
              // 🎯 CRITICAL DEBUG: Check tool buffer state before filtering
              console.log('🔍 TOOL BUFFER STATE AT AGENT SWITCH:');
              console.log('  Total tools in buffer:', toolInvocations.length);
              console.log('  All tool agentIds:', toolInvocations.map(t => ({ tool: t.toolName, agentId: t.agentId })));
              
              // 🎯 CRITICAL FIX: Filter tools by PREVIOUS agent's ID
              const previousAgentId = agentForResponse?.agent_id;
              const previousAgentTools = toolInvocations.filter(t => t.agentId === previousAgentId);
              const newAgentTools = toolInvocations.filter(t => t.agentId === newAgentId);
              
              console.log('🔧 AGENT SWITCH TOOL ATTRIBUTION:');
              console.log('  Previous agent', previousAgentId, 'tools:', previousAgentTools.map(t => t.toolName).join(', '));
              console.log('  New agent', newAgentId, 'tools:', newAgentTools.map(t => t.toolName).join(', '));
              
              // Attach ONLY the previous agent's tools to the previous message
              if (previousAgentTools.length > 0) {
                setMessages(prev => {
                  const updated = [...prev];
                  // Find the last non-user message (previous agent's message)
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (!updated[i].isUser && updated[i].id !== toolProcessingMessageId) {
                      updated[i] = {
                        ...updated[i],
                        metadata: {
                          ...updated[i].metadata,
                          toolInvocations: previousAgentTools
                        }
                      };
                      console.log('✅ Attached', previousAgentTools.length, 'tools to previous agent message:', updated[i].agentName);
                      break;
                    }
                  }
                  return updated;
                });
              }
              
              // Remove previous agent's tools from buffer, keep new agent's tools
              setToolInvocations(newAgentTools);
              console.log('🔧 Updated tool buffer - removed previous agent tools, kept', newAgentTools.length, 'new agent tools');
              
              // Update agentForResponse for subsequent streaming
              const newAgent = claudeResponse.metadata.agent_switch_result.new_agent;
              agentForResponse = {
                agent_id: newAgent.id,
                agent_name: newAgent.name,
                agent_instructions: newAgent.instructions,
                agent_initial_prompt: newAgent.initial_prompt,
                agent_avatar_url: undefined
              };
            }
            
            // Create new message for continuation
            const continuationMessageId = uuidv4();
            const continuationMessage: Message = {
              id: continuationMessageId,
              content: chunk,
              isUser: false,
              timestamp: new Date(),
              agentName: continuationAgentName
            };
            
            console.log('✨ Created continuation message:', {
              id: continuationMessageId,
              contentLength: chunk.length,
              contentPreview: chunk.substring(0, 100) + '...',
              agentName: continuationMessage.agentName,
              agentSwitchDetected: !!claudeResponse?.metadata?.agent_switch_result?.new_agent
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
            accumulatedContent = chunk; // STREAMING FIX: Reset accumulator with the continuation content
            lastUpdateTime = Date.now();
            
            console.log('🔄 Switched to continuation message ID:', aiMessageId);
            return;
          }
          
          // DEBUG: Log conditions that might trigger continuation logic
          console.log('🔍 CONTINUATION CHECK:', {
            isWaitingForToolCompletion,
            hasChunk: !!chunk?.trim(),
            toolProcessingMessageId,
            willTriggerContinuation: isWaitingForToolCompletion && chunk.trim() && toolProcessingMessageId
          });

          // STREAMING BUFFER FIX: Filter out tool metadata from text chunks
          // Only add to buffer if chunk contains actual text content (not tool metadata)
          // CRITICAL FIX: Preserve whitespace characters (spaces, newlines) - they are valid text!
          const isValidTextChunk = chunk && 
            typeof chunk === 'string' && 
            !chunk.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i) && // Not a UUID
            !chunk.includes('"id":"') && // Not JSON tool data
            !chunk.includes('"type":"') && // Not JSON event data
            !chunk.includes('tool_use_id') && // Not tool result data
            chunk.length > 0; // Allow whitespace characters - they are part of text formatting!
          
          if (isValidTextChunk) {
            console.log('➕ Adding chunk to buffer:', {
              chunkLength: chunk.length,
              chunkPreview: chunk.substring(0, 50) + '...',
              messageId: aiMessageId,
              currentAgentName: agentForResponse?.agent_name
            });
            streamingBuffer += chunk;
          } else if (chunk && chunk.trim()) {
            console.log('🔧 FILTERING OUT NON-TEXT CHUNK:', {
              chunkLength: chunk.length,
              chunkPreview: chunk.substring(0, 50) + '...',
              reason: chunk.match(/^[a-f0-9-]{36}$/i) ? 'UUID detected' : 
                     chunk.includes('"id":"') ? 'JSON tool data' :
                     chunk.includes('"type":"') ? 'JSON event data' :
                     chunk.includes('tool_use_id') ? 'Tool result data' : 'Unknown metadata',
              messageId: aiMessageId
            });
          }
          
          const now = Date.now();
          
          // Update UI periodically or when buffer gets large
          if (now - lastUpdateTime >= updateInterval || streamingBuffer.length > 150) {
            console.log('�️ UPDATING UI MESSAGE with buffer:', {
              messageId: aiMessageId,
              agentName: agentForResponse?.agent_name,
              bufferLength: streamingBuffer.length,
              bufferPreview: streamingBuffer.substring(0, 100) + '...',
              accumulatedBefore: accumulatedContent.length
            });
            
            // STREAMING FIX: Add buffer to accumulated content before updating UI
            accumulatedContent += streamingBuffer;
            
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      content: accumulatedContent, // Use accumulated content instead of msg.content + buffer
                      hidden: false // 🎯 CRITICAL FIX: Unhide message when content arrives
                    }
                  : msg
              );
              
              // Find the updated message to log its content
              const updatedMessage = updated.find(msg => msg.id === aiMessageId);
              console.log('✅ UI MESSAGE UPDATED:', {
                messageId: aiMessageId,
                agentName: updatedMessage?.agentName,
                accumulatedLength: accumulatedContent.length,
                newContentLength: updatedMessage?.content.length,
                newContentPreview: updatedMessage?.content.substring(0, 100) + '...',
                hidden: updatedMessage?.hidden
              });
              
              return updated;
            });
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
          thisRequestController.signal, // Pass abort signal for cancellation support
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
        // let finalContent = claudeResponse.content || ''; // Unused when final content refresh is disabled
        
        // 🚨 STREAMING DEBUG: DISABLE FINAL CONTENT REFRESH TO OBSERVE PARTIAL RESPONSES
        // Get final content for artifacts but don't update UI
        // const currentMessage = messages.find(msg => msg.id === aiMessageId);
        // const currentContent = currentMessage?.content || '';
        // const wasStreaming = claudeResponse.metadata?.is_streaming;
        // const fullApiResponse = claudeResponse.content || '';
        
        // Final content logic commented out as it's not used when message update is disabled for debug mode
        // if (wasStreaming && currentContent) {
        //   finalContent = currentContent.length >= fullApiResponse.length 
        //     ? currentContent 
        //     : fullApiResponse;
        // } else {
        //   finalContent = fullApiResponse;
        // }
        
        // 🚨 DISABLED: Final message update to preserve streaming state
        // setMessages(prev => {
        //   return prev.map(msg => 
        //     msg.id === aiMessageId 
        //       ? { ...msg, content: finalContent }
        //       : msg
        //   );
        // });

        // 🎯 CRITICAL FIX: Get current message content from UI to ensure database has latest
        const currentMessages = messages;
        const currentMessage = currentMessages.find(msg => msg.id === aiMessageId);
        const finalContent = currentMessage?.content || claudeResponse.content || '';
        
        console.log('💾 Preparing final message content for save:', {
          messageId: aiMessageId,
          uiContentLength: currentMessage?.content?.length || 0,
          apiContentLength: claudeResponse.content?.length || 0,
          finalContentLength: finalContent.length,
          contentPreview: finalContent.substring(0, 100) + '...'
        });
        
        // 🎯 CRITICAL FIX: Update UI with final content and unhide message before database save
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: finalContent, hidden: false }
              : msg
          )
        );
        
        // Generate artifact references (still needed for database save, but UI update will be delayed)
        const artifactRefs = generateArtifactReferences(claudeResponse.metadata);
        
        // Process Claude response metadata for artifacts with message ID
        console.log('🔍 useMessageHandling: About to call addClaudeArtifacts with metadata:', claudeResponse.metadata);
        
        // CRITICAL FIX: Process artifacts FIRST, then add references to UI after a delay
        // This ensures artifacts are available when references are clicked, preventing "could not be loaded" errors
        addClaudeArtifacts(claudeResponse.metadata, aiMessageId);
        
        // CRITICAL FIX: Refresh artifacts from database after Claude creates or updates artifacts
        // This ensures the artifact panel shows all newly created documents and updated forms
        console.log('🔍 Checking for artifact modifications:', {
          hasFunctionResults: !!claudeResponse.metadata?.function_results,
          functionResultsCount: claudeResponse.metadata?.function_results?.length || 0,
          functions: claudeResponse.metadata?.function_results?.map((fr: any) => fr.function_name || fr.function) || [],
          hasBuyerQuestionnaire: !!claudeResponse.metadata?.buyer_questionnaire,
          hasCreateDocumentArtifact: !!claudeResponse.metadata?.create_document_artifact
        });
        
        const hasArtifactModification = claudeResponse.metadata?.function_results?.some((fr: any) => {
          const funcName = fr.function_name || fr.function; // Support both field names
          return ['create_form_artifact', 'create_document_artifact', 'generate_proposal_artifact', 'update_form_data', 'update_form_artifact'].includes(funcName);
        }) || claudeResponse.metadata?.buyer_questionnaire ||
           claudeResponse.metadata?.create_document_artifact;
        
        console.log('🔍 Artifact modification check result:', hasArtifactModification);
        
        if (currentSessionId && hasArtifactModification) {
          console.log('🔄 Refreshing artifacts from database after Claude response (includes document artifacts)');
          // Small delay to ensure database operations complete
          setTimeout(async () => {
            try {
              console.log('⏰ Artifact reload timeout executing after 500ms');
              await loadSessionArtifacts(currentSessionId);
              console.log('✅ Artifacts refreshed from database');
            } catch (error) {
              console.error('❌ Failed to refresh artifacts:', error);
            }
          }, 500);
        } else {
          console.log('⏭️ Skipping artifact reload - no modifications detected');
        }
        
        // 🔄 AGENT SWITCH DETECTION: Check if agent was switched during this response
        const hasAgentSwitch = claudeResponse.metadata?.function_results?.some((fr: any) => {
          const funcName = fr.function_name || fr.function;
          return funcName === 'switch_agent' && fr.result?.success;
        });
        
        if (hasAgentSwitch && currentSessionId) {
          console.log('🔄 Agent switch detected in response, reloading session agent to update UI');
          setTimeout(async () => {
            try {
              console.log('⏰ Agent reload timeout executing after 500ms');
              await loadSessionAgent(currentSessionId);
              console.log('✅ Session agent reloaded after switch');
            } catch (error) {
              console.error('❌ Failed to reload session agent:', error);
            }
          }, 500); // Small delay to ensure database writes are committed
        }
        
        // RE-ENABLED: Artifact reference timeout to show document cards in messages
        if (artifactRefs.length > 0) {
          setTimeout(() => {
            console.log('🔗 Adding artifact references to UI after artifact processing:', artifactRefs);
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, artifactRefs }
                  : msg
              )
            );
          }, 300); // Delay to ensure artifact processing completes
        }

        setIsLoading(false);
        
        // Clean up abort controller ONLY after complete response (streaming + function calls)
        console.log('🧹 Cleaning up AbortController after complete Claude response processing');
        if (abortControllerRef.current === thisRequestController) {
          console.log('✅ AbortController cleanup after successful completion');
          abortControllerRef.current = null;
        }
        
        // Reset processing flag after successful completion
        isProcessingRef.current = false;

        // 🎯 CRITICAL: Attribute tools to current agent's message BEFORE agent switch UI update
        if (claudeResponse.metadata.agent_switch_occurred) {
          console.log('🔧 PRE-SWITCH TOOL ATTRIBUTION:');
          console.log('  Current agent:', agentForResponse?.agent_id, agentForResponse?.agent_name);
          console.log('  Total tools in buffer:', toolInvocations.length);
          
          // Get current agent's tools
          const currentAgentId = agentForResponse?.agent_id;
          const currentAgentTools = toolInvocations.filter(t => t.agentId === currentAgentId);
          
          console.log('  Current agent tools:', currentAgentTools.map(t => t.toolName).join(', '));
          
          // Attach tools to the current message BEFORE switching
          if (currentAgentTools.length > 0) {
            console.log('✅ Attaching', currentAgentTools.length, 'tools to current agent message:', aiMessageId);
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { 
                      ...msg, 
                      metadata: {
                        ...msg.metadata,
                        toolInvocations: currentAgentTools
                      }
                    }
                  : msg
              )
            );
            
            console.log('✅ Tools attached successfully - now proceeding with agent switch UI update');
          } else {
            console.log('⚠️ No tools found for current agent - skipping attribution');
          }
        }

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
            console.log('🔍 DEBUG: artifactRefs being passed to database:', artifactRefs);
            
            // 🎯 CRITICAL FIX: Only attach tools for the CURRENT AGENT
            // Filter tool invocations by current agent ID
            console.log('🔍 END OF STREAM TOOL ATTRIBUTION:');
            console.log('🔍 About to enter try block...');
            console.log('🔍 agentForResponse available:', !!agentForResponse);
            console.log('🔍 toolInvocations available:', !!toolInvocations);
            console.log('🔍 Agent switch occurred:', !!claudeResponse?.metadata?.agent_switch_occurred);

            // ✅ REMOVED: Skip logic no longer needed - we handle attribution before agent switch
            // Attribution now happens BEFORE agent switch UI update (around line 1450)
            // This code path only runs for non-switch scenarios
            
            if (!claudeResponse?.metadata?.agent_switch_occurred) {
              try {
                console.log('🔍 INSIDE try block now');
              
              // �️ DEFENSIVE COPIES: Create immutable copies to avoid React re-render triggers
              const agentSnapshot = agentForResponse ? { ...agentForResponse } : null;
              console.log('🔍 Agent snapshot created:', agentSnapshot);
              
              const toolsSnapshot = [...toolInvocations];
              console.log('🔍 Tools snapshot created, length:', toolsSnapshot.length);
              
              const currentAgentId = agentSnapshot?.agent_id;
              console.log('🔍 Got currentAgentId from snapshot:', currentAgentId);
              
              // Use snapshots for filtering to avoid triggering React state reads
              const currentAgentTools = toolsSnapshot.filter(t => t.agentId === currentAgentId);
              console.log('🔍 Tools filtered from snapshot, count:', currentAgentTools.length);
              
              const toolAgentMapping = toolsSnapshot.map(t => ({ tool: t.toolName, agentId: t.agentId }));
              console.log('🔍 All tool agent IDs:', toolAgentMapping);
              
              const toolNames = currentAgentTools.map(t => t.toolName).join(', ');
              console.log('🔍 Tools for this agent:', currentAgentTools.length, '-', toolNames);
              
              // Now perform actual tool attribution using snapshots
              console.log('🔍 Performing tool attribution for message:', aiMessageId);
              
              // Check if this message already has tools
              const currentMessage = messages.find(m => m.id === aiMessageId);
              const alreadyHasTools = currentMessage?.metadata?.toolInvocations && 
                                       Array.isArray(currentMessage?.metadata?.toolInvocations) && 
                                       (currentMessage?.metadata?.toolInvocations?.length ?? 0) > 0;
              
              console.log('🔍 Message already has tools?', alreadyHasTools);
              
              const shouldAttachTools = currentAgentTools.length > 0 && !alreadyHasTools;
              console.log('🔍 Should attach tools?', shouldAttachTools);
              
              if (shouldAttachTools) {
                console.log('✅ ATTACHING', currentAgentTools.length, 'tools to FINAL message ID:', aiMessageId);
                console.log('✅ Tools being attached:', toolNames);
                
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          metadata: {
                            ...msg.metadata,
                            toolInvocations: currentAgentTools
                          }
                        }
                      : msg
                  )
                );
                console.log('✅ Tool attachment complete');
              } else {
                console.log('⏭️  Skipping tool attachment:', {
                  hasTools: currentAgentTools.length > 0,
                  alreadyAttached: alreadyHasTools
                });
              }
              
              } catch (attrError) {
                console.error('❌ ERROR during tool attribution:', attrError);
                console.error('❌ Error details:', {
                  agentForResponse,
                  toolInvocationsLength: toolInvocations?.length,
                  errorMessage: attrError instanceof Error ? attrError.message : String(attrError)
                });
              }
            } // End of agent switch check
            
            // Tool attribution complete - continue with message saving
            // Filter tool invocations for current agent and include in metadata
            const currentAgentId = agentForResponse?.agent_id || 'unknown';
            const relevantToolInvocations = toolInvocations.filter(t => t.agentId === currentAgentId);
            const metadataWithTools = {
              toolInvocations: relevantToolInvocations
            };
            
            const savedAiMessage = await DatabaseService.addMessage(
              activeSessionId, 
              userId, 
              claudeResponse.content, 
              'assistant',
              agentForResponse?.agent_id || 'unknown',
              agentForResponse?.agent_name || 'AI Assistant',
              metadataWithTools, // Use metadata with tools attached (correct parameter position)
              claudeResponse.metadata, // AI metadata from Claude response
              artifactRefs // Pass the artifact references
            );
            console.log('AI message saved:', savedAiMessage);
            await loadUserSessions();
            
            // 🔄 ARTIFACT REFRESH: Check if any tools were executed and refresh artifacts
            if (claudeResponse.metadata && claudeResponse.metadata.function_results && Array.isArray(claudeResponse.metadata.function_results)) {
              console.log('🔍 DEBUG: Checking for artifact creation in function results:', claudeResponse.metadata.function_results.map((fr: EnhancedFunctionResult) => fr.function || 'unknown'));
              
              const hasArtifactCreation = claudeResponse.metadata.function_results.some((fr: EnhancedFunctionResult) => 
                (fr.function === 'create_form_artifact' || 
                fr.function === 'create_document_artifact' ||
                fr.function === 'generate_proposal_artifact' ||
                fr.function === 'update_form_data' ||
                fr.function === 'update_form_artifact')
              );
              
              console.log('🔍 DEBUG: hasArtifactCreation:', hasArtifactCreation, 'artifactRefs length:', artifactRefs.length);
              
              if (hasArtifactCreation) {
                console.log('🔄 Artifact creation detected, refreshing artifacts for session:', activeSessionId);
                
                // Trigger artifact refresh via postMessage to Home component
                window.postMessage({ 
                  type: 'ARTIFACT_REFRESH_NEEDED',
                  sessionId: activeSessionId,
                  timestamp: new Date().toISOString()
                }, '*');
              }
            }
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
                  lastAiMessage.metadata || {}, // Use message metadata which may contain toolInvocations
                  { is_streaming: true, stream_complete: true }, // Metadata indicating this was a streaming response
                  lastAiMessage.artifactRefs // Pass any artifact references
                );
                console.log('AI message saved after streaming cleanup:', savedAiMessage);
                await loadUserSessions();
                
                // 🔄 ARTIFACT REFRESH: Check if any tools were executed and refresh artifacts
                if (lastAiMessage.artifactRefs && lastAiMessage.artifactRefs.length > 0) {
                  console.log('🔄 Artifact references found in cleanup, refreshing artifacts for session:', activeSessionId);
                  
                  // Trigger artifact refresh via postMessage to Home component
                  window.postMessage({ 
                    type: 'ARTIFACT_REFRESH_NEEDED',
                    sessionId: activeSessionId,
                    timestamp: new Date().toISOString()
                  }, '*');
                }
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
          case 'service_down':
            errorMessage = `🔧 Our AI service is temporarily down for maintenance. Please try again in a few minutes. Your message has been saved and will be processed once service is restored.`;
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
    handleAgentChanged: (agent: SessionActiveAgent) => Message | null,
    loadSessionArtifacts: (sessionId: string) => Promise<Artifact[] | undefined>
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
      loadSessionArtifacts, // Add the required parameter
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

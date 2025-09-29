// Copyright Mark Skiba, 2025 All rights reserved
// Enhanced Message Handling Hook with Unified Claude Service and Tool Transparency

import { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import { SessionActiveAgent, UserProfile, Message as DatabaseMessage } from '../types/database';
import DatabaseService from '../services/database';
import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import { SmartAutoPromptManager } from '../utils/smartAutoPromptManager';
import { categorizeError } from '../components/APIErrorHandler';
import { ToolInvocationEvent, StreamingResponse, ClientCallback } from '../types/streamingProtocol';

// Enhanced message handling with tool transparency
export const useEnhancedMessageHandling = () => {
  // DISABLED FOR COMPILATION - Interface mismatch with ClaudeService
  return {
    handleMessage: () => { throw new Error('useEnhancedMessageHandling disabled - use useMessageHandling instead'); },
    isLoading: false,
    error: null
  };
  console.log('🚨🚨🚨 ENHANCED MESSAGE HANDLING HOOK LOADED 🚨🚨🚨');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  
  // Tool transparency state
  const [toolInvocations, setToolInvocations] = useState<ToolInvocationEvent[]>([]);
  const [isToolExecutionActive, setIsToolExecutionActive] = useState(false);
  const [streamingText, setStreamingText] = useState<string>('');
  
  // Client callback handlers
  const [clientCallbacks, setClientCallbacks] = useState<ClientCallback[]>([]);
  
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.log('🧹 Cleaning up enhanced message handling');
        abortControllerRef.current.abort('Component unmounted');
        abortControllerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, []);

  // Tool transparency event handlers
  const handleToolInvocation = useCallback((toolEvent: ToolInvocationEvent) => {
    console.log(`🔧 Tool ${toolEvent.type}: ${toolEvent.toolName}`);
    
    setToolInvocations(prev => [...prev, toolEvent]);
    
    if (toolEvent.type === 'tool_start') {
      setIsToolExecutionActive(true);
    } else if (toolEvent.type === 'tool_complete' || toolEvent.type === 'tool_error') {
      // Check if all tools are complete
      setToolInvocations(current => {
        const activeTools = current.filter(t => 
          t.type === 'tool_start' || t.type === 'tool_progress'
        );
        if (activeTools.length <= 1) { // This completion event makes it 0
          setIsToolExecutionActive(false);
        }
        return current;
      });
    }
  }, []);

  const handleStreamingText = useCallback((text: string) => {
    setStreamingText(prev => prev + text);
  }, []);

  const handleClientCallback = useCallback((callback: ClientCallback) => {
    console.log(`📞 Client callback: ${callback.type} -> ${callback.target}`);
    setClientCallbacks(prev => [...prev, callback]);
    
    // Process callback based on type
    switch (callback.type) {
      case 'rfp_created':
        // Handle RFP creation notification
        console.log('✅ RFP created successfully:', callback.payload);
        break;
      case 'ui_refresh':
        // Handle UI refresh requests
        console.log('🔄 UI refresh requested:', callback.target);
        break;
      case 'state_update':
        // Handle state updates
        console.log('📊 State update:', callback.payload);
        break;
      case 'notification':
        // Handle notifications
        console.log('🔔 Notification:', callback.payload);
        break;
    }
  }, []);

  const handleComplete = useCallback((metadata: any) => {
    console.log('✅ Enhanced streaming completed:', metadata);
    setIsToolExecutionActive(false);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('❌ Enhanced streaming error:', error);
    setIsToolExecutionActive(false);
  }, []);

  // Enhanced message sending with tool transparency
  const handleEnhancedSendMessage = async (
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
      console.log('⚠️ Message processing already in progress, skipping');
      return;
    }

    // Set processing flag
    isProcessingRef.current = true;

    // Reset tool transparency state
    setToolInvocations([]);
    setIsToolExecutionActive(false);
    setStreamingText('');
    setClientCallbacks([]);

    // Check if there's already an active request and abort it safely
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      console.log('🛑 Aborting previous request for new enhanced request');
      abortControllerRef.current.abort('New enhanced request started');
    }

    // Create new abort controller for this request
    const timestamp = Date.now();
    abortControllerRef.current = new AbortController();
    const thisRequestController = abortControllerRef.current;
    const requestId = `enhanced_req_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🚀 Starting enhanced message processing: ${requestId}`);

    const newMessage: Message = {
      id: uuidv4(),
      content,
      isUser: true,
      timestamp: new Date(),
      agentName: currentAgent?.agent_name,
      artifactRefs: []
    };

    try {
      // Add user message to UI immediately
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(true);

      let sessionId = currentSessionId;

      if (isAuthenticated && userId) {
        // Authenticated user: use database session management
        if (!sessionId) {
          const newSessionId = await createNewSession(currentAgent, currentRfp?.id);
          if (!newSessionId) {
            throw new Error('Failed to create new session');
          }
          sessionId = newSessionId;
          setCurrentSessionId(sessionId);
          setSelectedSessionId(sessionId);
          await loadUserSessions();
        }

        // Store user message in database
        if (!userProfile) {
          throw new Error('User profile required');
        }
        await DatabaseService.addMessage(
          sessionId,
          userProfile.supabase_user_id,
          newMessage.content,
          'user',
          currentAgent?.agent_id,
          currentAgent?.agent_name
        );
      } else {
        // Anonymous user: use local session management
        if (!sessionId) {
          // Generate a local session ID for anonymous users
          sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setCurrentSessionId(sessionId);
          setSelectedSessionId(sessionId);
        }
        // Skip database operations for anonymous users - messages are only in local state
      }

      // Get conversation context
      let contextMessages: { role: 'user' | 'assistant'; content: string }[] = [];
      
      if (isAuthenticated && userId) {
        // Authenticated user: get conversation history from database
        const conversationHistory = await DatabaseService.getSessionMessages(sessionId);
        contextMessages = conversationHistory.slice(-50).map((msg: DatabaseMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
      } else {
        // Anonymous user: use local message history from state
        contextMessages = messages.slice(-50).map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      }

      // Get current agent details with system prompt
      if (!currentAgent?.agent_id) {
        throw new Error('No current agent available');
      }
      const agentDetails = await AgentService.getAgentById(currentAgent.agent_id);
      if (!agentDetails) {
        throw new Error('Current agent not found');
      }

      console.log(`🤖 Using agent: ${agentDetails.name} (ID: ${agentDetails.id})`);

      // Prepare enhanced system prompt
      let systemPrompt = agentDetails.instructions || '';
      
      // Add RFP context if available
      if (currentRfp) {
        systemPrompt += `\n\nCURRENT RFP CONTEXT:\n- RFP ID: ${currentRfp.id}\n- Name: ${currentRfp.name}\n- Description: ${currentRfp.description}`;
      }

      // Add artifact context if available
      if (currentArtifact) {
        systemPrompt += `\n\nCURRENT ARTIFACT CONTEXT:\n- Artifact ID: ${currentArtifact.id}\n- Name: ${currentArtifact.name}\n- Type: ${currentArtifact.type}`;
      }

      // Get available tools for current agent (hardcoded for now)
      const tools: any[] = []; // TODO: Implement getToolsForAgent method
      console.log('🛠️ Available tools for agent:', agentDetails.name, 'tools:', tools.length);

      // Call unified Claude service with streaming and tool transparency
      console.log('🌊 Calling unified Claude service with enhanced streaming...');
      
      const streamingResponse = await ClaudeService.generateResponse({
        messages: contextMessages,
        system: systemPrompt,
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        tools: tools,
        sessionContext: {
          sessionId: sessionId,
          agentId: currentAgent?.agent_id,
          userId: userId,
          currentRfpId: currentRfp?.id,
          currentArtifactId: currentArtifact?.id
        },
        onToolInvocation: handleToolInvocation,
        onClientCallback: handleClientCallback,
        onStreamingText: handleStreamingText,
        onComplete: handleComplete,
        onError: handleError
      });

      if (!streamingResponse.success) {
        throw new Error(streamingResponse.error || 'Enhanced streaming failed');
      }

      // Create Claude response message with final streaming text
      const claudeResponseMessage: Message = {
        id: uuidv4(),
        content: streamingText || 'Response completed with tool execution transparency',
        isUser: false,
        timestamp: new Date(),
        agentName: currentAgent?.agent_name,
        artifactRefs: [],
        metadata: {
          model: 'claude-sonnet-4-20250514',
          toolsUsed: streamingResponse.toolInvocations.map(t => t.toolName),
          executionTime: streamingResponse.metadata?.executionTime,
          tokenUsage: streamingResponse.metadata?.tokenUsage
        }
      };

      // Add Claude response to UI
      setMessages(prev => [...prev, claudeResponseMessage]);

      // Store Claude response in database (authenticated users only)
      if (isAuthenticated && userId && userProfile) {
        await DatabaseService.addMessage(
          sessionId,
          userProfile.supabase_user_id,
          claudeResponseMessage.content,
          'assistant',
          currentAgent?.agent_id,
          currentAgent?.agent_name,
          claudeResponseMessage.metadata
        );
      }
      // Anonymous users: skip database storage, message is only in local UI state

      console.log(`✅ Enhanced message processing completed: ${requestId}`);
      console.log(`🔧 Tools used: ${streamingResponse.toolInvocations.map(t => t.toolName).join(', ')}`);

    } catch (error) {
      console.error(`❌ Enhanced message processing error: ${requestId}`, error);
      
      // Handle error with categorization
      const categorized = categorizeError(error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        content: `Enhanced processing error: ${categorized.message}`,
        isUser: false,
        timestamp: new Date(),
        agentName: currentAgent?.agent_name,
        artifactRefs: []
      };

      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
      
      // Reset streaming state
      setTimeout(() => {
        setStreamingText('');
        setIsToolExecutionActive(false);
      }, 2000); // Keep tool transparency visible for 2 seconds after completion
    }
  };

  // Cancel request function
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      console.error('🚨 ABORT REASON: User cancelled request', {
        stackTrace: new Error().stack
      });
      console.log('🚫 MANUAL CANCELLATION: Cancelling Claude request...');
      abortControllerRef.current.abort('User cancelled request');
      abortControllerRef.current = null;
      
      // Reset processing flag on cancellation
      isProcessingRef.current = false;
      setIsToolExecutionActive(false);
      setStreamingText('');
    } else {
      console.log('🚫 MANUAL CANCELLATION: No active request to cancel');
    }
  };

  // Send auto-prompt function (simplified for enhanced version)
  const sendAutoPrompt = async (
    formName: string,
    formData: Record<string, unknown>,
    messages: Message[],
    setMessages: (updater: (prev: Message[]) => Message[]) => void,
    setIsLoading: (loading: boolean) => void,
    currentSessionId: string | undefined,
    setCurrentSessionId: (id: string) => void,
    setSelectedSessionId: (id: string) => void,
    createNewSession: any,
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
      formData,
      currentRfp ? { status: 'unknown', phase: 'unknown' } : undefined,
      messages
    );

    if (!decision.shouldSend) {
      console.log(`⏭️ Skipping auto-prompt: ${decision.reason}`);
      return;
    }

    // Create auto-prompt message
    const autoPromptMessage = decision.prompt || `Form "${formName}" has been submitted. Please continue with the next steps.`;

    await handleEnhancedSendMessage(
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
      handleAgentChanged
    );
  };

  return {
    handleEnhancedSendMessage,
    toolInvocations,
    isToolExecutionActive,
    streamingText,
    clientCallbacks,
    cancelRequest,
    sendAutoPrompt,
    // Legacy compatibility
    handleSendMessage: handleEnhancedSendMessage
  };
};

export default useEnhancedMessageHandling;
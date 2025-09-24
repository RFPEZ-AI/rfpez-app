// Copyright Mark Skiba, 2025 All rights reserved

import { useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import { SessionActiveAgent, UserProfile } from '../types/database';
import DatabaseService from '../services/database';
import { ClaudeService } from '../services/claudeServiceV2';
import { AgentService } from '../services/agentService';
import { SmartAutoPromptManager } from '../utils/smartAutoPromptManager';
import { categorizeError } from '../components/APIErrorHandler';

export const useMessageHandling = () => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef<boolean>(false); // Add processing guard
  
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
      metadata.function_results.forEach((func: unknown) => {
        if (typeof func === 'object' && func !== null) {
          const funcObj = func as Record<string, unknown>;
          const result = funcObj.result as Record<string, unknown>;
          
          // Handle different types of function results
          if (result && result.success) {
            if (funcObj.function === 'create_form_artifact' && (result.artifact_id || result.template_schema)) {
              // Form artifacts
              refs.push({
                artifactId: result.artifact_id as string || `template-${Date.now()}`,
                artifactName: result.template_name as string || result.title as string || 'Generated Template',
                artifactType: 'form',
                isCreated: true,
                displayText: result.template_name as string || result.title as string
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
            }
          }
        }
      });
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
            activeSessionId = newSessionId;
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
        
        const onStreamingChunk = (chunk: string, isComplete: boolean, toolProcessing?: boolean) => {
          console.log('📡 onStreamingChunk called:', {
            chunkLength: chunk.length,
            chunkPreview: chunk.substring(0, 30) + '...',
            isComplete,
            toolProcessing,
            streamingCompleted,
            isWaitingForToolCompletion
          });
          
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
              
            } else {
              streamingCompleted = true;
              console.log('✅ Streaming phase complete for message:', aiMessageId);
              
              // Remove tool processing message if it exists
              if (toolProcessingMessageId) {
                setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
                toolProcessingMessageId = null;
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
              isWaitingForToolCompletion,
              toolProcessingMessageId
            });
            
            // Remove tool processing message
            if (toolProcessingMessageId) {
              setMessages(prev => prev.filter(msg => msg.id !== toolProcessingMessageId));
              toolProcessingMessageId = null;
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
            
            setMessages(prev => [...prev, continuationMessage]);
            
            // Switch to new message for further streaming
            aiMessageId = continuationMessageId;
            isWaitingForToolCompletion = false;
            streamingBuffer = '';
            lastUpdateTime = Date.now();
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

        // FIXED: Always use streaming with proper tool handling
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
          true, // ALWAYS use streaming with correct tool handling
          onStreamingChunk // Stream callback
        );
        
        console.log('=== CLAUDE RESPONSE DEBUG ===');
        console.log('1. Raw response content:', claudeResponse.content.substring(0, 200) + '...');
        console.log('2. Response has metadata:', !!claudeResponse.metadata);
        console.log('3. Was streaming:', claudeResponse.metadata.is_streaming);
        console.log('4. Stream complete:', claudeResponse.metadata.stream_complete);
        console.log('5. Functions executed:', claudeResponse.metadata.functions_called);
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
              const newAgent = await AgentService.getSessionActiveAgent(activeSessionId);
              if (newAgent) {
                console.log('UI refresh after agent switch - loaded agent:', newAgent.agent_name);
                const agentMessage = handleAgentChanged(newAgent);
                if (agentMessage) {
                  setMessages(prev => [...prev, agentMessage]);
                }
              } else {
                console.warn('No agent found after switch, retrying...');
                await new Promise(resolve => setTimeout(resolve, 300));
                const retryAgent = await AgentService.getSessionActiveAgent(activeSessionId);
                if (retryAgent) {
                  const agentMessage = handleAgentChanged(retryAgent);
                  if (agentMessage) {
                    setMessages(prev => [...prev, agentMessage]);
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
  };  return {
    handleSendMessage,
    sendAutoPrompt,
    cancelRequest
  };
};

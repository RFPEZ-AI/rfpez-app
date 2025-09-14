// Copyright Mark Skiba, 2025 All rights reserved

import { useRef } from 'react';
import { Message, ArtifactReference } from '../types/home';
import { RFP } from '../types/rfp';
import { SessionActiveAgent, UserProfile } from '../types/database';
import DatabaseService from '../services/database';
import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import { categorizeError } from '../components/APIErrorHandler';

export const useMessageHandling = () => {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Helper function to generate artifact references from Claude metadata
  const generateArtifactReferences = (metadata: Record<string, unknown>): ArtifactReference[] => {
    const refs: ArtifactReference[] = [];
    
    // Handle function results that contain forms/templates
    if (metadata.function_results && Array.isArray(metadata.function_results)) {
      metadata.function_results.forEach((func: unknown) => {
        if (typeof func === 'object' && func !== null) {
          const funcObj = func as Record<string, unknown>;
          const result = funcObj.result as Record<string, unknown>;
          
          // Handle form creation results
          if (result && (result.artifact_id || result.template_schema)) {
            refs.push({
              artifactId: result.artifact_id as string || `template-${Date.now()}`,
              artifactName: result.template_name as string || result.title as string || 'Generated Template',
              artifactType: 'form',
              isCreated: true,
              displayText: result.template_name as string || result.title as string
            });
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
    createNewSession: (agent: SessionActiveAgent | null) => Promise<string | null>,
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
    console.log('=== SENDING MESSAGE ===');
    console.log('Message content:', content);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    let activeSessionId = currentSessionId;

    try {
      // For authenticated users, save to Supabase
      if (isAuthenticated && userId) {
        console.log('Authenticated user sending message, currentSessionId:', activeSessionId);
        
        // Create session if none exists
        if (!activeSessionId) {
          console.log('No current session, creating new one...');
          const newSessionId = await createNewSession(currentAgent);
          if (newSessionId) {
            activeSessionId = newSessionId;
            setCurrentSessionId(newSessionId);
            setSelectedSessionId(newSessionId);
            console.log('New session created with ID:', newSessionId);
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
          .map(msg => ({
            role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.content
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
          abortControllerRef.current?.signal
        );
        
        console.log('=== CLAUDE RESPONSE DEBUG ===');
        console.log('1. Raw response content:', claudeResponse.content.substring(0, 200) + '...');
        console.log('2. Response has metadata:', !!claudeResponse.metadata);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: claudeResponse.content,
          isUser: false,
          timestamp: new Date(),
          agentName: agentForResponse.agent_name
        };
        
        // Process Claude response metadata for artifacts and create artifact references
        console.log('Claude response metadata:', claudeResponse.metadata);
        
        // Generate artifact references for the AI message
        const artifactRefs = generateArtifactReferences(claudeResponse.metadata);
        if (artifactRefs.length > 0) {
          aiMessage.artifactRefs = artifactRefs;
        }
        
        setMessages(prev => [...prev, aiMessage]);

        // Process Claude response metadata for artifacts with message ID
        addClaudeArtifacts(claudeResponse.metadata, aiMessage.id);

        setIsLoading(false);

        // Check if an agent switch occurred during the Claude response
        if (claudeResponse.metadata.agent_switch_occurred) {
          console.log('Agent switch detected via Claude function, refreshing UI...');
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
              agentForResponse.agent_id,
              agentForResponse.agent_name,
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
        console.error('Claude API Error:', claudeError);
        setIsLoading(false);
        
        // Check if this was a cancellation
        if (claudeError instanceof Error && claudeError.message === 'Request was cancelled') {
          console.log('Request was cancelled by user');
          return; // Don't show error message for cancelled requests
        }
        
        // Categorize the error for better user messaging
        const categorizedError = categorizeError(claudeError);
        
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
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      console.log('Cancelling Claude request...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    handleSendMessage,
    cancelRequest
  };
};

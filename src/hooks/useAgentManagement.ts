// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect, useCallback } from 'react';
import { Agent, SessionActiveAgent } from '../types/database';
import { AgentService } from '../services/agentService';
import { DatabaseService } from '../services/database';
import { Message } from '../types/home';

export const useAgentManagement = (sessionId: string | null = null) => {
  const [currentAgent, setCurrentAgent] = useState<SessionActiveAgent | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showAgentsMenu, setShowAgentsMenu] = useState(false);

  // Load agents for menu
  useEffect(() => {
    AgentService.debugAgents();
    AgentService.getActiveAgents().then(setAgents);
  }, []);

  const loadDefaultAgentWithPrompt = useCallback(async (): Promise<Message | null> => {
    console.log('🎯 loadDefaultAgentWithPrompt: Starting...');
    try {
      const defaultAgent = await AgentService.getDefaultAgent();
      console.log('🎯 loadDefaultAgentWithPrompt: Default agent fetched:', defaultAgent?.name);
      
      if (defaultAgent) {
        const sessionActiveAgent: SessionActiveAgent = {
          agent_id: defaultAgent.id,
          agent_name: defaultAgent.name,
          agent_instructions: defaultAgent.instructions,
          agent_initial_prompt: defaultAgent.initial_prompt,
          agent_avatar_url: defaultAgent.avatar_url
        };
        
        console.log('🎯 loadDefaultAgentWithPrompt: Setting currentAgent state to:', sessionActiveAgent.agent_name);
        setCurrentAgent(sessionActiveAgent);
        console.log('🎯 loadDefaultAgentWithPrompt: currentAgent state set successfully');
        
        // 🚨 CRITICAL: Only persist agent to database if we have a VALID session
        // During new session creation, sessionId may contain stale OLD session ID
        // We skip the database update to prevent restoring old session state
        if (sessionId) {
          console.log('⚠️ Skipping database session context update during new session preparation');
          console.log('📌 Session ID would have been:', sessionId, '(likely stale from closure)');
          // await DatabaseService.updateSessionContext(sessionId, {
          //   current_agent_id: defaultAgent.id
          // });
        }
        
        console.log('Loaded default agent with prompt:', sessionActiveAgent);
        console.log('🔍 DEBUG: defaultAgent.initial_prompt exists?', !!defaultAgent.initial_prompt);
        console.log('🔍 DEBUG: sessionId:', sessionId);

        // 🎭 DYNAMIC WELCOME: Process initial_prompt through edge function with streaming
        // This allows the agent to search memory across sessions and personalize the welcome
        if (defaultAgent.initial_prompt) {
          console.log('🌊 Processing initial_prompt with streaming agent continuation...');
          console.log('🔍 DEBUG: About to import ClaudeService...');
          
          // Import ClaudeService to trigger initial prompt processing
          const { ClaudeService } = await import('../services/claudeService');
          console.log('🔍 DEBUG: ClaudeService imported, calling processInitialPrompt...');
          
          try {
            // Call edge function with processInitialPrompt=true
            // This triggers the same streaming continuation logic used for agent switches
            const dynamicWelcome = await ClaudeService.processInitialPrompt(defaultAgent, sessionId || undefined, undefined);
            console.log('🔍 DEBUG: processInitialPrompt returned:', dynamicWelcome?.substring(0, 100));
            
            const initialMessage: Message = {
              id: `agent-greeting-${defaultAgent.id}-${Date.now()}`,
              content: dynamicWelcome,
              isUser: false,
              timestamp: new Date(),
              agentName: defaultAgent.name
            };
            
            console.log('✅ Created dynamic agent greeting from initial_prompt');
            return initialMessage;
          } catch (error) {
            console.error('❌ Failed to process initial_prompt, using simple fallback:', error);
            // Fallback to simple welcome if processing fails
            const simpleWelcome = `Welcome! I'm your ${defaultAgent.name}, here to help with procurement and sourcing.`;
            return {
              id: `agent-greeting-${defaultAgent.id}-${Date.now()}`,
              content: simpleWelcome,
              isUser: false,
              timestamp: new Date(),
              agentName: defaultAgent.name
            };
          }
        } else {
          // No initial_prompt defined, use simple static welcome
          const simpleWelcome = `Welcome to **EZRFP.APP**! 👋\n\nI'm your ${defaultAgent.name}, here to help you streamline your procurement process.`;
          
          const initialMessage: Message = {
            id: `agent-greeting-${defaultAgent.id}-${Date.now()}`,
            content: simpleWelcome,
            isUser: false,
            timestamp: new Date(),
            agentName: defaultAgent.name
          };
          
          console.log('Created simple agent greeting (no initial_prompt)');
          return initialMessage;
        }
      } else {
        console.error('❌ loadDefaultAgentWithPrompt: No default agent found from AgentService.getDefaultAgent()');
      }
    } catch (error) {
      console.error('❌ loadDefaultAgentWithPrompt: Exception caught:', error);
    }
    
    console.log('🎯 loadDefaultAgentWithPrompt: Returning null (no agent loaded)');
    return null;
    
    /* OLD APPROACH - Commented out, now handled by edge function agent continuation
    const { ClaudeService} = await import('../services/claudeService');
    const dynamicWelcome = await ClaudeService.processInitialPrompt(defaultAgent, sessionId, userProfile);
    return { id: 'initial-prompt', content: dynamicWelcome, isUser: false, timestamp: new Date(), agentName: defaultAgent.name };
    */
  }, [sessionId]); // Only depends on sessionId

  const loadSessionAgent = async (sessionId: string) => {
    console.log('🔄 loadSessionAgent called with sessionId:', sessionId);
    
    // Guard: Don't load if sessionId is invalid
    if (!sessionId || typeof sessionId !== 'string') {
      console.error('❌ loadSessionAgent: Invalid sessionId provided:', sessionId);
      return;
    }
    
    try {
      const agent = await AgentService.getSessionActiveAgent(sessionId);
      console.log('✅ Agent data received from service:', agent);
      
      if (!agent) {
        console.warn('⚠️ No agent returned from AgentService.getSessionActiveAgent');
        console.warn('💡 This could indicate:');
        console.warn('  1. Database query returned no results');
        console.warn('  2. RPC function get_session_active_agent failed');
        console.warn('  3. Network/Supabase connectivity issue');
        console.warn('  4. Session has no active agent assigned');
        console.warn('⚠️ NOT clearing current agent - keeping existing agent state');
        
        // CRITICAL: Don't set agent to null if we don't have one
        // This prevents clearing the default agent when switching to a new session
        // Show user-friendly error in UI
        // TODO: Add toast notification here
        return; // Exit early without clearing agent
      } else {
        console.log('✅ Setting currentAgent state with:', {
          agent_id: agent.agent_id,
          agent_name: agent.agent_name
        });
        // Only set agent if we got a valid agent from the database
        setCurrentAgent(agent);
        console.log('✅ setCurrentAgent called - state should update on next render');
      }
    } catch (error) {
      console.error('❌ CRITICAL: Failed to load session agent:', error);
      console.error('🔍 Error details:', {
        error,
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      
      // Show user-friendly error in UI  
      // TODO: Add toast notification here
    }
  };

  const handleAgentChanged = async (newAgent: SessionActiveAgent): Promise<Message | null> => {
    setCurrentAgent(newAgent);
    console.log('Agent changed to:', newAgent);
    
    try {
      // Persist agent to session context only (agents are session-based now)
      if (sessionId) {
        await DatabaseService.updateSessionContext(sessionId, {
          current_agent_id: newAgent.agent_id
        });
      }
    } catch (error) {
      console.error('Failed to persist agent change:', error);
    }
    
    // 🎭 AGENT CONTINUATION: Initial prompt processing now handled by edge function streaming
    // When agent switch occurs, the edge function processes initial_prompt and streams the response
    // No client-side processing needed - this function is obsolete
    console.log('⚠️ createAgentSwitchMessage called - this is now handled by edge function agent continuation');
    return null;
    
    /* OLD APPROACH - Commented out, replaced by streaming agent continuation in edge function
    if (newAgent.agent_initial_prompt) {
      const dynamicWelcome = await ClaudeService.processInitialPrompt(agentForProcessing, sessionId, userProfile);
      return { id: `agent-greeting-${newAgent.agent_id}-${Date.now()}`, content: dynamicWelcome, isUser: false, timestamp: new Date(), agentName: newAgent.agent_name };
    }
    */
  };

  const handleNewAgent = () => {
    setEditingAgent(null);
    setShowAgentModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentModal(true);
  };

  const handleDeleteAgent = async (agent: Agent) => {
    await AgentService.deleteAgent(agent.id);
    setAgents(await AgentService.getActiveAgents());
  };

  const handleSaveAgent = async (agentData: Partial<Agent>) => {
    try {
      if (editingAgent) {
        const result = await AgentService.updateAgent(editingAgent.id, agentData);
        if (!result) {
          console.error('Failed to update agent:', editingAgent.id);
        }
      } else {
        const result = await AgentService.createAgent(agentData as Omit<Agent, 'id' | 'created_at' | 'updated_at'>);
        if (!result) {
          console.error('Failed to create agent');
        }
      }
      setAgents(await AgentService.getActiveAgents());
      setShowAgentModal(false);
    } catch (error) {
      console.error('Error in handleSaveAgent:', error);
      setAgents(await AgentService.getActiveAgents());
      setShowAgentModal(false);
    }
  };

  const handleCancelAgent = () => setShowAgentModal(false);

  const handleShowAgentSelector = () => {
    setShowAgentSelector(true);
  };

  return {
    currentAgent,
    setCurrentAgent,
    showAgentSelector,
    setShowAgentSelector,
    agents,
    setAgents,
    showAgentModal,
    setShowAgentModal,
    editingAgent,
    setEditingAgent,
    showAgentsMenu,
    setShowAgentsMenu,
    loadDefaultAgentWithPrompt,
    loadSessionAgent,
    handleAgentChanged,
    handleNewAgent,
    handleEditAgent,
    handleDeleteAgent,
    handleSaveAgent,
    handleCancelAgent,
    handleShowAgentSelector
  };
};

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
    try {
      const defaultAgent = await AgentService.getDefaultAgent();
      if (defaultAgent) {
        const sessionActiveAgent: SessionActiveAgent = {
          agent_id: defaultAgent.id,
          agent_name: defaultAgent.name,
          agent_instructions: defaultAgent.instructions,
          agent_initial_prompt: defaultAgent.initial_prompt,
          agent_avatar_url: defaultAgent.avatar_url
        };
        setCurrentAgent(sessionActiveAgent);
        
        // Persist agent to session context only (agents are session-based now)
        if (sessionId) {
          await DatabaseService.updateSessionContext(sessionId, {
            current_agent_id: defaultAgent.id
          });
        }
        
        console.log('Loaded default agent with prompt:', sessionActiveAgent);

        // 🎭 DYNAMIC WELCOME: Process initial_prompt through Claude for dynamic greeting
        const { ClaudeService } = await import('../services/claudeService');
        const userProfile = await DatabaseService.getUserProfile();
        
        const dynamicWelcome = await ClaudeService.processInitialPrompt(
          defaultAgent,
          sessionId || undefined,
          userProfile || undefined
        );

        // Return the dynamic welcome message
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: dynamicWelcome,
          isUser: false,
          timestamp: new Date(),
          agentName: defaultAgent.name
        };
        console.log('Created dynamic welcome message:', dynamicWelcome.substring(0, 100) + '...');
        return initialMessage;
      }
    } catch (error) {
      console.error('Failed to load default agent with prompt:', error);
    }
    return null;
  }, [sessionId]); // Only depends on sessionId

  const loadSessionAgent = async (sessionId: string) => {
    try {
      const agent = await AgentService.getSessionActiveAgent(sessionId);
      setCurrentAgent(agent);
      console.log('Loaded session agent:', agent);
    } catch (error) {
      console.error('Failed to load session agent:', error);
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
    
    // 🎭 DYNAMIC WELCOME: Process initial_prompt through Claude for context-aware greeting
    if (newAgent.agent_initial_prompt) {
      try {
        const { ClaudeService } = await import('../services/claudeService');
        const userProfile = await DatabaseService.getUserProfile();
        
        // Reconstruct partial Agent object for ClaudeService (only needed fields)
        const agentForProcessing = {
          id: newAgent.agent_id,
          name: newAgent.agent_name,
          instructions: newAgent.agent_instructions,
          initial_prompt: newAgent.agent_initial_prompt,
          avatar_url: newAgent.agent_avatar_url
        } as Agent;
        
        const dynamicWelcome = await ClaudeService.processInitialPrompt(
          agentForProcessing,
          sessionId || undefined,
          userProfile || undefined
        );

        const initialMessage: Message = {
          id: `agent-greeting-${newAgent.agent_id}-${Date.now()}`,
          content: dynamicWelcome,
          isUser: false,
          timestamp: new Date(),
          agentName: newAgent.agent_name
        };
        console.log('Created dynamic agent switch message:', dynamicWelcome.substring(0, 100) + '...');
        return initialMessage;
      } catch (error) {
        console.error('Failed to process initial prompt through Claude, using static:', error);
        // Fallback to static prompt on error
        const fallbackMessage: Message = {
          id: `agent-greeting-${newAgent.agent_id}-${Date.now()}`,
          content: newAgent.agent_initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: newAgent.agent_name
        };
        return fallbackMessage;
      }
    }
    return null;
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

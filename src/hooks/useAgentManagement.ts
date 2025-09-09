// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { Agent, SessionActiveAgent } from '../types/database';
import { AgentService } from '../services/agentService';
import { Message } from '../types/home';

export const useAgentManagement = () => {
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

  const loadDefaultAgentWithPrompt = async (): Promise<Message | null> => {
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
        console.log('Loaded default agent with prompt:', sessionActiveAgent);

        // Return the initial message to be displayed
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: defaultAgent.initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: defaultAgent.name
        };
        console.log('Created initial prompt message:', defaultAgent.initial_prompt);
        return initialMessage;
      }
    } catch (error) {
      console.error('Failed to load default agent with prompt:', error);
    }
    return null;
  };

  const loadSessionAgent = async (sessionId: string) => {
    try {
      const agent = await AgentService.getSessionActiveAgent(sessionId);
      setCurrentAgent(agent);
      console.log('Loaded session agent:', agent);
    } catch (error) {
      console.error('Failed to load session agent:', error);
    }
  };

  const handleAgentChanged = (newAgent: SessionActiveAgent): Message | null => {
    setCurrentAgent(newAgent);
    console.log('Agent changed to:', newAgent);
    
    // Return the agent's initial prompt message if available
    if (newAgent.agent_initial_prompt) {
      const initialMessage: Message = {
        id: `agent-greeting-${newAgent.agent_id}-${Date.now()}`,
        content: newAgent.agent_initial_prompt,
        isUser: false,
        timestamp: new Date(),
        agentName: newAgent.agent_name
      };
      return initialMessage;
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

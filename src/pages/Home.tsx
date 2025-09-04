// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import MainMenu from '../components/MainMenu';
import AgentsMenu from '../components/AgentsMenu';
import AgentEditModal from '../components/AgentEditModal';
import GenericMenu from '../components/GenericMenu';
import RFPEditModal, { RFPFormValues } from '../components/RFPEditModal';
import RFPPreviewModal from '../components/RFPPreviewModal';
import { RFPService } from '../services/rfpService';
import type { RFP } from '../types/rfp';
import AuthButtons from '../components/AuthButtons';
import SessionHistory from '../components/SessionHistory';
import SessionDialog from '../components/SessionDialog';
import ArtifactWindow from '../components/ArtifactWindow';
import AgentSelector from '../components/AgentSelector';
import AgentIndicator from '../components/AgentIndicator';
import { useSupabase } from '../context/SupabaseContext';
import { RoleService } from '../services/roleService';
import { useIsMobile } from '../utils/useMediaQuery';
import DatabaseService from '../services/database';
import { AgentService } from '../services/agentService';
import { ClaudeService } from '../services/claudeService';
import type { SessionActiveAgent, Agent } from '../types/database';

// Local interfaces for UI compatibility
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
}

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  agent_name?: string; // Name of the active agent for this session
}

interface Artifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'other';
  size: string;
  url?: string;
  content?: string;
}

const Home: React.FC = () => {
  const { user, session, loading: supabaseLoading, userProfile } = useSupabase();
  const isMobile = useIsMobile();
  const history = useHistory();
  
  // Derived authentication state
  const isAuthenticated = !!session;
  const userId = user?.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Agent-related state
  const [currentAgent, setCurrentAgent] = useState<SessionActiveAgent | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showAgentsMenu, setShowAgentsMenu] = useState(false);
  // RFP state only
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [showRFPMenu, setShowRFPMenu] = useState(false);
  const [showRFPModal, setShowRFPModal] = useState(false);
  const [showRFPPreviewModal, setShowRFPPreviewModal] = useState(false);
  const [editingRFP, setEditingRFP] = useState<RFP | null>(null);
  const [previewingRFP, setPreviewingRFP] = useState<RFP | null>(null);
  // Current RFP context for agents
  const [currentRfpId, setCurrentRfpId] = useState<number | null>(null);
  const [currentRfp, setCurrentRfp] = useState<RFP | null>(null);

  // Main menu handler
  const handleMainMenuSelect = (item: string) => {
    if (item === 'Agents') setShowAgentsMenu(true);
    if (item === 'RFP') setShowRFPMenu(true);
    if (item === 'Debug') history.push('/debug');
  };

  // Load data for menus
  useEffect(() => { RFPService.getAll().then(setRFPs); }, []);

  // RFP handlers
  const handleNewRFP = () => { setEditingRFP(null); setShowRFPModal(true); };
  const handleEditRFP = (rfp: RFP) => { setEditingRFP(rfp); setShowRFPModal(true); };
  const handlePreviewRFP = (rfp: RFP) => { setPreviewingRFP(rfp); setShowRFPPreviewModal(true); };
  const handleShareRFP = async (rfp: RFP) => {
    const formUrl = `${window.location.origin}/rfp/${rfp.id}/bid`;
    try {
      await navigator.clipboard.writeText(formUrl);
      // You could add a toast notification here if you want
      console.log('RFP bid form URL copied to clipboard:', formUrl);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show an alert with the URL
      alert(`RFP Bid Form URL: ${formUrl}`);
    }
  };
  const handleDeleteRFP = async (rfp: RFP) => { await RFPService.delete(rfp.id); setRFPs(await RFPService.getAll()); };
  const handleSaveRFP = async (formData: Partial<RFPFormValues>) => {
    try {
      console.log('💾 Saving RFP with form data:', formData);
      
      // Convert form values to RFP data structure
      const rfpData: Partial<RFP> = {
        ...formData,
        // Ensure required fields have values
        description: formData.description || 'No description provided',
        specification: formData.specification || 'No specification provided'
      };
      
      console.log('💾 Converted RFP data for database:', rfpData);
      
      let result: RFP | null = null;
      if (editingRFP && editingRFP.id) {
        result = await RFPService.update(editingRFP.id, rfpData);
      } else {
        result = await RFPService.create(rfpData);
      }
      
      if (result) {
        console.log('✅ RFP saved successfully');
        setRFPs(await RFPService.getAll());
        setShowRFPModal(false);
      } else {
        console.error('❌ Failed to save RFP - service returned null');
        // You might want to show an error message to the user here
        alert('Failed to save RFP. Please check the console for details and ensure all required fields are filled.');
      }
    } catch (error) {
      console.error('❌ Error saving RFP:', error);
      alert('An error occurred while saving the RFP. Please try again.');
    }
  };
  const handleCancelRFP = () => setShowRFPModal(false);
  const handleClosePreview = () => setShowRFPPreviewModal(false);
  
  // RFP context management for agents
  const handleSetCurrentRfp = async (rfpId: number) => {
    try {
      const rfp = await RFPService.getById(rfpId);
      if (rfp) {
        setCurrentRfpId(rfpId);
        setCurrentRfp(rfp);
        console.log('Current RFP context set:', rfp.name, rfpId);
      }
    } catch (error) {
      console.error('Failed to load RFP for context:', error);
    }
  };
  
  const handleClearCurrentRfp = () => {
    setCurrentRfpId(null);
    setCurrentRfp(null);
    console.log('Current RFP context cleared');
  };
  // Load agents for menu
  useEffect(() => {
    AgentService.debugAgents(); // Debug current database state
    AgentService.getActiveAgents().then(setAgents);
  }, []);

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
          // Still refresh the agents list to show current state
        }
      } else {
        const result = await AgentService.createAgent(agentData as Omit<Agent, 'id' | 'created_at' | 'updated_at'>);
        if (!result) {
          console.error('Failed to create agent');
          // Still refresh the agents list to show current state
        }
      }
      setAgents(await AgentService.getActiveAgents());
      setShowAgentModal(false);
    } catch (error) {
      console.error('Error in handleSaveAgent:', error);
      // Still refresh the agents list and close modal to prevent UI issues
      setAgents(await AgentService.getActiveAgents());
      setShowAgentModal(false);
    }
  };
  const handleCancelAgent = () => setShowAgentModal(false);

  // Clear UI state when user logs out
  const clearUIState = () => {
    console.log('Clearing UI state for logout');
    setMessages([]);
    setSessions([]);
    setArtifacts([]);
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    setCurrentAgent(null);
  };

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    console.log('Session details:', session);
    console.log('User details:', user);
    console.log('UserProfile details:', userProfile);
    
    // If user logs out (no session), clear UI state and show default agent
    if (!isAuthenticated && !supabaseLoading) {
      console.log('User not authenticated, clearing UI state and loading default agent...');
      clearUIState();
      loadDefaultAgentWithPrompt();
      return;
    }
    
    // Always load default agent and show initial prompt, regardless of authentication
    if (!supabaseLoading) {
      console.log('Loading default agent for all users...');
      loadDefaultAgentWithPrompt();
    }
    
    // Check if we have basic authentication (session and user) for loading sessions
    if (isAuthenticated && !supabaseLoading && user) {
      console.log('User is authenticated, loading sessions...');
      loadUserSessions();
      
      // If we don't have a user profile yet, that's OK - the profile loading might be in progress
      if (!userProfile) {
        console.log('User profile not loaded yet, but proceeding with authenticated state');
      }
    } else {
      console.log('Not loading sessions because:', {
        isAuthenticated,
        supabaseLoading,
        hasUser: !!user,
        hasUserProfile: !!userProfile
      });
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile]);

  // Monitor session changes specifically for logout detection
  useEffect(() => {
    // If we had a session before but now we don't (logout scenario)
    if (!session && !supabaseLoading) {
      console.log('Session removed - user logged out, clearing UI state');
      clearUIState();
      // Load default agent after clearing state
      loadDefaultAgentWithPrompt();
    }
  }, [session, supabaseLoading]);

  // Load active agent when session changes
  useEffect(() => {
    if (currentSessionId && userId) {
      loadSessionAgent(currentSessionId);
    } else if (!currentSessionId && isAuthenticated && userId && messages.length === 0) {
      // Load default agent with initial prompt only if no messages yet
      loadDefaultAgentWithPrompt();
    }
  }, [currentSessionId, userId, isAuthenticated]);

  // Agent-related functions
  const loadDefaultAgentWithPrompt = async () => {
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

        // Display the initial prompt to start the conversation
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: defaultAgent.initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: defaultAgent.name
        };
        setMessages([initialMessage]);
        console.log('Displayed initial prompt:', defaultAgent.initial_prompt);
      }
    } catch (error) {
      console.error('Failed to load default agent with prompt:', error);
    }
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

  const handleAgentChanged = (newAgent: SessionActiveAgent) => {
    setCurrentAgent(newAgent);
    console.log('Agent changed to:', newAgent);
    
    // Always show the agent's initial prompt when switching agents
    if (newAgent.agent_initial_prompt) {
      const initialMessage: Message = {
        id: `agent-greeting-${newAgent.agent_id}-${Date.now()}`,
        content: newAgent.agent_initial_prompt,
        isUser: false,
        timestamp: new Date(),
        agentName: newAgent.agent_name
      };
      
      // Add the greeting message to the conversation
      setMessages(prevMessages => [...prevMessages, initialMessage]);
    }
  };

  const handleShowAgentSelector = () => {
    setShowAgentSelector(true);
  };

  // Load sessions from Supabase
  const loadUserSessions = async () => {
    if (!isAuthenticated || !userId) {
      console.log('User not authenticated or userId not available, skipping session load');
      return;
    }
    
    try {
      console.log('Attempting to load sessions from Supabase for user:', userId);
      const sessionsData = await DatabaseService.getUserSessions(userId);
      console.log('Sessions loaded:', sessionsData);
      const formattedSessions: Session[] = sessionsData.map(session => ({
        id: session.id,
        title: session.title,
        timestamp: new Date(session.updated_at),
        agent_name: session.agent_name
      }));
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId);
      const messagesData = await DatabaseService.getSessionMessages(sessionId);
      console.log('Raw messages data:', messagesData);
      const formattedMessages: Message[] = messagesData
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          agentName: msg.agent_name // Include agent name from database
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Ensure chronological order
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      
      // Load session artifacts
      const artifactsData = await DatabaseService.getSessionArtifacts(sessionId);
      const formattedArtifacts: Artifact[] = artifactsData.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.file_type as 'document' | 'image' | 'pdf' | 'other',
        size: artifact.file_size ? `${(artifact.file_size / 1024).toFixed(1)} KB` : 'Unknown'
      }));
      setArtifacts(formattedArtifacts);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  // Create a new session in Supabase with current agent
  const createNewSession = async (): Promise<string | null> => {
    console.log('Creating new session, auth state:', { isAuthenticated, user: !!user, userProfile: !!userProfile });
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or userId not available, skipping session creation');
      return null;
    }
    
    try {
      console.log('Attempting to create session in Supabase with current agent:', currentAgent?.agent_id);
      const session = await DatabaseService.createSessionWithAgent(
        userId, 
        'New Chat Session',
        currentAgent?.agent_id // Use current agent if available
      );
      console.log('Session created:', session);
      if (session) {
        await loadUserSessions(); // Refresh sessions list
        return session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  };

  const handleSendMessage = async (content: string) => {
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
      if (isAuthenticated && user) {
        console.log('Authenticated user sending message, currentSessionId:', activeSessionId);
        // Create session if none exists
        if (!activeSessionId) {
          console.log('No current session, creating new one...');
          const newSessionId = await createNewSession();
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
            currentAgent?.agent_id, // Include agent ID
            currentAgent?.agent_name // Include agent name
          );
          console.log('User message saved:', savedMessage);
          
          // Check if this is the first message in the session and update title
          const sessionMessages = await DatabaseService.getSessionMessages(activeSessionId);
          if (sessionMessages.length === 1) {
            // This is the first message, use it to generate a session title
            const sessionTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
            await DatabaseService.updateSession(activeSessionId, { title: sessionTitle });
            console.log('Updated session title to:', sessionTitle);
            // Refresh sessions list to show updated title
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
          .filter(msg => msg.id !== 'initial-prompt') // Skip initial prompts
          .map(msg => ({
            role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.content
          }))
          .slice(-10); // Keep last 10 messages for context
        
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
          activeSessionId, // Pass the active session ID to Claude
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
          } : null
        );
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: claudeResponse.content,
          isUser: false,
          timestamp: new Date(),
          agentName: agentForResponse.agent_name
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        // Check if an agent switch occurred during the Claude response
        if (claudeResponse.metadata.agent_switch_occurred) {
          console.log('Agent switch detected via Claude function, refreshing UI...');
          // Small delay to ensure database transaction has completed
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Refresh the current agent from database to update UI
          if (activeSessionId) {
            try {
              const newAgent = await AgentService.getSessionActiveAgent(activeSessionId);
              if (newAgent) {
                console.log('UI refresh after agent switch - loaded agent:', newAgent.agent_name);
                handleAgentChanged(newAgent);
              } else {
                console.warn('No agent found after switch, retrying...');
                // Retry once after additional delay
                await new Promise(resolve => setTimeout(resolve, 300));
                const retryAgent = await AgentService.getSessionActiveAgent(activeSessionId);
                if (retryAgent) {
                  handleAgentChanged(retryAgent);
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
              {}, // metadata
              claudeResponse.metadata // ai_metadata
            );
            console.log('AI message saved:', savedAiMessage);
            await loadUserSessions(); // Refresh to update last message
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        } else {
          console.log('AI response not saved - auth:', isAuthenticated, 'user:', !!user, 'sessionId:', activeSessionId);
        }
      } catch (claudeError) {
        console.error('Claude API Error:', claudeError);
        setIsLoading(false);
        
        // Fallback to a simple error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I apologize, but I'm having trouble connecting to my AI service right now. ${claudeError instanceof Error ? claudeError.message : 'Please try again later.'} You can still use the platform - your messages are being saved.`,
          isUser: false,
          timestamp: new Date(),
          agentName: currentAgent?.agent_name || 'System'
        };
        
        setMessages(prev => [...prev, errorMessage]);

        // Save error message to database if authenticated
        if (isAuthenticated && userId && activeSessionId) {
          try {
            await DatabaseService.addMessage(
              activeSessionId, 
              userId, 
              errorMessage.content, 
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

  const handleNewSession = async () => {
    // Clear the UI state
    setMessages([]);
    setArtifacts([]);
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    
    // Use the currently selected agent, or default if none selected
    if (isAuthenticated && userId) {
      if (currentAgent) {
        // Use the currently selected agent for the new session
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: currentAgent.agent_initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: currentAgent.agent_name
        };
        setMessages([initialMessage]);
        console.log('New session started with current agent:', currentAgent.agent_name);
      } else {
        // Fallback to default agent if no current agent is selected
        await loadDefaultAgentWithPrompt();
      }
    } else {
      // For non-authenticated users, load default agent
      await loadDefaultAgentWithPrompt();
    }
    
    console.log('New session started with initial prompt displayed');
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated, cannot delete session');
      return;
    }

    try {
      const success = await DatabaseService.deleteSession(sessionId);
      if (success) {
        console.log('Session deleted successfully:', sessionId);
        
        // If the deleted session was the current one, clear the UI
        if (currentSessionId === sessionId) {
          setMessages([]);
          setArtifacts([]);
          setSelectedSessionId(undefined);
          setCurrentSessionId(undefined);
        }
        
        // Refresh the sessions list
        await loadUserSessions();
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleAttachFile = async (file: File) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : 'document',
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
    setArtifacts(prev => [...prev, newArtifact]);

    // Save to Supabase if authenticated and session exists
    if (isAuthenticated && user && currentSessionId) {
      try {
        // Upload file to Supabase storage
        const storagePath = await DatabaseService.uploadFile(file, currentSessionId);
        if (storagePath) {
          await DatabaseService.addArtifact(
            currentSessionId,
            null, // Not linked to specific message
            file.name,
            file.type.includes('pdf') ? 'pdf' : 'document',
            file.size,
            storagePath,
            file.type
          );
        }
      } catch (error) {
        console.error('Failed to save artifact:', error);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* Left section - Logo and title */}
          <div slot="start" style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <img 
              src="/logo.svg" 
              alt="RFPEZ.AI" 
              style={{ height: '32px', marginRight: isMobile ? '6px' : '12px' }}
            />
            {!isMobile && (
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>RFPEZ.AI</span>
            )}
            {/* Main Menu - Only visible to developer and administrator roles */}
            {(() => {
              const shouldShowMenu = userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role);
              console.log('MainMenu visibility check:', {
                userRole: userProfile?.role,
                shouldShow: shouldShowMenu,
                isDeveloperOrHigher: userProfile?.role ? RoleService.isDeveloperOrHigher(userProfile.role) : false
              });
              return shouldShowMenu ? <MainMenu onSelect={handleMainMenuSelect} /> : null;
            })()}
            <GenericMenu
              items={rfps}
              getLabel={r => r.name || `RFP #${r.id}`}
              onNew={handleNewRFP}
              onEdit={handleEditRFP}
              onDelete={handleDeleteRFP}
              onPreview={handlePreviewRFP}
              onShare={handleShareRFP}
              onSetCurrent={(rfp) => rfp ? handleSetCurrentRfp(typeof rfp.id === 'string' ? parseInt(rfp.id) : rfp.id) : handleClearCurrentRfp()}
              currentItemId={currentRfpId || undefined}
              showPopover={showRFPMenu}
              setShowPopover={setShowRFPMenu}
              title="RFP"
            />
      <AgentsMenu
        agents={agents}
        onNew={handleNewAgent}
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
        // Only show popover if showAgentsMenu is true
        showPopover={showAgentsMenu}
        setShowPopover={setShowAgentsMenu}
      />
            {isAuthenticated && user && userProfile && !isMobile && (
              <span style={{ 
                fontSize: '12px', 
                marginLeft: '12px', 
                padding: '4px 8px',
                backgroundColor: 'var(--ion-color-success)',
                color: 'white',
                borderRadius: '12px'
              }}>
                Saved
              </span>
            )}
          </div>
      <AgentEditModal
        agent={editingAgent}
        isOpen={showAgentModal}
        onSave={handleSaveAgent}
        onCancel={handleCancelAgent}
      />
      <RFPEditModal
        rfp={editingRFP as RFP}
        isOpen={showRFPModal}
        onSave={handleSaveRFP}
        onCancel={handleCancelRFP}
      />
      
      <RFPPreviewModal
        isOpen={showRFPPreviewModal}
        onClose={handleClosePreview}
        rfp={previewingRFP}
      />
          
          {/* Center section - Agent Indicator */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: '0 8px',
            minWidth: 0 // Allow shrinking
          }}>
            <div style={{ maxWidth: '100%', textAlign: 'center' }}>
              <AgentIndicator
                agent={currentAgent}
                onSwitchAgent={handleShowAgentSelector}
                compact={true}
                showSwitchButton={true}
              />
              {currentRfp && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.7rem', 
                  color: 'var(--ion-color-primary)', 
                  backgroundColor: 'var(--ion-color-primary-tint)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-primary)',
                  display: 'inline-block',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📋 {currentRfp.name}
                </div>
              )}
            </div>
          </div>
          
          {/* Right section - Auth buttons */}
          <IonButtons slot="end">
            <AuthButtons />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ 
          height: 'calc(100vh - 56px)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* Main Layout */}
          <div style={{ 
            flex: 1, 
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Left Panel - Session History */}
            <SessionHistory
              sessions={sessions}
              onNewSession={handleNewSession}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              selectedSessionId={selectedSessionId}
            />

            {/* Center Panel - Dialog with integrated prompt */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SessionDialog
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onAttachFile={handleAttachFile}
                promptPlaceholder="chat here..."
              />
            </div>

            {/* Right Panel - Artifacts */}
            <ArtifactWindow
              artifacts={artifacts}
              onDownload={(artifact) => console.log('Download:', artifact)}
              onView={(artifact) => console.log('View:', artifact)}
            />
          </div>
        </div>

        {/* Agent Selector Modal */}
        <AgentSelector
          isOpen={showAgentSelector}
          onClose={() => setShowAgentSelector(false)}
          sessionId={currentSessionId || 'preview'} // Use 'preview' when no session
          supabaseUserId={userId || ''} // Pass empty string for non-authenticated users
          currentAgent={currentAgent}
          onAgentChanged={handleAgentChanged}
          hasProperAccountSetup={false} // TODO: Implement proper account setup check
          isAuthenticated={isAuthenticated} // Pass authentication status
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;

// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Message, ArtifactReference } from '../types/home';
import { SessionActiveAgent } from '../types/database';

// Import all our custom hooks
import { useHomeState } from '../hooks/useHomeState';
import { useSessionState } from '../hooks/useSessionState';
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useRFPManagement } from '../hooks/useRFPManagement';
import { useArtifactManagement } from '../hooks/useArtifactManagement';
import { useMessageHandling } from '../hooks/useMessageHandling';

// Import layout components
import HomeHeader from '../components/HomeHeader';
import HomeContent from '../components/HomeContent';
import HomeFooter from '../components/HomeFooter';

// Import modal components
import AgentEditModal from '../components/AgentEditModal';
import RFPEditModal from '../components/RFPEditModal';
import RFPPreviewModal from '../components/RFPPreviewModal';
import AgentSelector from '../components/AgentSelector';

const Home: React.FC = () => {
  const { user, session, loading: supabaseLoading, userProfile } = useSupabase();
  const history = useHistory();
  
  // Derived authentication state
  const isAuthenticated = !!session;
  const userId = user?.id;
  
  // Use our custom hooks
  const {
    isLoading,
    setIsLoading,
    selectedSessionId,
    setSelectedSessionId,
    currentSessionId,
    setCurrentSessionId
  } = useHomeState();

  const {
    sessions,
    messages,
    setMessages,
    loadUserSessions,
    loadSessionMessages,
    createNewSession,
    deleteSession,
    clearUIState
  } = useSessionState(userId, isAuthenticated);

  const {
    currentAgent,
    showAgentSelector,
    setShowAgentSelector,
    agents,
    showAgentModal,
    editingAgent,
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
  } = useAgentManagement();

  const {
    rfps,
    showRFPMenu,
    setShowRFPMenu,
    showRFPModal,
    showRFPPreviewModal,
    editingRFP,
    previewingRFP,
    currentRfpId,
    currentRfp,
    handleNewRFP,
    handleEditRFP,
    handlePreviewRFP,
    handleShareRFP,
    handleDeleteRFP,
    handleSaveRFP,
    handleCancelRFP,
    handleClosePreview,
    handleSetCurrentRfp,
    handleClearCurrentRfp
  } = useRFPManagement(userId);

  const {
    artifacts,
    selectedArtifact,
    selectArtifact,
    loadSessionArtifacts,
    handleAttachFile,
    addClaudeArtifacts,
    clearArtifacts
  } = useArtifactManagement(currentRfp, currentSessionId, isAuthenticated, user);

  const { handleSendMessage } = useMessageHandling();

  // Main menu handler
  const handleMainMenuSelect = (item: string) => {
    if (item === 'Agents') setShowAgentsMenu(true);
    if (item === 'RFP') setShowRFPMenu(true);
    if (item === 'Debug') history.push('/debug');
  };

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    
    // If user logs out (no session), clear UI state and show default agent
    if (!isAuthenticated && !supabaseLoading) {
      console.log('User not authenticated, clearing UI state and loading default agent...');
      clearUIState();
      clearArtifacts();
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
      return;
    }
    
    // Always load default agent and show initial prompt, regardless of authentication
    if (!supabaseLoading) {
      console.log('Loading default agent for all users...');
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage && messages.length === 0) {
          setMessages([initialMessage]);
        }
      });
    }
    
    // Check if we have basic authentication (session and user) for loading sessions
    if (isAuthenticated && !supabaseLoading && user) {
      console.log('User is authenticated, loading sessions...');
      loadUserSessions();
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile]);

  // Monitor session changes specifically for logout detection
  useEffect(() => {
    if (!session && !supabaseLoading) {
      console.log('Session removed - user logged out, clearing UI state');
      clearUIState();
      clearArtifacts();
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
    }
  }, [session, supabaseLoading]);

  // Load active agent when session changes
  useEffect(() => {
    if (currentSessionId && userId) {
      loadSessionAgent(currentSessionId);
      loadSessionArtifacts(currentSessionId);
    } else if (!currentSessionId && isAuthenticated && userId && messages.length === 0) {
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
    }
  }, [currentSessionId, userId, isAuthenticated]);

  const handleNewSession = async () => {
    // Clear the UI state
    setMessages([]);
    clearArtifacts();
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    
    // Use the currently selected agent, or default if none selected
    if (isAuthenticated && userId) {
      if (currentAgent) {
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
        const initialMessage = await loadDefaultAgentWithPrompt();
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      }
    } else {
      const initialMessage = await loadDefaultAgentWithPrompt();
      if (initialMessage) {
        setMessages([initialMessage]);
      }
    }
    
    console.log('New session started with initial prompt displayed');
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
    await loadSessionArtifacts(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success && currentSessionId === sessionId) {
      setMessages([]);
      clearArtifacts();
      setSelectedSessionId(undefined);
      setCurrentSessionId(undefined);
    }
  };

  const onSendMessage = async (content: string) => {
    await handleSendMessage(
      content,
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
      (agent) => {
        const agentMessage = handleAgentChanged(agent);
        return agentMessage;
      }
    );
  };

  const handleArtifactSelect = (artifactRef: ArtifactReference) => {
    console.log('Artifact selected:', artifactRef);
    // Find the artifact by ID and select it
    const artifact = artifacts.find(a => a.id === artifactRef.artifactId);
    if (artifact) {
      selectArtifact(artifact.id);
      console.log('Selected artifact for display:', artifact.name);
    }
  };

  const onAgentChanged = (newAgent: SessionActiveAgent) => {
    const agentMessage = handleAgentChanged(newAgent);
    if (agentMessage) {
      setMessages((prev: Message[]) => [...prev, agentMessage]);
    }
  };

  return (
    <IonPage>
      <HomeHeader
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        user={user}
        rfps={rfps}
        currentRfpId={currentRfpId}
        showRFPMenu={showRFPMenu}
        setShowRFPMenu={setShowRFPMenu}
        onNewRFP={handleNewRFP}
        onEditRFP={handleEditRFP}
        onDeleteRFP={handleDeleteRFP}
        onPreviewRFP={handlePreviewRFP}
        onShareRFP={handleShareRFP}
        onSetCurrentRfp={handleSetCurrentRfp}
        onClearCurrentRfp={handleClearCurrentRfp}
        agents={agents}
        showAgentsMenu={showAgentsMenu}
        setShowAgentsMenu={setShowAgentsMenu}
        currentAgent={currentAgent}
        onNewAgent={handleNewAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onSwitchAgent={handleShowAgentSelector}
        onMainMenuSelect={handleMainMenuSelect}
      />

      <IonContent fullscreen scrollY={false} style={{ 
        '--overflow': 'hidden',
        '--padding-top': '0',
        '--padding-bottom': '0'
      }}>
        <div style={{ 
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <HomeContent
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onNewSession={handleNewSession}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            onAttachFile={handleAttachFile}
            artifacts={artifacts}
            selectedArtifact={selectedArtifact}
            currentRfpId={currentRfpId}
            onDownloadArtifact={(artifact) => console.log('Download:', artifact)}
            onArtifactSelect={handleArtifactSelect}
          />
        </div>

        <HomeFooter currentRfp={currentRfp} />

        {/* Agent Selector Modal */}
        <AgentSelector
          isOpen={showAgentSelector}
          onClose={() => setShowAgentSelector(false)}
          sessionId={currentSessionId || 'preview'}
          supabaseUserId={userId || ''}
          currentAgent={currentAgent}
          onAgentChanged={onAgentChanged}
          hasProperAccountSetup={false}
          isAuthenticated={isAuthenticated}
        />
      </IonContent>

      {/* Modals */}
      <AgentEditModal
        agent={editingAgent}
        isOpen={showAgentModal}
        onSave={handleSaveAgent}
        onCancel={handleCancelAgent}
      />
      
      <RFPEditModal
        rfp={editingRFP}
        isOpen={showRFPModal}
        onSave={handleSaveRFP}
        onCancel={handleCancelRFP}
      />
      
      <RFPPreviewModal
        isOpen={showRFPPreviewModal}
        onClose={handleClosePreview}
        rfp={previewingRFP}
      />
    </IonPage>
  );
};

export default Home;

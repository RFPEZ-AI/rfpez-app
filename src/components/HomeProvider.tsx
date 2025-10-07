// Copyright Mark Skiba, 2025 All rights reserved

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { HomeContext, HomeProviderProps, Message, RFPContextState } from '../types/home';
import { RFP } from '../types/rfp';
import { SessionActiveAgent } from '../types/database';
import { ArtifactService } from '../services/artifactService';
import { HomeSessionService } from '../services/homeSessionService';
import { HomeMessageService } from '../services/homeMessageService';

// Create the context
const Context = createContext<HomeContext | undefined>(undefined);

// Hook to use the context
export const useHome = (): HomeContext => {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
};

// Main provider component
export const HomeProvider: React.FC<HomeProviderProps> = ({ 
  children,
  hooks,
  agents,
  artifacts,
  setArtifacts,
  loadSessionArtifacts
}) => {
  // URL parameters
  const { sessionId } = useParams<{ sessionId?: string }>();
  const history = useHistory();

  // State management using the provided hooks
  const {
    session,
    setSession,
    currentRfpId,
    setCurrentRfpId,
    currentRfp,
    setCurrentRfp,
    sessionActiveAgent,
    setSessionActiveAgent,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
    showArtifactWindow,
    setShowArtifactWindow,
    selectedArtifact,
    setSelectedArtifact,
    debugMode,
    setDebugMode,
    formData,
    setFormData,
    isSubmittingForm,
    setIsSubmittingForm
  } = hooks;

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Refs for cleanup and AbortController management
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // RFP context state
  const rfpContext: RFPContextState = {
    currentRfpId,
    currentRfp,
    setCurrentRfp: async (rfpId: string, rfpData?: RFP) => {
      if (sessionId) {
        await HomeSessionService.setSessionRfpContext(
          sessionId,
          rfpId,
          rfpData || null,
          setCurrentRfpId,
          setCurrentRfp
        );
      }
    },
    clearCurrentRfp: async () => {
      if (sessionId) {
        await HomeSessionService.clearSessionRfpContext(
          sessionId,
          setCurrentRfpId,
          setCurrentRfp
        );
      }
    }
  };

  // Load session on mount or when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const loadSession = async () => {
        setIsLoading(true);
        try {
          const loadedSession = await HomeSessionService.loadSession(
            sessionId,
            setCurrentRfpId,
            setCurrentRfp,
            setSessionActiveAgent,
            agents
          );
          // Convert database Session to home Session with timestamp
          if (loadedSession) {
            const sessionWithTimestamp = {
              ...loadedSession,
              timestamp: new Date(loadedSession.created_at)
            };
            setSession(sessionWithTimestamp);
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          setError('Failed to load session');
        } finally {
          setIsLoading(false);
        }
      };

      loadSession();
    }
  }, [sessionId, agents, setSession, setCurrentRfpId, setCurrentRfp, setSessionActiveAgent, setIsLoading, setError]);

  // Set up window message handler
  useEffect(() => {
    const handler = HomeMessageService.createMessageHandler(
      sessionId,
      currentRfpId,
      session,
      agents,
      artifacts,
      rfpContext.setCurrentRfp,
      rfpContext.clearCurrentRfp,
      handleAgentChanged,
      handleArtifactSelect,
      loadSessionArtifacts,
      setArtifacts
    );

    messageHandlerRef.current = handler;
    window.addEventListener('message', handler);

    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
        messageHandlerRef.current = null;
      }
    };
  }, [sessionId, currentRfpId, session, agents, artifacts, loadSessionArtifacts, setArtifacts]);

  // Session management
  const handleCreateSession = useCallback(async (title?: string): Promise<string | null> => {
    setIsCreatingSession(true);
    try {
      const newSessionId = await HomeSessionService.createSession(title, sessionActiveAgent);
      if (newSessionId) {
        history.push(`/session/${newSessionId}`);
        return newSessionId;
      }
      return null;
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Failed to create new session');
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [sessionActiveAgent, history, setError]);

  const handleLoadSession = useCallback(async (targetSessionId: string): Promise<void> => {
    if (targetSessionId === sessionId) return;
    
    setIsLoading(true);
    try {
      history.push(`/session/${targetSessionId}`);
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, history, setIsLoading, setError]);

  // Agent management
  const handleAgentChanged = useCallback(async (newAgent: SessionActiveAgent): Promise<Message | null> => {
    if (!sessionId) return null;
    
    try {
      return await HomeSessionService.changeSessionAgent(sessionId, newAgent, setSessionActiveAgent);
    } catch (error) {
      console.error('Failed to change agent:', error);
      setError('Failed to switch agent');
      return null;
    }
  }, [sessionId, setSessionActiveAgent, setError]);

  // Artifact management
  const handleArtifactSelect = useCallback(async (artifactRef: any): Promise<void> => {
    try {
      const selectArtifact = (id: string) => {
        const artifact = artifacts.find(a => a.id === id);
        setSelectedArtifact(artifact || null);
      };
      
      const artifactWindowState = { selectArtifact: setSelectedArtifact };
      await ArtifactService.selectArtifactWithRetry(
        artifactRef,
        artifacts,
        selectArtifact,
        artifactWindowState,
        sessionId,
        loadSessionArtifacts,
        addSystemMessage
      );
    } catch (error) {
      console.error('Failed to select artifact:', error);
      setError('Failed to select artifact');
    }
  }, [artifacts, setSelectedArtifact, setShowArtifactWindow, loadSessionArtifacts, sessionId, setError]);

  const handleDownloadArtifact = useCallback(async (artifact: any): Promise<void> => {
    try {
      await ArtifactService.downloadArtifact(artifact, currentRfp, addSystemMessage);
    } catch (error) {
      console.error('Failed to download artifact:', error);
      setError('Failed to download artifact');
    }
  }, [setError]);

  const handleFormSubmit = useCallback(async (
    artifact: any,
    formData: Record<string, any>,
    autoPrompt?: string
  ): Promise<void> => {
    if (!sessionId) return;
    
    setIsSubmittingForm(true);
    try {
      const user = { id: 'current-user-id' }; // TODO: Get from auth context
      const sendAutoPrompt = () => {
        // TODO: Implement auto prompt sending
        console.log('Auto prompt sending not yet implemented');
      };
      await ArtifactService.submitFormWithAutoPrompt(
        artifact,
        formData,
        sessionId,
        currentRfpId,
        user,
        addSystemMessage,
        sendAutoPrompt
      );
      
      // Clear form data after successful submission
      setFormData({});
      
      // Optionally close artifact window
      setShowArtifactWindow(false);
      
    } catch (error) {
      console.error('Failed to submit form:', error);
      setError('Failed to submit form');
    } finally {
      setIsSubmittingForm(false);
    }
  }, [sessionId, setIsSubmittingForm, setFormData, setShowArtifactWindow, setError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // System message helper
  const addSystemMessage = useCallback((content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const systemMessage = HomeMessageService.createSystemMessage(content, type);
    setMessages((prev: Message[]) => [...prev, systemMessage]);
  }, [setMessages]);

  // Context value
  const contextValue: HomeContext = {
    // Session state
    session,
    sessionId,
    currentRfpId,
    currentRfp,
    sessionActiveAgent,
    messages,
    isLoading,
    error,
    
    // UI state
    showArtifactWindow,
    setShowArtifactWindow,
    selectedArtifact,
    setSelectedArtifact,
    debugMode,
    setDebugMode,
    sidebarOpen,
    setSidebarOpen,
    newSessionTitle,
    setNewSessionTitle,
    isCreatingSession,
    formData,
    setFormData,
    isSubmittingForm,
    
    // RFP context
    rfpContext,
    
    // Handlers
    handleCreateSession,
    handleLoadSession,
    handleAgentChanged,
    handleArtifactSelect,
    handleDownloadArtifact,
    handleFormSubmit,
    addSystemMessage,
    
    // Data
    agents,
    artifacts
  };

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
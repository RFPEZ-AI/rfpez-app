// Copyright Mark Skiba, 2025 All rights reserved

import { useEffect } from 'react';
import DatabaseService from '../services/database';
import type { Message, Artifact, Session as HomeSession } from '../types/home';
import type { RFP } from '../types/rfp';

interface UseSessionInitializationParams {
  isAuthenticated: boolean;
  supabaseLoading: boolean;
  user: { id: string } | null;
  userProfile: unknown;
  session: unknown;
  currentSessionId: string | undefined;
  isCreatingNewSession: boolean;
  sessions: HomeSession[];
  messages: Message[];
  currentRfpId: number | null | undefined;
  artifacts: Artifact[];
  needsSessionRestore: string | null | undefined; // Tri-state: undefined = not checked, null = no session, string = session ID
  
  setMessages: (messages: Message[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  setIsCreatingNewSession: (value: boolean) => void;
  setNeedsSessionRestore: (value: string | null) => void;
  
  clearUIState: () => void;
  clearArtifacts: () => void;
  loadUserSessions: (() => Promise<void>) | null;
  loadDefaultAgentWithPrompt: () => Promise<Message | null>;
  handleSelectSession: (sessionId: string) => Promise<void>;
  handleSetCurrentRfp: (rfpId: number, rfpData?: RFP, setAsGlobal?: boolean) => Promise<void>;
  
  artifactWindowState: {
    getLastSession: () => string | null;
  };
}

/**
 * Hook to manage session initialization, restoration, and lifecycle
 * Handles authentication changes, session auto-restore, and state cleanup
 */
export const useSessionInitialization = (params: UseSessionInitializationParams) => {
  const {
    isAuthenticated,
    supabaseLoading,
    user,
    userProfile,
    session,
    currentSessionId,
    isCreatingNewSession,
    sessions,
    messages,
    currentRfpId,
    artifacts,
    needsSessionRestore,
    setMessages,
    setArtifacts,
    setIsCreatingNewSession,
    setNeedsSessionRestore,
    clearUIState,
    clearArtifacts,
    loadUserSessions,
    loadDefaultAgentWithPrompt,
    handleSelectSession,
    handleSetCurrentRfp
  } = params;

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    
    // If user logs out (no session), clear UI state and show default agent
    if (!isAuthenticated && !supabaseLoading) {
      console.log('User not authenticated, clearing UI state and loading default agent...');
      clearUIState();
      clearArtifacts();
      
      // Show loading message immediately
      setMessages([{
        id: 'agent-loading',
        content: '🤖 Activating Solutions agent...',
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      }]);
      
      // Load the default agent and replace loading message with welcome
      loadDefaultAgentWithPrompt().then((welcomeMessage) => {
        if (welcomeMessage) {
          console.log('✅ Default agent loaded, showing welcome message');
          setMessages([welcomeMessage]);
        } else {
          console.log('⚠️ No welcome message returned, keeping activation message');
        }
      });
      return;
    }
    
    // Only load default agent if no current session exists and no messages
    // This prevents overriding active agent selections during routine auth state changes
    // CRITICAL FIX: Check needsSessionRestore state:
    //   - undefined = still checking database (don't load default yet - WAIT!)
    //   - null = checked, no session found (OK to load default)
    //   - string = session to restore (don't load default)
    // ALSO CHECK: Only load default if user is authenticated (otherwise wait for auth check to complete)
    if (isAuthenticated && !supabaseLoading && !currentSessionId && messages.length === 0 && sessions.length === 0 && needsSessionRestore === null) {
      console.log('Loading default agent for initial app startup (no sessions available to restore)...');
      console.log('🔍 Condition check: isAuthenticated:', isAuthenticated, 'needsSessionRestore:', needsSessionRestore, 'sessions.length:', sessions.length);
      
      // Show loading message immediately
      setMessages([{
        id: 'agent-loading',
        content: '🤖 Activating Solutions agent...',
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      }]);
      
      // Load the default agent and replace loading message with welcome
      loadDefaultAgentWithPrompt().then((welcomeMessage) => {
        if (welcomeMessage) {
          console.log('✅ Default agent loaded, showing welcome message');
          setMessages([welcomeMessage]);
        } else {
          console.log('⚠️ No welcome message returned, keeping activation message');
        }
      });
    } else if (!supabaseLoading && !currentSessionId && messages.length === 0 && (sessions.length > 0 || needsSessionRestore)) {
      console.log('🔄 Sessions available or session restoration pending - waiting for restoration...');
      console.log('🔍 needsSessionRestore state:', needsSessionRestore, 'sessions.length:', sessions.length);
      
      // Don't show any loading message - let the session restoration handle it
      // This prevents the "Activating Solutions agent..." message from appearing
      // when we're about to restore an existing session
    } else if (!supabaseLoading && !currentSessionId && messages.length === 0 && needsSessionRestore === undefined) {
      console.log('⏳ Waiting for session restoration check to complete (needsSessionRestore is undefined)...');
      // Don't load default agent yet - we're still checking the database
    }
    
    // Check if we have basic authentication (session and user) for loading sessions
    if (isAuthenticated && !supabaseLoading && user) {
      console.log('User is authenticated, loading sessions...');
      if (loadUserSessions) {
        loadUserSessions();
      }
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile, needsSessionRestore]);

  // CRITICAL FIX: Handle session restoration from useHomeState
  // This ensures that when useHomeState restores a session ID from the database,
  // we actually load the full session content (messages, agent, artifacts)
  // BUT: Don't restore if we're creating a new session!
  useEffect(() => {
    console.log('🔍 Session restoration effect triggered:', {
      needsSessionRestore,
      sessionsLength: sessions.length,
      isCreatingNewSession,
      hasSessionToRestore: needsSessionRestore && sessions.length > 0 && !isCreatingNewSession
    });
    
    if (needsSessionRestore && sessions.length > 0 && !isCreatingNewSession) {
      console.log('🔄 Processing session restoration from useHomeState:', needsSessionRestore);
      const sessionToRestore = sessions.find(s => s.id === needsSessionRestore);
      if (sessionToRestore) {
        console.log('✅ Found session to restore, calling handleSelectSession:', needsSessionRestore);
        handleSelectSession(needsSessionRestore);
        // Clear the restoration flag
        setNeedsSessionRestore(null);
      } else {
        console.warn('⚠️ Session to restore not found in sessions list:', needsSessionRestore);
        console.warn('Available sessions:', sessions.map(s => s.id));
        // Clear the flag anyway to prevent infinite loops
        setNeedsSessionRestore(null);
      }
    } else if (needsSessionRestore && isCreatingNewSession) {
      console.log('🚫 Skipping session restoration - user is creating a new session');
      // Clear the restoration flag since we're not using it
      setNeedsSessionRestore(null);
    }
  }, [needsSessionRestore, sessions, handleSelectSession, setNeedsSessionRestore, isCreatingNewSession]);

  // Safety timeout to clear the new session creation flag
  useEffect(() => {
    if (isCreatingNewSession) {
      console.log('⏰ Setting safety timeout for new session creation flag');
      const timeoutId = setTimeout(() => {
        console.log('⏰ Safety timeout triggered - clearing new session creation flag');
        setIsCreatingNewSession(false);
      }, 5000); // 5 seconds safety timeout

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isCreatingNewSession, setIsCreatingNewSession]);

  // Clear session creation flag when session ID is actually set
  useEffect(() => {
    console.log('🔄 useEffect for clearing isCreatingNewSession triggered:', {
      isCreatingNewSession,
      currentSessionId,
      willClearFlag: isCreatingNewSession && currentSessionId
    });
    
    if (isCreatingNewSession && currentSessionId) {
      console.log('✅ New session ID available, clearing creation flag:', currentSessionId);
      setIsCreatingNewSession(false);
    }
  }, [isCreatingNewSession, currentSessionId, setIsCreatingNewSession]);

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
  }, [session, supabaseLoading, clearUIState, clearArtifacts, loadDefaultAgentWithPrompt, setMessages]);

  // 🚀 MCP UI REFRESH FIX: Add periodic polling for state synchronization
  // This ensures UI updates even when MCP browser tests bypass normal callback flow
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    const pollForStateChanges = async () => {
      // Only poll when we have an active session but no current RFP
      // Validate that currentSessionId is a valid UUID (not empty string or undefined)
      const isValidUUID = currentSessionId && currentSessionId.length === 36 && currentSessionId.includes('-');
      
      if (isValidUUID && !currentRfpId && session) {
        try {
          console.log('🔄 MCP UI REFRESH: Polling for state changes - session:', currentSessionId);
          
          // Check if session has RFP context that we're missing
          const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
          if (sessionWithContext?.current_rfp_id && sessionWithContext.current_rfp_id !== currentRfpId) {
            console.log('🔄 MCP UI REFRESH: Found missing RFP context, updating UI:', sessionWithContext.current_rfp_id);
            await handleSetCurrentRfp(sessionWithContext.current_rfp_id, undefined, true);
          }
          
          // Check for new artifacts if current RFP exists but artifact list is empty
          if (currentRfpId && artifacts.length === 0 && currentSessionId) {
            console.log('🔄 MCP UI REFRESH: Checking for missing artifacts for RFP:', currentRfpId);
            // Import dynamically to avoid circular dependencies
            const { DatabaseService: ArtifactDB } = await import('../services/database');
            const sessionArtifacts = await ArtifactDB.getSessionArtifacts(currentSessionId);
            if (sessionArtifacts && sessionArtifacts.length > 0) {
              console.log('🔄 MCP UI REFRESH: Found missing artifacts, refreshing:', sessionArtifacts.length);
              // Convert database artifacts to home artifacts format
              const convertedArtifacts = sessionArtifacts.map(dbArtifact => ({
                id: dbArtifact.id,
                name: dbArtifact.name,
                type: dbArtifact.type as 'document' | 'text' | 'image' | 'pdf' | 'form' | 'bid_view' | 'other',
                size: dbArtifact.file_size ? `${Math.round(dbArtifact.file_size / 1024)} KB` : 'Unknown size',
                content: dbArtifact.processed_content,
                sessionId: dbArtifact.session_id,
                messageId: dbArtifact.message_id,
                rfpId: currentRfpId
              }));
              setArtifacts(convertedArtifacts);
            }
          }
          
        } catch (error) {
          console.warn('🔄 MCP UI REFRESH: Error during state polling:', error);
        }
      }
    };
    
    // Start polling every 3 seconds when session is active
    // Validate UUID before starting poll
    const isValidUUID = currentSessionId && currentSessionId.length === 36 && currentSessionId.includes('-');
    if (isValidUUID && session) {
      pollInterval = setInterval(pollForStateChanges, 3000);
      console.log('🔄 MCP UI REFRESH: Started state polling for session:', currentSessionId);
    }
    
    // Cleanup on unmount or session change
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('🔄 MCP UI REFRESH: Stopped state polling');
      }
    };
  }, [currentSessionId, currentRfpId, session, artifacts.length, handleSetCurrentRfp, setArtifacts]);
};

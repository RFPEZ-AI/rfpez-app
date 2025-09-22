// Copyright Mark Skiba, 2025 All rights reserved

// Custom hook for session management
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import DatabaseService from '../services/database';
import { UserContextService } from '../services/userContextService';
import { ClaudeService } from '../services/claudeService';
import { useErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface Session {
  id: string;
  title: string;
  timestamp: Date;
  agent_name?: string;
}

export function useSessionManagement() {
  const { user, session: supabaseSession } = useSupabase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const { handleError } = useErrorHandler();

  const isAuthenticated = !!supabaseSession;

  // Load sessions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSessions();
    } else {
      clearSessions();
    }
  }, [isAuthenticated, user]);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      logger.info('Loading user sessions', {
        component: 'useSessionManagement',
        userId: user.id
      });

      const userSessions = await DatabaseService.getUserSessions(user.id);
      
      const formattedSessions: Session[] = userSessions
        .map(session => ({
          id: session.id,
          title: session.title,
          timestamp: new Date(session.updated_at), // Use updated_at for most recent activity
          agent_name: session.agent_name
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending (newest first)

      setSessions(formattedSessions);

      logger.info('Sessions loaded successfully', {
        component: 'useSessionManagement',
        sessionCount: formattedSessions.length
      });

    } catch (error) {
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'loadSessions'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, handleError]);

  const createSession = useCallback(async (title?: string, description?: string) => {
    try {
      logger.info('Creating new session', {
        component: 'useSessionManagement',
        title
      });

      const sessionId = await ClaudeService.createSession(
        title || `Session ${new Date().toLocaleDateString()}`,
        description
      );

      setCurrentSessionId(sessionId);
      setSelectedSessionId(sessionId);

      // Persist session ID to user profile
      if (user) {
        await UserContextService.setCurrentSession(user.id, sessionId);
      }

      // Reload sessions to include the new one
      await loadSessions();

      logger.info('Session created successfully', {
        component: 'useSessionManagement',
        sessionId
      });

      return sessionId;

    } catch (error) {
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'createSession'
      });
      throw error;
    }
  }, [loadSessions, handleError, user]);

  // Session context management helper - defined before selectSession
  const loadSessionWithContext = useCallback(async (sessionId: string) => {
    try {
      logger.info('Loading session with context', {
        component: 'useSessionManagement',
        sessionId
      });

      const session = await DatabaseService.getSessionWithContext(sessionId);
      
      if (session) {
        logger.info('Session with context loaded successfully', {
          component: 'useSessionManagement',
          sessionId,
          hasRfp: !!session.current_rfp_id,
          hasArtifact: !!session.current_artifact_id,
          hasAgent: !!session.current_agent_id
        });
      }

      return session;
    } catch (error) {
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'loadSessionWithContext',
        sessionId
      });
      return null;
    }
  }, [handleError]);

  const selectSession = useCallback(async (sessionId: string) => {
    try {
      logger.info('Selecting session', {
        component: 'useSessionManagement',
        sessionId
      });

      setSelectedSessionId(sessionId);
      setCurrentSessionId(sessionId);

      // Persist session ID to user profile
      if (user) {
        await UserContextService.setCurrentSession(user.id, sessionId);
      }

      // Load session with context (RFP, artifact, and agent)
      const sessionWithContext = await loadSessionWithContext(sessionId);

      // Load session messages
      const history = await ClaudeService.getConversationHistory(sessionId);
      const messages = 'messages' in history ? history.messages : [];
      
      logger.info('Session selected successfully', {
        component: 'useSessionManagement',
        sessionId,
        messageCount: messages?.length || 0,
        hasRfpContext: !!sessionWithContext?.current_rfp_id,
        hasArtifactContext: !!sessionWithContext?.current_artifact_id,
        hasAgentContext: !!sessionWithContext?.current_agent_id
      });

      return { 
        messages: messages || [], 
        session: sessionWithContext 
      };

    } catch (error) {
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'selectSession',
        sessionId
      });
      return { messages: [], session: null };
    }
  }, [handleError, loadSessionWithContext, user]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      logger.info('Deleting session', {
        component: 'useSessionManagement',
        sessionId
      });

      // Remove from local state immediately for UI responsiveness
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(undefined);
        setCurrentSessionId(undefined);
      }

      // Note: Add actual deletion API call here when available
      // await DatabaseService.deleteSession(sessionId);

      logger.info('Session deleted successfully', {
        component: 'useSessionManagement',
        sessionId
      });

    } catch (error) {
      // Revert local state on error
      await loadSessions();
      
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'deleteSession',
        sessionId
      });
    }
  }, [selectedSessionId, loadSessions, handleError]);

  const clearSessions = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(undefined);
    setSelectedSessionId(undefined);
  }, []);

  // Session context management
  const updateSessionContext = useCallback(async (
    sessionId: string,
    context: { 
      current_rfp_id?: number | null; 
      current_artifact_id?: string | null;
      current_agent_id?: string | null;
    }
  ) => {
    try {
      logger.info('Updating session context', {
        component: 'useSessionManagement',
        sessionId,
        context
      });

      await DatabaseService.updateSessionContext(sessionId, context);
      
      logger.info('Session context updated successfully', {
        component: 'useSessionManagement',
        sessionId,
        context
      });

    } catch (error) {
      handleError(error as Error, {
        component: 'useSessionManagement',
        action: 'updateSessionContext',
        sessionId,
        context
      });
    }
  }, [handleError]);

  return {
    sessions,
    currentSessionId,
    selectedSessionId,
    isLoading,
    createSession,
    selectSession,
    deleteSession,
    clearSessions,
    loadSessions,
    updateSessionContext,
    loadSessionWithContext
  };
}

// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect, useCallback } from 'react';
import { Message, Session, ArtifactReference } from '../types/home';
import { SessionActiveAgent } from '../types/database';
import DatabaseService from '../services/database';

export const useSessionState = (userId?: string, isAuthenticated?: boolean) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingWelcomeMessage, setPendingWelcomeMessage] = useState<Message | null>(null);

  // Load user sessions on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadUserSessions();
    }
  }, [isAuthenticated, userId]);

  const loadUserSessions = async () => {
    if (!isAuthenticated || !userId) {
      console.log('User not authenticated or userId not available, skipping session load');
      return;
    }
    
    try {
      console.log('Attempting to load sessions from Supabase for user:', userId);
      const sessionsData = await DatabaseService.getUserSessions(userId);
      console.log('Sessions loaded:', sessionsData);
      const formattedSessions: Session[] = sessionsData
        .map(session => ({
          id: session.id,
          title: session.title,
          timestamp: new Date(session.updated_at),
          agent_name: session.agent_name
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort descending (newest first)
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      console.log('🔍 Loading messages for session:', sessionId);
      const messagesData = await DatabaseService.getSessionMessages(sessionId);
      console.log('📨 Raw messages data from database:', messagesData);
      const formattedMessages: Message[] = messagesData
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          agentName: msg.agent_name,
          // Restore artifact references from metadata
          artifactRefs: (msg.metadata?.artifactRefs as ArtifactReference[]) || []
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      console.log('✨ Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      console.log('✅ Messages set to state, total:', formattedMessages.length);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const createNewSession = async (
    currentAgent: SessionActiveAgent | null, 
    inheritedRfpId?: number,
    firstUserMessage?: string
  ): Promise<string | null> => {
    console.log('🎯 Lazy Session Creation - Creating session with first user message');
    console.log('Creating new session, auth state:', { isAuthenticated, user: !!userId, inheritedRfpId, hasFirstMessage: !!firstUserMessage });
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or userId not available, skipping session creation');
      return null;
    }
    
    try {
      // Use inherited RFP ID if provided, otherwise session will have no RFP context initially
      const rfpIdForSession = inheritedRfpId || undefined;
      console.log('Attempting to create session in Supabase with current agent:', currentAgent?.agent_id, 'and inherited RFP:', rfpIdForSession);
      
      // Use first user message as title if provided (lazy creation pattern)
      const sessionTitle = firstUserMessage 
        ? firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : '')
        : 'Chat Session';
      
      const session = await DatabaseService.createSessionWithAgent(
        userId, 
        sessionTitle,
        currentAgent?.agent_id,
        undefined, // description
        rfpIdForSession
      );
      console.log('Session created:', session);
      if (session) {
        // CRITICAL FIX: Immediately set this new session as the user's current session
        // This ensures that when the user refreshes or sends their first message,
        // they stay in this session instead of creating another one
        try {
          await DatabaseService.setUserCurrentSession(session.id);
          console.log('✅ New session set as current in user profile:', session.id);
        } catch (error) {
          console.warn('⚠️ Failed to set new session as current:', error);
        }
        
        await loadUserSessions();
        return session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  };

  const deleteSession = async (sessionId: string) => {
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated, cannot delete session');
      return false;
    }

    try {
      const success = await DatabaseService.deleteSession(sessionId);
      if (success) {
        console.log('Session deleted successfully:', sessionId);
        await loadUserSessions();
        return true;
      } else {
        console.error('Failed to delete session');
        return false;
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  };

  const clearUIState = useCallback(() => {
    console.log('Clearing UI state for logout');
    setMessages([]);
    setSessions([]);
  }, []); // No dependencies - setMessages and setSessions are stable

  return {
    sessions,
    setSessions,
    messages,
    setMessages,
    pendingWelcomeMessage,
    setPendingWelcomeMessage,
    loadUserSessions,
    loadSessionMessages,
    createNewSession,
    deleteSession,
    clearUIState
  };
};

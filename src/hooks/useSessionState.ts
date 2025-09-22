// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { Message, Session, ArtifactReference } from '../types/home';
import { SessionActiveAgent } from '../types/database';
import DatabaseService from '../services/database';

export const useSessionState = (userId?: string, isAuthenticated?: boolean) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

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

  const createNewSession = async (currentAgent: SessionActiveAgent | null, currentRfpId?: number): Promise<string | null> => {
    console.log('Creating new session, auth state:', { isAuthenticated, user: !!userId, currentRfpId });
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or userId not available, skipping session creation');
      return null;
    }
    
    try {
      console.log('Attempting to create session in Supabase with current agent:', currentAgent?.agent_id, 'and RFP:', currentRfpId);
      const session = await DatabaseService.createSessionWithAgent(
        userId, 
        'New Chat Session',
        currentAgent?.agent_id,
        undefined, // description
        currentRfpId
      );
      console.log('Session created:', session);
      if (session) {
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

  const clearUIState = () => {
    console.log('Clearing UI state for logout');
    setMessages([]);
    setSessions([]);
  };

  return {
    sessions,
    setSessions,
    messages,
    setMessages,
    loadUserSessions,
    loadSessionMessages,
    createNewSession,
    deleteSession,
    clearUIState
  };
};

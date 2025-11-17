// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect, useCallback } from 'react';
import { Message, Session, ArtifactReference } from '../types/home';
import { SessionActiveAgent } from '../types/database';
import DatabaseService from '../services/database';

export const useSessionState = (userId?: string, isAuthenticated?: boolean, specialtySiteId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingWelcomeMessage, setPendingWelcomeMessage] = useState<Message | null>(null);

  // Define loadUserSessions function (can be called manually or by useEffect)
  // 🎯 SPECIALTY-AWARE: Now filters sessions by specialty_site_id
  const loadUserSessions = useCallback(async (rfpId?: number | null) => {
    if (!isAuthenticated || !userId) {
      return;
    }
    
    // 🚨 CRITICAL: Wait for specialty site ID to be available before loading sessions
    // If specialtySiteId is undefined, we can't filter properly and would load ALL sessions
    if (specialtySiteId === undefined) {
      console.log('⏳ Waiting for specialtySiteId to load before fetching sessions...');
      return;
    }
    
    try {
      // 🎯 Pass specialty_site_id to filter sessions by current specialty
      const sessionsData = await DatabaseService.getUserSessions(userId, rfpId, specialtySiteId);
      const formattedSessions: Session[] = sessionsData
        .map(session => ({
          id: session.id,
          title: session.title,
          timestamp: new Date(session.updated_at),
          agent_name: session.agent_name
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSessions(formattedSessions);
      console.log(`🎯 Loaded ${formattedSessions.length} sessions for specialty:`, specialtySiteId);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [isAuthenticated, userId, specialtySiteId]);

  // Auto-load sessions when authentication state changes or specialty changes
  useEffect(() => {
    loadUserSessions();
  }, [isAuthenticated, userId, specialtySiteId]); // Added specialtySiteId to trigger reload on specialty change

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const messagesData = await DatabaseService.getSessionMessages(sessionId);
      const formattedMessages: Message[] = messagesData
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          agentName: msg.agent_name,
          // Restore artifact references from metadata
          artifactRefs: (msg.metadata?.artifactRefs as ArtifactReference[]) || [],
          // Include file attachments if present
          file_attachments: msg.file_attachments || [],
          // 🔧 CRITICAL FIX: Preserve all metadata including tool calls
          // Merge metadata and ai_metadata to support both structures
          metadata: {
            ...(msg.metadata || {}),
            ...(msg.ai_metadata || {}),
            // Ensure functions_called from ai_metadata is accessible
            functions_called: msg.ai_metadata?.functions_called || msg.metadata?.functions_called
          }
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  const createNewSession = async (
    currentAgent: SessionActiveAgent | null, 
    inheritedRfpId?: number,
    firstUserMessage?: string
  ): Promise<string | null> => {
    if (!isAuthenticated || !userId) {
      return null;
    }
    
    try {
      // Use inherited RFP ID if provided, otherwise session will have no RFP context initially
      const rfpIdForSession = inheritedRfpId || undefined;
      console.log('🎯 Creating specialty-scoped session:', {
        agentId: currentAgent?.agent_id,
        rfpId: rfpIdForSession,
        specialtySiteId
      });
      
      // Use first user message as title if provided (lazy creation pattern)
      const sessionTitle = firstUserMessage 
        ? firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : '')
        : 'Chat Session';
      
      // 🎯 SPECIALTY-AWARE: Pass specialtySiteId to scope session to current specialty
      const session = await DatabaseService.createSessionWithAgent(
        userId, 
        sessionTitle,
        currentAgent?.agent_id,
        undefined, // description
        rfpIdForSession,
        specialtySiteId // Link session to current specialty site
      );
      if (session) {
        // CRITICAL: Sessions are now scoped per-specialty, not globally
        // Reload sessions to show new session in current specialty's list
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
      return false;
    }

    try {
      const success = await DatabaseService.deleteSession(sessionId);
      if (success) {
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

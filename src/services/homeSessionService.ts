// Copyright Mark Skiba, 2025 All rights reserved

import { Message } from '../types/home';
import { RFP } from '../types/rfp';
import DatabaseService from './database';
import { Session, SessionActiveAgent } from '../types/database';

export class HomeSessionService {
  /**
   * Handle session loading and initialization
   */
  static async loadSession(
    sessionId: string,
    setCurrentRfpId: (rfpId: string | undefined) => void,
    setCurrentRfp: (rfp: RFP | null) => void,
    setSessionActiveAgent: (agent: SessionActiveAgent | null) => void,
    agents: any[]
  ): Promise<Session | null> {
    try {
      console.log('Loading session with context:', sessionId);
      const sessionWithContext = await DatabaseService.getSessionWithContext(sessionId);
      
      if (!sessionWithContext) {
        console.warn('Session not found:', sessionId);
        return null;
      }

      // Handle RFP context
      if (sessionWithContext.current_rfp_id) {
        const rfpId = String(sessionWithContext.current_rfp_id);
        setCurrentRfpId(rfpId);
        
        // Load the full RFP data
        try {
          const { RFPService } = await import('./rfpService');
          const rfp = await RFPService.getById(parseInt(rfpId));
          if (rfp) {
            setCurrentRfp(rfp);
            console.log('✅ Session RFP context loaded:', rfp.name);
          } else {
            console.warn('RFP not found in database:', rfpId);
            setCurrentRfp(null);
          }
        } catch (error) {
          console.error('Failed to load RFP details:', error);
          setCurrentRfp(null);
        }
      } else {
        setCurrentRfpId(undefined);
        setCurrentRfp(null);
      }

      // Handle agent context
      if (sessionWithContext.current_agent_id) {
        // Find the full agent data
        const fullAgent = agents.find(agent => agent.id === sessionWithContext.current_agent_id);
        if (fullAgent) {
          const sessionAgent: SessionActiveAgent = {
            agent_id: fullAgent.id,
            agent_name: fullAgent.name,
            agent_role: fullAgent.role,
            agent_instructions: fullAgent.instructions,
            agent_initial_prompt: fullAgent.initial_prompt || '',
            agent_avatar_url: fullAgent.avatar_url
          };
          setSessionActiveAgent(sessionAgent);
          console.log('✅ Session agent context loaded:', fullAgent.name);
        } else {
          console.warn('Agent not found for session:', sessionWithContext.current_agent_id);
          setSessionActiveAgent(null);
        }
      } else {
        setSessionActiveAgent(null);
      }

      return sessionWithContext;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Handle session creation
   */
  static async createSession(
    title: string | null = null,
    agent: SessionActiveAgent | null = null
  ): Promise<string | null> {
    try {
      console.log('Creating new session with title:', title);
      
      // Get the current user ID (placeholder - you'll need to pass this in or get from context)
      const supabaseUserId = 'current-user-id'; // TODO: Get from auth context
      
      const session = await DatabaseService.createSession(
        supabaseUserId,
        title || 'New Session'
      );
      
      if (!session) {
        throw new Error('Failed to create session');
      }
      
      console.log('✅ Session created successfully:', session.id);

      // If we have an agent, set it as the active agent for this session
      if (agent) {
        try {
          const { AgentService } = await import('./agentService');
          await AgentService.setSessionAgent(session.id, agent.agent_id, supabaseUserId);
          console.log('✅ Agent set for new session:', agent.agent_name);
        } catch (error) {
          console.warn('Failed to set agent for new session:', error);
        }
      }

      return session.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create new session');
    }
  }

  /**
   * Handle agent changes for a session
   */
  static async changeSessionAgent(
    sessionId: string,
    newAgent: SessionActiveAgent,
    setSessionActiveAgent: (agent: SessionActiveAgent | null) => void
  ): Promise<Message | null> {
    try {
      console.log('🤖 Changing session agent:', {
        sessionId,
        newAgentId: newAgent.agent_id,
        newAgentName: newAgent.agent_name
      });

      // Update the session agent in the database
      const supabaseUserId = 'current-user-id'; // TODO: Get from auth context
      const { AgentService } = await import('./agentService');
      await AgentService.setSessionAgent(sessionId, newAgent.agent_id, supabaseUserId);
      
      // Update local state
      setSessionActiveAgent(newAgent);
      
      console.log('✅ Agent changed successfully for session:', sessionId);
      
      // Return a system message to indicate the change
      return {
        id: `agent-change-${Date.now()}`,
        content: `🤖 Switched to ${newAgent.agent_name} agent`,
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      };
    } catch (error) {
      console.error('Failed to change session agent:', error);
      throw new Error(`Failed to switch to ${newAgent.agent_name} agent`);
    }
  }

  /**
   * Update session context (RFP, title, etc.)
   */
  static async updateSessionContext(
    sessionId: string,
    updates: {
      current_rfp_id?: string;
      title?: string;
    }
  ): Promise<void> {
    try {
      console.log('Updating session context:', { sessionId, updates });
      
      const contextUpdates: any = {};
      
      if (updates.current_rfp_id !== undefined) {
        contextUpdates.current_rfp_id = parseInt(updates.current_rfp_id);
      }
      
      if (updates.title !== undefined) {
        contextUpdates.title = updates.title;
      }
      
      await DatabaseService.updateSessionContext(sessionId, contextUpdates);
      console.log('✅ Session context updated successfully');
    } catch (error) {
      console.error('Failed to update session context:', error);
      throw error;
    }
  }

  /**
   * Clear session context (RFP)
   */
  static async clearSessionRfpContext(
    sessionId: string,
    setCurrentRfpId: (rfpId: string | undefined) => void,
    setCurrentRfp: (rfp: RFP | null) => void
  ): Promise<void> {
    try {
      console.log('Clearing RFP context for session:', sessionId);
      
      await DatabaseService.updateSessionContext(sessionId, {
        current_rfp_id: null
      });
      
      // Clear local state
      setCurrentRfpId(undefined);
      setCurrentRfp(null);
      
      console.log('✅ RFP context cleared successfully');
    } catch (error) {
      console.error('Failed to clear RFP context:', error);
      throw error;
    }
  }

  /**
   * Set RFP context for session
   */
  static async setSessionRfpContext(
    sessionId: string,
    rfpId: string,
    rfpData: RFP | null,
    setCurrentRfpId: (rfpId: string | undefined) => void,
    setCurrentRfp: (rfp: RFP | null) => void
  ): Promise<void> {
    try {
      console.log('Setting RFP context for session:', { sessionId, rfpId, hasRfpData: !!rfpData });
      
      // Update session context in database
      await this.updateSessionContext(sessionId, { current_rfp_id: rfpId });
      
      // Update local state
      setCurrentRfpId(rfpId);
      
      let rfpToUse = rfpData;
      if (rfpData) {
        setCurrentRfp(rfpData);
      } else {
        // Load RFP data if not provided
        try {
          const { RFPService } = await import('./rfpService');
          const rfp = await RFPService.getById(parseInt(rfpId));
          setCurrentRfp(rfp);
          rfpToUse = rfp;
        } catch (error) {
          console.error('Failed to load RFP data:', error);
          setCurrentRfp(null);
        }
      }
      
      // Update session title with RFP name if we have RFP data
      if (rfpToUse?.name) {
        try {
          const { generateSessionTitleFromRfp } = await import('../utils/sessionTitleUtils');
          const newTitle = generateSessionTitleFromRfp(rfpToUse.name);
          await DatabaseService.updateSession(sessionId, { title: newTitle });
          console.log('🏷️ Updated session title from RFP name:', newTitle);
        } catch (error) {
          console.warn('⚠️ Failed to update session title from RFP name:', error);
        }
      }
      
      console.log('✅ RFP context set successfully');
    } catch (error) {
      console.error('Failed to set RFP context:', error);
      throw error;
    }
  }

  /**
   * Get session title for display
   */
  static getSessionDisplayTitle(session: Session | null, messages: Message[]): string {
    if (session?.title) {
      return session.title;
    }
    
    // Generate title from first user message
    const firstUserMessage = messages.find(msg => msg.isUser);
    if (firstUserMessage) {
      const preview = firstUserMessage.content.slice(0, 50);
      return preview.length < firstUserMessage.content.length ? `${preview}...` : preview;
    }
    
    return 'New Session';
  }

  /**
   * Format session for UI display
   */
  static formatSessionForDisplay(session: Session): {
    id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    current_rfp_id?: string;
  } {
    return {
      id: session.id,
      title: session.title || 'Untitled Session',
      created_at: new Date(session.created_at),
      updated_at: new Date(session.updated_at),
      current_rfp_id: session.current_rfp_id ? String(session.current_rfp_id) : undefined
    };
  }
}
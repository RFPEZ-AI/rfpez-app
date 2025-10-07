// Copyright Mark Skiba, 2025 All rights reserved

import { Message } from '../types/home';
import DatabaseService from './database';
import { RFP } from '../types/rfp';
import { SessionActiveAgent } from '../types/database';

export class HomeMessageService {
  /**
   * Create a system message
   */
  static createSystemMessage(
    content: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Message {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    return {
      id: `system-${type}-${Date.now()}`,
      content: `${icons[type]} ${content}`,
      isUser: false,
      timestamp: new Date(),
      agentName: 'System'
    };
  }

  /**
   * Handle window messages from Claude functions and edge functions
   */
  static createMessageHandler(
    currentSessionId: string | undefined,
    currentRfpId: string | undefined,
    session: any,
    agents: any[],
    artifacts: any[],
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>,
    handleClearCurrentRfp: () => void,
    handleAgentChanged: (agent: SessionActiveAgent) => Promise<Message | null>,
    handleArtifactSelect: (artifactRef: any) => Promise<void>,
    loadSessionArtifacts: (sessionId: string) => Promise<any>,
    setArtifacts: (artifacts: any[]) => void
  ) {
    return async (event: MessageEvent) => {
      console.log('🐛 HOME MESSAGE DEBUG: Window message received:', {
        type: event.data?.type,
        target: event.data?.target,
        callbackType: event.data?.callbackType,
        origin: event.origin,
        timestamp: new Date().toISOString(),
        hasData: !!event.data,
        dataKeys: event.data ? Object.keys(event.data) : 'none',
        dataSize: event.data ? JSON.stringify(event.data).length : 0,
        fullData: event.data
      });
      
      // Handle Edge Function callbacks
      if (event.data?.type === 'EDGE_FUNCTION_CALLBACK') {
        await this.handleEdgeFunctionCallback(
          event.data,
          currentSessionId,
          agents,
          handleSetCurrentRfp,
          handleAgentChanged,
          handleArtifactSelect
        );
        return;
      }
      
      // Handle direct RFP updates from edge functions
      if (event.data?.type === 'UPDATE_CURRENT_RFP_DIRECT') {
        console.log('🎯 DEBUG: Direct RFP update from edge function:', event.data);
        if (event.data.rfp_data) {
          try {
            await handleSetCurrentRfp(event.data.rfp_data.id, event.data.rfp_data);
            console.log('✅ Direct RFP update successful:', event.data.rfp_data.name);
          } catch (error) {
            console.error('❌ Direct RFP update failed:', error);
          }
        }
        return;
      }
      
      // Handle success messages from edge functions
      if (event.data?.type === 'SHOW_SUCCESS_MESSAGE') {
        console.log('🎯 DEBUG: Success message from edge function:', event.data.message);
        return;
      }
      
      // Handle UI refresh requests from edge functions
      if (event.data?.type === 'REFRESH_UI_STATE') {
        console.log('🎯 DEBUG: UI refresh request from edge function:', event.data);
        if (event.data.component === 'RFP_INDICATOR' && event.data.force_refresh) {
          console.log('🔄 Forcing RFP indicator refresh');
        }
        return;
      }

      // Handle RFP_CREATED_SUCCESS messages
      if (event.data?.type === 'RFP_CREATED_SUCCESS') {
        await this.handleRfpCreatedSuccess(
          event.data,
          currentSessionId,
          handleSetCurrentRfp,
          loadSessionArtifacts
        );
        return;
      }

      // Handle REFRESH_SESSION_CONTEXT messages
      if (event.data?.type === 'REFRESH_SESSION_CONTEXT') {
        await this.handleRefreshSessionContext(
          event.data,
          currentSessionId,
          handleSetCurrentRfp,
          loadSessionArtifacts
        );
        return;
      }

      // Handle ARTIFACT_REFRESH_NEEDED messages
      if (event.data?.type === 'ARTIFACT_REFRESH_NEEDED') {
        await this.handleArtifactRefreshNeeded(
          event.data,
          currentSessionId,
          loadSessionArtifacts
        );
        return;
      }
      
      // Handle legacy RFP refresh messages
      if (event.data?.type === 'REFRESH_CURRENT_RFP') {
        await this.handleRefreshCurrentRfp(
          event.data,
          currentSessionId,
          handleSetCurrentRfp,
          handleClearCurrentRfp
        );
        return;
      }
      
      // Trigger immediate poll after any RFP-related message for MCP browser tests
      if (event.data?.type === 'REFRESH_CURRENT_RFP' || 
          event.data?.type === 'RFP_CREATED_SUCCESS' || 
          event.data?.type === 'EDGE_FUNCTION_CALLBACK') {
        this.triggerImmediatePoll(currentSessionId, currentRfpId, session, handleSetCurrentRfp);
      }
    };
  }

  /**
   * Handle Edge Function callback messages
   */
  private static async handleEdgeFunctionCallback(
    eventData: any,
    currentSessionId: string | undefined,
    agents: any[],
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>,
    handleAgentChanged: (agent: SessionActiveAgent) => Promise<Message | null>,
    handleArtifactSelect: (artifactRef: any) => Promise<void>
  ): Promise<void> {
    console.log('🎯 HOME MESSAGE DEBUG: Edge Function callback detected:', {
      callbackType: eventData.callbackType,
      target: eventData.target,
      hasPayload: !!eventData.payload,
      payloadKeys: eventData.payload ? Object.keys(eventData.payload) : 'none',
      debugInfo: eventData.debugInfo,
      timestamp: new Date().toISOString()
    });
    
    // Handle different callback targets
    switch (eventData.target) {
      case 'rfp_context':
        await this.handleRfpContextCallback(eventData, currentSessionId, handleSetCurrentRfp);
        break;

      case 'agent_context':
        await this.handleAgentContextCallback(eventData, agents, handleAgentChanged);
        break;

      case 'artifact_viewer':
        await this.handleArtifactViewerCallback(eventData, handleArtifactSelect);
        break;

      default:
        console.log(`📝 HOME MESSAGE DEBUG: Edge Function callback for unhandled target: ${eventData.target}`, {
          target: eventData.target,
          callbackType: eventData.callbackType,
          hasPayload: !!eventData.payload
        });
        break;
    }
  }

  /**
   * Handle RFP context callback
   */
  private static async handleRfpContextCallback(
    eventData: any,
    currentSessionId: string | undefined,
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>
  ): Promise<void> {
    console.log('🎯 HOME MESSAGE DEBUG: RFP context callback processing:', {
      callbackType: eventData.callbackType,
      hasPayload: !!eventData.payload,
      rfpId: eventData.payload?.rfp_id,
      rfpName: eventData.payload?.rfp_name,
      message: eventData.payload?.message,
      payloadSize: eventData.payload ? JSON.stringify(eventData.payload).length : 0,
      fullPayload: eventData.payload
    });
    
    if (eventData.payload?.rfp_id) {
      try {
        const startTime = Date.now();
        
        // Use rfp_data directly when available to avoid database re-query timing issues
        if (eventData.payload.rfp_data) {
          console.log(`🔧 HOME MESSAGE DEBUG: Using rfp_data directly from callback:`, {
            rfpId: eventData.payload.rfp_id,
            rfpName: eventData.payload.rfp_data.name,
            hasFullData: true
          });
          
          await handleSetCurrentRfp(eventData.payload.rfp_id, eventData.payload.rfp_data);
          
          // Update session context if we have an active session
          if (currentSessionId) {
            try {
              await DatabaseService.updateSessionContext(currentSessionId, { 
                current_rfp_id: eventData.payload.rfp_id 
              });
              console.log('✅ RFP context saved to session via direct data:', currentSessionId, eventData.payload.rfp_id);
            } catch (error) {
              console.warn('⚠️ Failed to save RFP context to session via direct data:', error);
            }
          }
        } else {
          console.log(`🔧 HOME MESSAGE DEBUG: No rfp_data in payload, calling handleSetCurrentRfp with ID: ${eventData.payload.rfp_id}`);
          await handleSetCurrentRfp(eventData.payload.rfp_id);
        }
        
        const duration = Date.now() - startTime;
        console.log(`✅ HOME MESSAGE DEBUG: RFP context updated successfully in ${duration}ms:`, {
          rfpId: eventData.payload.rfp_id,
          rfpName: eventData.payload.rfp_name || eventData.payload.rfp_data?.name || 'unnamed',
          method: eventData.payload.rfp_data ? 'direct_data' : 'database_query',
          duration
        });
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Edge Function RFP context update failed:', {
          rfpId: eventData.payload.rfp_id,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  /**
   * Handle agent context callback
   */
  private static async handleAgentContextCallback(
    eventData: any,
    agents: any[],
    handleAgentChanged: (agent: SessionActiveAgent) => Promise<Message | null>
  ): Promise<void> {
    console.log('🤖 HOME MESSAGE DEBUG: Agent context callback processing:', {
      callbackType: eventData.callbackType,
      hasPayload: !!eventData.payload,
      agentId: eventData.payload?.agent_id,
      agentName: eventData.payload?.agent_name,
      message: eventData.payload?.message,
      fullPayload: eventData.payload
    });
    
    if (eventData.payload?.agent_id) {
      try {
        console.log(`🔧 HOME MESSAGE DEBUG: Processing agent context update with ID: ${eventData.payload.agent_id}`);
        const startTime = Date.now();
        
        // Find the agent and convert to SessionActiveAgent format
        const targetAgent = agents.find(agent => agent.id === eventData.payload.agent_id);
        if (targetAgent) {
          const sessionAgent: SessionActiveAgent = {
            agent_id: targetAgent.id,
            agent_name: targetAgent.name,
            agent_role: targetAgent.role,
            agent_instructions: targetAgent.instructions,
            agent_initial_prompt: targetAgent.initial_prompt || '',
            agent_avatar_url: targetAgent.avatar_url
          };
          await handleAgentChanged(sessionAgent);
          const duration = Date.now() - startTime;
          console.log(`✅ HOME MESSAGE DEBUG: Agent context updated successfully in ${duration}ms:`, {
            agentId: eventData.payload.agent_id,
            agentName: eventData.payload.agent_name || targetAgent.name,
            duration
          });
        } else {
          console.warn('⚠️ HOME MESSAGE DEBUG: Agent not found in local agents list:', {
            requestedAgentId: eventData.payload.agent_id,
            availableAgents: agents.map(a => ({ id: a.id, name: a.name }))
          });
        }
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Edge Function agent context update failed:', {
          agentId: eventData.payload.agent_id,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  /**
   * Handle artifact viewer callback
   */
  private static async handleArtifactViewerCallback(
    eventData: any,
    handleArtifactSelect: (artifactRef: any) => Promise<void>
  ): Promise<void> {
    console.log('📎 HOME MESSAGE DEBUG: Artifact viewer callback processing:', {
      callbackType: eventData.callbackType,
      hasPayload: !!eventData.payload,
      artifactId: eventData.payload?.artifactId,
      type: eventData.payload?.type,
      fullPayload: eventData.payload
    });
    
    if (eventData.payload?.artifactId) {
      try {
        console.log(`📄 HOME MESSAGE DEBUG: Processing artifact viewer update with ID: ${eventData.payload.artifactId}`);
        const startTime = Date.now();
        
        // Create artifact reference for the handler
        const artifactRef = {
          artifactId: eventData.payload.artifactId,
          artifactName: eventData.payload.name || `Artifact ${eventData.payload.artifactId}`,
          artifactType: eventData.payload.type || 'form',
          isCreated: true
        };
        
        await handleArtifactSelect(artifactRef);
        const duration = Date.now() - startTime;
        console.log(`✅ HOME MESSAGE DEBUG: Artifact viewer updated successfully in ${duration}ms:`, {
          artifactId: eventData.payload.artifactId,
          type: eventData.payload.type,
          duration
        });
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Edge Function artifact viewer update failed:', {
          artifactId: eventData.payload.artifactId,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  /**
   * Handle RFP created success messages
   */
  private static async handleRfpCreatedSuccess(
    eventData: any,
    currentSessionId: string | undefined,
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>,
    loadSessionArtifacts: (sessionId: string) => Promise<any>
  ): Promise<void> {
    console.log('🎯 HOME MESSAGE DEBUG: RFP_CREATED_SUCCESS received:', {
      rfpId: eventData.rfp_id,
      rfpName: eventData.rfp_name,
      sessionId: eventData.sessionId,
      timestamp: new Date().toISOString()
    });
    
    if (eventData.rfp_id) {
      try {
        await handleSetCurrentRfp(eventData.rfp_id);
        console.log('✅ HOME MESSAGE DEBUG: RFP context updated from RFP_CREATED_SUCCESS:', eventData.rfp_id);
        
        // Also refresh artifacts to ensure new form artifacts are loaded
        if (currentSessionId) {
          await loadSessionArtifacts(currentSessionId);
          console.log('✅ Artifacts refreshed after RFP creation');
        }
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Failed to update RFP context from RFP_CREATED_SUCCESS:', error);
      }
    }
  }

  /**
   * Handle refresh session context messages
   */
  private static async handleRefreshSessionContext(
    eventData: any,
    currentSessionId: string | undefined,
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>,
    loadSessionArtifacts: (sessionId: string) => Promise<any>
  ): Promise<void> {
    console.log('🎯 HOME MESSAGE DEBUG: REFRESH_SESSION_CONTEXT received:', {
      sessionId: eventData.sessionId,
      timestamp: new Date().toISOString()
    });
    
    if (eventData.sessionId && currentSessionId === eventData.sessionId) {
      try {
        // Reload session context to get updated RFP context
        const sessionWithContext = await DatabaseService.getSessionWithContext(eventData.sessionId);
        if (sessionWithContext?.current_rfp_id) {
          await handleSetCurrentRfp(String(sessionWithContext.current_rfp_id));
          console.log('✅ HOME MESSAGE DEBUG: Session context refreshed with RFP:', sessionWithContext.current_rfp_id);
        }
        
        // Also refresh artifacts to ensure they're up to date
        await loadSessionArtifacts(eventData.sessionId);
        console.log('✅ Artifacts refreshed from session context');
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Failed to refresh session context:', error);
      }
    }
  }

  /**
   * Handle artifact refresh needed messages
   */
  private static async handleArtifactRefreshNeeded(
    eventData: any,
    currentSessionId: string | undefined,
    loadSessionArtifacts: (sessionId: string) => Promise<any>
  ): Promise<void> {
    console.log('🎯 HOME MESSAGE DEBUG: ARTIFACT_REFRESH_NEEDED received:', {
      sessionId: eventData.sessionId,
      timestamp: eventData.timestamp
    });
    
    if (eventData.sessionId && currentSessionId === eventData.sessionId) {
      try {
        console.log('🔄 Refreshing artifacts after tool execution for session:', eventData.sessionId);
        await loadSessionArtifacts(eventData.sessionId);
        console.log('✅ Artifacts refreshed successfully after tool execution');
      } catch (error) {
        console.error('❌ HOME MESSAGE DEBUG: Failed to refresh artifacts after tool execution:', error);
      }
    }
  }

  /**
   * Handle legacy refresh current RFP messages
   */
  private static async handleRefreshCurrentRfp(
    eventData: any,
    currentSessionId: string | undefined,
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>,
    handleClearCurrentRfp: () => void
  ): Promise<void> {
    console.log('🎯 DEBUG: handleRfpRefreshMessage called - processing REFRESH_CURRENT_RFP');
    console.log('🔄 Received RFP refresh request from Claude function', {
      eventData,
      currentSessionId
    });
    
    // Priority 1: Use rfp_id from event data if provided
    if (eventData.rfp_id) {
      console.log('🎯 DEBUG: Setting current RFP from event data - using RFP ID:', eventData.rfp_id);
      try {
        await handleSetCurrentRfp(eventData.rfp_id);
        console.log('🎯 DEBUG: RFP context set successfully from event data');
        return;
      } catch (error) {
        console.warn('🎯 DEBUG: Failed to set RFP from event data, falling back to session:', error);
      }
    }
    
    // Priority 2: Fall back to session context reload
    if (currentSessionId) {
      const attemptSessionReload = async (retryCount = 0) => {
        try {
          console.log('🎯 DEBUG: Reloading session RFP context for session:', currentSessionId, 'attempt:', retryCount + 1);
          const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
          
          if (sessionWithContext?.current_rfp_id) {
            console.log('🎯 DEBUG: Setting current RFP from session context:', sessionWithContext.current_rfp_id);
            await handleSetCurrentRfp(String(sessionWithContext.current_rfp_id));
            console.log('🎯 DEBUG: RFP context refreshed from session successfully');
          } else if (retryCount < 3) {
            // If we have an RFP name but no session context yet, retry after delay
            if (eventData.rfp_name) {
              console.log('🎯 DEBUG: No session context yet for RFP:', eventData.rfp_name, '- retrying in 1s');
              setTimeout(() => attemptSessionReload(retryCount + 1), 1000);
            } else {
              console.log('🎯 DEBUG: No RFP context found in session after refresh - clearing RFP');
              handleClearCurrentRfp();
            }
          } else {
            console.log('🎯 DEBUG: Max retries reached - No RFP context found in session after refresh');
            console.log('🎯 DEBUG: NOT clearing RFP - the RFP may have been created successfully but session context update failed');
            
            // Try to find RFP by name as a fallback
            if (eventData.rfp_name) {
              console.log('🎯 DEBUG: Attempting to find RFP by name:', eventData.rfp_name);
              try {
                const { RFPService } = await import('./rfpService');
                const rfps: RFP[] = await RFPService.getAll();
                const matchingRfp = rfps.find((rfp: RFP) => rfp.name === eventData.rfp_name);
                if (matchingRfp) {
                  console.log('🎯 DEBUG: Found RFP by name - setting as current:', matchingRfp.id);
                  await handleSetCurrentRfp(String(matchingRfp.id));
                } else {
                  console.log('🎯 DEBUG: No RFP found with name:', eventData.rfp_name);
                }
              } catch (error) {
                console.error('🎯 DEBUG: Failed to search for RFP by name:', error);
              }
            }
          }
        } catch (error) {
          console.warn('🎯 DEBUG: Failed to refresh session RFP context (attempt', retryCount + 1, '):', error);
          if (retryCount < 3) {
            setTimeout(() => attemptSessionReload(retryCount + 1), 1000);
          }
        }
      };
      
      attemptSessionReload();
    } else {
      console.log('🎯 DEBUG: No current session to refresh RFP context for');
    }
  }

  /**
   * Trigger immediate poll for MCP browser tests
   */
  private static triggerImmediatePoll(
    currentSessionId: string | undefined,
    currentRfpId: string | undefined,
    session: any,
    handleSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>
  ): void {
    console.log('🔄 MCP UI REFRESH: Triggering immediate state poll after message event');
    setTimeout(async () => {
      if (currentSessionId && session) {
        try {
          const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
          if (sessionWithContext?.current_rfp_id && String(sessionWithContext.current_rfp_id) !== currentRfpId) {
            console.log('🔄 MCP UI REFRESH: Immediate poll found missing RFP context:', sessionWithContext.current_rfp_id);
            await handleSetCurrentRfp(String(sessionWithContext.current_rfp_id));
          }
        } catch (error) {
          console.warn('🔄 MCP UI REFRESH: Error during immediate poll:', error);
        }
      }
    }, 500);
  }
}